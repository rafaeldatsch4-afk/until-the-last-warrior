import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
const result=await build({entryPoints:['game/characters/itachi.ts','game/battle/vfx/SpecialEffects.ts'],outdir:'/tmp/special-tests',bundle:true,write:false,format:'esm',plugins:[{name:'phaser-boundary',setup(b){b.onResolve({filter:/^phaser$/},()=>({path:'phaser',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export default {};'}));}}]});
const modules=await Promise.all(result.outputFiles.map(f=>import('data:text/javascript;base64,'+Buffer.from(f.text).toString('base64'))));
const {ItachiFighter}=modules.find(m=>m.ItachiFighter);
const {SpecialEffects,drawSpecialFrame}=modules.find(m=>m.SpecialEffects);

function clock(){let now=0;const queue=[];return {get now(){return now;},delayedCall(ms,fn){queue.push({at:now+ms,fn});},to(end){while(true){queue.sort((a,b)=>a.at-b.at);if(!queue.length||queue[0].at>end)break;const job=queue.shift();now=job.at;job.fn();}now=end;}};}
for(const method of ['performSpecial','performSuper'])for(const player of [true,false])for(const level of [0,1,2]) {
  test(`${method}: player ${player}, form ${level} preserves damage, hit time and completion`,()=>{
    const timer=clock(),hits=[],done=[],poses=[],visuals=[];
    const actor={active:true,flipX:!player,play:p=>poses.push(p)};
    const scene={scene:{isActive:()=>true},time:timer,log(){},getDamageMultiplier:l=>[1,1.25,1.5][l],getAnimKey:(_k,l,a)=>`itachi_${l}_${a}`,effects:{specials:{play:(...a)=>visuals.push(a)}},takeDamage:(p,d)=>hits.push([timer.now,p,d]),onSpecialComplete:p=>done.push([timer.now,p]),cameras:{main:{shake(){}}}};
    new ItachiFighter()[method]({scene,attacker:actor,defender:{active:true},isPlayer:player,transformLevel:level});
    const hit=method==='performSpecial'?1000:2200,end=method==='performSpecial'?1300:2200,base=method==='performSpecial'?40:100;
    timer.to(hit-1);assert.equal(hits.length,0);assert.equal(done.length,0);
    timer.to(hit);assert.deepEqual(hits,[[hit,!player,Math.floor(base*[1,1.25,1.5][level])]]);
    timer.to(end);assert.deepEqual(done,[[end,player]]);
    timer.to(10000);assert.equal(hits.length,1);assert.equal(done.length,1);
    assert.equal(poses[0],`itachi_${level}_charge`);assert.ok(poses.includes(`itachi_${level}_attack`));
    assert.equal(visuals[0][3],player?1:-1);
  });
}
test('leaving the battle before impact prevents delayed damage or completion',()=>{
 for(const method of ['performSpecial','performSuper']){
  const timer=clock();let active=true;
  const fail=()=>assert.fail('combat callback after shutdown');
  const scene={scene:{isActive:()=>active},time:timer,log(){},getDamageMultiplier:()=>1,getAnimKey:()=>'',effects:{specials:{play(){}}},takeDamage:fail,onSpecialComplete:fail};
  new ItachiFighter()[method]({scene,attacker:{active:true,play(){}},defender:{},isPlayer:true,transformLevel:0});
  active=false;timer.to(10000);
 }
});
function graphics(){const calls=[];const obj={active:true,destroy(){this.active=false;},calls};return new Proxy(obj,{get:(o,k)=>k in o?o[k]:(...args)=>{calls.push([k,...args]);return obj.proxy;}});}
test('all effect phases render deterministically; reduced quality draws fewer details',()=>{
 for(const kind of ['cast','amaterasu','tsukuyomi'])for(const time of [0,100,500,1000,1550,1700,2200,2350]){
  const render=low=>{const g=graphics();g.proxy=g;drawSpecialFrame(g,{kind,time,x:480,y:270,color:0xf44336,direction:1,low});return g.calls;};
  const full=render(false);assert.deepEqual(full,render(false));assert.ok(render(true).length<=full.length);
  for(const cmd of full)for(const n of cmd.slice(1))if(typeof n==='number')assert.ok(Number.isFinite(n));
 }
});
test('VFX are bounded, expire and detach every listener on scene shutdown',()=>{
 const handlers=new Map(),objects=[];
 const events={on(k,fn,context){handlers.set(k,()=>fn.call(context,0,100));},once(k,fn,context){handlers.set(k,()=>fn.call(context));},off(k){handlers.delete(k);}};
 const scene={events,scene:{isActive:()=>true},gameState:{settings:{lowPerformanceMode:true}},add:{graphics(){const g=graphics();g.proxy=g;objects.push(g);return g;}}};
 const fx=new SpecialEffects(scene),target={active:true,x:300,y:200,texture:{key:'itachi'}};
 for(let i=0;i<10;i++)fx.play('cast',target);
 assert.equal(objects.filter(o=>o.active).length,6);
 for(let i=0;i<7;i++)handlers.get('update')();
 assert.equal(objects.filter(o=>o.active).length,0);
 fx.play('amaterasu',target);fx.play('tsukuyomi',target);
 handlers.get('shutdown')();assert.equal(objects.filter(o=>o.active).length,0);assert.equal(handlers.size,0);
 fx.destroy(); // teardown can also be called by BattleEffects.destroy
});
