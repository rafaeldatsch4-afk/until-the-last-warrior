/// <reference types="vite/client" />
import type Phaser from 'phaser';
import type { CharacterData } from '../types';
import { buildCustomPortrait } from './CustomPortrait';
import { ACCESSORY_TAILS, CUSTOM_DASH_FRAMES, CUSTOM_FRAME, headbandRect, RING, SCARF_TAIL_SWING, scarfCollarRect, SHEATH_GUARD, tailState } from './CustomArtLayout';
import { genkiTorsoRect } from './GenkiTorsoLayout';
import POSED_ANCHORS from '../assets/custom-v2/anchors.json';
import { BACK_ARM, BODY, FRONT_ARM, splitArms } from './CustomArms';
import { GI_SEAM, trouserClothBottom, fittedFootwear } from './CustomSeams';

const urls = import.meta.glob<string>('../assets/custom/*.png', { eager: true, query: '?url', import: 'default' });
const prefix = 'wardrobe:';
// Posed wardrobe: one base body and every outfit drawn on it in the 16 poses
// (scripts/pack-custom-wardrobe.mjs). Used whenever the chosen pieces all exist.
const posedUrls = import.meta.glob<string>('../assets/custom-v2/*.png', { eager: true, query: '?url', import: 'default' });
const POSED = 'wardrobe2:';
export function preloadCustomArt(scene: Phaser.Scene) {
  for (const [list, keyPrefix] of [[urls, prefix], [posedUrls, POSED]] as const) for (const [path, url] of Object.entries(list)) {
    const key = keyPrefix + path.split('/').pop()!.replace('.png', '');
    if (!scene.textures.exists(key)) scene.load.image(key, url);
  }
}
export function hasCustomArt(scene: Phaser.Scene) {
  return Object.keys(urls).length > 0 && Object.keys(urls).every(path =>
    scene.textures.exists(prefix + path.split('/').pop()!.replace('.png', '')));
}
type Palette = { primary?: number; secondary?: number; skin?: number };
const caches = new WeakMap<object, Map<string, HTMLCanvasElement>>();
const rgb = (color: number) => [color >>> 16 & 255, color >>> 8 & 255, color & 255];

// Generated footwear pairs are not evenly spaced. Split in the transparent gap,
// then trim each boot independently: a midpoint slice steals pixels from its neighbour.
function footwearParts(image: HTMLCanvasElement) {
  const pixels = image.getContext('2d')!.getImageData(0,0,image.width,image.height).data;
  let split = Math.floor(image.width/2), best = Infinity;
  for(let x=Math.floor(image.width*.24);x<image.width*.7;x++) {
    let count=0;for(let y=0;y<image.height;y++)if(pixels[(y*image.width+x)*4+3]>32)count++;
    if(count<best){best=count;split=x;}
  }
  return [[0,split],[split,image.width]].map(([start,end])=>{
    let x0=end,y0=image.height,x1=start,y1=0;
    for(let y=0;y<image.height;y++)for(let x=start;x<end;x++)if(pixels[(y*image.width+x)*4+3]>32){
      x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
    }
    const w=Math.max(1,x1-x0+1),h=Math.max(1,y1-y0+1);
    // The toe makes the silhouette asymmetric; attach at the boot shaft instead.
    let shaftLeft=0,shaftRight=0,shaftRows=0;
    // Measure below the curved rim, where the boot shaft reaches its full width.
    for(let y=Math.ceil(y0+h*.08);y<y0+h*.18;y++) {
      let left=x1,right=x0;
      for(let x=x0;x<=x1;x++)if(pixels[(y*image.width+x)*4+3]>128){left=Math.min(left,x);right=Math.max(right,x);}
      if(right>left){shaftLeft+=left-x0;shaftRight+=right-x0+1;shaftRows++;}
    }
    const left=shaftRows?shaftLeft/shaftRows:0,right=shaftRows?shaftRight/shaftRows:w;
    return {x:x0,y:y0,w,h,ankle:(left+right)/2,shaftWidth:right-left};
  });
}

