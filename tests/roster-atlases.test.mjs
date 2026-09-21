import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';
const results=await build({entryPoints:['game/sprites/SpriteRegistry.ts','game/sprites/RosterAtlases.ts','game/data.ts'],outdir:'/tmp/roster-tests',bundle:true,write:false,format:'esm',define:{'import.meta.glob':'globalThis.__rosterGlob'},plugins:[{name:'headless-phaser',setup(b){b.onResolve({filter:/^phaser$/},()=>({path:'phaser',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export default {Textures:{FilterMode:{NEAREST:0}}};'}));}}]});
globalThis.__rosterGlob=()=>Object.fromEntries(['goku','vegeta','cyberninja','gohan_ui'].map(key=>[`../assets/roster/${key}-v1.png`,`/assets/${key}-hashed.png`]));
const modules=await Promise.all(results.outputFiles.map(f=>import('data:text/javascript;base64,'+Buffer.from(f.text+'\n//# sourceURL='+f.path).toString('base64'))));
const {SPRITE_GENERATORS,generateAllSprites}=modules.find(m=>m.SPRITE_GENERATORS),{INITIAL_CHARACTERS}=modules.find(m=>m.INITIAL_CHARACTERS),{preloadRosterAtlases}=modules.find(m=>m.preloadRosterAtlases);
function setup(existing=[]){const sheets=new Map(existing.map(k=>[k,{frames:[],setFilter(){},add(...args){this.frames.push(args);}}]));return {sheets,scene:{time:{now:0},make:{graphics:()=>({fillStyle(){},fillRect(){},generateTexture(key){sheets.set(key,{frames:[],setFilter(){},add(...args){this.frames.push(args);}});},destroy(){}})},textures:{exists:k=>sheets.has(k),get:k=>sheets.get(k),remove:k=>sheets.delete(k),getTextureKeys:()=>[...sheets.keys()]}}};}
test('all 22 fixed characters preserve every preloaded atlas and frame reference',()=>{
 const keys=INITIAL_CHARACTERS.flatMap(c=>[c.key,c.key+'_ssj',c.key+'_ui']);
 const {sheets,scene}=setup(keys),before=new Map(sheets);
 assert.equal(SPRITE_GENERATORS.length,22);
 for(const gen of SPRITE_GENERATORS)gen.fn(scene);
 for(const [k,v]of before)assert.equal(sheets.get(k),v,`replaced ${k}`);
});
test('a loaded Goku must not suppress fallback loading for the rest of the roster',()=>{
 const {sheets,scene}=setup(['goku']),goku=sheets.get('goku');generateAllSprites(scene);
 assert.equal(sheets.get('goku'),goku);
 for(const c of INITIAL_CHARACTERS)for(const suffix of ['', '_ssj','_ui']){
  const k=c.key+suffix;assert.ok(sheets.has(k),`${k} missing`);
  if(k!=='goku')assert.equal(sheets.get(k).frames.length,12,`${k} incomplete`);
 }
});
test('desktop and mobile load exactly the same new atlas keys and URLs',()=>{
 const load=desktop=>{const calls=[];preloadRosterAtlases({sys:{game:{device:{os:{desktop}}}},textures:{exists:()=>false},load:{spritesheet:(...args)=>calls.push(args)}});return calls;};
 assert.deepEqual(load(true),load(false));
 assert.ok(load(true).some(([key])=>key==='cyberninja'));
 assert.ok(load(true).some(([key])=>key==='gohan_ui'));
 for(const [,url,config]of load(true)){assert.match(url,/-hashed\.png$/);assert.deepEqual(config,{frameWidth:192,frameHeight:128});}
});

// Inspect real shipped PNGs, rather than accepting an empty or incomplete glob.
import {readFile,readdir} from 'node:fs/promises';
import sharp from 'sharp';
test('41 illustrated forms ship isolated frames; four blocked forms retain tested procedural fallback',async()=>{
 const manifest=JSON.parse(await readFile('docs/art/roster/manifest.json','utf8'));
 assert.equal(manifest.entries.length,45);
 assert.equal(new Set(manifest.entries.map(e=>e.key)).size,45);
 assert.deepEqual(new Set(manifest.entries.map(e=>e.character)),new Set(INITIAL_CHARACTERS.map(c=>c.key)));
 const emitted=(await readdir('game/assets/roster')).filter(f=>f.endsWith('-v1.png'));
 assert.equal(emitted.length,39);
 assert.deepEqual(manifest.entries.filter(e=>e.status==='generation-blocked').map(e=>e.key).sort(),['batman','batman_ssj','spiderman','spiderman_ssj']);
 for(const e of manifest.entries){
  if(e.status==='generation-blocked')continue;
  assert.ok(['packed','complete'].includes(e.status),`${e.key}: unfinished`);
  const {data,info}=await sharp(e.asset).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,192*12,e.key);assert.equal(info.height,128,e.key);
  for(let f=0;f<12;f++){
   let opaque=0,clear=0;
   for(let y=0;y<128;y++)for(let x=0;x<192;x++){
    const a=data[(y*info.width+f*192+x)*4+3];
    if(a>32)opaque++;if(a===0)clear++;
    if(x===0||x===191)assert.equal(a,0,`${e.key}: frame ${f} touches neighbor`);
   }
   assert.ok(opaque>100,`${e.key}: frame ${f} empty`);
   assert.ok(clear>192*128*.4,`${e.key}: frame ${f} background opaque`);
  }
 }
});

test('actual Phaser registration covers nine animation names for every playable form',async()=>{
 const poseBundle=await build({entryPoints:['game/sprites/CombatPoses.ts'],bundle:true,write:false,format:'esm'});
 const poses=poseBundle.outputFiles[0].text;
 const registration=await build({entryPoints:['game/sprites/FighterAnimations.ts'],bundle:true,write:false,format:'esm'});
 const {registerFighterAnimations}=await import('data:text/javascript;base64,'+Buffer.from(registration.outputFiles[0].text).toString('base64'));
 class Probe { createAnimsFor(key) { registerFighterAnimations(this,key); } }
 const probe=new Probe(),registered=new Map();
 probe.textures={exists:()=>true,get:key=>({key,source:[{isCanvas:false}],has:f=>Number(f)>=0&&Number(f)<12})};
 probe.anims={exists:()=>false,create:config=>registered.set(config.key,config)};
 for(const c of INITIAL_CHARACTERS)probe.createAnimsFor(c.key);
 const manifest=JSON.parse(await readFile('docs/art/roster/manifest.json','utf8'));
 const {COMBAT_POSES}=await import('data:text/javascript;base64,'+Buffer.from(poses).toString('base64'));
 const mapping={idle:[0,1,2,3],walk:[4,5,6,7],attack:[8,9],punch:[8],kick:[9],special:[8],defend:[10],transform:[0,1,2,3],charge:[11]};
 for(const e of manifest.entries)for(const [name,frames]of Object.entries(mapping)){
  const config=registered.get(`${e.key}_${name}`);assert.ok(config,`${e.key}_${name} missing`);
  const pose=COMBAT_POSES[e.key];
  const expected=name==='special'?[pose?.special??8]:name==='charge'?(pose?.charge===0?[0,1,2,3]:[pose?.charge??11]):frames;
  assert.deepEqual(config.frames.map(f=>Number(f.frame)),expected,`${e.key}_${name}`);
  assert.ok(config.frames.every(f=>f.key===e.key));
 }
});
