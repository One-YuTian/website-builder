import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icons';
import { pluginControl } from './plugin-control';
import { closePluginModal } from './plugin-modal';
import { readResource } from './resources';

type ImportMode = 'url' | 'file' | 'paste';
type RawProduct = Record<string, any>;
type ImageRule = { mode: 'main' | 'first' | 'nth'; nth: number };

const CDN_BASE = 'https://cdn.gamifyspace.com/';

function extractImageValue(value: unknown): string {
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    value = obj.url ?? obj.src ?? obj.hi_res ?? obj.large ?? obj.link;
  }
  return typeof value === 'string' ? value.trim() : '';
}

export function resolveCdnImageUrl(value: unknown): string {
  const path = extractImageValue(value);
  if (!path) return '';
  if (/^(?:data|blob):/i.test(path)) return path;
  if (/^\/\//.test(path)) return `https:${path}`;
  if (/^https?:\/\//i.test(path)) return path;
  if (/^[a-z][a-z\d+.-]*:/i.test(path) || path.includes('\\')) return '';
  return `${CDN_BASE}${path.replace(/^\/+/, '')}`;
}

function CdnImage({ path, alt, className, onPreview }: { path: unknown; alt: string; className?: string; onPreview?: (url: string, alt: string) => void }) {
  const resolved = resolveCdnImageUrl(path);
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let stopped = false;
    setSrc('');
    setFailed(false);
    if (!resolved) return;
    if (/^(?:data|blob):/i.test(resolved)) {
      setSrc(resolved);
      return;
    }
    void readResource(resolved, true)
      .then(res => { if (!stopped) setSrc(res.data); })
      .catch(() => { if (!stopped) setFailed(true); });
    return () => { stopped = true; };
  }, [resolved]);

  if (!resolved || failed) {
    return <span className={`product-img-fallback ${className || ''}`} aria-label={alt}>无图</span>;
  }
  if (!src) {
    return <span className={`product-img-loading ${className || ''}`} aria-hidden="true" />;
  }
  if (onPreview) {
    return (
      <button
        type="button"
        className="product-image-zoom-btn"
        title="点击查看大图"
        aria-label={`查看大图 ${alt}`}
        onClick={e => {
          e.stopPropagation();
          onPreview(src || resolved, alt);
        }}
      >
        <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
      </button>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

function pickField(row: RawProduct, keys: string[]): any {
  for (const key of keys) {
    if (key.includes('.')) {
      const val = key.split('.').reduce<any>((acc, k) => (acc && Object.hasOwn(acc, k) ? acc[k] : undefined), row);
      if (val !== undefined && val !== null && val !== '') return val;
    } else if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }
  return undefined;
}

function replyText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const text = obj.content ?? obj.text ?? obj.message ?? obj.reply ?? obj.body;
    return typeof text === 'string' ? text.trim() : '';
  }
  return '';
}

function extractCommentReplies(comment: any): string[] {
  if (!comment || typeof comment !== 'object') return [];
  const results: string[] = [];
  for (const key of [
    'merchant_reply', 'seller_reply', 'official_reply', 'store_reply', 'admin_reply',
    'shop_reply', 'reply', 'reply_content', 'replyContent', 'merchantReply', 'sellerReply',
  ]) {
    const text = replyText(comment[key]);
    if (text) results.push(text);
  }
  for (const listKey of ['replies', 'merchant_replies', 'seller_replies']) {
    if (Array.isArray(comment[listKey])) {
      for (const item of comment[listKey]) {
        const text = replyText(item);
        if (text) results.push(text);
      }
    }
  }
  return [...new Set(results)];
}

function countMerchantReplies(row: RawProduct): number {
  const explicit = pickField(row, ['merchant_replies_count', 'seller_replies_count', 'replies_count', 'reply_count']);
  if (typeof explicit === 'number' && Number.isFinite(explicit)) return explicit;
  const list = Array.isArray(row.comments) ? row.comments : Array.isArray(row.reviews) ? row.reviews : [];
  let total = 0;
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const replies = extractCommentReplies(item);
    if (replies.length > 0) {
      total += replies.length;
    } else if (item.is_merchant || item.is_seller || item.role === 'merchant' || item.role === 'seller') {
      total += 1;
    }
  }
  if (Array.isArray(row.merchant_replies)) total = Math.max(total, row.merchant_replies.length);
  return total;
}

const NON_PRODUCT_SPEC_RE = /(?:devoluci[oó]n|motivo|pol[ií]tica|reembolso|env[ií]o|entrega|garant[ií]a|\breturns?\b|\brefunds?\b|\bpolic(?:y|ies)\b|\bshipping\b|\bdelivery\b|\bwarranty\b|\bguarantee\b|\bseller\b|\bvendor\b|退货|退款|退换|售后|运费|配送|物流|政策|店铺|商家)/i;

