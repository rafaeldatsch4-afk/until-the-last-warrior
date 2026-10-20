// Pack the posed custom-fighter art: one base body and the outfits worn over it.
// Usage: node scripts/pack-custom-wardrobe.mjs
//
// docs/art/custom-v2/base-source.jpg holds the base body in the 16 custom poses (4x4,
// flat green background): idle 0-3, walk 4-7, punch, kick, guard, charge, Genki Dama,
// dash 13-15. Each set-<id>.jpg is that same image with an outfit drawn on by an image
// editor, colour coded so the pieces can be told apart:
//   top: white + cyan, trousers: yellow + magenta, footwear: red + blue.
// Every piece is written back in white (main) and cyan (detail), the colours the
// creator recolours, as a 4x4 sheet of 192x128 frames (x2) aligned with the body.
import sharp from 'sharp';
import { readdir, writeFile, mkdir } from 'node:fs/promises';

const SRC = 'docs/art/custom-v2', OUT = 'game/assets/custom-v2';
const RES = 2, FW = 192 * RES, FH = 128 * RES;
const NECK_X = 98, FEET_Y = 126, IDLE_HEIGHT = 84;

async function keyed(path, width, height) {
  let img = sharp(path).ensureAlpha();
  if (width) img = img.resize(width, height);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], green = g - Math.max(r, b);
    if (green > 70) { data[i + 3] = 0; continue; }
    if (green > 18) { data[i + 3] = Math.round(255 * (1 - (green - 18) / 52)); data[i + 1] = Math.min(g, Math.max(r, b)); }
  }
  return { data, w: info.width, h: info.height };
}
const opaque = (img, x, y, cell) => img.data[(y * img.w + x) * 4 + 3] > 128 && (!cell || cell.mask[y * img.w + x] === 1);

// Split each row band into its 4 poses: the 4 largest connected shapes are the
// bodies, smaller pieces (a detached foot, a shading speck) join the nearest one.
function cells(img) {
  const out = [], band = img.h / 4, seen = new Uint8Array(img.w * img.h);
  for (let r = 0; r < 4; r++) {
    const y0 = Math.round(r * band), y1 = Math.round((r + 1) * band), parts = [];
    for (let y = y0; y < y1; y++) for (let x = 0; x < img.w; x++) {
      const p = y * img.w + x; if (seen[p] || img.data[p * 4 + 3] <= 40) continue;
      const px = [p]; seen[p] = 1; let x0 = x, x1 = x, py0 = y, py1 = y;
      for (let i = 0; i < px.length; i++) {
        const q = px[i], qx = q % img.w, qy = (q / img.w) | 0;
        x0 = Math.min(x0, qx); x1 = Math.max(x1, qx); py0 = Math.min(py0, qy); py1 = Math.max(py1, qy);
        for (const n of [qx > 0 ? q - 1 : -1, qx < img.w - 1 ? q + 1 : -1, qy > y0 ? q - img.w : -1, qy < y1 - 1 ? q + img.w : -1])
          if (n >= 0 && !seen[n] && img.data[n * 4 + 3] > 40) { seen[n] = 1; px.push(n); }
      }
      parts.push({ px, x0, x1, y0: py0, y1: py1 });
    }
    parts.sort((a, b) => b.px.length - a.px.length);
    const bodies = parts.slice(0, 4).sort((a, b) => a.x0 - b.x0).map(b => ({ ...b, px: [...b.px] }));
    for (const part of parts.slice(4)) {
      const cx = (part.x0 + part.x1) / 2, cy = (part.y0 + part.y1) / 2;
      let best = bodies[0], bd = Infinity;
      for (const b of bodies) { const d = Math.max(b.x0 - cx, 0, cx - b.x1) + Math.max(b.y0 - cy, 0, cy - b.y1); if (d < bd) { bd = d; best = b; } }
      best.px.push(...part.px); best.x0 = Math.min(best.x0, part.x0); best.x1 = Math.max(best.x1, part.x1);
    }
    for (const b of bodies) {
      const mask = new Uint8Array(img.w * img.h); for (const p of b.px) mask[p] = 1;
      out.push({ x0: b.x0, x1: b.x1 + 1, y0, y1, mask });
    }
  }
  return out;
}

