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
const CHIN = 1.29;
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
  // Horizontal anchor: the middle of the head at mouth height (fixed frames: the
  // given neck row is below the chin, among the shoulders, so the mouth row is derived).
  const mouth = fixed ? headTop + Math.round(widest * .87) : neck, m = central(mouth);
  const run = m && { s: Math.max(m.s, headX - widest * .65), e: Math.min(m.e, headX + widest * .65) };
  // The jaw and neck share one silhouette, so the chin comes from the head's proportions.
  const chin = Math.round(headTop + CHIN * widest);
  // Where arms crowd the head (fixed frames) the jaw is taken just above the chin.
  const jaw = fixed ? chin - Math.round(widest * .2) : neck, j = central(jaw);
  const jawRun = j && (fixed ? { s: Math.max(j.s, headX - widest * .45), e: Math.min(j.e, headX + widest * .45) } : j);
  return { top, feet, x0, x1, height, headTop, chin, jaw, jawRun, neckX: run ? (run.s + run.e) / 2 : waistX, headWidth: widest, headX, central, waistX, waistY };
}

const colourClass = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0;
  if (mx < 70) return 'dark';
  // Cyan keeps green close to blue; a pure blue (a boot's toe cap) does not.
  if (g > r * 1.3 && b > r * 1.3 && b > 90 && g > b * .6) return 'top:detail';
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

// Body: the base without its head down to the chin (the portrait supplies hair and
// face). A sliver above the chin stays, so the neck runs up under the portrait's jaw.
const NECK_KEEP = 1;
const body = { ...base, data: Buffer.from(base.data) };
for (const [f, p] of poses.entries()) for (let y = p.headTop - 4; y < p.chin - NECK_KEEP * RES / transforms[f].s; y++) {
  const run = p.central(Math.max(y, p.headTop)); if (!run) continue;
  // A raised arm touching the head joins its run; never erase beyond the head's width.
  // Below the narrowest point the jaw meets the shoulders: keep to the jaw's width there.
  const half = p.headWidth * .65, jaw = y >= p.jaw && p.jawRun;
  const s = Math.max(run.s - 4, Math.round(p.headX - half), jaw ? p.jawRun.s - 3 : 0), e = Math.min(run.e + 4, Math.round(p.headX + half), jaw ? p.jawRun.e + 3 : Infinity);
  for (let x = s; x <= e; x++) if (baseCells[f].mask[y * base.w + x]) body.data[(y * base.w + x) * 4 + 3] = 0;
}
const bodySheet = sheet();
for (let f = 0; f < 16; f++) await paste(bodySheet, body, baseCells[f], f, transforms[f]);
await save(bodySheet, 'body');

// Anchors in frame coordinates: the chin (where the portrait seats), head, waist and front hand.
const anchors = poses.map((p, f) => {
  let hx = 0, hy = 0, best = -1;
  for (let y = p.top; y < p.top + p.height * .6; y++) for (let x = p.x0; x <= p.x1; x++) if (opaque(base, x, y, baseCells[f]) && x > best) { best = x; hx = x; hy = y; }
  const wx = p.waistX, wy = p.waistY;
  return { neck: toFrame(f, p.neckX, p.chin), headTop: toFrame(f, p.neckX, p.headTop)[1], headWidth: +(p.headWidth * transforms[f].s / RES).toFixed(2), waist: toFrame(f, wx, wy), hand: toFrame(f, hx, hy) };
});
await writeFile(`${OUT}/anchors.json`, JSON.stringify(anchors) + '\n');

