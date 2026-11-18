import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { ProjectStore, type ProjectView } from './projects';
import { createProjectCompiler, type SiteManifest } from './preview';
import { registerPreviewBuffer } from './resource-proxy';

export function previewPayload(gzip: string): string | { resource: string } {
  return gzip.length <= 1000000 ? gzip : { resource: registerPreviewBuffer(Buffer.from(gzip, 'base64'), 'application/gzip') };
}

export function compactProject(view: ProjectView) {
  return { ...(view.git ? { git: view.git } : {}), project_id: view.project.id, thread_id: view.threadId, directory: view.directory, metadata_directory: view.metadataDirectory, project_directory: view.projectDirectory, files_directory: join(view.projectDirectory, 'files'), source_directory: view.directory, material_directory: view.materialDirectory, format_version: view.project.formatVersion, name: view.project.name, country: view.project.country, categories: view.project.categories, brand: view.project.brand, domain: view.project.domain, language: view.project.language, brief: view.project.brief, pages: view.project.pages.map(({ path, status, error }) => ({ path, status, ...(error ? { error } : {}) })) };
}
export function projectService(store: ProjectStore) {
  const cache = new Map<string, { version: number; gzip: string }>();
  return async function sync(input: { since?: string; known?: Record<string, number>; threadId?: string; projectId?: string; waitMs?: number; metadataOnly?: boolean; pageLimit?: number; priorityPath?: string }) {
    const load = async () => {
      if (!input.projectId) return store.reconcile(input.threadId);
      return store.reconcile(input.threadId, input.projectId);
    };
    let view = await load(); const known = input.known || {};
    const missing = view?.project.pages.some(page => page.status === 'ready' && known[page.path] !== page.version);
    if (!input.metadataOnly && !missing && (view?.revision || 'none') === (input.since || 'none')) {
      if (!input.projectId) view = await store.wait(input.since || 'none', input.threadId, input.waitMs ?? 20000);
      else { const deadline = Date.now() + Math.min(input.waitMs ?? 20000, 20000); while (Date.now() < deadline && view?.revision === input.since) { await new Promise(resolve => setTimeout(resolve, 250)); view = await load(); } }
    }
    if (!view) return { revision: 'none', unchanged: true };
    if (!input.metadataOnly && !missing && view.revision === input.since) return { revision: view.revision, unchanged: true };
    const manifest: SiteManifest = { directory: view.project.id, name: view.project.name, projectId: view.project.id, threadId: view.threadId, revision: view.revision, initializing: !view.project.hasPreview && !view.project.hasPublished && !view.project.pages.some(page => page.status === 'ready'), order: '项目页面计划', warnings: [], pages: view.project.pages.map(page => ({ ...page, url: `https://website-builder.invalid/files/${view!.project.id}/src/${page.path.split('/').map(encodeURIComponent).join('/')}` })) };
    const pages: Record<string, string | { resource: string }> = {}, errors: Record<string, string> = {}; let size = 0;
    const ordered = [...view.project.pages].sort((a, b) => Number(b.path === (input.priorityPath || 'index.html')) - Number(a.path === (input.priorityPath || 'index.html')));
    const pendingPages = (input.metadataOnly ? [] : ordered).filter(page => page.status === 'ready' && known[page.path] !== page.version).slice(0, input.pageLimit ?? Infinity);
    if (pendingPages.length) {
      const needsCompile = pendingPages.some(page => { const saved = cache.get(`${view!.project.id}:${page.path}`); return !saved || saved.version !== page.version; });
      const compile = needsCompile ? await createProjectCompiler(view.directory) : undefined;
      const compiled = await Promise.all(pendingPages.map(async page => {
        const key = `${view!.project.id}:${page.path}`;
        try {
          let saved = cache.get(key);
          if (!saved || saved.version !== page.version) {
            saved = { version: page.version, gzip: gzipSync(await compile!(page.path)).toString('base64') };
            cache.set(key, saved);
          }
          return { page, saved };
        } catch (error) { return { page, error: (error as Error).message }; }
      }));
      for (const item of compiled) {
        if ('error' in item) { errors[item.page.path] = item.error!; continue; }
        const payload = previewPayload(item.saved.gzip), length = typeof payload === 'string' ? payload.length : payload.resource.length;
        if (size > 0 && size + length > 2800000) break;
        pages[item.page.path] = payload; size += length;
      }
    }
    // Do not retain unbounded compiled websites in a long-lived plugin process.
    let cacheBytes = [...cache.values()].reduce((sum, item) => sum + item.gzip.length, 0);
    for (const [key, value] of cache) { if (cacheBytes <= 24000000) break; cache.delete(key); cacheBytes -= value.gzip.length; }
    return { revision: view.revision, manifest, pages, errors, projects: await store.list() };
  };
}
