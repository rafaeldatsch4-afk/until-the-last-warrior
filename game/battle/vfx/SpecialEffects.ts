import type Phaser from 'phaser';

export type SpecialVisual = 'cast' | 'amaterasu' | 'tsukuyomi';
export interface VisualFrame {
  kind: SpecialVisual;
  time: number;
  x: number;
  y: number;
  color: number;
  direction: number;
  low: boolean;
}
const clamp = (n: number) => Math.max(0, Math.min(1, n));

/** Pure, deterministic drawing: no randomness, damage, cameras or fighter mutations. */
export function drawSpecialFrame(g: Phaser.GameObjects.Graphics, f: VisualFrame) {
  const {kind,time:t,x,y,color,direction:dir,low}=f;
  g.clear();
  if(kind==='cast') {
    const p=clamp(t/650),fade=(1-p)*.75;
    const radius=22+78*p;
    g.lineStyle(3,color,fade).strokeEllipse(x,y+70,radius*2,radius*.55);
    const n=low?6:12;
    for(let i=0;i<n;i++) {
      const a=i*Math.PI*2/n+p*1.4,r=74*(1-p)+12;
      const sx=x+Math.cos(a)*r,sy=y+Math.sin(a)*r*.7;
      g.lineStyle(2,color,fade).lineBetween(sx,sy,sx-Math.cos(a)*12,sy-Math.sin(a)*12);
    }
    g.lineStyle(2,0xffecd3,fade*.65).strokeCircle(x+dir*24,y,8+20*p);
    return;
  }
  if(kind==='amaterasu') {
    const grow=clamp(t/220),fade=1-clamp((t-1200)/400);
    g.lineStyle(3,0xc62453,.5*fade).strokeEllipse(x,y+82,156*grow,25*grow);
    const n=low?7:13;
    for(let i=0;i<n;i++) {
      const phase=i*2.4+t*.012,sx=x+(i/(n-1)-.5)*132;
      const h=(88+45*Math.sin(i*1.7)**2+18*Math.sin(phase))*grow;
      const sway=Math.sin(phase)*12,base=y+82,w=low?17:11;
      const points: {x:number;y:number}[]=[];
      // Sample two curved edges: broad roots, curling tips and a narrow neck.
      for(const side of [-1,1])for(let k=0;k<=10;k++) {
        const v=(side===-1?k:10-k)/10;
        const curl=Math.sin(phase+v*5)*v*18;
        const width=w*Math.pow(1-v,.7)*(1+.45*Math.sin(v*Math.PI*2));
        points.push({x:sx+curl+side*width,y:base-h*v});
      }
      g.fillStyle(0x120d22,.95*fade).fillPoints(points,true);
      g.lineStyle(2,0x8b2454,.8*fade).strokePoints(points,true);
      g.fillStyle(0x391426,.8*fade).fillTriangle(sx-w*.5,base,sx+sway*.5,base-h*.58,sx+w*.55,base);
      const ash=(t*.09+i*19)%135;
      g.fillStyle(i%2?0x7e2347:0x16101c,fade*(1-ash/160)).fillRect(sx+Math.sin(phase)*9,base-ash,3,5);
    }
    // One compact ignition wave aligned with the original 1000ms damage event.
    const hit=clamp((t-1000)/320);
    if(t>=1000&&hit<1)g.lineStyle(4*(1-hit)+1,0xd53a64,(1-hit)*.8).strokeEllipse(x,y+25,40+210*hit,70+110*hit);
    return;
  }
  // Tsukuyomi: readable iris and three hooked tomoe instead of an opaque screen.
  const reveal=clamp(t/350),fade=1-clamp((t-1500)/350),r=100*reveal;
  if(fade>0) {
    g.fillStyle(0x310c1e,.28*fade).fillCircle(x,y,r*1.25);
    const lid: {x:number;y:number}[]=[];
    for(const side of [-1,1])for(let i=0;i<=16;i++) {
      const u=(side===-1?i:16-i)/16;
      lid.push({x:x+(u-.5)*r*3.6,y:y+side*Math.sin(u*Math.PI)*r*1.08});
    }
    g.fillStyle(0x8c213b,.12*fade).fillPoints(lid,true);
    g.lineStyle(3,0xc83850,.7*fade).strokePoints(lid,true);
    g.fillStyle(0xa51935,.42*fade).fillCircle(x,y,r);
    g.lineStyle(3,0xee4662,.75*fade).strokeCircle(x,y,r);
    g.lineStyle(1,0x170b17,.9*fade).strokeCircle(x,y,r*.65);
    g.fillStyle(0x100913,fade).fillCircle(x,y,r*.18);
    for(let i=0;i<3;i++) {
      const a=i*Math.PI*2/3+t*.0025,cx=x+Math.cos(a)*r*.56,cy=y+Math.sin(a)*r*.56;
      g.fillStyle(0x100913,fade).fillCircle(cx,cy,r*.105);
      const tx=-Math.sin(a),ty=Math.cos(a);
      g.fillTriangle(cx-Math.cos(a)*8,cy-Math.sin(a)*8,cx+tx*r*.29,cy+ty*r*.29,cx+Math.cos(a)*9,cy+Math.sin(a)*9);
    }
    if(!low)for(let i=0;i<8;i++) {
      const a=i*Math.PI/4-t*.0004;
      g.lineStyle(2,0xb92648,fade*.32).lineBetween(x+Math.cos(a)*r*1.2,y+Math.sin(a)*r*1.2,x+Math.cos(a)*r*1.5,y+Math.sin(a)*r*1.5);
    }
  }
  for(let i=0;i<8;i++) {
    const p=(t-1550-i*70)/190;
    if(p<0||p>1)continue;
    const sx=x+(i%4-1.5)*22,sy=y+((i*3)%5-2)*17;
    const dx=(i%2?1:-1)*dir*90,dy=55;
    g.lineStyle(10*(1-p),0x9d1947,(1-p)*.65).lineBetween(sx-dx*.6,sy-dy*.6,sx+dx*p,sy+dy*p);
    g.lineStyle(3*(1-p)+.5,0xffd5de,1-p).lineBetween(sx-dx*.6,sy-dy*.6,sx+dx*p,sy+dy*p);
  }
  if(t>=2200) {
    const p=clamp((t-2200)/280);
    g.lineStyle(3,0xe62e56,1-p).strokeCircle(x,y,25+p*125);
  }
}

