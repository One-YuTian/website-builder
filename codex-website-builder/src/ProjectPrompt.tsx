import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icons';
import type { App } from '@modelcontextprotocol/ext-apps';

export type PromptContent = Parameters<App['sendMessage']>[0]['content'];
export type CreatedProject = {project_id:string;thread_id:string|null;name:string;directory:string};

interface FileEntry {
  file: File;
  previewUrl?: string;
}

function extractPromptContent(root: HTMLElement): { text: string; orderedFileIds: string[] } {
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
        text += `[${fileName}]`;
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

export function ProjectPrompt({send,onCreated}:{send:(text:string,content:PromptContent,signal:AbortSignal,files:File[])=>Promise<CreatedProject>;onCreated:(project:CreatedProject)=>void}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const filesMap = useRef<Map<string, FileEntry>>(new Map());
  const [hasContent, setHasContent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const operation = useRef<AbortController|null>(null);
  const locked = useRef(false);
  const savedRange = useRef<Range|null>(null);

  useEffect(() => {
    return () => {
      operation.current?.abort();
      for (const entry of filesMap.current.values()) {
        if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      }
    };
  }, []);

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
    const { text, orderedFileIds } = extractPromptContent(editor);
    setHasContent(Boolean(text || orderedFileIds.length > 0 || filesMap.current.size > 0));
    saveSelection();
  }, [saveSelection]);

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
        setLightbox({ url: previewUrl, name: file.name });
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
    closeBtn.innerHTML = '×';
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

    const { text: promptText, orderedFileIds } = extractPromptContent(editor);
    const orderedFiles = orderedFileIds
      .map(id => filesMap.current.get(id)?.file)
      .filter((f): f is File => Boolean(f));

    for (const [id, entry] of filesMap.current.entries()) {
      if (!orderedFileIds.includes(id)) {
        orderedFiles.push(entry.file);
      }
    }

    if (!promptText && orderedFiles.length === 0) return;

    locked.current = true;
    setPending(true);
    setError('');

    const controller = new AbortController();
    operation.current = controller;

    try {
      const finalText = promptText || orderedFiles.map(f => `[${f.name}]`).join(' ') || '请根据附件创建网站。';
      const content: PromptContent = [
        {
          type: 'text',
          text: finalText,
        }
      ];

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

      const project = await send(finalText, content, controller.signal, orderedFiles);
      if (controller.signal.aborted) return;

      editor.innerHTML = '';
      for (const entry of filesMap.current.values()) {
        if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      }
      filesMap.current.clear();
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

  return (
    <form
      className="project-prompt"
      aria-label="网站需求"
      aria-busy={pending}
      onClick={e => {
        if (e.target !== picker.current && !(e.target as HTMLElement).closest('button, .prompt-chip')) {
          editorRef.current?.focus();
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
        data-placeholder="描述你想构建的网站…"
        onInput={handleEditorChange}
        onKeyUp={handleEditorChange}
        onMouseUp={saveSelection}
        onBlur={saveSelection}
        onPaste={e => {
          if (e.clipboardData.files && e.clipboardData.files.length > 0) {
            e.preventDefault();
            insertFiles(Array.from(e.clipboardData.files));
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
        <button
          className="prompt-upload"
          type="button"
          aria-label="添加图片或文件"
          title="添加图片或文件"
          disabled={pending}
          onMouseDown={saveSelection}
          onClick={() => picker.current?.click()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M12 4v16M4 12h16" />
          </svg>
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
      {error && <div className="prompt-error" role="alert">{error}</div>}

      {lightbox && typeof document !== 'undefined' && createPortal(
        <div
          className="prompt-lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`查看图片 ${lightbox.name}`}
          onClick={() => setLightbox(null)}
        >
          <div className="prompt-lightbox-box" onClick={e => e.stopPropagation()}>
            <div className="prompt-lightbox-header">
              <span className="lightbox-title" title={lightbox.name}>{lightbox.name}</span>
              <button
                type="button"
                className="prompt-lightbox-close"
                aria-label="关闭预览"
                title="关闭"
                onClick={() => setLightbox(null)}
              >
                ×
              </button>
            </div>
            <div className="prompt-lightbox-img-wrap">
              <img src={lightbox.url} alt={lightbox.name} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </form>
  );
}
