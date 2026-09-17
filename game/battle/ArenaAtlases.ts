/// <reference types="vite/client" />
import type Phaser from 'phaser';
import { ANIME_ARENA_DRAWERS } from './AnimeArenaArt';

const urls = import.meta.glob<string>('../assets/arenas/*-v1.webp', {
  eager: true, query: '?url', import: 'default',
});

/** Same assets on desktop/mobile; Canvas fallback runs only after load completion. */
export function preloadArenaArt(scene: Pick<Phaser.Scene, 'textures' | 'load'>) {
  for (const [path, url] of Object.entries(urls)) {
    const key = path.split('/').pop()!.replace(/-v1\.webp$/, '');
    if (Object.hasOwn(ANIME_ARENA_DRAWERS, key) && !scene.textures.exists(key)) {
      scene.load.image(key, url);
    }
  }
}