// Measure a base pose: feet, the head (the central run above the shoulders) and the neck.
const HEAD_FIXED = { 9: { x: 519, top: 1404, neck: 1515 }, 12: { x: 172, top: 2122, neck: 2232 } };
function measure(img, cell, frame) {
  const on = (x, y) => opaque(img, x, y, cell);
  let x0 = img.w, x1 = 0, top = img.h, feet = 0;
  for (let y = cell.y0; y < cell.y1; y++) for (let x = cell.x0; x < cell.x1; x++) if (on(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); top = Math.min(top, y); feet = Math.max(feet, y); }
  const height = feet - top;
  // The white shorts: their top row is the waist, and the head sits above them.
  let waistX = (x0 + x1) / 2, waistY = feet;
  for (let y = top; y < feet; y++) {
    let n = 0, sx = 0;
    for (let x = x0; x <= x1; x++) { const i = (y * img.w + x) * 4, d = img.data; if (on(x, y) && Math.min(d[i], d[i + 1], d[i + 2]) > 200 && Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) < 25) { n++; sx += x; } }
    if (n > height * .08) { waistY = y; waistX = sx / n; break; }
  }
  // Heads found by hand where raised hands or a kick confuse the search (base pixels).
  const fixed = HEAD_FIXED[frame];
  const cx = fixed ? fixed.x : waistX, tolerance = height * (fixed ? .06 : .14);
  const central = y => {
    let best = null;
    for (let x = x0; x <= x1; x++) {
      if (!on(x, y)) continue;
      const s = x; while (x + 1 <= x1 && on(x + 1, y)) x++;
      const d = cx < s ? s - cx : cx > x ? cx - x : 0;
      if (d < tolerance && (!best || d < best.d)) best = { s, e: x, d };
    }
    return best;
  };
  let headTop = fixed ? fixed.top : top; while (!fixed && headTop < feet && !central(headTop)) headTop++;
  let widest = 0, headX = cx, neck = fixed ? fixed.neck : headTop, neckW = Infinity;
  for (let y = headTop; y < headTop + height * .24; y++) {
    const run = central(y); if (!run) continue;
    const w = run.e - run.s;
    if (y < headTop + height * .1) { if (w > widest) { widest = w; headX = (run.s + run.e) / 2; } }
    else if (!fixed && w < neckW) { neckW = w; neck = y; }
  }
  const run = central(neck);
  return { top, feet, x0, x1, height, headTop, neck, neckX: run ? (run.s + run.e) / 2 : waistX, headWidth: widest, headX, central, waistX, waistY };
}

const colourClass = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0;
  if (mx < 70) return 'dark';
  if (g > r * 1.3 && b > r * 1.3 && b > 90) return 'top:detail';
  if (b > r * 1.4 && b > g * 1.25) return 'feet:detail';
  if (r > g * 1.6 && b > g * 1.3) return 'legs:detail';
  if (r > 140 && g > 120 && b < g * .55) return 'legs:main';
  if (r > g * 1.9 && r > b * 1.6) return 'feet:main';
  if (r > g * 1.06 && g > b * 1.06 && r > 110 && g > 65 && b > 45 && sat < .6) return 'skin';
  if (sat < .18 && mx > 120) return 'top:main';
  return 'other';
};

