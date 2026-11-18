import {loadGitLabFixture} from './gitlab-test-support.mjs';
import {createHash} from 'node:crypto';
export const testR2Config={R2_ACCOUNT_ID:'0'.repeat(32),R2_BUCKET_NAME:'website',R2_ACCESS_KEY_ID:'mock-r2-key',R2_SECRET_ACCESS_KEY:'mock-r2-secret',R2_DEPLOY_HOST:'deploy.invalid'};
export async function r2Fixture(){
 const {fixture,R2Deployment}=await loadGitLabFixture(),base=await fixture(),objects=new Map(),calls=[],state={fail:false,hold:null};
 const client={
  async list(prefix){calls.push(['list',prefix]);return [...objects].filter(([key])=>key.startsWith(prefix)).map(([key,value])=>({key,size:value.body.length}));},
  async put(key,file,signal,progress){calls.push(['put',key]);if(state.hold)await state.hold;signal.throwIfAborted();if(state.fail)throw Error('MOCK upload failed');const chunks=[];for await(const chunk of file.body)chunks.push(chunk);const body=Buffer.concat(chunks),hash=createHash('sha256').update(body).digest('hex');if(hash!==file.sha256)throw Error('Payload SHA mismatch');objects.set(key,{body,sha256:hash});progress?.(body.length);},
  async head(key){const value=objects.get(key);return {size:value?.body.length,sha256:value?.sha256};},
  async remove(key){calls.push(['delete',key]);objects.delete(key);},
 };
 await base.store.finish('mock-thread',[]);
 const settings={get:async()=>testR2Config},r2=new R2Deployment(base.store,settings,()=>client);
 return {...base,r2,objects,calls,state,client,settings};
}
export async function waitR2(r2,id){const deadline=Date.now()+10000;for(;;){const state=r2.status(id);if(!state.locked)return state;if(Date.now()>deadline)throw Error('R2 mock timeout');await new Promise(resolve=>setTimeout(resolve,25));}}
