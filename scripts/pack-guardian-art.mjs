// Pack the four approved 28-pose sheets without changing the legacy 12-frame contract.
// The 12-column layout stays within the existing roster's mobile texture width.
import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const manifestPath='docs/art/roster/manifest.json';
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
const names={batman:'Sentinela Noturna',batman_ssj:'Bastião',spiderman:'Vetor',spiderman_ssj:'Linha de Fuga'};
for(const [key,name] of Object.entries(names)) {
 const source=`docs/art/roster/${key}-source.png`,asset=`game/assets/roster/${key}-v1.png`;
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 // Reviewed separator: Vetor's transformation aura touches the preceding cast pose.
 // No body pixels cross this separator; retain the original source unchanged.
 if(key==='spiderman')for(let x=0;x<info.width;x++)data[(667*info.width+x)*4+3]=0;
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
 // Idle body determines scale, so auras do not shrink the body in the other poses.
 const scale=64/Math.max(...bodies.slice(0,4).map(b=>b.y1-b.y0+1)),layers=[],frames=[];
 for(const [f,b] of bodies.entries()) {
  const bw=b.x1-b.x0+1,bh=b.y1-b.y0+1,raw=Buffer.alloc(bw*bh*4);
  let hx=0,hn=0;
  for(const p of b.pixels){const x=p%info.width,y=Math.floor(p/info.width);data.copy(raw,((y-b.y0)*bw+x-b.x0)*4,p*4,p*4+4);if(y<b.y0+bh*.2){hx+=x;hn++;}}
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
 Object.assign(entry,{name,description:`${name}: arte original aprovada em 29/09/2026`,source,asset,status:'packed',frameCount:28,frames,animations:{transform:[12,15],charge:[16,19],defend:[20,23],dash:[24,27]}});
 delete entry.reason;
 console.log(`${key}: 28 isolated frames`);
}
await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