// One blank sheet per layer; frames are pasted with their own scale.
const sheet = () => Buffer.alloc(FW * 4 * FH * 4 * 4);
async function paste(dst, src, cell, frame, t) {
  const w = cell.x1 - cell.x0, h = cell.y1 - cell.y0, crop = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = (cell.y0 + y) * src.w + cell.x0 + x;
    if (cell.mask[p]) src.data.copy(crop, (y * w + x) * 4, p * 4, p * 4 + 4);
  }
  const sw = Math.max(1, Math.round(w * t.s)), sh = Math.max(1, Math.round(h * t.s));
  const scaled = await sharp(crop, { raw: { width: w, height: h, channels: 4 } }).resize(sw, sh, { kernel: 'lanczos3' }).raw().toBuffer();
  const fx = (frame % 4) * FW, fy = Math.floor(frame / 4) * FH, ox = Math.round(t.x - (t.ax - cell.x0) * t.s), oy = Math.round(t.y - (t.ay - cell.y0) * t.s);
  for (let y = 0; y < sh; y++) {
    const dy = oy + y; if (dy < 0 || dy >= FH) continue;
    for (let x = 0; x < sw; x++) {
      const dx = ox + x; if (dx < 0 || dx >= FW) continue;
      const s = (y * sw + x) * 4; if (!scaled[s + 3]) continue;
      scaled.copy(dst, ((fy + dy) * FW * 4 + fx + dx) * 4, s, s + 4);
    }
  }
}
// Drop specks left by keying and head removal: tiny islands of opaque pixels.
function despeckle(buf, min = 24, w = FW * 4, h = FH * 4) {
  const seen = new Uint8Array(w * h);
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || !buf[start * 4 + 3]) continue;
    const stack = [start], comp = []; seen[start] = 1;
    while (stack.length) {
      const p = stack.pop(); comp.push(p);
      const x = p % w, y = (p / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, q = ny * w + nx;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h && !seen[q] && buf[q * 4 + 3]) { seen[q] = 1; stack.push(q); }
      }
    }
    if (comp.length < min) for (const p of comp) buf[p * 4 + 3] = 0;
  }
  return buf;
}
const save = (buf, name) => sharp(despeckle(buf), { raw: { width: FW * 4, height: FH * 4, channels: 4 } }).png({ compressionLevel: 9, palette: false }).toFile(`${OUT}/${name}.png`);

await mkdir(OUT, { recursive: true });
const base = await keyed(`${SRC}/base-source.jpg`);
const baseCells = cells(base), poses = baseCells.map((c, f) => measure(base, c, f));
// Rows were drawn separately: match head widths across rows, idle height sets the size.
const median = a => [...a].sort((p, q) => p - q)[a.length >> 1];
const idleScale = IDLE_HEIGHT * RES / median(poses.slice(0, 4).map(p => p.height));
const headTarget = median(poses.slice(0, 4).map(p => p.headWidth)) * idleScale;
const transforms = poses.map((p, f) => {
  const row = Math.floor(f / 4), s = headTarget / median(poses.slice(row * 4, row * 4 + 4).map(q => q.headWidth));
  return { s, ax: p.neckX, ay: p.feet, x: NECK_X * RES, y: FEET_Y * RES };
});
const toFrame = (f, x, y) => { const t = transforms[f]; return [+(NECK_X + (x - t.ax) * t.s / RES).toFixed(1), +(FEET_Y + (y - t.ay) * t.s / RES).toFixed(1)]; };

// Body: the base without its head (the portrait supplies hair and face). The top of
// the neck stays, so it runs up under the portrait's jaw without a gap.
const NECK_KEEP = 1;
const body = { ...base, data: Buffer.from(base.data) };
for (const [f, p] of poses.entries()) for (let y = p.headTop - 4; y < p.neck - NECK_KEEP * RES / transforms[f].s; y++) {
  const run = p.central(Math.max(y, p.headTop)); if (!run) continue;
  // A raised arm touching the head joins its run; never erase beyond the head's width.
  const half = p.headWidth * .65, s = Math.max(run.s - 4, Math.round(p.headX - half)), e = Math.min(run.e + 4, Math.round(p.headX + half));
  for (let x = s; x <= e; x++) if (baseCells[f].mask[y * base.w + x]) body.data[(y * base.w + x) * 4 + 3] = 0;
}
const bodySheet = sheet();
for (let f = 0; f < 16; f++) await paste(bodySheet, body, baseCells[f], f, transforms[f]);
await save(bodySheet, 'body');

