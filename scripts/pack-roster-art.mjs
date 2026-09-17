// Normalize reviewed generated art to the existing Phaser animation contract.
// Usage: node scripts/pack-roster-art.mjs character_key [...keys]
import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const file='docs/art/roster/manifest.json',manifest=JSON.parse(await readFile(file,'utf8'));
for(const key of process.argv.slice(2)){
 const entry=manifest.entries.find(e=>e.key===key);if(!entry?.source)throw new Error(`${key}: no source`);
 const {data,info}=await sharp(entry.source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const seen=new Uint8Array(info.width*info.height),cs=[];
 for(let p=0;p<seen.length;p++){
  if(seen[p]||data[p*4+3]<=32)continue;
  const pixels=[p];seen[p]=1;let x0=info.width,y0=info.height,x1=0,y1=0;
  for(let i=0;i<pixels.length;i++){
   const q=pixels[i],x=q%info.width,y=Math.floor(q/info.width);
   x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   for(const n of [x>0?q-1:-1,x<info.width-1?q+1:-1,q-info.width,q+info.width])
    if(n>=0&&n<seen.length&&!seen[n]&&data[n*4+3]>32){seen[n]=1;pixels.push(n);}
  }
  cs.push({pixels,x0,y0,x1,y1});
 }
 cs.sort((a,b)=>b.pixels.length-a.pixels.length);
 const bodies=cs.slice(0,12);
 if(bodies.length!==12||bodies[11].pixels.length<bodies[0].pixels.length*.2)throw new Error(`${key}: cannot isolate 12 bodies (${bodies.map(b=>b.pixels.length).join(',')}); inspect overlap before packing`);
 bodies.sort((a,b)=>a.y0-b.y0);for(let row=0;row<3;row++)bodies.splice(row*4,4,...bodies.slice(row*4,row*4+4).sort((a,b)=>a.x0-b.x0));
 const scale=(entry.targetHeight||64)/Math.max(...bodies.map(b=>b.y1-b.y0+1));
 const layers=[],preview=[],frames=[];
 for(let f=0;f<12;f++){
  const sourceFrame=entry.frameOrder?.[f]??f,b=bodies[sourceFrame],bw=b.x1-b.x0+1,bh=b.y1-b.y0+1,raw=Buffer.alloc(bw*bh*4);
  let hx=0,hn=0;
  for(const p of b.pixels){const x=p%info.width,y=Math.floor(p/info.width),q=((y-b.y0)*bw+x-b.x0)*4;data.copy(raw,q,p*4,p*4+4);if(y<b.y0+bh*.2){hx+=x;hn++;}}
  const w=Math.max(1,Math.round(bw*scale)),h=Math.max(1,Math.round(bh*scale));
  const anchor=entry.anchors?.[sourceFrame]??(hx/hn),offset=Math.round((anchor-b.x0)*scale),left=96-offset,top=128-h;
  if(left<1||left+w>191)throw new Error(`${key} frame ${f}: weapon exceeds frame; review scale/anchor`);
  const pixels=await sharp(raw,{raw:{width:bw,height:bh,channels:4}}).resize(w,h,{kernel:'nearest'}).png().toBuffer();
  layers.push({input:pixels,left:f*192+left,top});
  const zoom=entry.previewZoom??((entry.targetHeight||64)>70?2:4);
  preview.push({input:await sharp(pixels).resize(w*zoom,h*zoom,{kernel:'nearest'}).png().toBuffer(),left:f%4*384+192-offset*zoom,top:Math.floor(f/4)*300+280-h*zoom});
  frames.push({sourceFrame,x:b.x0,y:b.y0,width:bw,height:bh,anchor,atlasX:f*192+left,atlasY:top});
 }
 await mkdir('game/assets/roster',{recursive:true});
 await sharp({create:{width:2304,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).png().toFile(entry.asset);
 await sharp({create:{width:1536,height:900,channels:4,background:'#24334b'}}).composite(preview).png().toFile(`docs/art/roster/${key}-preview.png`);
 entry.status='packed';entry.frames=frames;
 console.log(`${key}: packed 12 frames`);
 await writeFile(file,JSON.stringify(manifest,null,2)+'\n');
}
