import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';
import { build } from 'esbuild';
import Transform from 'phaser/src/gameobjects/components/Transform.js';
import TransformMatrix from 'phaser/src/gameobjects/components/TransformMatrix.js';
import { buttonsOverlap, safeButtonLayout } from '../game/utils/MobileButtonInput.ts';

// Execute the production BattleInput handlers headlessly. Only rendering and the
// Phaser/browser boundary are doubles; button labels, callbacks and hit areas are real.
const bundle = await build({
  entryPoints: ['game/battle/BattleInput.ts'], bundle: true, write: false, format: 'esm',
  plugins: [{ name: 'headless-phaser', setup(b) {
    b.onResolve({ filter: /^(phaser|.*\/Responsive(?:Utils)?)$/ }, args => ({ path: args.path, namespace: 'headless' }));
    b.onLoad({ filter: /.*/, namespace: 'headless' }, args => ({ contents: args.path === 'phaser'
      ? 'export default globalThis.__inputPhaser;'
      : 'export class Responsive { static getVisibleBounds() { return globalThis.__inputBounds; } }; export class ResponsiveUtils { static getSafeBounds() { return globalThis.__inputBounds; } }' }));
  } }],
});
globalThis.__inputBounds = { left: 48, right: 912, top: 27, bottom: 513, centerX: 480, centerY: 270 };
globalThis.__inputPhaser = {
  Geom: { Circle: class { constructor(x,y,radius) { Object.assign(this,{x,y,radius}); } } },
  Math: { Clamp: (v,a,b) => Math.max(a,Math.min(v,b)), Distance: { Between: (x,y,a,b) => Math.hypot(x-a,y-b) } },
  Input: { Keyboard: {
    KeyCodes: new Proxy({}, { get: (_, key) => key }),
    JustDown: k => { const v = !!k.justDown; k.justDown = false; return v; },
    JustUp: k => { const v = !!k.justUp; k.justUp = false; return v; },
  } },
};
const { BattleInput } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));

class ObjectDouble extends EventEmitter {
  constructor(x = 0, y = 0, text) {
    super(); Object.assign(this, { x, y, text, list: [], scaleX: 1, scaleY: 1, rotation: 0, scrollFactorX: 0, scrollFactorY: 0 });
    return new Proxy(this, { get: (target,key,receiver) => Reflect.has(target,key) ? Reflect.get(target,key,receiver)
      : typeof key === 'string' && /^(set|fill|line|stroke|clear)/.test(key) ? () => receiver : undefined });
  }
  add(children) { this.list.push(...(Array.isArray(children) ? children : [children])); return this; }
  setInteractive(hitArea, contains) { this.input = { enabled: true, hitArea, contains }; return this; }
  disableInteractive() { if (this.input) this.input.enabled = false; return this; }
  getLocalPoint(x,y,p,camera) { return Transform.getLocalPoint.call(this,x,y,p,camera); }
  setPosition(x,y) { Object.assign(this,{x,y}); return this; }
  setScale(x,y=x) { this.scaleX=x; this.scaleY=y; return this; }
  destroy() { this.removeAllListeners(); }
}
function setup(saved = {}, mobile = true) {
  const storage = new Map(Object.entries(saved).map(([k,v]) => ['hudPos_'+k, JSON.stringify(v)]));
  globalThis.localStorage = { getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v) };
  const doc = new EventTarget(); doc.hidden = false; globalThis.document = doc;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { userAgent: mobile ? 'Android' : 'Desktop' } });
  const input = new EventEmitter(); input.manager = { pointers: [] };
  input.setDraggable = (o, enabled=true) => { o.input.draggable=enabled; };
  input.keyboard = new EventEmitter(); input.keyboard.removeAllKeys = () => {};
  input.keyboard.addKeys = mapping => Object.fromEntries(Object.entries(mapping).map(([k,code]) => [k,{code,isDown:false}]));
  const scene = {
    input, events: new EventEmitter(), game: { events: new EventEmitter() },
    sys: { game: { device: { input: { touch: mobile } } } }, cameras: { main: { width:960,height:540,scrollX:0,scrollY:0,getWorldPoint:(x,y)=>({x,y}) } },
    gameState: { settings: {}, gameMode: 'local' }, localPlayerIndex:1, playerData:{transformAvailable:true},
    player:{flipX:false}, enemy:{flipX:true}, BUFFER_MS:200, p1AttackBuffer:0,p1KiBlastBuffer:0,p1TransformBuffer:0,
    add: { container:(x,y)=>new ObjectDouble(x,y), circle:(x,y)=>new ObjectDouble(x,y),
      text:(x,y,text)=>new ObjectDouble(x,y,text), graphics:()=>new ObjectDouble(), zone:(x,y)=>new ObjectDouble(x,y) },
    battleUI: { uiContainer: new ObjectDouble() }, cache:{audio:{exists:()=>false}},
    scene:{pause:()=>scene.events.emit('pause'),launch:()=>{}},
  };
  const battle = new BattleInput(scene); battle.createInputs(); battle.createMobileControls();
  const button = name => battle.mobileControls.find(o => o.list.some(child => child.text === name));
  const pointer = (id,x=0,y=0) => { const p={id,x,y,isDown:true,event:{type:'touchstart'}}; input.manager.pointers.push(p); return p; };
  const down = (name,p) => { let stopped=false; button(name).emit('pointerdown',p,0,0,{stopPropagation:()=>{stopped=true;}}); return stopped; };
  const up = (p,cancelled=false,outside=false) => { p.isDown=false; p.event={type:cancelled?'touchcancel':'touchend'}; input.emit(outside?'pointerupoutside':'pointerup',p); };
  return { battle,scene,input,button,pointer,down,up,doc };
}
const flags = b => [b.mobileP1Attack,b.mobileP1KiBlast,b.mobileP1Defend,b.mobileP1Charge,b.mobileP1Special,b.mobileP1Transform,!!b.mobileP1Dash];

