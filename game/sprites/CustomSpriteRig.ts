import Phaser from "phaser";
import { ColorPalette } from "../utils/ColorPalette";
import type { CharacterData } from "../types";

type CustomData = NonNullable<CharacterData["customData"]>;
type Pt = { x: number; y: number };
type Pose = {
  head: Pt; neck: Pt;
  shoulderL: Pt; shoulderR: Pt;
  elbowL: Pt; elbowR: Pt;
  handL: Pt; handR: Pt;
  hipL: Pt; hipR: Pt;
  kneeL: Pt; kneeR: Pt;
  ankleL: Pt; ankleR: Pt;
  footL: Pt; footR: Pt;
};

const FRAME_W = 192;
const FRAME_H = 128;
const FRAMES = 12;
const OUTLINE = 0x12131a;
const P = (x: number, y: number): Pt => ({ x, y });

const POSES: Pose[] = [
  { head:P(96,39),neck:P(96,51),shoulderL:P(82,57),shoulderR:P(110,57),elbowL:P(77,73),elbowR:P(115,73),handL:P(78,89),handR:P(114,89),hipL:P(89,82),hipR:P(103,82),kneeL:P(88,100),kneeR:P(105,100),ankleL:P(87,115),ankleR:P(107,115),footL:P(83,119),footR:P(111,119) },
  { head:P(96,38),neck:P(96,50),shoulderL:P(82,56),shoulderR:P(110,56),elbowL:P(77,72),elbowR:P(115,72),handL:P(79,88),handR:P(113,88),hipL:P(89,81),hipR:P(103,81),kneeL:P(88,99),kneeR:P(105,99),ankleL:P(87,115),ankleR:P(107,115),footL:P(83,119),footR:P(111,119) },
  { head:P(96,40),neck:P(96,52),shoulderL:P(82,58),shoulderR:P(110,58),elbowL:P(80,69),elbowR:P(112,69),handL:P(87,58),handR:P(105,58),hipL:P(88,82),hipR:P(104,82),kneeL:P(84,101),kneeR:P(108,101),ankleL:P(82,116),ankleR:P(111,116),footL:P(78,120),footR:P(115,120) },
  { head:P(96,40),neck:P(96,52),shoulderL:P(82,58),shoulderR:P(110,58),elbowL:P(79,70),elbowR:P(113,70),handL:P(85,61),handR:P(108,60),hipL:P(88,82),hipR:P(104,82),kneeL:P(86,101),kneeR:P(108,101),ankleL:P(84,116),ankleR:P(112,116),footL:P(80,120),footR:P(116,120) },
  { head:P(96,40),neck:P(96,52),shoulderL:P(83,58),shoulderR:P(109,58),elbowL:P(77,72),elbowR:P(114,72),handL:P(76,88),handR:P(116,87),hipL:P(90,82),hipR:P(102,82),kneeL:P(82,98),kneeR:P(109,100),ankleL:P(75,113),ankleR:P(112,116),footL:P(70,118),footR:P(116,120) },
  { head:P(97,39),neck:P(97,51),shoulderL:P(84,57),shoulderR:P(110,57),elbowL:P(80,70),elbowR:P(115,73),handL:P(80,86),handR:P(116,89),hipL:P(91,81),hipR:P(103,81),kneeL:P(94,99),kneeR:P(108,99),ankleL:P(98,115),ankleR:P(112,113),footL:P(102,120),footR:P(116,117) },
  { head:P(96,40),neck:P(96,52),shoulderL:P(83,58),shoulderR:P(109,58),elbowL:P(78,73),elbowR:P(114,70),handL:P(78,89),handR:P(115,86),hipL:P(90,82),hipR:P(102,82),kneeL:P(87,100),kneeR:P(99,99),ankleL:P(84,115),ankleR:P(95,115),footL:P(80,119),footR:P(91,120) },
  { head:P(95,39),neck:P(95,51),shoulderL:P(82,57),shoulderR:P(108,57),elbowL:P(77,72),elbowR:P(112,73),handL:P(76,88),handR:P(113,89),hipL:P(89,81),hipR:P(101,81),kneeL:P(84,99),kneeR:P(109,98),ankleL:P(81,114),ankleR:P(116,112),footL:P(77,119),footR:P(121,116) },
  { head:P(99,40),neck:P(99,52),shoulderL:P(84,59),shoulderR:P(112,58),elbowL:P(81,71),elbowR:P(126,63),handL:P(88,61),handR:P(149,64),hipL:P(90,83),hipR:P(105,83),kneeL:P(87,102),kneeR:P(108,101),ankleL:P(84,116),ankleR:P(111,116),footL:P(80,120),footR:P(116,120) },
  { head:P(95,40),neck:P(95,52),shoulderL:P(81,58),shoulderR:P(109,58),elbowL:P(79,69),elbowR:P(111,69),handL:P(86,59),handR:P(105,60),hipL:P(88,82),hipR:P(102,82),kneeL:P(86,100),kneeR:P(125,79),ankleL:P(84,115),ankleR:P(147,65),footL:P(80,120),footR:P(153,64) },
  { head:P(96,42),neck:P(96,54),shoulderL:P(82,60),shoulderR:P(110,60),elbowL:P(86,67),elbowR:P(106,67),handL:P(94,57),handR:P(99,58),hipL:P(88,84),hipR:P(104,84),kneeL:P(84,102),kneeR:P(108,102),ankleL:P(82,116),ankleR:P(112,116),footL:P(78,120),footR:P(116,120) },
  { head:P(96,37),neck:P(96,49),shoulderL:P(81,56),shoulderR:P(111,56),elbowL:P(75,69),elbowR:P(117,69),handL:P(72,85),handR:P(120,85),hipL:P(87,80),hipR:P(105,80),kneeL:P(82,101),kneeR:P(110,101),ankleL:P(80,116),ankleR:P(113,116),footL:P(76,120),footR:P(117,120) }
];

