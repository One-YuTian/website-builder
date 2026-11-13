import assert from 'node:assert/strict';
import {readFile,readdir,access} from 'node:fs/promises';
import {resolve,dirname,join,relative} from 'node:path';

const root=resolve('skills');
const expected=['website-acceptance','website-builder','website-copywriter','website-image-generator','website-import-data','website-mock-data'];
const actual=(await readdir(root,{withFileTypes:true})).filter(item=>item.isDirectory()).map(item=>item.name).sort();
assert.deepEqual(actual,expected);
const titles=new Set();
for(const skill of expected){
 const yaml=await readFile(join(root,skill,'agents/openai.yaml'),'utf8');
 const title=JSON.parse(yaml.match(/^\s+display_name:\s*(".*")$/m)[1]);
 const description=JSON.parse(yaml.match(/^\s+short_description:\s*(".*")$/m)[1]);
 assert.ok(title.startsWith('网站')&&!titles.has(title));titles.add(title);
 assert.ok([...description].length>=25&&[...description].length<=64);
 assert.ok(!description.includes('website-'),'UI introduction describes functionality, not the skill slug');
 const markdown=await readFile(join(root,skill,'SKILL.md'),'utf8');
 assert.equal(markdown.match(/^description:\s*(.+)$/m)[1].trim(),description);
 if(skill==='website-acceptance')assert.match(yaml,/allow_implicit_invocation: false/);
}
let links=0;
async function inspect(folder){
 for(const entry of await readdir(folder,{withFileTypes:true})){
  const path=join(folder,entry.name);
  if(entry.isDirectory())await inspect(path);
  else if(entry.name.endsWith('.md')){
   const text=await readFile(path,'utf8');
   if(entry.name==='SKILL.md')assert.equal(text.match(/^name:\s*["']?([^\n"']+)/m)?.[1].trim(),relative(root,dirname(path)).replaceAll('\\','/'));
   for(const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
    const target=match[1].replace(/^<|>$/g,'').split('#')[0];
    if(!target||/^(?:[a-z]+:|\/|\$)/i.test(target)||!/[.](?:md|json|mjs|py|js|txt)$/.test(target))continue;
    await access(resolve(dirname(path),decodeURIComponent(target))).catch(()=>assert.fail(`Broken skill link: ${path} -> ${target}`));links++;
   }
  }
 }
}
await inspect(root);
for(const path of ['website-builder/assets/ui/toast.js','website-builder/references/original-skill.md','website-mock-data/references/original-skill.md','website-builder/scripts/read-template.mjs','website-builder/scripts/hook-page.mjs'])await assert.rejects(access(join(root,path)));
const doc=await readFile(join(root,'website-image-generator/references/imagegen-workflow.md'),'utf8');
assert.ok(doc.includes('Default built-in tool mode')&&doc.includes('Fallback CLI mode'));
assert.ok(!doc.includes('render the image inline'));
await access(join(root,'website-image-generator/scripts/image_gen.py'));
await access(join(root,'website-image-generator/LICENSE.txt'));
console.log(JSON.stringify({result:'PASS',skills:actual,localLinks:links,checks:['consistent discovery names and links','no legacy Toast or duplicate template scripts','migrated official imagegen workflow, CLI and license; UI delivery']}));
