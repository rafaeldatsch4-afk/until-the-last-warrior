// Logical coordinates stay identical to combat physics and effect sockets.
// Extra texture pixels improve drawing detail without changing fighter size.
export const CUSTOM_FRAME = { width: 192, height: 128, columns: 4, rows: 4, count: 13 };

export function customFrameRegion(index: number, resolution: number) {
  const { width, height, columns, rows } = CUSTOM_FRAME;
  const x = index % columns * width * resolution;
  const y = Math.floor(index / columns) * height * resolution;
  return { x, y, width, height,
    u0: index % columns / columns, v0: Math.floor(index / columns) / rows,
    u1: (index % columns + 1) / columns, v1: (Math.floor(index / columns) + 1) / rows };
}

/** Accessories alter presentation only, never the saved hairstyle. */
export function displayedHead(head: string, accessory: string) {
  return accessory === 'straw_hat' ? 'saitama' : head;
}

export const HEAD_ANCHORS = {
  neck: [98, 70], eyes: [103, 61],
  hat: [86.5, 44.5, 24, 14.8], band: [84.6, 53, 22, 7], visor: [94, 58, 12, 7],
} as const;

/** The painted wrap begins 43% into the image; its tails are not head width. */
export function headbandRect(head: string): readonly [number, number, number, number] {
  if (head === 'saitama') return [82.2, 52, 24.3, 7];
  if (head === 'jotaro') return [84.3, 51, 22, 7];
  if (head === 'spiderman') return [83.5, 47, 26, 7];
  return HEAD_ANCHORS.band;
}