const pick = (v: number | undefined, fallback: number) => typeof v === "number" ? v : fallback;
const shade = (c: number, pct: number) => Phaser.Display.Color.IntegerToColor(c).darken(pct).color;
const light = (c: number, pct: number) => Phaser.Display.Color.IntegerToColor(c).lighten(pct).color;

export function generateRiggedCustomSprite(scene: Phaser.Scene, charData: CharacterData) {
  const data: CustomData = charData.customData || {
    gi1: ColorPalette.gi[0], gi2: ColorPalette.gi[1],
    hair: ColorPalette.hair[0], skin: ColorPalette.skin[0]
  };

  const makeForm = (form: 0 | 1 | 2) => {
    let textureName = charData.key;
    if (form === 1) textureName += "_ssj";
    if (form === 2) textureName += "_ui";
    if (scene.textures.exists(textureName)) scene.textures.remove(textureName);

    const g = scene.make.graphics({ x: 0, y: 0 });
    for (let frame = 0; frame < FRAMES; frame++) {
      drawFrame(g, frame * FRAME_W, POSES[frame], data, form, frame);
    }
    g.generateTexture(textureName, FRAME_W * FRAMES, FRAME_H);
    g.destroy();

    const tex = scene.textures.get(textureName);
    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    (tex as any).customWardrobeArt = true;
    (tex as any).customRigV2 = true;
    for (let i = 0; i < FRAMES; i++) tex.add(i.toString(), 0, i * FRAME_W, 0, FRAME_W, FRAME_H);
  };

  makeForm(0); makeForm(1); makeForm(2);
  return { torsoBounds: { minX: 72, minY: 49, w: 48, h: 38 } };
}

