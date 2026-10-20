import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { test } from 'node:test';
import sharp from 'sharp';
import anchors from '../game/assets/custom-v2/anchors.json' with { type: 'json' };
import { CUSTOM_FRAME } from '../game/sprites/CustomArtLayout.ts';

const DIR = 'game/assets/custom-v2';

test('the posed body has one anchor set per custom frame', () => {
  assert.equal(anchors.length, CUSTOM_FRAME.count);
  for (const [i, a] of anchors.entries()) {
    // The head sits above the neck, the neck above the waist, all inside the frame.
    assert.ok(a.headTop < a.neck[1] && a.neck[1] < a.waist[1], `frame ${i}`);
    assert.ok(a.headWidth > 6 && a.headWidth < 16, `frame ${i}`);
    for (const [x, y] of [a.neck, a.waist, a.hand]) assert.ok(x > 0 && x < CUSTOM_FRAME.width && y > 0 && y < CUSTOM_FRAME.height, `frame ${i}`);
  }
});

test('every posed piece is a full sheet drawn over the base body', async () => {
  const files = readdirSync(DIR).filter(f => f.endsWith('.png'));
  assert.ok(files.includes('body.png'));
  const body = await sharp(`${DIR}/body.png`).metadata();
  for (const file of files) {
    const meta = await sharp(`${DIR}/${file}`).metadata();
    assert.equal(meta.width, body.width, file);
    assert.equal(meta.height, body.height, file);
    assert.ok(meta.hasAlpha, file);
  }
  // Each outfit comes as a set, so any piece can be mixed with the others.
  const ids = files.filter(f => f.startsWith('torso-')).map(f => f.slice(6, -4));
  for (const id of ids) for (const part of ['legs', 'feet']) assert.ok(files.includes(`${part}-${id}.png`), `${part}-${id}`);
});