function normalizeSpecifications(rawSpecs: unknown): Array<{ key: string; value: string }> {
  let entries: Array<{ key: string; value: string }> = [];
  if (!rawSpecs) return entries;
  if (Array.isArray(rawSpecs)) {
    entries = rawSpecs.flatMap((item, idx) => {
      if (typeof item === 'string') {
        const sep = item.indexOf(':');
        if (sep > 0) return [{ key: item.slice(0, sep).trim(), value: item.slice(sep + 1).trim() }];
        return [{ key: `规格 ${idx + 1}`, value: item }];
      }
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const k = obj.key ?? obj.name ?? obj.label ?? obj.title ?? `规格 ${idx + 1}`;
        const v = obj.value ?? obj.val ?? obj.text ?? '';
        return [{ key: String(k).trim(), value: (typeof v === 'string' ? v : JSON.stringify(v)).trim() }];
      }
      return [];
    });
  } else if (typeof rawSpecs === 'object') {
    entries = Object.entries(rawSpecs as Record<string, unknown>).map(([key, value]) => ({
      key: key.trim(),
      value: (typeof value === 'string' ? value : JSON.stringify(value)).trim(),
    }));
  }
  return entries.filter(item => item.key && item.value && !NON_PRODUCT_SPEC_RE.test(item.key));
}

function applyImageRuleToRow(row: RawProduct, rule: ImageRule): RawProduct {
  if (rule.mode === 'main') return row;
  const targetN = rule.mode === 'first' ? 1 : Math.max(1, Math.floor(rule.nth || 2));
  const useImageUrls = !Array.isArray(row.images) && Array.isArray(row.image_urls);
  const rawList: any[] = Array.isArray(row.images) ? row.images : Array.isArray(row.image_urls) ? row.image_urls : [];
  if (!rawList.length) return row;

  let chosenIdx = -1;
  if (rawList.length >= targetN) {
    chosenIdx = targetN - 1;
  } else if (targetN >= 2 && rawList.length >= targetN - 1) {
    chosenIdx = targetN - 2;
  } else {
    return row;
  }

  const nextMain = rawList[chosenIdx];
  const nextList = rawList.slice(chosenIdx);
  const next: RawProduct = { ...row };
  if (useImageUrls) next.image_urls = nextList;
  else next.images = nextList;

  if (next.main_image !== undefined || (next.image === undefined && next.image_url === undefined && next.thumbnail === undefined)) {
    next.main_image = nextMain;
  } else if (next.image !== undefined) {
    next.image = nextMain;
  } else if (next.image_url !== undefined) {
    next.image_url = nextMain;
  } else if (next.thumbnail !== undefined) {
    next.thumbnail = nextMain;
  }
  return next;
}

function applyImageRuleToProducts(rows: RawProduct[], rule: ImageRule): RawProduct[] {
  if (rule.mode === 'main') return rows;
  return rows.map(row => applyImageRuleToRow(row, rule));
}

function normalizeDisplayProduct(row: RawProduct, index: number) {
  const title = String(pickField(row, ['name', 'title', 'product_name', 'id']) ?? `商品 #${index + 1}`);
  const id = String(pickField(row, ['id', 'asin', 'product_id', 'sku']) ?? `item-${index + 1}`);
  const price = pickField(row, ['final_price', 'price.value', 'price.amount', 'price.current', 'price']);
  const originalPrice = pickField(row, ['original_price', 'compare_at_price', 'old_price']);
  const rating = pickField(row, ['rating', 'score']);
  const comments = Array.isArray(row.comments) ? row.comments : Array.isArray(row.reviews) ? row.reviews : [];
  const reviewsCount = pickField(row, ['reviews_count', 'review_count']) ?? comments.length;
  const repliesCount = countMerchantReplies(row);
  const rawImages = Array.isArray(row.images) ? row.images : Array.isArray(row.image_urls) ? row.image_urls : [];
  const mainImage = pickField(row, ['main_image', 'image', 'image_url', 'thumbnail']) ?? rawImages[0] ?? '';
  const allImages = [...new Set([mainImage, ...rawImages].map(extractImageValue).filter(Boolean))];
  const category = String(pickField(row, ['category', 'category_name']) ?? '');
  const brand = String(pickField(row, ['brand', 'brand_name']) ?? '');
  const description = String(pickField(row, ['description', 'product_description']) ?? '');
  const features = Array.isArray(row.features) ? row.features : [];
  const specifications = normalizeSpecifications(row.specifications ?? row.specs ?? row.attributes);
  return {
    id, title, price, originalPrice, rating, reviewsCount, repliesCount,
    mainImage, allImages, category, brand, description, features, specifications, comments, raw: row,
  };
}