function drawFrame(g: Phaser.GameObjects.Graphics, ox: number, p: Pose, d: CustomData, form: number, frame: number) {
  const skin = pick(d.skin, 0xf0b789);
  const torso1 = pick(d.color_torso_1, d.gi1);
  const torso2 = pick(d.color_torso_2, d.gi2);
  const legs1 = pick(d.color_legs_1, d.gi1);
  const legs2 = pick(d.color_legs_2, d.gi2);
  const feet1 = pick(d.color_feet_1, d.gi2);
  const feet2 = pick(d.color_feet_2, d.gi1);
  const acc = pick(d.color_acc_1, d.gi2);
  const head1 = pick(d.color_head_1, d.gi1);
  const head2 = pick(d.color_head_2, d.gi2);
  const head = d.part_head || "goku";
  const torso = d.part_torso || "goku";
  const legs = d.part_legs || "goku";
  const feet = d.part_feet || "goku";
  const accessory = d.part_accessory || "none";

  if (accessory === "cape") drawCapeBack(g, ox, p, acc, frame);
  if (accessory === "scarf") drawScarfBack(g, ox, p, acc, frame);

  drawBody(g, ox, p, skin, frame);
  drawLegs(g, ox, p, legs, legs1, legs2, skin);
  drawFeet(g, ox, p, feet, feet1, feet2, skin);
  drawTorso(g, ox, p, torso, torso1, torso2);
  drawHead(g, ox, p, head, d.hair, head1, head2, skin, form);

  if (accessory === "straw_hat") drawStrawHat(g, ox, p, acc);
  else if (accessory === "headband") drawHeadband(g, ox, p, acc);
  else if (accessory === "scouter") drawScouter(g, ox, p);
  else if (accessory === "scarf") drawScarfFront(g, ox, p, acc);
  else if (accessory === "sword") drawSword(g, ox, p, frame);

  const x = (n: number) => ox + n;
  g.fillStyle(0x000000, 0.15);
  g.fillRect(x(Math.min(p.hipL.x, p.hipR.x) - 4), Math.min(p.hipL.y, p.hipR.y) - 1, Math.abs(p.hipR.x - p.hipL.x) + 8, 2);
}

function limb(g: Phaser.GameObjects.Graphics, ox: number, a: Pt, b: Pt, width: number, fill: number) {
  g.lineStyle(width + 5, OUTLINE, 1); g.lineBetween(ox + a.x, a.y, ox + b.x, b.y);
  g.lineStyle(width, fill, 1); g.lineBetween(ox + a.x, a.y, ox + b.x, b.y);
}

function joint(g: Phaser.GameObjects.Graphics, ox: number, pt: Pt, r: number, fill: number) {
  g.fillStyle(OUTLINE, 1); g.fillCircle(ox + pt.x, pt.y, r + 2);
  g.fillStyle(fill, 1); g.fillCircle(ox + pt.x, pt.y, r);
}

function drawBody(g: Phaser.GameObjects.Graphics, ox: number, p: Pose, skin: number, frame: number) {
  const sh = shade(skin, 18), hi = light(skin, 10), x = (n: number) => ox + n;
  limb(g, ox, p.hipL, p.kneeL, 10, sh); limb(g, ox, p.kneeL, p.ankleL, 9, skin);
  limb(g, ox, p.hipR, p.kneeR, 10, skin); limb(g, ox, p.kneeR, p.ankleR, 9, skin);
  limb(g, ox, p.shoulderL, p.elbowL, 9, sh); limb(g, ox, p.elbowL, p.handL, 8, skin);
  limb(g, ox, p.shoulderR, p.elbowR, 9, skin); limb(g, ox, p.elbowR, p.handR, 8, skin);
  [p.shoulderL,p.shoulderR,p.elbowL,p.elbowR,p.kneeL,p.kneeR].forEach(pt => joint(g, ox, pt, 4, skin));
  joint(g, ox, p.handL, 5, skin); joint(g, ox, p.handR, 5, skin);
  limb(g, ox, p.ankleL, p.footL, 7, skin); limb(g, ox, p.ankleR, p.footR, 7, skin);

  g.fillStyle(OUTLINE, 1);
  g.fillTriangle(x(p.neck.x), p.neck.y - 3, x(p.shoulderL.x - 5), p.shoulderL.y + 1, x(p.hipL.x - 5), p.hipL.y + 3);
  g.fillTriangle(x(p.neck.x), p.neck.y - 3, x(p.shoulderR.x + 5), p.shoulderR.y + 1, x(p.hipR.x + 5), p.hipR.y + 3);
  g.fillStyle(skin, 1);
  g.fillTriangle(x(p.neck.x), p.neck.y, x(p.shoulderL.x), p.shoulderL.y + 2, x(p.hipL.x), p.hipL.y);
  g.fillTriangle(x(p.neck.x), p.neck.y, x(p.shoulderR.x), p.shoulderR.y + 2, x(p.hipR.x), p.hipR.y);
  g.fillRect(x(p.hipL.x), p.hipL.y - 14, p.hipR.x - p.hipL.x, 14);

  g.lineStyle(2, sh, 0.62);
  g.lineBetween(x(p.neck.x), p.neck.y + 7, x(p.neck.x), p.hipL.y - 4);
  g.lineBetween(x(p.neck.x - 8), p.neck.y + 10, x(p.neck.x + 8), p.neck.y + 10);
  g.lineBetween(x(p.neck.x - 7), p.neck.y + 18, x(p.neck.x + 7), p.neck.y + 18);
  g.fillStyle(hi, 0.45); g.fillRect(x(p.neck.x - 7), p.neck.y + 5, 5, 2);

  g.fillStyle(OUTLINE,1); g.fillRect(x(p.neck.x - 5), p.neck.y - 5, 10, 11);
  g.fillStyle(skin,1); g.fillRect(x(p.neck.x - 3), p.neck.y - 5, 6, 11);
  g.fillStyle(OUTLINE,1); g.fillEllipse(x(p.head.x), p.head.y, 24, 25);
  g.fillStyle(skin,1); g.fillEllipse(x(p.head.x), p.head.y, 20, 21);
  g.fillStyle(sh,1); g.fillRect(x(p.head.x - 8), p.head.y + 5, 16, 3);
  g.fillStyle(OUTLINE,1); g.fillRect(x(p.head.x - 6), p.head.y - 1, 4, 2); g.fillRect(x(p.head.x + 2), p.head.y - 1, 4, 2);
  g.fillStyle(0xffffff,1); g.fillRect(x(p.head.x - 5), p.head.y - 1, 2, 1); g.fillRect(x(p.head.x + 3), p.head.y - 1, 2, 1);
  g.fillStyle(OUTLINE,1); g.fillRect(x(p.head.x - (frame === 11 ? 3 : 2)), p.head.y + 6, frame === 11 ? 6 : 4, frame === 11 ? 2 : 1);
}

