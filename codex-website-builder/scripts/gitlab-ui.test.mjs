import assert from 'node:assert/strict';
import {join,resolve} from 'node:path';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {chromium} from '@playwright/test';
import {loadGitLabFixture} from './gitlab-test-support.mjs';

const {fixture,testGitLabConnection}=await loadGitLabFixture(),mock=await fixture();
const client=new Client({name:'gitlab-ui-test',version:'1'});
let browser,host;
try{
  await client.connect(new StdioClientTransport({command:process.execPath,args:[resolve('dist/server/index.js')],env:{...process.env,WEBSITE_BUILDER_DATA_DIR:mock.root,WEBSITE_BUILDER_PROJECT_ROOT:mock.store.root,CODEX_THREAD_ID:'mock-thread'}}));
  assert.equal(client.getServerCapabilities().experimental['openai/settings'].readTool,'website_settings_read');
  const native=await client.callTool({name:'website_settings_read',arguments:{}});
  assert.ok(!native.isError,JSON.stringify(native));assert.ok(native.structuredContent.schema.properties.GITLAB_TOKEN);
  assert.equal(native.structuredContent.values.GITLAB_TOKEN,'unit-secret-token');assert.equal(native.structuredContent.values.PROJECT_DIR,mock.store.root);
  const update=await client.callTool({name:'website_settings_update',arguments:{set:{PROJECT_DIR:'Z:/forbidden'}}});
  assert.ok(!update.isError,JSON.stringify(update));assert.equal(update.structuredContent.values.PROJECT_DIR,mock.store.root);
  assert.equal(native.structuredContent.schema.properties.GITLAB_TOKEN.enum,undefined,'token is an input, not a select');
  assert.ok(native.structuredContent.layout.every(group=>group.items.every(item=>item.kind==='property'||item.kind==='tool'&&item.tool==='website_settings_test')),'no separate settings action');
  assert.ok(!(await client.listTools()).tools.some(tool=>tool.name==='website_open_settings'));
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
    if(params.name!=='website_control'||params.arguments.type==='panel')return client.callTool(params);
    const input=params.arguments,actor='ui:'+input.panel_id;
    try{
      let value;
      if(input.type==='settings'){if(input.action==='get')value=await mock.settings.public();else if(input.action==='test'){const config={...await mock.settings.get(),...input.values};if(!input.values?.GITLAB_TOKEN)config.GITLAB_TOKEN=(await mock.settings.get()).GITLAB_TOKEN;value=await testGitLabConnection(config,mock.io);}else value=await mock.settings.save(input.values||{});}
      else{
        const panel=mock.store.database.panelById(input.panel_id);assert.equal(panel.project_id,input.project_id);
        if(input.action==='status')value=mock.workflow.status(input.project_id);
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
    const instrument=html=>html.replace('<head>','<head><script>window.openai={requestModal:({template})=>new Promise((resolve,reject)=>{const id="modal:"+crypto.randomUUID();const listen=e=>{if(e.data?.id===id){removeEventListener("message",listen);e.data.error?reject(Error(e.data.error.message)):resolve(e.data.result);}};addEventListener("message",listen);parent.postMessage({jsonrpc:"2.0",id,method:"mock/modal",params:{template}},"*");}),requestClose:()=>parent.postMessage({method:"mock/close"},"*")}</script>');
    addEventListener('message',async event=>{
      if(event.data?.method==='mock/close'){for(const frame of document.querySelectorAll('iframe[data-modal]'))if(frame.contentWindow===event.source)frame.remove();return;}
      if(event.data?.method==='mock/modal'){try{const html=await window.readModal(event.data.params.template),frame=document.createElement('iframe');frame.id='modal';frame.dataset.modal='true';frame.style='position:fixed;inset:30px 25%;width:50%;height:calc(100vh - 60px);z-index:10;border:0;background:white;box-shadow:0 0 0 100vmax #0005';document.body.append(frame);frame.srcdoc=instrument(html);event.source.postMessage({jsonrpc:'2.0',id:event.data.id,result:{}},'*');}catch(error){event.source.postMessage({jsonrpc:'2.0',id:event.data.id,error:{message:error.message}},'*');}return;}const request=event.data;if(!request?.jsonrpc||request.id===undefined)return;
      try{let result={};if(request.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostInfo:{name:'Mock Codex',version:'1'},hostCapabilities:{serverTools:{},updateModelContext:{}},hostContext:{platform:'desktop',displayMode:'fullscreen'}};
        if(request.method==='tools/call')result=await window.serverTool(request.params);
        event.source.postMessage({jsonrpc:'2.0',id:request.id,result},'*');
      }catch(error){event.source.postMessage({jsonrpc:'2.0',id:request.id,error:{code:-32603,message:error.message}},'*');}
    });document.querySelector('#app').srcdoc=instrument(html);
  },resource.contents[0].text);
  const app=page.frameLocator('#app');await app.getByRole('button',{name:'返回主界面',exact:true}).click();
  assert.equal(await app.locator('.project-sidebar .plugin-settings-button').count(),0);
  const heading=await app.locator('.project-compose-heading').boundingBox(),settingsButton=await app.getByRole('button',{name:'插件配置',exact:true}).boundingBox(),icon=await app.locator('.plugin-settings-button svg').boundingBox();
  assert.ok(Math.abs(settingsButton.x+settingsButton.width-heading.x-heading.width)<1);assert.ok(Math.abs(settingsButton.y+settingsButton.height/2-heading.y-heading.height/2)<1);
  assert.ok(Math.abs(icon.width-icon.height)<.1);assert.ok(icon.width>=20);
  await app.getByRole('button',{name:'插件配置',exact:true}).click();
  const modal=()=>page.frameLocator('#modal');
  assert.equal(await app.getByRole('dialog').count(),0,'configuration is never embedded in the canvas');
  const config=modal().getByRole('dialog',{name:'插件配置',exact:true});
  await config.locator('input[name=PROJECT_DIR]').waitFor();await page.waitForTimeout(100);
  assert.equal(await config.locator('input[name=PROJECT_DIR]').inputValue(),mock.store.root);
  assert.ok(await config.locator('input[name=PROJECT_DIR]').isDisabled());
  assert.equal(await config.locator('input[name=GITLAB_TOKEN]').inputValue(),'unit-secret-token');
  assert.equal(await config.locator('input[name=GITLAB_TOKEN]').getAttribute('type'),'text');
  assert.ok(!(await config.innerText()).includes('unit-secret-token'));
  const formBounds=await config.locator('#plugin-settings-form').boundingBox(),testBounds=await config.locator('.settings-test-pane').boundingBox();
  assert.ok(testBounds.x>=formBounds.x+formBounds.width,'configuration and diagnostics use two columns');
  await page.screenshot({path:join(mock.root,'settings-two-columns.png')});
  const configBytes=await readFile(mock.settings.file,'utf8');
  await config.getByRole('button',{name:'测试连接',exact:true}).click();await config.getByText(/连接测试通过/).waitFor();
  assert.equal(await readFile(mock.settings.file,'utf8'),configBytes);
  mock.state.fail='tls';await config.getByRole('button',{name:'测试连接',exact:true}).click();await config.getByText('连接测试失败：TLS / 证书',{exact:true}).waitFor();
  assert.match(await config.innerText(),/TLS 连接失败.*alert 80/);mock.state.fail='';
  await config.getByRole('button',{name:'保存配置',exact:true}).click();await config.getByText('配置已保存',{exact:true}).waitFor();
  assert.equal((await mock.settings.get()).GITLAB_TOKEN,'unit-secret-token');
  await config.getByRole('button',{name:'关闭',exact:true}).click();
  await app.locator(`[data-project-id="${mock.view.project.id}"] .project-open`).click();
  await app.getByRole('button',{name:'部署网站',exact:true}).click();
  assert.equal(await app.getByRole('dialog').count(),0,'deployment has an independent host iframe');
  let dialog=modal().getByRole('dialog');await dialog.getByLabel('真实官网域名').fill('www.example.com');
  assert.ok(await dialog.getByRole('button',{name:'检查连接与版本'}).isDisabled());
  await dialog.getByRole('radio',{name:/正式环境/}).check();await dialog.getByRole('button',{name:'检查连接与版本'}).click();
  await dialog.getByRole('button',{name:'确认创建仓库'}).waitFor();
  assert.ok(!(await dialog.innerText()).match(/(?:test|release)-/));
  await page.waitForTimeout(650);assert.equal(mock.state.tags.size,0);assert.equal(await app.locator('.canvas-world').getAttribute('inert'),'');
  const denied=await client.callTool({name:'website_write',arguments:{thread_id:'mock-thread',project_id:mock.view.project.id,files:[{path:'index.html',content:'bad'}]}});assert.ok(denied.isError);assert.match(denied.content[0].text,/禁止修改/);
  await dialog.getByRole('button',{name:'确认创建仓库'}).click();await dialog.getByRole('button',{name:'确认发布到正式环境'}).waitFor();
  assert.equal(mock.state.tags.size,0,'creating a repository never implicitly approves publishing');
  await page.screenshot({path:join(mock.root,'confirm-publish.png')});
  await dialog.getByRole('button',{name:'确认发布到正式环境'}).click();await dialog.getByRole('status').filter({hasText:'发布标签已创建'}).waitFor();
  assert.equal(mock.state.tags.size,1);assert.equal(mock.workflow.status(mock.view.project.id).locked,false);
  await dialog.getByRole('button',{name:'关闭',exact:true}).click();await app.locator('.deployment-cover').waitFor({state:'hidden'});
  await app.getByRole('button',{name:'部署网站',exact:true}).click();dialog=modal().getByRole('dialog');
  assert.ok(await dialog.getByRole('button',{name:'检查连接与版本'}).isDisabled(),'each deployment asks for environment again');
  await dialog.getByRole('radio',{name:/测试环境/}).check();await dialog.getByRole('button',{name:'检查连接与版本'}).click();
  await dialog.getByRole('button',{name:'确认发布到测试环境'}).waitFor();await dialog.getByRole('button',{name:'取消',exact:true}).click();
  await dialog.waitFor({state:'hidden'});await app.locator('.deployment-cover').waitFor({state:'hidden'});
  assert.equal(mock.state.tags.size,1);assert.equal(mock.workflow.status(mock.view.project.id).locked,false);
  await app.getByRole('button',{name:'部署网站',exact:true}).click();dialog=modal().getByRole('dialog');
  let entered,release;const reached=new Promise(resolve=>entered=resolve),blocked=new Promise(resolve=>release=resolve),probe=mock.io.probe;
  mock.io.probe=async(...args)=>{entered();await blocked;return probe(...args);};
  await dialog.getByRole('radio',{name:/测试环境/}).check();await dialog.getByRole('button',{name:'检查连接与版本'}).click();await reached;
  await dialog.getByRole('button',{name:'取消任务',exact:true}).click();release();
  await dialog.getByRole('status').filter({hasText:'发布任务已取消'}).waitFor();
  await dialog.getByRole('button',{name:'关闭',exact:true}).click();await page.locator('#modal').waitFor({state:'detached'});
  assert.equal(mock.state.tags.size,1);assert.equal(mock.workflow.status(mock.view.project.id).locked,false);
  await app.locator('body').evaluate(()=>{window.openai=undefined;});
  await app.getByRole('button',{name:'部署网站',exact:true}).click();
  let internal=app.getByRole('dialog',{name:'确认发布',exact:true});await internal.waitFor();assert.equal(await page.locator('#modal').count(),0);
  await internal.getByRole('button',{name:'插件配置',exact:true}).click();const internalSettings=app.getByRole('dialog',{name:'插件配置',exact:true});
  await internalSettings.locator('input[name=GITLAB_TOKEN]').waitFor();await internalSettings.getByRole('button',{name:'关闭',exact:true}).click();
  await internal.getByRole('button',{name:'关闭部署窗口',exact:true}).click();await internal.waitFor({state:'hidden'});
  await app.locator('body').evaluate(()=>{window.openai={requestModal:async()=>{throw Error('Not supported');}};});
  await app.getByRole('button',{name:'部署网站',exact:true}).click();internal=app.getByRole('dialog',{name:'确认发布',exact:true});await internal.waitFor();
  await internal.getByRole('button',{name:'关闭部署窗口',exact:true}).click();await internal.waitFor({state:'hidden'});
  await app.getByRole('button',{name:'返回主界面',exact:true}).click();await app.getByRole('button',{name:'插件配置',exact:true}).click();
  await app.getByRole('dialog',{name:'插件配置',exact:true}).waitFor();await app.getByRole('dialog',{name:'插件配置',exact:true}).getByRole('button',{name:'关闭',exact:true}).click();
  assert.deepEqual(network,[]);assert.ok((await readFile(mock.settings.file,'utf8')).includes('unit-secret-token'));
  console.log('PASS: MOCK-ONLY settings heading alignment/square icon/two-column panel/plaintext Token echo/legacy compatibility/read-only PROJECT_DIR, deploy toolbar, domain/environment modal, separate create/publish consent, cross-process write lock, pipeline trigger result and cancellation/unlock; no GitLab network traffic');
  console.log(`Confirmation screenshot: ${join(mock.root,'confirm-publish.png')}`);
}finally{if(browser)await browser.close();if(host)await new Promise(resolve=>host.close(resolve));await client.close();mock.store.database.sql.close();}
