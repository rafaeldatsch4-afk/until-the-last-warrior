/// <reference types="vite/client" />
import Phaser from 'phaser';
const urls=import.meta.glob<string>('../assets/poses/*.png',{eager:true,query:'?url',import:'default'});
export function preloadPowerPoses(scene:Phaser.Scene){
  for(const [path,url] of Object.entries(urls))scene.load.image(path.split('/').pop()!.replace('.png',''),url);
}
export function registerPowerPoses(scene:Phaser.Scene){
  for(const path of Object.keys(urls)){
    const key=path.split('/').pop()!.replace('.png','');
    if(!scene.textures.exists(key))continue;
    let texture=scene.textures.get(key);
    if(scene.game.renderer.type===Phaser.CANVAS){
      const source=texture.getSourceImage() as HTMLImageElement;
      const canvas=document.createElement('canvas');
      canvas.width=192;canvas.height=128;
      const context=canvas.getContext('2d')!;
      context.imageSmoothingEnabled=true;
      context.imageSmoothingQuality='high';
      context.drawImage(source,0,0,192,128);
      scene.textures.remove(key);
      texture=scene.textures.addCanvas(key,canvas)!;
    }
    texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    if(!texture.has('0'))texture.add('0',0,0,0,192,128).setUVs(192,128,0,0,1,1);
  }
}
