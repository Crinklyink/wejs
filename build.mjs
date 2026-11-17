import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root=new URL('./',import.meta.url);
const read=name=>readFile(new URL(name,root),'utf8');
const files=['engine.js','materials.js','perspective.js','handprops.js','software.js','city.js','penthouse.js','farm.js','sim.js','story.js','orders.js','audio.js','ui.js','game.js'];
const [template,base,immersive,...scripts]=await Promise.all(['shell.html','style.css','immersive.css',...files].map(read));
const html=template.replace('/*STYLES*/',()=>base+'\n'+immersive).replace('/*SCRIPTS*/',()=>scripts.join('\n\n'));
await mkdir(new URL('dist/',root),{recursive:true});
for(const path of ['index.html','dist/index.html'])await writeFile(new URL(path,root),html);
console.log('Built '+fileURLToPath(new URL('index.html',root)));

