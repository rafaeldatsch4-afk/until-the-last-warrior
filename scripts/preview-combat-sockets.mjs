// Review runtime casting frames and their measured muzzle positions without modifying art.
const {createCanvas,loadImage}=await import('@napi-rs/canvas').catch(()=>import(`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas/index.js`));
import {build} from 'esbuild';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const built=await build({entryPoints:['game/sprites/CombatPoses.ts'],bundle:true,write:false,format:'esm'});
const {COMBAT_POSES}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const entries=JSON.parse(await readFile('docs/art/roster/manifest.json','utf8')).entries.filter(e=>e.asset);
const out=process.argv[2]||'/tmp/combat-sockets';await mkdir(out,{recursive:true});
for(let page=0;page<Math.ceil(entries.length/10);page++){
 const group=entries.slice(page*10,page*10+10),canvas=createCanvas(960,group.length*270),ctx=canvas.getContext('2d');ctx.fillStyle='#24334b';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;
 for(const [row,e]of group.entries()){
  const art=await loadImage(e.asset),pose=COMBAT_POSES[e.key];
  ctx.fillStyle='white';ctx.font='16px sans-serif';ctx.fillText(e.key,5,row*270+20);
  for(const [col,f]of [8,pose.special].entries()){
   const x=190+col*384,y=row*270;ctx.drawImage(art,f*192,0,192,128,x,y,384,256);
   const [sx,sy]=f===11?pose.cast:pose.hand;ctx.strokeStyle='#00ff80';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x+sx*2,y+sy*2,5,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle='white';ctx.fillText(`${f} (${sx}, ${sy})`,x,y+267);
  }
 }
 await writeFile(`${out}/sockets-${page}.png`,canvas.toBuffer('image/png'));
}
