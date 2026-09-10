import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const result=await build({entryPoints:['game/sprites/ItachiAtlases.ts'],bundle:true,write:false,format:'esm',define:{'import.meta.url':JSON.stringify(pathToFileURL(resolve('game/sprites/ItachiAtlases.ts')).href)}});
const {preloadItachiAtlases}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
function load(desktop,existing=[]) {
  const requests=[];
  preloadItachiAtlases({sys:{game:{device:{os:{desktop},input:{touch:!desktop}}}},textures:{exists:key=>existing.includes(key)},load:{spritesheet:(...args)=>requests.push(args)}});
  return requests;
}
test('PC and mobile request the same normal Itachi and Susanoo atlases',()=>{
  const pc=load(true),mobile=load(false);
  assert.deepEqual(pc,mobile);
  assert.deepEqual(pc.map(r=>r[0]),['itachi','itachi_ssj','itachi_ui']);
  assert.ok(pc[0][1].endsWith('/assets/itachi-pixel-v3.png'));
  for(const request of pc){
    assert.deepEqual(request[2],{frameWidth:192,frameHeight:128});
    if(request[0]!=='itachi')assert.ok(request[1].endsWith('/assets/itachi-susanoo-v1.png'));
  }
});
test('re-entering preload keeps existing animation textures on both platforms',()=>{
  for(const desktop of [true,false]){
    assert.equal(load(desktop,['itachi','itachi_ssj','itachi_ui']).length,0);
    assert.deepEqual(load(desktop,['itachi','itachi_ui']).map(r=>r[0]),['itachi_ssj']);
  }
});
