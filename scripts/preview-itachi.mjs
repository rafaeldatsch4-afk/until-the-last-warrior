// Render the production procedural sprite without a browser or Phaser renderer.
// Usage: node scripts/preview-itachi.mjs /tmp/itachi-preview
import { build } from 'esbuild';
import sharp from 'sharp';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const out = process.argv[2] || '/tmp/itachi-preview';
await mkdir(out, { recursive: true });
const compiled = await build({ entryPoints:['game/sprites/ItachiSprite.ts'],bundle:true,write:false,format:'esm',
  plugins:[{name:'phaser-types-only',setup(b){b.onResolve({filter:/^phaser$/},()=>({path:'phaser',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export default {};'}));}}] });
const {generateItachiSprite} = await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const png = await readFile('game/assets/itachi-pixel-v3.png');
const metadata = await sharp(png).metadata();
if (metadata.width !== 2304 || metadata.height !== 128 || !metadata.hasAlpha) throw new Error('Invalid atlas dimensions or transparency');
for (let i=0;i<12;i++) {
  const {data,info} = await sharp(png).extract({left:i*192,top:0,width:192,height:128}).raw().toBuffer({resolveWithObject:true});
  let count=0,bottom=-1;
  for(let y=0;y<128;y++)for(let x=0;x<192;x++)if(data[(y*192+x)*info.channels+3]>32){
    count++;bottom=y;
    if(x===0||x===191)throw new Error(`Frame ${i} bleeds across its boundary`);
  }
  if(count<100||bottom<126)throw new Error(`Frame ${i} is empty or its feet are misaligned`);
}
const sheets = new Map([['itachi',{png,width:2304,height:128,frames:Array.from({length:12},(_,i)=>i)}]]);
const loadedBase = sheets.get('itachi');
const scene = { make:{graphics(){
  let color='#000',opacity=1; const rects=[];
  return { fillStyle(c,a){color='#'+c.toString(16).padStart(6,'0');opacity=a;},
    fillRect(x,y,w,h){rects.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" opacity="${opacity}"/>`);},
    generateTexture(name,w,h){sheets.set(name,{width:w,height:h,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${rects.join('')}</svg>`,frames:[]});},destroy(){} };
}}, textures:{exists:k=>sheets.has(k),remove:k=>sheets.delete(k),get:k=>({add:(...args)=>sheets.get(k).frames.push(args)})} };
generateItachiSprite(scene);
if (sheets.get('itachi') !== loadedBase) throw new Error('Preloaded pixel art was replaced');
const initialSheets = [...sheets.values()];
generateItachiSprite(scene);
if ([...sheets.values()].some((sheet, i) => sheet !== initialSheets[i])) {
  throw new Error('Repeated character selection replaced textures referenced by animations');
}
for(const [name,sheet] of sheets){
  if(sheet.frames.length!==12 || sheet.width!==2304 || sheet.height!==128) throw new Error('Frame contract changed');
  const png=sheet.png || await sharp(Buffer.from(sheet.svg)).png().toBuffer();
  await writeFile(`${out}/${name}.png`,png);
  // Entire first pose and face at integer scale; nearest-neighbour preserves actual game pixels.
  await sharp(png).extract({left:64,top:name==='itachi'?64:0,width:64,height:name==='itachi'?64:128}).resize({width:256,kernel:'nearest'}).flatten({background:'#263344'}).png().toFile(`${out}/${name}-pose.png`);
  if(name==='itachi') await sharp(png).extract({left:82,top:66,width:28,height:28}).resize(336,336,{kernel:'nearest'}).flatten({background:'#263344'}).png().toFile(`${out}/face.png`);
}
console.log(`Rendered all 36 frames: ${out}`);
