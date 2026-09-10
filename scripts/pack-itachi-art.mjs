// Rebuild the runtime atlas from the source art. Usage: node scripts/pack-itachi-art.mjs
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
const source=process.argv[2] || 'docs/art/itachi-source.png';
const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
// Connected silhouettes keep the extended sword out of the adjacent guard frame.
const seen=new Uint8Array(info.width*info.height),components=[];
for(let p=0;p<seen.length;p++){
 if(seen[p]||data[p*4+3]<=32)continue;
 const pixels=[p];seen[p]=1;let x0=info.width,y0=info.height,x1=0,y1=0;
 for(let i=0;i<pixels.length;i++){
  const t=pixels[i],x=t%info.width,y=Math.floor(t/info.width);
  x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
  for(const n of[x>0?t-1:-1,x<info.width-1?t+1:-1,t-info.width,t+info.width])
   if(n>=0&&n<seen.length&&!seen[n]&&data[n*4+3]>32){seen[n]=1;pixels.push(n);}
 }
 components.push({pixels,x0,y0,x1,y1});
}
const bodies=components.filter(c=>c.pixels.length>10000).sort((a,b)=>Math.floor(a.y0/(info.height/3))-Math.floor(b.y0/(info.height/3))||a.x0-b.x0);
if(bodies.length!==12)throw new Error(`Expected 12 separate silhouettes, found ${bodies.length}`);
const scale=64/Math.max(...bodies.map(b=>b.y1-b.y0+1)),layers=[],preview=[],boxes=[];
for(let f=0;f<12;f++){
 const b=bodies[f],bw=b.x1-b.x0+1,bh=b.y1-b.y0+1,raw=Buffer.alloc(bw*bh*4);
 for(const p of b.pixels){const q=((Math.floor(p/info.width)-b.y0)*bw+p%info.width-b.x0)*4;data.copy(raw,q,p*4,p*4+4);}
 const w=Math.round(bw*scale),h=Math.round(bh*scale);
 const pixels=await sharp(raw,{raw:{width:bw,height:bh,channels:4}}).resize(w,h,{kernel:'nearest'}).png().toBuffer();
 // Fixed body anchor; explicit attack head positions exclude the raised sword.
 const headX=f===8?187:f===9?510:(b.x0+b.x1)/2;
 const offset=Math.round((headX-b.x0)*scale),left=96-offset,top=128-h;
 if(left<0||left+w>192)throw new Error(`Frame ${f} exceeds the game frame`);
 layers.push({input:pixels,left:f*192+left,top});
 preview.push({input:await sharp(pixels).resize(w*4,h*4,{kernel:'nearest'}).png().toBuffer(),left:f%4*384+192-offset*4,top:Math.floor(f/4)*300+280-h*4});
 boxes.push({x:b.x0,y:b.y0,width:bw,height:bh,atlasX:f*192+left,atlasY:top});
}
await mkdir('game/assets',{recursive:true});await mkdir('docs',{recursive:true});
await sharp({create:{width:2304,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).png().toFile('game/assets/itachi-pixel-v3.png');
await sharp({create:{width:1536,height:900,channels:4,background:'#1d2635'}}).composite(preview).png().toFile('docs/itachi-pixel-v3-preview.png');
await writeFile('docs/itachi-pixel-v3-frames.json',JSON.stringify({frameWidth:192,frameHeight:128,frames:12,order:['idle 0','idle 1','idle 2','idle 3','walk 0','walk 1','walk 2','walk 3','attack 0','attack 1','defend','charge'],sourceBoxes:boxes},null,2)+'\n');
console.log('Packed 12 isolated transparent frames, baseline 128, unchanged 192x128 frame dimensions.');