/** The source's white, cyan and peach are independent material masks. */
function tint(scene: Phaser.Scene, name: string, palette: Palette, keyPrefix = prefix): HTMLCanvasElement {
  if (keyPrefix === prefix && !scene.textures.exists(prefix + name)) {
    const category = name.split('-')[0];
    name = category === 'accessory' ? 'accessory-scarf' : category + '-goku';
  }
  let cache = caches.get(scene.textures);
  if (!cache) { cache = new Map(); caches.set(scene.textures, cache); }
  const key = keyPrefix + name + JSON.stringify(palette);
  const previous = cache.get(key);
  if (previous) return previous;
  const source = scene.textures.get(keyPrefix + name).getSourceImage() as HTMLImageElement;
  const canvas = document.createElement('canvas');
  canvas.width = source.width; canvas.height = source.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    if (!pixels.data[i + 3]) continue;
    const r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2];
    const px=i/4%canvas.width,py=Math.floor(i/4/canvas.width);
    let color: number | undefined, light = 1;
    if((name==='portrait-chapolim' || name==='portrait-spiderman') && r>g*1.8 && r>b*1.8) {
      color=palette.primary;light=r/230;
    } else if(name==='portrait-chapolim' && py<canvas.height*.3 && r>100 && g>70 && b<g*.65) {
      color=palette.secondary;light=r/230;
    } else if(name==='portrait-jotaro' && py<canvas.height*.43 && r>100 && g>70 && b<g*.65) {
      color=palette.secondary;light=r/230;
    } else if(name==='portrait-jotaro' && px>canvas.width*.40 && py<canvas.height*.43 && Math.max(r,g,b)-Math.min(r,g,b)<35 && Math.max(r,g,b)>15) {
      color=palette.primary;light=Math.min(1,.25+Math.max(r,g,b)/120);
    } else if (g > r * 1.28 && b > r * 1.28 && g > 55) {
      color = palette.secondary; light = Math.max(g, b) / 205;
    } else if (r > g * 1.06 && g > b * 1.06 && r > 110 && g > 65 && b > 45) {
      color = palette.skin; light = r / 245;
    } else if (Math.max(r,g,b) - Math.min(r,g,b) < 65 && Math.max(r,g,b) > 65) {
      const portrait = name.startsWith('portrait-');
      const lowerRow=['portrait-sasuke','portrait-luffy','portrait-saitama'].includes(name);
      const hairRegion=!['portrait-saitama','portrait-jotaro','portrait-chapolim','portrait-spiderman'].includes(name) && (py < canvas.height*(lowerRow ? .50 : .58) || px < canvas.width*.35);
      color = !portrait || hairRegion ? palette.primary : undefined;
      light = (r + g + b) / (3 * 230);
    }
    if (color === undefined) continue;
    const channels = rgb(color);
    // Preserve material highlights even on black fabric, without washing out dark colors.
    for (let c = 0; c < 3; c++) pixels.data[i + c] = Math.min(255, Math.round(channels[c] * Math.min(light,1) + Math.max(0,light-1) * 160));
  }
  ctx.putImageData(pixels, 0, 0);
  if (cache.size >= 96) cache.delete(cache.keys().next().value!);
  cache.set(key, canvas);
  return canvas;
}

/** A ring (headband, scarf collar) is split: its far half sits behind the head
 * or neck, its near half and knot in front. */
function drawRing(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, rect: readonly number[], ring: { split: number }, half: 'back' | 'front') {
  const [x, y, w, h] = rect, splitY = y + h * ring.split, knotX = x + w * .15;
  ctx.save(); ctx.beginPath();
  if (half === 'back') ctx.rect(knotX, y - 1, x + w - knotX + 1, splitY - y + 1);
  else { ctx.rect(x - 1, splitY, w + 2, h + 1); ctx.rect(x - 1, y - 1, knotX - x + 1, splitY - y + 1); }
  ctx.clip(); ctx.drawImage(img, x, y, w, h); ctx.restore();
}

/** Draw one state of a tail strip with its knot on (kx, ky). */
function drawTails(ctx: CanvasRenderingContext2D, tails: HTMLCanvasElement | null, id: 'scarf' | 'headband', state: number, kx: number, ky: number, swing = 0, scale = 1) {
  if (!tails) return;
  const { anchor, length } = ACCESSORY_TAILS[id];
  const cw = tails.width / 4, h = length * scale, w = h * cw / tails.height;
  ctx.save(); ctx.translate(kx, ky); ctx.rotate(swing);
  ctx.drawImage(tails, state * cw, 0, cw, tails.height, -anchor[0] * w, -anchor[1] * h, w, h);
  ctx.restore();
}

type PosedAnchor = { neck: number[]; headTop: number; headWidth: number; waist: number[]; hand: number[] };
const posedAnchors = POSED_ANCHORS as PosedAnchor[];
/** Width of the bald portrait head at scale 1 (portrait coordinates) and its chin. */
const PORTRAIT_HEAD_WIDTH = 14.5, PORTRAIT_CHIN = [97.25, 70] as const;

/** Clear the outermost texels of every frame. Frames sit edge to edge in one texture, and
 * filtering would otherwise pull the feet of one row onto the top of the frame below. */
function isolateFrames(canvas: HTMLCanvasElement, resolution: number) {
  const ctx = canvas.getContext('2d')!, w = CUSTOM_FRAME.width * resolution, h = CUSTOM_FRAME.height * resolution;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let r = 0; r < CUSTOM_FRAME.rows; r++) for (let c = 0; c < CUSTOM_FRAME.columns; c++) {
    const x = c * w, y = r * h;
    ctx.clearRect(x, y, w, 1); ctx.clearRect(x, y + h - 1, w, 1);
    ctx.clearRect(x, y, 1, h); ctx.clearRect(x + w - 1, y, 1, h);
  }
}

/** The posed wardrobe is used when the body and every chosen piece have been drawn. */
export function hasPosedWardrobe(scene: Phaser.Scene, data: NonNullable<CharacterData['customData']>) {
  const torso = data.part_torso || 'goku';
  return ['body', ...(torso === 'muscle' ? [] : ['torso-' + torso]), 'legs-' + (data.part_legs || 'goku'), 'feet-' + (data.part_feet || 'goku')]
    .every(name => scene.textures.exists(POSED + name));
}

