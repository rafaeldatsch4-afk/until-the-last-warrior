import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { stabilizeIdlePortrait } from '../game/sprites/CustomIdlePortrait.ts';

test('custom idle portraits do not flash while body and combat pixels are preserved',async()=>{
  for(const name of ['goku','goku_ssj','goku_ui','vegeta','naruto','jotaro','chapolim','saitama']){
    const {data,info}=await sharp(`game/assets/roster/${name}-v1.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const pixels=new Uint8ClampedArray(data);
    stabilizeIdlePortrait(pixels,info.width);
    for(let y=0;y<128;y++)for(let x=0;x<info.width;x++){
      const frame=Math.floor(x/192),localX=x%192;
      const expected=frame>0&&frame<4&&localX>=64&&localX<128&&y<84
        ?(y*info.width+localX)*4:(y*info.width+x)*4;
      const actual=(y*info.width+x)*4;
      for(let c=0;c<4;c++)assert.equal(pixels[actual+c],data[expected+c],`${name} frame ${frame} (${localX},${y})`);
    }
  }
});
