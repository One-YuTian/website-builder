import { App } from '@modelcontextprotocol/ext-apps';
export const hostApp = window.parent !== window ? new App({ name: 'codex-website-builder', version: '0.6.7' }) : null;
export const hostReady = hostApp ? hostApp.connect() : Promise.resolve();
