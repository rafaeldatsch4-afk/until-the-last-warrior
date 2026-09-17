import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';
import {readFile,readdir,stat} from 'node:fs/promises';
import sharp from 'sharp';
const keys=['arena','arena_namek','arena_city','arena_tournament','arena_ice','arena_lava','arena_desert','arena_dark'];
const stub={name:'headless',setup(b){b.onResolve({filter:/^phaser$/},()=>({path:'phaser',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export default {Textures:{FilterMode:{LINEAR:1}},Utils:{Array:{GetRandom:a=>a[0]}}};'}));}};
async function load(file){const r=await build({entryPoints:[file],bundle:true,write:false,format:'esm',define:{'import.meta.glob':'globalThis.__arenaGlob'},plugins:[stub]});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));}
globalThis.__arenaGlob=()=>Object.fromEntries(keys.map(k=>[`../assets/arenas/${k}-v1.webp`,`/assets/${k}-hash.webp`]));
const {preloadArenaArt}=await load('game/battle/ArenaAtlases.ts');
const {ArenaTextureBuilder}=await load('game/battle/ArenaTextureBuilder.ts');
const {BattleEnvironment}=await load('game/battle/BattleEnvironment.ts');

test('all eight real arena images decode and stay within the mobile download budget',async()=>{
 assert.deepEqual((await readdir('game/assets/arenas')).sort(),keys.map(k=>k+'-v1.webp').sort());
 let total=0;for(const k of keys){const path=`game/assets/arenas/${k}-v1.webp`;const image=sharp(path);const meta=await image.metadata();assert.ok(meta.width>=1600);assert.ok(Math.abs(meta.width/meta.height-16/9)<.01);assert.ok((await image.stats()).channels.every(c=>c.stdev>5));total+=(await stat(path)).size;}
 assert.ok(total<3*1024*1024,`${total} exceeds 3 MiB`);
});
test('desktop and mobile request all eight identical URLs, preserving loaded textures',()=>{
 const run=(desktop,existing=[])=>{const requests=[];preloadArenaArt({sys:{game:{device:{os:{desktop}}}},textures:{exists:k=>existing.includes(k)},load:{image:(...a)=>requests.push(a)}});return requests;};
 assert.deepEqual(run(true),run(false));assert.deepEqual(run(true).map(r=>r[0]),keys);assert.deepEqual(run(false,keys),[]);
 assert.deepEqual(run(true,keys.filter(k=>k!=='arena_namek')).map(r=>r[0]),['arena_namek']);
});
test('fallback preserves image objects and renders only a failed image after loading',async()=>{
 const existing=new Map(keys.map(k=>[k,{}])),before=new Map(existing);let created=0,refreshed=0;
 const gradient={addColorStop(){}};
 const ctx=new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>gradient:()=>{},set:()=>true});
 const scene={textures:{exists:k=>existing.has(k),createCanvas(k,w,h){created++;assert.equal(w,1920);assert.equal(h,1080);const tex={setFilter(){},getContext:()=>ctx,refresh(){refreshed++;}};existing.set(k,tex);return tex;}}};
 ArenaTextureBuilder.buildAllArenaTextures(scene);assert.equal(created,0);
 existing.delete('arena_namek');ArenaTextureBuilder.buildAllArenaTextures(scene);assert.equal(created,1);assert.equal(refreshed,1);
 for(const k of keys.filter(k=>k!=='arena_namek'))assert.equal(existing.get(k),before.get(k));
 ArenaTextureBuilder.buildAllArenaTextures(scene);assert.equal(created,1);
 const source=await readFile('game/scenes/PreloadScene.ts','utf8');const start=source.indexOf('  create() {');
 assert.ok(!source.slice(0,start).includes('ArenaTextureBuilder.buildAllArenaTextures(this)'));
 assert.ok(source.slice(start).includes('ArenaTextureBuilder.buildAllArenaTextures(this)'));
});
test('weather emission is bounded on mobile and both environment timers are cleaned up',()=>{
 for(const reduced of [false,true])for(const key of keys){
  const events=[],particles=[];let destroyed=0;
  const scene={gameState:{settings:{lowPerformanceMode:reduced}},textures:{exists:()=>true},add:{particles(x,y,texture,config){particles.push(config);return {setDepth(){},destroy(){destroyed++;}};}},time:{addEvent(config){events.push(config);return {destroy(){destroyed++;}};}}};
  const env=new BattleEnvironment(scene,{},key);
  for(const p of particles){assert.ok(p.quantity<= (reduced?1:3));assert.ok(p.frequency>=100);}
  assert.equal(events.length,['arena_lava','arena_dark'].includes(key)?2:1);
  env.destroy();assert.equal(destroyed,events.length+particles.length);
 }
});
test('offline precache includes the new WebP format',async()=>{
 const source=await readFile('vite.config.ts','utf8');assert.match(source,/globPatterns:[^\n]*webp/);
});
