import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {createDecipheriv,randomUUID,createHash} from 'node:crypto';
import {gitlabHost} from './gitlab-transport';

export const settingNames=['GITLAB_HOST','GITLAB_IP','GITLAB_TOKEN','GITLAB_WEBSITE_DIR','GITLAB_WEBSITE_DEPLOY_DIR','GITLAB_DEFAULT_BRANCH'] as const;
export type GitLabSettings=Record<typeof settingNames[number],string>&{PROJECT_DIR:string};
export class PluginSettings {
  readonly file:string;
  constructor(readonly root:string,readonly projectDir:string,private env=process.env){this.file=join(root,'config','website-builder.json');}
  private async key(){
    const file=join(this.root,'config','secret.key');
    const key=await readFile(file);if(key.length!==32)throw Error('配置密钥无效，请检查本机配置目录');return key;
  }
  private async read(){try{return JSON.parse(await readFile(this.file,'utf8'));}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return {};throw Error('插件配置文件不可读取');}}
  private async persist(data:Record<string,unknown>){
    await mkdir(join(this.root,'config'),{recursive:true});const file=this.file+'.'+randomUUID()+'.tmp';
    await writeFile(file,JSON.stringify({...data,PROJECT_DIR:this.projectDir},null,2),{mode:0o600});await rename(file,this.file);
  }
  async get(repair=true):Promise<GitLabSettings>{
    const data=await this.read();
    const result:any={PROJECT_DIR:this.projectDir};
    for(const name of settingNames)result[name]=typeof data[name]==='string'?data[name]:(this.env[name]|| (name==='GITLAB_DEFAULT_BRANCH'?'main':''));
    if(result.GITLAB_HOST){try{result.GITLAB_HOST=gitlabHost(result.GITLAB_HOST);}catch{/* Keep invalid input editable; diagnostics will explain the configuration error. */}}
    if(data.token&&typeof data.GITLAB_TOKEN!=='string'){try{const decipher=createDecipheriv('aes-256-gcm',await this.key(),Buffer.from(data.token.iv,'hex'));decipher.setAuthTag(Buffer.from(data.token.tag,'hex'));result.GITLAB_TOKEN=Buffer.concat([decipher.update(Buffer.from(data.token.value,'hex')),decipher.final()]).toString();}catch{throw Error('旧版 GitLab Token 无法读取，请在插件配置页重新填写');}}
    if(repair&&(data.PROJECT_DIR!==this.projectDir||data.token)){if(data.token){data.GITLAB_TOKEN=result.GITLAB_TOKEN;delete data.token;}await this.persist(data);}
    return result;
  }
  async public(readonly=false){const data=await this.get(!readonly);return {...data,token_configured:!!data.GITLAB_TOKEN,read_only:['PROJECT_DIR']};}
  async save(input:Record<string,unknown>){
    const data=await this.read();
    for(const name of settingNames){
      if(name==='GITLAB_TOKEN'||input[name]===undefined)continue;
      if(typeof input[name]!=='string'||(input[name] as string).length>2048)throw Error(`配置 ${name} 无效`);
      data[name]=(input[name] as string).trim();
      if(name==='GITLAB_HOST'&&data[name])data[name]=gitlabHost(data[name]);
    }
    if(input.GITLAB_TOKEN!==undefined){
      if(typeof input.GITLAB_TOKEN!=='string'||input.GITLAB_TOKEN.length>8192)throw Error('Token 格式无效');
      data.GITLAB_TOKEN=input.GITLAB_TOKEN;delete data.token;
    }else if(data.token){
      data.GITLAB_TOKEN=(await this.get(false)).GITLAB_TOKEN;delete data.token;
    }
    data.GITLAB_DEFAULT_BRANCH ||= 'main';
    await this.persist(data);return this.public();
  }
}
export const settingsDigest=(settings:GitLabSettings)=>createHash('sha256').update(JSON.stringify(settings)).digest('hex');
