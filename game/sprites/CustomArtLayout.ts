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

/** Keep the scouter lens over the actual eye line of the custom Spider mask. */
export function scouterRect(head: string): readonly [number, number, number, number] {
  const [x, y, width, height] = HEAD_ANCHORS.visor;
  return [x, head === 'spiderman' ? y - 3 : y, width, height];
}

/** The painted wrap begins 43% into the image; its tails are not head width. */
export function headbandRect(head: string): readonly [number, number, number, number] {
  // The creator preview adds a small portrait translation around these
  // coordinates. Keep the band centered on the forehead after that transform,
  // instead of centering the source image (whose loose tails were cropped).
  if (head === 'saitama') return [97, 54.5, 14, 6];
  if (head === 'jotaro') return [97, 54, 14, 6];
  if (head === 'spiderman') return [93, 49, 17, 6];
  return [97.5, 55, 14, 6];
}
