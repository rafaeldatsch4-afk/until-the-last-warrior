// Draws the Batman and Spider-Man roster sheets as vector art, rendered at 4x so the
// shared packer (scripts/pack-roster-art.mjs) can normalize them like every other form.
// Usage: node scripts/draw-hero-art.mjs [key ...]      -> writes docs/art/roster/<key>-source.png
//        node scripts/draw-hero-art.mjs --sockets      -> after packing, writes combat-poses.json sockets
import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';

const K=4, CELL_W=110, CELL_H=90, COLS=4, ROWS=3;   // units = final atlas pixels
const OUT=2.4;                                       // outline stroke (half is visible)
const INK='#0b0c12';
const rad=d=>d*Math.PI/180;
const dir=(a,len)=>[Math.sin(rad(a))*len,Math.cos(rad(a))*len];   // 0 = down, +90 = forward
const add=(p,q)=>[p[0]+q[0],p[1]+q[1]];
const lerp=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];
const f=n=>n.toFixed(2);
const pts=a=>a.map(p=>`${f(p[0])},${f(p[1])}`).join(' ');
const poly=(a,fill,o=true)=>`<polygon points="${pts(a)}" fill="${fill}"${o?` stroke="${INK}" stroke-width="${OUT}" stroke-linejoin="round" paint-order="stroke"`:''}/>`;
const circ=(c,r,fill,o=true)=>`<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" fill="${fill}"${o?` stroke="${INK}" stroke-width="${OUT}" paint-order="stroke"`:''}/>`;
const ell=(c,rx,ry,fill,o=true,rot=0)=>`<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(rot)} ${f(c[0])} ${f(c[1])})" fill="${fill}"${o?` stroke="${INK}" stroke-width="${OUT}" paint-order="stroke"`:''}/>`;
const line=(a,b,w,col)=>`<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
const path=(d,fill,o=true)=>`<path d="${d}" fill="${fill}"${o?` stroke="${INK}" stroke-width="${OUT}" stroke-linejoin="round" paint-order="stroke"`:''}/>`;

/** Tapered limb segment with rounded ends. */
function capsule(a,b,wa,wb,fill,o=true,joint=true){
  const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l;
  const q=[[a[0]+nx*wa/2,a[1]+ny*wa/2],[b[0]+nx*wb/2,b[1]+ny*wb/2],[b[0]-nx*wb/2,b[1]-ny*wb/2],[a[0]-nx*wa/2,a[1]-ny*wa/2]];
  // A continuing segment hides its start ring so knees/elbows read as one limb.
  return (joint?circ(a,wa/2,fill,o):'')+circ(b,wb/2,fill,o)+poly(q,fill,o)+circ(a,wa/2-.05,fill,false)+circ(b,wb/2-.05,fill,false);
}
/** Light stripe toward the viewer/front side of a segment. */
function sheen(a,b,w,col,side=1){
  const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l*side,ny=dx/l*side;
  const off=w*.28;return line(lerp([a[0]+nx*off,a[1]+ny*off],[b[0]+nx*off,b[1]+ny*off],.12),lerp([a[0]+nx*off,a[1]+ny*off],[b[0]+nx*off,b[1]+ny*off],.85),w*.3,col);
}

// ---------------------------------------------------------------- skeleton
const STAND={dx:0,lean:4,head:0,armF:[40,160],armB:[28,150],legF:[24,0],legB:[-12,-20],footF:0,footB:0,cape:0,hand:'fist'};
const POSES=[
  {...STAND},
  {...STAND,bob:.5,armF:[42,158],armB:[30,148],cape:1},
  {...STAND,bob:1,armF:[44,156],armB:[32,146],cape:2},
  {...STAND,bob:.5,armF:[42,158],armB:[30,148],cape:1},
  {...STAND,lean:8,armF:[-22,20],armB:[26,62],legF:[28,8],legB:[-26,-16],cape:5},
  {...STAND,lean:8,bob:1.2,armF:[4,40],armB:[2,40],legF:[4,-14],legB:[-6,-4],cape:3},
  {...STAND,lean:8,armF:[26,62],armB:[-22,20],legF:[-24,-16],legB:[28,8],cape:5},
  {...STAND,lean:8,bob:1.2,armF:[2,40],armB:[4,40],legF:[-6,-4],legB:[4,-14],cape:3},
  {...STAND,lean:14,armF:[92,90],armB:[-38,118],legF:[32,12],legB:[-36,-28],cape:7,hand:'fist'},
  {...STAND,lean:-18,armF:[60,165],armB:[-30,40],legF:[98,96],legB:[-8,-2],footF:95,cape:9},
  {...STAND,lean:6,bob:1.5,armF:[62,176],armB:[70,168],legF:[26,-6],legB:[-20,-26],cape:2,guard:true},
  {...STAND,lean:10,armF:[96,98],armB:[-40,112],legF:[34,12],legB:[-34,-26],cape:8,hand:'open'},
];
const L={thigh:15,shin:14.2,upper:10.2,fore:9.4,torso:18};

function rig(p,originX){
  const hip0=[originX+(p.dx||0),34];
  const tv=dir(180+p.lean,1);                                  // torso axis (up)
  const shoulderC=add(hip0,[tv[0]*L.torso,tv[1]*L.torso]);
  const neck=add(shoulderC,[tv[0]*2.2,tv[1]*2.2]);
  const headC=add(neck,dir(180+p.lean+(p.head||0),5.4));
  const hipF=add(hip0,[1.6,0]),hipB=add(hip0,[-1.8,0]);
  const shF=add(shoulderC,[2.4,1]),shB=add(shoulderC,[-3.2,.6]);
  const leg=(h,[u,l])=>{const k=add(h,dir(u,L.thigh));return [h,k,add(k,dir(l,L.shin))];};
  const arm=(s,[u,l])=>{const e=add(s,dir(u,L.upper));return [s,e,add(e,dir(l,L.fore))];};
  const r={hip:hip0,tv,shoulderC,neck,headC,legF:leg(hipF,p.legF),legB:leg(hipB,p.legB),armF:arm(shF,p.armF),armB:arm(shB,p.armB)};
  // Ground the lowest boot on y=64 and apply the breathing bob.
  const low=Math.max(r.legF[2][1],r.legB[2][1])+2.4, shift=64-low+(p.bob||0)*0;
  const mv=q=>Array.isArray(q[0])?q.map(mv):[q[0],q[1]+shift];
  for(const k of ['hip','shoulderC','neck','headC'])r[k]=mv(r[k]);
  for(const k of ['legF','legB','armF','armB'])r[k]=mv(r[k]);
  if(p.bob){for(const k of ['shoulderC','neck','headC'])r[k][1]+=p.bob;for(const k of ['armF','armB'])r[k]=r[k].map(q=>[q[0],q[1]+p.bob]);}
  return r;
}

// ---------------------------------------------------------------- body parts
function torsoShape(r,wTop=7,wWaist=4.4,wHip=4.9){
  const {hip,tv}=r,nx=-tv[1],ny=tv[0];                          // perpendicular (forward)
  const at=(t,w)=>add(hip,[tv[0]*t+nx*w,tv[1]*t+ny*w]);
  const top=L.torso+1.4;
  return {front:[at(top,wTop*.8),at(top-4,wTop*.95),at(8,wWaist),at(0,wHip)],back:[at(0,-wHip),at(8,-wWaist-.4),at(top-4,-wTop),at(top,-wTop*.85)],at};
}
/** Boot drawn in a local frame: +u along the toe direction, +v toward the sole. */
function boot(ankle,angle,fill,len=5.2){
  const d=angle?dir(angle,1):[1,0],n=angle?[d[1],-d[0]]:[0,1];
  if(angle&&n[1]<0){n[0]=-n[0];n[1]=-n[1];}
  const P=(u,v)=>add(ankle,[d[0]*u+n[0]*v,d[1]*u+n[1]*v]);
  return poly([P(-2.1,-2),P(1.8,-2),P(len,.8),P(len,2.4),P(-2.4,2.4)],fill);
}

function drawFighter(p,originX,S){
  const r=rig(p,originX),out=[];
  const T=torsoShape(r,S.bulk?8.6:7.6,S.bulk?5.2:4.5,S.bulk?5.6:5.3);
  const limb=(seg,isArm,back)=>{
    const [a,b,c]=seg,col=back?S.dark:S;
    if(isArm){
      out.push(circ(add(a,[0,.3]),S.bulk?3.4:2.9,col.upperArm));
      out.push(capsule(a,b,S.bulk?5.6:5,3.9,col.upperArm,true,false));
      if(!back)out.push(sheen(a,b,4.6,col.sheenArm));
      out.push(capsule(b,c,4.1,3.3,col.foreArm,true,false));
      if(S.fins)for(const t of [.3,.5,.7]){const q=lerp(b,c,t),d=[c[0]-b[0],c[1]-b[1]],l=Math.hypot(...d),n=[d[1]/l,-d[0]/l];const s=(isArm&&(n[1]>0))?-1:1;out.push(poly([add(q,[n[0]*1.6*s,n[1]*1.6*s]),add(q,[n[0]*3.6*s+d[0]/l*1.6,n[1]*3.6*s+d[1]/l*1.6]),add(q,[n[0]*1.6*s+d[0]/l*2.6,n[1]*1.6*s+d[1]/l*2.6])],col.foreArm));}
      const hand=p.hand==='open'&&!back?ell(add(c,dir(p.armF[1],1.2)),2.2,2.9,col.hand,true,-p.armF[1]):circ(c,2.15,col.hand);
      out.push(hand);
      if(S.handPatch&&!back)out.push(circ(add(c,[-.4,-.6]),1.05,S.handPatch,false));
      if(!back&&p.hand==='open'&&S.gadget)out.push(S.gadget(add(c,dir(p.armF[1],2.4)),p.armF[1]));
    }else{
      out.push(capsule(a,b,S.bulk?6.8:6.3,4.7,col.thigh));
      if(!back)out.push(sheen(a,b,5.6,col.sheenLeg,-1));
      out.push(capsule(b,c,4.6,3.4,col.shin,true,false));
      out.push(boot(c,back?(p.footB||0):(p.footF||0),col.boot));
    }
  };
  if(S.cape)out.push(S.cape(r,p));
  limb(r.armB,true,true);
  limb(r.legB,false,true);
  // torso
  out.push(poly([...T.front,...T.back],S.torso));
  out.push(poly([...T.back.slice(0,3),T.at(10,-.2),T.at(0,-.8)],S.torsoShade,false));
  if(S.torsoDetail)out.push(S.torsoDetail(r,T,p));
  limb(r.legF,false,false);
  if(S.hipDetail)out.push(S.hipDetail(r,T,p));
  // head
  out.push(capsule(r.shoulderC,r.neck,3.6,3.4,S.neck));
  out.push(S.head(r,p));
  if(S.shoulderPads){for(const s of [r.armF[0]])out.push(circ(add(s,[0,-.4]),3.1,S.shoulderPads));}
  limb(r.armF,true,false);
  if(S.front)out.push(S.front(r,p));
  return {svg:out.join(''),r};
}

// ---------------------------------------------------------------- characters
const tone=(c,m)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(c.slice(i,i+2),16)*m))).toString(16).padStart(2,'0')).join('');
function palette(base){const dark={};for(const[k,v]of Object.entries(base))dark[k]=typeof v==='string'?tone(v,.68):v;return {...base,dark};}

function batHead(eye,cowl,skin,jaw=true){
  return (r,p)=>{
    const c=r.headC,a=p.lean+(p.head||0),R=q=>{const t=rad(a),x=q[0],y=q[1];return add(c,[x*Math.cos(t)-y*Math.sin(t),x*Math.sin(t)+y*Math.cos(t)]);};
    let s=poly([R([-3.2,-3.2]),R([-2.8,-7.4]),R([-1.4,-4.6]),R([1.2,-4.8]),R([2.4,-7.6]),R([3.4,-3.4])],cowl);
    s+=ell(c,4.3,4.9,cowl,true,a);
    if(jaw)s+=poly([R([.6,1.2]),R([4.3,.9]),R([4.1,3.6]),R([2.2,4.9]),R([.2,4.4])],skin,false)+line(R([2.3,3.1]),R([3.8,2.9]),.55,'#6b3b2a');
    s+=poly([R([1.4,-1.4]),R([4,-1.6]),R([3.6,-.5]),R([1.6,-.4])],eye,false);
    return s;
  };
}
function batCape(col,inner){
  return (r,p)=>{
    const s=r.shoulderC,sway=(p.cape||0),hem=Math.min(r.legF[1][1],r.legB[1][1])+6;
    const back=[s[0]-9-sway*1.2,hem-sway*.5],mid=[s[0]-3-sway*.6,hem+2];
    const pts=[[s[0]+3,s[1]-2.6],[s[0]-4.2,s[1]-1.6],[s[0]-7.4-sway*.4,s[1]+8],back,
      lerp(back,mid,.33),[lerp(back,mid,.5)[0],lerp(back,mid,.5)[1]-2.4],lerp(back,mid,.66),mid,[mid[0]+2.6,mid[1]-2.2],[s[0]+2,hem-3],[s[0]+2.8,s[1]+4]];
    return poly(pts,col)+poly([[s[0]-4,s[1]+1],[s[0]-6.6-sway*.4,s[1]+9],[back[0]+2.2,back[1]-2],[s[0]-1.5,hem-4]],inner,false);
  };
}
function batSymbol(T,fill,y=L.torso-4.6,stroke){
  const a=(t,w)=>T.at(y+t*1.3,w*1.25+.8);
  const pts=[a(0,-3.4),a(1.3,-2.2),a(.8,-1),a(1.8,-.4),a(1.3,0),a(1.8,.4),a(.8,1),a(1.3,2.2),a(0,3.4),a(-.7,2),a(-1.4,.6),a(-.4,0),a(-1.4,-.6),a(-.7,-2)];
  return (stroke?poly(pts.map(q=>q),stroke,false):'')+poly(pts,fill,false);
}
function batarang(c,ang){
  const d=dir(ang,1),n=[-d[1],d[0]],P=(u,v)=>add(c,[d[0]*u+n[0]*v,d[1]*u+n[1]*v]);
  return poly([P(0,-4.2),P(1.2,-2),P(.4,-.8),P(1.4,0),P(.4,.8),P(1.2,2),P(0,4.2),P(-.9,1.2),P(-.5,0),P(-.9,-1.2)],'#1b1d24');
}

const FORMS={
  batman:palette({
    upperArm:'#8b909b',foreArm:'#1b1e27',hand:'#1b1e27',thigh:'#8b909b',shin:'#7b808b',boot:'#15171e',
    sheenArm:'#b6bbc6',sheenLeg:'#aab0bb',neck:'#1b1e27',torso:'#8b909b',torsoShade:'#6a6f7a',fins:true,
    head:batHead('#f2f6ff','#1b1e27','#e0ab86'),cape:batCape('#1a1d26','#2c3140'),gadget:batarang,
    torsoDetail:(r,T)=>batSymbol(T,'#12141b'),
    hipDetail:(r,T)=>poly([T.at(2.1,5),T.at(-1.8,5.3),T.at(-1.8,-5.4),T.at(2.1,-5.2)],'#1b1e27',false)+poly([T.at(4.2,5.1),T.at(1.2,5.3),T.at(1.2,-5.3),T.at(4.2,-5.1)],'#e7c23c')+[-3,-.6,1.8,4].map(w=>circ(T.at(2.6,w),.55,'#a8801e',false)).join(''),
  }),
  batman_ssj:palette({
    upperArm:'#56606d',foreArm:'#2a3039',hand:'#2a3039',thigh:'#56606d',shin:'#3c434e',boot:'#1a1e25',bulk:true,
    sheenArm:'#8e9aaa',sheenLeg:'#7f8b9a',neck:'#1e2229',torso:'#4b545f',torsoShade:'#343b45',fins:true,shoulderPads:'#6d7887',
    head:batHead('#3ff2ff','#232830','#d9a482'),cape:batCape('#101217','#232833'),gadget:batarang,
    torsoDetail:(r,T)=>poly([T.at(L.torso-.5,6.6),T.at(L.torso-6.5,5),T.at(L.torso-6.5,-5.5),T.at(L.torso-.5,-7)],'#626c79',false)+batSymbol(T,'#0c0e12',L.torso-4.2,'#3ff2ff')+line(T.at(7.5,3.6),T.at(7.5,-3.8),.7,'#2b313a')+line(T.at(10.5,4),T.at(10.5,-4.2),.7,'#2b313a'),
    hipDetail:(r,T)=>poly([T.at(4.2,5.3),T.at(1,5.5),T.at(1,-5.5),T.at(4.2,-5.3)],'#2a3039')+[-3.2,-.6,2,4.4].map(w=>poly([T.at(3.6,w-.7),T.at(1.6,w-.7),T.at(1.6,w+.7),T.at(3.6,w+.7)],'#3ff2ff',false)).join(''),
  }),
};

function spiderHead(base,eye,web){
  return (r,p)=>{
    const c=r.headC,a=p.lean+(p.head||0),R=q=>{const t=rad(a),x=q[0],y=q[1];return add(c,[x*Math.cos(t)-y*Math.sin(t),x*Math.sin(t)+y*Math.cos(t)]);};
    let s=ell(c,4.2,4.8,base,true,a);
    if(web)s+=line(R([-.6,-4.4]),R([-.2,4.4]),.5,web)+line(R([-3.9,1.6]),R([3.9,2.2]),.5,web);
    s+=`<g stroke="${INK}" stroke-width="1.1" paint-order="stroke">`+poly([R([.6,-3.2]),R([4.2,-1.9]),R([4.1,1.3]),R([1.5,1])],eye,false)+'</g>';
    return s;
  };
}
/** Chest emblem in torso space (t along the spine, w across, + = chest front). */
function spider(T,col,big=false){
  const c=big?[L.torso-6.2,1]:[L.torso-6.4,1.2],at=(t,w)=>T.at(c[0]+t,c[1]+w),lw=big?1.05:.95;
  const legs=big?[[5.6,4.6],[2.6,5.8],[-2.2,5.6],[-5.4,4.4]]:[[2.3,2.5],[.8,2.9],[-.8,2.9],[-2.3,2.4]];
  let o='';
  for(const[t,w]of legs)for(const s of[1,-1])o+=line(at(t*.25,0),at(t*.7,w*s*.7),lw,col)+line(at(t*.7,w*s*.7),at(t,w*s),lw,col);
  const body=T.at(c[0],c[1]),axis=Math.atan2(T.at(1,0)[0]-T.at(0,0)[0],-(T.at(1,0)[1]-T.at(0,0)[1]))*180/Math.PI;
  return o+ell(body,big?1.35:.95,big?2.5:1.7,col,false,axis)+circ(at(big?2.9:2,0),big?1:.75,col,false);
}
function webShooter(c,ang){const d=dir(ang,1);return line(c,add(c,[d[0]*2.2,d[1]*2.2]),.7,'#e9eef7')+circ(add(c,[d[0]*2.6,d[1]*2.6]),1.2,'#e9eef7',false);}

Object.assign(FORMS,{
  spiderman:palette({
    upperArm:'#d3272b',foreArm:'#d3272b',hand:'#d3272b',thigh:'#2356b8',shin:'#2356b8',boot:'#d3272b',
    sheenArm:'#f2585a',sheenLeg:'#4a7ae0',neck:'#d3272b',torso:'#d3272b',torsoShade:'#2356b8',
    head:spiderHead('#d3272b','#f3f7ff','#8c1519'),gadget:webShooter,
    torsoDetail:(r,T)=>spider(T,'#101014'),
    hipDetail:(r,T)=>poly([T.at(4.4,5.1),T.at(3.2,5.2),T.at(3.2,-5.2),T.at(4.4,-5.1)],'#b91e22',false),
  }),
  spiderman_ssj:palette({
    upperArm:'#232633',foreArm:'#232633',hand:'#232633',thigh:'#232633',shin:'#232633',boot:'#171922',
    sheenArm:'#6878a6',sheenLeg:'#56648c',neck:'#232633',torso:'#232633',torsoShade:'#161821',handPatch:'#f3f5fa',
    head:spiderHead('#232633','#f7f9ff',null),gadget:webShooter,
    torsoDetail:(r,T)=>line(T.at(L.torso-1,5.6),T.at(6,4),.9,'#56648c')+spider(T,'#f3f5fa',true),
  }),
});

// ---------------------------------------------------------------- sheet
export function sheetSvg(key){
  const S=FORMS[key],parts=[],sockets={};
  POSES.forEach((p,i)=>{
    const col=i%COLS,row=Math.floor(i/COLS),ox=col*CELL_W+CELL_W/2-8,oy=row*CELL_H+(CELL_H-68);
    const {svg,r}=drawFighter(p,ox,S);
    parts.push(`<g transform="translate(0 ${oy})">${svg}</g>`);
    const hand=add(r.armF[2],[0,oy]);sockets[i]={hand:[hand[0]*K,hand[1]*K],head:(r.headC[0])*K};
  });
  return {svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${CELL_W*COLS*K}" height="${CELL_H*ROWS*K}" shape-rendering="crispEdges"><g transform="scale(${K})">${parts.join('')}</g></svg>`,sockets};
}