/** Body, trousers, footwear and top drawn in each pose; head, hair and accessories on its anchors. */
function composePosedWardrobe(scene: Phaser.Scene, texture: string, data: NonNullable<CharacterData['customData']>) {
  const resolution = scene.sys.game.renderer.type === 2 ? 4 : 2;
  const canvas = document.createElement('canvas');
  canvas.width = CUSTOM_FRAME.width * CUSTOM_FRAME.columns * resolution;
  canvas.height = CUSTOM_FRAME.height * CUSTOM_FRAME.rows * resolution;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(resolution, resolution); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const torsoId = data.part_torso || 'goku';
  const layers = [
    // The base's shorts take the trousers' colour, so a short top never shows them.
    tint(scene, 'body', { skin: data.skin, primary: data.color_legs_1 ?? data.gi1 }, POSED),
    tint(scene, 'legs-' + (data.part_legs || 'goku'), { primary: data.color_legs_1 ?? data.gi1, secondary: data.color_legs_2 ?? data.gi2, skin: data.skin }, POSED),
    tint(scene, 'feet-' + (data.part_feet || 'goku'), { primary: data.color_feet_1 ?? data.gi2, secondary: data.color_feet_2 ?? data.gi1, skin: data.skin }, POSED),
    ...(torsoId === 'muscle' ? [] : [tint(scene, 'torso-' + torsoId, { primary: data.color_torso_1 ?? data.gi1, secondary: data.color_torso_2 ?? data.gi2, skin: data.skin }, POSED)]),
  ];
  const accessoryId = data.part_accessory || 'none';
  const accessory = accessoryId === 'none' ? null : tint(scene, 'accessory-' + accessoryId,
    accessoryId === 'cape' || accessoryId === 'scarf' ? { primary: data.color_acc_1 ?? data.gi2 } :
    accessoryId === 'headband' ? { secondary: data.color_acc_1 ?? data.gi2 } : {});
  const sheath = accessoryId === 'sword' ? tint(scene, 'accessory-sword_sheathed', {}) : null;
  const tailsId = accessoryId === 'scarf' || accessoryId === 'headband' ? accessoryId : null;
  const tails = tailsId ? tint(scene, 'accessory-' + tailsId + '_tails',
    tailsId === 'scarf' ? { primary: data.color_acc_1 ?? data.gi2 } : { secondary: data.color_acc_1 ?? data.gi2 }) : null;
  const portrait = buildCustomPortrait(data, texture, (name, palette) => tint(scene, name, palette), resolution, 98);
  const cellW = layers[0].width / 4, cellH = layers[0].height / 4;
  for (let f = 0; f < CUSTOM_FRAME.count; f++) {
    const A = posedAnchors[f], state = tailState(f), dash = f >= CUSTOM_DASH_FRAMES[0];
    const punch = f === 8, defend = f === 10, charge = f === 11, kick = f === 9, walk = f >= 4 && f <= 7;
    // The portrait head is scaled to this pose's head and its chin seated on the body's.
    const k = A.headWidth / PORTRAIT_HEAD_WIDTH;
    const toHead = () => { ctx.translate(A.neck[0], A.neck[1]); ctx.scale(k, k); ctx.translate(-PORTRAIT_CHIN[0], -PORTRAIT_CHIN[1]); };
    ctx.save(); ctx.translate(f % 4 * 192, Math.floor(f / 4) * 128);
    // Nothing of a pose may spill into its neighbours.
    ctx.beginPath(); ctx.rect(0, 0, 192, 128); ctx.clip();
    if (accessory && accessoryId === 'cape') {
      const width = 40, height = width * accessory.height / accessory.width;
      ctx.save(); ctx.translate(A.neck[0] - 1, A.neck[1] + 3);
      ctx.rotate(dash ? .3 : walk ? .05 : punch ? -.08 : kick ? .1 : defend ? -.12 : charge ? .14 : 0);
      ctx.drawImage(accessory, -width / 2, 0, width, height); ctx.restore();
    }
    const collar = [A.neck[0] + 1 - 6.5, A.neck[1] + .5, 13, 13 * 126 / 221] as const;
    if (accessory && accessoryId === 'scarf') {
      drawTails(ctx, tails, 'scarf', state, collar[0] + collar[2] * RING.scarf.knot[0], collar[1] + collar[3] * RING.scarf.knot[1], SCARF_TAIL_SWING[state], .9);
      drawRing(ctx, accessory, collar, RING.scarf, 'back');
    }
    // Katana: scabbard behind the body at the waist, drawn only to strike and to guard.
    const drawn = punch || defend;
    const sheathAt = (part: 'scabbard' | 'hilt') => {
      if (!sheath || f === 12 || (part === 'hilt' && drawn)) return;
      const w = 44, h = w * sheath.height / sheath.width, gx = w * SHEATH_GUARD;
      ctx.save(); ctx.translate(A.waist[0] + 3, A.waist[1] + 2); ctx.rotate(-.4); ctx.beginPath();
      if (part === 'scabbard') ctx.rect(-gx - 1, -h, gx + 1, h * 2); else ctx.rect(-1.5, -h, w - gx + 2, h * 2);
      ctx.clip(); ctx.drawImage(sheath, -gx, -h / 2, w, h); ctx.restore();
    };
    sheathAt('scabbard');
    for (const layer of layers) ctx.drawImage(layer, f % 4 * cellW, Math.floor(f / 4) * cellH, cellW, cellH, 0, 0, 192, 128);
    sheathAt('hilt');
    const band = accessory && accessoryId === 'headband' ? headbandRect(data.part_head || 'goku') : null;
    ctx.save(); toHead(); ctx.translate(-.75, 2);
    if (band) drawRing(ctx, accessory!, band, RING.headband, 'back');
    ctx.restore();
    ctx.save(); toHead(); ctx.drawImage(portrait, 0, 0, 192, 128); ctx.restore();
    if (band) {
      ctx.save(); toHead(); ctx.translate(-.75, 2);
      drawRing(ctx, accessory!, band, RING.headband, 'front');
      drawTails(ctx, tails, 'headband', state, band[0] + band[2] * RING.headband.knot[0], band[1] + band[3] * RING.headband.knot[1]);
      ctx.restore();
    }
    if (accessory && accessoryId === 'scarf') drawRing(ctx, accessory, collar, RING.scarf, 'front');
    if (accessory && accessoryId === 'sword' && drawn) {
      const w = 40, h = w * accessory.height / accessory.width, grip = w * (70 / accessory.width);
      ctx.save(); ctx.translate(A.hand[0] - 2, A.hand[1]); ctx.rotate(punch ? 0 : -1.75);
      ctx.drawImage(accessory, -grip, -h / 2, w, h); ctx.restore();
    }
    ctx.restore();
  }
  isolateFrames(canvas, resolution);
  if (scene.textures.exists(texture)) scene.textures.remove(texture);
  const result = scene.textures.addCanvas(texture, canvas);
  if (result) Object.assign(result, { customWardrobeArt: true, customArtResolution: resolution,
    customSockets: { hand: posedAnchors[8].hand, cast: posedAnchors[11].hand } });
}

