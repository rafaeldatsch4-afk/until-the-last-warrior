// Render the actual deterministic Phaser drawing commands without a browser.
import sharp from 'sharp';
import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.argv[2]||'/tmp/special-effects';await mkdir(out,{recursive:true});
const result=await build({entryPoints:['game/battle/vfx/SpecialEffects.ts'],bundle:true,write:false,format:'esm'});
const {drawSpecialFrame}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const atlas=await sharp('game/assets/itachi-pixel-v3.png').extract({left:0,top:0,width:192,height:128}).resize(576,384,{kernel:'nearest'}).png().toBuffer();
const sprite=`<image x="192" y="18" width="576" height="384" href="data:image/png;base64,${atlas.toString('base64')}"/>`;
function render(kind,time){let fill='#000',stroke='#000',fa=1,sa=1,sw=1,parts=[];const c=n=>'#'+n.toString(16).padStart(6,'0');
 const g={clear(){parts=[];return this;},fillStyle(n,a=1){fill=c(n);fa=a;return this;},lineStyle(w,n,a=1){sw=w;stroke=c(n);sa=a;return this;},
 fillCircle(x,y,r){parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${fa}"/>`);return this;},
 strokeCircle(x,y,r){parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${stroke}" stroke-width="${sw}" opacity="${sa}"/>`);return this;},
 strokeEllipse(x,y,w,h){parts.push(`<ellipse cx="${x}" cy="${y}" rx="${w/2}" ry="${h/2}" fill="none" stroke="${stroke}" stroke-width="${sw}" opacity="${sa}"/>`);return this;},
 lineBetween(x,y,a,b){parts.push(`<path d="M${x},${y} L${a},${b}" stroke="${stroke}" stroke-width="${sw}" opacity="${sa}"/>`);return this;},
 fillRect(x,y,w,h){parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" opacity="${fa}"/>`);return this;},
 fillPoints(p){parts.push(`<polygon points="${p.map(q=>q.x+','+q.y).join(' ')}" fill="${fill}" opacity="${fa}"/>`);return this;},
 strokePoints(p){parts.push(`<polyline points="${p.map(q=>q.x+','+q.y).join(' ')}" fill="none" stroke="${stroke}" stroke-width="${sw}" opacity="${sa}"/>`);return this;},
 fillTriangle(x,y,a,b,c,d){return this.fillPoints([{x,y},{x:a,y:b},{x:c,y:d}]);}};
 drawSpecialFrame(g,{kind,time,x:480,y:310,color:0xff6534,direction:1,low:false});
 const effects=parts.join(''),behind=kind==='tsukuyomi'&&time<1500;
 return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="960" height="540" fill="#17273c"/><path d="M0 404H960" stroke="#758098"/><text x="36" y="45" fill="#eef4ff" font-family="sans-serif" font-size="24">${kind.toUpperCase()} · ${time} ms</text>${behind?effects+sprite:sprite+effects}</svg>`);
}
for(let i=0;i<56;i++){
 const time=i*50;
 const a=await sharp(render('amaterasu',Math.min(time,1600))).resize(480,270).png().toBuffer();
 const b=await sharp(render('tsukuyomi',time)).resize(480,270).png().toBuffer();
 await sharp({create:{width:960,height:270,channels:4,background:'#17273c'}}).composite([{input:a,left:0,top:0},{input:b,left:480,top:0}]).png().toFile(`${out}/frame-${String(i).padStart(3,'0')}.png`);
}
const layers=[];for(const [j,t]of [200,700,1050,1700,2250].entries())for(const [i,k]of ['amaterasu','tsukuyomi'].entries())layers.push({input:await sharp(render(k,t)).resize(384,216).png().toBuffer(),left:j*384,top:i*216});
await sharp({create:{width:1920,height:432,channels:4,background:'#17273c'}}).composite(layers).png().toFile(`${out}/timeline.png`);
console.log(`Rendered production effects to ${out}`);