function parseClientProductJson(text: string): { rawJson: string; products: RawProduct[] } {
  const clean = text.replace(/^\uFEFF/, '');
  if (!clean.trim()) throw new Error('导入失败：JSON 内容为空');
  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('导入失败：JSON 格式无效');
  }
  let rows: unknown = parsed;
  if (!Array.isArray(rows) && parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    const data = obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : null;
    rows = obj.products ?? obj.productData ?? obj.items ?? data?.products ?? data?.items ?? obj.data;
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('导入失败：未识别到有效商品数组');
  }
  if (rows.some(item => !item || typeof item !== 'object' || Array.isArray(item))) {
    throw new Error('导入失败：商品条目格式无效');
  }
  return { rawJson: clean, products: rows as RawProduct[] };
}

function rebuildRawJson(previousRawJson: string, remaining: RawProduct[]): string {
  if (!remaining.length) return '';
  try {
    const parsed = JSON.parse(previousRawJson);
    if (Array.isArray(parsed)) return JSON.stringify(remaining, null, 2);
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, any>;
      if (Array.isArray(obj.products)) return JSON.stringify({ ...obj, products: remaining }, null, 2);
      if (Array.isArray(obj.productData)) return JSON.stringify({ ...obj, productData: remaining }, null, 2);
      if (Array.isArray(obj.items)) return JSON.stringify({ ...obj, items: remaining }, null, 2);
      if (obj.data && typeof obj.data === 'object') {
        if (Array.isArray(obj.data.products)) return JSON.stringify({ ...obj, data: { ...obj.data, products: remaining } }, null, 2);
        if (Array.isArray(obj.data.items)) return JSON.stringify({ ...obj, data: { ...obj.data, items: remaining } }, null, 2);
      }
      if (Array.isArray(obj.data)) return JSON.stringify({ ...obj, data: remaining }, null, 2);
    }
  } catch {}
  return JSON.stringify(remaining, null, 2);
}

function formatAmount(value: unknown): string {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '-';
  return String(value);
}

function formatRating(value: unknown): string {
  if (value === undefined || value === null || value === '') return '-';
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(1) : '-';
}

function formatDiscount(price: unknown, originalPrice: unknown): string {
  const p = Number(price);
  const orig = Number(originalPrice);
  if (!Number.isFinite(p) || !Number.isFinite(orig) || orig <= p || orig <= 0) return '';
  const pct = Math.round((1 - p / orig) * 100);
  return pct > 0 ? `${pct}% OFF` : '';
}

function discountRate(price: unknown, originalPrice: unknown): number | null {
  const p = Number(price);
  const orig = Number(originalPrice);
  if (!Number.isFinite(p) || !Number.isFinite(orig) || orig <= p || orig <= 0) return null;
  return (1 - p / orig) * 100;
}

function SortIcon({
  activeKey,
  dir,
  onAsc,
  onDesc,
}: {
  activeKey: 'price' | 'discount' | 'rating' | null;
  dir: 'asc' | 'desc';
  onAsc?: () => void;
  onDesc?: () => void;
}) {
  const ascActive = Boolean(activeKey && dir === 'asc');
  const descActive = Boolean(activeKey && dir === 'desc');
  const isDiscount = activeKey === 'discount';
  if (onAsc && onDesc) {
    const priceAsc = activeKey === 'price' && dir === 'asc';
    const priceDesc = activeKey === 'price' && dir === 'desc';
    const discAsc = activeKey === 'discount' && dir === 'asc';
    const discDesc = activeKey === 'discount' && dir === 'desc';
    return (
      <span className="products-sort-arrows products-sort-double">
        <button
          type="button"
          className="products-sort-arrow products-sort-arrow-double"
          aria-label="价格/折扣升序"
          title={priceAsc ? '价格升序（点击切换折扣升序）' : discAsc ? '折扣升序（点击取消）' : '价格升序'}
          onClick={e => { e.stopPropagation(); onAsc(); }}
        >
          <svg viewBox="0 0 14 8" width="13" height="8" aria-hidden="true">
            <path
              d="M2 6.5 7 1.5l5 5"
              fill="none"
              stroke={discAsc ? '#276843' : 'currentColor'}
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={discAsc ? 1 : 0.32}
            />
            <path
              d="M4.5 6.9 7 4.4l2.5 2.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={priceAsc ? 1 : 0.38}
            />
          </svg>
        </button>
        <button
          type="button"
          className="products-sort-arrow products-sort-arrow-double"
          aria-label="价格/折扣降序"
          title={priceDesc ? '价格降序（点击切换折扣降序）' : discDesc ? '折扣降序（点击取消）' : '价格降序'}
          onClick={e => { e.stopPropagation(); onDesc(); }}
        >
          <svg viewBox="0 0 14 8" width="13" height="8" aria-hidden="true">
            <path
              d="M4.5 1.1 7 3.6l2.5-2.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={priceDesc ? 1 : 0.38}
            />
            <path
              d="M2 1.5 7 6.5l5-5"
              fill="none"
              stroke={discDesc ? '#276843' : 'currentColor'}
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={discDesc ? 1 : 0.32}
            />
          </svg>
        </button>
      </span>
    );
  }
  return (
    <svg className="products-sort-icon" viewBox="0 0 10 14" width="10" height="14" aria-hidden="true">
      <path
        d="M1.5 5.2 5 1.6l3.5 3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={ascActive ? 1 : 0.35}
      />
      <path
        d="M1.5 8.8 5 12.4l3.5-3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={descActive ? 1 : 0.35}
      />
    </svg>
  );
}