// Anchors in frame coordinates for the head, neck, waist and front hand.
const anchors = poses.map((p, f) => {
  let hx = 0, hy = 0, best = -1;
  for (let y = p.top; y < p.top + p.height * .6; y++) for (let x = p.x0; x <= p.x1; x++) if (opaque(base, x, y, baseCells[f]) && x > best) { best = x; hx = x; hy = y; }
  const wx = p.waistX, wy = p.waistY;
  return { neck: toFrame(f, p.neckX, p.neck), headTop: toFrame(f, p.neckX, p.headTop)[1], headWidth: +(p.headWidth * transforms[f].s / RES).toFixed(2), waist: toFrame(f, wx, wy), hand: toFrame(f, hx, hy) };
});
await writeFile(`${OUT}/anchors.json`, JSON.stringify(anchors) + '\n');

// Outfits: colour-coded pixels that differ from the base, split into top, legs and feet.
for (const file of (await readdir(SRC)).filter(f => /^set-.*\.(jpg|png)$/.test(f)).sort()) {
  const id = file.replace(/^set-|\.(jpg|png)$/g, '');
  const set = await keyed(`${SRC}/${file}`), ref = await keyed(`${SRC}/base-source.jpg`, set.w, set.h), k = set.w / base.w;
  const kind = new Array(set.w * set.h).fill(null);
  for (let i = 0; i < kind.length; i++) {
    if (set.data[i * 4 + 3] < 40) continue;
    const r = set.data[i * 4], g = set.data[i * 4 + 1], b = set.data[i * 4 + 2], c = colourClass(r, g, b);
    if (c === 'skin' || c === 'other' || c === 'dark') { kind[i] = c; continue; }
    // White that the base already had there (its shorts) is not clothing.
    const d = Math.abs(r - ref.data[i * 4]) + Math.abs(g - ref.data[i * 4 + 1]) + Math.abs(b - ref.data[i * 4 + 2]);
    kind[i] = c === 'top:main' && ref.data[i * 4 + 3] > 128 && d < 60 ? 'skin' : c;
  }
  // Outlines and in-between shades join the piece that surrounds them.
  const piece = i => { const c = kind[i]; return c && c.includes(':') ? c.split(':')[0] : null; };
  const layer = new Array(kind.length).fill(null);
  for (let i = 0; i < kind.length; i++) {
    if (!kind[i]) continue;
    if (piece(i)) { layer[i] = piece(i); continue; }
    if (kind[i] === 'skin') continue;
    const x = i % set.w, y = (i / set.w) | 0, votes = {}; let skin = 0;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= set.w || Y >= set.h) continue;
      const j = Y * set.w + X, p = piece(j);
      if (p) votes[p] = (votes[p] || 0) + 1; else if (kind[j] === 'skin') skin++;
    }
    const top = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= skin * .6) layer[i] = top[0];
  }
  for (const name of ['top', 'legs', 'feet']) {
    const img = { w: set.w, h: set.h, data: Buffer.alloc(set.data.length) };
    for (let i = 0; i < layer.length; i++) {
      if (layer[i] !== name) continue;
      const r = set.data[i * 4], g = set.data[i * 4 + 1], b = set.data[i * 4 + 2], v = Math.max(r, g, b), c = kind[i];
      const rgb = c.endsWith(':detail') ? [0, Math.round(v * .85), v] : c.endsWith(':main') ? [v, v, v] : [r, g, b];
      img.data[i * 4] = rgb[0]; img.data[i * 4 + 1] = rgb[1]; img.data[i * 4 + 2] = rgb[2]; img.data[i * 4 + 3] = set.data[i * 4 + 3];
    }
    // Stray shades of a piece's colour scattered over the body are not part of it.
    despeckle(img.data, 50, set.w, set.h);
    const out = sheet(), setCells = cells(set);
    for (let f = 0; f < 16; f++) {
      const t = transforms[f];
      await paste(out, img, setCells[f], f, { s: t.s / k, ax: t.ax * k, ay: t.ay * k, x: t.x, y: t.y });
    }
    await save(out, `${name === 'top' ? 'torso' : name}-${id}`);
  }
  console.log(`${id}: torso, legs, feet`);
}
console.log('body + anchors', anchors.length);
