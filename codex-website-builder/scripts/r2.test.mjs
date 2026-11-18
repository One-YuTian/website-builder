import assert from 'node:assert/strict';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {signS3,createS3Client,parseList} from '../assets/r2/s3.mjs';
import {r2Fixture,waitR2,testR2Config} from './r2-test-support.mjs';
import {loadGitLabFixture} from './gitlab-test-support.mjs';
// AWS's published SigV4 GET Object test vector. Public example credentials only.
const signed=signS3({url:new URL('https://examplebucket.s3.amazonaws.com/test.txt'),method:'GET',headers:{range:'bytes=0-9'},accessKeyId:'AKIAIOSFODNN7EXAMPLE',secretAccessKey:'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',date:new Date('2013-05-24T00:00:00Z'),region:'us-east-1'});
assert.ok(signed.Authorization.endsWith('Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41'));
assert.throws(()=>parseList('<Error/>'));assert.throws(()=>parseList('<!DOCTYPE x><ListBucketResult><IsTruncated>false</IsTruncated></ListBucketResult>'));
const f=await r2Fixture(),id=f.view.project.id;
try{
 assert.equal(f.store.database.status(id),'completed');
 // Ready pages alone do not mean the current creation/modification round has finished.
 for(const [key,expiry] of [['project:start',Date.now()+60000],['project:modify',Date.now()+60000],['expired:task',Date.now()-1]]){
  f.store.database.sql.prepare('INSERT INTO project_activity VALUES (?,?,?)').run(id,key,expiry);
  await assert.rejects(f.r2.start(id,'mock-thread'),/项目尚未完成/);
  assert.equal(f.calls.length,0);assert.equal(f.r2.status(id).locked,false);assert.equal(f.r2.status(id).id,undefined);
  f.store.database.sql.prepare('DELETE FROM project_activity WHERE project_id=?').run(id);
 }
 await f.store.plan('mock-thread',[{path:'contact.html',title:'Contact'}]);
 await assert.rejects(f.r2.start(id,'mock-thread'),/项目尚未完成/);assert.equal(f.calls.length,0);
 await f.store.update('mock-thread',async view=>{view.project.pages=view.project.pages.filter(page=>page.path!=='contact.html');});
 f.store.database.sql.prepare('INSERT INTO image_tasks(project_id,path,name,width,height,status) VALUES (?,?,?,?,?,?)').run(id,'bad.png','bad',10,10,'error');
 assert.equal(f.store.database.status(id),'completed','image tasks do not block project completion');
 f.store.database.sql.prepare('DELETE FROM image_tasks WHERE project_id=?').run(id);
 assert.equal(f.store.database.status(id),'completed');
 await mkdir(join(f.view.directory,'images'),{recursive:true});await writeFile(join(f.view.directory,'images/图 & 1.png'),Buffer.from([1,2,3]));
 f.objects.set(id+'/old.html',{body:Buffer.from('old'),sha256:'old'});f.objects.set('another-project/keep.txt',{body:Buffer.from('keep'),sha256:'keep'});
 const before=await readFile(join(f.view.directory,'index.html'));await f.r2.start(id,'mock-thread');
 await assert.rejects(f.store.write('mock-thread',[{path:'index.html',content:'bad'}]),/禁止修改/);
 let result=await waitR2(f.r2,id);assert.equal(result.status,'completed',JSON.stringify(result));assert.equal(result.url,`https://${id}.deploy.invalid`);assert.equal(result.completed,2);assert.equal(result.deleted,1);
 assert.deepEqual([...f.objects.keys()].sort(),[id+'/images/图 & 1.png',id+'/index.html','another-project/keep.txt'].sort());assert.deepEqual(await readFile(join(f.view.directory,'index.html')),before);
 f.state.fail=true;await f.r2.start(id,'mock-thread');result=await waitR2(f.r2,id);assert.equal(result.status,'failed');assert.equal(result.url,undefined);
 f.state.fail=false;let release;f.state.hold=new Promise(resolve=>release=resolve);await f.r2.start(id,'mock-thread');await new Promise(resolve=>setTimeout(resolve,50));
 await assert.rejects(f.r2.start(id,'mock-thread'),/正在部署/);
 assert.throws(()=>f.r2.cancel(id,'another-thread'),/其他会话/);f.r2.cancel(id,'mock-thread');assert.equal(f.r2.status(id).locked,true);release();result=await waitR2(f.r2,id);assert.equal(result.status,'cancelled');assert.equal(result.url,undefined);
 f.state.hold=null;f.objects.set(id+'/stale-on-failure.txt',{body:Buffer.from('old'),sha256:'old'});
 const head=f.client.head;f.client.head=async()=>({size:0,sha256:'bad'});await f.r2.start(id,'mock-thread');result=await waitR2(f.r2,id);assert.equal(result.status,'failed');assert.ok(f.objects.has(id+'/stale-on-failure.txt'),'do not delete old objects before uploaded content passes verification');f.client.head=head;
}finally{f.store.database.sql.close();}
// Real HTTP S3 transport on loopback; no Cloudflare calls.
const requests=[],remote=new Map(),server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://local');const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks);requests.push({method:req.method,path:url.pathname,query:url.search,headers:req.headers,body});
 if(req.method==='GET'){
  const token=url.searchParams.get('continuation-token');res.setHeader('Content-Type','application/xml');res.end(token?'<ListBucketResult><IsTruncated>false</IsTruncated><Contents><Key>project/a&amp;b.txt</Key><Size>3</Size></Contents></ListBucketResult>':'<ListBucketResult><IsTruncated>true</IsTruncated><NextContinuationToken>two+ /</NextContinuationToken><Contents><Key>project/index.html</Key><Size>3</Size></Contents></ListBucketResult>');
 }else if(req.method==='PUT'){remote.set(url.pathname,{body,hash:req.headers['x-amz-meta-sha256']});res.end();}
 else if(req.method==='HEAD'){res.setHeader('Content-Length',remote.get(url.pathname).body.length);res.setHeader('x-amz-meta-sha256',remote.get(url.pathname).hash);res.end();}
 else if(req.method==='DELETE'){remote.delete(url.pathname);res.statusCode=204;res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
 const s3=createS3Client(testR2Config,{endpoint:`http://127.0.0.1:${server.address().port}`}),signal=new AbortController().signal;
 const list=await s3.list('project/',signal);assert.equal(list.length,2);assert.equal(list[1].key,'project/a&b.txt');assert.ok(requests[1].query.includes('continuation-token='));
 const body=Buffer.from('abc'),hash=createHash('sha256').update(body).digest('hex'),key='project/图 & 1.txt';await s3.put(key,{body,size:body.length,sha256:hash,contentType:'text/plain'},signal);assert.deepEqual(await s3.head(key,signal),{size:3,sha256:hash});await s3.remove(key,signal);assert.equal(remote.size,0);
 assert.ok(requests.every(request=>request.headers.authorization?.startsWith('AWS4-HMAC-SHA256')));assert.ok(requests.find(request=>request.method==='PUT').path.includes('%E5%9B%BE%20%26%201.txt'));
 await assert.rejects(s3.remove('project/../another-project/file',signal),/路径/);
}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
const {openPreviewBrowser}=await loadGitLabFixture(),launches=[];
for(const platform of ['win32','darwin','linux'])await openPreviewBrowser('https://project.deploy.invalid',platform,async(...args)=>{launches.push(args);return {stdout:'',stderr:''};});
assert.ok(launches[0][0].toLowerCase().endsWith('powershell.exe'));assert.equal(launches[0][2].env.WEBSITE_BUILDER_PREVIEW_URL,'https://project.deploy.invalid/');assert.equal(launches[1][0],'/usr/bin/open');assert.equal(launches[2][0],'xdg-open');
await assert.rejects(openPreviewBrowser('javascript:alert(1)','win32',async()=>{}),/地址/);
console.log('PASS: AWS published signature vector; mock R2 exact src sync, scoped stale deletion, hash/size verification, failure/cancel locks; loopback signed S3 pagination/Unicode upload/HEAD/delete; no real cloud traffic');
