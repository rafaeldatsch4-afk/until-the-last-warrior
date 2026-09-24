/** Keep the reviewed face from idle frame zero. Independently generated idle
 * portraits otherwise change eye/jaw geometry at 10 Hz, which looks like flashing.
 * Only the portrait region is stabilized; walk/combat and the breathing body stay intact. */
export function stabilizeIdlePortrait(pixels: Uint8ClampedArray, sheetWidth: number) {
  const frameWidth = 192, left = 64, right = 128, bottom = 84;
  for (let frame = 1; frame < 4; frame++) {
    for (let y = 0; y < bottom; y++) {
      const start = (y * sheetWidth + left) * 4;
      const end = (y * sheetWidth + right) * 4;
      pixels.copyWithin(start + frame * frameWidth * 4, start, end);
    }
  }
}