function drawTorso(g: Phaser.GameObjects.Graphics, ox: number, p: Pose, id: string, c1: number, c2: number) {
  const x = (n: number) => ox + n;
  const garment = (main: number, secondary?: number) => {
    g.fillStyle(OUTLINE,1);
    g.fillTriangle(x(p.neck.x),p.neck.y-1,x(p.shoulderL.x-4),p.shoulderL.y+1,x(p.hipL.x-4),p.hipL.y+1);
    g.fillTriangle(x(p.neck.x),p.neck.y-1,x(p.shoulderR.x+4),p.shoulderR.y+1,x(p.hipR.x+4),p.hipR.y+1);
    g.fillStyle(main,1);
    g.fillTriangle(x(p.neck.x),p.neck.y+2,x(p.shoulderL.x),p.shoulderL.y+2,x(p.hipL.x),p.hipL.y-1);
    g.fillTriangle(x(p.neck.x),p.neck.y+2,x(p.shoulderR.x),p.shoulderR.y+2,x(p.hipR.x),p.hipR.y-1);
    g.fillRect(x(p.hipL.x),p.hipL.y-14,p.hipR.x-p.hipL.x,13);
    if (secondary !== undefined) { g.fillStyle(secondary,1); g.fillRect(x(p.hipL.x-2),p.hipL.y-4,p.hipR.x-p.hipL.x+4,4); }
  };
  const sleeve = (a: Pt, b: Pt, main: number, w = 7) => limb(g, ox, a, b, w, main);

  if (id === "muscle") { sleeve(p.elbowL,p.handL,c1,5); sleeve(p.elbowR,p.handR,c1,5); return; }
  if (id === "spiderman") {
    garment(c1,c2); sleeve(p.shoulderL,p.handL,c1,8); sleeve(p.shoulderR,p.handR,c1,8);
    g.fillStyle(OUTLINE,1); g.fillRect(x(p.neck.x-2),p.neck.y+10,4,8);
  } else if (id === "jotaro") {
    garment(c1,c2); sleeve(p.shoulderL,p.handL,c1,8); sleeve(p.shoulderR,p.handR,c1,8);
    g.fillStyle(0xd7a425,1); g.fillCircle(x(p.shoulderR.x+3),p.shoulderR.y+1,2);
  } else if (id === "vegeta") {
    garment(c2); sleeve(p.shoulderL,p.elbowL,c2,8); sleeve(p.shoulderR,p.elbowR,c2,8);
    g.fillStyle(0xf1f5f9,1); g.fillRect(x(p.neck.x-10),p.neck.y+5,20,15);
    g.fillStyle(0xeab308,1); g.fillRect(x(p.neck.x-8),p.neck.y+8,16,6);
  } else if (id === "saitama") {
    garment(c1,c2); sleeve(p.shoulderL,p.handL,c1,8); sleeve(p.shoulderR,p.handR,c1,8);
  } else if (id === "chapolim") {
    garment(c1,c2); sleeve(p.shoulderL,p.elbowL,c1,8); sleeve(p.shoulderR,p.elbowR,c1,8);
    g.fillStyle(c2,1); g.fillTriangle(x(p.neck.x-6),p.neck.y+8,x(p.neck.x+6),p.neck.y+8,x(p.neck.x),p.neck.y+17);
  } else if (id === "naruto") {
    garment(c1,c2); sleeve(p.shoulderL,p.elbowL,c1,8); sleeve(p.shoulderR,p.elbowR,c1,8);
    g.fillStyle(c2,1); g.fillRect(x(p.shoulderL.x),p.shoulderL.y-3,p.shoulderR.x-p.shoulderL.x,5);
    g.fillStyle(OUTLINE,1); g.fillRect(x(p.neck.x-1),p.neck.y+4,2,25);
  } else if (id === "sasuke") {
    garment(c1,c2); sleeve(p.shoulderL,p.elbowL,c1,7); sleeve(p.shoulderR,p.elbowR,c1,7);
    g.fillStyle(c1,1); g.fillRect(x(p.neck.x-7),p.neck.y-3,14,6);
    sleeve(p.elbowL,p.handL,0xe5e7eb,6); sleeve(p.elbowR,p.handR,0xe5e7eb,6);
  } else if (id === "luffy") {
    g.fillStyle(c1,1);
    g.fillTriangle(x(p.shoulderL.x-2),p.shoulderL.y,x(p.neck.x-3),p.neck.y+2,x(p.hipL.x),p.hipL.y);
    g.fillTriangle(x(p.shoulderR.x+2),p.shoulderR.y,x(p.neck.x+3),p.neck.y+2,x(p.hipR.x),p.hipR.y);
    sleeve(p.shoulderL,p.elbowL,c1,6); sleeve(p.shoulderR,p.elbowR,c1,6);
  } else {
    garment(c1,c2); sleeve(p.shoulderL,p.elbowL,c1,7); sleeve(p.shoulderR,p.elbowR,c1,7);
    g.fillStyle(c2,1); g.fillTriangle(x(p.neck.x-8),p.neck.y+2,x(p.neck.x),p.neck.y+12,x(p.neck.x+8),p.neck.y+2);
    sleeve(p.elbowL,p.handL,c2,5); sleeve(p.elbowR,p.handR,c2,5);
  }
}

