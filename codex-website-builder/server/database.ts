import { DatabaseSync } from 'node:sqlite';
import { threadRuntime } from './thread-runtime';
import { mkdirSync } from 'node:fs';
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
      CREATE TABLE IF NOT EXISTS deployment_locks (project_id TEXT PRIMARY KEY,owner TEXT NOT NULL,expires_at INTEGER NOT NULL,stage TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS deployment_requests (id TEXT PRIMARY KEY,project_id TEXT NOT NULL,thread_id TEXT NOT NULL,data TEXT NOT NULL,expires_at INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS image_tasks (
        project_id TEXT NOT NULL REFERENCES projects(id), path TEXT NOT NULL,
        name TEXT NOT NULL, width INTEGER NOT NULL, height INTEGER NOT NULL,
        status TEXT NOT NULL, error TEXT NOT NULL DEFAULT '', baseline TEXT NOT NULL DEFAULT '',
        PRIMARY KEY(project_id,path)
      );
      CREATE TABLE IF NOT EXISTS image_compressions (
        project_id TEXT NOT NULL REFERENCES projects(id),path TEXT NOT NULL,
        source_hash TEXT NOT NULL,status TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,
        owner TEXT NOT NULL,lease_until INTEGER NOT NULL DEFAULT 0,
        output_hash TEXT NOT NULL DEFAULT '',report TEXT NOT NULL DEFAULT '',error TEXT NOT NULL DEFAULT '',
        PRIMARY KEY(project_id,path)
      );
      CREATE TABLE IF NOT EXISTS project_activity (project_id TEXT NOT NULL REFERENCES projects(id), task_key TEXT NOT NULL, expires_at INTEGER NOT NULL, PRIMARY KEY(project_id,task_key));
      PRAGMA user_version=1;`);
    // Only this database owns current-format projects; never import legacy JSON/cache stores.
    this.sql.exec('INSERT OR IGNORE INTO project_sessions SELECT project_id,thread_id FROM threads');
  }
  row(id: string): any { return this.sql.prepare('SELECT * FROM projects WHERE id=?').get(id); }
  project(id: string): WebsiteProject | null {
    const row=this.row(id);if(!row||row.deleted_at)return null;
    try {
      const project=JSON.parse(row.data);
      if(project?.id!==id||typeof project.name!=='string'||typeof project.brief!=='string'||typeof project.language!=='string'||!Array.isArray(project.pages))return null;
      if(project.pages.some((page:any)=>!page||typeof page.path!=='string'||typeof page.title!=='string'||!['queued','generating','ready','error'].includes(page.status)||!Number.isSafeInteger(page.version)))return null;
      return project;
    }catch{return null;}
  }
  save(project: WebsiteProject) {
    if(this.row(project.id)?.deleted_at)throw Error("项目已删除，不能继续写入");
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
  panel(panelId: string, thread: string, projectId: string | null, allowSubmissionHandoff = false) {
    if (projectId && !this.project(projectId)) throw Error('项目不存在或已删除');
    const existing: any = this.sql.prepare('SELECT thread_id FROM panels WHERE panel_id=?').get(panelId);
    if (existing?.thread_id && existing.thread_id !== thread && !allowSubmissionHandoff) throw Error('面板不属于当前会话');
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
  activity(id: string, key: string, running = true) {
    if(!this.project(id))throw Error('项目不存在或已删除');
    if(running)this.sql.prepare('DELETE FROM project_activity WHERE project_id=? AND expires_at<=?').run(id,Date.now());
    if(running)this.sql.prepare('INSERT INTO project_activity VALUES (?,?,?) ON CONFLICT(project_id,task_key) DO UPDATE SET expires_at=excluded.expires_at').run(id,key,Date.now()+30*60*1000);
    else this.sql.prepare('DELETE FROM project_activity WHERE project_id=? AND task_key=?').run(id,key);
  }
  status(id:string): 'pending'|'generating'|'modifying'|'completed'|'failed'|'paused' {
    const p=this.project(id);if(!p)return 'failed';
    const tasks=this.sql.prepare('SELECT expires_at FROM project_activity WHERE project_id=?').all(id) as {expires_at:number}[];
    const images=this.sql.prepare('SELECT status FROM image_tasks WHERE project_id=?').all(id) as {status:string}[];
    const pages=p.pages||[], recent=Date.now()-Date.parse(p.updatedAt)<30*60*1000;
    const active=tasks.some(t=>t.expires_at>Date.now())||pages.some(p=>p.status==='generating')&&recent;
    if(active){
      const threads=this.sql.prepare('SELECT thread_id FROM threads WHERE project_id=?').all(id) as {thread_id:string}[];
      const states=threads.map(row=>threadRuntime(row.thread_id));
      if(states.length&&states.every(value=>value==='paused'||value==='complete'))return 'paused';
    }
    if(active)return (p.hasPublished??(pages.length>0&&pages.every(p=>p.status==='ready')))?'modifying':'generating';
    if(tasks.some(t=>t.expires_at<=Date.now())||images.some(t=>t.status!=='ready')||pages.some(p=>p.status==='error'||p.status==='generating'))return 'failed';
    return pages.length>0&&pages.every(p=>p.status==='ready')?'completed':'pending';
  }
  remove(id: string) {
    if (!this.project(id)) throw Error('项目不存在或已删除');
    this.sql.exec('BEGIN IMMEDIATE');
    try {
      if (['generating','modifying'].includes(this.status(id))) throw Error('项目正在处理，暂不可删除');
      this.sql.prepare('UPDATE projects SET deleted_at=? WHERE id=?').run(new Date().toISOString(), id);
      this.sql.prepare('UPDATE panels SET project_id=NULL WHERE project_id=?').run(id);
      this.sql.prepare('DELETE FROM threads WHERE project_id=?').run(id);
      const active = this.binding();
      if (active?.projectId === id) this.sql.prepare("DELETE FROM settings WHERE key='active'").run();
      this.sql.exec('COMMIT');
    } catch (error) { this.sql.exec('ROLLBACK'); throw error; }
  }
}
