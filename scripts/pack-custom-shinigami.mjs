// Packs the generated "shinigami" wardrobe set (head, torso, raised-arm torso, legs, feet)
// into transparent, independently tintable layers, like pack-custom-art.mjs does for the
// original wardrobe. Source images live in docs/art/custom/pilot-shinigami.
//
//   node scripts/pack-custom-shinigami.mjs
//
// Colour masks follow the existing wardrobe: white = primary, cyan = secondary, peach = skin.
// Hair is stored as a grey mask (the in-game tint recolours grey hair with the chosen hair colour).
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const dir = 'docs/art/custom/pilot-shinigami';
const out = 'game/assets/custom';
const ID = 'shinigami';

async function load(name) {
  const { data, info } = await sharp(`${dir}/${name}-source.jpg`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/** Make the white backdrop transparent: flood fill from the borders, then eat the white halo. */
function cutout({ data, w, h }) {
  const isWhite = i => Math.min(data[i], data[i + 1], data[i + 2]) >= 238 && Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]) < 22;
  const bg = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => { const p = y * w + x; if (!bg[p] && isWhite(p * 4)) { bg[p] = 1; stack.push(p); } };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const p = stack.pop(), x = p % w, y = (p - x) / w;
    if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1);
  }
  // Halo: light, low-contrast pixels touching the backdrop are antialiasing against white.
  for (let pass = 0; pass < 2; pass++) {
    const next = bg.slice();
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (bg[p]) continue;
      if (!(bg[p - 1] || bg[p + 1] || bg[p - w] || bg[p + w])) continue;
      const i = p * 4;
      if (Math.min(data[i], data[i + 1], data[i + 2]) >= 205) next[p] = 1;
    }
    bg.set(next);
  }
  for (let p = 0; p < w * h; p++) data[p * 4 + 3] = bg[p] ? 0 : 255;
  return { data, w, h };
}

function bounds({ data, w, h }, x0 = 0, x1 = w) {
  let ax = w, ay = h, bx = -1, by = -1;
  for (let y = 0; y < h; y++) for (let x = x0; x < x1; x++) if (data[(y * w + x) * 4 + 3]) { ax = Math.min(ax, x); bx = Math.max(bx, x); ay = Math.min(ay, y); by = Math.max(by, y); }
  if (bx < 0) throw new Error('empty layer');
  return { x: ax, y: ay, w: bx - ax + 1, h: by - ay + 1 };
}

const sharpOf = ({ data, w, h }) => sharp(data, { raw: { width: w, height: h, channels: 4 } });
const manifest = [];

async function fit256(img, key) {
  const b = bounds(img);
  await sharpOf(img).extract({ left: b.x, top: b.y, width: b.w, height: b.h })
    .resize({ width: 256, height: 256, fit: 'inside', kernel: 'lanczos3' }).png().toFile(`${out}/${key}.png`);
  manifest.push(key);
}

// Torso, legs, feet: plain bounding-box crops, longest side 256 (as the original wardrobe).
await fit256(cutout(await load('torso')), `torso-${ID}`);
await fit256(cutout(await load('legs')), `legs-${ID}`);
await fit256(cutout(await load('feet')), `feet-${ID}`);

// Raised-arm torso for Genki Dama: 512x512 canvas with the landmarks the compositor needs.
{
  const img = cutout(await load('torso-genki'));
  const b = bounds(img);
  const scale = Math.min(500 / b.w, 500 / b.h);
  const tw = Math.round(b.w * scale), th = Math.round(b.h * scale);
  const left = Math.round((512 - tw) / 2), top = Math.round(512 - th - 6);
  const piece = await sharpOf(img).extract({ left: b.x, top: b.y, width: b.w, height: b.h }).resize(tw, th, { kernel: 'lanczos3' }).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: piece, left, top }]).png().toFile(`${out}/torso-genki-${ID}.png`);
  // Landmarks, measured on the placed drawing: the collar top and the garment hem.
  const placed = await sharp(`${out}/torso-genki-${ID}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pd = placed.data;
  const mid0 = 200, mid1 = 312;
  let neckY = -1, hem = -1, neckX = 0, n = 0;
  for (let y = 0; y < 512 && neckY < 0; y++) { for (let x = mid0; x < mid1; x++) if (pd[(y * 512 + x) * 4 + 3] > 128) { neckY = y; break; } }
  for (let y = 511; y >= 0 && hem < 0; y--) { for (let x = mid0; x < mid1; x++) if (pd[(y * 512 + x) * 4 + 3] > 128) { hem = y; break; } }
  for (let x = 0; x < 512; x++) if (pd[((neckY + 3) * 512 + x) * 4 + 3] > 128) { neckX += x; n++; }
  console.log(`GENKI_TORSOS.${ID}: neck [${Math.round(neckX / n)}, ${neckY}] hem ${hem}`);
  manifest.push(`torso-genki-${ID}`);
}

// Portrait: 512x476 cell, neck centred on (256, 442) like the other portraits; hair becomes a grey mask.
{
  const img = cutout(await load('head'));
  const { data, w, h } = img;
  const b = bounds(img);
  // Neck centre on the lowest opaque rows.
  let nx = 0, nn = 0;
  for (let y = b.y + b.h - 6; y < b.y + b.h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3]) { nx += x; nn++; }
  const neckX = nx / nn, neckBottom = b.y + b.h - 1;
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    if (!data[i + 3]) continue;
    const r = data[i], g = data[i + 1], bl = data[i + 2];
    const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), sat = mx ? (mx - mn) / mx : 0;
    // Orange hair (saturated warm hues) -> grey mask; peach skin (low saturation) stays as is.
    if (sat > 0.62 && r >= g && g >= bl && r > 140) {
      const lum = .299 * r + .587 * g + .114 * bl;
      const v = Math.min(235, Math.round(lum * 1.35));
      data[i] = data[i + 1] = data[i + 2] = v;
    }
  }
  const scale = Math.min(500 / b.w, 436 / b.h);
  const tw = Math.round(b.w * scale), th = Math.round(b.h * scale);
  const placed = await sharpOf(img).extract({ left: b.x, top: b.y, width: b.w, height: b.h }).resize(tw, th, { kernel: 'lanczos3' }).png().toBuffer();
  // The head is centred in the cell; its neck lands wherever it is, and CustomPortrait
  // is told that x (neckAnchors) instead of the default 256.
  const left = Math.round((512 - tw) / 2), top = Math.round(442 - (neckBottom - b.y) * scale);
  console.log(`portrait-${ID}: neckAnchors.${ID} = ${Math.round(left + (neckX - b.x) * scale)}`);
  await sharp({ create: { width: 512, height: 476, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: placed, left, top }]).png().toBuffer()
    .then(cell => sharp(cell).resize({ width: 256, kernel: 'lanczos3' }).png().toFile(`${out}/portrait-${ID}.png`));
  manifest.push(`portrait-${ID}`);
}

await writeFile(`${dir}/manifest.json`, JSON.stringify({ id: ID, generator: 'Google Flow (Nano Banana 2.1)', layers: manifest }, null, 2) + '\n');
console.log('Packed:', manifest.join(', '));
