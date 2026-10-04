/// <reference types="vite/client" />
import type Phaser from 'phaser';
import type { CharacterData } from '../types';
import { buildCustomPortrait } from './CustomPortrait';
import { CUSTOM_FRAME } from './CustomArtLayout';
import { genkiTorsoRect } from './GenkiTorsoLayout';
import { GI_SEAM, trouserClothBottom, fittedFootwear } from './CustomSeams';

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
    const px=i/4%canvas.width,py=Math.floor(i/4/canvas.width);
    let color: number | undefined, light = 1;
    if(name==='portrait-chapolim' && r>g*1.8 && r>b*1.8) {
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
      const hairRegion=!['portrait-saitama','portrait-jotaro','portrait-chapolim'].includes(name) && (py < canvas.height*(lowerRow ? .50 : .58) || px < canvas.width*.35);
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

/** Preserve the original 12 poses; the extra frame is reserved for Genki Dama. */
export function composeCustomArt(scene: Phaser.Scene, texture: string, data: NonNullable<CharacterData['customData']>) {
  const resolution = scene.sys.game.renderer.type === 2 ? 3 : 1;
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
  for (let f = 0; f < CUSTOM_FRAME.count; f++) {
    ctx.save(); ctx.translate(f % 4 * 192, Math.floor(f / 4) * 128);
    const walk = f >= 4 && f <= 7;
    const phase = walk ? [0,1,0,-1][f-4] : 0;
    const punch = f === 8, kick = f === 9, defend = f === 10, charge = f === 11;
    const genki=f===12;
    const bob = walk ? Math.abs(phase) : 0;
    const headBob = f < 4 ? 0 : bob;
    const lean = punch ? 3 : kick ? -2 : defend ? -2 : 0;
    if (accessory && accessoryId === 'cape') draw(accessory, 74 - phase, 70 + bob, 43 + Math.abs(phase)*2, 53);
    // Draw the complete cloth between body and portrait. Its curved collar
    // wraps the neck, while the jaw hides the rear edge naturally.
    const drawScarf=()=>{
      if(accessory && accessoryId==='scarf') {
        const scarfW=15;
        ctx.drawImage(accessory,neckX+lean-11,66.5+bob,scarfW,scarfW*accessory.height/accessory.width);
      }
    };
    // Legs and footwear share hip pivots, so walking and kicking cannot leave detached boots.
    for (let side = 0; side < 2; side++) {
      ctx.save();
      const pivotX = side === 0 ? 91 : 102;
      const waistShift=torsoId==='goku'?1.5:0;
      ctx.translate(pivotX+waistShift+lean, hipY+bob);
      ctx.rotate(side === 1 && kick ? -1.2 : phase * (side ? -0.14 : 0.14));
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
      drawScarf();
      draw(portrait,lean,headBob,192,128);
    } else if(!punch && !defend && !charge) {
      // Keep shoulders, arms and belt joined in relaxed poses; preserve source proportions.
      draw(torso,79+lean,66+bob,36,36);
      drawScarf();
      draw(portrait,lean,headBob,192,128);
    } else {
    // Keep the neck/collar and shoulder bridge intact while the lower arms rotate.
    ctx.drawImage(torso, 0, 0, tw, th*.30, 79+lean,66+bob,36,11);
    ctx.drawImage(torso, tw*.25, th*.30, tw*.5, th*.70, 88+lean,77+bob,18,25);
    drawScarf();
    draw(portrait,lean,headBob,192,128);
    for (let side=0;side<2;side++) {
      const x = side ? 106 : 87;
      ctx.save(); ctx.translate(x + lean, 76 + bob);
      ctx.rotate(charge ? (side ? -.18 : .18) : defend ? (side ? 2.25 : -2.25) : punch && side ? -1.55 : phase*(side ? 0.1 : -0.1));
      // Discard the inner coat hem caught by the rectangular arm crop.
      ctx.beginPath();
      const armLeft=side?0:-9,armHeight=27;
      const armPoint=(x:number,y:number)=>[armLeft+(side?x:9-x),y] as const;
      ctx.moveTo(...armPoint(0,-1));
      for(const point of [[9,-1],[9,armHeight],[0,armHeight],[0,armHeight-3],[2.5,armHeight-7],[2.5,12],[0,6]])ctx.lineTo(...armPoint(point[0],point[1]));
      ctx.closePath();ctx.clip();
      ctx.drawImage(torso, side ? tw*.75 : 0, th*.25, tw*.25, th*.75, side ? 0 : -9, -1, 9, 27);
      ctx.restore();
    }
    }
    if (accessory) {
      if (accessoryId === 'sword' && !genki) {
        // Follow the same right-arm pivot and rotation as the hand.
        const armAngle=charge?-.18:defend?2.25:punch?-1.55:0;
        const handX=106+lean+Math.cos(armAngle)*4-Math.sin(armAngle)*24;
        const handY=76+bob+Math.sin(armAngle)*4+Math.cos(armAngle)*24;
        ctx.save(); ctx.translate(handX,handY);
        ctx.rotate(defend ? -0.9 : 0);
        draw(accessory, -8, -3, 43, 9); ctx.restore();
      }
    }
    ctx.restore();
  }
  if(scene.textures.exists(texture))scene.textures.remove(texture);
  const result = scene.textures.addCanvas(texture, canvas);
  if (result) Object.assign(result,{customWardrobeArt:true,customArtResolution:resolution});
}
