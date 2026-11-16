import type {ProjectDatabase} from './database';
export function operationLock(db:ProjectDatabase,id:string){return db.sql.prepare('SELECT * FROM deployment_locks WHERE project_id=? AND expires_at>?').get(id,Date.now()) as {owner:string;expires_at:number;stage:string}|undefined;}
export function assertEditable(db:ProjectDatabase,id:string,owner?:string){
  const lock=operationLock(db,id);
  if(lock&&lock.owner!==owner)throw Error('项目正在部署或等待发布确认，禁止修改页面与素材');
  if(owner&&lock?.owner!==owner)throw Error('部署锁已失效，请重新检查与确认');
}
