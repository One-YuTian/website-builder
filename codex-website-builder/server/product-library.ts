import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { mkdir, open, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, extname, join } from 'node:path';
import type { ProjectStore, ProjectView } from './projects';

const STAGED_PREFIX = 'staged_products:';

export function extractProductRows(parsed: unknown): Record<string, unknown>[] {
  let rows: unknown = parsed;
  if (!Array.isArray(rows) && parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    const data = obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : null;
    rows = obj.products ?? obj.productData ?? obj.items ?? data?.products ?? data?.items ?? obj.data;
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('未识别到非空商品数组（支持数组、products、productData、items 或 data 包装）');
  }
  if (rows.some(item => !item || typeof item !== 'object' || Array.isArray(item))) {
    throw new Error('商品列表包含非对象条目');
  }
  return rows as Record<string, unknown>[];
}

export function normalizeProductsApiUrl(rawUrl: string): URL {
  const trimmed = rawUrl.trim();
  if (!trimmed) throw new Error('请输入商品接口链接');
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error('导入失败：链接格式无效');
  }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) {
    throw new Error('导入失败：仅支持无凭据 HTTP(S) 链接');
  }
  const pathname = url.pathname.replace(/\/+$/, '');
  if (!pathname) {
    url.pathname = '/api/products';
  } else if (!pathname.endsWith('/api/products')) {
    url.pathname = `${pathname}/api/products`;
  } else {
    url.pathname = pathname;
  }
  return url;
}

export async function fetchProductsFromUrl(rawUrl: string) {
  const target = normalizeProductsApiUrl(rawUrl);
  let response: Response;
  try {
    response = await fetch(target.href, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    const isTimeout = (error as Error)?.name === 'TimeoutError' || (error as Error)?.name === 'AbortError';
    throw new Error(isTimeout ? '导入失败：请求超时' : '导入失败：无法连接目标地址');
  }
  if (!response.ok) {
    throw new Error(`导入失败：HTTP ${response.status}`);
  }
  const text = (await response.text()).replace(/^\uFEFF/, '');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('导入失败：返回内容非有效 JSON');
  }
  let products: Record<string, unknown>[];
  try {
    products = extractProductRows(parsed);
  } catch {
    throw new Error('导入失败：未识别到有效商品数组');
  }
  return { raw_json: text, products, count: products.length, url: target.href };
}

export function parseRawProductJson(rawJson: string) {
  if (typeof rawJson !== 'string' || !rawJson.trim()) {
    throw new Error('商品 JSON 内容不能为空');
  }
  if (Buffer.byteLength(rawJson, 'utf8') > 64 * 1024 * 1024) {
    throw new Error('商品 JSON 超过 64MB 上限');
  }
  const clean = rawJson.replace(/^\uFEFF/, '');
  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('JSON 解析失败，请检查数据格式');
  }
  const products = extractProductRows(parsed);
  return { raw_json: clean, products, count: products.length, size: Buffer.byteLength(clean, 'utf8') };
}

function validPanelId(panelId?: string): asserts panelId is string {
  if (!panelId || !/^[a-zA-Z0-9_-]{8,128}$/.test(panelId)) {
    throw new Error('需要有效的面板 ID');
  }
}

export function stageProducts(store: ProjectStore, panelId: string | undefined, rawJson: string) {
  validPanelId(panelId);
  const { raw_json, count, size } = parseRawProductJson(rawJson);
  const record = { raw_json, count, size, updated_at: new Date().toISOString() };
  store.database.sql
    .prepare('INSERT INTO settings VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
    .run(STAGED_PREFIX + panelId, JSON.stringify(record));
  return { has_products: true, count, size, updated_at: record.updated_at };
}

export function getStagedProducts(store: ProjectStore, panelId: string | undefined) {
  validPanelId(panelId);
  const row = store.database.sql
    .prepare('SELECT value FROM settings WHERE key=?')
    .get(STAGED_PREFIX + panelId) as { value: string } | undefined;
  if (!row) return { has_products: false, count: 0, size: 0 };
  try {
    const parsed = JSON.parse(row.value) as { count: number; size: number; updated_at?: string };
    return { has_products: true, count: parsed.count, size: parsed.size, updated_at: parsed.updated_at };
  } catch {
    return { has_products: false, count: 0, size: 0 };
  }
}

export function clearStagedProducts(store: ProjectStore, panelId: string | undefined) {
  validPanelId(panelId);
  store.database.sql.prepare('DELETE FROM settings WHERE key=?').run(STAGED_PREFIX + panelId);
  return { has_products: false, count: 0, size: 0 };
}

export async function importStagedProducts(store: ProjectStore, panelId: string, view: ProjectView) {
  const key = STAGED_PREFIX + panelId;
  const row = store.database.sql.prepare('SELECT value FROM settings WHERE key=?').get(key) as { value: string } | undefined;
  if (!row) return null;
  const parsed = JSON.parse(row.value) as { raw_json: string; count: number; size: number };
  const filesDir = join(view.projectDirectory, 'files');
  await mkdir(filesDir, { recursive: true });
  const targetPath = join(filesDir, 'data.json');
  const bytes = Buffer.from(parsed.raw_json, 'utf8');
  await writeFile(targetPath, bytes);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const id = createHash('sha256').update(view.project.id + targetPath).digest('hex');
  store.database.sql
    .prepare('INSERT INTO resources VALUES (?,?,?,?,?,?,?) ON CONFLICT(project_id,path) DO UPDATE SET thread_id=excluded.thread_id,mime=excluded.mime,size=excluded.size')
    .run(id, view.project.id, view.threadId || null, 'data.json', targetPath, 'application/json', bytes.length);
  store.database.sql.prepare('DELETE FROM settings WHERE key=?').run(key);
  return {
    id,
    name: 'data.json',
    original_name: 'data.json',
    path: targetPath,
    mime: 'application/json',
    size: bytes.length,
    sha256,
    product_count: parsed.count,
  };
}

export async function downloadProductImage(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) throw new Error('图片地址不能为空');
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error('图片地址无效');
  }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) {
    throw new Error('仅支持无凭据 HTTP(S) 图片地址');
  }
  const response = await fetch(url.href, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    throw new Error(`图片下载失败（HTTP ${response.status}）`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length) throw new Error('图片内容为空');

  const downloadsDir = join(homedir(), 'Downloads');
  await mkdir(downloadsDir, { recursive: true });
  let base = basename(url.pathname).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') || 'product-image.png';
  if (!extname(base)) {
    const ct = response.headers.get('content-type') || '';
    const ext = ct.includes('jpeg') ? '.jpg' : ct.includes('webp') ? '.webp' : ct.includes('gif') ? '.gif' : '.png';
    base += ext;
  }
  const ext = extname(base);
  const stem = basename(base, ext);
  let targetName = base;
  let targetPath = join(downloadsDir, targetName);
  for (let attempt = 1; ; attempt++) {
    try {
      const handle = await open(targetPath, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY);
      try {
        await handle.writeFile(bytes);
      } finally {
        await handle.close();
      }
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      targetName = `${stem}_${attempt}${ext}`;
      targetPath = join(downloadsDir, targetName);
    }
  }
  return { downloaded: true, name: targetName, path: targetPath };
}
