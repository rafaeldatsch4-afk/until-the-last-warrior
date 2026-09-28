import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';
const bundle=await build({entryPoints:['game/sprites/CustomAppearance.ts'],bundle:true,write:false,format:'esm',plugins:[{name:'sprite-boundary',setup(b){
  b.onResolve({filter:/\/CustomSprite$/},()=>({path:'sprite',namespace:'stub'}));
  b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:`export function generateCustomSprite(s,c){s.builds++; for(const suffix of ['','_ssj','_ui']){const key=c.key+suffix;s.sheets.set(key,{key,customWardrobeArt:true,customAppearanceSignature:JSON.stringify(c.customData),has:()=>true});}}`}));
}}]});
const {ensureCustomAppearance}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
function fixture(){const sheets=new Map(),animations=new Map();return {sheets,animations,builds:0,textures:{exists:k=>sheets.has(k),get:k=>sheets.get(k)},anims:{exists:k=>animations.has(k),remove:k=>animations.delete(k),create:c=>animations.set(c.key,c)}};}
const character=color=>({key:'custom_999',customData:{gi1:color,gi2:0,skin:0xf1c394,hair:0}});
test('entering story restores its own wardrobe after another mode used the same texture key',()=>{
  const s=fixture(),story=character(0xff4400),versus=character(0x8800ff);
  ensureCustomAppearance(s,story);const original=s.sheets.get('custom_999');
  ensureCustomAppearance(s,story);assert.equal(s.builds,1);assert.equal(s.sheets.get('custom_999'),original);
  ensureCustomAppearance(s,versus);ensureCustomAppearance(s,story);
  assert.equal(s.builds,3);assert.equal(s.sheets.get('custom_999').customAppearanceSignature,JSON.stringify(story.customData));
  for(const suffix of ['','_ssj','_ui']){
    assert.deepEqual(s.animations.get('custom_999'+suffix+'_charge').frames,[{key:'custom_999'+suffix,frame:'11'}]);
    assert.deepEqual(s.animations.get('custom_999'+suffix+'_genki').frames,[{key:'custom_999'+suffix,frame:'12'}]);
    assert.equal(s.animations.get('custom_999'+suffix+'_special').frames.length,1);
  }
});
test('missing transformed textures are repaired and missing animations do not regenerate artwork',()=>{
  const s=fixture(),c=character(0);ensureCustomAppearance(s,c);
  s.sheets.delete('custom_999_ui');ensureCustomAppearance(s,c);assert.equal(s.builds,2);
  s.animations.delete('custom_999_kick');ensureCustomAppearance(s,c);assert.equal(s.builds,2);assert.ok(s.animations.has('custom_999_kick'));
});
