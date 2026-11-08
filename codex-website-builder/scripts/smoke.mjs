import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { cp, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const client = new Client({ name: 'website-builder-smoke', version: '0.1.0' });
const isolated = await mkdtemp(join(tmpdir(), 'website-builder-smoke-'));
await cp(resolve(process.argv[2] ?? 'dist'), join(isolated, 'dist'), { recursive: true });
const transport = new StdioClientTransport({ command: process.execPath, args: [join(isolated, 'dist/server/index.js')], cwd: isolated });
try {
  await client.connect(transport);
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
  console.log('PASS: MCP initialization, global entrypoint, empty-argument call and bundled UI resource');
} finally { await client.close(); }
