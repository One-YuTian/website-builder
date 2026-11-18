import assert from 'node:assert/strict';
import {join,resolve} from 'node:path';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {ElicitRequestSchema} from '@modelcontextprotocol/sdk/types.js';
import {chromium} from '@playwright/test';
import {loadGitLabFixture} from './gitlab-test-support.mjs';

const {fixture,testGitLabConnection}=await loadGitLabFixture(),mock=await fixture();
const client=new Client({name:'gitlab-ui-test',version:'1'},{capabilities:{elicitation:{form:{}}}});
const nativeDialogs=[],nativeAnswers=[];
client.setRequestHandler(ElicitRequestSchema,async request=>{nativeDialogs.push(request.params);return nativeAnswers.shift()||{action:'cancel'};});
let browser,host;
try{
  await client.connect(new StdioClientTransport({command:process.execPath,args:[resolve('dist/server/index.js')],env:{...process.env,WEBSITE_BUILDER_DATA_DIR:mock.root,WEBSITE_BUILDER_PROJECT_ROOT:mock.store.root,CODEX_THREAD_ID:'mock-thread'}}));
  assert.equal(client.getServerCapabilities().experimental['openai/settings'].readTool,'website_settings_read');
  const native=await client.callTool({name:'website_settings_read',arguments:{}});
  assert.ok(!native.isError,JSON.stringify(native));assert.ok(native.structuredContent.schema.properties.GITLAB_TOKEN);
  assert.equal(native.structuredContent.schema.properties.PROJECT_DIR,undefined,'PROJECT_DIR is removed from native settings');
  assert.equal(native.structuredContent.layout[0].title,'预览环境配置');assert.equal(native.structuredContent.layout[1].title,'线上部署配置');
  assert.equal(native.structuredContent.values.GITLAB_TOKEN,'unit-secret-token');assert.equal(native.structuredContent.values.R2_BUCKET_NAME,'website');
  const update=await client.callTool({name:'website_settings_update',arguments:{set:{R2_BUCKET_NAME:'other',GITLAB_DEFAULT_BRANCH:'main'}}});
  assert.ok(!update.isError,JSON.stringify(update));assert.equal(update.structuredContent.values.R2_BUCKET_NAME,'website');
  assert.equal(native.structuredContent.schema.properties.GITLAB_TOKEN.enum,undefined,'token is an input, not a select');
  assert.ok(native.structuredContent.layout.every(group=>group.items.every(item=>item.kind==='property'||item.kind==='tool'&&item.tool==='website_settings_test')),'no separate settings action');
  assert.ok(!(await client.listTools()).tools.some(tool=>tool.name==='website_open_settings'));
  const nativeTest=await client.callTool({name:'website_settings_test',arguments:{}});
  assert.match(nativeTest.content[0].text,/测试连接失败/);
  const afterTest=await client.callTool({name:'website_settings_read',arguments:{}});
  const testToolItem=afterTest.structuredContent.layout[1].items.find(item=>item.kind==='tool'&&item.tool==='website_settings_test');
  assert.match(testToolItem.description,/测试连接失败/);
  for(const token of ['replacement-secret','', 'unit-secret-token']){
    const response=await client.callTool({name:'website_settings_update',arguments:{set:{GITLAB_TOKEN:token}}});
    assert.ok(!response.isError,JSON.stringify(response));assert.equal(response.structuredContent.values.GITLAB_TOKEN,token);
    assert.equal((await mock.settings.get()).GITLAB_TOKEN,token);
  }
  const resource=await client.readResource({uri:'ui://codex-website-builder/canvas'});
  host=createServer((_request,response)=>response.end('<!doctype html><style>html,body{margin:0}iframe{width:100vw;height:100vh;border:0;display:block}</style><iframe id="app"></iframe>'));
  await new Promise(resolve=>host.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:960}}),network=[];
  page.on('request',request=>{if(request.url().includes('gitlab.invalid'))network.push(request.url());});
  await page.exposeFunction('serverTool',async params=>{
    if(params.name!=='website_control'||params.arguments.type==='panel'||params.arguments.type==='settings'&&params.arguments.action==='open')return client.callTool(params);
    const input=params.arguments,actor='ui:'+input.panel_id;
    try{
      let value;
      if(input.type==='r2'){value={locked:false};}
      else if(input.type==='settings'){if(input.action==='get')value={...await mock.settings.public(),R2_ACCOUNT_ID:'0'.repeat(32),R2_BUCKET_NAME:'website',R2_ACCESS_KEY_ID:'••••••••',R2_SECRET_ACCESS_KEY:'••••••••',R2_DEPLOY_HOST:'1437257.xyz'};else if(input.action==='test'){const config={...await mock.settings.get(),...input.values};if(!input.values?.GITLAB_TOKEN)config.GITLAB_TOKEN=(await mock.settings.get()).GITLAB_TOKEN;value=await testGitLabConnection(config,mock.io);}else value=await mock.settings.save(input.values||{});}
      else{
        const panel=mock.store.database.panelById(input.panel_id);assert.equal(panel.project_id,input.project_id);
        if(input.action==='status')value=mock.workflow.status(input.project_id);
        else if(input.action==='domain')value=await mock.workflow.updateDomain(input.project_id,input.domain||'');
        else if(input.action==='prepare')value=await mock.workflow.prepare({project_id:input.project_id,actor,intent:'deploy',domain:input.domain,environment:input.environment});
        else if(input.action==='execute')value=await mock.workflow.execute(input.confirmation_id,actor,input.decision,'deploy',input.project_id);
        else if(input.action==='cancel')value=mock.workflow.cancel(input.project_id,actor,input.confirmation_id);
      }
      return {content:[],_meta:{control:value}};
    }catch(error){return {isError:true,content:[{type:'text',text:error.message}]};}
  });
  await page.exposeFunction('readModal',async uri=>(await client.readResource({uri})).contents[0].text);
  await page.goto(`http://127.0.0.1:${host.address().port}`);
  await page.evaluate(html=>{
    window.modalRequests=[];window.calls=[];
    const instrument=(html,input)=>html.replace('<head>','<head><script>window.openai={requestModal:request=>new Promise((resolve,reject)=>{const id="modal:"+crypto.randomUUID();const listen=e=>{if(e.data?.id===id){removeEventListener("message",listen);e.data.error?reject(Error(e.data.error.message)):resolve(e.data.result);}};addEventListener("message",listen);parent.postMessage({jsonrpc:"2.0",id,method:"mock/modal",params:request},"*");}),toolInput:{thread_id:"mock-thread"},view:'+JSON.stringify({mode:input===undefined?'fullscreen':'modal',params:input})+',requestClose:()=>parent.postMessage({method:"mock/close"},"*")};addEventListener("message",e=>{if(e.data?.method==="mock/view")dispatchEvent(new CustomEvent("openai:set_globals",{detail:{globals:e.data.params}}))})</script>');
    addEventListener('message',async event=>{
      if(event.data?.method==='mock/close'){for(const frame of document.querySelectorAll('iframe[data-modal]'))if(frame.contentWindow===event.source)frame.remove();return;}
      if(event.data?.method==='mock/modal'){try{if(typeof event.data.params.title!=='string'||!event.data.params.title.trim())throw Error('Modal title must be a nonempty string');if(event.data.params.template&&event.data.params.template!=='ui://codex-website-builder/canvas')throw Error('This widget can only open its own resource in a modal');window.modalRequests.push(event.data.params);const html=await window.readModal(event.data.params.template||'ui://codex-website-builder/canvas'),frame=document.createElement('iframe');frame.id=event.source===document.querySelector('#app').contentWindow?'modal':'modal-child';frame.dataset.modal='true';frame.style='position:fixed;inset:30px 25%;width:50%;height:calc(100vh - 60px);z-index:10;border:0;background:white;box-shadow:0 0 0 100vmax #0005';document.body.append(frame);frame.dataset.input=JSON.stringify(event.data.params.params);frame.dataset.defer=String(!!window.deferModalInput);frame.dataset.delivery=window.modalDelivery||'mcp';frame.srcdoc=instrument(html,window.deferModalInput?{}:event.data.params.params);event.source.postMessage({jsonrpc:'2.0',id:event.data.id,result:{}},'*');}catch(error){event.source.postMessage({jsonrpc:'2.0',id:event.data.id,error:{message:error.message}},'*');}return;}const request=event.data;if(!request?.jsonrpc||request.id===undefined)return;
      try{let result={};if(request.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostInfo:{name:'Mock Codex',version:'1'},hostCapabilities:{serverTools:{},updateModelContext:{}},hostContext:{platform:'desktop',displayMode:'fullscreen'}};
        if(request.method==='tools/call'){window.calls.push(request.params);result=await window.serverTool(request.params);}
        event.source.postMessage({jsonrpc:'2.0',id:request.id,result},'*');if(request.method==='ui/initialize'){const modalFrame=[...document.querySelectorAll('iframe[data-modal]')].find(frame=>frame.contentWindow===event.source);if(modalFrame?.dataset.defer==='true')setTimeout(()=>event.source.postMessage(modalFrame.dataset.delivery==='globals'?{method:'mock/view',params:{view:{mode:'modal',params:JSON.parse(modalFrame.dataset.input)}}}:{jsonrpc:'2.0',method:'ui/notifications/tool-input',params:{arguments:JSON.parse(modalFrame.dataset.input)}},'*'),100);}
      }catch(error){event.source.postMessage({jsonrpc:'2.0',id:request.id,error:{code:-32603,message:error.message}},'*');}
    });document.querySelector('#app').srcdoc=instrument(html);
  },resource.contents[0].text);
  const app=page.frameLocator('#app');await app.getByRole('button',{name:'返回主界面',exact:true}).click();
  assert.equal(await app.locator('.project-sidebar .plugin-settings-button').count(),0);
  const heading=await app.locator('.project-compose-heading').boundingBox(),settingsButton=await app.getByRole('button',{name:'插件配置',exact:true}).boundingBox(),icon=await app.locator('.plugin-settings-button svg').boundingBox();
  assert.ok(Math.abs(settingsButton.x+settingsButton.width-heading.x-heading.width)<1);assert.ok(Math.abs(settingsButton.y+settingsButton.height/2-heading.y-heading.height/2)<1);
  assert.ok(Math.abs(icon.width-icon.height)<.1);assert.ok(icon.width>=20);
  const title=await app.locator('.project-compose-heading h2').boundingBox();
  assert.ok(Math.abs(icon.y+icon.height/2-title.y-title.height/2)<1,'gear and left title are vertically centered');
  assert.equal(await app.locator('.plugin-settings-button').evaluate(el=>getComputedStyle(el).borderRadius),'50%');
  assert.equal(await app.locator('.plugin-settings-button svg polygon').count(),1,'settings uses a circular gear outline');
  await app.getByRole('button',{name:'插件配置',exact:true}).click();
  const modal=()=>page.frameLocator('#modal');
  const closeModal=async(id='modal')=>{await page.evaluate(id=>document.getElementById(id).contentWindow.openai.requestClose(),id);await page.locator('#'+id).waitFor({state:'detached'});};
  assert.equal(await app.getByRole('dialog').count(),0,'configuration is never embedded in the canvas');
  const config=modal().getByRole('dialog',{name:'插件配置',exact:true});
  await config.locator('input[name=GITLAB_HOST]').waitFor();await page.waitForTimeout(100);
  assert.deepEqual(await page.evaluate(()=>window.modalRequests[0]),{title:'插件配置',params:{view:'settings'}},'requestModal reuses its own resource by omitting template');
  assert.equal(await page.evaluate(()=>window.calls.filter(call=>call.name==='website_control'&&call.arguments.type==='panel').length),0,'settings opens directly without an asynchronous template allocation call');
  assert.deepEqual(await modal().locator('body').evaluate(()=>window.openai.view),{mode:'modal',params:{view:'settings'}});
  assert.deepEqual(await modal().locator('body').evaluate(()=>window.openai.toolInput),{thread_id:'mock-thread'},'original tool input must not override modal view params');
  assert.equal(await modal().locator('.project-home').count(),0);
  assert.equal(await config.locator('input[name=PROJECT_DIR]').count(),0,'PROJECT_DIR removed');
  assert.equal(await config.locator('input[name=R2_BUCKET_NAME]').inputValue(),'website');
  assert.ok(await config.locator('input[name=R2_BUCKET_NAME]').isDisabled());
  assert.equal(await config.locator('input[name=GITLAB_TOKEN]').inputValue(),'unit-secret-token');
  assert.equal(await config.locator('input[name=GITLAB_TOKEN]').getAttribute('type'),'text');
  assert.equal(await config.getByRole('button',{name:/关闭/}).count(),0,'host provides the close control');
  assert.equal(await config.locator('.settings-test-steps').count(),0,'no step-by-step hints');
  assert.equal(await modal().locator('.plugin-modal-overlay').count(),0);
  const chrome=await config.evaluate(el=>{const css=getComputedStyle(el);return {padTop:parseFloat(css.paddingTop),border:css.borderTopWidth,radius:css.borderRadius,shadow:css.boxShadow};});
  assert.ok(chrome.padTop>=14,'modal content keeps adaptive padding');
  assert.deepEqual({border:chrome.border,radius:chrome.radius,shadow:chrome.shadow},{border:'0px',radius:'0px',shadow:'none'},'modal content has no borders or shadows');
  assert.ok(!(await config.innerText()).includes('unit-secret-token'));
  assert.equal(await config.locator('.settings-test-pane').count(),0,'no right-side test pane');
  const overflow=await config.locator('.settings-main').evaluate(el=>({v:el.scrollHeight>el.clientHeight,h:el.scrollWidth>el.clientWidth}));
  assert.deepEqual(overflow,{v:false,h:false},'settings modal fits within one screen without scrollbars');
  await page.screenshot({path:join(mock.root,'settings-two-columns.png')});
  const configBytes=await readFile(mock.settings.file,'utf8');
  await config.getByRole('button',{name:'测试连接',exact:true}).click();await config.getByText('测试连接成功',{exact:true}).waitFor();
  assert.equal(await readFile(mock.settings.file,'utf8'),configBytes);
  mock.state.fail='tls';await config.getByRole('button',{name:'测试连接',exact:true}).click();await config.getByText('测试连接失败：TLS / 证书',{exact:true}).waitFor();
  assert.match(await config.innerText(),/TLS 连接失败.*alert 80/);mock.state.fail='';
  await config.getByRole('button',{name:'保存配置',exact:true}).click();
  await page.locator('#modal').waitFor({state:'detached'});
  assert.equal((await mock.settings.get()).GITLAB_TOKEN,'unit-secret-token');
  await page.evaluate(()=>window.deferModalInput=true);
  await app.getByRole('button',{name:'插件配置',exact:true}).click();
  const delayedSettings=modal().getByRole('dialog',{name:'插件配置',exact:true});
  await delayedSettings.locator('input[name=GITLAB_HOST]').waitFor();
  assert.deepEqual(await modal().locator('body').evaluate(()=>window.openai.view.params),{});
  assert.equal(await modal().locator('.project-home').count(),0,'deferred MCP params route the reused resource to settings');
  await closeModal();await page.locator('#modal').waitFor({state:'detached'});
  await page.evaluate(()=>window.modalDelivery='globals');
  await app.getByRole('button',{name:'插件配置',exact:true}).click();
  await modal().getByRole('dialog',{name:'插件配置',exact:true}).locator('input[name=GITLAB_HOST]').waitFor();
  assert.equal(await modal().locator('.project-home').count(),0,'late view params in set_globals events route to settings');
  await closeModal();await page.locator('#modal').waitFor({state:'detached'});
  await page.evaluate(()=>window.deferModalInput=false);
  await app.locator(`[data-project-id="${mock.view.project.id}"] .project-open`).click();
  await app.getByRole('button',{name:'部署网站',exact:true}).click();
  await app.getByRole('dialog',{name:'部署网站',exact:true}).getByRole('button',{name:/部署到线上/}).click();
  assert.equal(await page.locator('iframe').count(),1,'GitLab deployment runs inline inside the popup without opening a host modal');
  let dialog=app.getByRole('dialog');
  assert.ok(await dialog.getByRole('radio',{name:/测试环境/}).isChecked(),'defaults to test environment');
  assert.equal(await dialog.getByLabel('部署域名').getAttribute('placeholder'),null,'no default placeholder');
  await dialog.getByLabel('部署域名').fill('www.example.com');
  await dialog.getByLabel('部署域名').blur();
  await page.waitForTimeout(100);
  assert.equal(mock.store.database.project(mock.view.project.id).domain,'www.example.com','manual domain edit updates project database');
  assert.ok(await dialog.getByRole('button',{name:'开始检查并发布'}).isEnabled());
  await dialog.getByRole('radio',{name:/正式环境/}).check();await dialog.getByRole('button',{name:'开始检查并发布'}).click();
  await dialog.getByRole('list',{name:'发布时间轴'}).waitFor();
  await dialog.getByRole('button',{name:'确认创建仓库'}).waitFor();
  assert.ok(!(await dialog.innerText()).match(/(?:test|release)-/));
  await page.waitForTimeout(650);assert.equal(mock.state.tags.size,0);assert.equal(await app.locator('.canvas-world').getAttribute('inert'),'');
  const denied=await client.callTool({name:'website_write',arguments:{thread_id:'mock-thread',project_id:mock.view.project.id,files:[{path:'index.html',content:'bad'}]}});assert.ok(denied.isError);assert.match(denied.content[0].text,/禁止修改/);
  await dialog.getByRole('button',{name:'确认创建仓库'}).click();await dialog.getByRole('button',{name:'确认发布到正式环境'}).waitFor();
  assert.equal(mock.state.tags.size,0,'creating a repository never implicitly approves publishing');
  await page.screenshot({path:join(mock.root,'confirm-publish.png')});
  await dialog.getByRole('button',{name:'确认发布到正式环境'}).click();await dialog.getByRole('status').filter({hasText:'发布标签已创建'}).waitFor();
  assert.equal(mock.state.tags.size,1);assert.equal(mock.workflow.status(mock.view.project.id).locked,false);
  await dialog.getByRole('button',{name:'完成',exact:true}).click();await app.locator('.deployment-cover').waitFor({state:'hidden'});
  await app.getByRole('button',{name:'部署网站',exact:true}).click();
  await app.getByRole('dialog',{name:'部署网站',exact:true}).getByRole('button',{name:/部署到线上/}).click();
  dialog=app.getByRole('dialog');
  assert.equal(await dialog.getByLabel('部署域名').inputValue(),'www.example.com','auto-pulls bound domain');
  assert.ok(await dialog.getByRole('radio',{name:/正式环境/}).isChecked(),'remembers last selected environment');
  await dialog.getByRole('radio',{name:/测试环境/}).check();await dialog.getByRole('button',{name:'开始检查并发布'}).click();
  await dialog.getByRole('button',{name:'确认发布到测试环境'}).waitFor();await dialog.getByRole('button',{name:'取消发布',exact:true}).click();
  await dialog.waitFor({state:'hidden'});await app.locator('.deployment-cover').waitFor({state:'hidden'});
  assert.equal(mock.state.tags.size,1);assert.equal(mock.workflow.status(mock.view.project.id).locked,false);
  await app.getByRole('button',{name:'部署网站',exact:true}).click();
  await app.getByRole('dialog',{name:'部署网站',exact:true}).getByRole('button',{name:/部署到线上/}).click();
  dialog=app.getByRole('dialog');
  let entered,release;const reached=new Promise(resolve=>entered=resolve),blocked=new Promise(resolve=>release=resolve),probe=mock.io.probe;
  mock.io.probe=async(...args)=>{entered();await blocked;return probe(...args);};
  await dialog.getByRole('radio',{name:/测试环境/}).check();await dialog.getByRole('button',{name:'开始检查并发布'}).click();await reached;
  await dialog.getByRole('button',{name:'取消发布',exact:true}).click();release();
  await dialog.getByRole('status').filter({hasText:'发布任务已取消'}).waitFor();
  await dialog.getByRole('button',{name:'完成',exact:true}).click();await dialog.waitFor({state:'hidden'});
  assert.equal(mock.state.tags.size,1);assert.equal(mock.workflow.status(mock.view.project.id).locked,false);
  await app.getByRole('button',{name:'返回主界面',exact:true}).click();
  await app.locator('body').evaluate(()=>{window.openai={requestModal:async()=>{throw Error('Not supported');}};});
  await app.getByRole('button',{name:'插件配置',exact:true}).click();
  await app.getByRole('alert').filter({hasText:'Not supported'}).waitFor();
  assert.equal(nativeDialogs.length,0,'a UI modal failure must not open an MCP elicitation form');
  assert.equal(await app.getByRole('dialog',{name:'插件配置',exact:true}).count(),0,'never fall back to a canvas settings dialog');
  await app.locator('body').evaluate(()=>{window.openai=undefined;});
  await app.getByRole('button',{name:'插件配置',exact:true}).click();
  await app.getByRole('alert').filter({hasText:'未提供 window.openai.requestModal'}).waitFor();
  assert.equal(nativeDialogs.length,0);
  assert.deepEqual(network,[]);assert.ok((await readFile(mock.settings.file,'utf8')).includes('unit-secret-token'));
  console.log('PASS: MOCK-ONLY settings heading alignment/square icon/two-column panel (preview + online)/plaintext Token echo/no PROJECT_DIR/direct connection test result, deploy selector popup, inline GitLab deployment, domain/environment form, separate create/publish consent, cross-process write lock, pipeline trigger result and cancellation/unlock; no GitLab network traffic');
  console.log(`Confirmation screenshot: ${join(mock.root,'confirm-publish.png')}`);
}finally{if(browser)await browser.close();if(host)await new Promise(resolve=>host.close(resolve));await client.close();mock.store.database.sql.close();}
