import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icons';
import { LOCALE_PRESETS, CountryFlag } from './locales';
import { openPluginModal } from './plugin-modal';
import { ImagePreviewPanel } from './ImagePreviewPanel';
import type { App } from '@modelcontextprotocol/ext-apps';

export type PromptContent = Parameters<App['sendMessage']>[0]['content'];
export type CreatedProject = {project_id:string;thread_id:string|null;name:string;directory:string};
export type VerificationMode = 'auto'|'manual';
export type PromptOptions = {
  verificationMode: VerificationMode;
  colorTheme: string;
  colorThemeLabel?: string;
  colorPalette?: string[];
  country?: string;
  language?: string;
  localeLabel?: string;
  hasProductLibrary?: boolean;
  productCount?: number;
};

export type StagedProductsInfo = {
  count: number;
  size: number;
  updated_at?: string;
};

const DATA_CHIP_ICON = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2f5a44" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13c-.8 0-1 .5-1 1.2v.6c0 .5-.4.9-.9.9.5 0 .9.4.9.9v.6c0 .7.2 1.2 1 1.2"/><path d="M15 13c.8 0 1 .5 1 1.2v.6c0 .5.4.9.9.9-.5 0-.9.4-.9.9v.6c0 .7-.2 1.2-1 1.2"/></svg>'
);

const COLOR_PRESETS = [
  { id: 'auto', label: '自动', color: '' },
  { id: 'forest', label: '森林绿', color: '#1b4332' },
  { id: 'obsidian', label: '曜石黑', color: '#141619' },
  { id: 'ocean', label: '深海蓝', color: '#1d4ed8' },
  { id: 'indigo', label: '科技靛', color: '#4338ca' },
  { id: 'slate', label: '极简灰', color: '#475569' },
  { id: 'terra', label: '赤陶棕', color: '#7c4a36' },
  { id: 'burgundy', label: '酒红', color: '#881337' },
  { id: 'coral', label: '珊瑚红', color: '#dc2626' },
  { id: 'amber', label: '琥珀橙', color: '#d97706' },
  { id: 'sage', label: '鼠尾草绿', color: '#4d7c0f' },
  { id: 'teal', label: '松石青', color: '#0f766e' },
  { id: 'violet', label: '暮光紫', color: '#6d28d9' },
  { id: 'rose', label: '玫瑰粉', color: '#be185d' },
] as const;

const VERIFICATION_MODE_STORAGE_KEY = 'website-builder:verification-mode';
const COLOR_ID_STORAGE_KEY = 'website-builder:color-id';
const LOCALE_ID_STORAGE_KEY = 'website-builder:locale-id';
const PROMPT_DRAFT_STORAGE_KEY = 'website-builder:prompt-draft';

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {}
}

const VERIFICATION_MODES = [
  { id: 'auto' as const, label: '自动验证', icon: 'sparkles' as const, desc: '生成后自动执行网站全流程检查，确保页面与交互正常' },
  { id: 'manual' as const, label: '手动验证', icon: 'bolt' as const, desc: '仅生成商品、图片与页面，由用户手动验证页面与功能逻辑' },
];

interface FileEntry {
  file: File;
  previewUrl?: string;
}

function extractPromptContent(root: HTMLElement, includeChips = true): { text: string; orderedFileIds: string[] } {
  let text = '';
  const orderedFileIds: string[] = [];

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.classList.contains('prompt-chip')) {
        const fileName = el.dataset.fileName || 'file';
        const fileId = el.dataset.fileId;
        if (fileId) orderedFileIds.push(fileId);
        if (includeChips) text += `[${fileName}]`;
        return;
      }
      if (el.tagName === 'BR') {
        text += '\n';
        return;
      }
      const isBlock = /^(DIV|P|LI|TR)$/i.test(el.tagName);
      if (isBlock && text && !text.endsWith('\n')) {
        text += '\n';
      }
      for (const child of Array.from(el.childNodes)) {
        walk(child);
      }
      if (isBlock && text && !text.endsWith('\n')) {
        text += '\n';
      }
    }
  }

  walk(root);
  return {
    text: text.replace(/\u00A0/g, ' ').replace(/\u200B/g, '').trim(),
    orderedFileIds
  };
}

