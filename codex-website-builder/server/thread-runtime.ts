import { DatabaseSync } from 'node:sqlite';
import { openSync, readSync, closeSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

type Runtime = 'running'|'paused'|'complete'|'unknown';
const cache=new Map<string,{time:number;state:Runtime}>();
// Read only the lifecycle envelope, never conversation contents. Missing or
// changed host storage falls back to the plugin's existing activity leases.
export function threadRuntime(threadId:string):Runtime {
  const home=process.env.CODEX_HOME||join(homedir(),'.codex');
  const key=home+':'+threadId,previous=cache.get(key);
  if(previous&&Date.now()-previous.time<1000)return previous.state;
  let state:Runtime='unknown';
  let db:DatabaseSync|undefined,fd:number|undefined;
  try {
    db=new DatabaseSync(join(home,'state_5.sqlite'),{readOnly:true});
    const row=db.prepare('SELECT rollout_path FROM threads WHERE id=?').get(threadId) as {rollout_path:string}|undefined;
    if(row?.rollout_path){
      fd=openSync(row.rollout_path,'r');const size=statSync(row.rollout_path).size;
      const start=Math.max(0,size-256*1024),buffer=Buffer.alloc(size-start);
      readSync(fd,buffer,0,buffer.length,start);
      const lines=buffer.toString('utf8').split('\n');if(start)lines.shift();
      for(let i=lines.length-1;i>=0;i--){
        try{
          const event=JSON.parse(lines[i]),value=event.payload;
          if(event.type!=='event_msg'||!value||value.root_turn_id&&value.turn_id&&value.root_turn_id!==value.turn_id)continue;
          if(value.type==='turn_aborted'){state='paused';break;}
          if(value.type==='task_complete'){state='complete';break;}
          if(value.type==='task_started'){state='running';break;}
        }catch{/* Partial last line is retried on the next list refresh. */}
      }
    }
  }catch{/* Not every host supplies a local rollout database. */}
  finally{if(fd!==undefined)closeSync(fd);db?.close();}
  cache.set(key,{time:Date.now(),state});
  if(cache.size>512)cache.delete(cache.keys().next().value!);
  return state;
}
