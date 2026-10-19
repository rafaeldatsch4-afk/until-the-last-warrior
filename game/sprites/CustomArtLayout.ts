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

export const HEAD_ANCHORS = {
  neck: [98, 70], eyes: [103, 61],
  hat: [86.5, 44.5, 24, 14.8], band: [84.6, 53, 22, 7], visor: [94, 58, 12, 7],
} as const;

/** Under a hat the chosen hairstyle stays; only hair above the crown's base is hidden. */
export const HAT_HAIR_LINE = 53.5;

/** Keep the scouter lens over the actual eye line of the custom Spider mask. */
export function scouterRect(head: string): readonly [number, number, number, number] {
  const [x, y, width, height] = HEAD_ANCHORS.visor;
  return [x, head === 'spiderman' ? y - 3 : y, width, height];
}

/** The painted wrap begins 43% into the image; its tails are not head width. */
export function headbandRect(head: string): readonly [number, number, number, number] {
  // The creator preview adds a small portrait translation around these
  // coordinates. Keep the plate on the forehead, between the hairline and
  // the eyes, instead of over the eyes like goggles.
  if (head === 'spiderman') return [93.5, 47.5, 15.5, 5.5];
  if (head === 'saitama' || head === 'jotaro') return [96.5, 50, 13.5, 5.5];
  return [97, 50.5, 13.5, 5.5];
}

/** The loose knot tails, tied at the back of the head and hanging behind it. */
export function headbandTailsRect(head: string): readonly [number, number, number, number] {
  const [x, y] = headbandRect(head);
  return [x - 13, y - 1, 9, 11];
}
