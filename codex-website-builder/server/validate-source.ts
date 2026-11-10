import { parse } from 'acorn';

export function validateSource(path: string, content: string) {
  try {
    if (/\.(?:m?js)$/i.test(path)) parse(content, { ecmaVersion: 'latest', sourceType: 'module' });
    else if (/\.json$/i.test(path)) JSON.parse(content);
  } catch (error) {
    throw new Error(`${path} 语法无效：${(error as Error).message}`);
  }
  return content;
}
