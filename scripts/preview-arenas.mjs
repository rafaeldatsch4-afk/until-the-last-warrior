// Optional headless preview: install @napi-rs/canvas or use the provided runtime.
// node scripts/preview-arenas.mjs /tmp/utlw-arena-review
import { build } from 'esbuild';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
let canvas;
try { canvas=await import('@napi-rs/canvas'); }
catch { const root=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;if(!root)throw new Error('Install @napi-rs/canvas to render the optional previews');canvas=await import(pathToFileURL(root+'/@napi-rs/canvas/index.js').href); }
const {createCanvas}=canvas;
const out=process.argv[2]||'/tmp/utlw-arena-review';await mkdir(out,{recursive:true});
const built=await build({entryPoints:['game/battle/AnimeArenaArt.ts'],bundle:true,write:false,format:'esm'});
const {ANIME_ARENA_DRAWERS,drawAnimeArena}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const sheets=[];let index=0;
for(const key of Object.keys(ANIME_ARENA_DRAWERS)){
 const c=createCanvas(1920,1080);drawAnimeArena(c.getContext('2d'),key,1920,1080);
 const png=process.argv.includes('--fallback') ? c.toBuffer('image/png') : await readFile(`game/assets/arenas/${key}-v1.webp`);
 await sharp(png).png().toFile(`${out}/${key}.png`);
 const preview=await sharp(png).resize(640,360).png().toBuffer();sheets.push({input:preview,left:index%2*640,top:Math.floor(index/2)*360});index++;
 // The actual 960x540 battle viewport, before camera pan/zoom.
 await sharp(png).resize(2200,1238).extract({left:620,top:349,width:960,height:540}).png().toFile(`${out}/${key}-camera.png`);
}
await sharp({create:{width:1280,height:1440,channels:4,background:'#202735'}}).composite(sheets).png().toFile(`${out}/contact-sheet.png`);
console.log(`Rendered ${index} full arenas and their battle-camera crops to ${out}`);
