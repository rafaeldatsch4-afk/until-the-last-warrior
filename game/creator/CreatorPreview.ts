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
  public torsoBoundsBox?: Phaser.GameObjects.Rectangle;
  public torsoBoundsText?: Phaser.GameObjects.Text;
  public alignmentGuides: Phaser.GameObjects.GameObject[] = [];
  public showDebugGuides: boolean = false;
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

    this.previewAura = this.scene.add
      .ellipse(700, 290, 150, 250, builderData.auraColor)
      .setAlpha(0.3)
      .setBlendMode(Phaser.BlendModes.ADD);
    
    const texName = isTransformed ? "custom_preview_ssj" : "custom_preview";
    const animName = isTransformed ? "custom_preview_ssj_idle" : "custom_preview_idle";

    this.previewSprite = this.scene.add
      .sprite(700, 260, texName)
      .setScale(2.5);
    if (this.scene.textures.exists(texName)) {
      this.previewSprite.play(animName);
    }
    
    if (isTransformed) {
      this.previewAura.setFillStyle(0xffd700, 0.6); // Gold aura
      this.previewAura.setScale(1.2);
    }

    // Clear previous debug guides
    this.alignmentGuides.forEach((g) => g.destroy());
    this.alignmentGuides = [];

    if (this.showDebugGuides) {
      const spriteX = 700;
      const spriteY = 260;
      const spriteScale = 2.5;
      const texScale = 2; // SCALE inside generateCustomSprite

      const frameWidth = 96 * texScale;
      const frameHeight = 64 * texScale;

      const screenLeft = spriteX - (frameWidth * spriteScale) / 2;
      const screenTop = spriteY - (frameHeight * spriteScale) / 2;

      // Draw Head/Neck Alignment Guide (Y = 16px base, 32px scaled)
      const neckY = screenTop + 17 * texScale * spriteScale;
      const neckLine = this.scene.add
        .line(0, 0, screenLeft + 40, neckY, screenLeft + frameWidth * spriteScale - 40, neckY, 0x00ffff, 0.8)
        .setOrigin(0, 0)
        .setDepth(205);
      const neckLabel = this.scene.add
        .text(screenLeft + 45, neckY - 14, "◄ Alinhamento Pescoço/Tronco (Y:17)", {
          fontSize: "11px",
          color: "#00ffff",
          fontFamily: "monospace",
          backgroundColor: "#000000aa",
        })
        .setDepth(205);

      // Draw Waist/Legs Alignment Guide (Y = 27px base)
      const waistY = screenTop + 27 * texScale * spriteScale;
      const waistLine = this.scene.add
        .line(0, 0, screenLeft + 40, waistY, screenLeft + frameWidth * spriteScale - 40, waistY, 0xff00ff, 0.8)
        .setOrigin(0, 0)
        .setDepth(205);
      const waistLabel = this.scene.add
        .text(screenLeft + 45, waistY + 2, "◄ Alinhamento Cintura/Pernas (Y:27)", {
          fontSize: "11px",
          color: "#ff00ff",
          fontFamily: "monospace",
          backgroundColor: "#000000aa",
        })
        .setDepth(205);

      // Center X Axis
      const centerX = spriteX;
      const centerLine = this.scene.add
        .line(0, 0, centerX, screenTop + 20, centerX, screenTop + frameHeight * spriteScale - 20, 0x2ecc71, 0.5)
        .setOrigin(0, 0)
        .setDepth(205);

      this.alignmentGuides.push(neckLine, neckLabel, waistLine, waistLabel, centerLine);

      if (torsoBounds) {
        const boxX = screenLeft + torsoBounds.minX * texScale * spriteScale;
        const boxY = screenTop + torsoBounds.minY * texScale * spriteScale;
        const boxW = torsoBounds.w * texScale * spriteScale;
        const boxH = torsoBounds.h * texScale * spriteScale;

        const boundsBox = this.scene.add
          .rectangle(boxX + boxW / 2, boxY + boxH / 2, boxW, boxH)
          .setStrokeStyle(1.5, 0xf1c40f)
          .setDepth(206);

        const boundsText = this.scene.add
          .text(
            boxX + boxW + 6,
            boxY,
            `Tronco: ${torsoBounds.w}x${torsoBounds.h}px\nX:[${torsoBounds.minX}..${torsoBounds.minX + torsoBounds.w}]\nY:[${torsoBounds.minY}..${torsoBounds.minY + torsoBounds.h}]`,
            {
              fontSize: "11px",
              color: "#f1c40f",
              fontStyle: "bold",
              fontFamily: "monospace",
              backgroundColor: "#0a0a14dd",
              padding: { x: 4, y: 2 },
            },
          )
          .setDepth(206);

        this.alignmentGuides.push(boundsBox, boundsText);
      }
    }
  }
}
