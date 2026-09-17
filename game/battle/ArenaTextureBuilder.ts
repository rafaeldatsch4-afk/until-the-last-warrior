import Phaser from "phaser";
import { ANIME_ARENA_DRAWERS, drawAnimeArena } from "./AnimeArenaArt";

export class ArenaTextureBuilder {
  public static readonly WIDTH = 1920;
  public static readonly HEIGHT = 1080;

  /** Build the same eight illustrated arenas on desktop and mobile.
   * Re-entering preload must preserve textures already referenced by images.
   */
  public static buildAllArenaTextures(scene: Phaser.Scene) {
    for (const key of Object.keys(ANIME_ARENA_DRAWERS)) {
      if (scene.textures.exists(key)) continue;
      const texture = scene.textures.createCanvas(key, this.WIDTH, this.HEIGHT);
      if (!texture) continue;
      texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      drawAnimeArena(texture.getContext(), key, this.WIDTH, this.HEIGHT);
      texture.refresh();
    }
  }
}
