import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {build} from 'esbuild';

const bundle=await build({entryPoints:['game/sprites/FighterAnimations.ts'],bundle:true,write:false,format:'esm'});
const {registerFighterAnimations}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));

test('all Goku forms select dedicated Ki and overhead Genki art without changing other actions',()=>{
  const animations=new Map();
  registerFighterAnimations({textures:{exists:()=>true,get:()=>({has:()=>true})},anims:{exists:()=>false,create:a=>animations.set(a.key,a)}},'goku');
  for(const key of ['goku','goku_ssj','goku_ui']){
    assert.deepEqual(animations.get(key+'_charge').frames,[{key:key+'_ki',frame:'0'}]);
    assert.deepEqual(animations.get(key+'_genki').frames,[{key:key+'_genki',frame:'0'}]);
    assert.ok(animations.get(key+'_idle').frames.every(f=>f.key===key));
    assert.ok(animations.get(key+'_special').frames.every(f=>f.key===key));
  }
});

test('six HD power poses retain transparent margins and enough overhead room',async()=>{
  const manifest=JSON.parse(await readFile('docs/art/roster/power-poses.json','utf8'));
  assert.equal(manifest.entries.length,6);
  const heights=new Map();
  for(const entry of manifest.entries){
    const {data,info}=await sharp(entry.asset).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    assert.equal(info.width,576);assert.equal(info.height,384);
    let count=0,top=384,bottom=0;
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
      const alpha=data[(y*info.width+x)*4+3];
      if(x===0||x===575||y===0)assert.equal(alpha,0,`${entry.key}: clipped boundary`);
      if(alpha>100){count++;top=Math.min(top,y);bottom=Math.max(bottom,y);}
    }
    assert.ok(count>3000&&count<info.width*info.height*.3,entry.key);
    assert.ok(bottom>=380,entry.key+': feet must stay at baseline');
    heights.set(entry.key,bottom-top);
  }
  for(const key of ['goku','goku_ssj','goku_ui'])assert.ok(heights.get(key+'_genki')>heights.get(key+'_ki')*1.1,key+': raised arms must extend above the standing silhouette');
});
