// Logical coordinates stay identical to combat physics and effect sockets.
// Extra texture pixels improve drawing detail without changing fighter size.
export const CUSTOM_FRAME = { width: 192, height: 128, columns: 4, count: 12 };

export function customFrameRegion(index: number, resolution: number) {
  const { width, height, columns } = CUSTOM_FRAME;
  const x = index % columns * width * resolution;
  const y = Math.floor(index / columns) * height * resolution;
  return { x, y, width, height,
    u0: index % columns / columns, v0: Math.floor(index / columns) / 3,
    u1: (index % columns + 1) / columns, v1: (Math.floor(index / columns) + 1) / 3 };
}

/** Accessories alter presentation only, never the saved hairstyle. */
export function displayedHead(head: string, accessory: string) {
  return accessory === 'straw_hat' ? 'saitama' : head;
}

export const HEAD_ANCHORS = {
  neck: [98, 70], eyes: [103, 61],
  hat: [85, 42, 29, 16], band: [83, 51, 27, 10], visor: [94, 58, 12, 7],
} as const;
