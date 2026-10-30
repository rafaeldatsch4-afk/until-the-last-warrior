import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CUSTOM_DASH_FRAMES, CUSTOM_FRAME, customFrameRegion, HAT_HAIR_LINE, COVERED_HEADS, HEAD_ANCHORS, headbandFront, plausibleHem, tailState, taperIntoHem } from '../game/sprites/CustomArtLayout.ts';
import { CreatorState } from '../game/creator/CreatorState.ts';
import { partOptions } from '../game/creator/CreatorPartOptions.ts';

test('HD atlas frames keep combat dimensions and sample disjoint complete cells', () => {
  for (const resolution of [1,3]) {
    const cells = new Set();
    for(let i=0;i<CUSTOM_FRAME.count;i++) {
      const r=customFrameRegion(i,resolution);
      assert.equal(r.width,192); assert.equal(r.height,128);
      assert.equal(r.u1-r.u0,.25);
      assert.ok(Math.abs(r.v1-r.v0-1/CUSTOM_FRAME.rows)<1e-10);
      assert.equal(r.x,r.u0*768*resolution);
      assert.equal(r.y,r.v0*128*CUSTOM_FRAME.rows*resolution);
      cells.add(r.x+','+r.y);
    }
    assert.equal(cells.size,CUSTOM_FRAME.count);
  }
});

test('hats keep the saved head selection and only trim hair above the crown', () => {
  for(const head of partOptions.head) {
    const state=new CreatorState();
    state.loadCustomData({gi1:0,gi2:0,skin:0,hair:0,part_head:head,part_accessory:'none'});
    state.nextPart('accessory',partOptions.accessory);
    assert.equal(state.getEquippedHead(),head);
    const reopened=new CreatorState();
    reopened.loadCustomData(state.toCustomData('goku','goku'));
    reopened.prevPart('accessory',partOptions.accessory);
    assert.equal(reopened.getEquippedHead(),head);
  }
});

test('the hat hides only hair above its crown, never the face', () => {
  const [, hatY, , hatH] = HEAD_ANCHORS.hat;
  assert.ok(HAT_HAIR_LINE > hatY && HAT_HAIR_LINE < hatY + hatH);
  assert.ok(HAT_HAIR_LINE < HEAD_ANCHORS.eyes[1] - 5);
});

test('headwear stays above eyes while the visor remains at eye height', () => {
  assert.ok(HEAD_ANCHORS.band[1]+HEAD_ANCHORS.band[3]<=HEAD_ANCHORS.eyes[1]);
  assert.ok(HEAD_ANCHORS.hat[1]+HEAD_ANCHORS.hat[3]<HEAD_ANCHORS.eyes[1]);
  assert.ok(HEAD_ANCHORS.visor[1]<HEAD_ANCHORS.eyes[1]);
  assert.ok(HEAD_ANCHORS.visor[1]+HEAD_ANCHORS.visor[3]>HEAD_ANCHORS.eyes[1]);
});

test('the headband crosses the forehead with its plate on the front, between the eyes', () => {
  for (const head of partOptions.head.filter(h => !COVERED_HEADS.includes(h))) {
    const { left, right, front, y, thickness, sag, plate } = headbandFront(head);
    // Above the eyes (its lowest point is the plate, at the front)...
    assert.ok(y + sag + plate[1] / 2 <= HEAD_ANCHORS.eyes[1], head);
    // ...below the hairline, and from the back of the head round to the face.
    assert.ok(y - thickness / 2 >= HAT_HAIR_LINE, head);
    assert.ok(right - left >= 14, head);
    // The plate is on the face's centre line, not the middle of the skull's side.
    assert.ok(Math.abs(front - HEAD_ANCHORS.eyes[0]) < 1, head);
    assert.ok(front - plate[0] / 2 > (left + right) / 2 && front + plate[0] / 2 < right, head);
  }
});

test('loose scarf and headband ends hang at rest, flow in action and stream back in the dash', () => {
  for (let frame = 0; frame < CUSTOM_FRAME.count; frame++) assert.ok([0,1,2,3].includes(tailState(frame)));
  assert.deepEqual([0,1,2,3].map(tailState), [0,1,0,1]);
  assert.equal(tailState(8), 2);
  for (let frame = CUSTOM_DASH_FRAMES[0]; frame <= CUSTOM_DASH_FRAMES[1]; frame++) assert.equal(tailState(frame), 3);
  assert.equal(CUSTOM_DASH_FRAMES[1], CUSTOM_FRAME.count - 1);
});

test('only hair or a bald head wears a headband, never a cap, hood or mask', async () => {
  const { accessoryFitsHead } = await import('../game/creator/CreatorPartOptions.ts');
  for (const head of partOptions.head) assert.equal(accessoryFitsHead('headband', head), !COVERED_HEADS.includes(head), head);
  for (const head of COVERED_HEADS) for (const acc of partOptions.accessory.filter(a => a !== 'headband')) assert.ok(accessoryFitsHead(acc, head));
});

test('the headband is for heads of hair and bald heads only', () => {
  assert.deepEqual([...COVERED_HEADS].sort(), ['chapolim', 'jotaro', 'spiderman']);
});

test('a covered head takes the headband off and a head of hair puts it back', () => {
  const state = new CreatorState();
  const pick = head => { while (state.getEquippedHead() !== head) state.nextPart('head', state.getAvailableHeads()); };
  pick('goku');
  while (state.getEquippedAccessory() !== 'headband') state.nextPart('accessory', partOptions.accessory);
  pick('spiderman');
  assert.equal(state.getEquippedAccessory(), 'none');
  pick('naruto');
  assert.equal(state.getEquippedAccessory(), 'headband');
  // With a covered head, cycling accessories skips the headband.
  pick('chapolim');
  for (let i = 0; i < partOptions.accessory.length * 2; i++) {
    state.nextPart('accessory', partOptions.accessory);
    assert.notEqual(state.getEquippedAccessory(), 'headband');
  }
});

test('tight leggings are never clipped to a top\'s hem; baggy trousers wider than it are', () => {
  const hem = { left: 89.5, right: 107.5 };
  // Leggings fit inside the hem at the waist (their thighs only spread lower down).
  assert.equal(taperIntoHem(hem, 17), false);
  assert.equal(taperIntoHem(hem, 19), false);
  // Baggy trousers are wider than the hem and get tapered into it.
  assert.equal(taperIntoHem(hem, 26), true);
  // No usable hem, nothing to taper into.
  assert.equal(taperIntoHem(null, 30), false);
});

test('a sash or a cape edge is not taken for a hem', () => {
  // Measured widths of the torso art's bottom rows: Saitama 6.7, Chapolim 3.1, Sasuke 9.3.
  for (const width of [3.1, 6.7, 9.3]) assert.equal(plausibleHem(width), false, String(width));
  // Real jackets: Goku 18, Naruto 16.6, Vegeta 15.2, Spider-Man 15.3, Jotaro's coat 27.5.
  for (const width of [18, 16.6, 15.2, 15.3, 27.5]) assert.equal(plausibleHem(width), true, String(width));
});
