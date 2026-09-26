import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build, transform } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { CreatorState } from '../game/creator/CreatorState.ts';
import { partOptions, giColors, skinColors, hairColors } from '../game/creator/CreatorPartOptions.ts';

test('all appearance channels survive save/reopen, including black and legacy custom colors', () => {
  const state = new CreatorState();
  for (const key of Object.keys(state.p_idx)) state.p_idx[key] = key === 'skin' ? skinColors.length - 1 : key === 'hair' ? hairColors.length - 1 : giColors.length - 1;
  const saved = { ...state.toCustomData('spiderman', 'naruto'), color_acc_1: 0x123456, color_head_1: 0, aura_id: 'blue', aura_mode: 'all' };
  const reopened = new CreatorState();
  reopened.loadCustomData(saved);
  assert.deepEqual(reopened.toCustomData(saved.sp1_id, saved.sp2_id), saved);
  reopened.nextColor('acc_1', giColors);
  assert.equal(reopened.getColor('acc_1'), giColors[0]);
});

test('legacy gi colors migrate using the same fallbacks as the sprite renderer', () => {
  const state = new CreatorState();
  state.loadCustomData({ gi1: 0x123456, gi2: 0, skin: 0x987654, hair: 0 });
  const saved = state.toCustomData('goku', 'goku');
  assert.equal(saved.color_torso_1, 0x123456);
  assert.equal(saved.color_legs_2, 0);
  assert.equal(saved.color_feet_1, 0);
  assert.equal(saved.color_feet_2, 0x123456);
  assert.equal(saved.color_acc_1, 0);
});

test('every compatible head keeps its ID with a straw hat and when changing accessories', () => {
  for (const head of partOptions.head) {
    const state = new CreatorState();
    state.loadCustomData({gi1:0,gi2:0,skin:0,hair:0,part_head:head,part_accessory:'straw_hat'});
    assert.equal(state.getEquippedHead(), head);
    state.prevPart('accessory', partOptions.accessory);
    assert.equal(state.getEquippedHead(), head);
    state.nextPart('accessory', partOptions.accessory);
    assert.equal(state.getEquippedHead(), head);
  }
});

test('invalid colors and unavailable parts resolve to usable editor defaults', () => {
  const state = new CreatorState();
  state.loadCustomData({gi1:NaN,gi2:-1,skin:Infinity,hair:0x1000000,part_head:'missing',part_accessory:'missing'});
  assert.equal(state.getEquippedHead(), 'goku');
  assert.equal(state.getEquippedAccessory(), 'none');
  for (const part of Object.keys(state.p_idx)) assert.ok(Number.isInteger(state.getColor(part)));
});

const result = await build({
  entryPoints: ['game/scenes/CharacterCreatorScene.ts'], bundle: true, write: false, format: 'esm',
  plugins: [{name:'creator-boundaries',setup(b) {
    b.onResolve({filter:/^(phaser|.*\/(CloudSave|sceneTransition|CustomSprite))$/},args=>({path:args.path,namespace:'test'}));
    b.onLoad({filter:/.*/,namespace:'test'},args=>({contents: args.path === 'phaser'
      ? 'export default {Scene:class {}};'
      : args.path.endsWith('CloudSave') ? 'export function syncCloudSaveImmediate() {}'
      : args.path.endsWith('sceneTransition') ? 'export function transitionTo() {}'
      : 'export function generateCustomSprite(scene, data) { scene.generated = structuredClone(data); }'}));
  }}],
});
const {default:CreatorScene} = await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));

test('the battle recognizes the saved sword accessory and preserves legacy equipment saves', async () => {
  const source = await readFile('game/scenes/BattleScene.ts', 'utf8');
  const start = source.indexOf('  isSwordCharacter(data: any)');
  const method = source.slice(start, source.indexOf('  playTurnTransitionEffect()', start));
  const {code} = await transform(`export default class Probe { ${method} }`, {loader:'ts',format:'esm'});
  const {default:Probe} = await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
  const probe = new Probe();
  const custom = customData => ({key:'custom_999',baseKey:'goku',customData});
  assert.equal(probe.isSwordCharacter(custom({part_accessory:'sword'})),true);
  assert.equal(probe.isSwordCharacter(custom({accessory:'sword'})),true);
  assert.equal(probe.isSwordCharacter(custom({sword:true})),true);
  assert.equal(probe.isSwordCharacter(custom({part_accessory:'none',accessory:'sword',sword:true})),false);
  assert.equal(probe.isSwordCharacter(custom({part_accessory:'straw_hat'})),false);
  assert.equal(probe.isSwordCharacter({key:'cyberninja'}),true);
});

test('save uses UI-selected powers and registers punch, kick and casting for all custom forms immediately', () => {
  globalThis.localStorage = {getItem:()=>null,setItem:()=>{}};
  const scene = new CreatorScene();
  const gameState = {gameMode:'story',characters:[]};
  scene.registry = {get:()=>gameState,set:()=>{}};
  scene.state.loadCustomData({gi1:0,gi2:0,skin:0,hair:0,part_head:'vegeta',part_accessory:'straw_hat',color_torso_1:0x123456});
  scene.ui = {customSp1Id:'spiderman',customSp1Name:'Web Shooter',customSp2Id:'naruto',customSp2Name:'Rasenshuriken'};
  const registered = new Map();
  scene.textures = {exists:()=>true,get:key=>({key,source:[{isCanvas:true}],has:()=>true})};
  scene.anims = {exists:()=>false,create:config=>registered.set(config.key,config)};
  globalThis.window = {UTLW:{save(){}}};
  scene.saveAndEquipCharacter();
  const saved = gameState.characters[0];
  assert.equal(saved.customData.sp1_id,'spiderman');
  assert.equal(saved.customData.sp2_id,'naruto');
  assert.equal(saved.specialName,'Web Shooter');
  assert.equal(saved.customData.color_torso_1,0x123456);
  assert.equal(gameState.p1CharacterId,999);
  assert.deepEqual(scene.generated,saved);
  for (const suffix of ['', '_ssj', '_ui']) {
    const base = 'custom_999'+suffix;
    assert.deepEqual(registered.get(base+'_punch').frames,[{key:base,frame:'8'}]);
    assert.deepEqual(registered.get(base+'_kick').frames,[{key:base,frame:'9'}]);
    assert.deepEqual(registered.get(base+'_special').frames,[{key:base,frame:'8'}]);
    assert.deepEqual(registered.get(base+'_charge').frames,[{key:base,frame:'11'}]);
  }
  scene.state = new CreatorState();
  scene.loadInitialCustomData();
  assert.equal(scene.state.getEquippedHead(),'vegeta');
  assert.equal(scene.state.getColor('torso_1'),0x123456);
  assert.equal(scene.customSp1Id,'spiderman');
});
