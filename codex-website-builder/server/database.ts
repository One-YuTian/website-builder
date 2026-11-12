import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { WebsiteProject } from './projects';

export class ProjectDatabase {
  readonly sql: DatabaseSync;
  readonly path: string;
  constructor(base: string, projectRoot: string, stateRoot: string) {
    mkdirSync(join(base, 'db'), { recursive: true });
    this.path = join(base, 'db', 'website-builder.sqlite');
    this.sql = new DatabaseSync(this.path);
    this.sql.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, data TEXT NOT NULL,
        updated_at TEXT NOT NULL, deleted_at TEXT, thumbnail_path TEXT, thumbnail_revision TEXT
      );
      CREATE TABLE IF NOT EXISTS threads (thread_id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id));
      CREATE TABLE IF NOT EXISTS project_sessions (project_id TEXT NOT NULL REFERENCES projects(id), thread_id TEXT NOT NULL, PRIMARY KEY(project_id,thread_id));
      CREATE TABLE IF NOT EXISTS panels (panel_id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, project_id TEXT REFERENCES projects(id), updated_at TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS panels_thread ON panels(thread_id,updated_at);
      CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), thread_id TEXT,
        name TEXT NOT NULL, path TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL,
        UNIQUE(project_id,path)
      );
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      PRAGMA user_version=1;`);
    // Import older JSON stores once. Existing rows (including tombstones) always win.
    const read = (file: string) => { try { return JSON.parse(readFileSync(file, 'utf8')); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; } };
    const entries = (path: string) => existsSync(path) ? readdirSync(path, { withFileTypes: true }) : [];
    for (const entry of entries(projectRoot)) {
      if (!entry.isDirectory() || !/^[a-f0-9]{4}(?:-[a-f0-9]{4}){3}$/.test(entry.name)) continue;
      if (this.row(entry.name)) continue;
      const project = read(join(stateRoot, 'projects', entry.name, 'project.json')) || read(join(projectRoot, entry.name, '.website-builder.json'));
      if (project?.id === entry.name) this.save(project);
    }
    for (const entry of entries(join(stateRoot, 'threads'))) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      const binding = read(join(stateRoot, 'threads', entry.name));
      if (binding?.threadId && this.project(binding.projectId)) this.sql.prepare('INSERT OR IGNORE INTO threads VALUES (?,?)').run(binding.threadId, binding.projectId);
    }
    this.sql.exec('INSERT OR IGNORE INTO project_sessions SELECT project_id,thread_id FROM threads');
    if (!this.sql.prepare("SELECT value FROM settings WHERE key='active'").get()) {
      const active = read(join(stateRoot, 'active.json'));
      if (active?.threadId && this.project(active.projectId)) this.setActive(active);
    }
  }
  row(id: string): any { return this.sql.prepare('SELECT * FROM projects WHERE id=?').get(id); }
  project(id: string): WebsiteProject | null { const row = this.row(id); return row && !row.deleted_at ? JSON.parse(row.data) : null; }
  save(project: WebsiteProject) {
    this.sql.prepare(`INSERT INTO projects(id,title,data,updated_at) VALUES (?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET title=excluded.title,data=excluded.data,updated_at=excluded.updated_at WHERE projects.deleted_at IS NULL`)
      .run(project.id, project.name, JSON.stringify(project), project.updatedAt);
  }
  list(includeDeleted = false): any[] {
    return this.sql.prepare(`SELECT id,title AS name,updated_at AS updatedAt,deleted_at AS deletedAt,thumbnail_path AS thumbnailPath,thumbnail_revision AS thumbnailRevision FROM projects ${includeDeleted ? '' : 'WHERE deleted_at IS NULL'} ORDER BY updated_at DESC`).all();
  }
  binding(thread?: string): {threadId: string; projectId: string} | null {
    if (thread) { const row: any = this.sql.prepare('SELECT thread_id AS threadId,project_id AS projectId FROM threads WHERE thread_id=?').get(thread); return row || null; }
    const row: any = this.sql.prepare("SELECT value FROM settings WHERE key='active'").get();
    return row ? JSON.parse(row.value) : null;
  }
  setActive(binding: {threadId: string; projectId: string}) {
    this.sql.prepare('INSERT OR IGNORE INTO project_sessions VALUES (?,?)').run(binding.projectId,binding.threadId);
    this.sql.prepare('INSERT INTO threads VALUES (?,?) ON CONFLICT(thread_id) DO UPDATE SET project_id=excluded.project_id').run(binding.threadId, binding.projectId);
    this.sql.prepare("INSERT INTO settings VALUES ('active',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(binding));
  }
  panel(panelId: string, thread: string, projectId: string | null) {
    if (projectId && !this.project(projectId)) throw Error('项目不存在或已删除');
    const existing: any = this.sql.prepare('SELECT thread_id FROM panels WHERE panel_id=?').get(panelId);
    if (existing?.thread_id && existing.thread_id !== thread) throw Error('面板不属于当前会话');
    this.sql.prepare('INSERT INTO panels VALUES (?,?,?,?) ON CONFLICT(panel_id) DO UPDATE SET thread_id=excluded.thread_id,project_id=excluded.project_id,updated_at=excluded.updated_at')
      .run(panelId, thread, projectId, new Date().toISOString());
  }
  panelById(panelId: string): any { return this.sql.prepare('SELECT * FROM panels WHERE panel_id=?').get(panelId); }
  context(thread?: string, panelId?: string): any {
    if(panelId) {
      const panel=this.panelById(panelId);
      return panel && (!thread || !panel.thread_id || panel.thread_id===thread)?panel:undefined;
    }
    return thread?this.sql.prepare('SELECT * FROM panels WHERE thread_id=? ORDER BY updated_at DESC LIMIT 1').get(thread):undefined;
  }
  remove(id: string) {
    if (!this.project(id)) throw Error('项目不存在或已删除');
    this.sql.exec('BEGIN IMMEDIATE');
    try {
      this.sql.prepare('UPDATE projects SET deleted_at=? WHERE id=?').run(new Date().toISOString(), id);
      this.sql.prepare('UPDATE panels SET project_id=NULL WHERE project_id=?').run(id);
      this.sql.prepare('DELETE FROM threads WHERE project_id=?').run(id);
      const active = this.binding();
      if (active?.projectId === id) this.sql.prepare("DELETE FROM settings WHERE key='active'").run();
      this.sql.exec('COMMIT');
    } catch (error) { this.sql.exec('ROLLBACK'); throw error; }
  }
}
