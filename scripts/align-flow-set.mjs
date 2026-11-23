// Align a Flow-generated outfit sheet with the posed base body, pose by pose.
//
//   node scripts/align-flow-set.mjs <id>
//
// Reads docs/art/custom-v2/flow-raw/set-<id>-flow.jpg (Flow returns a 9:16 image, a little
// narrower than base-source.jpg, and drifts each pose by a few pixels), stretches it to the
// base's aspect, then moves each of the 16 figures so its bald skull sits exactly on the
// base's. Figures are whole connected shapes, not grid cells: a kick reaches into the next
// cell and must move with its own body. Writes docs/art/custom-v2/set-<id>.jpg for
// scripts/pack-custom-wardrobe.mjs.
import sharp from 'sharp';

const SRC = 'docs/art/custom-v2';
const id = process.argv[2];
if (!id) throw new Error('usage: node scripts/align-flow-set.mjs <id>');

const base = await sharp(`${SRC}/base-source.jpg`).metadata();
const H = 1376, W = Math.round(H * base.width / base.height);
async function load(path) {
  const { data } = await sharp(path).resize(W, H, { fit: 'fill', kernel: 'lanczos3' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return data;
}
const ref = await load(`${SRC}/base-source.jpg`), set = await load(`${SRC}/flow-raw/set-${id}-flow.jpg`);
const isFigure = (d, p) => d[p * 3 + 1] - Math.max(d[p * 3], d[p * 3 + 2]) < 60;

// The 4 figures of each row band: the 4 largest shapes, smaller pieces join the nearest one.
function figures(d) {
  const out = [], seen = new Uint8Array(W * H);
  for (let r = 0; r < 4; r++) {
    const y0 = Math.round(r * H / 4), y1 = Math.round((r + 1) * H / 4), parts = [];
    for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x; if (seen[p] || !isFigure(d, p)) continue;
      const px = [p]; seen[p] = 1; let x0 = x, x1 = x, top = y;
      for (let i = 0; i < px.length; i++) {
        const q = px[i], qx = q % W, qy = (q / W) | 0;
        x0 = Math.min(x0, qx); x1 = Math.max(x1, qx); top = Math.min(top, qy);
        for (const n of [qx > 0 ? q - 1 : -1, qx < W - 1 ? q + 1 : -1, qy > y0 ? q - W : -1, qy < y1 - 1 ? q + W : -1])
          if (n >= 0 && !seen[n] && isFigure(d, n)) { seen[n] = 1; px.push(n); }
      }
      parts.push({ px, x0, x1, top });
    }
    parts.sort((a, b) => b.px.length - a.px.length);
    const bodies = parts.slice(0, 4).sort((a, b) => a.x0 - b.x0).map(b => ({ ...b, px: [...b.px] }));
    for (const part of parts.slice(4)) {
      const cx = (part.x0 + part.x1) / 2;
      let best = bodies[0], bd = Infinity;
      for (const b of bodies) { const dd = Math.max(b.x0 - cx, 0, cx - b.x1); if (dd < bd) { bd = dd; best = b; } }
      best.px.push(...part.px);
    }
    out.push(...bodies);
  }
  return out;
}
// The skull: the figure's top row and the centre of its first 8 rows.
function skull(fig) {
  let top = Infinity; for (const p of fig.px) top = Math.min(top, (p / W) | 0);
  let sx = 0, n = 0; for (const p of fig.px) if (((p / W) | 0) < top + 8) { sx += p % W; n++; }
  return { x: sx / n, y: top };
}

const refFigs = figures(ref), setFigs = figures(set);
const out = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) { out[i * 3] = 0; out[i * 3 + 1] = 230; out[i * 3 + 2] = 0; }
const moves = [];
for (let f = 0; f < 16; f++) {
  // Raised hands sit above the head in the Genki Dama pose (12): no skull to match there.
  const a = skull(refFigs[f]), b = skull(setFigs[f]);
  const dx = f === 12 ? 0 : Math.round(a.x - b.x), dy = f === 12 ? 0 : a.y - b.y;
  moves.push(`${dx},${dy}`);
  for (const p of setFigs[f].px) {
    const x = p % W + dx, y = ((p / W) | 0) + dy;
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    set.copy(out, (y * W + x) * 3, p * 3, p * 3 + 3);
  }
}
await sharp(out, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 95 }).toFile(`${SRC}/set-${id}.jpg`);
console.log(`${id}: ${W}x${H}, moves ${moves.join(' ')}`);
