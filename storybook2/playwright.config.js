import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// 仅绕过本地验收服务，外部 CDN 仍沿用环境网络策略。
process.env.NO_PROXY = [process.env.NO_PROXY, '127.0.0.1', 'localhost'].filter(Boolean).join(',');

const executablePath = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(candidate => candidate && existsSync(candidate));

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 20000 },
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:6010',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } } : {}),
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: { command: 'npm run serve', url: 'http://127.0.0.1:6010', reuseExistingServer: false, timeout: 30000 },
});
