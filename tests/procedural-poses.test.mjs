import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import sharp from 'sharp';

// Capture the actual production graphics commands, including every walk/guard offset.
export async function renderProceduralPoses() {
  const result = await build({entryPoints:['game/sprites/BatmanSprite.ts','game/sprites/SpidermanSprite.ts'],outdir:'/tmp/utlw-poses',bundle:true,write:false,format:'esm'});
  const sheets = new Map();
  const scene = {
    textures: {exists:key=>sheets.has(key),get:key=>({add:(...args)=>sheets.get(key).frames.push(args)})},
    make: {graphics() {
      const rects = []; let color = '#000000', alpha = 1;
      return {
        fillStyle(c,a) { color='#'+c.toString(16).padStart(6,'0'); alpha=a; },
        fillRect(x,y,w,h) { rects.push({x,y,w,h,color,alpha}); },
        generateTexture(key,width,height) { sheets.set(key,{width,height,rects,frames:[]}); },
        destroy() {},
      };
    }},
  };
  for (const file of result.outputFiles) {
    const module = await import('data:text/javascript;base64,'+Buffer.from(file.text).toString('base64'));
    Object.values(module)[0](scene);
  }
  for (const [key,sheet] of sheets) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sheet.width}" height="${sheet.height}">${sheet.rects.map(r=>`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.color}" opacity="${r.alpha}"/>`).join('')}</svg>`;
    sheet.png = await sharp(Buffer.from(svg)).png().toBuffer();
  }
  return sheets;
}

test('Batman and Spider-Man poses keep boots/capes in frame and have distinct kick, guard and charge', async()=>{
  const sheets = await renderProceduralPoses();
  assert.equal(sheets.size,6);
  for (const [key,sheet] of sheets) {
    assert.equal(sheet.frames.length,12,key);
    for (const r of sheet.rects) {
      assert.ok(r.y>=0 && r.y+r.h<=128,`${key}: clipped vertical rectangle ${JSON.stringify(r)}`);
      assert.ok(r.x%192>=1 && r.x%192+r.w<192,`${key}: bleeding into neighbor`);
    }
    const poses=[];
    for (const frame of [0,8,9,10,11]) poses.push(await sharp(sheet.png).extract({left:frame*192,top:0,width:192,height:128}).raw().toBuffer());
    for (let a=0;a<poses.length;a++) for(let b=a+1;b<poses.length;b++) assert.notDeepEqual(poses[a],poses[b],`${key}: duplicate action poses`);
  }
});
