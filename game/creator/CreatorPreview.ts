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
  public stagePedestal?: Phaser.GameObjects.Shape;
  public stageRing?: Phaser.GameObjects.Shape;
  public torsoBoundsBox?: Phaser.GameObjects.Rectangle;
  public torsoBoundsText?: Phaser.GameObjects.Text;
  public alignmentGuides: Phaser.GameObjects.GameObject[] = [];
  public showDebugGuides: boolean = false;
  private scene: Phaser.Scene;
  public posX: number = 750;
  public posY: number = 240;

  constructor(scene: Phaser.Scene, x: number = 750, y: number = 240) {
    this.scene = scene;
    this.posX = x;
    this.posY = y;
  }

  public setPosition(x: number, y: number) {
    this.posX = x;
    this.posY = y;
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

    const { torsoBounds } = generateCustomSprite(this.scene, {
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

    const auraCol = isTransformed ? 0xf1c40f : builderData.auraColor;
    this.previewAura = this.scene.add
      .ellipse(this.posX, this.posY + 20, 140, 240, auraCol)
      .setAlpha(isTransformed ? 0.55 : 0.25)
      .setBlendMode(Phaser.BlendModes.ADD);

    if (isTransformed) {
      this.scene.tweens.add({
        targets: this.previewAura,
        scaleX: 1.15,
        scaleY: 1.08,
        alpha: 0.7,
        yoyo: true,
        repeat: -1,
        duration: 400,
        ease: "Sine.easeInOut",
      });
    }

    const texName = isTransformed ? "custom_preview_ssj" : "custom_preview";
    const animName = isTransformed ? "custom_preview_ssj_idle" : "custom_preview_idle";

    this.previewSprite = this.scene.add
      .sprite(this.posX, this.posY, texName)
      .setScale(2.7);

    if (this.scene.textures.exists(texName)) {
      this.previewSprite.play(animName);
    }

    // Clear previous debug guides
    this.alignmentGuides.forEach((g) => g.destroy());
    this.alignmentGuides = [];

    if (this.showDebugGuides) {
      const spriteX = this.posX;
      const spriteY = this.posY;
      const spriteScale = 2.7;
      const texScale = 2; // SCALE inside generateCustomSprite

      const frameWidth = 96 * texScale;
      const frameHeight = 64 * texScale;

      const screenLeft = spriteX - (frameWidth * spriteScale) / 2;
      const screenTop = spriteY - (frameHeight * spriteScale) / 2;

      const neckY = screenTop + 17 * texScale * spriteScale;
      const neckLine = this.scene.add
        .line(0, 0, screenLeft + 40, neckY, screenLeft + frameWidth * spriteScale - 40, neckY, 0x00ffff, 0.8)
        .setOrigin(0, 0)
        .setDepth(205);

      const waistY = screenTop + 27 * texScale * spriteScale;
      const waistLine = this.scene.add
        .line(0, 0, screenLeft + 40, waistY, screenLeft + frameWidth * spriteScale - 40, waistY, 0xff00ff, 0.8)
        .setOrigin(0, 0)
        .setDepth(205);

      this.alignmentGuides.push(neckLine, waistLine);

      if (torsoBounds) {
        const boxX = screenLeft + torsoBounds.minX * texScale * spriteScale;
        const boxY = screenTop + torsoBounds.minY * texScale * spriteScale;
        const boxW = torsoBounds.w * texScale * spriteScale;
        const boxH = torsoBounds.h * texScale * spriteScale;

        const boundsBox = this.scene.add
          .rectangle(boxX + boxW / 2, boxY + boxH / 2, boxW, boxH)
          .setStrokeStyle(1.5, 0xf1c40f)
          .setDepth(206);

        this.alignmentGuides.push(boundsBox);
      }
    }
  }
}
