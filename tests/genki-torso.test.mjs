import assert from 'node:assert/strict';
import {test} from 'node:test';
import sharp from 'sharp';
import {GENKI_TORSOS,genkiTorsoRect} from '../game/sprites/GenkiTorsoLayout.ts';
import {partOptions} from '../game/creator/CreatorPartOptions.ts';
import {GI_SEAM} from '../game/sprites/CustomSeams.ts';

test('every existing garment has a continuous raised-arm drawing with stable neck and waist anchors',async()=>{
  assert.deepEqual(Object.keys(GENKI_TORSOS).sort(),[...partOptions.torso].sort());
  for(const key of partOptions.torso){
    const pose=GENKI_TORSOS[key],rect=genkiTorsoRect(key,98),scale=rect.width/512;
    assert.ok(Math.abs(rect.x+pose.neck[0]*scale-98)<1e-9,key);
    assert.ok(Math.abs(rect.y+pose.neck[1]*scale-64)<1e-9,key);
    const waistSource=key==='goku'?GI_SEAM.raisedBeltBottom:pose.hem;
    const waistTarget=key==='goku'?GI_SEAM.worldY:102;
    assert.ok(Math.abs(rect.y+waistSource*scale-waistTarget)<1e-9,key);
    assert.ok(rect.x>0&&rect.x+rect.width<192&&rect.y>0&&rect.y+rect.height<128,key);
    const {data,info}=await sharp(`game/assets/custom/torso-genki-${key}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    assert.equal(info.width,512);assert.equal(info.height,512);
    const seen=new Uint8Array(512*512);let largest=[],opaque=0;
    for(let p=0;p<seen.length;p++){
      if(data[p*4+3]>128)opaque++;
      if(seen[p]||data[p*4+3]<=128)continue;
      const component=[p];seen[p]=1;
      for(let i=0;i<component.length;i++){
        const q=component[i],x=q%512,y=Math.floor(q/512);
        for(const n of [x>0?q-1:-1,x<511?q+1:-1,y>0?q-512:-1,y<511?q+512:-1]){
          if(n>=0&&!seen[n]&&data[n*4+3]>128){seen[n]=1;component.push(n);}
        }
      }
      if(component.length>largest.length)largest=component;
    }
    // Both hands and the chest must belong to ONE connected painted body.
    // A valid animation key alone did not detect the previous detached arms.
    for(const [label,contains] of [
      ['left arm',p=>p%512<170&&Math.floor(p/512)<250],
      ['right arm',p=>p%512>340&&Math.floor(p/512)<250],
      ['chest',p=>p%512>170&&p%512<340&&Math.floor(p/512)>270],
    ])assert.ok(largest.filter(contains).length>1500,`${key}: ${label} disconnected`);
    assert.ok(largest.length/opaque>.98,`${key}: detached painted fragments`);
  }
});
