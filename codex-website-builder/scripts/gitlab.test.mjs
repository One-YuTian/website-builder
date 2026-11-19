import assert from 'node:assert/strict';
import {readFile,writeFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {createServer as createTCPServer} from 'node:net';
import {randomBytes,createCipheriv} from 'node:crypto';
import {loadGitLabFixture} from './gitlab-test-support.mjs';
const {fixture,registerGitLabTools,nodeGitLabIO,gitlabHost,testGitLabConnection,registerNativeSettings}=await loadGitLabFixture();
const context=await fixture(),{workflow,state,input,store,settings,view}=context;
const tags=()=>state.calls.filter(c=>c.method==='POST'&&c.path.includes('/repository/tags')).length;
try{
  assert.equal(gitlabHost('10.0.0.8:8080'),'http://10.0.0.8:8080');
  assert.equal(gitlabHost('gitlab.internal'),'http://gitlab.internal');
  assert.equal(gitlabHost('https://gitlab.internal'),'https://gitlab.internal');
  const diagnostic=await fixture(),diagnosticSettings=await diagnostic.settings.get();
  const configBefore=await readFile(diagnostic.settings.file,'utf8');
  const httpReport=await testGitLabConnection({...diagnosticSettings,GITLAB_HOST:'gitlab.invalid'},diagnostic.io);
  assert.equal(httpReport.success,true);assert.equal(httpReport.checks[2].status,'skipped');assert.ok(!diagnostic.state.calls.some(call=>call.method==='TLS'));
  for(const fail of ['','vpn','tls','token','user','group','deploy-repo','deploy-branch']){
    diagnostic.state.fail=fail;diagnostic.state.calls.length=0;
    const report=await testGitLabConnection(diagnosticSettings,diagnostic.io);
    assert.equal(report.success,fail==='');assert.ok(!JSON.stringify(report).includes('unit-secret-token'));
    assert.ok(diagnostic.state.calls.every(call=>['GET','PROBE','TLS'].includes(call.method)));
    if(fail==='tls'){assert.match(report.checks[2].detail,/TLS 连接失败.*alert 80/);assert.ok(!diagnostic.state.calls.some(call=>call.path==='/user'));}
    assert.equal(await readFile(diagnostic.settings.file,'utf8'),configBefore);
  }
  diagnostic.store.database.sql.close();
  const legacy=JSON.parse(await readFile(settings.file,'utf8')),legacyKey=randomBytes(32),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',legacyKey,iv);
  const encrypted=Buffer.concat([cipher.update('unit-secret-token'),cipher.final()]);legacy.token={iv:iv.toString('hex'),tag:cipher.getAuthTag().toString('hex'),value:encrypted.toString('hex')};delete legacy.GITLAB_TOKEN;
  await writeFile(join(settings.root,'config/secret.key'),legacyKey);await writeFile(settings.file,JSON.stringify(legacy));
  assert.equal((await settings.public(true)).GITLAB_TOKEN,'unit-secret-token');assert.ok(JSON.parse(await readFile(settings.file,'utf8')).token,'read-only settings read preserves legacy file');
  let publicSettings=await settings.public();assert.equal(publicSettings.PROJECT_DIR,store.root);assert.equal(publicSettings.GITLAB_TOKEN,'unit-secret-token');
  assert.equal(JSON.parse(await readFile(settings.file,'utf8')).token,undefined,'legacy ciphertext migrates on normal read');
  const saved=await readFile(settings.file,'utf8');assert.ok(saved.includes('unit-secret-token'));
  const modified=JSON.parse(saved);modified.PROJECT_DIR='Z:/wrong';await writeFile(settings.file,JSON.stringify(modified));
  assert.equal((await settings.get()).PROJECT_DIR,store.root);assert.equal(JSON.parse(await readFile(settings.file,'utf8')).PROJECT_DIR,store.root);
  for(const fail of ['vpn','token','user','group','deploy-repo','deploy-branch']){state.fail=fail;await assert.rejects(workflow.prepare(input));assert.equal(tags(),0);assert.equal(workflow.status(view.project.id).locked,false);}
  state.fail='';await assert.rejects(workflow.prepare({...input,domain:'example.com'}));
  let plan=await workflow.prepare(input);assert.equal(plan.challenge.kind,'create');assert.equal(tags(),0);
  await assert.rejects(store.begin('mock-thread',['index.html']),/禁止修改/);
  await assert.rejects(store.write('mock-thread',[{path:'index.html',content:'bad'}]),/禁止修改/);
  const first=plan.challenge.id;await assert.rejects(workflow.execute(first,'other','confirm'));
  plan=await workflow.execute(first,input.actor,'confirm','deploy',view.project.id);assert.equal(plan.challenge.kind,'publish');assert.equal(tags(),0,'creation consent is not publication consent');
  await assert.rejects(workflow.execute(first,input.actor,'confirm'));
  let result=await workflow.execute(plan.challenge.id,input.actor,'confirm','deploy',view.project.id);
  assert.equal(result.tag,'release-2611061500');assert.equal(result.domain,'www.example.com');assert.equal(tags(),1);assert.equal(state.pushes,1);
  assert.deepEqual(state.calls.find(c=>c.method==='POST'&&c.path.includes('/repository/tags')).body,{tag_name:'release-2611061500',ref:'a'.repeat(40),message:'www.example.com'});
  assert.equal(workflow.status(view.project.id).locked,false);
  const creations=state.calls.filter(c=>c.method==='POST'&&c.path==='/projects').length;
  plan=await workflow.prepare({...input,environment:'test'});assert.equal(plan.challenge.kind,'publish');
  result=await workflow.execute(plan.challenge.id,input.actor,'confirm');assert.equal(result.tag,'test-2611061500');assert.equal(state.calls.filter(c=>c.method==='POST'&&c.path==='/projects').length,creations,'repeat deployment does not recreate repository');
  plan=await workflow.prepare(input);await assert.rejects(workflow.execute(plan.challenge.id,input.actor,'confirm'),/标签已存在/);assert.equal(tags(),2);
  state.clock=new Date('2026-11-06T07:01:00Z');
  plan=await workflow.prepare(input);await writeFile(join(view.directory,'index.html'),'<!doctype html><html><body>External edit</body></html>');
  await assert.rejects(workflow.execute(plan.challenge.id,input.actor,'confirm'),/版本已经变化/);assert.equal(tags(),2);assert.equal(workflow.status(view.project.id).locked,false);
  plan=await workflow.prepare(input);await settings.save({GITLAB_DEFAULT_BRANCH:'other'});await assert.rejects(workflow.execute(plan.challenge.id,input.actor,'confirm'));assert.equal(tags(),2);await settings.save({GITLAB_DEFAULT_BRANCH:'main'});
  plan=await workflow.prepare(input);workflow.cancel(view.project.id,input.actor,plan.challenge.id);await assert.rejects(workflow.execute(plan.challenge.id,input.actor,'confirm'));assert.equal(tags(),2);
  for(const mode of ['race','rejected']){
    const conflict=await fixture();let p=await conflict.workflow.prepare(conflict.input);p=await conflict.workflow.execute(p.challenge.id,conflict.input.actor,'confirm');
    conflict.state.race=mode==='race';conflict.state.failPush=mode==='rejected';
    await assert.rejects(conflict.workflow.execute(p.challenge.id,conflict.input.actor,'confirm'),/GIT_CONFIRMATION_REQUIRED/);
    assert.equal(conflict.state.tags.size,0);assert.equal(conflict.workflow.status(conflict.view.project.id).locked,false);conflict.store.database.sql.close();
  }
  const ignored=await fixture();await writeFile(join(ignored.view.projectDirectory,'.gitignore'),'src/\n');
  let ignoredPlan=await ignored.workflow.prepare(ignored.input);ignoredPlan=await ignored.workflow.execute(ignoredPlan.challenge.id,ignored.input.actor,'confirm');
  await assert.rejects(ignored.workflow.execute(ignoredPlan.challenge.id,ignored.input.actor,'confirm'),/未被Git跟踪/);assert.equal(ignored.state.tags.size,0);ignored.store.database.sql.close();
  // Incomplete projects are rejected before accessing GitLab.
  const incomplete=await fixture();incomplete.store.database.activity(incomplete.view.project.id,'project:build',true);
  await assert.rejects(incomplete.workflow.prepare(incomplete.input),/项目尚未完成/);
  assert.equal(incomplete.state.calls.length,0);incomplete.store.database.sql.close();
  // Conflicting or unrelated remote history defaults to local-wins force push with secondary confirmation.
  const local=await fixture();await local.remote();
  const choice=await local.workflow.prepare({...local.input,intent:'bind'});
  assert.deepEqual(choice.challenge.choices,['confirm']);
  assert.equal(choice.challenge.force_overwrite,true);
  const before=await readFile(join(local.view.directory,'index.html'),'utf8');
  await local.workflow.execute(choice.challenge.id,local.input.actor,'confirm');
  assert.equal(await readFile(join(local.view.directory,'index.html'),'utf8'),before);
  const forcePlan=await local.workflow.prepare(local.input);
  assert.equal(forcePlan.status,'confirmation_required');
  assert.equal(forcePlan.challenge.force_overwrite,true);
  assert.equal(local.state.calls.filter(c=>c.method==='POST'&&c.path.includes('/tags')).length,0);
  const forced=await local.workflow.execute(forcePlan.challenge.id,local.input.actor,'confirm');
  assert.equal(forced.status,'deployment_triggered');
  assert.equal(local.state.pushes,1);
  assert.equal(local.state.forcePushes,0,'overwrite uses fast-forward commit so protected main accepts it');
  local.store.database.sql.close();
  const {McpServer}=await import('@modelcontextprotocol/sdk/server/mcp.js');
  // Cancellation remains available during checks, repository work and pushes;
  // only dispatching the tag request crosses the irreversible boundary.
  for(const phase of ['checking','creating','pushing','tagging']){
    const cancel=await fixture();let entered,release;
    const reached=new Promise(resolve=>entered=resolve),blocked=new Promise(resolve=>release=resolve);
    const api=cancel.io.api;
    if(phase!=='pushing')cancel.io.api=async(...args)=>{const [,method,path]=args;
      if(phase==='checking'&&path==='/user'||phase==='creating'&&method==='POST'&&path==='/projects'||phase==='tagging'&&method==='POST'&&path.endsWith('/repository/tags')){entered();await blocked;}
      return api(...args);
    };
    let pending,request;
    if(phase==='checking')pending=cancel.workflow.prepare(cancel.input);
    else {
      request=await cancel.workflow.prepare(cancel.input);
      if(phase!=='creating')request=await cancel.workflow.execute(request.challenge.id,cancel.input.actor,'confirm');
      if(phase==='pushing'){const push=cancel.workflow.git.push;cancel.workflow.git.push=async(...args)=>{entered();await blocked;return push(...args);};}
      pending=cancel.workflow.execute(request.challenge.id,cancel.input.actor,'confirm');
    }
    await reached;
    if(phase==='tagging'){
      assert.equal(cancel.workflow.status(cancel.view.project.id).cancellable,false);
      assert.throws(()=>cancel.workflow.cancel(cancel.view.project.id,cancel.input.actor),/不能取消/);
    }else{
      assert.equal(cancel.workflow.cancel(cancel.view.project.id,cancel.input.actor).status,'cancelling');
      assert.equal(cancel.workflow.cancel(cancel.view.project.id,cancel.input.actor).status,'cancelling');
      assert.equal(cancel.workflow.status(cancel.view.project.id).locked,true,'retain source lock while in-flight work settles');
    }
    release();const stopped=await pending;
    assert.equal(stopped.status,phase==='tagging'?'deployment_triggered':'cancelled');
    assert.equal(cancel.state.tags.size,phase==='tagging'?1:0);assert.equal(cancel.workflow.status(cancel.view.project.id).locked,false);
    cancel.store.database.sql.close();
  }
  const {Client}=await import('@modelcontextprotocol/sdk/client/index.js');
  const {InMemoryTransport}=await import('@modelcontextprotocol/sdk/inMemory.js');
  const {ElicitRequestSchema}=await import('@modelcontextprotocol/sdk/types.js');
  const native=await fixture(),server=new McpServer({name:'mock-gitlab',version:'1'});
  registerGitLabTools(server,native.workflow,native.store);
  const openNative=registerNativeSettings(server,native.settings,values=>native.settings.save(values),async values=>testGitLabConnection({...await native.settings.get(false),...values},native.io));
  const client=new Client({name:'mock-codex',version:'1'},{capabilities:{elicitation:{form:{}}}}),dialogs=[];
  client.setRequestHandler(ElicitRequestSchema,async request=>{dialogs.push(request.params);return {action:'accept',content:request.params.requestedSchema.properties.domain?{domain:'www.example.com',environment:'test'}:{approved:true}};});
  const [clientSide,serverSide]=InMemoryTransport.createLinkedPair();await server.connect(serverSide);await client.connect(clientSide);
  try{
    const connection=await client.callTool({name:'website_settings_test',arguments:{}});assert.equal(connection.structuredContent.success,true);assert.ok(!JSON.stringify(connection).includes('unit-secret-token'));
    const response=await client.callTool({name:'website_deploy',arguments:{thread_id:'mock-thread',project_id:native.view.project.id}});
    assert.ok(!response.isError,JSON.stringify(response));assert.equal(JSON.parse(response.content[0].text).status,'deployment_triggered');
    assert.equal(dialogs.length,3,'Codex form separately asks domain/environment, repository creation and final publish');
    assert.match(dialogs[1].message,/create/);assert.match(dialogs[2].message,/publish/);
    const beforeNative=await native.settings.get(false),formRequests=[];
    const answers=[{action:'accept',content:{operation:'test'}},{action:'cancel'}];
    client.setRequestHandler(ElicitRequestSchema,async request=>{formRequests.push(request.params);return answers.shift();});
    assert.equal((await openNative()).cancelled,true);
    assert.equal(formRequests.length,2,'connection diagnostics are displayed in a second native form');
    assert.match(formRequests[1].message,/测试连接成功/);
    assert.deepEqual(await native.settings.get(false),beforeNative,'testing and cancellation do not save settings');
    client.setRequestHandler(ElicitRequestSchema,async()=>({action:'accept',content:{operation:'save',GITLAB_DEFAULT_BRANCH:'native-modal-branch'}}));
    assert.equal((await openNative()).saved,true);
    assert.equal((await native.settings.get(false)).GITLAB_DEFAULT_BRANCH,'native-modal-branch');
    assert.equal((await native.settings.get(false)).PROJECT_DIR,native.store.root);
  }finally{await client.close();await server.close();native.store.database.sql.close();}
  const fallback=await fixture(),fallbackServer=new McpServer({name:'mock-fallback',version:'1'});
  registerGitLabTools(fallbackServer,fallback.workflow,fallback.store);
  const fallbackClient=new Client({name:'unsupported-form',version:'1'},{capabilities:{elicitation:{form:{}}}});
  const {McpError}=await import('@modelcontextprotocol/sdk/types.js');
  fallbackClient.setRequestHandler(ElicitRequestSchema,async()=>{throw new McpError(-32601,'Unsupported form');});
  const [fallbackClientSide,fallbackServerSide]=InMemoryTransport.createLinkedPair();await fallbackServer.connect(fallbackServerSide);await fallbackClient.connect(fallbackClientSide);
  try{
    const args={thread_id:'mock-thread',project_id:fallback.view.project.id,domain:'www.example.com',environment:'test'};
    let response=await fallbackClient.callTool({name:'website_deploy',arguments:args}),value=JSON.parse(response.content[0].text);
    assert.equal(value.status,'confirmation_required');assert.equal(fallback.state.tags.size,0);
    response=await fallbackClient.callTool({name:'website_deploy',arguments:{...args,confirmation_id:value.challenge.id,decision:'confirm'}});value=JSON.parse(response.content[0].text);
    assert.equal(value.challenge.kind,'publish');assert.equal(fallback.state.tags.size,0);
    response=await fallbackClient.callTool({name:'website_deploy',arguments:{...args,confirmation_id:value.challenge.id,decision:'confirm'}});
    assert.equal(JSON.parse(response.content[0].text).status,'deployment_triggered');
  }finally{await fallbackClient.close();await fallbackServer.close();fallback.store.database.sql.close();}
  // Real Node transport, but only against a loopback HTTP fixture; no GitLab host is contacted.
  const received=[];
  const transportServer=createServer(async(request,response)=>{let body='';for await(const chunk of request)body+=chunk;received.push({host:request.headers.host,token:request.headers['private-token'],body});
    if(request.url.endsWith('/redirect')){response.writeHead(302,{Location:'https://must-not-contact.invalid/'});response.end();}
    else {response.setHeader('Content-Type','application/json');response.end(JSON.stringify({ok:true}));}
  });
  await new Promise(resolve=>transportServer.listen(0,'127.0.0.1',resolve));
  try{
    const localSettings={...await settings.get(),GITLAB_HOST:`http://gitlab.invalid:${transportServer.address().port}`,GITLAB_IP:'127.0.0.1'},io=nodeGitLabIO();
    await io.probe(localSettings);await io.api(localSettings,'GET','/user');
    assert.equal(received[0].host,`gitlab.invalid:${transportServer.address().port}`);assert.equal(received[0].token,'unit-secret-token');
    const response=await io.http(localSettings).request({url:localSettings.GITLAB_HOST+'/repo.git/git-receive-pack',method:'POST',body:new Uint8Array([65,66,67])});for await(const _chunk of response.body){}
    assert.equal(received[1].body,'ABC');
    const plain={...localSettings,GITLAB_HOST:`gitlab.invalid:${transportServer.address().port}`};
    await io.probe(plain);assert.equal(await io.tls(plain),'HTTP，无 TLS 握手');
    assert.equal((await io.api(plain,'GET','/user')).data.ok,true,'scheme-less intranet HOST uses real HTTP, never attempts TLS');
    await assert.rejects(io.api(localSettings,'GET','/redirect'),/重定向/);
    await assert.rejects(io.http(localSettings).request({url:'https://must-not-contact.invalid/repo.git'}),/其他地址/);
  }finally{transportServer.closeAllConnections();await new Promise(resolve=>transportServer.close(resolve));}
  // Reproduce alert 80 on loopback without any GitLab server, certificate bypass or HTTP credentials.
  const hellos=[],sockets=new Set();
  const alertServer=createTCPServer(socket=>{sockets.add(socket);socket.on('error',()=>{});socket.on('close',()=>sockets.delete(socket));socket.once('data',hello=>{hellos.push(hello);socket.end(Buffer.from([21,3,3,0,2,2,80]));});});
  await new Promise(resolve=>alertServer.listen(0,'127.0.0.1',resolve));
  try{
    const c={...await settings.get(),GITLAB_HOST:`https://gitlab.invalid:${alertServer.address().port}`,GITLAB_IP:'127.0.0.1'},io=nodeGitLabIO();
    await assert.rejects(io.tls(c),/TLS 连接失败.*alert 80/);
    await assert.rejects(io.api(c,'GET','/user'),/TLS 连接失败.*alert 80/);
    assert.equal(hellos.length,2);assert.ok(hellos.every(hello=>hello.includes(Buffer.from('gitlab.invalid'))),'TLS SNI keeps the configured domain while connecting to the configured IP');
    assert.ok(hellos.every(hello=>!hello.includes(Buffer.from('unit-secret-token'))));
  }finally{for(const socket of sockets)socket.destroy();await new Promise(resolve=>alertServer.close(resolve));}
  console.log('PASS: MOCK-ONLY GitLab full ordered gates, plaintext settings/UI echo/legacy migration/immutable PROJECT_DIR, domain validation, create and publish separate consent, one-use actor-bound approvals, source write lock, release/test Beijing API tags, duplicate protection, repeat deployments, config/file-change invalidation, cancellation, cloud backup/overwrite and local-only binding/conflict refusal');
}finally{store.database.sql.close();}
