import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root=new URL('./',import.meta.url);
const read=name=>readFile(new URL(name,root),'utf8');
const files=['engine.js','software.js','city.js','penthouse.js','farm.js','sim.js','ui.js','game.js'];
const [template,styles,...scripts]=await Promise.all(['shell.html','style.css',...files].map(read));
const html=template.replace('/*STYLES*/',()=>styles).replace('/*SCRIPTS*/',()=>scripts.join('\n\n'));
await mkdir(new URL('dist/',root),{recursive:true});
for(const path of ['index.html','dist/index.html'])await writeFile(new URL(path,root),html);
console.log('Built '+fileURLToPath(new URL('index.html',root)));

