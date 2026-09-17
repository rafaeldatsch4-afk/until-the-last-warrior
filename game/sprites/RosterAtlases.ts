/// <reference types="vite/client" />
import type Phaser from 'phaser';

// Vite emits only the finished runtime atlases; source/preview art stays out of the build.
const atlasUrls = import.meta.glob<string>('../assets/roster/*-v1.png', {
  eager: true, query: '?url', import: 'default',
});
export function preloadRosterAtlases(scene: Pick<Phaser.Scene, 'textures' | 'load'>) {
  for (const [path,url] of Object.entries(atlasUrls)) {
    const key=path.split('/').pop()!.replace(/-v1\.png$/, '');
    if(!scene.textures.exists(key))scene.load.spritesheet(key,url,{frameWidth:192,frameHeight:128});
  }
}