function numericValue(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function shortError(err: unknown): string {
  const msg = (err as Error)?.message || '未知错误';
  return msg.startsWith('导入失败') ? msg : `导入失败：${msg}`;
}

export function ProductLibraryModal({ panelId }: { panelId?: string }) {
  const [mode, setMode] = useState<ImportMode>('url');
  const [urlInput, setUrlInput] = useState('');
  const [pasteInput, setPasteInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [rawJson, setRawJson] = useState('');
  const [sourceProducts, setSourceProducts] = useState<RawProduct[]>([]);
  const [imageRule, setImageRule] = useState<ImageRule>({ mode: 'main', nth: 2 });
  const [draftRule, setDraftRule] = useState<ImageRule>({ mode: 'main', nth: 2 });
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [checkedIndices, setCheckedIndices] = useState<Set<number>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [sortState, setSortState] = useState<{ key: 'price' | 'discount' | 'rating' | null; dir: 'asc' | 'desc' }>({ key: null, dir: 'asc' });
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number; name: string } | null>(null);
  const filePickerRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const imageMenuRef = useRef<HTMLDivElement>(null);

  const products = useMemo(() => applyImageRuleToProducts(sourceProducts, imageRule), [sourceProducts, imageRule]);

  useEffect(() => {
    if (!imageMenuOpen) return;
    const onPointer = (e: Event) => {
      if (imageMenuRef.current && e.target instanceof Node && imageMenuRef.current.contains(e.target)) return;
      setImageMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setImageMenuOpen(false); };
    document.addEventListener('pointerdown', onPointer, true);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [imageMenuOpen]);

  useEffect(() => {
    const blockContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    document.addEventListener('contextmenu', blockContextMenu, true);
    return () => document.removeEventListener('contextmenu', blockContextMenu, true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      else if (e.key === 'ArrowLeft' && lightbox.images.length > 1) {
        setLightbox(prev => prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null);
      } else if (e.key === 'ArrowRight' && lightbox.images.length > 1) {
        setLightbox(prev => prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  useEffect(() => {
    if (selectedIndex !== null) {
      mainRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [selectedIndex]);

  const openImagePreview = (images: string[], index: number, name: string) => {
    const list = images.filter(Boolean);
    if (!list.length) return;
    setLightbox({ images: list, index: Math.max(0, Math.min(index, list.length - 1)), name });
  };

  const displayRows = useMemo(() => {
    const mapped = products.map((row, origIdx) => ({ row, origIdx, item: normalizeDisplayProduct(row, origIdx) }));
    if (!sortState.key) return mapped;
    const key = sortState.key;
    const factor = sortState.dir === 'asc' ? 1 : -1;
    return [...mapped].sort((a, b) => {
      const va = key === 'discount'
        ? discountRate(a.item.price, a.item.originalPrice)
        : numericValue(key === 'price' ? a.item.price : a.item.rating);
      const vb = key === 'discount'
        ? discountRate(b.item.price, b.item.originalPrice)
        : numericValue(key === 'price' ? b.item.price : b.item.rating);
      if (va === null && vb === null) return a.origIdx - b.origIdx;
      if (va === null) return 1;
      if (vb === null) return -1;
      if (va === vb) return a.origIdx - b.origIdx;
      return (va - vb) * factor;
    });
  }, [products, sortState]);

  const handlePriceDir = (dir: 'asc' | 'desc') => {
    setSortState(prev => {
      if ((prev.key !== 'price' && prev.key !== 'discount') || prev.dir !== dir) {
        return { key: 'price', dir };
      }
      if (prev.key === 'price') return { key: 'discount', dir };
      return { key: null, dir: 'asc' };
    });
  };

  const togglePriceSort = () => {
    handlePriceDir(sortState.key === 'price' || sortState.key === 'discount' ? sortState.dir : 'asc');
  };

  const toggleRatingSort = () => {
    setSortState(prev => {
      if (prev.key !== 'rating') return { key: 'rating', dir: 'asc' };
      if (prev.dir === 'asc') return { key: 'rating', dir: 'desc' };
      return { key: null, dir: 'asc' };
    });
  };

  const loadParsed = (nextRaw: string, nextProducts: RawProduct[]) => {
    setRawJson(nextRaw);
    setSourceProducts(nextProducts);
    setCheckedIndices(new Set());
    setSelectedIndex(null);
    setSortState({ key: null, dir: 'asc' });
    setImageMenuOpen(false);
    setToast({ kind: 'success', text: `导入成功（已加载 ${nextProducts.length} 件商品）` });
  };

  const handleFetchUrl = async () => {
    if (!urlInput.trim() || loading) return;
    setLoading(true);
    setToast(null);
    try {
      const result = await pluginControl({ type: 'products', action: 'fetch', url: urlInput.trim() });
      loadParsed(result.raw_json, result.products);
    } catch (err) {
      setToast({ kind: 'error', text: shortError(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (file: File) => {
    setToast(null);
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = parseClientProductJson(text);
      loadParsed(parsed.rawJson, parsed.products);
    } catch (err) {
      setToast({ kind: 'error', text: shortError(err) });
    }
  };

  const handleParsePaste = () => {
    setToast(null);
    try {
      const parsed = parseClientProductJson(pasteInput);
      loadParsed(parsed.rawJson, parsed.products);
    } catch (err) {
      setToast({ kind: 'error', text: shortError(err) });
    }
  };

  const toggleRowCheck = (idx: number) => {
    setCheckedIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const allChecked = products.length > 0 && checkedIndices.size === products.length;
  const toggleAllChecks = () => {
    if (allChecked) setCheckedIndices(new Set());
    else setCheckedIndices(new Set(products.map((_, idx) => idx)));
  };

  const handleImport = async () => {
    const selectedItems = products.filter((_, idx) => checkedIndices.has(idx));
    if (!rawJson || selectedItems.length === 0 || busy) return;
    if (!panelId) {
      setToast({ kind: 'error', text: '导入失败：缺少面板上下文' });
      return;
    }
    const selectedRawJson = selectedItems.length === products.length && imageRule.mode === 'main'
      ? rawJson
      : rebuildRawJson(rawJson, selectedItems);
    setBusy(true);
    setToast(null);
    try {
      await pluginControl({ type: 'products', action: 'import', panel_id: panelId, raw_json: selectedRawJson });
      try {
        const ch = new BroadcastChannel('website-builder:products');
        ch.postMessage({ type: 'imported', panelId });
        ch.close();
      } catch {}
      try {
        localStorage.setItem(`website-builder:products-sync:${panelId}`, String(Date.now()));
      } catch {}
      setToast({ kind: 'success', text: `导入成功（${selectedItems.length} 件商品）` });
      await closePluginModal();
    } catch (err) {
      setToast({ kind: 'error', text: shortError(err) });
    } finally {
      setBusy(false);
    }
  };

  const selectedProduct = selectedIndex !== null && products[selectedIndex]
    ? normalizeDisplayProduct(products[selectedIndex], selectedIndex)
    : null;

  return (
    <section className="plugin-modal settings-modal products-modal" role="dialog" aria-modal="true" aria-labelledby="products-title">
      {toast && (
        <div className={`message products-toast${toast.kind === 'error' ? ' error' : ''}`} role={toast.kind === 'error' ? 'alert' : 'status'}>
          <span>{toast.text}</span>
          <button type="button" aria-label="关闭提示" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      <header>
        <div>
          <h2 id="products-title">商品库</h2>
        </div>
      </header>

      <div className="settings-main products-main" ref={mainRef}>
        {selectedProduct ? (
          <div className="product-detail-view">
            <div className="product-detail-hero">
              <div className="product-detail-main-img">
                <CdnImage path={selectedProduct.mainImage} alt={selectedProduct.title} onPreview={() => openImagePreview(selectedProduct.allImages, 0, selectedProduct.title)} />
              </div>
              <div className="product-detail-meta">
                <h3>{selectedProduct.title}</h3>
                <div className="product-detail-badges">
                  <span>ID：{selectedProduct.id}</span>
                  {selectedProduct.brand && <span>品牌：{selectedProduct.brand}</span>}
                  {selectedProduct.category && <span>分类：{selectedProduct.category}</span>}
                </div>
                <div className="product-detail-prices">
                  {selectedProduct.price !== undefined && selectedProduct.price !== null && selectedProduct.price !== '' ? (
                    <strong className="product-price">{formatAmount(selectedProduct.price)}</strong>
                  ) : (
                    <span className="product-missing-price">缺失</span>
                  )}
                  {selectedProduct.originalPrice !== undefined && selectedProduct.originalPrice !== null && selectedProduct.originalPrice !== '' && (
                    <del className="product-original-price">{formatAmount(selectedProduct.originalPrice)}</del>
                  )}
                  {formatDiscount(selectedProduct.price, selectedProduct.originalPrice) && (
                    <span className="product-discount-badge">{formatDiscount(selectedProduct.price, selectedProduct.originalPrice)}</span>
                  )}
                </div>
                <div className="product-detail-stats">
                  <span>评分：{formatRating(selectedProduct.rating)}</span>
                  <span>评论数：{selectedProduct.reviewsCount}</span>
                  <span>商家回复数：{selectedProduct.repliesCount}</span>
                </div>
                {selectedProduct.description && <p className="product-detail-desc">{selectedProduct.description}</p>}
              </div>
            </div>

            {selectedProduct.allImages.length > 0 && (
              <div className="product-detail-section">
                <h4>图片列表（{selectedProduct.allImages.length}）</h4>
                <div className="product-gallery-grid">
                  {selectedProduct.allImages.map((imgPath, idx) => (
                    <div key={`${imgPath}-${idx}`} className="product-gallery-item" title={resolveCdnImageUrl(imgPath)}>
                      <CdnImage path={imgPath} alt={`${selectedProduct.title} 图片 ${idx + 1}`} onPreview={() => openImagePreview(selectedProduct.allImages, idx, selectedProduct.title)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedProduct.features.length > 0 && (
              <div className="product-detail-section">
                <h4>商品特性</h4>
                <ul className="product-feature-list">
                  {selectedProduct.features.map((feat, idx) => (
                    <li key={idx}>{typeof feat === 'string' ? feat : JSON.stringify(feat)}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedProduct.specifications.length > 0 && (
              <div className="product-detail-section">
                <h4>规格参数</h4>
                <div className="product-spec-list">
                  {selectedProduct.specifications.map((spec, idx) => (
                    <div key={idx} className="product-spec-row">
                      <span className="product-spec-key">{spec.key}</span>
                      <span className="product-spec-val">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedProduct.comments.length > 0 && (
              <div className="product-detail-section">
                <h4>用户评论（{selectedProduct.comments.length}）</h4>
                <div className="product-comment-list">
                  {selectedProduct.comments.map((comment: any, idx: number) => {
                    const replies = extractCommentReplies(comment);
                    return (
                      <article key={idx} className="product-comment-item">
                        <div className="product-comment-head">
                          <strong>{comment?.user_name || comment?.author || '匿名用户'}</strong>
                          <span>评分：{formatRating(comment?.rating)}</span>
                          {comment?.date && <time>{comment.date}</time>}
                        </div>
                        <p>{comment?.content || comment?.text || ''}</p>
                        {replies.map((replyStr, rIdx) => (
                          <div key={rIdx} className="product-merchant-reply">
                            <span>{replyStr}</span>
                          </div>
                        ))}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="products-mode-tabs" role="tablist" aria-label="商品数据导入方式">
              <button type="button" role="tab" aria-selected={mode === 'url'} className={mode === 'url' ? 'is-active' : ''} onClick={() => setMode('url')}>
                链接导入
              </button>
              <button type="button" role="tab" aria-selected={mode === 'file'} className={mode === 'file' ? 'is-active' : ''} onClick={() => setMode('file')}>
                文件导入
              </button>
              <button type="button" role="tab" aria-selected={mode === 'paste'} className={mode === 'paste' ? 'is-active' : ''} onClick={() => setMode('paste')}>
                粘贴导入
              </button>
            </div>

            <div className="settings-section settings-group">
              {mode === 'url' && (
                <div className="products-url-row">
                  <div className="products-url-field">
                    <input
                      type="text"
                      aria-label="商品接口地址"
                      placeholder="example.com"
                      value={urlInput}
                      disabled={loading || busy}
                      onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void handleFetchUrl(); } }}
                    />
                  </div>
                  <button type="button" className="primary products-fetch-btn" disabled={!urlInput.trim() || loading || busy} onClick={() => void handleFetchUrl()}>
                    {loading ? '获取中…' : '获取数据'}
                  </button>
                </div>
              )}

              {mode === 'file' && (
                <div
                  className="products-file-dropzone"
                  onDragOver={e => { e.preventDefault(); }}
                  onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) void handleFile(file);
                  }}
                >
                  <input
                    ref={filePickerRef}
                    type="file"
                    accept=".json,.txt,application/json,text/plain"
                    hidden
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) void handleFile(file);
                      e.target.value = '';
                    }}
                  />
                  <p>{fileName ? `已选择文件：${fileName}` : '选择或拖拽 JSON / TXT 文件'}</p>
                  <button type="button" className="settings-btn-secondary" disabled={busy} onClick={() => filePickerRef.current?.click()}>
                    选择文件
                  </button>
                </div>
              )}

              {mode === 'paste' && (
                <div className="products-paste-box">
                  <textarea
                    rows={5}
                    aria-label="粘贴导入"
                    placeholder="粘贴JSON格式商品数据"
                    value={pasteInput}
                    disabled={busy}
                    onChange={e => setPasteInput(e.target.value)}
                  />
                  <div className="products-paste-actions">
                    <button type="button" className="primary" disabled={!pasteInput.trim() || busy} onClick={handleParsePaste}>
                      解析并预览
                    </button>
                  </div>
                </div>
              )}
            </div>

            {products.length > 0 && (
              <div className="products-table-wrap">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th className="col-check" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" aria-label="全选商品" checked={allChecked} onChange={toggleAllChecks} />
                      </th>
                      <th>商品图</th>
                      <th>商品标题</th>
                      <th>
                        <div className="products-sort-cell">
                          <button type="button" className="products-sort-btn" onClick={togglePriceSort}>
                            <span>价格</span>
                          </button>
                          <SortIcon
                            activeKey={sortState.key === 'price' || sortState.key === 'discount' ? sortState.key : null}
                            dir={sortState.dir}
                            onAsc={() => handlePriceDir('asc')}
                            onDesc={() => handlePriceDir('desc')}
                          />
                        </div>
                      </th>
                      <th>
                        <button type="button" className="products-sort-btn" onClick={toggleRatingSort}>
                          <span>评分</span>
                          <SortIcon activeKey={sortState.key === 'rating' ? 'rating' : null} dir={sortState.dir} />
                        </button>
                      </th>
                      <th>评论</th>
                      <th className="col-images-th">
                        <div className="products-th-images-wrap" ref={imageMenuRef}>
                          <span>图片列表</span>
                          <button
                            type="button"
                            className="products-img-settings-btn"
                            aria-label="图片列表设置"
                            aria-expanded={imageMenuOpen}
                            title="主图与图片列表设置"
                            onClick={e => {
                              e.stopPropagation();
                              if (!imageMenuOpen) setDraftRule(imageRule);
                              setImageMenuOpen(open => !open);
                            }}
                          >
                            <Icon name="settings" />
                          </button>
                          {imageMenuOpen && (
                            <div className="products-image-settings-popover" role="dialog" aria-label="图片列表设置" onClick={e => e.stopPropagation()}>
                              <label className="products-img-opt">
                                <input
                                  type="radio"
                                  name="product-image-rule"
                                  checked={draftRule.mode === 'main'}
                                  onChange={() => setDraftRule(prev => ({ ...prev, mode: 'main' }))}
                                />
                                <span>使用主图</span>
                              </label>
                              <label className="products-img-opt">
                                <input
                                  type="radio"
                                  name="product-image-rule"
                                  checked={draftRule.mode === 'first'}
                                  onChange={() => setDraftRule(prev => ({ ...prev, mode: 'first' }))}
                                />
                                <span>使用第一张图作为主图</span>
                              </label>
                              <label className="products-img-opt products-img-opt-nth">
                                <input
                                  type="radio"
                                  name="product-image-rule"
                                  checked={draftRule.mode === 'nth'}
                                  onChange={() => setDraftRule(prev => ({ ...prev, mode: 'nth' }))}
                                />
                                <span>使用第</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={99}
                                  className="products-img-nth-input"
                                  aria-label="第N张图"
                                  value={draftRule.nth}
                                  onFocus={() => setDraftRule(prev => ({ ...prev, mode: 'nth' }))}
                                  onChange={e => {
                                    const val = parseInt(e.target.value, 10);
                                    setDraftRule({ mode: 'nth', nth: Number.isFinite(val) && val >= 1 ? val : 1 });
                                  }}
                                />
                                <span>张图作为主图</span>
                              </label>
                              <div className="products-img-settings-footer">
                                <button
                                  type="button"
                                  className="primary"
                                  onClick={() => {
                                    setImageRule({ ...draftRule, nth: Math.max(1, Math.floor(draftRule.nth || 2)) });
                                    setImageMenuOpen(false);
                                  }}
                                >
                                  确认
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map(({ origIdx, item }) => {
                      const hasPrice = item.price !== undefined && item.price !== null && item.price !== '';
                      const hasOriginal = item.originalPrice !== undefined && item.originalPrice !== null && item.originalPrice !== '';
                      const discount = formatDiscount(item.price, item.originalPrice);
                      return (
                        <tr key={`${item.id}-${origIdx}`} onClick={() => setSelectedIndex(origIdx)}>
                          <td className="col-check" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              aria-label={`选择 ${item.title}`}
                              checked={checkedIndices.has(origIdx)}
                              onChange={() => toggleRowCheck(origIdx)}
                            />
                          </td>
                          <td className="col-thumb">
                            <div className="product-thumb-box">
                              <CdnImage path={item.mainImage} alt={item.title} onPreview={() => openImagePreview(item.allImages, 0, item.title)} />
                            </div>
                          </td>
                          <td className="col-title">
                            <div className="product-title-text" title={item.title}>{item.title}</div>
                          </td>
                          <td className="col-price">
                            <div className="product-price-line">
                              {hasPrice ? (
                                <span className="product-price">{formatAmount(item.price)}</span>
                              ) : (
                                <span className="product-missing-price">缺失</span>
                              )}
                              {hasOriginal && (
                                <del className="product-original-price">{formatAmount(item.originalPrice)}</del>
                              )}
                            </div>
                            {discount && (
                              <div className="product-discount-row">
                                <span className="product-discount-badge">{discount}</span>
                              </div>
                            )}
                          </td>
                          <td className="col-rating">{formatRating(item.rating)}</td>
                          <td className="col-reviews">
                            <div className="product-reviews-inline">
                              <span>{item.reviewsCount}评</span>
                              <span className="product-reply-badge">{item.repliesCount}回复</span>
                            </div>
                          </td>
                          <td className="col-images">
                            <div className="product-mini-gallery">
                              {item.allImages.slice(0, 3).map((img, i) => (
                                <span key={i} className="product-mini-thumb">
                                  <CdnImage path={img} alt={`${item.title} 图片 ${i + 1}`} onPreview={() => openImagePreview(item.allImages, i, item.title)} />
                                </span>
                              ))}
                              {item.allImages.length > 3 && (
                                <span className="product-mini-more">+{item.allImages.length - 3}</span>
                              )}
                              {item.allImages.length === 0 && <span>-</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <footer>
        {selectedProduct ? (
          (() => {
            const currentPos = displayRows.findIndex(r => r.origIdx === selectedIndex);
            const hasNext = currentPos >= 0 && currentPos < displayRows.length - 1;
            return (
              <>
                <button type="button" className="settings-btn-secondary" disabled={busy} onClick={() => setSelectedIndex(null)}>
                  返回
                </button>
                <button
                  type="button"
                  className="primary"
                  disabled={busy || !hasNext}
                  onClick={() => {
                    if (hasNext) setSelectedIndex(displayRows[currentPos + 1].origIdx);
                  }}
                >
                  下一个
                </button>
              </>
            );
          })()
        ) : (
          <>
            {products.length > 0 && <p>已加载 {products.length} 件商品</p>}
            {products.length > 0 && <span className="products-selected-count">已选 {checkedIndices.size} 项</span>}
            <button type="button" className="settings-btn-secondary" disabled={busy} onClick={() => void closePluginModal()}>
              取消
            </button>
            <button type="button" className="primary" disabled={!rawJson || checkedIndices.size === 0 || busy} onClick={() => void handleImport()}>
              {busy ? '导入中…' : '导入'}
            </button>
          </>
        )}
      </footer>

      {lightbox && (
        <div className="prompt-lightbox-overlay products-lightbox-overlay" role="dialog" aria-modal="true" aria-label="图片预览" onClick={() => setLightbox(null)}>
          <div className="prompt-lightbox-box products-lightbox-box">
            <div className="products-lightbox-stage">
              {lightbox.images.length > 1 && (
                <button
                  type="button"
                  className="products-lightbox-nav prev"
                  aria-label="上一张"
                  onClick={e => {
                    e.stopPropagation();
                    setLightbox(prev => prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null);
                  }}
                >
                  ‹
                </button>
              )}
              <div className="products-lightbox-main" onClick={e => { if (e.target === e.currentTarget) setLightbox(null); }}>
                <div className="products-lightbox-img-wrap" onClick={e => e.stopPropagation()}>
                  <CdnImage path={lightbox.images[lightbox.index]} alt={lightbox.name} />
                </div>
              </div>
              {lightbox.images.length > 1 && (
                <button
                  type="button"
                  className="products-lightbox-nav next"
                  aria-label="下一张"
                  onClick={e => {
                    e.stopPropagation();
                    setLightbox(prev => prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null);
                  }}
                >
                  ›
                </button>
              )}
            </div>
            {lightbox.images.length > 1 && (
              <div className="products-lightbox-thumbs" onClick={e => e.stopPropagation()}>
                {lightbox.images.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    type="button"
                    className={`products-lightbox-thumb${i === lightbox.index ? ' is-active' : ''}`}
                    aria-label={`切换到第 ${i + 1} 张图片`}
                    onClick={() => setLightbox(prev => prev ? { ...prev, index: i } : null)}
                  >
                    <CdnImage path={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="products-lightbox-actions" onClick={e => e.stopPropagation()}>
            <button type="button" className="primary" onClick={() => setLightbox(null)}>
              关闭预览
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
