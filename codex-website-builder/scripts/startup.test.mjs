import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const config = JSON.parse(await readFile('mcp.json', 'utf8')).mcpServers['website-builder'];
assert.deepEqual(Object.keys(config).sort(), ['args','command','cwd','env','type']);
assert.equal(config.command,'./scripts/launch-node');
const expand = value => value.replaceAll('${PLUGIN_ROOT}', resolve('.'));
const configuredEnv = Object.fromEntries(Object.entries(config.env).map(([key, value]) => [key, expand(value)]));
const isolated = await mkdtemp(join(tmpdir(), 'website-startup-'));
for (const scenario of ['actual-config', 'missing-reference']) {
  const reference = join(isolated, 'unavailable-reference');
  const client = new Client({ name: `startup-${scenario}`, version: '1' });
  const env = { ...process.env, ...configuredEnv, WEBSITE_BUILDER_DATA_DIR: join(isolated, scenario), ...(scenario === 'missing-reference' ? {
    WEBSITE_BUILDER_ROOT: reference,
    WEBSITE_BUILDER_PROJECT_ROOT: join(isolated, 'projects'),
  } : {}) };
  try {
    await client.connect(new StdioClientTransport({ command: process.platform==='win32'?'cmd.exe':resolve(expand(config.cwd),config.command), args: process.platform==='win32'?['/d','/c',resolve(expand(config.cwd),config.command)+'.cmd',...config.args.map(expand)]:config.args.map(expand), cwd: expand(config.cwd), env }));
    assert.equal(client.getServerVersion().version, JSON.parse(await readFile('package.json', 'utf8')).version);
    const { tools } = await client.listTools();
    assert.ok(tools.some(tool => tool.name === 'website_write'));
    const canvas = await client.callTool({ name: 'open_canvas', arguments: {} });
    assert.ok(!canvas.isError);
    const resource = await client.readResource({ uri: 'ui://codex-website-builder/canvas' });
    assert.match(resource.contents[0].text, /window\.__WEBSITE_BUILDER__/);
    if (scenario === 'missing-reference') {
      const call = async (name, args) => {
        const value = await client.callTool({ name, arguments: args });
        assert.ok(!value.isError, JSON.stringify(value));
        return value;
      };
      const opened = await call('website_project', { thread_id: 'startup-test', pages: [{ path: 'index.html', title: 'Home' }] });
      const project = JSON.parse(opened.content[0].text);
      const saved = await call('website_write', { thread_id: project.thread_id, project_id: project.project_id, files: [{ path: 'index.html', content: '<!doctype html><html><head><title>Startup</title></head><body><main><h1>Startup recovery</h1></main></body></html>' }] });
      assert.equal(JSON.parse(saved.content[0].text).pages[0].status, 'ready');
      const synced = await call('project_sync', { wait_ms: 0 });
      assert.equal(synced._meta.sync.manifest.pages[0].status, 'ready');
      assert.ok(synced._meta.sync.pages['index.html']);
      const unavailable = await client.callTool({ name: 'read_website', arguments: { directory: 'example.com' } });
      assert.ok(unavailable.isError, 'missing references fail only the explicit reference request');
      await assert.rejects(stat(reference), { code: 'ENOENT' });
    } else {
      // Optional reference library need not exist in a fresh installation.
      const opened = await client.callTool({ name: 'website_project', arguments: { thread_id: 'startup-actual', pages: [{ path: 'index.html', title: 'Home' }] } });
      assert.ok(!opened.isError, JSON.stringify(opened));
      assert.equal(JSON.parse(opened.content[0].text).directory, join(env.WEBSITE_BUILDER_DATA_DIR, 'project', JSON.parse(opened.content[0].text).project_id));
      assert.ok((await stat(join(env.WEBSITE_BUILDER_DATA_DIR, 'project'))).isDirectory());
    }
    console.log(`PASS: ${scenario}: MCP handshake, tool discovery and canvas resource${scenario === 'missing-reference' ? ', isolated project write and sync without creating reference directory' : ''}`);
  } finally { await client.close(); }
}
