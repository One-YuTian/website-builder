import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const source=resolve('.'),repository=resolve(process.argv[2]),bundle=join(repository,'codex-website-builder');
const json=async path=>JSON.parse(await readFile(path,'utf8'));
const version=(await json(join(source,'package.json'))).version;
for(const path of ['package.json','plugin.json','.codex-plugin/plugin.json'])assert.equal((await json(join(bundle,path))).version,version,path);
for(const path of ['.agents/plugins/marketplace.json','.codex-plugin/marketplace.json']){
  const market=await json(join(repository,path));assert.equal(market.name,'website-builder-beta');
  assert.equal(market.plugins.find(item=>item.name==='codex-website-builder').source.path,'./codex-website-builder');
}
const files=async(root,prefix='')=>{
  const result=[];
  for(const item of await readdir(join(root,prefix),{withFileTypes:true})){
    const path=join(prefix,item.name);assert.ok(!item.isSymbolicLink(),path);
    if(item.isDirectory())result.push(...await files(root,path));else result.push(path);
  }
  return result.sort();
};
for(const part of ['dist','skills']){
  const original=await files(join(source,part)),published=await files(join(bundle,part));assert.deepEqual(published,original,part);
  for(const path of original){const hash=async root=>createHash('sha256').update(await readFile(join(root,part,path))).digest('hex');assert.equal(await hash(bundle),await hash(source),path);}
}
for(const path of ['plugin.json','.codex-plugin/plugin.json','mcp.json','scripts/launch-node','scripts/launch-node.cmd','assets/icon.png','assets/icon2.png','assets/logo.png'])assert.deepEqual(await readFile(join(bundle,path)),await readFile(join(source,path)),path);
await assert.rejects(access(join(bundle,'node_modules')));
const config=(await json(join(bundle,'mcp.json'))).mcpServers['website-builder'];
const expand=value=>value.replaceAll('${PLUGIN_ROOT}',bundle);
const isolated=await mkdtemp(join(tmpdir(),'website-beta-release-'));
const client=new Client({name:'release-verification',version:'1'});
try{
  const launcher=resolve(bundle,config.command);
  await client.connect(new StdioClientTransport({command:process.platform==='win32'?'cmd.exe':launcher,args:process.platform==='win32'?['/d','/c',launcher+'.cmd',...config.args.map(expand)]:config.args.map(expand),cwd:expand(config.cwd),env:{...process.env,...Object.fromEntries(Object.entries(config.env).map(([key,value])=>[key,expand(value)])),WEBSITE_BUILDER_DATA_DIR:isolated,WEBSITE_BUILDER_PROJECT_ROOT:join(isolated,'project'),WEBSITE_BUILDER_ROOT:join(isolated,'reference')}}));
  assert.equal(client.getServerVersion().version,version);
  const tool=(await client.listTools()).tools.find(item=>item.name==='open_canvas');assert.ok(tool);
  const result=await client.callTool({name:'open_canvas',arguments:{}});assert.ok(!result.isError);
  const resource=(await client.readResource({uri:tool._meta.ui.resourceUri})).contents[0];
  assert.equal(resource.mimeType,'text/html;profile=mcp-app');
  assert.deepEqual(resource._meta.ui.permissions,{clipboardWrite:{}});
  assert.ok(resource.text.includes('项目目录'));
  console.log(`PASS: beta ${version}: complete build/skill hashes, icon assets, marketplace paths, manifests, dependency-free configured launcher, MCP handshake and canvas`);
}finally{await client.close();}