test('actual ATK handler sets only attack, with its original buffer; KI stays independent', () => {
  const f=setup(); assert.equal(f.down('ATK',f.pointer(1)),true);
  assert.deepEqual(flags(f.battle),[true,false,false,false,false,false,false]);
  assert.equal(f.scene.p1AttackBuffer,200); assert.equal(f.scene.p1KiBlastBuffer,0);
  assert.equal(f.battle.checkActionJustDown('attack',true),true);
  assert.equal(f.battle.checkActionJustDown('attack',true),false);
  assert.equal(f.battle.checkActionJustDown('kiblast',true),false);
  f.down('KI',f.pointer(2)); assert.equal(f.battle.checkActionJustDown('kiblast',true),true);
  f.battle.destroy();
});
test('every rendered action label has its own mapping', () => {
  for (const [index,name] of ['ATK','KI','DEF','CHG','SPC','TRN','DSH'].entries()) {
    const f=setup(); f.down(name,f.pointer(1));
    assert.deepEqual(flags(f.battle),Array.from({length:7},(_,i)=>i===index),name);
    f.battle.destroy();
  }
});
test('reproduces the old invisible KI overlap, while the new hit test chooses ATK only', () => {
  // Defaults ATK=(812,418). KI is customized 100px to its right; visible circles do not overlap.
  const f=setup({KI:{x:912,y:418}}); const atk=f.button('ATK'), ki=f.button('KI');
  const x=860,y=418;
  assert.ok(Math.hypot(x-ki.x,y-ki.y)<38*1.5, 'old KI hit area steals this visible ATK touch');
  const hits=[atk,ki].filter(b=>b.input.contains(b.input.hitArea,x-b.x,y-b.y));
  assert.deepEqual(hits,[atk]);
  f.down('ATK',f.pointer(1,x,y)); assert.equal(f.battle.mobileP1KiBlast,false);
  f.battle.destroy();
});
test('default and saved button circles cannot overlap; invalid saved positions are ignored', () => {
  const f=setup({KI:{x:812,y:418},DEF:{x:'bad',y:0}});
  const circles=f.battle.mobileControls.filter(o=>o.input?.hitArea?.radius).map(o=>({x:o.x,y:o.y,radius:o.input.hitArea.radius}));
  for (let i=0;i<circles.length;i++) for(let j=i+1;j<circles.length;j++) assert.equal(buttonsOverlap(circles[i],circles[j]),false);
  assert.deepEqual(safeButtonLayout([{x:0,y:0,radius:10}],[{x:Infinity,y:NaN}]),[{x:0,y:0,radius:10}]);
  f.battle.destroy();
});
test('two fingers on one button: unrelated out/up cannot release the owner; last up releases', () => {
  const f=setup(),a=f.pointer(1),b=f.pointer(2),c=f.pointer(3);
  f.down('DEF',a); f.down('DEF',b);
  f.button('DEF').emit('pointerout',c); f.up(c); f.up(a);
  assert.equal(f.battle.mobileP1Defend,true);
  f.up(b,false,true); assert.equal(f.battle.mobileP1Defend,false);
  f.battle.destroy();
});
test('one pointer cannot switch ATK to KI; reuse after release works', () => {
  const f=setup(),p=f.pointer(1);
  f.down('ATK',p); f.down('KI',p); assert.equal(f.battle.mobileP1KiBlast,false);
  f.up(p); p.isDown=true; f.down('KI',p); assert.equal(f.battle.mobileP1KiBlast,true);
  f.battle.destroy();
});
test('joystick plus ATK plus KI keep independent pointer ownership', () => {
  const f=setup(),joy=f.pointer(1,150,400),atk=f.pointer(2),ki=f.pointer(3);
  f.input.emit('pointerdown',joy,[]); assert.equal(f.battle.mobileJoystickPointerId,1);
  f.down('ATK',atk); f.down('KI',ki); f.up(atk);
  assert.equal(f.battle.mobileJoystickPointerId,1); assert.equal(f.battle.mobileP1KiBlast,true);
  f.down('KI',joy); f.up(joy); assert.equal(f.battle.mobileJoystickPointerId,null);
  f.battle.destroy();
});
test('touchcancel and a missed up clear held state without firing SPC', () => {
  const f=setup(),p=f.pointer(1); f.down('SPC',p); f.up(p,true);
  assert.equal(f.battle.mobileP1Special,false); assert.equal(f.battle.mobileP1SpecialJustUp,false);
  const q=f.pointer(2); f.down('CHG',q); q.isDown=false; f.battle.update();
  assert.equal(f.battle.mobileP1Charge,false);
  f.battle.destroy();
});
test('normal SPC release still fires once', () => {
  const f=setup(),p=f.pointer(1); f.down('SPC',p); f.up(p);
  assert.equal(f.battle.checkActionJustUp('special',true),true);
  assert.equal(f.battle.checkActionJustUp('special',true),false); f.battle.destroy();
});
test('blur, pause, visibility and destroy clear states; destroy removes listeners', () => {
  for (const event of ['blur','pause','visibility','destroy']) {
    const f=setup(); f.down('ATK',f.pointer(1)); f.down('SPC',f.pointer(2)); f.down('CHG',f.pointer(3));
    if(event==='blur') f.scene.game.events.emit('blur');
    if(event==='pause') f.scene.events.emit('pause');
    if(event==='visibility') { f.doc.hidden=true; f.doc.dispatchEvent(new Event('visibilitychange')); }
    if(event==='destroy') f.battle.destroy();
    assert.deepEqual(flags(f.battle),Array(7).fill(false)); assert.equal(f.battle.mobileP1SpecialJustUp,false);
    assert.equal(f.scene.p1AttackBuffer,0); f.battle.destroy();
    assert.equal(f.input.listenerCount('pointerdown'),0); assert.equal(f.input.listenerCount('pointerup'),0);
    assert.equal(f.scene.game.events.listenerCount('blur'),0);
  }
});
test('HUD editing cannot produce combat input and overlapping drag reverts', () => {
  const f=setup(); const edit=f.button('🛠 HUD').list.find(o=>o.input);
  edit.emit('pointerdown',f.pointer(9)); assert.equal(f.battle.isEditingHUD,true);
  f.down('ATK',f.pointer(1)); assert.equal(f.battle.mobileP1Attack,false);
  const atk=f.button('ATK'),ki=f.button('KI'),before={x:ki.x,y:ki.y};
  ki.emit('dragstart'); ki.emit('drag',{},atk.x,atk.y); ki.emit('dragend');
  assert.deepEqual({x:ki.x,y:ki.y},before); f.battle.destroy();
});
test('desktop creates no mobile controls and preserves both players keyboard mappings', () => {
  const f=setup({},false);
  assert.equal(f.battle.mobileControls.length,0);
  assert.deepEqual(Object.fromEntries(Object.entries(f.battle.keys).map(([k,v])=>[k,v.code])),{
    p1_up:'W',p1_down:'S',p1_left:'A',p1_right:'D',p1_attack:'E',p1_kiblast:'C',p1_defend:'Q',p1_charge:'R',p1_special:'V',p1_transform:'X',
    p2_up:'UP',p2_down:'DOWN',p2_left:'LEFT',p2_right:'RIGHT',p2_attack:'I',p2_kiblast:'L',p2_defend:'O',p2_charge:'U',p2_special:'K',p2_transform:'P',pause:'ESC',
  });
  for (const player of [1,2]) for (const action of ['attack','kiblast','special','transform','left','right','up','down','charge','defend']) {
    const key=f.battle.keys[`p${player}_${action}`]; key.isDown=true;
    assert.equal(f.battle.checkActionDown(action,player===1),true); key.isDown=false;
    if(!['charge','defend'].includes(action)) { key.justDown=true; assert.equal(f.battle.checkActionJustDown(action,player===1),true); }
  }
  f.battle.destroy();
});

