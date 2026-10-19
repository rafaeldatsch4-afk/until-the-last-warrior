/** Separate the painted arms from a custom torso so they can be posed.
 *
 * Each arm is split from the body along the transparent gap under the armpit,
 * row by row, instead of a fixed rectangle: rectangles cut through the chest
 * and sleeves. Above the armpit the shoulder stays in BOTH layers, so a raised
 * or swung arm never leaves a hole or a square shoulder in the body.
 */
export const BODY = 4, BACK_ARM = 1, FRONT_ARM = 2;

export interface ArmRig {
  /** Per pixel bit mask: BODY, BACK_ARM, FRONT_ARM (a shoulder belongs to the body and an arm). */
  owner: Uint8Array;
  /** Shoulder pivot, elbow and hand centre, in torso pixels; [back, front]. */
  shoulder: [number, number][]; elbow: [number, number][]; hand: [number, number][];
  /** First row (in torso pixels) that belongs to each forearm. */
  elbowRow: number[];
}

export function splitArms(pixels: Uint8ClampedArray, width: number, height: number, alphaMin = 100): ArmRig | null {
  const opaque = (x: number, y: number) => pixels[(y * width + x) * 4 + 3] > alphaMin;
  const cut = [new Float64Array(height).fill(NaN), new Float64Array(height).fill(NaN)];
  for (let y = 0; y < height; y++) {
    const runs: [number, number][] = [];
    for (let x = 0; x < width; x++) {
      if (!opaque(x, y)) continue;
      const start = x; while (x + 1 < width && opaque(x + 1, y)) x++;
      // Tiny gaps are antialiasing inside one shape, not the armpit.
      const last = runs[runs.length - 1];
      if (last && start - last[1] <= 2) last[1] = x; else runs.push([start, x]);
    }
    // An armpit is never in the top third: a gap there is a collar or a cape.
    if (runs.length < 2 || y < height * .3) continue;
    if (runs[0][1] < width * .45) cut[0][y] = (runs[0][1] + runs[1][0]) / 2;
    const a = runs[runs.length - 2], b = runs[runs.length - 1];
    if (b[0] > width * .55) cut[1][y] = (a[1] + b[0]) / 2;
  }
  const owner = new Uint8Array(width * height);
  for (let i = 0; i < owner.length; i++) if (pixels[i * 4 + 3] > alphaMin) owner[i] = BODY;
  const rig: ArmRig = { owner, shoulder: [], elbow: [], hand: [], elbowRow: [] };
  for (const side of [0, 1]) {
    const c = cut[side], rows: number[] = [];
    for (let y = 0; y < height; y++) if (!Number.isNaN(c[y])) rows.push(y);
    if (rows.length < height * .15) return null;
    const first = rows[0], last = rows[rows.length - 1];
    // Fill short interruptions (fist touching the hip, sleeve folds) linearly.
    let prev = first;
    for (const y of rows) { for (let k = prev + 1; k < y; k++) c[k] = c[prev] + (c[y] - c[prev]) * (k - prev) / (y - prev); prev = y; }
    // The shoulder joint sits a little above the armpit, never at the collar.
    const top = Math.round(Math.min(Math.max(first - height * .22, height * .12), height * .3));
    for (let y = top; y < height; y++) {
      const edge = y < first ? c[first] : y > last ? c[last] : c[y];
      for (let x = 0; x < width; x++) {
        if (!opaque(x, y) || (side ? x <= edge : x >= edge)) continue;
        const i = y * width + x;
        owner[i] = (y < first ? BODY : 0) | (side ? FRONT_ARM : BACK_ARM);
      }
    }
    // Joints from the arm's own pixels.
    const centre = (y0: number, y1: number): [number, number] => {
      let sx = 0, sy = 0, n = 0;
      for (let y = Math.max(0, y0); y <= Math.min(height - 1, y1); y++) {
        const edge = y < first ? c[first] : y > last ? c[last] : c[y];
        for (let x = 0; x < width; x++) if (opaque(x, y) && (side ? x > edge : x < edge)) { sx += x; sy += y; n++; }
      }
      return n ? [sx / n, sy / n] : [side ? width * .85 : width * .15, (y0 + y1) / 2];
    };
    let bottom = top;
    for (let y = height - 1; y >= top; y--) {
      const edge = y > last ? c[last] : c[Math.max(y, first)];
      let found = false;
      for (let x = 0; x < width; x++) if (opaque(x, y) && (side ? x > edge : x < edge)) { found = true; break; }
      if (found) { bottom = y; break; }
    }
    const shoulderY = top + height * .06, span = bottom - shoulderY;
    const elbowRow = Math.round(shoulderY + span * .47);
    rig.shoulder[side] = [centre(top, top + Math.round(height * .1))[0], shoulderY];
    rig.elbow[side] = [centre(elbowRow - 2, elbowRow + 2)[0], elbowRow];
    rig.hand[side] = centre(bottom - Math.round(span * .12), bottom);
    rig.elbowRow[side] = elbowRow;
    // A cape or a coat hiding the arm leaves only a hand: not a usable arm.
    if (span < height * .45) return null;
  }
  // A cape hiding one arm (Saitama) leaves a sliver: keep the painted pose then.
  const count = [0, 0];
  for (const o of owner) { if (o & BACK_ARM) count[0]++; if (o & FRONT_ARM) count[1]++; }
  if (Math.min(...count) < Math.max(...count) * .5) return null;
  return rig;
}
