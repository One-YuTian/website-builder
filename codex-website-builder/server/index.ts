import { readFile } from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';

const uri = 'ui://codex-website-builder/canvas';
const html = await readFile(new URL('../ui/index.html', import.meta.url), 'utf8');
const server = new McpServer({ name: 'codex-website-builder', version: '0.1.8' });
registerAppResource(server, 'canvas', uri, {}, async () => ({
  contents: [{ uri, mimeType: RESOURCE_MIME_TYPE, text: html, _meta: {
    ui: { csp: { connectDomains: [], resourceDomains: [] } },
    'openai/ui': { preferredDisplayMode: 'fullscreen', availableDisplayModes: ['fullscreen'] },
  } }],
}));
registerAppTool(server, 'open_canvas', {
  title: 'Website Builder',
  description: '打开带有鼠标交互点阵背景的网站设计画布。',
  inputSchema: {},
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  _meta: { ui: { resourceUri: uri }, 'openai/ui': { entrypoints: [{ type: 'global' }] } },
}, async () => ({ content: [{ type: 'text', text: '画布已打开。' }] }));
await server.connect(new StdioServerTransport());