function drawLegs(g: Phaser.GameObjects.Graphics, ox: number, p: Pose, id: string, c1: number, c2: number, skin: number) {
  const x = (n:number) => ox+n;
  const draw = (a:Pt,b:Pt,w:number,col:number) => limb(g,ox,a,b,w,col);
  const waist = (col:number,h=6) => { g.fillStyle(OUTLINE,1); g.fillRect(x(p.hipL.x-5),p.hipL.y-h,p.hipR.x-p.hipL.x+10,h+3); g.fillStyle(col,1); g.fillRect(x(p.hipL.x-3),p.hipL.y-h+1,p.hipR.x-p.hipL.x+6,h); };
  let main=c1, accent=c2, w=12;
  if (id==="spiderman") { main=c2; accent=c1; w=10; }
  else if (id==="jotaro") { accent=0xd5a42a; w=11; }
  else if (id==="vegeta") { main=c2; accent=c1; w=10; }
  else if (id==="luffy") { main=0x2456a6; accent=0xf0d04a; w=11; }
  if (id==="chapolim" || id==="luffy") {
    draw(p.hipL,p.kneeL,w,main); draw(p.hipR,p.kneeR,w,main); waist(accent,7);
  } else {
    draw(p.hipL,p.kneeL,w,main); draw(p.kneeL,p.ankleL,w-1,main);
    draw(p.hipR,p.kneeR,w,main); draw(p.kneeR,p.ankleR,w-1,main); waist(accent,6);
  }
  if (id==="jotaro") { g.fillStyle(accent,1); g.fillRect(x(p.hipL.x-3),p.hipL.y-8,p.hipR.x-p.hipL.x+6,2); }
  if (id==="naruto") { g.lineStyle(4,0xf1f5f9,1); g.lineBetween(x(p.kneeR.x),p.kneeR.y,x(p.ankleR.x),p.ankleR.y-3); }
  if (id==="sasuke") { g.lineStyle(4,accent,1); g.lineBetween(x(p.hipL.x-5),p.hipL.y-6,x(p.hipR.x+5),p.hipR.y-6); }
  if (id==="chapolim") { g.lineStyle(5,c1,1); g.lineBetween(x(p.kneeL.x),p.kneeL.y,x(p.ankleL.x),p.ankleL.y); g.lineBetween(x(p.kneeR.x),p.kneeR.y,x(p.ankleR.x),p.ankleR.y); }
  if (id==="luffy") { g.lineStyle(5,skin,1); g.lineBetween(x(p.kneeL.x),p.kneeL.y,x(p.ankleL.x),p.ankleL.y); g.lineBetween(x(p.kneeR.x),p.kneeR.y,x(p.ankleR.x),p.ankleR.y); }
}

