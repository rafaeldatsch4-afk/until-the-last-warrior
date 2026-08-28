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
import { AURA_PRESETS } from "../systems/AuraManager";

export class CreatorPreview {
  public previewSprite?: Phaser.GameObjects.Sprite;
  public previewAura?: Phaser.GameObjects.Shape;
  public previewAuraCore?: Phaser.GameObjects.Shape;
  public previewAuraRing?: Phaser.GameObjects.Arc;
  public previewSparks: Phaser.GameObjects.Arc[] = [];
  public previewLightningArcs: Phaser.GameObjects.Line[] = [];
  public stagePedestal?: Phaser.GameObjects.Graphics;
  public stageRing?: Phaser.GameObjects.Graphics;
  public torsoBoundsBox?: Phaser.GameObjects.Rectangle;
  public torsoBoundsText?: Phaser.GameObjects.Text;
  public alignmentGuides: Phaser.GameObjects.GameObject[] = [];
  public showDebugGuides: boolean = false;
  private scene: Phaser.Scene;
  public posX: number = 750;
  public posY: number = 240;
  public previewScale: number = 1.9;

  // Debounce e controle de ciclo de vida
  private debounceTimer: Phaser.Time.TimerEvent | null = null;
  private auraTween: Phaser.Tweens.Tween | null = null;
  private auraRingTween: Phaser.Tweens.Tween | null = null;
  private lightningTimer: Phaser.Time.TimerEvent | null = null;
  private isDestroyed: boolean = false;

  private static readonly PREVIEW_TEXTURE_KEYS = [
    "custom_preview",
    "custom_preview_ssj",
    "custom_preview_ui",
  ];

  private static readonly PREVIEW_ANIM_KEYS = [
    "custom_preview_idle",
    "custom_preview_ssj_idle",
    "custom_preview_charge",
  ];

  constructor(scene: Phaser.Scene, x: number = 750, y: number = 240, availableH?: number) {
    this.scene = scene;
    this.posX = x;
    this.posY = y;
    if (availableH) {
      this.previewScale = Phaser.Math.Clamp(availableH / 115, 1.25, 2.05);
    }
  }

  public setPosition(x: number, y: number, availableH?: number) {
    this.posX = x;
    this.posY = y;
    if (availableH) {
      this.previewScale = Phaser.Math.Clamp(availableH / 115, 1.25, 2.05);
    }
    if (this.previewSprite) {
      this.previewSprite.setPosition(x, y);
      this.previewSprite.setScale(this.previewScale);
    }
    if (this.previewAura) {
      this.previewAura.setPosition(x, y - Math.round(2 * this.previewScale));
    }
    if (this.previewAuraCore) {
      this.previewAuraCore.setPosition(x, y - Math.round(2 * this.previewScale));
    }
    if (this.previewAuraRing) {
      this.previewAuraRing.setPosition(x, y + Math.round(36 * this.previewScale));
    }
  }

  /**
   * Atualização com Debounce para evitar sobrecarga de processamento visual
   * e múltiplos spikes de GC durante interações rápidas.
   */
  public updatePreview(
    state: CreatorState,
    currentBaseObjIndex: number,
    currentColorIndex: number,
    customSp1Id: string,
    customSp2Id: string,
    isTransformed: boolean = false,
    debounceDelayMs: number = 50
  ) {
    if (this.isDestroyed || !this.scene || !this.scene.sys) return;

    if (this.debounceTimer) {
      this.debounceTimer.remove(false);
      this.debounceTimer = null;
    }

    if (debounceDelayMs <= 0) {
      this.renderPreview(
        state,
        currentBaseObjIndex,
        currentColorIndex,
        customSp1Id,
        customSp2Id,
        isTransformed
      );
      return;
    }

    this.debounceTimer = this.scene.time.delayedCall(debounceDelayMs, () => {
      if (!this.isDestroyed && this.scene && this.scene.sys) {
        this.renderPreview(
          state,
          currentBaseObjIndex,
          currentColorIndex,
          customSp1Id,
          customSp2Id,
          isTransformed
        );
      }
    });
  }

