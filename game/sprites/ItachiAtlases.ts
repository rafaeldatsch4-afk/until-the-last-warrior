import type Phaser from 'phaser';

/** One asset mapping for desktop and touch devices, before mode selection. */
export function preloadItachiAtlases(scene: Pick<Phaser.Scene, 'textures' | 'load'>) {
    const susanooUrl = new URL("../assets/itachi-susanoo-v1.png", import.meta.url).href;
    const itachiAtlases = [
      { key: "itachi", url: new URL("../assets/itachi-pixel-v3.png", import.meta.url).href },
      { key: "itachi_ssj", url: susanooUrl },
      { key: "itachi_ui", url: susanooUrl },
    ];
    for (const { key, url } of itachiAtlases) {
      if (!scene.textures.exists(key)) {
        scene.load.spritesheet(key, url, { frameWidth: 192, frameHeight: 128 });
      }
    }
}