// Uses Phaser's actual Transform.getLocalPoint and TransformMatrix, rather than
// mocking the coordinate conversion that was missing from the original tests.
test('joystick follows visible directions under battle zoom and camera scrolling', () => {
  for (const zoom of [1, 0.8, 0.6]) {
    const f=setup(), camera=f.scene.cameras.main, hud=f.scene.battleUI.uiContainer;
    const scrollX=170,scrollY=38;
    const matrix=new TransformMatrix();
    matrix.applyITRS(480*(1-zoom),270*(1-zoom),0,zoom,zoom);
    camera.scrollX=scrollX; camera.scrollY=scrollY;
    camera.getWorldPoint=(x,y)=>{ const p=matrix.applyInverse(x,y); return {x:p.x+scrollX,y:p.y+scrollY}; };
    hud.setScale(1/zoom); hud.setPosition((960-960/zoom)/2,(540-540/zoom)/2);
    const p=f.pointer(1,134,427); f.input.emit('pointerdown',p,[]);
    assert.equal(f.battle.mobileJoystickPointerId,1);
    assert.ok(Math.abs(f.battle.mobileJoystickVector.x)<0.001);
    assert.ok(Math.abs(f.battle.mobileJoystickVector.y)<0.001);
    for(const [dx,dy,action] of [[45,0,'right'],[-45,0,'left'],[0,-45,'up'],[0,45,'down']]) {
      p.x=134+dx;p.y=427+dy;f.input.emit('pointermove',p);f.battle.update();
      assert.equal(f.battle.checkActionDown(action,true),true,`${zoom}: ${action}`);
    }
    f.up(p,false,true); assert.deepEqual(f.battle.mobileJoystickVector,{x:0,y:0}); f.battle.destroy();
  }
});
test('non-control HUD hit does not swallow joystick; real button still reserves touch', () => {
  const f=setup(),p=f.pointer(1,134,427);
  f.input.emit('pointerdown',p,[new ObjectDouble()]); assert.equal(f.battle.mobileJoystickPointerId,1);
  f.up(p); const q=f.pointer(2,134,427);
  f.input.emit('pointerdown',q,[f.button('ATK')]); assert.equal(f.battle.mobileJoystickPointerId,null);
  f.battle.destroy();
});