  /**
   * Atualização imediata síncrona sem debounce (ideal para inicialização).
   */
  public updatePreviewImmediate(
    state: CreatorState,
    currentBaseObjIndex: number,
    currentColorIndex: number,
    customSp1Id: string,
    customSp2Id: string,
    isTransformed: boolean = false
  ) {
    if (this.debounceTimer) {
      this.debounceTimer.remove(false);
      this.debounceTimer = null;
    }
    this.renderPreview(
      state,
      currentBaseObjIndex,
      currentColorIndex,
      customSp1Id,
      customSp2Id,
      isTransformed
    );
  }

  private renderPreview(
    state: CreatorState,
    currentBaseObjIndex: number,
    currentColorIndex: number,
    customSp1Id: string,
    customSp2Id: string,
    isTransformed: boolean = false
  ) {
    if (this.isDestroyed || !this.scene || !this.scene.sys) return;

    const builderData = {
      base: INITIAL_CHARACTERS[currentBaseObjIndex] || INITIAL_CHARACTERS[0],
      auraColor: auraColors[currentColorIndex] ?? 0x3498db,
    };

    const customData = {
      gi1: 0,
      gi2: 0,
      skin: skinColors[state.p_idx.skin] ?? skinColors[0],
      hair: hairColors[state.p_idx.hair] ?? hairColors[0],
      color_torso_1: giColors[state.p_idx.torso_1] ?? giColors[0],
      color_torso_2: giColors[state.p_idx.torso_2] ?? giColors[1],
      color_legs_1: giColors[state.p_idx.legs_1] ?? giColors[0],
      color_legs_2: giColors[state.p_idx.legs_2] ?? giColors[1],
      color_feet_1: giColors[state.p_idx.feet_1] ?? giColors[0],
      color_feet_2: giColors[state.p_idx.feet_2] ?? giColors[1],
      color_head_1: giColors[state.p_idx.head_1] ?? giColors[0],
      color_head_2: giColors[state.p_idx.head_2] ?? giColors[1],
      color_acc_1: giColors[state.p_idx.acc_1] ?? giColors[0],
      sp1_id: customSp1Id || builderData.base.key,
      sp2_id: customSp2Id || builderData.base.key,
      part_head: state.getEquippedHead(),
      part_torso: partOptions.torso[state.style_idx.torso] || "goku",
      part_legs: partOptions.legs[state.style_idx.legs] || "goku",
      part_feet: partOptions.feet[state.style_idx.feet] || "goku",
      part_accessory: state.getEquippedAccessory(),
    };

    const preset = AURA_PRESETS.find((p) => p.id === state.aura_preset_id);
    let effectiveAuraColor = 0xffd700;
    let effectiveRingColor = 0xffff00;

    if (preset && preset.color !== -1) {
      effectiveAuraColor = preset.color;
      effectiveRingColor = preset.ringColor !== -1 ? preset.ringColor : preset.color;
    } else if (builderData.auraColor) {
      effectiveAuraColor = builderData.auraColor;
      effectiveRingColor = builderData.auraColor;
    }

    if (isTransformed) {
      effectiveAuraColor = 0xf1c40f;
      effectiveRingColor = 0xffff55;
    }

    // Parar animações ativas no sprite anterior antes de descartar texturas
    if (this.previewSprite) {
      try {
        if (this.previewSprite.anims?.stop) {
          this.previewSprite.anims.stop();
        } else if ((this.previewSprite as any).stop) {
          (this.previewSprite as any).stop();
        }
      } catch (e) {}
      if (this.scene.textures.exists("dummy")) {
        this.previewSprite.setTexture("dummy");
      }
      this.previewSprite.destroy();
      this.previewSprite = undefined;
    }

    if (this.auraTween) {
      try {
        if (this.auraTween.stop) this.auraTween.stop();
      } catch (e) {}
      try {
        this.auraTween.remove();
      } catch (e) {}
      this.auraTween = null;
    }
    if (this.auraRingTween) {
      try {
        if (this.auraRingTween.stop) this.auraRingTween.stop();
      } catch (e) {}
      try {
        this.auraRingTween.remove();
      } catch (e) {}
      this.auraRingTween = null;
    }

    if (this.previewAura) {
      this.previewAura.destroy();
      this.previewAura = undefined;
    }
    if (this.previewAuraCore) {
      this.previewAuraCore.destroy();
      this.previewAuraCore = undefined;
    }
    if (this.previewAuraRing) {
      this.previewAuraRing.destroy();
      this.previewAuraRing = undefined;
    }
    this.previewSparks.forEach((s) => {
      if (s && s.destroy) s.destroy();
    });
    this.previewSparks = [];

    // Gerar nova textura procedural com cleanup nativo em CustomSprite
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
      repeat: number = -1
    ) => {
      if (this.scene.anims.exists(animKey)) {
        this.scene.anims.remove(animKey);
      }
      const tex = this.scene.textures.get(texture);
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = start; i <= end; i++) {
        if (tex && tex.has(i.toString())) {
          frames.push({ key: texture, frame: i.toString() });
        }
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

    // 0. High-Tech Stage Pedestal & Ground Projection
    if (this.stagePedestal) this.stagePedestal.destroy();
    if (this.stageRing) this.stageRing.destroy();

    const scale = this.previewScale;
    const pedestalOffsetY = Math.round(36 * scale);

    this.stagePedestal = this.scene.add.graphics().setDepth(5);
    this.stagePedestal.fillStyle(0x0f172a, 0.85);
    this.stagePedestal.fillEllipse(this.posX, this.posY + pedestalOffsetY + 2, 58 * scale, 14 * scale);
    this.stagePedestal.fillStyle(0x1e293b, 0.9);
    this.stagePedestal.fillEllipse(this.posX, this.posY + pedestalOffsetY, 50 * scale, 11 * scale);
    this.stagePedestal.lineStyle(1.5, 0x38bdf8, 0.6);
    this.stagePedestal.strokeEllipse(this.posX, this.posY + pedestalOffsetY, 50 * scale, 11 * scale);
    this.stagePedestal.lineStyle(1, effectiveRingColor, 0.8);
    this.stagePedestal.strokeEllipse(this.posX, this.posY + pedestalOffsetY, 38 * scale, 8 * scale);

    // 1. Outer Flame Aura (Glow)
    const auraW = Math.round(52 * scale);
    const auraH = Math.round(76 * scale);
    this.previewAura = this.scene.add
      .ellipse(this.posX, this.posY - Math.round(2 * scale), auraW, auraH, effectiveAuraColor)
      .setAlpha(isTransformed ? 0.65 : 0.38)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(6);

    // 2. Inner Bright Core
    const coreW = Math.round(34 * scale);
    const coreH = Math.round(56 * scale);
    this.previewAuraCore = this.scene.add
      .ellipse(this.posX, this.posY - Math.round(2 * scale), coreW, coreH, effectiveRingColor)
      .setAlpha(isTransformed ? 0.55 : 0.25)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(7);

    // 3. Ground Ki Shockwave Ring
    this.previewAuraRing = this.scene.add
      .circle(this.posX, this.posY + pedestalOffsetY, 20 * scale, 0x000000, 0)
      .setStrokeStyle(2 * scale, effectiveRingColor, 0.8)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(8);

    // 4. Pulsing Tweens
    this.auraTween = this.scene.tweens.add({
      targets: this.previewAura,
      scaleX: 1.15,
      scaleY: 1.08,
      alpha: isTransformed ? 0.8 : 0.5,
      yoyo: true,
      repeat: -1,
      duration: isTransformed ? 320 : 580,
      ease: "Sine.easeInOut",
    });

    this.auraRingTween = this.scene.tweens.add({
      targets: [this.previewAuraRing, this.previewAuraCore],
      scaleX: 1.18,
      scaleY: 1.1,
      alpha: 0.9,
      yoyo: true,
      repeat: -1,
      duration: isTransformed ? 350 : 620,
      ease: "Sine.easeInOut",
    });

    // 5. Floating Ki Sparks
    for (let i = 0; i < 10; i++) {
      const spark = this.scene.add
        .circle(
          this.posX + Phaser.Math.Between(Math.round(-18 * scale), Math.round(18 * scale)),
          this.posY + pedestalOffsetY,
          Phaser.Math.Between(2, 3) * (scale / 2),
          effectiveRingColor,
          0.9
        )
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(11);
      this.previewSparks.push(spark);

      this.scene.tweens.add({
        targets: spark,
        y: this.posY - Phaser.Math.Between(Math.round(20 * scale), Math.round(45 * scale)),
        x: spark.x + Phaser.Math.Between(Math.round(-10 * scale), Math.round(10 * scale)),
        alpha: 0,
        scale: 0.25,
        duration: Phaser.Math.Between(650, 1350),
        repeat: -1,
        delay: i * 90,
        ease: "Cubic.easeOut",
      });
    }

    // 6. Dynamic Lightning Arcs for high tiers or transformed states
    this.clearLightning();
    if (isTransformed || (preset && (preset.id === "ui" || preset.id === "astral" || preset.id === "ssj2" || preset.id === "ego" || preset.id === "god" || preset.id === "blue"))) {
      this.startLightning(effectiveRingColor);
    }

    const texName = isTransformed ? "custom_preview_ssj" : "custom_preview";
    const animName = isTransformed
      ? "custom_preview_ssj_idle"
      : "custom_preview_idle";

    this.previewSprite = this.scene.add
      .sprite(this.posX, this.posY, texName)
      .setOrigin(0.5, 0.70)
      .setScale(scale)
      .setDepth(10);

    if (this.scene.textures.exists(texName)) {
      this.previewSprite.play(animName);
    }

    // Limpar guias anteriores
    this.clearGuides();

    if (this.showDebugGuides) {
      this.renderDebugGuides(torsoBounds);
    }
  }

