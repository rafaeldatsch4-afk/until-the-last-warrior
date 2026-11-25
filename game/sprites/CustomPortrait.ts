import type { CharacterData } from '../types';
import { HAT_HAIR_LINE, HEAD_ANCHORS, HEAD_NECK_CUT, HEAD_SCALE, headDropOf, headScaleOf, headShiftOf, scouterRect } from './CustomArtLayout';

type Palette = { primary?: number; secondary?: number; skin?: number };
type Layer = (name: string, palette: Palette) => HTMLCanvasElement;
const css = (color: number) => '#' + color.toString(16).padStart(6, '0');

/** One immutable portrait per appearance: no independently moving face/hair frames. */
export function buildCustomPortrait(data: NonNullable<CharacterData['customData']>,
  form: string, layer: Layer, resolution: number, neckX: number, headScale = HEAD_SCALE,
  /** Per-head fit (size, drop, shift, neck cut) tuned for the modular torsos only; the
   *  posed wardrobe seats every head on its own measured anchors. */
  modularFit = true) {
  const canvas = document.createElement('canvas');
  canvas.width = 192 * resolution; canvas.height = 128 * resolution;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(resolution, resolution);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // Seat the jaw on the body's neck instead of stacking two complete necks.
  // Apply the same transform to the face, hair and every head accessory.
  const accessory = data.part_accessory || 'none';
  const id = data.part_head || 'goku';
  ctx.translate(-.75+(modularFit?headShiftOf(id):0),2+(modularFit?headDropOf(id):0));
  // Scale the whole head about the neck so face, hair and accessories shrink together.
  const fit = modularFit ? headScaleOf(id, headScale) : headScale;
  ctx.translate(neckX, HEAD_ANCHORS.neck[1]); ctx.scale(fit, fit); ctx.translate(-neckX, -HEAD_ANCHORS.neck[1]);
  const hair = form.endsWith('_ui') ? 0xdce3ed : form.endsWith('_ssj') ? 0xffdc35 : data.hair;
  const primary = data.color_head_1 ?? data.gi1;
  const secondary = data.color_head_2 ?? data.gi2;
  const portraitId = id;
  // Masks and hats painted into the portrait take the head colours, not the hair colour.
  const garmentHead=['jotaro','chapolim','spiderman'].includes(id);
  const portrait = layer('portrait-' + portraitId, { primary: garmentHead?primary:hair, secondary, skin: data.skin });
  // Landmarks are in the original 512px cells, not each hairstyle's bounding box.
  // A taller hairstyle therefore never shrinks its face.
  const upperRow = ['goku','vegeta','naruto'].includes(portraitId);
  const neckAnchors: Record<string,number> = {goku:274,vegeta:272,naruto:274,sasuke:259,luffy:258,saitama:248,spiderman:248,shinigami:278};
  const sourceNeckX = portraitId==='jotaro'?256:portraitId==='chapolim'?240:neckAnchors[portraitId] ?? 274;
  const sourceNeckY = portraitId==='jotaro'?452:portraitId==='chapolim'?482:upperRow ? 532 : 442;
  const scale = 0.050;
  const x = neckX - sourceNeckX * scale;
  const y = HEAD_ANCHORS.neck[1] - sourceNeckY * scale;
  const drawFace = () => ctx.drawImage(portrait, x, y, 512 * scale, (garmentHead?512:upperRow ? 548 : 476) * scale);
  if (accessory === 'straw_hat' && id === 'jotaro') {
    // Follow the underside of the painted peak. A horizontal hair trim
    // alone leaves a second brim protruding in front of the straw hat.
    ctx.save(); ctx.beginPath();
    const outline = [[0,0],[132,0],[188,164],[256,178],[340,196],[404,214],[405,236],[420,241],[512,244],[512,512],[0,512]];
    outline.forEach(([px,py],i) => i ? ctx.lineTo(x+px*scale,y+py*scale) : ctx.moveTo(x+px*scale,y+py*scale));
    ctx.closePath(); ctx.clip(); drawFace(); ctx.restore();
  } else drawFace();

  // Feather only the last neck pixels into the torso; never fade the jaw or eyes.
  ctx.save();ctx.globalCompositeOperation='destination-out';
  const neckFade=ctx.createLinearGradient(0,67,0,69);
  neckFade.addColorStop(0,'rgba(0,0,0,0)');neckFade.addColorStop(1,'rgba(0,0,0,1)');
  ctx.fillStyle=neckFade;ctx.fillRect(78,67,40,7);ctx.restore();
  ctx.translate(neckX-HEAD_ANCHORS.neck[0],0);
  if (accessory === 'straw_hat') {
    // Hair above the crown's base would poke through the hat; the rest frames the face.
    ctx.save();ctx.globalCompositeOperation='destination-out';
    ctx.fillRect(60,0,80,HAT_HAIR_LINE);ctx.restore();
  }

  // The headband is drawn per frame (CustomArt): its ring wraps behind the head
  // and its knot tails move with each pose.
  if (accessory === 'straw_hat') {
    if (id === 'chapolim') {
      // Keep the antenna tips attached behind the new crown (the hood
      // itself must stay under the hat). Source landmarks are in the 512px portrait.
      ctx.save(); ctx.translate(0,-7); ctx.beginPath();
      ctx.moveTo(x,y); ctx.lineTo(x+512*scale,y); ctx.lineTo(x+512*scale,y+179*scale);
      ctx.lineTo(x+326*scale,y+156*scale); ctx.lineTo(x+213*scale,y+124*scale);
      ctx.lineTo(x+184*scale,y+150*scale); ctx.lineTo(x,y+150*scale);
      ctx.closePath(); ctx.clip(); drawFace(); ctx.restore();
    }
    ctx.drawImage(layer('accessory-straw_hat', {}), ...HEAD_ANCHORS.hat);
  } else if (accessory === 'scouter') {
    const [vx,vy,vw,vh] = scouterRect(id);
    ctx.save();ctx.translate(vx+vw,vy);ctx.scale(-1,1);
    ctx.drawImage(layer('accessory-scouter', {}),0,0,vw,vh);ctx.restore();
  }
  const cut = modularFit ? HEAD_NECK_CUT[id] : undefined;
  if (cut) {
    // Frame coordinates: the line runs under the ear and drops onto the collar's edge.
    const x = neckX + cut.dx;
    ctx.setTransform(resolution, 0, 0, resolution, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.moveTo(0, cut.y - 1); ctx.lineTo(x - 2, cut.y); ctx.lineTo(x, cut.y + 3);
    ctx.lineTo(x, 128); ctx.lineTo(0, 128); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  return canvas;
}