function drawFeet(g: Phaser.GameObjects.Graphics, ox:number, p:Pose, id:string, c1:number, c2:number, skin:number) {
  const x=(n:number)=>ox+n;
  const boot=(a:Pt,f:Pt,w:number,col:number)=>limb(g,ox,a,f,w,col);
  if(id==="luffy"){boot(p.ankleL,p.footL,5,0x5b341e);boot(p.ankleR,p.footR,5,0x5b341e);return;}
  if(id==="naruto"||id==="sasuke"){
    boot(p.ankleL,p.footL,7,c1);boot(p.ankleR,p.footR,7,c1);
    g.fillStyle(skin,1);g.fillCircle(x(p.footL.x-1),p.footL.y,3);g.fillCircle(x(p.footR.x+1),p.footR.y,3);return;
  }
  let main=c1,accent=c2,w=9;
  if(id==="spiderman"){main=c2;accent=c1;w=8;}
  else if(id==="chapolim"){accent=0xffffff;}
  else if(id==="saitama"){main=c2;accent=c1;}
  else if(id==="vegeta"){main=0xf3f4f6;accent=0xeab308;}
  else if(id==="jotaro"){accent=0xd6a52b;}
  boot(p.ankleL,p.footL,w,main);boot(p.ankleR,p.footR,w,main);
  g.fillStyle(accent,1);g.fillRect(x(p.ankleL.x-4),p.ankleL.y-4,8,3);g.fillRect(x(p.ankleR.x-4),p.ankleR.y-4,8,3);
}

