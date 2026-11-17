// Administrator-only local provisioning. Read credentials from stdin, never argv or source.
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {randomBytes,createCipheriv,randomUUID} from 'node:crypto';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
let text='';for await(const chunk of process.stdin)text+=chunk;
const values=JSON.parse(text);
for(const name of ['R2_ACCOUNT_ID','R2_BUCKET_NAME','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_DEPLOY_HOST'])if(typeof values[name]!=='string'||!values[name])throw Error('预配置字段缺失：'+name);
const root=resolve(process.env.WEBSITE_BUILDER_DATA_DIR||join(process.platform==='win32'?(process.env.LOCALAPPDATA||join(homedir(),'AppData/Local')):(process.env.XDG_DATA_HOME||join(homedir(),'.local/share')),'codex-website-builder'));
const folder=join(root,'config');await mkdir(folder,{recursive:true});
const keyFile=join(folder,'r2-key.bin');try{await writeFile(keyFile,randomBytes(32),{flag:'wx',mode:0o600});}catch(error){if(error.code!=='EEXIST')throw error;}
const key=await readFile(keyFile);if(key.length!==32)throw Error('本机 R2 密钥文件无效');
const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv),secret=JSON.stringify({R2_ACCESS_KEY_ID:values.R2_ACCESS_KEY_ID,R2_SECRET_ACCESS_KEY:values.R2_SECRET_ACCESS_KEY});
const encrypted=Buffer.concat([cipher.update(secret),cipher.final()]);
const config={R2_ACCOUNT_ID:values.R2_ACCOUNT_ID,R2_BUCKET_NAME:values.R2_BUCKET_NAME,R2_DEPLOY_HOST:values.R2_DEPLOY_HOST,credentials:{iv:iv.toString('hex'),tag:cipher.getAuthTag().toString('hex'),value:encrypted.toString('hex')}};
const file=join(folder,'r2-config.json'),temporary=file+'.'+randomUUID()+'.tmp';await writeFile(temporary,JSON.stringify(config,null,2),{mode:0o600});await rename(temporary,file);
process.stdout.write('本机 S3 只读配置已写入，凭据未回显。\n');
