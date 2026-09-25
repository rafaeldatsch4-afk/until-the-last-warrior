/// <reference types="vite/client" />
import type Phaser from 'phaser';
import type { CharacterData } from '../types';
import { stabilizeIdlePortrait } from './CustomIdlePortrait';

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

/** Complete matching outfits already have coherent, reviewed combat artwork.
 * Keep that anatomy intact instead of reassembling five independently drawn sources. */
function composeMatchingOutfit(scene: Phaser.Scene, texture: string, data: NonNullable<CharacterData['customData']>) {
  const id=data.part_torso||'goku';
  if((data.part_head||'goku')!==id || (data.part_legs||'goku')!==id || (data.part_feet||'goku')!==id || (data.part_accessory&&data.part_accessory!=='none'))return false;
  const suffix=texture.endsWith('_ui')?'_ui':texture.endsWith('_ssj')?'_ssj':'';
  const sourceKey=scene.textures.exists(id+suffix)?id+suffix:id;
  if(!scene.textures.exists(sourceKey))return false;
  const original=scene.textures.get(sourceKey);
  if(original.source[0].isCanvas || original.source[0].isRenderTexture)return false;
  const source=original.getSourceImage() as HTMLImageElement;
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const ctx=canvas.getContext('2d')!;ctx.drawImage(source,0,0);
  const image=ctx.getImageData(0,0,canvas.width,canvas.height);
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
    const i=(y*canvas.width+x)*4;if(!image.data[i+3])continue;
    const r=image.data[i],g=image.data[i+1],b=image.data[i+2];
    const primary=y>114?(data.color_feet_1??data.gi2):y>92?(data.color_legs_1??data.gi1):(data.color_torso_1??data.gi1);
    const secondary=y>114?(data.color_feet_2??data.gi1):y>92?(data.color_legs_2??data.gi2):(data.color_torso_2??data.gi2);
    let target:number|undefined, shade=1;
    if(y<76 && Math.max(r,g,b)<70 && Math.max(r,g,b)>18){target=suffix==='_ui'?0xe0e0e0:suffix?0xffea00:data.hair;shade=.55+Math.max(r,g,b)/120;}
    else if(r>g*1.1&&g>b*1.1&&b>60){target=data.skin;shade=r/245;}
    else if(b>r*1.3&&b>g*1.15){target=secondary;shade=b/170;}
    else if((r>g*1.4&&g>b*1.3)||(r>145&&g>110&&b<70)){target=primary;shade=Math.max(r,g)/245;}
    else if(y>78&&Math.min(r,g,b)>80&&Math.max(r,g,b)-Math.min(r,g,b)<45){target=primary;shade=(r+g+b)/690;}
    if(target!==undefined){const channels=rgb(target);for(let k=0;k<3;k++)image.data[i+k]=Math.min(255,channels[k]*Math.min(shade,1)+Math.max(0,shade-1)*100);}
  }
  stabilizeIdlePortrait(image.data,canvas.width);
  ctx.putImageData(image,0,0);scene.textures.remove(texture);
  const result=scene.textures.addCanvas(texture,canvas);
  if(result)(result as Phaser.Textures.Texture & {customRosterKey?:string}).customRosterKey=sourceKey;
  return true;
}

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
      color = palette.primary; light = (r + g + b) / (3 * 230);
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
  if(composeMatchingOutfit(scene,texture,data))return;
  const headSource = scene.textures.get(texture).getSourceImage() as HTMLCanvasElement;
  const canvas = document.createElement('canvas'); canvas.width = 192 * 12; canvas.height = 128;
  const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = false;
  const torso = tint(scene, 'torso-' + (data.part_torso || 'goku'), { primary: data.color_torso_1 ?? data.gi1, secondary: data.color_torso_2 ?? data.gi2, skin: data.skin });
  const legs = tint(scene, 'legs-' + (data.part_legs || 'goku'), { primary: data.color_legs_1 ?? data.gi1, secondary: data.color_legs_2 ?? data.gi2, skin: data.skin });
  const feet = tint(scene, 'feet-' + (data.part_feet || 'goku'), { primary: data.color_feet_1 ?? data.gi2, secondary: data.color_feet_2 ?? data.gi1, skin: data.skin });
  const boots = footwearParts(feet);
  const accessoryId = data.part_accessory || 'none';
  const accessory = accessoryId === 'none' ? null : tint(scene, 'accessory-' + accessoryId,
    accessoryId === 'cape' || accessoryId === 'scarf' ? { primary: data.color_acc_1 ?? data.gi2 } :
    accessoryId === 'headband' ? { secondary: data.color_acc_1 ?? data.gi2 } : {});
  // Reuse detailed portraits, crop transparent margins, and anchor the neck once.
  const headId=data.part_head||'goku';
  const hair=texture.endsWith('_ui')?0xe0e0e0:texture.endsWith('_ssj')?0xffea00:data.hair;
  const headCanvas = document.createElement('canvas');
  headCanvas.width = 192; headCanvas.height = 128;
  const hc = headCanvas.getContext('2d')!;
  hc.imageSmoothingEnabled=false;
  if(scene.textures.exists(prefix+'head-'+headId)) {
    const portrait=tint(scene,'head-'+headId,{primary:['goku','vegeta'].includes(headId)?hair:data.color_head_1??data.gi1,secondary:data.color_head_2??data.gi2,skin:data.skin});
    hc.drawImage(portrait,0,0);
  } else if(headId==='saitama') {
    hc.drawImage(tint(scene,'base-head',{skin:data.skin,primary:data.skin}),0,0);
   } else if((headId==='naruto'||headId==='sasuke') && scene.textures.exists(headId==='sasuke'?'itachi':'naruto')) {
    const sourceKey=headId==='sasuke'?'itachi':'naruto';
    const crop=headId==='sasuke'?[88,63,22,20]:[82,63,27,19];
    hc.drawImage(scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement,...crop as [number,number,number,number],0,0,crop[2],crop[3]);
    const portrait=hc.getImageData(0,0,192,128);
    for(let i=0;i<portrait.data.length;i+=4){
      const r=portrait.data[i],g=portrait.data[i+1],b=portrait.data[i+2];
      const target=(headId==='sasuke'&&Math.max(r,g,b)<90&&Math.max(r,g,b)>20)||(r>150&&g>120&&b<90)?hair:r>g*1.08&&g>b*1.1&&b>65?data.skin:undefined;
      if(target!==undefined){const c=rgb(target);for(let k=0;k<3;k++)portrait.data[i+k]=c[k]*r/255;}
    }
    hc.putImageData(portrait,0,0);
  } else if(headId==='spiderman') {
    // Rounded mask silhouette, retaining the existing eye and fabric artwork.
    hc.save();hc.beginPath();hc.ellipse(96,70,17,20,0,0,Math.PI*2);hc.clip();
    hc.drawImage(headSource,0,0);hc.restore();
  } else {
    // Keep existing hairstyles but give them the generated anatomical face.
    const face=tint(scene,'base-head',{skin:data.skin,primary:data.skin});
    hc.drawImage(face,87,65,22,27);
    hc.drawImage(headSource,0,0,192,70,34,22,125,46);
  }
  const pixels = hc.getImageData(0, 0, 192, 128).data;
  let left=192, top=128, right=0, bottom=0;
  for(let y=0;y<128;y++)for(let x=0;x<192;x++)if(pixels[(y*192+x)*4+3]>32){
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  const headWidth = Math.max(1,right-left+1), headHeight = Math.max(1,bottom-top+1);
  const headScale = Math.min(21/headWidth, (headId==='saitama'?18:24)/headHeight);
  const portraitW = Math.round(headWidth*headScale), portraitH = Math.round(headHeight*headScale);
  const draw = (img: HTMLCanvasElement, x: number, y: number, w: number, h: number) => ctx.drawImage(img, Math.round(x), Math.round(y), w, h);
  for (let f = 0; f < 12; f++) {
    ctx.save(); ctx.translate(f * 192, 0);
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
    // The portrait includes its neck, overlapping the torso socket.
    ctx.drawImage(headCanvas,left,top,headWidth,headHeight,
      Math.round(97+lean-portraitW/2),72+headBob-portraitH,portraitW,portraitH);
    if (accessory) {
      if (accessoryId === 'straw_hat') draw(accessory, 83 + lean, 48 + headBob, 29, 16);
      if (accessoryId === 'headband') draw(accessory, 85 + lean, 59 + headBob, 22, 8);
      if (accessoryId === 'scouter') draw(accessory, 99 + lean, 61 + headBob, 10, 6);
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
  if (result) (result as Phaser.Textures.Texture & { customWardrobeArt?: boolean }).customWardrobeArt = true;
}
