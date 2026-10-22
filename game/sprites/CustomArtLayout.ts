// Logical coordinates stay identical to combat physics and effect sockets.
// Extra texture pixels improve drawing detail without changing fighter size.
// 0-3 idle, 4-7 walk, 8 punch, 9 kick, 10 guard, 11 charge, 12 Genki Dama, 13-15 dash.
export const CUSTOM_FRAME = { width: 192, height: 128, columns: 4, rows: 4, count: 16 };
export const CUSTOM_DASH_FRAMES = [13, 15] as const;

export function customFrameRegion(index: number, resolution: number) {
  const { width, height, columns, rows } = CUSTOM_FRAME;
  const x = index % columns * width * resolution;
  const y = Math.floor(index / columns) * height * resolution;
  return { x, y, width, height,
    u0: index % columns / columns, v0: Math.floor(index / columns) / rows,
    u1: (index % columns + 1) / columns, v1: (Math.floor(index / columns) + 1) / rows };
}

export const HEAD_ANCHORS = {
  neck: [98, 70], eyes: [103, 61],
  hat: [86.5, 44.5, 24, 14.8], band: [84.6, 53, 22, 7], visor: [96, 57.5, 9.5, 5.6],
} as const;

/** Under a hat the chosen hairstyle stays; only hair above the crown's base is hidden. */
export const HAT_HAIR_LINE = 53.5;

/** Keep the scouter lens over the actual eye line of the custom Spider mask. */
export function scouterRect(head: string): readonly [number, number, number, number] {
  const [x, y, width, height] = HEAD_ANCHORS.visor;
  return [x, head === 'spiderman' ? y - 3 : y, width, height];
}

/** Heads painted with something other than hair or a bald scalp (Jotaro's cap,
 * Chapolim's hood, Spider-Man's mask) leave no forehead for a headband. */
export const COVERED_HEADS = ['jotaro', 'chapolim', 'spiderman'] as const;

/** The headband in portrait coordinates, seen from the front: a band across the
 * forehead just above the brows, its plate (and symbol) centred on the head, and
 * the knot at the back of the head. `sag` bows the band down at the centre. */
export function headbandFront(_head: string) {
  return { cx: 98.5, y: 57.6, half: 7.8, thickness: 2.5, sag: .9, plate: [5.4, 3.4] as const };
}

/** Where the rings are split and knotted, as fractions of the ring image. */
export const RING = {
  scarf: { split: .45, knot: [.06, .45] },
} as const;

/** The scarf collar around the base of the neck, centred on the neck. */
export function scarfCollarRect(neckX: number): readonly [number, number, number, number] {
  const width = 14, height = width * 126 / 221;
  return [neckX + 1 - width / 2, 68.5, width, height];
}

/** Tail strips hold 4 states (hanging, swaying, in the wind, streaming back);
 * every cell has its knot on `anchor`, and `length` is the drawn cell height. */
export const ACCESSORY_TAILS = {
  scarf: { anchor: [.845, .023], length: 19 },
  headband: { anchor: [.873, .088], length: 11 },
} as const;

/** Loose ends follow the action: they hang and sway at rest, flow while moving
 * or striking, and stream straight back during the dash. */
/** Extra swing (radians, positive = toward the back) so the scarf's ends show
 * behind the shoulder instead of disappearing behind the torso. */
export const SCARF_TAIL_SWING = [.65, .5, .15, 0] as const;

export function tailState(frame: number): 0 | 1 | 2 | 3 {
  if (frame < 4) return frame % 2 ? 1 : 0;
  if (frame < 8) return frame % 2 ? 2 : 1;
  if (frame === 10 || frame === 12) return 1;
  if (frame >= CUSTOM_DASH_FRAMES[0]) return 3;
  return 2;
}

/** Where the guard sits along accessory-sword_sheathed.png (scabbard left, hilt right). */
export const SHEATH_GUARD = .707;
