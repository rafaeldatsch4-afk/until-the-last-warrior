// Packs the reviewed generated wardrobe into transparent, independently tintable layers.
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
const root = 'docs/art/custom';
const out = 'game/assets/custom';
await mkdir(out, { recursive: true });
const groups = {
  torso: { cols: 5, rows: 2, ids: ['goku','spiderman','jotaro','vegeta','saitama','chapolim','muscle','naruto','sasuke','luffy'] },
  legs: { cols: 3, rows: 3, ids: ['goku','spiderman','jotaro','saitama','vegeta','chapolim','naruto','sasuke','luffy'] },
  feet: { cols: 3, rows: 3, ids: ['goku','spiderman','chapolim','saitama','vegeta','jotaro','naruto','sasuke','luffy'] },
  accessory: { cols: 3, rows: 2, ids: ['straw_hat','sword','headband','cape','scouter','scarf'],
    boxes: [[20,130,460,295],[498,230,600,132],[1100,172,430,244],[25,465,550,499],[620,602,370,240],[1038,560,480,395]] },
};
const manifest = { version: 1, generator: 'built-in image_gen', entries: [] };
async function pack(input, box, key) {
  const { data, info } = await sharp(input).extract({left:box[0],top:box[1],width:box[2],height:box[3]}).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0=info.width,y0=info.height,x1=-1,y1=-1;
  // Alpha fringe is excluded, not replaced with a painted background.
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
    const i=(y*info.width+x)*4;
    data[i+3]=data[i+3]>100?255:0;
    if(data[i+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  }
  if(x1<0)throw new Error(`Empty generated layer: ${key}`);
  const asset=`${out}/${key}.png`;
  await sharp(data,{raw:info}).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1})
    .resize({width:128,height:128,fit:'inside',kernel:'nearest'}).png().toFile(asset);
  manifest.entries.push({key,asset,source:input,sourceBox:box});
}
for(const [group,config] of Object.entries(groups)){
  const input=`${root}/${group}-source.png`,meta=await sharp(input).metadata();
  for(let i=0;i<config.ids.length;i++){
    const x=Math.round(i%config.cols*meta.width/config.cols),y=Math.round(Math.floor(i/config.cols)*meta.height/config.rows);
    const box=config.boxes?.[i]??[x,y,Math.round((i%config.cols+1)*meta.width/config.cols)-x,Math.round((Math.floor(i/config.cols)+1)*meta.height/config.rows)-y];
    await pack(input,box,`${group}-${config.ids[i]}`);
  }
}
await pack(`${root}/base-source.png`,[455,205,170,206],'base-head');
// Reuse already-reviewed roster artwork for matching existing hairstyles/hoods.
// The generation service declined the new portrait sheet; these remain source-attributed.
for (const [id,box] of Object.entries({goku:[84,64,24,18],vegeta:[88,64,18,21],jotaro:[88,64,18,18],chapolim:[91,66,18,21]})) {
  const source=`game/assets/roster/${id}-v1.png`;
  const {data,info}=await sharp(source).extract({left:box[0],top:box[1],width:box[2],height:box[3]}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
    const i=(y*info.width+x)*4,r=data[i],g=data[i+1],b=data[i+2];
    if(!data[i+3])continue;
    // This crop reaches the neck: exclude the orange gi shoulder at its lower-left edge.
    if(id==='goku' && y>=13 && (x<9 || (r>g*1.5 && g>b*1.5 && b<60) || b>r*1.4)) {
      data[i+3]=0;continue;
    }
    if(id==='chapolim' && r>g*1.5 && r>b*1.5){ const v=Math.min(245,90+r*.7);data[i]=data[i+1]=data[i+2]=v; }
    else if(id==='chapolim' && r>110&&g>80&&b<80){data[i]=0;data[i+1]=200;data[i+2]=230;}
    else if(id!=='chapolim'&&r<75&&g<75&&b<75&&x>0&&x<info.width-1&&y>0&&y<info.height-1
      &&data[i-4+3]&&data[i+4+3]&&data[i-info.width*4+3]&&data[i+info.width*4+3]){
      data[i]=data[i+1]=data[i+2]=Math.min(230,100+Math.max(r,g,b)*2);
    }
  }
  const asset=`${out}/head-${id}.png`;
  await sharp(data,{raw:info}).png().toFile(asset);
  manifest.entries.push({key:`head-${id}`,asset,source,sourceBox:box,reusedRosterArt:true});
}
await writeFile(`${root}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
console.log(`Packed ${manifest.entries.length} existing wardrobe layers.`);
