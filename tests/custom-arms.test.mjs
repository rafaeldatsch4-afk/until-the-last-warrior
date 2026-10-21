import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { BACK_ARM, BODY, FRONT_ARM, splitArms } from '../game/sprites/CustomArms.ts';
import { partOptions } from '../game/creator/CreatorPartOptions.ts';

// Saitama's cape hides his back arm; the gap beside it is the cape, not an armpit.
const CAPED = ['saitama'];

test('a cape is never taken for an arm', async () => {
  for (const torso of CAPED) {
    const { data, info } = await sharp(`game/assets/custom/torso-${torso}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const rig = splitArms(new Uint8ClampedArray(data), info.width, info.height);
    assert.ok(rig, torso);
    assert.deepEqual(rig.posable, [false, true], torso);
    // The hidden arm stays whole in the body.
    assert.ok(!rig.owner.some(o => o & BACK_ARM), torso);
  }
});

test('every torso separates two posable arms along the armpit', async () => {
  for (const torso of partOptions.torso.filter(t => !CAPED.includes(t))) {
    const { data, info } = await sharp(`game/assets/custom/torso-${torso}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const rig = splitArms(new Uint8ClampedArray(data), info.width, info.height);
    assert.ok(rig, torso);
    assert.deepEqual(rig.posable, [true, true], torso);
    for (const side of [0, 1]) {
      // Joints run down the arm: shoulder, elbow, hand.
      assert.ok(rig.shoulder[side][1] < rig.elbow[side][1] && rig.elbow[side][1] < rig.hand[side][1], torso);
      assert.ok(rig.shoulder[side][1] < info.height * .45, torso);
    }
    // The back arm is on the left, the front arm on the right.
    assert.ok(rig.hand[0][0] < info.width / 2 && rig.hand[1][0] > info.width / 2, torso);
    let body = 0, shared = 0;
    for (const o of rig.owner) { if (o & BODY) body++; if ((o & BODY) && (o & (BACK_ARM | FRONT_ARM))) shared++; }
    // The chest stays whole and the shoulders exist in both layers.
    assert.ok(body > rig.owner.length * .25, torso);
    assert.ok(shared > 0, torso);
  }
});
