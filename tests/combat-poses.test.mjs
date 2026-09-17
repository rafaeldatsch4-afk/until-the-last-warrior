import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
const built=await build({entryPoints:['game/sprites/CombatPoses.ts','game/systems/AnimKeyMap.ts','game/characters/goku.ts'],outdir:'/tmp/combat-pose-tests',bundle:true,write:false,format:'esm',plugins:[{name:'phaser-stub',setup(b){b.onResolve({filter:/^phaser$/},()=>({path:'phaser',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export default {BlendModes:{ADD:1}}'}));}}]});
const modules=await Promise.all(built.outputFiles.map(f=>import('data:text/javascript;base64,'+Buffer.from(f.text).toString('base64'))));
const {COMBAT_POSES,getAttackSocket,getAttackDirection,getCombatPose}=modules.find(m=>m.getAttackSocket);
const {animKeyToId,animIdToSuffix}=modules.find(m=>m.animKeyToId);
const sprite=(key='goku',frame=11)=>({x:500,y:270,width:192,height:128,originX:.5,originY:.5,scaleX:3,scaleY:3,flipX:false,flipY:false,rotation:0,texture:{key,source:[{isCanvas:false}]},frame:{name:String(frame)}});

test('every illustrated form has a separately reviewed casting/charging contract and visible muzzle',async()=>{
 const {entries}=JSON.parse(await readFile('docs/art/roster/manifest.json','utf8'));
 for(const e of entries.filter(e=>e.asset)){
  const pose=COMBAT_POSES[e.key];assert.ok(pose,e.key);
  assert.notEqual(pose.charge,pose.special,`${e.key}: charge reuses cast`);
  assert.ok([8,11].includes(pose.special),`${e.key}: special kicks`);
  const {data,info}=await sharp(e.asset).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(const frame of [8,pose.special]){
   const [x,y]=frame===11?pose.cast:pose.hand;
   let visible=false;
   for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){
    const px=frame*192+x+dx,py=y+dy;
    if(py>=0&&py<128&&data[(py*info.width+px)*4+3]>32)visible=true;
   }
   assert.ok(visible,`${e.key} frame ${frame}: socket floats away from art (${x},${y})`);
  }
 }
});

test('Goku hands align to the actual cast and extended-arm frames in both directions',()=>{
 const s=sprite();assert.deepEqual(getAttackSocket(s),{x:479,y:372});
 s.flipX=true;assert.deepEqual(getAttackSocket(s),{x:521,y:372});
 s.frame.name='8';assert.deepEqual(getAttackSocket(s),{x:422,y:318});
 s.flipX=false;assert.deepEqual(getAttackSocket(s),{x:578,y:318});
});

test('socket transformation respects nonuniform scale, custom origin, rotation and vertical mirror',()=>{
 const s={...sprite(),originX:0,originY:1,scaleX:2,scaleY:4,rotation:Math.PI/2};
 const p=getAttackSocket(s);assert.ok(Math.abs(p.x-620)<1e-9);assert.ok(Math.abs(p.y-448)<1e-9);
 s.flipY=true;const q=getAttackSocket(s);assert.ok(Math.abs(q.x-892)<1e-9);assert.ok(Math.abs(q.y-448)<1e-9);
 assert.equal(getAttackDirection(s),1);s.flipX=true;assert.equal(getAttackDirection(s),-1);
 s.scaleX=-2;assert.equal(getAttackDirection(s),1);
});

test('missing PNGs and custom/procedural forms do not inherit illustrated sockets',()=>{
 const s=sprite();s.texture.source[0].isCanvas=true;
 assert.equal(getCombatPose(s.texture),undefined);
 assert.deepEqual(getAttackSocket(s),{x:608,y:360});
 s.texture.key='custom_999';assert.equal(getCombatPose(s.texture),undefined);
});

test('online animation IDs preserve existing protocol and distinguish Ki, punches and kicks',()=>{
 const old=['idle','walk','attack','special','defend','transform','jump','hit','ko'];
 old.forEach((name,id)=>assert.equal(animKeyToId('goku_'+name),id));
 for(const name of ['charge','punch','kick'])assert.equal(animIdToSuffix(animKeyToId('goku_ssj_'+name)),name);
});

test('Kamehameha keeps the casting pose and spawns core/glow at the hands after crossing sides',()=>{
 const mod=modules.find(m=>Object.keys(m).some(k=>/Goku/.test(k)));
 const Goku=Object.values(mod).find(v=>typeof v==='function'&&v.prototype?.performSpecial);
 for(const flipX of [false,true]){
  const attacker=Object.assign(sprite(),{active:true,play(key){this.lastAnim=key;return this;}});attacker.flipX=flipX;
  const tweens=[],shapes=[];let damage=0,complete=0;
  const shape=(kind,x,y)=>{const s={kind,x,y,setDepth(){return this;},setBlendMode(){return this;},setOrigin(x,y){this.originX=x;return this;},destroy(){}};shapes.push(s);return s;};
  const scene={getAnimKey:(key,level,pose)=>`${key}_${pose}`,getHandPosition:()=>getAttackSocket(attacker),getDamageMultiplier:()=>1,scene:{isActive:()=>true},add:{circle:(x,y)=>shape('circle',x,y),rectangle:(x,y)=>shape('beam',x,y)},tweens:{add:t=>tweens.push(t)},cameras:{main:{shake(){}}},createImpactEffect(){},takeDamage:(p,d)=>damage+=d,onSpecialComplete:()=>complete++};
  new Goku().performSpecial({scene,attacker,defender:{x:flipX?100:900,y:270},isPlayer:true,transformLevel:0});
  assert.equal(attacker.lastAnim,'goku_special');tweens.shift().onComplete();
  assert.equal(attacker.lastAnim,'goku_special');
  for(const beam of shapes.filter(s=>s.kind==='beam')){
   assert.equal(beam.y,372);assert.equal(beam.x,flipX?521:479);assert.equal(beam.originX,flipX?1:0);
  }
  tweens.shift().onComplete();tweens.shift().onComplete();assert.equal(damage,40);assert.equal(complete,1);
 }
});
