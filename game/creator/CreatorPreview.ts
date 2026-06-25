import Phaser from "phaser";
import { generateCustomSprite } from "../sprites/CustomSprite";
import { CharacterData } from "../types";
import { CreatorState } from "./CreatorState";
import {
  partOptions,
  auraColors,
  skinColors,
  hairColors,
  giColors,
} from "./CreatorPartOptions";
import { INITIAL_CHARACTERS } from "../data";

export class CreatorPreview {
  public previewSprite?: Phaser.GameObjects.Sprite;
  public previewAura?: Phaser.GameObjects.Shape;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public updatePreview(
    state: CreatorState,
    currentBaseObjIndex: number,
    currentColorIndex: number,
    customSp1Id: string,
    customSp2Id: string,
    isTransformed: boolean = false
  ) {
    const builderData = {
      base: INITIAL_CHARACTERS[currentBaseObjIndex],
      auraColor: auraColors[currentColorIndex],
    };

    const customData = {
      gi1: 0,
      gi2: 0,
      skin: skinColors[state.p_idx.skin],
      hair: hairColors[state.p_idx.hair],
      color_torso_1: giColors[state.p_idx.torso_1],
      color_torso_2: giColors[state.p_idx.torso_2],
      color_legs_1: giColors[state.p_idx.legs_1],
      color_legs_2: giColors[state.p_idx.legs_2],
      color_feet_1: giColors[state.p_idx.feet_1],
      color_feet_2: giColors[state.p_idx.feet_2],
      color_head_1: giColors[state.p_idx.head_1],
      color_head_2: giColors[state.p_idx.head_2],
      color_acc_1: giColors[state.p_idx.acc_1],
      sp1_id: customSp1Id || builderData.base.key,
      sp2_id: customSp2Id || builderData.base.key,
      part_head: partOptions.head[state.style_idx.head],
      part_torso: partOptions.torso[state.style_idx.torso],
      part_legs: partOptions.legs[state.style_idx.legs],
      part_feet: partOptions.feet[state.style_idx.feet],
      part_accessory: partOptions.accessory[state.style_idx.accessory],
    };

    if (this.previewSprite) {
      this.previewSprite.stop();
      if (this.scene.textures.exists("dummy")) {
        this.previewSprite.setTexture("dummy");
      }
      this.previewSprite.destroy();
    }
    if (this.previewAura) this.previewAura.destroy();

    generateCustomSprite(this.scene, {
      ...(builderData.base as CharacterData),
      key: "custom_preview",
      customData: customData,
    });

    const createAnim = (
      animKey: string,
      texture: string,
      start: number,
      end: number,
      frameRate: number,
      repeat: number = -1,
    ) => {
      if (this.scene.anims.exists(animKey)) this.scene.anims.remove(animKey);
      const tex = this.scene.textures.get(texture);
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = start; i <= end; i++) {
        if (tex && tex.has(i.toString()))
          frames.push({ key: texture, frame: i.toString() });
      }
      if (frames.length > 0) {
        this.scene.anims.create({
          key: animKey,
          frames: frames,
          frameRate: frameRate,
          repeat: repeat,
        });
      }
    };

    createAnim("custom_preview_idle", "custom_preview", 0, 3, 10, -1);
    createAnim("custom_preview_ssj_idle", "custom_preview_ssj", 0, 3, 10, -1);

    this.previewAura = this.scene.add
      .ellipse(700, 250, 150, 250, builderData.auraColor)
      .setAlpha(0.3)
      .setBlendMode(Phaser.BlendModes.ADD);
    
    const texName = isTransformed ? "custom_preview_ssj" : "custom_preview";
    const animName = isTransformed ? "custom_preview_ssj_idle" : "custom_preview_idle";

    this.previewSprite = this.scene.add
      .sprite(700, 250, texName)
      .setScale(3.5);
    if (this.scene.textures.exists(texName)) {
      this.previewSprite.play(animName);
    }
    
    if (isTransformed) {
      this.previewAura.setFillStyle(0xffd700, 0.6); // Gold aura
      this.previewAura.setScale(1.2);
    }
  }
}