export function ProjectPrompt({send,onCreated,stagedProducts,onClearStagedProducts}:{send:(text:string,content:PromptContent,signal:AbortSignal,files:File[],options?:PromptOptions)=>Promise<CreatedProject>;onCreated:(project:CreatedProject)=>void;stagedProducts?:StagedProductsInfo|null;onClearStagedProducts?:()=>void}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const filesMap = useRef<Map<string, FileEntry>>(new Map());
  const [hasContent, setHasContent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);
  const [verificationMode, setVerificationMode] = useState<VerificationMode>(() => {
    const saved = readStorage(VERIFICATION_MODE_STORAGE_KEY);
    return saved === 'auto' || saved === 'manual' ? saved : 'auto';
  });
  const [colorId, setColorId] = useState<string>(() => {
    const saved = readStorage(COLOR_ID_STORAGE_KEY);
    return saved && COLOR_PRESETS.some(c => c.id === saved) ? saved : 'auto';
  });
  const [localeId, setLocaleId] = useState<string>(() => {
    const saved = readStorage(LOCALE_ID_STORAGE_KEY);
    return saved && LOCALE_PRESETS.some(l => l.id === saved) ? saved : 'auto';
  });
  const [menu, setMenu] = useState<'locale'|'color'|'mode'|null>(null);
  const [localeQuery, setLocaleQuery] = useState('');
  const [menuStyle, setMenuStyle] = useState<{left?:number;right?:number;top?:number;bottom?:number}>({});
  const localeBtn = useRef<HTMLButtonElement>(null);
  const colorBtn = useRef<HTMLButtonElement>(null);
  const modeBtn = useRef<HTMLButtonElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const operation = useRef<AbortController|null>(null);
  const locked = useRef(false);
  const savedRange = useRef<Range|null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    const savedDraft = readStorage(PROMPT_DRAFT_STORAGE_KEY);
    if (editor && savedDraft && !editor.textContent) {
      editor.textContent = savedDraft;
      setHasContent(true);
    }
    return () => {
      operation.current?.abort();
      for (const entry of filesMap.current.values()) {
        if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.prompt-menu-popover, .prompt-menu-trigger')) return;
      setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('pointerdown', close, true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', () => setMenu(null), { once: true });
    return () => {
      document.removeEventListener('pointerdown', close, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const toggleMenu = (kind: 'locale'|'color'|'mode', anchor: HTMLButtonElement | null) => {
    if (menu === kind) { setMenu(null); return; }
    if (!anchor) return;
    if (kind === 'locale') setLocaleQuery('');
    const rect = anchor.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 280 && rect.top > spaceBelow;
    const basePos = openUp ? { bottom: window.innerHeight - rect.top + 8 } : { top: rect.bottom + 8 };
    if (kind === 'locale') {
      setMenuStyle({ ...basePos, left: Math.max(12, Math.min(rect.left, window.innerWidth - 260)) });
    } else {
      setMenuStyle({ ...basePos, right: Math.max(12, window.innerWidth - rect.right) });
    }
    setMenu(kind);
  };

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedRange.current = range.cloneRange();
      }
    }
  }, []);

  const handleEditorChange = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const presentIds = new Set(
      Array.from(editor.querySelectorAll('.prompt-chip'))
        .map(el => (el as HTMLElement).dataset.fileId)
        .filter(Boolean) as string[]
    );
    for (const [id, entry] of filesMap.current.entries()) {
      if (!presentIds.has(id)) {
        if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
        filesMap.current.delete(id);
      }
    }
    if (stagedProducts && !presentIds.has('product-library')) {
      onClearStagedProducts?.();
    }
    const { text, orderedFileIds } = extractPromptContent(editor);
    const { text: draftText } = extractPromptContent(editor, false);
    writeStorage(PROMPT_DRAFT_STORAGE_KEY, draftText);
    const empty = !text && orderedFileIds.length === 0 && filesMap.current.size === 0 && !presentIds.has('product-library');
    if (empty && editor.innerHTML !== '') editor.innerHTML = '';
    setHasContent(!empty);
    saveSelection();
  }, [saveSelection, stagedProducts, onClearStagedProducts]);

  const removeProductLibraryChip = useCallback(() => {
    const chip = editorRef.current?.querySelector('.prompt-chip[data-chip-kind="product-library"]');
    if (chip) chip.remove();
    onClearStagedProducts?.();
    const editor = editorRef.current;
    if (editor) {
      const { text, orderedFileIds } = extractPromptContent(editor);
      const empty = !text && orderedFileIds.length === 0 && filesMap.current.size === 0;
      if (empty && editor.innerHTML !== '') editor.innerHTML = '';
      setHasContent(!empty);
    }
  }, [onClearStagedProducts]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const existing = editor.querySelector('.prompt-chip[data-chip-kind="product-library"]') as HTMLElement | null;
    if (!stagedProducts) {
      if (existing) {
        existing.remove();
        handleEditorChange();
      }
      return;
    }
    const displayLabel = `${stagedProducts.count}件商品`;
    const outputLabel = `商品${stagedProducts.count}件`;
    if (existing) {
      existing.dataset.fileName = outputLabel;
      const titleEl = existing.querySelector('.chip-title');
      if (titleEl) {
        titleEl.textContent = displayLabel;
        (titleEl as HTMLElement).title = displayLabel;
      }
      return;
    }
    const chip = document.createElement('span');
    chip.className = 'prompt-chip prompt-chip-products';
    chip.contentEditable = 'false';
    chip.dataset.chipKind = 'product-library';
    chip.dataset.fileId = 'product-library';
    chip.dataset.fileName = outputLabel;

    const iconWrap = document.createElement('span');
    iconWrap.className = 'chip-icon';
    const thumb = document.createElement('img');
    thumb.className = 'chip-data-icon';
    thumb.src = DATA_CHIP_ICON;
    thumb.alt = '商品数据';
    iconWrap.appendChild(thumb);
    chip.appendChild(iconWrap);

    const title = document.createElement('span');
    title.className = 'chip-title';
    title.title = displayLabel;
    title.textContent = displayLabel;
    chip.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'chip-close';
    closeBtn.setAttribute('aria-label', `移除 ${displayLabel}`);
    closeBtn.title = '删除';
    closeBtn.innerHTML = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5"/></svg>';
    closeBtn.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      removeProductLibraryChip();
    };
    chip.appendChild(closeBtn);

    const fragment = document.createDocumentFragment();
    fragment.appendChild(document.createTextNode('\u200B'));
    fragment.appendChild(chip);
    fragment.appendChild(document.createTextNode('\u00A0'));
    editor.appendChild(fragment);
    setHasContent(true);
    saveSelection();
  }, [stagedProducts, removeProductLibraryChip, handleEditorChange, saveSelection]);

  const removeFile = useCallback((fileId: string) => {
    const chip = editorRef.current?.querySelector(`.prompt-chip[data-file-id="${fileId}"]`);
    if (chip) chip.remove();
    const entry = filesMap.current.get(fileId);
    if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
    filesMap.current.delete(fileId);
    handleEditorChange();
  }, [handleEditorChange]);

  const createChip = useCallback((fileId: string, file: File, previewUrl?: string) => {
    const chip = document.createElement('span');
    chip.className = 'prompt-chip';
    chip.contentEditable = 'false';
    chip.dataset.fileId = fileId;
    chip.dataset.fileName = file.name;

    const isImage = file.type.startsWith('image/');
    if (isImage && previewUrl) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip-thumb-btn';
      btn.title = '放大查看图片';
      btn.setAttribute('aria-label', `放大查看图片 ${file.name}`);
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        void openPluginModal('image-preview', { url: previewUrl, name: file.name }, false).then(opened => {
          if (!opened) {
            setLightbox({ url: previewUrl, name: file.name });
          }
        });
      };
      const img = document.createElement('img');
      img.className = 'chip-thumb';
      img.src = previewUrl;
      img.alt = file.name;
      btn.appendChild(img);
      chip.appendChild(btn);
    } else {
      const icon = document.createElement('span');
      icon.className = 'chip-icon';
      icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
      chip.appendChild(icon);
    }

    const title = document.createElement('span');
    title.className = 'chip-title';
    title.title = file.name;
    title.textContent = file.name;
    chip.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'chip-close';
    closeBtn.setAttribute('aria-label', `移除 ${file.name}`);
    closeBtn.title = '删除';
    closeBtn.innerHTML = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5"/></svg>';
    closeBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeFile(fileId);
    };
    chip.appendChild(closeBtn);

    return chip;
  }, [removeFile]);

  const insertFiles = useCallback((newFiles: File[]) => {
    const currentTotal = filesMap.current.size + newFiles.length;
    const currentSize = Array.from(filesMap.current.values()).reduce((sum, e) => sum + e.file.size, 0)
      + newFiles.reduce((sum, f) => sum + f.size, 0);

    if (currentTotal > 10 || currentSize > 12 * 1024 * 1024) {
      setError('最多选择10个文件，总大小不超过12MB。');
      return;
    }
    setError('');

    const editor = editorRef.current;
    if (!editor) return;

    let range: Range | null = null;
    const sel = window.getSelection();
    if (savedRange.current && editor.contains(savedRange.current.commonAncestorContainer)) {
      range = savedRange.current;
    } else if (sel && sel.rangeCount > 0 && editor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      range = sel.getRangeAt(0);
    }

    const fragment = document.createDocumentFragment();
    for (const file of newFiles) {
      const fileId = `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      filesMap.current.set(fileId, { file, previewUrl });

      const chip = createChip(fileId, file, previewUrl);
      fragment.appendChild(document.createTextNode('\u200B'));
      fragment.appendChild(chip);
      fragment.appendChild(document.createTextNode('\u00A0'));
    }

    if (range) {
      range.deleteContents();
      const lastNode = fragment.lastChild;
      range.insertNode(fragment);
      if (lastNode) {
        const newRange = document.createRange();
        newRange.setStartAfter(lastNode);
        newRange.setEndAfter(lastNode);
        sel?.removeAllRanges();
        sel?.addRange(newRange);
        savedRange.current = newRange.cloneRange();
      }
    } else {
      editor.appendChild(fragment);
      const newRange = document.createRange();
      newRange.selectNodeContents(editor);
      newRange.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(newRange);
      savedRange.current = newRange.cloneRange();
    }

    editor.focus();
    handleEditorChange();
  }, [createChip, handleEditorChange]);

  const submit = async () => {
    if (locked.current || pending) return;
    const editor = editorRef.current;
    if (!editor) return;

    const { text: rawPromptText, orderedFileIds } = extractPromptContent(editor);
    const hasProductChip = Boolean(stagedProducts && editor.querySelector('.prompt-chip[data-chip-kind="product-library"]'));
    const rawOrderedFiles = orderedFileIds
      .map(id => filesMap.current.get(id)?.file)
      .filter((f): f is File => Boolean(f));

    for (const [id, entry] of filesMap.current.entries()) {
      if (!orderedFileIds.includes(id)) {
        rawOrderedFiles.push(entry.file);
      }
    }

    if (!rawPromptText && rawOrderedFiles.length === 0 && !hasProductChip) return;

    let promptText = rawPromptText;
    let orderedFiles = rawOrderedFiles;
    if (hasProductChip) {
      const usedNames = new Set<string>(['data.json']);
      orderedFiles = rawOrderedFiles.map(file => {
        let targetName = file.name;
        if (usedNames.has(targetName.toLowerCase())) {
          const dot = targetName.lastIndexOf('.');
          const stem = dot > 0 ? targetName.slice(0, dot) : targetName;
          const ext = dot > 0 ? targetName.slice(dot) : '';
          let seq = 1;
          while (usedNames.has(`${stem}_${seq}${ext}`.toLowerCase())) seq++;
          targetName = `${stem}_${seq}${ext}`;
          promptText = promptText.split(`[${file.name}]`).join(`[${targetName}]`);
        }
        usedNames.add(targetName.toLowerCase());
        return targetName === file.name ? file : new File([file], targetName, { type: file.type, lastModified: file.lastModified });
      });
    }

    locked.current = true;
    setPending(true);
    setError('');

    const controller = new AbortController();
    operation.current = controller;

    try {
      const selectedColor = COLOR_PRESETS.find(item => item.id === colorId);
      const selectedLocale = LOCALE_PRESETS.find(item => item.id === localeId);
      const options: PromptOptions = {
        verificationMode,
        colorTheme: colorId,
        ...(selectedColor && selectedColor.id !== 'auto' ? { colorThemeLabel: selectedColor.label, colorPalette: [selectedColor.color] } : {}),
        ...(selectedLocale && selectedLocale.id !== 'auto' ? { country: selectedLocale.country, language: selectedLocale.language, localeLabel: selectedLocale.label } : {}),
        ...(hasProductChip && stagedProducts ? { hasProductLibrary: true, productCount: stagedProducts.count } : {}),
      };
      const baseText = promptText || [
        ...(hasProductChip && stagedProducts ? [`[商品${stagedProducts.count}件]`] : []),
        ...orderedFiles.map(f => `[${f.name}]`),
      ].join(' ') || '请根据附件创建网站。';
      const optionLines = [
        selectedLocale && selectedLocale.id !== 'auto' ? `国家/语言：${selectedLocale.label}` : '',
        selectedColor && selectedColor.id !== 'auto' ? `配色主题：${selectedColor.label}（${selectedColor.color}）` : '',
        `验证模式：${verificationMode === 'manual' ? '手动验证' : '自动验证'}`,
      ].filter(Boolean);
      const optionHeader = optionLines.length ? `[${optionLines.join(' | ')}]` : '';
      const finalText = optionHeader ? `${optionHeader}\n\n${baseText}` : baseText;
      const content: PromptContent = [
        {
          type: 'text',
          text: finalText,
        }
      ];

      if (hasProductChip && stagedProducts) {
        content.push({
          type: 'resource_link',
          uri: 'ui://codex-website-builder/files/data.json',
          name: `商品${stagedProducts.count}件`,
          title: `商品${stagedProducts.count}件`,
          mimeType: 'application/json',
          size: stagedProducts.size,
        });
      }

      for (const file of orderedFiles) {
        content.push({
          type: 'resource_link',
          uri: `ui://codex-website-builder/files/${encodeURIComponent(file.name)}`,
          name: file.name,
          title: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
        });
      }

      const project = await send(finalText, content, controller.signal, orderedFiles, options);
      if (controller.signal.aborted) return;

      editor.innerHTML = '';
      if (hasProductChip) onClearStagedProducts?.();
      writeStorage(PROMPT_DRAFT_STORAGE_KEY, '');
      for (const entry of filesMap.current.values()) {
        if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      }
      filesMap.current.clear();
      writeStorage(COLOR_ID_STORAGE_KEY, '');
      writeStorage(LOCALE_ID_STORAGE_KEY, '');
      writeStorage(PROMPT_DRAFT_STORAGE_KEY, '');
      setColorId('auto');
      setLocaleId('auto');
      setMenu(null);
      setHasContent(false);
      setPending(false);
      locked.current = false;
      onCreated(project);
    } catch (err) {
      if (!controller.signal.aborted) {
        setError((err as Error).message);
        setPending(false);
        locked.current = false;
      }
    }
  };

  const focusEditor = useCallback((e?: React.PointerEvent | React.MouseEvent) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      if (editor.childNodes.length === 0) {
        range.setStart(editor, 0);
        range.setEnd(editor, 0);
      } else {
        let collapseToStart = false;
        if (e) {
          const rect = editor.getBoundingClientRect();
          if (e.clientY < rect.top + 36 && e.clientX < rect.left + 80) {
            collapseToStart = true;
          }
        }
        range.selectNodeContents(editor);
        range.collapse(collapseToStart);
      }
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, []);

  return (
    <form
      className="project-prompt"
      aria-label="网站需求"
      aria-busy={pending}
      onPointerDown={e => {
        if (e.target !== picker.current && !(e.target as HTMLElement).closest('button, .prompt-chip, .prompt-menu-popover')) {
          if (!editorRef.current?.contains(e.target as Node)) {
            e.preventDefault();
            focusEditor(e);
          }
        }
      }}
      onClick={e => {
        if (e.target !== picker.current && !(e.target as HTMLElement).closest('button, .prompt-chip, .prompt-menu-popover')) {
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed) return;
          if (!editorRef.current?.contains(e.target as Node)) {
            focusEditor(e);
          }
        }
      }}
      onSubmit={event => { event.preventDefault(); void submit(); }}
    >
      <div
        ref={editorRef}
        className="prompt-editor"
        role="textbox"
        aria-label="项目需求"
        aria-multiline="true"
        tabIndex={0}
        contentEditable={!pending}
        data-empty={hasContent ? 'false' : 'true'}
        data-placeholder="描述你想构建的网站…"
        onInput={handleEditorChange}
        onKeyUp={handleEditorChange}
        onMouseUp={saveSelection}
        onBlur={() => {
          const editor = editorRef.current;
          if (editor) {
            const { text, orderedFileIds } = extractPromptContent(editor);
            if (!text && orderedFileIds.length === 0 && filesMap.current.size === 0 && editor.innerHTML !== '') {
              editor.innerHTML = '';
              setHasContent(false);
            }
          }
          saveSelection();
        }}
        onPaste={e => {
          const pastedFiles: File[] = Array.from(e.clipboardData.files || []);
          if (!pastedFiles.length && e.clipboardData.items) {
            for (const item of Array.from(e.clipboardData.items)) {
              if (item.kind === 'file') {
                const f = item.getAsFile();
                if (f) pastedFiles.push(f);
              }
            }
          }
          if (pastedFiles.length > 0) {
            e.preventDefault();
            insertFiles(pastedFiles);
            return;
          }
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          if (text) {
            document.execCommand('insertText', false, text);
            handleEditorChange();
          }
        }}
        onDrop={e => {
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            e.preventDefault();
            insertFiles(Array.from(e.dataTransfer.files));
          }
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void submit();
          }
        }}
      />
      <div className="prompt-toolbar">
        <input
          ref={picker}
          type="file"
          multiple
          hidden
          aria-label="选择图片或文件"
          onChange={event => {
            const selected = Array.from(event.target.files || []);
            if (selected.length > 0) {
              insertFiles(selected);
            }
            event.target.value = '';
          }}
        />
        <div className="prompt-toolbar-left">
          <button
            className="prompt-upload"
            type="button"
            aria-label="添加图片或文件"
            title="添加图片或文件"
            disabled={pending}
            onMouseDown={saveSelection}
            onClick={() => picker.current?.click()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button
            ref={localeBtn}
            type="button"
            className={`prompt-pill-btn prompt-menu-trigger${localeId !== 'auto' ? ' is-selected' : ''}`}
            aria-label="选择国家与语言"
            title="选择国家与语言"
            aria-expanded={menu === 'locale'}
            disabled={pending}
            onClick={() => toggleMenu('locale', localeBtn.current)}
          >
            {localeId !== 'auto' ? <CountryFlag country={LOCALE_PRESETS.find(item => item.id === localeId)?.country || ''} /> : <Icon name="globe" />}
            <span>{LOCALE_PRESETS.find(item => item.id === localeId)?.short || '国家 / 语言'}</span>
            <Icon name="chevronDown" />
          </button>
        </div>
        <div className="prompt-toolbar-right">
          <button
            ref={colorBtn}
            type="button"
            className={`prompt-icon-btn prompt-menu-trigger${colorId !== 'auto' ? ' is-selected' : ''}`}
            aria-label="选择配色主题"
            title={COLOR_PRESETS.find(item => item.id === colorId)?.label || '选择配色主题'}
            aria-expanded={menu === 'color'}
            disabled={pending}
            onClick={() => toggleMenu('color', colorBtn.current)}
          >
            {colorId !== 'auto' ? (
              <span
                className="prompt-color-dot"
                style={{ backgroundColor: COLOR_PRESETS.find(c => c.id === colorId)?.color }}
                aria-hidden="true"
              />
            ) : (
              <Icon name="palette" />
            )}
          </button>
          <button
            ref={modeBtn}
            type="button"
            className="prompt-pill-btn prompt-mode-btn prompt-menu-trigger"
            aria-label="选择验证模式"
            title="选择验证模式"
            aria-expanded={menu === 'mode'}
            disabled={pending}
            onClick={() => toggleMenu('mode', modeBtn.current)}
          >
            <Icon name={verificationMode === 'auto' ? 'sparkles' : 'bolt'} />
            <span>{verificationMode === 'auto' ? '自动验证' : '手动验证'}</span>
            <Icon name="chevronDown" />
          </button>
          <button
            className="prompt-send"
            type="submit"
            aria-label={pending ? '正在创建项目' : '发送需求'}
            title={pending ? '正在等待项目创建' : '新建对话并提交需求'}
            disabled={pending || !hasContent}
          >
            {pending ? <span className="prompt-spinner" aria-hidden="true" /> : <Icon name="send" />}
          </button>
        </div>
      </div>

      {menu && typeof document !== 'undefined' && createPortal(
        <div
          className={`prompt-menu-popover prompt-menu-${menu}`}
          style={menuStyle}
          role="menu"
          aria-label={menu === 'locale' ? '国家与语言选择' : menu === 'color' ? '配色主题选择' : '验证模式选择'}
        >
          {menu === 'locale' && <>
            <div className="prompt-menu-heading">国家与语言</div>
            <div className="prompt-menu-search">
              <Icon name="search" />
              <input
                type="search"
                aria-label="搜索国家或语言"
                placeholder="搜索国家或语言…"
                value={localeQuery}
                onChange={e => setLocaleQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="prompt-menu-list">
              {LOCALE_PRESETS.filter(item => {
                const q = localeQuery.trim().toLowerCase();
                if (!q) return true;
                return item.label.toLowerCase().includes(q) || item.country.toLowerCase().includes(q) || item.language.toLowerCase().includes(q);
              }).map(item => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={localeId === item.id}
                  className={`prompt-menu-item${localeId === item.id ? ' is-active' : ''}`}
                  onClick={() => { setLocaleId(item.id); writeStorage(LOCALE_ID_STORAGE_KEY, item.id); setMenu(null); }}
                >
                  {item.country ? <CountryFlag country={item.country} /> : <span className="prompt-flag-auto" aria-hidden="true"><Icon name="globe" /></span>}
                  <span className="prompt-menu-item-title">{item.label}</span>
                  {localeId === item.id && <svg className="prompt-menu-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 4.5"/></svg>}
                </button>
              ))}
            </div>
          </>}
          {menu === 'color' && <>
            <div className="prompt-menu-heading">主题配色</div>
            <div className="prompt-menu-list">{COLOR_PRESETS.map(item => (
              <button
                key={item.id}
                type="button"
                role="menuitemradio"
                aria-checked={colorId === item.id}
                className={`prompt-menu-item${colorId === item.id ? ' is-active' : ''}`}
                onClick={() => { setColorId(item.id); writeStorage(COLOR_ID_STORAGE_KEY, item.id); setMenu(null); }}
              >
                {item.color ? (
                  <span className="prompt-color-swatch" style={{ backgroundColor: item.color }} aria-hidden="true" />
                ) : (
                  <span className="prompt-color-swatch prompt-color-swatch-auto" aria-hidden="true"><Icon name="sparkles" /></span>
                )}
                <span className="prompt-menu-item-title">{item.label}</span>
                {colorId === item.id && <svg className="prompt-menu-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 4.5"/></svg>}
              </button>
            ))}</div>
          </>}
          {menu === 'mode' && <>
            <div className="prompt-menu-heading">验证模式</div>
            {VERIFICATION_MODES.map(item => (
              <button
                key={item.id}
                type="button"
                role="menuitemradio"
                aria-checked={verificationMode === item.id}
                className={`prompt-menu-item prompt-menu-item-rich${verificationMode === item.id ? ' is-active' : ''}`}
                onClick={() => {
                  setVerificationMode(item.id);
                  writeStorage(VERIFICATION_MODE_STORAGE_KEY, item.id);
                  setMenu(null);
                }}
              >
                <Icon name={item.icon} />
                <div className="prompt-menu-item-text">
                  <strong>{item.label}</strong>
                  <small>{item.desc}</small>
                </div>
                {verificationMode === item.id && <svg className="prompt-menu-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 4.5"/></svg>}
              </button>
            ))}
          </>}
        </div>,
        document.body
      )}
      {error && <div className="prompt-error" role="alert">{error}</div>}

      {lightbox && typeof document !== 'undefined' && createPortal(
        <div
          className="plugin-modal-overlay prompt-lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`查看图片 ${lightbox.name}`}
          onClick={() => setLightbox(null)}
        >
          <div onClick={e => e.stopPropagation()}>
            <ImagePreviewPanel
              url={lightbox.url}
              name={lightbox.name}
              onClose={() => setLightbox(null)}
            />
          </div>
        </div>,
        document.body
      )}
    </form>
  );
}
