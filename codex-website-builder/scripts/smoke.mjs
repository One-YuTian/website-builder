import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { cp, mkdtemp, readFile, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

const client = new Client({ name: 'website-builder-smoke', version: '0.1.0' });
const manifest = JSON.parse(await readFile('plugin.json', 'utf8'));
const compatibility = JSON.parse(await readFile('.codex-plugin/plugin.json', 'utf8'));
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
assert.equal(compatibility.name, manifest.name);
assert.equal(compatibility.version, manifest.version);
assert.equal(pkg.version, manifest.version);
const mcp = JSON.parse(await readFile('mcp.json', 'utf8'));
const isolated = await mkdtemp(join(tmpdir(), 'website-builder-smoke-'));
const referenceRoot = join(isolated, 'reference');
const fixture = join(referenceRoot, 'www.noventrad.com');
await mkdir(join(fixture, 'css'), { recursive: true });
await mkdir(join(fixture, 'js'), { recursive: true });
await writeFile(join(fixture, 'css/style.css'), 'body { margin: 0; }');
await writeFile(join(fixture, 'js/demo.js'), 'window.smokeFixture = true;');
const fixturePages = ['index', 'shop', 'product', 'cart', 'wishlist', 'checkout', 'login', 'register', 'about', 'contact', 'terms', 'privacy', 'return', 'shipping'];
const links = fixturePages.map(name => `<a href="${name}.html">${name}</a>`).join('\n');
for (const name of fixturePages) await writeFile(join(fixture, `${name}.html`), `<!doctype html><html><head><link rel="stylesheet" href="css/style.css"></head><body>${links}<script src="js/demo.js"></script></body></html>`);
await cp(resolve(process.argv[2] ?? 'dist'), join(isolated, 'dist'), { recursive: true });
await cp('package.json', join(isolated, 'package.json'));
await cp('scripts',join(isolated,'scripts'),{recursive:true});
const config = mcp.mcpServers['website-builder'];
assert.ok(config.command==='./scripts/launch-node');
const expand = value => value.replaceAll('${PLUGIN_ROOT}', isolated);
const transport = new StdioClientTransport({ command: process.platform==='win32'?'cmd.exe':resolve(expand(config.cwd),config.command), args: process.platform==='win32'?['/d','/c',resolve(expand(config.cwd),config.command)+'.cmd',...config.args.map(expand)]:config.args.map(expand), cwd: expand(config.cwd), env: { ...process.env, WEBSITE_BUILDER_PREVIEW_VENDOR_FIXTURES:'1', ...Object.fromEntries(Object.entries(config.env).map(([k,v])=>[k,expand(v)])), WEBSITE_BUILDER_ROOT: referenceRoot, WEBSITE_BUILDER_PROJECT_ROOT: join(isolated, 'projects') } });
try {
  await client.connect(transport);
  assert.equal(client.getServerVersion().version, manifest.version);
  const { tools } = await client.listTools();
  const tool = tools.find(tool => tool.name === 'open_canvas');
  assert.ok(tool);
  assert.equal(tool._meta['openai/ui'].entrypoints[0].type, 'global');
  const result = await client.callTool({ name: 'open_canvas', arguments: {} });
  assert.ok(!result.isError);
  const resource = await client.readResource({ uri: tool._meta.ui.resourceUri });
  assert.equal(resource.contents[0].mimeType, 'text/html;profile=mcp-app');
  assert.match(resource.contents[0].text, /<canvas|createElement|jsx/);
  assert.ok(!resource.contents[0].text.includes('src="/src/main.tsx"'));
  const bootstrap = JSON.parse(resource.contents[0].text.match(/window\.__WEBSITE_BUILDER__=(.*?);<\/script>/)[1]);
  assert.deepEqual(resource.contents[0]._meta.ui.csp.frameDomains, ['blob:', 'data:']);
  assert.deepEqual(resource.contents[0]._meta.ui.csp.connectDomains, ['data:', 'blob:']);
  const embedded = await client.callTool({ name: 'read_website', arguments: { directory: 'www.noventrad.com' } });
  assert.ok(!embedded.isError);
  assert.equal(embedded._meta.website.pages.length, 14);
  for(const page of embedded._meta.website.pages) {
    const result = await client.callTool({ name:'read_page', arguments:{directory:'www.noventrad.com',path:page.path} });
    assert.ok(!result.isError,`${page.path}: ${JSON.stringify(result.content)}`);
    let zipped;
    if(typeof result._meta.gzip==='string')zipped=Buffer.from(result._meta.gzip,'base64');
    else {
      const chunks=[];let offset=0,total=Infinity;
      while(offset<total){const response=await client.callTool({name:'proxy_resource',arguments:{url:result._meta.gzip.resource,offset,raw:true}});assert.ok(!response.isError);const value=response._meta.resource;chunks.push(Buffer.from(value.base64,'base64'));offset=value.next;total=value.total;}
      zipped=Buffer.concat(chunks);
    }
    const html = gunzipSync(zipped).toString('utf8');
    assert.ok(html.includes('data:text/javascript;base64,') && html.includes('website-builder:height'), page.path);
    assert.ok(JSON.stringify(result._meta.gzip).length < 1100000);
  }
  console.log('PASS: 14 individual compressed MCP page transfers with embedded resources; no HTTP CSP dependency');
  const site = await (await fetch(bootstrap.api)).json();
  assert.equal(site.name, 'www.noventrad.com');
  assert.equal(site.pages.length, 14);
  assert.equal(site.pages[0].path, 'index.html');
  assert.equal(site.pages[1].path, 'shop.html');
  assert.equal(new Set(site.pages.map(page => page.path)).size, 14);
  for (const page of site.pages) {
    const response = await fetch(page.url);
    assert.equal(response.status, 200, page.path);
    assert.match(await response.text(), /website-builder:height/);
  }
  const css = await fetch(new URL('css/style.css', site.pages[0].url));
  assert.equal(css.status, 200);
  assert.equal((await fetch(`${bootstrap.api}?directory=../../`)).status, 400);
  assert.equal((await fetch(`${bootstrap.origin}/no-token/api/site`)).status, 404);
  console.log('PASS: manifest versions, configured MCP launch without dependencies, global entrypoint, empty-argument call and bundled UI resource');
  console.log('PASS: 14 ordered website pages, relative assets, height bridge, iframe CSP, directory containment and token access');
} finally { await client.close(); }
