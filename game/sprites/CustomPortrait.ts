import type { CharacterData } from '../types';
import { displayedHead, HEAD_ANCHORS, headbandRect } from './CustomArtLayout';

type Palette = { primary?: number; secondary?: number; skin?: number };
type Layer = (name: string, palette: Palette) => HTMLCanvasElement;
const css = (color: number) => '#' + color.toString(16).padStart(6, '0');

/** One immutable portrait per appearance: no independently moving face/hair frames. */
export function buildCustomPortrait(data: NonNullable<CharacterData['customData']>,
  form: string, layer: Layer, resolution: number, neckX: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 192 * resolution; canvas.height = 128 * resolution;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(resolution, resolution);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // Seat the jaw on the body's neck instead of stacking two complete necks.
  // Apply the same transform to the face, hair and every head accessory.
  ctx.translate(-.75,2);
  const accessory = data.part_accessory || 'none';
  const id = displayedHead(data.part_head || 'goku', accessory);
  const hair = form.endsWith('_ui') ? 0xdce3ed : form.endsWith('_ssj') ? 0xffdc35 : data.hair;
  const primary = data.color_head_1 ?? data.gi1;
  const secondary = data.color_head_2 ?? data.gi2;
  const portraitId = id==='spiderman' ? 'saitama' : id;
  const garmentHead=['jotaro','chapolim'].includes(id);
  const portrait = layer('portrait-' + portraitId, { primary: garmentHead?primary:hair, secondary, skin: data.skin });
  // Landmarks are in the original 512px cells, not each hairstyle's bounding box.
  // A taller hairstyle therefore never shrinks its face.
  const upperRow = ['goku','vegeta','naruto'].includes(portraitId);
  const neckAnchors: Record<string,number> = {goku:274,vegeta:272,naruto:274,sasuke:259,luffy:258,saitama:248};
  const sourceNeckX = portraitId==='jotaro'?256:portraitId==='chapolim'?240:neckAnchors[portraitId] ?? 274;
  const sourceNeckY = portraitId==='jotaro'?452:portraitId==='chapolim'?482:upperRow ? 532 : 442;
  const scale = 0.050;
  const x = neckX - sourceNeckX * scale;
  const y = HEAD_ANCHORS.neck[1] - sourceNeckY * scale;
  ctx.drawImage(portrait, x, y, 512 * scale, (garmentHead?512:upperRow ? 548 : 476) * scale);

  // Feather only the last neck pixels into the torso; never fade the jaw or eyes.
  ctx.save();ctx.globalCompositeOperation='destination-out';
  const neckFade=ctx.createLinearGradient(0,67,0,69);
  neckFade.addColorStop(0,'rgba(0,0,0,0)');neckFade.addColorStop(1,'rgba(0,0,0,1)');
  ctx.fillStyle=neckFade;ctx.fillRect(78,67,40,7);ctx.restore();
  ctx.translate(neckX-HEAD_ANCHORS.neck[0],0);

  // Existing mask/cap styles retain their identity, now on a rounded face grid.
  // These are the existing procedural garments, independent of optional accessories.
  if (id === 'spiderman') {
    ctx.fillStyle = css(primary); ctx.strokeStyle = '#17202c'; ctx.lineWidth = .65;
    ctx.beginPath();ctx.moveTo(93,48);ctx.bezierCurveTo(104,43,111,51,109,61);
    ctx.quadraticCurveTo(108,68,102,70);ctx.lineTo(96,72);ctx.lineTo(94,67);
    ctx.bezierCurveTo(89,63,87,52,93,48);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.lineWidth=.3;
    for(const yy of [52,56,61,65]){ctx.beginPath();ctx.moveTo(91,yy);ctx.quadraticCurveTo(100,yy+3,109,yy);ctx.stroke();}
    for(const xx of [94,99,104]){ctx.beginPath();ctx.moveTo(100,47);ctx.quadraticCurveTo(xx-3,59,xx,68);ctx.stroke();}
    ctx.fillStyle='#f5f7fa';ctx.lineWidth=.7;
    ctx.beginPath();ctx.moveTo(92,54);ctx.lineTo(99,57);ctx.quadraticCurveTo(98,62,94,59);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(102,57);ctx.lineTo(109,53);ctx.lineTo(107,59);ctx.quadraticCurveTo(104,62,102,57);ctx.fill();ctx.stroke();
  }

  if (accessory === 'straw_hat') {
    ctx.drawImage(layer('accessory-straw_hat', {}), ...HEAD_ANCHORS.hat);
  } else if (accessory === 'headband') {
    ctx.drawImage(layer('accessory-headband', { secondary: data.color_acc_1 ?? data.gi2 }), ...headbandRect(id));
  } else if (accessory === 'scouter') {
    const [vx,vy,vw,vh] = HEAD_ANCHORS.visor;
    ctx.save();ctx.translate(vx+vw,vy);ctx.scale(-1,1);
    ctx.drawImage(layer('accessory-scouter', {}),0,0,vw,vh);ctx.restore();
  }
  return canvas;
}
