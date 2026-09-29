import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';
const results=await build({entryPoints:['game/characters/spiderman.ts','game/sprites/FighterAnimations.ts'],outdir:'/tmp/guardian-tests',bundle:true,write:false,format:'esm',plugins:[{name:'phaser-stub',setup(b){b.onResolve({filter:/^phaser$/},()=>({path:'phaser',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export default {BlendModes:{ADD:1}}'}));}}]});
const modules=await Promise.all(results.outputFiles.map(f=>import('data:text/javascript;base64,'+Buffer.from(f.text).toString('base64'))));
const {SpidermanFighter}=modules.find(m=>m.SpidermanFighter);
const {registerFighterAnimations}=modules.find(m=>m.registerFighterAnimations);
test('Vetor casts before socket lookup and keeps cable anchored without resizing the target',()=>{
 for(const flipX of [false,true])for(const transformLevel of [0,1]) {
  const tweens=[];let cast=false;
  const attacker={x:500,flipX,scaleX:3,play(){cast=true;}};
  const target={x:flipX?100:900,width:192};
  const hand={x:flipX?450:550,y:370};
  const line={...hand,setOrigin(x){this.originX=x;return this;},setDepth(){return this;},setSize(w,h){this.width=w;this.height=h;}};
  const scene={getAnimKey:()=>'',getHandPosition(){assert.ok(cast);return hand;},add:{rectangle:(x,y)=>{assert.equal(x,hand.x);assert.equal(y,hand.y);return line;}},tweens:{add:t=>tweens.push(t)},scene:{isActive:()=>true},createImpactEffect(){}};
  new SpidermanFighter().performSpecial({scene,attacker,defender:target,isPlayer:true,transformLevel});
  assert.equal(line.originX,flipX?1:0);
  assert.equal(tweens[0].width,Math.abs(target.x-hand.x));
  tweens[0].onComplete();
  const pull=tweens[1];assert.equal(pull.targets,target);assert.equal(pull.width,undefined);
  target.x=flipX?400:600;pull.onUpdate();
  assert.equal(line.x,hand.x);assert.equal(line.y,hand.y);
  assert.equal(line.width,Math.abs(target.x-hand.x));assert.equal(target.width,192);
 }
});
test('a twelve-frame custom copy never references missing guardian action frames',()=>{
 const animations=new Map();
 const scene={textures:{exists:k=>!k.endsWith('_ki')&&!k.endsWith('_genki'),get:key=>({key,customRosterKey:'batman',has:f=>Number(f)<12})},anims:{exists:()=>false,create:a=>animations.set(a.key,a)}};
 registerFighterAnimations(scene,'custom_999');
 for(const suffix of ['', '_ssj','_ui'])for(const action of ['defend','transform','charge','dash']) {
  const a=animations.get(`custom_999${suffix}_${action}`);assert.ok(a);
  assert.ok(a.frames.every(f=>Number(f.frame)<12));
 }
 assert.deepEqual(animations.get('custom_999_dash').frames.map(f=>Number(f.frame)),[4,5,6,7]);
});
