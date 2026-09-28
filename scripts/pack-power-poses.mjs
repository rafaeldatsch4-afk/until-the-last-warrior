import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
const source='docs/art/roster/goku-power-poses-source.png';
const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const boxes=[];
for(let row=0;row<3;row++)for(let col=0;col<2;col++){
  const left=col*info.width/2,top=row*info.height/3;
  const seen=new Set();let largest=[];
  for(let y=top;y<top+info.height/3;y++)for(let x=left;x<left+info.width/2;x++){
    const p=y*info.width+x;if(seen.has(p)||data[p*4+3]<=100)continue;
    const component=[p];seen.add(p);
    for(let n=0;n<component.length;n++){
      const q=component[n],qx=q%info.width,qy=Math.floor(q/info.width);
      for(const next of [qx>left?q-1:-1,qx<left+info.width/2-1?q+1:-1,qy>top?q-info.width:-1,qy<top+info.height/3-1?q+info.width:-1]){
        if(next>=0&&!seen.has(next)&&data[next*4+3]>100){seen.add(next);component.push(next);}
      }
    }
    if(component.length>largest.length)largest=component;
  }
  let x0=info.width,y0=info.height,x1=0,y1=0;
  for(const p of largest){const x=p%info.width,y=Math.floor(p/info.width);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  boxes.push({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1});
}
const scale=64/Math.max(...boxes.filter((_,i)=>i%2===0).map(b=>b.height)),resolution=3;
await mkdir('game/assets/poses',{recursive:true});
const entries=[];
for(let i=0;i<6;i++){
  const key=['goku','goku_ssj','goku_ui'][Math.floor(i/2)]+'_'+(i%2?'genki':'ki'),box=boxes[i];
  // Raised hands extend the silhouette; retain the body's size instead of
  // shrinking the torso to fit the same head-to-foot height as a relaxed pose.
  const poseScale=scale*(i%2?1.16:1);
  const width=Math.round(box.width*poseScale*resolution),height=Math.round(box.height*poseScale*resolution);
  const pixels=await sharp(source).extract(box).resize(width,height,{kernel:'lanczos3'}).png().toBuffer();
  const asset='game/assets/poses/'+key+'.png';
  await sharp({create:{width:192*resolution,height:128*resolution,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite([{input:pixels,left:Math.round(96*resolution-width/2),top:128*resolution-height}]).png().toFile(asset);
  entries.push({key,asset,source,box,resolution});
}
await writeFile('docs/art/roster/power-poses.json',JSON.stringify({entries},null,2)+'\n');
