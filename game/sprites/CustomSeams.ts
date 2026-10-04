// Reviewed landmarks in the original drawings, before color replacement.
export const GI_SEAM = {
  torsoBeltBottom: 184,
  torsoHeight: 252,
  trouserBeltBottom: 28,
  spandexBeltBottom: 20,
  raisedBeltBottom: 448,
  worldY: 66 + 184 / 252 * 36,
} as const;

/** Preserve the source aspect ratio when fitting a shoe to a trouser cuff. */
export function fittedFootwear(width: number, height: number, shaftWidth: number, cuffWidth: number, legLength: number) {
  const scale=Math.min((cuffWidth+.5)/shaftWidth,legLength*.58/height);
  return {width:width*scale,height:height*scale};
}

/** Find where the cloth ends, excluding the source's bare ankle below it. */
export function trouserClothBottom(pixels: ArrayLike<number>, width: number, top: number, height: number) {
  for(let y=Math.floor(height*.82);y<height;y++) {
    let skin=0,opaque=0;
    for(let x=0;x<width;x++) {
      const i=((y+top)*width+x)*4;
      if(pixels[i+3]<128)continue;
      opaque++;
      const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
      if(r>g*1.06&&g>b*1.06&&r>110&&g>65&&b>45)skin++;
    }
    if(opaque&&skin/opaque>.35)return y;
  }
  return height;
}
