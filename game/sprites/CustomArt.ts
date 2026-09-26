/// <reference types="vite/client" />
import type Phaser from 'phaser';
import type { CharacterData } from '../types';
import { buildCustomPortrait } from './CustomPortrait';
import { CUSTOM_FRAME } from './CustomArtLayout';

const urls = import.meta.glob<string>('../assets/custom/*.png', { eager: true, query: '?url', import: 'default' });
const prefix = 'wardrobe:';
export function preloadCustomArt(scene: Phaser.Scene) {
  for (const [path, url] of Object.entries(urls)) {
    const key = prefix + path.split('/').pop()!.replace('.png', '');
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
    return {x:x0,y:y0,w:Math.max(1,x1-x0+1),h:Math.max(1,y1-y0+1)};
  });
}

/** The source's white, cyan and peach are independent material masks. */
function tint(scene: Phaser.Scene, name: string, palette: Palette): HTMLCanvasElement {
  if (!scene.textures.exists(prefix + name)) {
    const category = name.split('-')[0];
    name = category === 'accessory' ? 'accessory-scarf' : category + '-goku';
  }
  let cache = caches.get(scene.textures);
  if (!cache) { cache = new Map(); caches.set(scene.textures, cache); }
  const key = name + JSON.stringify(palette);
  const previous = cache.get(key);
  if (previous) return previous;
  const source = scene.textures.get(prefix + name).getSourceImage() as HTMLImageElement;
  const canvas = document.createElement('canvas');
  canvas.width = source.width; canvas.height = source.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    if (!pixels.data[i + 3]) continue;
    const r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2];
    let color: number | undefined, light = 1;
    if (g > r * 1.28 && b > r * 1.28 && g > 55) {
      color = palette.secondary; light = Math.max(g, b) / 205;
    } else if (r > g * 1.06 && g > b * 1.06 && r > 110 && g > 65 && b > 45) {
      color = palette.skin; light = r / 245;
    } else if (Math.max(r,g,b) - Math.min(r,g,b) < 65 && Math.max(r,g,b) > 65) {
      const portrait = name.startsWith('portrait-');
      const py=Math.floor(i/4/canvas.width),px=i/4%canvas.width;
      const lowerRow=['portrait-sasuke','portrait-luffy','portrait-saitama'].includes(name);
      const hairRegion=name!=='portrait-saitama' && (py < canvas.height*(lowerRow ? .50 : .58) || px < canvas.width*.35);
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

/** Compose the same 12-frame / 192×128 contract used by the combat animation registry. */
export function composeCustomArt(scene: Phaser.Scene, texture: string, data: NonNullable<CharacterData['customData']>) {
  const resolution = scene.sys.game.renderer.type === 2 ? 3 : 1;
  const canvas = document.createElement('canvas');
  canvas.width = CUSTOM_FRAME.width * CUSTOM_FRAME.columns * resolution;
  canvas.height = CUSTOM_FRAME.height * 3 * resolution;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(resolution,resolution);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const torso = tint(scene, 'torso-' + (data.part_torso || 'goku'), { primary: data.color_torso_1 ?? data.gi1, secondary: data.color_torso_2 ?? data.gi2, skin: data.skin });
  const legs = tint(scene, 'legs-' + (data.part_legs || 'goku'), { primary: data.color_legs_1 ?? data.gi1, secondary: data.color_legs_2 ?? data.gi2, skin: data.skin });
  const feet = tint(scene, 'feet-' + (data.part_feet || 'goku'), { primary: data.color_feet_1 ?? data.gi2, secondary: data.color_feet_2 ?? data.gi1, skin: data.skin });
  const boots = footwearParts(feet);
  const accessoryId = data.part_accessory || 'none';
  const accessory = accessoryId === 'none' ? null : tint(scene, 'accessory-' + accessoryId,
    accessoryId === 'cape' || accessoryId === 'scarf' ? { primary: data.color_acc_1 ?? data.gi2 } :
    accessoryId === 'headband' ? { secondary: data.color_acc_1 ?? data.gi2 } : {});
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
  for (let f = 0; f < 12; f++) {
    ctx.save(); ctx.translate(f % 4 * 192, Math.floor(f / 4) * 128);
    const walk = f >= 4 && f <= 7;
    const phase = walk ? [0,1,0,-1][f-4] : 0;
    const punch = f === 8, kick = f === 9, defend = f === 10, charge = f === 11;
    const bob = walk ? Math.abs(phase) : f === 1 || f === 3 ? 1 : 0;
    const headBob = f < 4 ? 0 : bob;
    const lean = punch ? 3 : kick ? -2 : defend ? -2 : 0;
    if (accessory && accessoryId === 'cape') draw(accessory, 74 - phase, 70 + bob, 43 + Math.abs(phase)*2, 53);
    if (accessory && accessoryId === 'scarf') draw(accessory, 70 - phase, 70 + bob, 30, 26);
    // Legs and footwear share hip pivots, so walking and kicking cannot leave detached boots.
    for (let side = 0; side < 2; side++) {
      ctx.save();
      const pivotX = side === 0 ? 91 : 102;
      ctx.translate(pivotX, 89);
      ctx.rotate(side === 1 && kick ? -1.2 : phase * (side ? -0.14 : 0.14));
      const sx = side * legs.width / 2;
      ctx.drawImage(legs, sx, 0, legs.width / 2, legs.height, 81 + side*16 - pivotX, 0, 16, 34);
      const boot=boots[side];
      const bootH=(data.part_feet==='luffy'||data.part_feet==='jotaro')?7:14;
      const bootW=Math.round(boot.w/boot.h*bootH);
      const ankleX=side?110:85;
      ctx.drawImage(feet,boot.x,boot.y,boot.w,boot.h,ankleX-pivotX-(side?4:bootW/2),37-bootH,bootW,bootH);
      ctx.restore();
    }
    // Independently articulated arms preserve actual punch, guard and charge silhouettes.
    const tw = torso.width, th = torso.height;
    if(!punch && !kick && !defend && !charge) {
      // Keep shoulders, arms and belt joined in relaxed poses; preserve source proportions.
      draw(torso,79+lean,66+bob,36,36);
    } else {
    // Keep the neck/collar and shoulder bridge intact while the lower arms rotate.
    ctx.drawImage(torso, 0, 0, tw, th*.30, 79+lean,66+bob,36,11);
    ctx.drawImage(torso, tw*.25, th*.30, tw*.5, th*.70, 88+lean,77+bob,18,25);
    for (let side=0;side<2;side++) {
      const x = side ? 106 : 87;
      ctx.save(); ctx.translate(x + lean, 76 + bob);
      ctx.rotate(charge ? (side ? -2.7 : 2.7) : defend ? (side ? 2.5 : -2.5) : punch && side ? -1.55 : phase*(side ? 0.1 : -0.1));
      ctx.drawImage(torso, side ? tw*.75 : 0, th*.25, tw*.25, th*.75, side ? 0 : -9, -1, 9, 27);
      ctx.restore();
    }
    }
    draw(portrait,lean,headBob,192,128);
    if (accessory) {
      if (accessoryId === 'sword') {
        // Follow the same right-arm pivot and rotation as the hand.
        const armAngle=charge?-2.7:defend?2.5:punch?-1.55:0;
        const handX=106+lean+Math.cos(armAngle)*4-Math.sin(armAngle)*24;
        const handY=76+bob+Math.sin(armAngle)*4+Math.cos(armAngle)*24;
        ctx.save(); ctx.translate(handX,handY);
        ctx.rotate(charge ? -1.1 : defend ? -0.9 : 0);
        draw(accessory, -8, -3, 43, 9); ctx.restore();
      }
    }
    ctx.restore();
  }
  scene.textures.remove(texture);
  const result = scene.textures.addCanvas(texture, canvas);
  if (result) Object.assign(result,{customWardrobeArt:true,customArtResolution:resolution});
}
