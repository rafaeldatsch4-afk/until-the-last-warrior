import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CUSTOM_FRAME, customFrameRegion, displayedHead, HEAD_ANCHORS } from '../game/sprites/CustomArtLayout.ts';
import { CreatorState } from '../game/creator/CreatorState.ts';
import { partOptions } from '../game/creator/CreatorPartOptions.ts';

test('HD atlas frames keep combat dimensions and sample disjoint complete cells', () => {
  for (const resolution of [1,3]) {
    const cells = new Set();
    for(let i=0;i<CUSTOM_FRAME.count;i++) {
      const r=customFrameRegion(i,resolution);
      assert.equal(r.width,192); assert.equal(r.height,128);
      assert.equal(r.u1-r.u0,.25);
      assert.ok(Math.abs(r.v1-r.v0-1/3)<1e-10);
      assert.equal(r.x,r.u0*768*resolution);
      assert.equal(r.y,r.v0*384*resolution);
      cells.add(r.x+','+r.y);
    }
    assert.equal(cells.size,12);
  }
});

test('hats use a bald presentation without destroying any saved head selection', () => {
  for(const head of partOptions.head) {
    const state=new CreatorState();
    state.loadCustomData({gi1:0,gi2:0,skin:0,hair:0,part_head:head,part_accessory:'none'});
    state.nextPart('accessory',partOptions.accessory);
    assert.equal(state.getEquippedHead(),head);
    assert.equal(displayedHead(head,state.getEquippedAccessory()),'saitama');
    const reopened=new CreatorState();
    reopened.loadCustomData(state.toCustomData('goku','goku'));
    reopened.prevPart('accessory',partOptions.accessory);
    assert.equal(reopened.getEquippedHead(),head);
    assert.equal(displayedHead(head,'none'),head);
    assert.equal(displayedHead(head,'headband'),head);
    assert.equal(displayedHead(head,'scouter'),head);
  }
});

test('headwear stays above eyes while the visor remains at eye height', () => {
  assert.ok(HEAD_ANCHORS.band[1]+HEAD_ANCHORS.band[3]<=HEAD_ANCHORS.eyes[1]);
  assert.ok(HEAD_ANCHORS.hat[1]+HEAD_ANCHORS.hat[3]<HEAD_ANCHORS.eyes[1]);
  assert.ok(HEAD_ANCHORS.visor[1]<HEAD_ANCHORS.eyes[1]);
  assert.ok(HEAD_ANCHORS.visor[1]+HEAD_ANCHORS.visor[3]>HEAD_ANCHORS.eyes[1]);
});
