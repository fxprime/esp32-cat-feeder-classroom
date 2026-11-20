import { mkdir, writeFile, stat } from 'node:fs/promises';
import sharp from 'sharp';
import { recipes } from '../public/scripts/pinout/data.js';
import { circuitSVG } from '../public/scripts/pinout/diagrams.js';
const output=new URL('../public/assets/wiring/',import.meta.url);
await mkdir(output,{recursive:true});
const sizes=[];
for(const r of recipes){
 const svg=circuitSVG(r);
 await writeFile(new URL(`${r.id}.svg`,output),svg);
 for(const [suffix,width] of [['',600],['-full',1200]]){
  await sharp(Buffer.from(svg)).resize(width).webp({quality:82,effort:5,smartSubsample:true}).toFile(new URL(`${r.id}${suffix}.webp`,output).pathname);
 }
 const {size}=await stat(new URL(`${r.id}.webp`,output));sizes.push({id:r.id,bytes:size});
}
await writeFile(new URL('manifest.json',output),JSON.stringify({generatedFrom:'public/scripts/pinout/{data,diagrams}.js',thumbnailWidth:600,downloadWidth:1200,images:sizes},null,2)+'\n');
console.log(`Prepared ${sizes.length} vector circuits + WebP thumbnails: ${Math.round(sizes.reduce((n,s)=>n+s.bytes,0)/1024)} KiB total`);
