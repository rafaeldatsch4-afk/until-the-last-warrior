import Phaser from "phaser";
import { generateGokuSprite } from "./GokuSprite";
import { generateVegetaSprite } from "./VegetaSprite";
import { generatePiccoloSprite } from "./PiccoloSprite";
import { generateGohanSprite } from "./GohanSprite";
import { generateMadaraSprite } from "./MadaraSprite";
import { generateCellSprite } from "./CellSprite";
import { generateMinipekkaSprite } from "./MinipekkaSprite";
import { generateCyberninjaSprite } from "./CyberninjaSprite";
import { generateLeonardoSprite } from "./LeonardoSprite";
import { generateFrierenSprite } from "./FrierenSprite";
import { generateOptimusSprite } from "./OptimusSprite";
import { generateNarutoSprite } from "./NarutoSprite";
import { generateChapolimSprite } from "./ChapolimSprite";
import { generateBatmanSprite } from "./BatmanSprite";
import { generateThukunaSprite } from "./ThukunaSprite";
import { generateGojoSprite } from "./GojoSprite";
import { generateItachiSprite } from "./ItachiSprite";
import { generateJotaroSprite } from "./JotaroSprite";
import { generateObitoSprite } from "./ObitoSprite";
import { generateSpidermanSprite } from "./SpidermanSprite";
import { generateSaitamaSprite } from "./SaitamaSprite";
import { generateStaticSprite } from "./StaticSprite";

export const TextureGenerationStats = {
  callCount: 0,
  callsPerTexture: {} as Record<string, number>,
  
  logCall(textureKey: string): void {
    this.callCount++;
    this.callsPerTexture[textureKey] = (this.callsPerTexture[textureKey] || 0) + 1;
    console.log(`[TextureGenerationStats] generateTexture called for: "${textureKey}". Key calls: ${this.callsPerTexture[textureKey]}, Global total: ${this.callCount}`);
  },
  
  hasCachedFrames(scene: Phaser.Scene, key: string, totalFrames: number = 12): boolean {
    if (!scene.textures.exists(key)) {
      console.log(`[TextureGenerationStats] Cache check failure: Texture "${key}" not in registry.`);
      return false;
    }
    const texture = scene.textures.get(key);
    for (let i = 0; i < totalFrames; i++) {
      if (!texture.has(i.toString())) {
        console.log(`[TextureGenerationStats] Incomplete frames: Texture "${key}" missing frame ${i}.`);
        return false;
      }
    }
    console.log(`[TextureGenerationStats] Complete cache verification: Texture "${key}" contains all necessary frames.`);
    return true;
  }
};

// Runtime wrapper for game objects texture generation
if (typeof window !== "undefined" && Phaser && Phaser.GameObjects && Phaser.GameObjects.Graphics) {
  const proto = Phaser.GameObjects.Graphics.prototype as any;
  if (!proto._originalGenerateTexture) {
    proto._originalGenerateTexture = proto.generateTexture;
    proto.generateTexture = function(this: any, key: string, width?: number, height?: number) {
      const actualKey = key || this.key;
      if (actualKey) {
        TextureGenerationStats.logCall(actualKey);
        if (this.scene && TextureGenerationStats.hasCachedFrames(this.scene, actualKey)) {
          console.log(`[TextureGenerationStats] Reusing cached texture for "${actualKey}" - stopping redundant drawing.`);
          return this.scene.textures.get(actualKey);
        }
      }
      return this._originalGenerateTexture(key, width, height);
    };
  }
}

export function generateAllSprites(scene: Phaser.Scene): void {
    if (scene.textures.exists("goku")) {
        console.log("All character sprites are already in cache. Skipping generation.");
        return;
    }
    generateGokuSprite(scene);
    generateVegetaSprite(scene);
    generatePiccoloSprite(scene);
    generateGohanSprite(scene);
    generateMadaraSprite(scene);
    generateCellSprite(scene);
    generateMinipekkaSprite(scene);
    generateCyberninjaSprite(scene);
    generateLeonardoSprite(scene);
    generateFrierenSprite(scene);
    generateOptimusSprite(scene);
    generateNarutoSprite(scene);
    generateChapolimSprite(scene);
    generateBatmanSprite(scene);
    generateThukunaSprite(scene);
    generateGojoSprite(scene);
    generateItachiSprite(scene);
    generateJotaroSprite(scene);
    generateObitoSprite(scene);
    generateSpidermanSprite(scene);
    generateSaitamaSprite(scene);
    generateStaticSprite(scene);
}
