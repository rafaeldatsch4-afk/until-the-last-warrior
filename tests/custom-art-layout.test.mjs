import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CUSTOM_DASH_FRAMES, CUSTOM_FRAME, customFrameRegion, HAT_HAIR_LINE, HATTED_HEADS, HEAD_ANCHORS, headbandFront, tailState } from '../game/sprites/CustomArtLayout.ts';
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

test('the headband crosses the forehead with its plate centred on the head', () => {
  for (const head of partOptions.head.filter(h => !HATTED_HEADS.includes(h))) {
    const { cx, y, half, thickness, sag, plate } = headbandFront(head);
    // Above the eyes (its lowest point is the plate, at the centre)...
    assert.ok(y + sag + plate[1] / 2 <= HEAD_ANCHORS.eyes[1], head);
    // ...below the hairline, and wrapping the whole head.
    assert.ok(y - thickness / 2 >= HAT_HAIR_LINE, head);
    assert.ok(half * 2 >= 14, head);
    // The plate sits on the head's centre line, not off to one side.
    assert.ok(Math.abs(cx - 98.5) < .5, head);
  }
});

test('loose scarf and headband ends hang at rest, flow in action and stream back in the dash', () => {
  for (let frame = 0; frame < CUSTOM_FRAME.count; frame++) assert.ok([0,1,2,3].includes(tailState(frame)));
  assert.deepEqual([0,1,2,3].map(tailState), [0,1,0,1]);
  assert.equal(tailState(8), 2);
  for (let frame = CUSTOM_DASH_FRAMES[0]; frame <= CUSTOM_DASH_FRAMES[1]; frame++) assert.equal(tailState(frame), 3);
  assert.equal(CUSTOM_DASH_FRAMES[1], CUSTOM_FRAME.count - 1);
});

test('a head painted with a hat never wears a headband', async () => {
  const { accessoryFitsHead } = await import('../game/creator/CreatorPartOptions.ts');
  for (const head of partOptions.head) assert.equal(accessoryFitsHead('headband', head), !HATTED_HEADS.includes(head), head);
  for (const head of HATTED_HEADS) for (const acc of partOptions.accessory.filter(a => a !== 'headband')) assert.ok(accessoryFitsHead(acc, head));
});
