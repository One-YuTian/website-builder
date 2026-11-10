import { readFile, realpath } from 'node:fs/promises';
import { join, relative, sep, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { parse } from 'acorn';
import { ProjectStore } from './projects';

type Product = Record<string, any>;
export interface CommerceInput {
  action?: 'prepare' | 'validate';
  thread_id: string;
  project_id: string;
  count?: number;
  seed?: string;
  currency?: string;
  locale?: string;
  products?: Product[];
  api_url?: string;
  regenerate?: boolean;
}

async function existingFile(directory: string, path: string): Promise<string | undefined> {
  try {
    const file = await realpath(join(directory, path));
    const rel = relative(await realpath(directory), file);
    if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error('商品文件不能指向项目外部');
    return await readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

// Read literal data without executing arbitrary website JavaScript.
export function productData(source: string): Product[] {
  const ast = parse(source, { ecmaVersion: 'latest' }) as any;
  const literal = (node: any): any => {
    if (node.type === 'Literal') return node.value;
    if (node.type === 'ArrayExpression') return node.elements.map(literal);
    if (node.type === 'ObjectExpression') {
      return Object.fromEntries(node.properties.map((property: any) => {
        if (property.type !== 'Property' || property.computed || property.method) {
          throw new Error('商品数据必须为纯对象，不能包含执行逻辑');
        }
        return [property.key.name ?? property.key.value, literal(property.value)];
      }));
    }
    if (node.type === 'UnaryExpression' && node.operator === '-' && node.argument.type === 'Literal') {
      return -node.argument.value;
    }
    throw new Error('现有 data.js 不是纯字面量数据；请保留并在浏览器验证，不能自动覆盖');
  };
  const assignment = ast.body.find((node: any) => {
    const left = node.expression?.left;
    return node.expression?.type === 'AssignmentExpression'
      && left?.type === 'MemberExpression'
      && left.object.name === 'window'
      && (left.property.name || left.property.value) === 'productData';
  });
  if (!assignment) throw new Error('未找到 window.productData 数组');
  const result = literal(assignment.expression.right);
  if (!Array.isArray(result)) throw new Error('window.productData 必须是数组');
  return result;
}

export function validateProducts(products: Product[], generated = false) {
  const ids = new Set<string>();
  const failures: string[] = [];
  for (const [index, product] of products.entries()) {
    const fail = (message: string) => failures.push(`商品 ${index + 1}：${message}`);
    if (!product || typeof product !== 'object') { fail('不是商品对象'); continue; }
    if (typeof product.id !== 'string' || !product.id || ids.has(product.id)) fail('ID 必须是唯一非空字符串');
    if (generated && !/^B[A-Z0-9]{9}$/.test(product.id)) fail('Mock ID 必须为 B + 9 位大写字母数字');
    ids.add(product.id);
    for (const field of ['name', 'brand', 'category', 'main_image', 'description', 'monthly_sales']) {
      if (typeof product[field] !== 'string' || !product[field].trim()) fail(`${field} 必须是非空字符串`);
    }
    if (!Number.isFinite(product.final_price) || product.final_price < 0) fail('final_price 必须是非负数字');
    if (!Number.isFinite(product.rating) || product.rating < 0 || product.rating > 5) fail('rating 必须在 0–5 之间');
    if (!Number.isInteger(product.reviews_count) || product.reviews_count < 0) fail('reviews_count 必须是非负整数');
    if (!Array.isArray(product.images) || !product.images.length || product.images.some((image: any) => typeof image !== 'string' || !image)) fail('images 必须包含图片路径');
    if (!Array.isArray(product.features) || !product.features.length || product.features.some((feature: any) => typeof feature !== 'string')) fail('features 必须是非空字符串数组');
    if (!Array.isArray(product.specifications) || !product.specifications.length || product.specifications.some((item: any) => typeof item?.key !== 'string' || typeof item?.value !== 'string')) fail('specifications 必须为 {key,value} 数组');
    if (product.original_price != null) {
      if (!Number.isFinite(product.original_price) || product.original_price <= product.final_price) fail('original_price 必须大于售价');
      const expected = Math.round((1 - product.final_price / product.original_price) * 100);
      if (product.discount !== `${expected}%`) fail('discount 必须与售价/原价计算一致');
    } else if (product.discount) fail('无原价时不能标注折扣');
    for (const field of ['variants', 'variant_options', 'comments']) {
      if (!Array.isArray(product[field])) fail(`${field} 必须是数组`);
    }
    for (const comment of Array.isArray(product.comments) ? product.comments : []) {
      if (typeof comment.date !== 'string' || !Number.isFinite(Date.parse(comment.date))
        || !Number.isFinite(comment.rating) || comment.rating < 0 || comment.rating > 5
        || typeof comment.content !== 'string' || typeof comment.user_name !== 'string') fail('评论字段不完整');
    }
  }
  if (failures.length) throw new Error(failures.slice(0, 12).join('\n'));
  return { count: products.length, brands: new Set(products.map(item => item.brand)).size, categories: new Set(products.map(item => item.category)).size };
}

export function generateProducts(input: CommerceInput) {
  const samples = input.products || [];
  if (!samples.length) throw new Error('请提供与品牌相符的 products 样本，不能自动套用无关行业数据');
  const count = input.count ?? 24;
  if (!Number.isInteger(count) || count < 1 || count > 200) throw new Error('count 必须为 1–200，常规演示建议 20–50');
  const products = Array.from({ length: count }, (_, index) => {
    const sample = samples[index % samples.length];
    if (typeof sample.final_price !== 'number' || !sample.main_image && !sample.images?.length) {
      throw new Error('每个样本必须提供数值 final_price 和 main_image/images；不能伪造商品图片');
    }
    const digest = createHash('sha256').update(`${input.seed || input.project_id}:${index}`).digest('hex').toUpperCase();
    const product: Product = {
      ...sample,
      id: `B${digest.slice(0, 9)}`,
      name: index < samples.length ? sample.name : `${sample.name} ${String(Math.floor(index / samples.length) + 1).padStart(2, '0')}`,
      main_image: sample.main_image || sample.images[0],
      images: sample.images?.length ? sample.images.slice(0, 5) : [sample.main_image],
      final_price: Math.round(sample.final_price * 100) / 100,
      rating: sample.rating ?? Math.round((3 + parseInt(digest.slice(9, 11), 16) / 255 * 2) * 10) / 10,
      reviews_count: sample.reviews_count ?? parseInt(digest.slice(11, 15), 16) % 501,
      monthly_sales: sample.monthly_sales || `${parseInt(digest.slice(15, 17), 16) + 1}+`,
      features: sample.features || [sample.description],
      specifications: sample.specifications || [{ key: 'Brand', value: sample.brand }, { key: 'Category', value: sample.category }],
      variants: sample.variants || [],
      variant_options: sample.variant_options || [],
      comments: sample.comments || [],
    };
    if (sample.original_price == null && index % 5 < 2) product.original_price = Math.round(product.final_price / 0.85 * 100) / 100;
    if (product.original_price > product.final_price) product.discount = `${Math.round((1 - product.final_price / product.original_price) * 100)}%`;
    else { delete product.original_price; delete product.discount; }
    return product;
  });
  validateProducts(products, true);
  return products;
}

export async function prepareCommerce(store: ProjectStore, skillRoot: string, input: CommerceInput) {
  const view = await store.get(input.thread_id);
  if (!view || view.project.id !== input.project_id) throw new Error('当前会话项目不匹配，请先打开项目');
  new Intl.NumberFormat(input.locale || 'en-US', { style: 'currency', currency: input.currency || 'USD' });
  const existing = await existingFile(view.directory, 'js/data.js');
  if (input.action === 'validate') {
    if (!existing) throw new Error('缺少 js/data.js');
    return { source: 'existing', ...validateProducts(productData(existing)) };
  }
  const files: { path: string; content: string }[] = [];
  let source = 'generated', count = 0;
  if (input.api_url) {
    const url = new URL(input.api_url);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('API 数据源必须使用 HTTP(S)');
    source = 'api';
  } else if (existing && !input.regenerate) {
    const products = productData(existing);
    if (products.length) { validateProducts(products); source = 'existing'; count = products.length; }
  }
  if (source === 'generated') {
    const products = generateProducts(input); count = products.length;
    files.push({ path: 'js/data.js', content: `window.productData = ${JSON.stringify(products, null, 2)};

window.storeData = {
  getAll() {
    return window.SDK.list().result();
  },
  getById(id) {
    return window.SDK.get(String(id));
  },
  getByCategory(category) {
    return window.SDK.categories(category).result();
  },
  formatPrice(value) {
    return window.SDK.price(value);
  },
  toCartItem(product) {
    return {
      id: String(product.id),
      name: product.name,
      image: product.main_image,
      price: product.final_price
    };
  }
};
` });
  }
  const kept: string[] = [];
  for (const name of ['sdk.js', 'ec-sdk.js']) {
    const path = `js/${name}`;
    if (await existingFile(view.directory, path) !== undefined) kept.push(path);
    else files.push({ path, content: await readFile(join(skillRoot, 'assets/commerce', name), 'utf8') });
  }
  const configuration = 'js/app.js';
  const configDefaults = { currency: input.currency || 'USD', locale: input.locale || 'en-US', storageKey: `website-builder:${view.project.id}` };
  if (await existingFile(view.directory, configuration) !== undefined) kept.push(configuration);
  else files.push({ path: configuration, content: `window.commerceConfig = ${JSON.stringify(configDefaults)};\n` });
  if (files.length) await store.write(input.thread_id, files);
  return { project_id: view.project.id, source, count, written: files.map(file => file.path), kept, config_defaults: configDefaults,
    configuration_note: 'New projects keep currency/locale/storageKey in js/app.js, not a separate commerce-config.js. Merge missing defaults without replacing existing settings, keep Tailwind config first, and initialize configuration before SDK/APP.',
    ...(source === 'api' ? { next: '生成 API 字段适配器，数据就绪后设置 window.productData 并 SDK.init；未生成 mock 数据。' } : {}),
    account_contract: 'Bundled APP.account.register/login/update are async demo methods; await results. Existing SDKs are preserved: inspect their contract before use.' };
}