/** Preserve the original 12 poses; the extra frame is reserved for Genki Dama. */
export function composeCustomArt(scene: Phaser.Scene, texture: string, data: NonNullable<CharacterData['customData']>) {
  if (hasPosedWardrobe(scene, data)) { composePosedWardrobe(scene, texture, data); return; }
  // Keep source detail through composition on both renderers. A 1x canvas
  // atlas discarded most of the high-resolution garment and portrait artwork.
  const resolution = scene.sys.game.renderer.type === 2 ? 4 : 2;
  const canvas = document.createElement('canvas');
  canvas.width = CUSTOM_FRAME.width * CUSTOM_FRAME.columns * resolution;
  canvas.height = CUSTOM_FRAME.height * CUSTOM_FRAME.rows * resolution;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(resolution,resolution);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const torsoId=data.part_torso || 'goku';
  const torsoSource = tint(scene, 'torso-' + torsoId, { primary: data.color_torso_1 ?? data.gi1, secondary: data.color_torso_2 ?? data.gi2, skin: data.skin });
  const torso=document.createElement('canvas');torso.width=torsoSource.width;torso.height=torsoSource.height;
  const torsoContext=torso.getContext('2d')!;torsoContext.drawImage(torsoSource,0,0);
  if(torsoId==='goku') {
    // The gi drawing contains a separate skirt below its belt. Remove only that
    // central piece, not the arms: the equipped trousers supply the lower gi.
    const pixels=torsoContext.getImageData(0,0,torso.width,torso.height);
    for(let y=GI_SEAM.torsoBeltBottom;y<torso.height;y++) {
      const centre=Math.round(torso.width*.55);
      if(pixels.data[(y*torso.width+centre)*4+3]<8)continue;
      let left=centre,right=centre;
      while(left>0&&pixels.data[(y*torso.width+left-1)*4+3]>4)left--;
      while(right<torso.width-1&&pixels.data[(y*torso.width+right+1)*4+3]>4)right++;
      torsoContext.clearRect(left,y,right-left+1,1);
    }
  }
  const raisedTorso = tint(scene, 'torso-genki-' + (data.part_torso || 'goku'), { primary: data.color_torso_1 ?? data.gi1, secondary: data.color_torso_2 ?? data.gi2, skin: data.skin });
  const legSource = tint(scene, 'legs-' + (data.part_legs || 'goku'), { primary: data.color_legs_1 ?? data.gi1, secondary: data.color_legs_2 ?? data.gi2, skin: data.skin });
  // Some atlas cells contain a few pixels of the next row. Those must not extend
  // the trousers' bounds or masquerade as an ankle attachment.
  const sourcePixels=legSource.getContext('2d')!.getImageData(0,0,legSource.width,legSource.height).data;
  let runStart=0,runMass=0,bestMass=0,legTop=0,legBottom=legSource.height;
  for(let y=0;y<=legSource.height;y++){
    let mass=0;
    if(y<legSource.height)for(let x=0;x<legSource.width;x++)if(sourcePixels[(y*legSource.width+x)*4+3]>128)mass++;
    if(mass>legSource.width*.04){if(!runMass)runStart=y;runMass+=mass;}
    else {if(runMass>bestMass){bestMass=runMass;legTop=runStart;legBottom=y;}runMass=0;}
  }
  const legs=document.createElement('canvas');legs.width=legSource.width;legs.height=legBottom-legTop;
  legs.getContext('2d')!.drawImage(legSource,0,legTop,legs.width,legs.height,0,0,legs.width,legs.height);
  const feet = tint(scene, 'feet-' + (data.part_feet || 'goku'), { primary: data.color_feet_1 ?? data.gi2, secondary: data.color_feet_2 ?? data.gi1, skin: data.skin });
  const boots = footwearParts(feet);
  const giTrousers=(data.part_legs || 'goku')==='goku';
  // Source landmarks exclude the trousers' duplicate belt and the bare skin
  // below their cuffs. Both are hidden when the gi is worn with boots.
  const trouserTop=torsoId!=='goku'?0:giTrousers?GI_SEAM.trouserBeltBottom:
    data.part_legs==='vegeta'?GI_SEAM.spandexBeltBottom:0;
  let trouserBottom=legs.height;
  if(data.part_legs!=='luffy') {
    // Inspect the untinted source: orange fabric must not be mistaken for skin.
    const sourceKey=prefix+'legs-'+(data.part_legs || 'goku');
    const original=scene.textures.get(scene.textures.exists(sourceKey)?sourceKey:prefix+'legs-goku').getSourceImage() as HTMLImageElement;
    const mask=document.createElement('canvas');mask.width=original.width;mask.height=original.height;
    const maskContext=mask.getContext('2d')!;maskContext.drawImage(original,0,0);
    const pixels=maskContext.getImageData(0,0,mask.width,mask.height).data;
    trouserBottom=trouserClothBottom(pixels,legs.width,legTop,legs.height);
  }
  const hipY=torsoId==='goku'?GI_SEAM.worldY-1:93, legLength=126-hipY;
  const legPixels=legs.getContext('2d')!.getImageData(0,0,legs.width,legs.height).data;
  const ankles=[0,1].map(side=>{
    // Each calf may end on a different source row. Measuring at the pair's
    // lowest row would attach the shorter calf to transparent padding.
    let bottom=trouserBottom;
    for(let y=trouserBottom-1;y>=Math.floor(legs.height*.6);y--) {
      let opaque=0;
      for(let x=Math.floor(side*legs.width/2);x<Math.floor((side+1)*legs.width/2);x++)if(legPixels[(y*legs.width+x)*4+3]>128)opaque++;
      if(opaque>2){bottom=y+1;break;}
    }
    let leftSum=0,rightSum=0,count=0;
    for(let y=bottom-6;y<bottom;y++){
      let left=legs.width,right=-1;
      for(let x=Math.floor(side*legs.width/2);x<Math.floor((side+1)*legs.width/2);x++){
        if(legPixels[(y*legs.width+x)*4+3]>128){left=Math.min(left,x);right=Math.max(right,x);}
      }
      if(right>=left){leftSum+=left-side*legs.width/2;rightSum+=right-side*legs.width/2+1;count++;}
    }
    const left=count?leftSum/count:legs.width*.2,right=count?rightSum/count:legs.width*.3;
    return {centre:(left+right)/legs.width,width:(right-left)/(legs.width/2),bottom};
  });
  const accessoryId = data.part_accessory || 'none';
  const accessory = accessoryId === 'none' ? null : tint(scene, 'accessory-' + accessoryId,
    accessoryId === 'cape' || accessoryId === 'scarf' ? { primary: data.color_acc_1 ?? data.gi2 } :
    accessoryId === 'headband' ? { secondary: data.color_acc_1 ?? data.gi2 } : {});
  const sheath = accessoryId === 'sword' ? tint(scene, 'accessory-sword_sheathed', {}) : null;
  const tailsId = accessoryId === 'scarf' || accessoryId === 'headband' ? accessoryId : null;
  const tails = tailsId ? tint(scene, 'accessory-' + tailsId + '_tails',
    tailsId === 'scarf' ? { primary: data.color_acc_1 ?? data.gi2 } : { secondary: data.color_acc_1 ?? data.gi2 }) : null;
  // A ring (headband, scarf collar) is split: its far half sits behind the head
  // or neck, its near half and knot in front.
  // Generated garments have different neck positions. Measure their attachment
  // instead of centering a head on the outer shoulder/arm bounds.
  const torsoPixels=torso.getContext('2d')!.getImageData(0,0,torso.width,torso.height).data;
  let neckSum=0,neckWeight=0;
  for(let y=Math.floor(torso.height*.035);y<torso.height*.065;y++) {
    let left=torso.width,right=-1;
    for(let x=0;x<torso.width;x++)if(torsoPixels[(y*torso.width+x)*4+3]>180){left=Math.min(left,x);right=Math.max(right,x);}
    if(right>=left){neckSum+=(left+right)/2;neckWeight++;}
  }
  const neckX=79+(neckWeight?neckSum/neckWeight:torso.width/2)/torso.width*36;
  const portrait = buildCustomPortrait(data,texture,(name,palette)=>tint(scene,name,palette),resolution,neckX);
  const draw = (img: HTMLCanvasElement, x: number, y: number, w: number, h: number) => ctx.drawImage(img, Math.round(x), Math.round(y), w, h);
  // Posable arms cut along the armpit (null: keep the rectangular fallback).
  const rig = (() => {
    const data = torso.getContext('2d')!.getImageData(0, 0, torso.width, torso.height);
    const split = splitArms(data.data, torso.width, torso.height);
    if (!split) return null;
    const layer = (mask: number) => {
      const c = document.createElement('canvas'); c.width = torso.width; c.height = torso.height;
      const out = new ImageData(torso.width, torso.height);
      for (let i = 0; i < split.owner.length; i++) if (split.owner[i] & mask) for (let k = 0; k < 4; k++) out.data[i * 4 + k] = data.data[i * 4 + k];
      c.getContext('2d')!.putImageData(out, 0, 0); return c;
    };
    return { ...split, body: layer(BODY), arms: [layer(BACK_ARM), layer(FRONT_ARM)] };
  })();
  // The top's hem (its body, not the sleeves), in frame units as the relaxed torso is drawn.
  const hem = (() => {
    const pixels = torso.getContext('2d')!.getImageData(0, 0, torso.width, torso.height).data;
    const inBody = (i: number) => pixels[i * 4 + 3] > 100 && (!rig || (rig.owner[i] & BODY && !(rig.owner[i] & (BACK_ARM | FRONT_ARM))));
    let bottom = -1;
    for (let y = torso.height - 1; y >= 0 && bottom < 0; y--) for (let x = 0; x < torso.width; x++) if (inBody(y * torso.width + x)) { bottom = y; break; }
    let left = torso.width, right = -1;
    for (let y = Math.max(0, bottom - Math.round(torso.height * .1)); y <= bottom; y++)
      for (let x = 0; x < torso.width; x++) if (inBody(y * torso.width + x)) { left = Math.min(left, x); right = Math.max(right, x); }
    if (right < left) return null;
    const k = 36 / torso.width;
    return { left: 79 + left * k, right: 79 + (right + 1) * k, y: 66 + (bottom + 1) * 36 / torso.height };
  })();
  for (let f = 0; f < CUSTOM_FRAME.count; f++) {
    ctx.save(); ctx.translate(f % 4 * 192, Math.floor(f / 4) * 128);
    const walk = f >= 4 && f <= 7;
    const dash = f >= CUSTOM_DASH_FRAMES[0];
    const phase = walk ? [0,1,0,-1][f-4] : dash ? [1,-1,1][f-CUSTOM_DASH_FRAMES[0]] : 0;
    const punch = f === 8, kick = f === 9, defend = f === 10, charge = f === 11;
    const genki=f===12;
    // Idle breathes: chest and head rise together, the feet stay planted.
    const breath = f < 4 ? [0,.5,1,.5][f] : 0;
    const legBob = walk ? Math.abs(phase) : 0;
    const bob = legBob + breath;
    const headBob = f < 4 ? breath : bob;
    const lean = punch ? 3 : kick ? -2 : defend ? -2 : dash ? 4 : 0;
    // The dash leans the whole body forward over the feet.
    if (dash) { ctx.translate(97, 126); ctx.rotate(.12); ctx.translate(-97, -126); }
    const state = tailState(f);
    if (accessory && accessoryId === 'cape') {
      // Anchor the cape at the shoulders, keep its painted ratio and let the hem
      // sway with each pose instead of stretching it into a skirt over the legs.
      const width = 44;
      const height = width * accessory.height / accessory.width;
      const capeSwing = dash ? 0.3 : walk ? phase * 0.10 : punch ? -0.08 : kick ? 0.10 : defend ? -0.12 : charge ? 0.14 : genki ? 0.08 : 0;
      ctx.save();
      ctx.translate(97 + lean, 68 + bob);
      ctx.rotate(capeSwing);
      ctx.drawImage(accessory, -width / 2, 0, width, height);
      ctx.restore();
    }
    // Scarf: the tails hang from the collar's knot behind the body, then the
    // collar's far half, the neck and torso, and the near half over the neck.
    const collar = scarfCollarRect(neckX).map((v, i) => v + (i === 0 ? lean : i === 1 ? bob : 0));
    const drawScarfBack=()=>{
      if(!accessory || accessoryId!=='scarf')return;
      drawTails(ctx, tails, 'scarf', state, collar[0] + collar[2] * RING.scarf.knot[0], collar[1] + collar[3] * RING.scarf.knot[1], SCARF_TAIL_SWING[state]);
      drawRing(ctx, accessory, collar, RING.scarf, 'back');
    };
    const drawScarf=()=>{
      if(accessory && accessoryId==='scarf') drawRing(ctx, accessory, collar, RING.scarf, 'front');
    };
    // Headband: portrait coordinates, moved exactly like the portrait itself.
    const drawHead=()=>{
      const band = accessory && accessoryId === 'headband' ? headbandRect(data.part_head || 'goku') : null;
      const toPortrait = () => ctx.translate(lean - .75 + neckX - 98, headBob + 2);
      if (band) { ctx.save(); toPortrait(); drawRing(ctx, accessory!, band, RING.headband, 'back'); ctx.restore(); }
      draw(portrait,lean,headBob,192,128);
      if (band) {
        ctx.save(); toPortrait();
        drawRing(ctx, accessory!, band, RING.headband, 'front');
        drawTails(ctx, tails, 'headband', state, band[0] + band[2] * RING.headband.knot[0], band[1] + band[3] * RING.headband.knot[1]);
        ctx.restore();
      }
    };
    // Katana: sheathed at the hip; drawn only to strike and to guard. The scabbard
    // is worn behind the body, the hilt rests forward over the belt.
    const swordDrawn = punch || defend;
    const drawSheath=(part:'scabbard'|'hilt')=>{
      if(!sheath || genki || (part==='hilt' && swordDrawn))return;
      const w=46,h=w*sheath.height/sheath.width,gx=w*SHEATH_GUARD;
      ctx.save();ctx.translate(101+lean,93+bob);ctx.rotate(-.4);
      ctx.beginPath();
      if(part==='scabbard')ctx.rect(-gx-1,-h,gx+1,h*2);else ctx.rect(-1.5,-h,w-gx+2,h*2);
      ctx.clip();ctx.drawImage(sheath,-gx,-h/2,w,h);ctx.restore();
    };
    const drawSword=(fist:readonly [number,number],angle:number)=>{
      if(!accessory || accessoryId!=='sword' || !swordDrawn)return;
      const swordWidth=43;
      const swordHeight=swordWidth*accessory.height/accessory.width;
      // Anchor the image at the part of the handle the palm actually covers.
      const gripX=swordWidth*(70/accessory.width),gripY=swordHeight*.5;
      ctx.save();ctx.translate(fist[0],fist[1]);ctx.rotate(angle);
      ctx.drawImage(accessory,-gripX,-gripY,swordWidth,swordHeight);
      ctx.restore();
    };
    drawSheath('scabbard');
    // Trousers wider than the top's hem would stick out under it: taper their top into
    // the hem, widening to full width just below it (not for the raised kick leg).
    const taper = hem && !kick && !genki;
    if (taper) {
      const l = hem.left + lean - .5, r = hem.right + lean + .5, y = hem.y + bob, full = y + 7;
      ctx.save(); ctx.beginPath();
      ctx.moveTo(l, 0); ctx.lineTo(r, 0); ctx.lineTo(r, y); ctx.lineTo(r + 6, full); ctx.lineTo(192, full); ctx.lineTo(192, 128);
      ctx.lineTo(0, 128); ctx.lineTo(0, full); ctx.lineTo(l - 6, full); ctx.lineTo(l, y); ctx.closePath(); ctx.clip();
    }
    // Legs and footwear share hip pivots, so walking and kicking cannot leave detached boots.
    for (let side = 0; side < 2; side++) {
      ctx.save();
      const pivotX = side === 0 ? 91 : 102;
      const waistShift=torsoId==='goku'?1.5:0;
      ctx.translate(pivotX+waistShift+lean, hipY+legBob);
      ctx.rotate(side === 1 && kick ? -1.2 : phase * (dash ? .42 : .3) * (side ? -1 : 1));
      const sx = side * legs.width / 2;
      // Keep the full trouser width, but tuck its hem inside the boot shaft.
      const legW=giTrousers&&torsoId==='goku'?18:17,legX=97+(side-1)*legW;
      const boot=boots[side];
      // Fit the shaft with ONE scale. Independent width/height scaling made
      // the ninja sandals' side-view foot look flattened and oversized.
      const {width:bootW,height:bootH}=fittedFootwear(boot.w,boot.h,boot.shaftWidth,ankles[side].width*legW,legLength);
      const bootTop=legLength-bootH,legH=bootTop+2;
      const ankleX=legX+ankles[side].centre*legW;
      ctx.drawImage(feet,boot.x,boot.y,boot.w,boot.h,ankleX-pivotX-boot.ankle/boot.w*bootW,bootTop,bootW,bootH);
      // The cuff covers the open boot rim, just as fabric enters a real boot.
      ctx.drawImage(legs, sx, trouserTop, legs.width / 2, ankles[side].bottom-trouserTop, legX - pivotX, 0, legW, legH);
      ctx.restore();
    }
    if (taper) ctx.restore();
    drawScarfBack();
    // One continuous neck behind both layers, including their antialiased edges.
    // Idle uses the same pose for head and torso; moving just the torso opens the seam.
    const neckColor=rgb(data.skin).map(c=>Math.round(c*.88));
    ctx.fillStyle='rgb('+neckColor.join(',')+')';
    ctx.fillRect(neckX-2.5+lean,64+bob,5,10);
    // Independently articulated arms preserve actual punch, guard and charge silhouettes.
    const tw = torso.width, th = torso.height;
    if(genki) {
      // A continuous drawing keeps the shoulders, chest, sleeves and hands
      // joined. Rotating cropped arms left old shoulder caps and open seams.
      const rect=genkiTorsoRect(data.part_torso || 'goku',neckX);
      const sourceBottom=torsoId==='goku'?GI_SEAM.raisedBeltBottom:raisedTorso.height;
      ctx.drawImage(raisedTorso,0,0,raisedTorso.width,sourceBottom,
        rect.x+lean,rect.y+bob,rect.width,rect.height*sourceBottom/raisedTorso.height);
      drawHead();
      drawScarf();
    } else if(!punch && !defend && !charge && !walk && !dash) {
      // Keep shoulders, arms and belt joined in relaxed poses; preserve source proportions.
      draw(torso,79+lean,66+bob,36,36);
      drawSheath('hilt');
      drawHead();
      drawScarf();
    } else {
    // Two-segment arms (shoulder and elbow). Angles turn each segment from its
    // painted rest pose: 0 hangs down, negative swings forward.
    // [front upper, front forearm, back upper, back forearm]
    const arms = punch ? [-1.5,-1.58,.35,-1.0] : defend ? [-.9,-2.75,-1.25,-2.85]
      : charge ? [-.25,-.1,.25,.1] : dash ? [.45,.75,.6,.9]
      : [-.35*phase,-.35*phase-.25,.35*phase,.35*phase-.25];
    let fist:readonly [number,number]=[0,0];
    if (rig) {
      const kx=36/tw, ky=36/th, ox=79+lean, oy=66+bob;
      const at=(p:readonly number[])=>[ox+p[0]*kx, oy+p[1]*ky] as const;
      const turn=(p:readonly number[],c:readonly number[],a:number)=>[c[0]+(p[0]-c[0])*Math.cos(a)-(p[1]-c[1])*Math.sin(a), c[1]+(p[0]-c[0])*Math.sin(a)+(p[1]-c[1])*Math.cos(a)] as const;
      // Each arm is cut across itself at the elbow (not along a pixel row, whose
      // slanted ends turn into flaps once rotated), and the joint is rounded off.
      const elbowRadius=[0,1].map(side=>{
        const row=rig.elbowRow[side];let n=0;
        for(let x=0;x<tw;x++)if(rig.owner[row*tw+x]&(side?FRONT_ARM:BACK_ARM))n++;
        return Math.max(1.5,n*kx/2);
      });
      const halfPlane=(c:readonly number[],n:readonly number[],sign:number)=>{
        // The side of the line through c (normal n) that sign points to.
        const t=[-n[1],n[0]],far=200;
        ctx.beginPath();
        ctx.moveTo(c[0]+t[0]*far,c[1]+t[1]*far);ctx.lineTo(c[0]-t[0]*far,c[1]-t[1]*far);
        ctx.lineTo(c[0]-t[0]*far+n[0]*sign*far,c[1]-t[1]*far+n[1]*sign*far);
        ctx.lineTo(c[0]+t[0]*far+n[0]*sign*far,c[1]+t[1]*far+n[1]*sign*far);ctx.closePath();ctx.clip();
      };
      const drawArm=(side:number)=>{
        if(!rig.posable[side])return;
        const upper=arms[side?0:2], fore=arms[side?1:3], img=rig.arms[side];
        const S=at(rig.shoulder[side]), E0=at(rig.elbow[side]), H0=at(rig.hand[side]), E1=turn(E0,S,upper);
        const unit=(a:readonly number[],b:readonly number[])=>{const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return [(b[0]-a[0])/d,(b[1]-a[1])/d];};
        const u=unit(S,E0),v=unit(E0,H0),n=unit([0,0],[u[0]+v[0],u[1]+v[1]]),overlap=.6;
        const atElbow=(e:number)=>[E0[0]+n[0]*e,E0[1]+n[1]*e];
        // Upper arm, turned about the shoulder.
        ctx.save();ctx.translate(S[0],S[1]);ctx.rotate(upper);ctx.translate(-S[0],-S[1]);
        halfPlane(atElbow(overlap),n,-1);ctx.drawImage(img,ox,oy,36,36);ctx.restore();
        // A round elbow covers the wedge a bend opens on its outer side.
        ctx.save();ctx.translate(E1[0],E1[1]);ctx.rotate((upper+fore)/2);ctx.translate(-E0[0],-E0[1]);
        ctx.beginPath();ctx.arc(E0[0],E0[1],elbowRadius[side],0,Math.PI*2);ctx.clip();
        ctx.drawImage(img,ox,oy,36,36);ctx.restore();
        // Forearm, turned about the moved elbow; in front, as a raised guard folds it over the upper arm.
        ctx.save();ctx.translate(E1[0],E1[1]);ctx.rotate(fore);ctx.translate(-E0[0],-E0[1]);
        halfPlane(atElbow(-overlap),n,1);ctx.drawImage(img,ox,oy,36,36);ctx.restore();
        if(side){const H=turn(H0,E0,fore);fist=[H[0]+E1[0]-E0[0],H[1]+E1[1]-E0[1]];}
      };
      // The back arm passes behind the body unless it is raised to strike or guard.
      const backInFront = punch || defend;
      if(!backInFront)drawArm(0);
      draw(rig.body,ox,oy,36,36);
      drawSheath('hilt');
      drawHead();
      drawScarf();
      if(backInFront)drawArm(0);
      drawArm(1);
    } else {
    // Fallback for torsos whose arms cannot be separated: rectangular arm crops.
    ctx.drawImage(torso, 0, 0, tw, th*.30, 79+lean,66+bob,36,11);
    ctx.drawImage(torso, tw*.25, th*.30, tw*.5, th*.70, 88+lean,77+bob,18,25);
    drawSheath('hilt');
    drawHead();
    drawScarf();
    const ELBOW=13, ARM_W=9, ARM_H=27;
    for (const side of [0,1]) {
      const upper=arms[side?0:2], fore=arms[side?1:3];
      const sx=(side ? 106 : 87)+lean, sy=76+bob, left=side?0:-ARM_W, cx=left+ARM_W/2;
      const ex=sx+Math.cos(upper)*cx-Math.sin(upper)*ELBOW, ey=sy+Math.sin(upper)*cx+Math.cos(upper)*ELBOW;
      const segment=(x:number,y:number,angle:number,pivotX:number,from:number,to:number)=>{
        ctx.save();ctx.translate(x,y);ctx.rotate(angle);
        ctx.beginPath();ctx.rect(left-pivotX-1,from?-1.5:-1,ARM_W+2,to-from+1.5);ctx.clip();
        ctx.drawImage(torso, side ? tw*.75 : 0, th*.25, tw*.25, th*.75, left-pivotX, -1-from, ARM_W, ARM_H);
        ctx.restore();
      };
      segment(sx,sy,upper,0,0,ELBOW+1.5);
      segment(ex,ey,fore,cx,ELBOW-1.5,ARM_H);
      if(side){const r=ARM_H-ELBOW-3;fist=[ex-Math.sin(fore)*r,ey+Math.cos(fore)*r];}
    }
    }
    // A thrust follows the forearm; the guard raises the blade beside the head.
    drawSword(fist, punch ? arms[1]+Math.PI/2 : -1.75);
    }
    ctx.restore();
  }
  isolateFrames(canvas, resolution);
  if(scene.textures.exists(texture))scene.textures.remove(texture);
  const result = scene.textures.addCanvas(texture, canvas);
  if (result) Object.assign(result,{customWardrobeArt:true,customArtResolution:resolution});
}