const manifestFile='docs/art/roster/manifest.json',posesFile='game/sprites/combat-poses.json';
const args=process.argv.slice(2);
if(args[0]==='--sockets'){
  // Convert source-space hand points to untrimmed 192 x 128 frame points, as the packer placed them.
  const manifest=JSON.parse(await readFile(manifestFile,'utf8')),poses=JSON.parse(await readFile(posesFile,'utf8'));
  for(const key of Object.keys(FORMS)){
    const e=manifest.entries.find(x=>x.key===key),{sockets}=sheetSvg(key);
    const scale=64/Math.max(...e.frames.map(fr=>fr.height));
    const map=(frame,[x,y])=>{const fr=e.frames[frame];return [Math.round((x-fr.x)*scale+fr.atlasX-frame*192),Math.round((y-fr.y)*scale+fr.atlasY)];};
    poses[key]={hand:map(8,sockets[8].hand),cast:map(11,sockets[11].hand),special:11,charge:0};
    console.log(key,poses[key]);
  }
  // Keep the reviewed one-line-per-form layout of the shared pose table.
  await writeFile(posesFile,'{\n'+Object.entries(poses).map(([k,v])=>`  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')+'\n}\n');
}else{
  const manifest=JSON.parse(await readFile(manifestFile,'utf8'));
  for(const key of args.length?args:Object.keys(FORMS)){
    const {svg,sockets}=sheetSvg(key),source=`docs/art/roster/${key}-source.png`;
    await sharp(Buffer.from(svg)).png().toFile(source);
    const e=manifest.entries.find(x=>x.key===key);
    Object.assign(e,{status:'drawn',source,asset:`game/assets/roster/${key}-v1.png`,anchors:Object.values(sockets).map(s=>s.head)});
    delete e.reason;
    console.log(`${key}: drew ${source}`);
  }
  await writeFile(manifestFile,JSON.stringify(manifest,null,2)+'\n');
}
