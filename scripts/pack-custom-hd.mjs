import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';

// Keep alpha coverage and smooth contours; never threshold these HD illustrations.
export async function packCustomHD(){
  const file='docs/art/custom/manifest.json';
  const manifest=JSON.parse(await readFile(file,'utf8'));
  for(const [key,source] of [
    ['portrait-jotaro','portrait-jotaro-source.png'],
    ['portrait-chapolim','portrait-chapolim-source.png'],
    ['torso-jotaro','torso-jotaro-hd-source.png'],
  ]){
    const input='docs/art/custom/'+source,asset='game/assets/custom/'+key+'.png';
    await sharp(input).resize({width:512,height:512,fit:'inside',kernel:'lanczos3'}).png().toFile(asset);
    manifest.entries=manifest.entries.filter(e=>e.key!==key);
    manifest.entries.push({key,source:input,asset,highResolution:true});
  }
  await writeFile(file,JSON.stringify(manifest,null,2)+'\n');
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/pack-custom-hd.mjs'))await packCustomHD();