function drawHead(g: Phaser.GameObjects.Graphics, ox:number, p:Pose, id:string, baseHair:number, c1:number, c2:number, skin:number, form:number) {
  const x=(n:number)=>ox+n;
  const hair=form===1?0xf6c532:form===2?0xd7dce6:pick(baseHair,0x20232c);
  const hs=shade(hair,25), red=pick(c1,0xd52b2b);
  const spike=(px:number,py:number,tx:number,ty:number,col=hair)=>{g.fillStyle(OUTLINE,1);g.fillTriangle(x(px-4),py+4,x(px+4),py+4,x(tx),ty);g.fillStyle(col,1);g.fillTriangle(x(px-3),py+3,x(px+3),py+3,x(tx),ty+1);};
  if(id==="saitama") return;
  if(id==="spiderman"){
    g.fillStyle(OUTLINE,1);g.fillEllipse(x(p.head.x),p.head.y,25,26);g.fillStyle(red,1);g.fillEllipse(x(p.head.x),p.head.y,21,22);
    g.fillStyle(0xffffff,1);g.fillTriangle(x(p.head.x-7),p.head.y-2,x(p.head.x-2),p.head.y-5,x(p.head.x-3),p.head.y+3);g.fillTriangle(x(p.head.x+7),p.head.y-2,x(p.head.x+2),p.head.y-5,x(p.head.x+3),p.head.y+3);return;
  }
  if(id==="chapolim"){
    g.fillStyle(OUTLINE,1);g.fillEllipse(x(p.head.x),p.head.y,25,26);g.fillStyle(red,1);g.fillEllipse(x(p.head.x),p.head.y,21,22);
    g.fillStyle(skin,1);g.fillEllipse(x(p.head.x),p.head.y+2,14,13);
    g.lineStyle(3,red,1);g.lineBetween(x(p.head.x-6),p.head.y-11,x(p.head.x-9),p.head.y-21);g.lineBetween(x(p.head.x+6),p.head.y-11,x(p.head.x+9),p.head.y-21);
    g.fillStyle(c2,1);g.fillCircle(x(p.head.x-9),p.head.y-22,3);g.fillCircle(x(p.head.x+9),p.head.y-22,3);return;
  }
  if(id==="jotaro"){
    [-10,-6,-2,3,8,11].forEach(dx=>spike(p.head.x+dx,p.head.y-6,p.head.x+dx+(dx<0?-4:4),p.head.y-17,hs));
    g.fillStyle(OUTLINE,1);g.fillRect(x(p.head.x-11),p.head.y-11,22,7);g.fillStyle(hair,1);g.fillRect(x(p.head.x-10),p.head.y-10,20,5);g.fillStyle(c2,1);g.fillRect(x(p.head.x-8),p.head.y-5,15,3);return;
  }
  if(id==="vegeta"){
    [-9,-5,-1,3,7,10].forEach(dx=>spike(p.head.x+dx,p.head.y-7,p.head.x+dx+(dx<0?-4:4),p.head.y-20-(Math.abs(dx)%3),hair));
    g.fillStyle(hair,1);g.fillTriangle(x(p.head.x-5),p.head.y-9,x(p.head.x+5),p.head.y-9,x(p.head.x),p.head.y-2);return;
  }
  g.fillStyle(hs,1);g.fillEllipse(x(p.head.x),p.head.y-6,(id==="sasuke"?26:23),12);
  const spikes=id==="naruto"?[-11,-7,-3,1,5,9]:id==="sasuke"?[-12,-8,-4,2,7,11]:[-11,-6,-1,4,9];
  spikes.forEach(dx=>spike(p.head.x+dx,p.head.y-8,p.head.x+dx+(dx<0?-5:5),p.head.y-17-(Math.abs(dx)%4),hair));
  if(id==="naruto"){
    g.lineStyle(1,shade(skin,32),1);g.lineBetween(x(p.head.x-8),p.head.y+4,x(p.head.x-4),p.head.y+5);g.lineBetween(x(p.head.x+4),p.head.y+5,x(p.head.x+8),p.head.y+4);
  }
  if(id==="sasuke"){spike(p.head.x+10,p.head.y-4,p.head.x+18,p.head.y-8,hair);spike(p.head.x-10,p.head.y-4,p.head.x-18,p.head.y-8,hair);}
}