interface Job { graphics: Phaser.GameObjects.Graphics; kind: SpecialVisual; age: number; duration: number; target: Phaser.GameObjects.Sprite; color: number; direction: number }
export class SpecialEffects {
  private jobs: Job[]=[];
  constructor(private scene: Phaser.Scene & {gameState?: {settings?: {lowPerformanceMode?: boolean}}}) {
    scene.events.on('update',this.update,this);
    scene.events.once('shutdown',this.destroy,this);
  }
  play(kind: SpecialVisual,target: Phaser.GameObjects.Sprite,color=0xff345a,direction=1) {
    if(!this.scene.scene.isActive()||!target?.active)return;
    // Bounded work even if multiple specials overlap in multiplayer.
    if(this.jobs.length>=6)this.jobs.shift()!.graphics.destroy();
    const graphics=this.scene.add.graphics().setDepth(kind==='tsukuyomi'?0.8:6);
    this.jobs.push({graphics,kind,age:0,duration:kind==='cast'?650:kind==='amaterasu'?1600:2480,target,color,direction});
  }
  private update(_time:number,delta:number) {
    for(let i=this.jobs.length-1;i>=0;i--) {
      const j=this.jobs[i];j.age+=delta;
      if(j.age>=j.duration||!j.target.active){j.graphics.destroy();this.jobs.splice(i,1);continue;}
      if(j.kind==='tsukuyomi')j.graphics.setDepth(j.age>=1500?6:0.8);
      const transformed=/_ssj|_ui/.test(j.target.texture.key);
      drawSpecialFrame(j.graphics,{kind:j.kind,time:j.age,x:j.target.x,y:j.target.y+(transformed?25:100),color:j.color,direction:j.direction,low:!!this.scene.gameState?.settings?.lowPerformanceMode});
    }
  }
  clear(){for(const j of this.jobs)j.graphics.destroy();this.jobs=[];}
  destroy(){this.clear();this.scene.events.off('update',this.update,this);this.scene.events.off('shutdown',this.destroy,this);}
}
