import fs from 'node:fs';
import { lstat, mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire as createGitRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const PROJECT_FORMAT = 2;
const gitRequire = createGitRequire(import.meta.url);
const repository = (directory:string) => ({fs,dir:directory.replaceAll('\\','/')});
const gitClient = () => gitRequire(fileURLToPath(new URL('../runtime/isomorphic-git/load.cjs', import.meta.url)));
export type ProjectCommit = {branch:'main';committed:boolean;oid?:string;reason?:string};
function confirmation(reason:string):never {
  throw new Error(`GIT_CONFIRMATION_REQUIRED：${reason}。先向用户说明并取得确认，再使用系统环境的 git 在该项目目录处理；不得自动切换分支、merge、rebase、reset、stash、推送或用其他方式绕过。`);
}
export async function assertMainRepository(directory:string) {
  const git=gitClient(),options=repository(directory);
  for(const name of ['MERGE_HEAD','CHERRY_PICK_HEAD','REVERT_HEAD','REBASE_HEAD','rebase-apply','rebase-merge','sequencer','BISECT_LOG','index.lock','HEAD.lock','config.lock','packed-refs.lock','shallow.lock','refs/heads/main.lock']) {
    if(await lstat(join(directory,'.git',name)).catch(error=>{if(error.code==='ENOENT')return null;throw error;}))confirmation(`仓库存在 ${name}`);
  }
  const branch=await git.currentBranch(options);
  if(branch!=='main')confirmation(branch?`当前分支为 ${branch}，目标为 main`:'当前处于分离 HEAD 状态');
  const index=await readFile(join(directory,'.git/index')).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
  if(index){
    if(index.length<32||index.toString('ascii',0,4)!=='DIRC'||![2,3].includes(index.readUInt32BE(4)))confirmation('Git 索引格式需要人工检查');
    let offset=12;
    for(let entry=0;entry<index.readUInt32BE(8);entry++){
      const start=offset;if(offset+62>index.length-20)confirmation('Git 索引不完整');
      const flags=index.readUInt16BE(offset+60);
      if(flags&0x3000)confirmation('Git 索引存在未解决冲突');
      offset+=62+(flags&0x4000?2:0);
      const end=index.indexOf(0,offset);if(end<0||end>=index.length-20)confirmation('Git 索引路径无效');
      offset=start+Math.ceil((end+1-start)/8)*8;
    }
  }
  // Never stage a symlink whose target might be outside the generated project.
  const inspect=async(folder:string):Promise<void>=>{for(const entry of await readdir(folder,{withFileTypes:true})){
    if(entry.name==='.git'&&folder===directory)continue;
    if(entry.isSymbolicLink())confirmation(`项目包含符号链接 ${entry.name}`);
    if(entry.isDirectory())await inspect(join(folder,entry.name));
  }};
  await inspect(directory);
}
export async function commitProject(directory:string,message:string):Promise<ProjectCommit> {
  await assertMainRepository(directory);
  const git=gitClient(),options=repository(directory);
  try{
    const matrix=await git.statusMatrix(options) as [string,number,number,number][];
    if(matrix.some(([,head,worktree,stage])=>stage!==head&&stage!==worktree))confirmation('暂存区与工作区包含不同版本，需要保留并确认处理');
    const changed=matrix.filter(([,head,worktree,stage])=>head!==worktree||head!==stage);
    if(!changed.length)return {branch:'main',committed:false,oid:await git.resolveRef({...options,ref:'HEAD'}).catch(()=>undefined),reason:'没有文件变化'};
    for(const [filepath,,worktree]of changed){
      if(filepath.split('/').some(part=>part==='..'||part==='.git')||filepath.startsWith('/'))confirmation('索引含异常文件路径');
      if(worktree===0)await git.remove({...options,filepath});else await git.add({...options,filepath});
    }
    const staged=await git.statusMatrix(options) as [string,number,number,number][];
    if(staged.every(([,head,,stage])=>head===stage))return {branch:'main',committed:false,oid:await git.resolveRef({...options,ref:'HEAD'}).catch(()=>undefined),reason:'没有文件变化'};
    const author={name:await git.getConfig({...options,path:'user.name'})||'Website Builder',email:await git.getConfig({...options,path:'user.email'})||'website-builder@localhost'};
    const oid=await git.commit({...options,message,author});
    return {branch:'main',committed:true,oid};
  }catch(error){
    if((error as Error).message.startsWith('GIT_CONFIRMATION_REQUIRED'))throw error;
    confirmation(`本地提交未完成：${(error as Error).message}`);
  }
}
export async function initializeRepository(directory: string) {
  const git = gitClient();
  await git.init({ fs, dir: directory.replaceAll('\\', '/'), defaultBranch: 'main' });
}
export async function recognizedProject(directory: string, format?: number) {
  if (format !== PROJECT_FORMAT) return false;
  try {
    const root=await lstat(directory);
    if(!root.isDirectory()||root.isSymbolicLink())return false;
    for (const name of ['src', 'src/images', 'material', '.git']) {
      const info = await lstat(join(directory, name));
      if (!info.isDirectory() || info.isSymbolicLink()) return false;
    }
    for (const name of ['README.md', '.git/HEAD', '.git/config']) {
      const info = await lstat(join(directory, name));
      if (!info.isFile() || info.isSymbolicLink()) return false;
    }
    return true;
  } catch { return false; }
}
export function projectReadme(project: {name:string;brief:string;language:string;country?:string;brand?:string}) {
  return `# ${project.name.replace(/[\r\n]/g, ' ')}\n\n${project.brief || 'Website project generated with Website Builder.'}\n\n- Brand: ${project.brand || project.name}\n- Country: ${project.country || 'To be specified'}\n- Language: ${project.language}\n\n## Project structure\n\n- \`src/\`: deployable website source; serve this directory as the website root.\n- \`src/images/\`: website assets, including logo.png, favicon.png, banner1.png, banner2.png and about.png as needed.\n- \`files/\`: original files uploaded through the project home prompt; not deployed.\n- \`material/\`: generated original image assets; these are not part of the deployed website.\n- \`.git/\`: local repository, initialized on main without a remote.\n\nOpen src/index.html through a static HTTP server. Website details and running instructions can be expanded here as the website is generated.\n`;
}
export async function scaffoldProject(directory: string, project: Parameters<typeof projectReadme>[0]) {
  await mkdir(join(directory, 'src', 'images'), {recursive:true});
  await mkdir(join(directory, 'material'), {recursive:true});
  await mkdir(join(directory, 'files'), {recursive:true});
  await initializeRepository(directory);
  await writeFile(join(directory, 'README.md'), projectReadme(project));
  return commitProject(directory,'Initialize website project');
}