function drawCapeBack(g:Phaser.GameObjects.Graphics,ox:number,p:Pose,c:number,frame:number){
  const x=(n:number)=>ox+n,wind=frame===8||frame===9||frame===11?18:9;
  g.fillStyle(OUTLINE,1);g.fillTriangle(x(p.shoulderL.x-4),p.shoulderL.y-2,x(p.shoulderR.x+5),p.shoulderR.y-2,x(p.hipR.x+wind),p.hipR.y+28);g.fillTriangle(x(p.shoulderL.x-4),p.shoulderL.y-2,x(p.hipL.x-wind),p.hipL.y+28,x(p.hipR.x+wind),p.hipR.y+28);
  g.fillStyle(c,1);g.fillTriangle(x(p.shoulderL.x),p.shoulderL.y,x(p.shoulderR.x),p.shoulderR.y,x(p.hipR.x+wind-3),p.hipR.y+24);g.fillTriangle(x(p.shoulderL.x),p.shoulderL.y,x(p.hipL.x-wind+3),p.hipL.y+24,x(p.hipR.x+wind-3),p.hipR.y+24);
}
function drawScarfBack(g:Phaser.GameObjects.Graphics,ox:number,p:Pose,c:number,frame:number){const x=(n:number)=>ox+n;g.lineStyle(8,OUTLINE,1);g.lineBetween(x(p.neck.x-4),p.neck.y,x(p.neck.x-18-(frame>=4?6:0)),p.neck.y+12);g.lineStyle(5,c,1);g.lineBetween(x(p.neck.x-4),p.neck.y,x(p.neck.x-18-(frame>=4?6:0)),p.neck.y+12);}
function drawStrawHat(g:Phaser.GameObjects.Graphics,ox:number,p:Pose,c:number){const x=(n:number)=>ox+n,straw=light(c,25);g.fillStyle(OUTLINE,1);g.fillEllipse(x(p.head.x),p.head.y-15,36,8);g.fillStyle(straw,1);g.fillEllipse(x(p.head.x),p.head.y-15,32,6);g.fillStyle(c,1);g.fillRect(x(p.head.x-9),p.head.y-22,18,8);g.fillStyle(0xb62b2b,1);g.fillRect(x(p.head.x-9),p.head.y-17,18,3);}
function drawHeadband(g:Phaser.GameObjects.Graphics,ox:number,p:Pose,c:number){const x=(n:number)=>ox+n;g.fillStyle(OUTLINE,1);g.fillRect(x(p.head.x-12),p.head.y-6,24,7);g.fillStyle(c,1);g.fillRect(x(p.head.x-11),p.head.y-5,22,5);g.fillStyle(0xd1d5db,1);g.fillRect(x(p.head.x-7),p.head.y-5,14,5);g.lineStyle(4,c,1);g.lineBetween(x(p.head.x+9),p.head.y-3,x(p.head.x+18),p.head.y+3);}
function drawScouter(g:Phaser.GameObjects.Graphics,ox:number,p:Pose){const x=(n:number)=>ox+n;g.fillStyle(0x111827,1);g.fillRect(x(p.head.x+1),p.head.y-5,11,8);g.fillStyle(0x31d66b,0.9);g.fillRect(x(p.head.x+2),p.head.y-4,8,6);g.fillStyle(0xe5e7eb,1);g.fillRect(x(p.head.x+10),p.head.y-3,4,8);g.fillStyle(0xef4444,1);g.fillRect(x(p.head.x+12),p.head.y-1,2,4);}
function drawScarfFront(g:Phaser.GameObjects.Graphics,ox:number,p:Pose,c:number){const x=(n:number)=>ox+n;g.lineStyle(10,OUTLINE,1);g.lineBetween(x(p.neck.x-8),p.neck.y+1,x(p.neck.x+8),p.neck.y+1);g.lineStyle(7,c,1);g.lineBetween(x(p.neck.x-8),p.neck.y+1,x(p.neck.x+8),p.neck.y+1);}
function drawSword(g:Phaser.GameObjects.Graphics,ox:number,p:Pose,frame:number){
  const x=(n:number)=>ox+n;
  let end: Pt;
  if(frame===8) end=P(p.handR.x+39,p.handR.y-2);
  else if(frame===10) end=P(p.handR.x+5,p.handR.y-38);
  else if(frame===11) end=P(p.handR.x+2,p.handR.y-44);
  else if(frame===9) end=P(p.handL.x-8,p.handL.y-28);
  else end=P(p.handR.x+18,p.handR.y-24);
  g.lineStyle(8,OUTLINE,1);g.lineBetween(x(p.handR.x),p.handR.y,x(end.x),end.y);
  g.lineStyle(4,0xcbd5e1,1);g.lineBetween(x(p.handR.x+1),p.handR.y,x(end.x),end.y);
  g.lineStyle(1,0xffffff,1);g.lineBetween(x(p.handR.x+2),p.handR.y-1,x(end.x),end.y-1);
  g.fillStyle(0xeab308,1);g.fillRect(x(p.handR.x-3),p.handR.y-3,8,3);
  g.lineStyle(6,0x3b2418,1);g.lineBetween(x(p.handR.x-1),p.handR.y+2,x(p.handR.x-8),p.handR.y+10);
}