  private clearGuides() {
    this.alignmentGuides.forEach((g) => {
      if (g && g.destroy) g.destroy();
    });
    this.alignmentGuides = [];
  }

  private renderDebugGuides(torsoBounds?: {
    minX: number;
    minY: number;
    w: number;
    h: number;
  }) {
    const spriteX = this.posX;
    const spriteY = this.posY;
    const spriteScale = 2.2;
    const texScale = 2;

    const frameWidth = 96 * texScale;
    const frameHeight = 64 * texScale;

    const screenLeft = spriteX - (frameWidth * spriteScale) / 2;
    const screenTop = spriteY - (frameHeight * spriteScale) / 2;

    const neckY = screenTop + 17 * texScale * spriteScale;
    const neckLine = this.scene.add
      .line(
        0,
        0,
        screenLeft + 40,
        neckY,
        screenLeft + frameWidth * spriteScale - 40,
        neckY,
        0x00ffff,
        0.8
      )
      .setOrigin(0, 0)
      .setDepth(205);

    const waistY = screenTop + 27 * texScale * spriteScale;
    const waistLine = this.scene.add
      .line(
        0,
        0,
        screenLeft + 40,
        waistY,
        screenLeft + frameWidth * spriteScale - 40,
        waistY,
        0xff00ff,
        0.8
      )
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

  private clearLightning() {
    if (this.lightningTimer) {
      this.lightningTimer.remove(false);
      this.lightningTimer = null;
    }
    this.previewLightningArcs.forEach((arc) => {
      if (arc && arc.destroy) arc.destroy();
    });
    this.previewLightningArcs = [];
  }

  private startLightning(color: number) {
    this.clearLightning();
    if (!this.scene || !this.scene.time) return;

    this.lightningTimer = this.scene.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => {
        if (this.isDestroyed || !this.scene || !this.scene.sys) return;

        // Clean older arcs
        this.previewLightningArcs.forEach((arc) => {
          if (arc && arc.destroy) arc.destroy();
        });
        this.previewLightningArcs = [];

        // Generate 1-3 zigzag lightning arcs around the warrior
        const count = Phaser.Math.Between(1, 3);
        for (let c = 0; c < count; c++) {
          const startX = this.posX + Phaser.Math.Between(-36, 36);
          const startY = this.posY + Phaser.Math.Between(-40, 50);
          const midX = startX + Phaser.Math.Between(-14, 14);
          const midY = startY + Phaser.Math.Between(-16, -6);
          const endX = midX + Phaser.Math.Between(-12, 12);
          const endY = midY + Phaser.Math.Between(-18, -8);

          const arc = this.scene.add
            .line(0, 0, startX, startY, midX, midY, 0xffffff, 0.95)
            .setLineWidth(1.8)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(12);

          const arc2 = this.scene.add
            .line(0, 0, midX, midY, endX, endY, color, 0.85)
            .setLineWidth(1.4)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(12);

          this.previewLightningArcs.push(arc, arc2);

          this.scene.time.delayedCall(90, () => {
            if (arc && arc.destroy) arc.destroy();
            if (arc2 && arc2.destroy) arc2.destroy();
          });
        }
      },
    });
  }

  /**
   * Dispara um efeito visual e sonoro de emanação / carga de Ki no guerreiro.
   */
  public triggerChargeEffect() {
    if (this.isDestroyed || !this.scene || !this.scene.sys) return;

    if (this.scene.cache.audio.exists("sfx_charge")) {
      this.scene.sound.play("sfx_charge", { volume: 0.7 });
    } else if (this.scene.cache.audio.exists("sfx_transform")) {
      this.scene.sound.play("sfx_transform", { volume: 0.55 });
    }

    if (this.previewAura && this.previewAuraCore) {
      this.scene.tweens.add({
        targets: [this.previewAura, this.previewAuraCore],
        scaleX: 1.6,
        scaleY: 1.45,
        alpha: 1,
        yoyo: true,
        duration: 280,
        repeat: 3,
        ease: "Back.easeOut",
      });
    }

    if (this.previewAuraRing) {
      this.scene.tweens.add({
        targets: this.previewAuraRing,
        scaleX: 1.8,
        scaleY: 1.6,
        alpha: 1,
        yoyo: true,
        duration: 220,
        repeat: 4,
      });
    }

    if (this.previewSprite) {
      this.scene.tweens.add({
        targets: this.previewSprite,
        y: this.posY - 5,
        yoyo: true,
        duration: 70,
        repeat: 8,
      });
    }

    // Temporary lightning storm on charge
    this.startLightning(0xffffff);
    this.scene.time.delayedCall(900, () => {
      if (!this.isDestroyed) {
        this.clearLightning();
      }
    });
  }

  /**
   * Limpeza e destruição de recursos de textura, animações e objetos de cena.
   */
  public destroy() {
    this.isDestroyed = true;

    if (this.debounceTimer) {
      this.debounceTimer.remove(false);
      this.debounceTimer = null;
    }

    this.clearLightning();

    if (this.auraTween) {
      try {
        if (this.auraTween.stop) this.auraTween.stop();
      } catch (e) {}
      try {
        this.auraTween.remove();
      } catch (e) {}
      this.auraTween = null;
    }
    if (this.auraRingTween) {
      try {
        if (this.auraRingTween.stop) this.auraRingTween.stop();
      } catch (e) {}
      try {
        this.auraRingTween.remove();
      } catch (e) {}
      this.auraRingTween = null;
    }

    if (this.previewSprite) {
      try {
        if (this.previewSprite.anims?.stop) {
          this.previewSprite.anims.stop();
        } else if ((this.previewSprite as any).stop) {
          (this.previewSprite as any).stop();
        }
      } catch (e) {}
      try {
        this.previewSprite.destroy();
      } catch (e) {}
      this.previewSprite = undefined;
    }

    if (this.previewAura) {
      this.previewAura.destroy();
      this.previewAura = undefined;
    }
    if (this.previewAuraCore) {
      this.previewAuraCore.destroy();
      this.previewAuraCore = undefined;
    }
    if (this.previewAuraRing) {
      this.previewAuraRing.destroy();
      this.previewAuraRing = undefined;
    }
    this.previewSparks.forEach((s) => {
      if (s && s.destroy) s.destroy();
    });
    this.previewSparks = [];

    if (this.stagePedestal) {
      this.stagePedestal.destroy();
      this.stagePedestal = undefined;
    }

    if (this.stageRing) {
      this.stageRing.destroy();
      this.stageRing = undefined;
    }

    if (this.torsoBoundsBox) {
      this.torsoBoundsBox.destroy();
      this.torsoBoundsBox = undefined;
    }

    if (this.torsoBoundsText) {
      this.torsoBoundsText.destroy();
      this.torsoBoundsText = undefined;
    }

    this.clearGuides();

    // Remover animações temporárias
    if (this.scene && this.scene.anims) {
      CreatorPreview.PREVIEW_ANIM_KEYS.forEach((animKey) => {
        if (this.scene.anims.exists(animKey)) {
          this.scene.anims.remove(animKey);
        }
      });
    }

    // Limpar texturas temporárias da memória de vídeo do Phaser
    if (this.scene && this.scene.textures) {
      CreatorPreview.PREVIEW_TEXTURE_KEYS.forEach((texKey) => {
        if (this.scene.textures.exists(texKey)) {
          this.scene.textures.remove(texKey);
        }
      });
    }
  }
}
