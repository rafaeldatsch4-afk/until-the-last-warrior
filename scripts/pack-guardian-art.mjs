// Pack the approved 28-pose sheets without changing the legacy 12-frame contract.
// Usage: node scripts/pack-guardian-art.mjs [key ...]   (no keys = all four)
// The 12-column layout stays within the existing roster's mobile texture width.
import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const manifestPath='docs/art/roster/manifest.json';
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
const names={batman:'Batman',batman_ssj:'Batman Dark Knight',spiderman:'Homem-Aranha',spiderman_ssj:'Homem-Aranha de Ferro'};
const only=process.argv.slice(2);
// Height of Spider-Man's standing poses (punch, guard, web) in his source sheets; rendered at 72 px.
const SPIDER_STANDING_PX=347;
function isolatePoses(data,info,key) {
 const seen=new Uint8Array(info.width*info.height),components=[];
 for(let p=0;p<seen.length;p++) {
  if(seen[p]||data[p*4+3]<=32)continue;
  const pixels=[p];seen[p]=1;let x0=info.width,y0=info.height,x1=0,y1=0;
  for(let i=0;i<pixels.length;i++) {
   const q=pixels[i],x=q%info.width,y=Math.floor(q/info.width);
   x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   for(const n of [x>0?q-1:-1,x<info.width-1?q+1:-1,q-info.width,q+info.width])
    if(n>=0&&n<seen.length&&!seen[n]&&data[n*4+3]>32){seen[n]=1;pixels.push(n);}
  }
  components.push({pixels,x0,y0,x1,y1});
 }
 components.sort((a,b)=>b.pixels.length-a.pixels.length);
 const bodies=components.slice(0,28);
 if(bodies.length!==28||bodies[27].pixels.length<bodies[0].pixels.length*.2)throw Error(`${key}: cannot isolate 28 poses`);
 bodies.sort((a,b)=>a.y0-b.y0);
 for(let r=0;r<7;r++)bodies.splice(r*4,4,...bodies.slice(r*4,r*4+4).sort((a,b)=>a.x0-b.x0));
 return bodies;
}
function gridCells(data,info) {
 const cw=info.width/4,ch=info.height/7,bodies=[];
 for(let f=0;f<28;f++) {
  const cx=(f%4)*cw,cy=Math.floor(f/4)*ch,pixels=[];let x0=info.width,y0=info.height,x1=0,y1=0;
  for(let y=cy;y<cy+ch;y++)for(let x=cx;x<cx+cw;x++){const p=y*info.width+x;if(data[p*4+3]<=32)continue;pixels.push(p);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  bodies.push({pixels,x0,y0,x1,y1,anchor:cx+cw/2});
 }
 return bodies;
}
for(const [key,name] of Object.entries(names)) {
 if(only.length&&!only.includes(key))continue;
 const source=`docs/art/roster/${key}-source.png`,asset=`game/assets/roster/${key}-v1.png`;
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 // Spider-Man sheets are composed on an exact 4x7 grid with each head on its cell's centre line,
 // so frames are whole cells (detached mechanical-arm tips and sparks stay) and share one scale.
 const grid=key.startsWith('spiderman');
 const bodies=grid?gridCells(data,info):isolatePoses(data,info,key);
 // Idle body determines scale, so auras do not shrink the body in the other poses.
 const scale=grid?72/SPIDER_STANDING_PX:64/Math.max(...bodies.slice(0,4).map(b=>b.y1-b.y0+1)),layers=[],frames=[];
 for(const [f,b] of bodies.entries()) {
  const bw=b.x1-b.x0+1,bh=b.y1-b.y0+1,raw=Buffer.alloc(bw*bh*4);
  let hx=0,hn=0;
  for(const p of b.pixels){const x=p%info.width,y=Math.floor(p/info.width);data.copy(raw,((y-b.y0)*bw+x-b.x0)*4,p*4,p*4+4);if(y<b.y0+bh*.2){hx+=x;hn++;}}
  if(b.anchor!==undefined){hx=b.anchor;hn=1;}
  const w=Math.round(bw*scale),h=Math.round(bh*scale);
  const anchor=hx/hn,left=96-Math.round((anchor-b.x0)*scale),top=128-h;
  if(left<1||left+w>=192||top<1)throw Error(`${key} ${f}: clipped frame`);
  const input=await sharp(raw,{raw:{width:bw,height:bh,channels:4}}).resize(w,h,{kernel:'nearest'}).png().toBuffer();
  layers.push({input,left:(f%12)*192+left,top:Math.floor(f/12)*128+top});
  frames.push({sourceFrame:f,x:b.x0,y:b.y0,width:bw,height:bh,anchor,atlasX:(f%12)*192+left,atlasY:Math.floor(f/12)*128+top});
 }
 await mkdir('game/assets/roster',{recursive:true});
 await sharp({create:{width:2304,height:384,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).png().toFile(asset);
 const entry=manifest.entries.find(e=>e.key===key);
 Object.assign(entry,{name,description:`${name}: arte de fã (pixel art de anime)`,source,asset,status:'packed',frameCount:28,frames,animations:{transform:[12,15],charge:[16,19],defend:[20,23],dash:[24,27]}});
 delete entry.reason;
 console.log(`${key}: 28 isolated frames`);
}
await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
