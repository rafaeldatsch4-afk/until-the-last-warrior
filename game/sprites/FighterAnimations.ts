import type Phaser from "phaser";
import { getCombatPose } from "./CombatPoses";
type AnimationScene = Pick<Phaser.Scene, "textures" | "anims">;

/** Shared by preload and creator saves so new fighters work before a page reload. */
export function registerFighterAnimations(scene: AnimationScene, key: string) {
  const createAnim = (
    animKey: string,
    texture: string,
    start: number,
    end: number,
    frameRate: number,
    repeat: number = -1,
  ) => {
    if (!scene.textures.exists(texture)) {
      return;
    }
    if (scene.anims.exists(animKey)) {
      scene.anims.remove(animKey);
    }

    const tex = scene.textures.get(texture);
    const frames: Phaser.Types.Animations.AnimationFrame[] = [];
    for (let i = start; i <= end; i++) {
      if (!tex.has(i.toString())) {
        // Fallback to frame "0" or bypass to prevent crash, though it will still cause flickering if this fails
        frames.push({ key: texture, frame: "0" });
      } else {
        frames.push({ key: texture, frame: i.toString() });
      }
    }
    scene.anims.create({
      key: animKey,
      frames: frames,
      frameRate: frameRate,
      repeat: repeat,
    });
  };

  const createAllForTex = (baseKey: string, texKey: string) => {
    createAnim(`${baseKey}_idle`, texKey, 0, 3, 10);
    createAnim(`${baseKey}_walk`, texKey, 4, 7, 12);
    createAnim(`${baseKey}_attack`, texKey, 8, 9, 16, 0);
    createAnim(`${baseKey}_punch`, texKey, 8, 8, 12, 0);
    createAnim(`${baseKey}_kick`, texKey, 9, 9, 12, 0);
    const pose = scene.textures.exists(texKey) ? getCombatPose(scene.textures.get(texKey)) : undefined;
    const specialFrame = pose?.special ?? 8;
    createAnim(`${baseKey}_special`, texKey, specialFrame, specialFrame, 12, -1);
    createAnim(`${baseKey}_defend`, texKey, 10, 10, 10, -1);
    createAnim(`${baseKey}_transform`, texKey, 0, 3, 24, -1);
    const tex=scene.textures.exists(texKey)?scene.textures.get(texKey):undefined;
    const modular=!!(tex as typeof tex & {customWardrobeArt?:boolean})?.customWardrobeArt;
    const kiTexture=scene.textures.exists(texKey+'_ki')?texKey+'_ki':texKey;
    const chargeFrame=kiTexture!==texKey?0:modular?11:0;
    createAnim(`${baseKey}_charge`,kiTexture,chargeFrame,kiTexture===texKey&&!modular?3:chargeFrame,10,-1);
    if(key==='goku'||key==='custom_999') {
      const genkiTexture=scene.textures.exists(texKey+'_genki')?texKey+'_genki':texKey;
      const genkiFrame=genkiTexture!==texKey?0:tex?.has('12')?12:11;
      createAnim(`${baseKey}_genki`,genkiTexture,genkiFrame,genkiFrame,10,-1);
    }
  };

  createAllForTex(key, key);
  createAllForTex(`${key}_ssj`, `${key}_ssj`);

  if (
    key === "goku" ||
    key === "vegeta" ||
    key === "naruto" ||
    key === "gohan" ||
    key === "custom_999"
  ) {
    createAllForTex(`${key}_ui`, `${key}_ui`);
  }
}