// Outfits: colour-coded pixels that differ from the base, split into top, legs and feet.
for (const file of (await readdir(SRC)).filter(f => /^set-.*\.(jpg|png)$/.test(f)).sort()) {
  const id = file.replace(/^set-|\.(jpg|png)$/g, '');
  const set = await keyed(`${SRC}/${file}`), ref = await keyed(`${SRC}/base-source.jpg`, set.w, set.h), k = set.w / base.w;
  // Image editors drift a pose by a few pixels: slide each frame until its skull sits on
  // the base's (every set draws the same bald head, so the skull is the one fixed thing).
  const shifts = cells(set).map((cell, f) => {
    const p = poses[f], half = p.headWidth * .7 * k, cx = p.headX * k;
    const x0 = Math.round(cx - half), x1 = Math.round(cx + half), y0 = Math.round(p.headTop * k), y1 = Math.round((p.headTop + p.headWidth * .6) * k);
    const on = (img, x, y) => x >= 0 && y >= 0 && x < img.w && y < img.h && img.data[(y * img.w + x) * 4 + 3] > 128;
    const inCell = (x, y) => on(set, x, y) && cell.mask[y * set.w + x] === 1;
    const costAt = (dx, dy) => { let c = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (on(ref, x, y) !== inCell(x + dx, y + dy)) c++; return c; };
    const rest = costAt(0, 0);
    let best = [0, 0], bestCost = rest;
    for (let dy = -24; dy <= 24; dy++) for (let dx = -24; dx <= 24; dx++) {
      const cost = costAt(dx, dy);
      if (cost < bestCost || (cost === bestCost && Math.abs(dx) + Math.abs(dy) < Math.abs(best[0]) + Math.abs(best[1]))) { bestCost = cost; best = [dx, dy]; }
    }
    // Only a clear gain counts: a set that already sits on the base is left alone.
    return rest > bestCost * 3 + 12 ? best : [0, 0];
  });
  console.log(`${id} shifts`, shifts.map(([x, y]) => `${x},${y}`).join(' '));
  const kind = new Array(set.w * set.h).fill(null);
  for (let i = 0; i < kind.length; i++) {
    if (set.data[i * 4 + 3] < 40) continue;
    const r = set.data[i * 4], g = set.data[i * 4 + 1], b = set.data[i * 4 + 2], c = colourClass(r, g, b);
    if (c === 'skin' || c === 'other' || c === 'dark') { kind[i] = c; continue; }
    // White that the base already had there (its shorts) is not clothing.
    const d = Math.abs(r - ref.data[i * 4]) + Math.abs(g - ref.data[i * 4 + 1]) + Math.abs(b - ref.data[i * 4 + 2]);
    kind[i] = c === 'top:main' && ref.data[i * 4 + 3] > 128 && d < 60 ? 'skin' : c;
  }
  // A lone detail pixel inside a piece's main colour is shading noise, not a stripe.
  const noisy = [];
  for (let i = 0; i < kind.length; i++) {
    if (!kind[i] || !kind[i].endsWith(':detail')) continue;
    const [name] = kind[i].split(':'), x = i % set.w, y = (i / set.w) | 0; let detail = 0, main = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= set.w || Y >= set.h) continue;
      const c = kind[Y * set.w + X]; if (c === name + ':detail') detail++; else if (c === name + ':main') main++;
    }
    if (detail < 7 && main > detail) noisy.push(i);
  }
  for (const i of noisy) kind[i] = kind[i].replace(':detail', ':main');
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
  // Yellow above the waist that never reaches the trousers (armour straps drawn in the
  // trousers' colour) belongs to the top.
  const cellsOfSet = cells(set);
  for (const [f, cell] of cellsOfSet.entries()) {
    const waist = poses[f].waistY * k, seen = new Uint8Array(kind.length);
    for (let start = 0; start < kind.length; start++) {
      if (seen[start] || layer[start] !== 'legs' || !cell.mask[start]) continue;
      const stack = [start], comp = []; seen[start] = 1; let low = 0;
      while (stack.length) {
        const i = stack.pop(); comp.push(i); low = Math.max(low, (i / set.w) | 0);
        for (const j of [i - 1, i + 1, i - set.w, i + set.w]) if (j >= 0 && j < kind.length && !seen[j] && layer[j] === 'legs' && cell.mask[j]) { seen[j] = 1; stack.push(j); }
      }
      if (low < waist) for (const i of comp) { layer[i] = 'top'; if (kind[i] === 'legs:main' || kind[i] === 'legs:detail') kind[i] = 'top:main'; }
    }
  }
  // Trousers hidden under a long top are continued straight up to the waist, at
  // their own width and shade, so a shorter top worn with them shows no thigh.
  const setCells = cells(set), hidden = new Uint8Array(kind.length), fill = new Uint8Array(kind.length);
  const legMain = i => layer[i] === 'legs' && kind[i] === 'legs:main';
  for (const [f, cell] of setCells.entries()) {
    const waist = Math.ceil(poses[f].waistY * k);
    for (let x = cell.x0; x < cell.x1; x++) {
      let y = waist; while (y < cell.y1 && !legMain(y * set.w + x)) y++;
      if (y >= cell.y1) continue;
      const o = (y * set.w + x) * 4, shade = Math.max(set.data[o], set.data[o + 1], set.data[o + 2]);
      // Climb through the top (and the hem's outline); a few other pixels in a row are
      // specks, a longer run is a hand or arm in front, where the trousers stop.
      for (y--; y >= waist; y--) {
        const i = y * set.w + x;
        if (!cell.mask[i]) break;
        if (layer[i] === 'top' || (layer[i] === 'legs' && !legMain(i))) { hidden[i] = 1; fill[i] = shade; continue; }
        let n = 0; while (n < 5 && y - n >= waist && cell.mask[(y - n) * set.w + x] && layer[(y - n) * set.w + x] !== 'top') n++;
        if (n >= 5 || y - n < waist || !cell.mask[(y - n) * set.w + x]) break;
        for (let j = 0; j < n; j++) { hidden[(y - j) * set.w + x] = 1; fill[(y - j) * set.w + x] = shade; }
        y -= n - 1;
      }
    }
    // Close each row into whole spans, shaded from the base body underneath (its folds
    // read as cloth) and outlined at the ends, so ragged columns don't read as stripes.
    const lum = i => Math.round(ref.data[i * 4] * .3 + ref.data[i * 4 + 1] * .59 + ref.data[i * 4 + 2] * .11);
    for (let y = waist; y < cell.y1; y++) {
      const xs = []; for (let x = cell.x0; x < cell.x1; x++) if (hidden[y * set.w + x]) xs.push(x);
      for (let a = 0; a < xs.length;) {
        let b = a; while (b + 1 < xs.length && xs[b + 1] - xs[b] <= 8) b++;
        let sum = 0, n = 0;
        for (let x = xs[a]; x <= xs[b]; x++) { const i = y * set.w + x; if (ref.data[i * 4 + 3] > 128 && lum(i) > 140) { sum += lum(i); n++; } }
        const flat = n ? Math.round(sum / n) : 205;
        for (let x = xs[a]; x <= xs[b]; x++) {
          const i = y * set.w + x; if (!cell.mask[i]) continue;
          hidden[i] = 1;
          fill[i] = x - xs[a] < 2 || xs[b] - x < 2 ? 50 : ref.data[i * 4 + 3] > 128 ? Math.max(lum(i), 90) : flat;
        }
        a = b + 1;
      }
    }
  }
  // The generated trousers can be a touch slimmer than the base's leg, which then shows as
  // a thin skin strip along the inner edge. Where the base has a leg, the outfit image has
  // background, and the strip is thin and hugs the trousers, the trousers are extended.
  const leakShade = new Uint8Array(kind.length);
  for (const [f, cell] of setCells.entries()) {
    const [dx, dy] = shifts[f], waist = Math.ceil(poses[f].waistY * k + dy);
    const body = (x, y) => { const X = x - dx, Y = y - dy; return X >= 0 && Y >= 0 && X < ref.w && Y < ref.h && ref.data[(Y * ref.w + X) * 4 + 3] > 200; };
    const legAt = (x, y) => x >= 0 && y >= 0 && x < set.w && y < set.h && layer[y * set.w + x] === 'legs' && cell.mask[y * set.w + x];
    const near = (x, y) => { for (let oy = -3; oy <= 3; oy++) for (let ox = -3; ox <= 3; ox++) if (legAt(x + ox, y + oy)) return true; return false; };
    for (let y = waist; y < cell.y1; y++) {
      const gap = x => body(x, y) && set.data[(y * set.w + x) * 4 + 3] < 40;
      for (let x = cell.x0 - 10; x < cell.x1 + 10;) {
        if (!gap(x)) { x++; continue; }
        let e = x; while (gap(e + 1)) e++;
        if (e - x < 14 && (near(x, y) || near(e, y))) {
          // Take the shade from the trouser pixel the strip leans on.
          let shade = 0;
          for (let ox = -4; ox <= 4 && !shade; ox++) for (const px of [x - 1 - ox, e + 1 + ox]) if (legAt(px, y) && kind[y * set.w + px] === 'legs:main') shade = Math.max(set.data[(y * set.w + px) * 4], set.data[(y * set.w + px) * 4 + 1], set.data[(y * set.w + px) * 4 + 2]);
          for (let X = x; X <= e; X++) { const i = y * set.w + X; leakShade[i] = X === x || X === e ? 50 : shade || 120; cell.mask[i] = 1; }
        }
        x = e + 1;
      }
    }
  }
  for (const name of ['top', 'legs', 'feet']) {
    const img = { w: set.w, h: set.h, data: Buffer.alloc(set.data.length) };
    for (let i = 0; i < layer.length; i++) {
      if (layer[i] !== name) continue;
      const r = set.data[i * 4], g = set.data[i * 4 + 1], b = set.data[i * 4 + 2], v = Math.max(r, g, b), c = kind[i];
      // Outlines keep only their darkness, so they take the piece's colour too.
      const l = Math.round(r * .3 + g * .59 + b * .11);
      const rgb = c.endsWith(':detail') ? [0, Math.round(v * .85), v] : c.endsWith(':main') ? [v, v, v] : [l, l, l];
      img.data[i * 4] = rgb[0]; img.data[i * 4 + 1] = rgb[1]; img.data[i * 4 + 2] = rgb[2]; img.data[i * 4 + 3] = set.data[i * 4 + 3];
    }
    if (name === 'legs') for (let i = 0; i < leakShade.length; i++) if (leakShade[i]) {
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = leakShade[i]; img.data[i * 4 + 3] = 255;
    }
    if (name === 'legs') for (let i = 0; i < hidden.length; i++) if (hidden[i]) {
      const l = fill[i];
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = l; img.data[i * 4 + 3] = 255;
    }
    // Footwear is never above the top of the head (nor is anything but raised arms, in the
    // Genki Dama pose): whatever the sorter found there is a speck.
    for (const [f, cell] of setCells.entries()) {
      if (name !== 'feet' && f === 12) continue;
      const limit = Math.floor(poses[f].headTop * k + shifts[f][1]);
      for (let y = Math.max(0, cell.y0 | 0); y < Math.min(limit, set.h); y++) for (let x = cell.x0; x < cell.x1; x++) img.data[(y * set.w + x) * 4 + 3] = 0;
    }
    // Stray shades of a piece's colour scattered over the body are not part of it.
    despeckle(img.data, 50, set.w, set.h);
    const out = sheet();
    for (let f = 0; f < 16; f++) {
      const t = transforms[f];
      await paste(out, img, setCells[f], f, { s: t.s / k, ax: t.ax * k + shifts[f][0], ay: t.ay * k + shifts[f][1], x: t.x, y: t.y });
    }
    await save(out, `${name === 'top' ? 'torso' : name}-${id}`);
  }
  console.log(`${id}: torso, legs, feet`);
}
console.log('body + anchors', anchors.length);
