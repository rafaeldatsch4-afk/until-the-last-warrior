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
const sheets = new Map();
for (const [key, path] of [
  ['itachi', 'game/assets/itachi-pixel-v3.png'],
  ['itachi_ssj', 'game/assets/itachi-susanoo-v1.png'],
  ['itachi_ui', 'game/assets/itachi-susanoo-v1.png'],
]) {
  const png = await readFile(path);
  const metadata = await sharp(png).metadata();
  if (metadata.width !== 2304 || metadata.height !== 128 || !metadata.hasAlpha) throw new Error(`${key}: invalid atlas dimensions or transparency`);
  for (let i=0;i<12;i++) {
    const {data,info} = await sharp(png).extract({left:i*192,top:0,width:192,height:128}).raw().toBuffer({resolveWithObject:true});
    let count=0,bottom=-1;
    for(let y=0;y<128;y++)for(let x=0;x<192;x++)if(data[(y*192+x)*info.channels+3]>32){
      count++;bottom=y;
      if(x===0||x===191)throw new Error(`${key}: frame ${i} bleeds across its boundary`);
    }
    if(count<100||bottom<126)throw new Error(`${key}: frame ${i} is empty or its baseline is misaligned`);
  }
  sheets.set(key,{png,width:2304,height:128,frames:Array.from({length:12},(_,i)=>i)});
}
const loadedSheets = new Map(sheets);
const scene = { make:{graphics(){
  let color='#000',opacity=1; const rects=[];
  return { fillStyle(c,a){color='#'+c.toString(16).padStart(6,'0');opacity=a;},
    fillRect(x,y,w,h){rects.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" opacity="${opacity}"/>`);},
    generateTexture(name,w,h){sheets.set(name,{width:w,height:h,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${rects.join('')}</svg>`,frames:[]});},destroy(){} };
}}, textures:{exists:k=>sheets.has(k),remove:k=>sheets.delete(k),get:k=>({add:(...args)=>sheets.get(k).frames.push(args)})} };
generateItachiSprite(scene);
for(const [key,value] of loadedSheets) if(sheets.get(key)!==value) throw new Error(`${key}: preloaded pixel art was replaced`);
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
  await sharp(png).extract({left:0,top:name==='itachi'?64:0,width:192,height:name==='itachi'?64:128}).resize({width:768,kernel:'nearest'}).flatten({background:'#263344'}).png().toFile(`${out}/${name}-pose.png`);
  if(name==='itachi') await sharp(png).extract({left:82,top:66,width:28,height:28}).resize(336,336,{kernel:'nearest'}).flatten({background:'#263344'}).png().toFile(`${out}/face.png`);
}
// A partial loading failure must generate just the missing form, preserving others.
for (const missing of ['itachi', 'itachi_ssj', 'itachi_ui']) {
  sheets.clear();for(const [key,value] of loadedSheets)if(key!==missing)sheets.set(key,value);
  generateItachiSprite(scene);
  for(const [key,value] of loadedSheets)if(key!==missing&&sheets.get(key)!==value)throw new Error(`${missing}: fallback replaced ${key}`);
  if(sheets.get(missing)?.frames.length!==12)throw new Error(`${missing}: fallback incomplete`);
}
console.log(`Validated all 36 frames, preloaded references and partial-load fallbacks: ${out}`);
