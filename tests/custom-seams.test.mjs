import assert from 'node:assert/strict';
import {test} from 'node:test';
import sharp from 'sharp';
import {GI_SEAM,trouserClothBottom,fittedFootwear} from '../game/sprites/CustomSeams.ts';
import {genkiTorsoRect,GENKI_TORSOS} from '../game/sprites/GenkiTorsoLayout.ts';

test('trouser attachment ends at cloth rather than the exposed ankle in the source drawings',async()=>{
  // These source bounds exclude stray atlas pixels, as does the compositor.
  const sources={goku:[0,256],vegeta:[0,226],spiderman:[0,256],jotaro:[1,255],
    saitama:[0,256],chapolim:[0,256],naruto:[1,254],sasuke:[0,256]};
  for(const [name,[top,height]] of Object.entries(sources)){
    const {data,info}=await sharp(`game/assets/custom/legs-${name}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const hem=trouserClothBottom(data,info.width,top,height);
    assert.ok(hem>height*.88&&hem<height-4,`${name}: lost cuff or retained bare ankle`);
    // Each retained cuff must still have substantial painted width.
    for(const side of [0,1]){
      let painted=0;
      for(let x=Math.floor(side*info.width/2);x<Math.floor((side+1)*info.width/2);x++){
        if(data[((top+hem-4)*info.width+x)*4+3]>128)painted++;
      }
      assert.ok(painted>15,`${name}: missing cuff on side ${side}`);
    }
  }
});

test('raising the arms keeps the gi belt on the same trouser attachment',()=>{
  const rect=genkiTorsoRect('goku',98),scale=rect.width/512;
  const raisedWaist=rect.y+GI_SEAM.raisedBeltBottom*scale;
  const relaxedWaist=66+GI_SEAM.torsoBeltBottom/GI_SEAM.torsoHeight*36;
  assert.ok(Math.abs(raisedWaist-relaxedWaist)<1e-9);
  assert.ok(Math.abs(rect.y+GENKI_TORSOS.goku.neck[1]*scale-64)<1e-9);
});

test('side-facing ninja footwear keeps its proportions even for a wider trouser cuff',()=>{
  for(const cuff of [3,4.5,6,9]){
    const shoe=fittedFootwear(145,190,65,cuff,35);
    assert.ok(Math.abs(shoe.width/shoe.height-145/190)<1e-9);
    assert.ok(shoe.height<=35*.58);
  }
});
