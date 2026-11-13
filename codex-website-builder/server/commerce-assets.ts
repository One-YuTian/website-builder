import {readFile,realpath} from 'node:fs/promises';
import {join,relative,sep,isAbsolute} from 'node:path';

// Install only the shared SDK. Site-specific app.js is generated with the selected templates.
export async function commerceAssets(directory:string,skillRoot:string) {
  const files:{path:string;content:string}[]=[],kept:string[]=[];
  for(const name of ['sdk.js','app.js']){
    const path=`js/${name}`;
    try{
      const file=await realpath(join(directory,path)),base=await realpath(directory),rel=relative(base,file);
      if(rel==='..'||rel.startsWith(`..${sep}`)||isAbsolute(rel))throw Error('运行文件不能指向项目外部');
      await readFile(file,'utf8');kept.push(path);
    }catch(error){
      if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;
      if(name==='app.js')continue;
      const source=await readFile(join(skillRoot,'assets/commerce',name),'utf8');
      files.push({path,content:source});
    }
  }
  return {files,kept,appRequired:!kept.includes('js/app.js')};
}
