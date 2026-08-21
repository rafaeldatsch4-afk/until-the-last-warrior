import Phaser from "phaser";
import { AURA_PRESETS, AuraManager, AuraPreset } from "../systems/AuraManager";

export class AuraCustomizerModal {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private selectedPresetId: string = "default";
  private currentMode: "p1" | "all" = "p1";
  private previewSprite!: Phaser.GameObjects.Sprite;
  private auraGlow!: Phaser.GameObjects.Ellipse;
  private auraRing!: Phaser.GameObjects.Arc;
  private auraParticles: Phaser.GameObjects.Arc[] = [];
  private previewTimer!: Phaser.Time.TimerEvent;
  private presetButtons: { container: Phaser.GameObjects.Container; id: string; bg: Phaser.GameObjects.Graphics }[] = [];
  private descText!: Phaser.GameObjects.Text;
  private presetNameText!: Phaser.GameObjects.Text;
  private saveToastText!: Phaser.GameObjects.Text;
  private modeBtnText!: Phaser.GameObjects.Text;
  private modeBtnBg!: Phaser.GameObjects.Graphics;
  private previewCharKey: string = "goku";
  private isCharging: boolean = false;
  private onClose?: () => void;

  constructor(scene: Phaser.Scene, onClose?: () => void) {
    this.scene = scene;
    this.onClose = onClose;
    const pref = AuraManager.getPreference();
    this.selectedPresetId = pref.id;
    this.currentMode = pref.mode;
    this.create();
  }

  static show(scene: Phaser.Scene, onClose?: () => void): AuraCustomizerModal {
    return new AuraCustomizerModal(scene, onClose);
  }

  private create() {
    const { width, height } = this.scene.scale;
    this.container = this.scene.add.container(0, 0).setDepth(999);

    // 1. Dim Backdrop
    const backdrop = this.scene.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.75)
      .setInteractive();
    this.container.add(backdrop);

    // 2. Modal Frame
    const cardW = Math.min(880, width - 40);
    const cardH = Math.min(500, height - 30);
    const cardX = width / 2;
    const cardY = height / 2;

    const cardBg = this.scene.add.graphics();
    // Shadow
    cardBg.fillStyle(0x000000, 0.6);
    cardBg.fillRoundedRect(cardX - cardW / 2 + 4, cardY - cardH / 2 + 6, cardW, cardH, 16);
    // Background
    cardBg.fillStyle(0x0f172a, 0.96);
    cardBg.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 16);
    // Border
    cardBg.lineStyle(2, 0x38bdf8, 0.9);
    cardBg.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 16);

    this.container.add(cardBg);

    // 3. Header
    const headerTitle = this.scene.add
      .text(cardX - cardW / 2 + 30, cardY - cardH / 2 + 28, "⚡ COR DA AURA DOS GUERREIROS", {
        fontSize: "22px",
        fontStyle: "bold",
        color: "#ffd54a",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        stroke: "#000000",
        strokeThickness: 3,
        resolution: 2,
      })
      .setOrigin(0, 0.5);

    const headerSub = this.scene.add
      .text(
        cardX - cardW / 2 + 30,
        cardY - cardH / 2 + 50,
        "Escolha a cor da emanação de Ki dos personagens. Salvo automaticamente no LocalStorage.",
        {
          fontSize: "13px",
          color: "#94a3b8",
          fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
          resolution: 2,
        },
      )
      .setOrigin(0, 0.5);

    // Close Button (Top Right)
    const closeBtnCont = this.scene.add.container(cardX + cardW / 2 - 40, cardY - cardH / 2 + 36);
    const closeBtnBg = this.scene.add
      .circle(0, 0, 18, 0xef4444)
      .setStrokeStyle(1.5, 0xffffff);
    const closeBtnTxt = this.scene.add
      .text(0, 0, "✕", { fontSize: "16px", fontStyle: "bold", color: "#ffffff" })
      .setOrigin(0.5);
    closeBtnCont.add([closeBtnBg, closeBtnTxt]);
    closeBtnBg
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => closeBtnBg.setFillStyle(0xdc2626))
      .on("pointerout", () => closeBtnBg.setFillStyle(0xef4444))
      .on("pointerdown", () => this.destroy());

    this.container.add([headerTitle, headerSub, closeBtnCont]);

    // 4. Left Stage: Character Aura Preview (Width ~280px)
    const stageX = cardX - cardW / 2 + 160;
    const stageY = cardY + 25;
    const stageW = 260;
    const stageH = 340;

    const stageBg = this.scene.add.graphics();
    stageBg.fillStyle(0x020617, 0.9);
    stageBg.fillRoundedRect(stageX - stageW / 2, stageY - stageH / 2, stageW, stageH, 12);
    stageBg.lineStyle(1.5, 0x1e293b, 0.9);
    stageBg.strokeRoundedRect(stageX - stageW / 2, stageY - stageH / 2, stageW, stageH, 12);
    this.container.add(stageBg);

    // Character Switcher Header
    const charSelectCont = this.scene.add.container(stageX, stageY - stageH / 2 + 25);
    const charLabel = this.scene.add
      .text(0, 0, "LUTADOR: GOKU ⇄", {
        fontSize: "12px",
        fontStyle: "bold",
        color: "#60a5fa",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
      })
      .setOrigin(0.5);
    const charHit = this.scene.add
      .rectangle(0, 0, 150, 26, 0x1e293b, 0.7)
      .setStrokeStyle(1, 0x3b82f6)
      .setInteractive({ useHandCursor: true });
    charSelectCont.add([charHit, charLabel]);

    const previewChars = ["goku", "vegeta", "naruto", "gohan"];
    let charIdx = 0;
    charHit.on("pointerdown", () => {
      charIdx = (charIdx + 1) % previewChars.length;
      this.previewCharKey = previewChars[charIdx];
      charLabel.setText(`LUTADOR: ${this.previewCharKey.toUpperCase()} ⇄`);
      this.updateCharacterSprite();
      this.updateAuraVisuals();
    });
    this.container.add(charSelectCont);

    // Aura Glow and Ring under Fighter
    const fighterPosY = stageY + 15;
    this.auraGlow = this.scene.add
      .ellipse(stageX, fighterPosY + 45, 90, 140, 0xffd700, 0.45)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.auraRing = this.scene.add
      .circle(stageX, fighterPosY + 35, 60, 0x000000, 0)
      .setStrokeStyle(3, 0xffff00, 0.7)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.container.add([this.auraGlow, this.auraRing]);

    // Fighter Sprite
    this.previewSprite = this.scene.add
      .sprite(stageX, fighterPosY + 15, "goku_idle")
      .setScale(1.6)
      .setOrigin(0.5, 0.5);
    this.container.add(this.previewSprite);
    this.updateCharacterSprite();

    // Floating Sparks / Ki Particle pool
    for (let i = 0; i < 14; i++) {
      const spark = this.scene.add
        .circle(stageX + Phaser.Math.Between(-35, 35), fighterPosY + 60, Phaser.Math.Between(2, 4), 0xffffff, 0.8)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.auraParticles.push(spark);
      this.container.add(spark);
    }

    // Selected Preset Info card inside stage
    const infoY = stageY + stageH / 2 - 50;
    this.presetNameText = this.scene.add
      .text(stageX, infoY - 14, "SUPER SAIYAJIN", {
        fontSize: "14px",
        fontStyle: "bold",
        color: "#ffd700",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
      })
      .setOrigin(0.5);

    this.descText = this.scene.add
      .text(stageX, infoY + 8, "Chama dourada lendária que eleva o poder ao extremo", {
        fontSize: "11px",
        color: "#94a3b8",
        align: "center",
        wordWrap: { width: stageW - 24 },
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
      })
      .setOrigin(0.5);

    this.container.add([this.presetNameText, this.descText]);

    // Test Charge Ki Button
    const chargeBtn = this.scene.add
      .rectangle(stageX, stageY + stageH / 2 - 14, 180, 26, 0x2563eb)
      .setStrokeStyle(1.5, 0x60a5fa)
      .setInteractive({ useHandCursor: true });
    const chargeTxt = this.scene.add
      .text(stageX, stageY + stageH / 2 - 14, "⚡ TESTAR CARGA (KI)", {
        fontSize: "11px",
        fontStyle: "bold",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
      })
      .setOrigin(0.5);

    chargeBtn.on("pointerdown", () => this.triggerChargeTest());
    this.container.add([chargeBtn, chargeTxt]);

    // 5. Right Section: Presets Grid & Mode Selector
    const gridX = cardX - cardW / 2 + 310;
    const gridY = cardY - cardH / 2 + 80;
    const gridW = cardW - 330;

    // Presets Section Header
    const presetsTitle = this.scene.add
      .text(gridX, gridY, "PALETA DE AURAS DISPONÍVEIS", {
        fontSize: "14px",
        fontStyle: "bold",
        color: "#e2e8f0",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
      })
      .setOrigin(0, 0.5);
    this.container.add(presetsTitle);

    // Create 3x4 Grid of Presets
    const cols = 3;
    const btnW = Math.floor((gridW - 20) / cols);
    const btnH = 50;
    const startGridY = gridY + 22;

    AURA_PRESETS.forEach((preset, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const bx = gridX + col * (btnW + 10) + btnW / 2;
      const by = startGridY + row * (btnH + 8) + btnH / 2;

      const pCont = this.scene.add.container(bx, by);
      const pBg = this.scene.add.graphics();
      pCont.add(pBg);

      // Color preview swatch
      const swatchColor = preset.color === -1 ? 0x94a3b8 : preset.color;
      const swatch = this.scene.add
        .circle(-btnW / 2 + 20, 0, 9, swatchColor)
        .setStrokeStyle(1.5, 0xffffff);
      pCont.add(swatch);

      // Preset Name
      const pName = this.scene.add
        .text(-btnW / 2 + 36, 0, preset.name, {
          fontSize: "12px",
          fontStyle: "bold",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        })
        .setOrigin(0, 0.5);
      pCont.add(pName);

      // Hit area
      const hit = this.scene.add
        .rectangle(0, 0, btnW, btnH, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      pCont.add(hit);

      hit.on("pointerover", () => {
        if (this.selectedPresetId !== preset.id) {
          this.drawPresetButton(pBg, btnW, btnH, false, true);
        }
      });
      hit.on("pointerout", () => {
        this.drawPresetButton(pBg, btnW, btnH, this.selectedPresetId === preset.id, false);
      });
      hit.on("pointerdown", () => {
        this.selectPreset(preset.id);
      });

      this.presetButtons.push({ container: pCont, id: preset.id, bg: pBg });
      this.drawPresetButton(pBg, btnW, btnH, this.selectedPresetId === preset.id, false);
      this.container.add(pCont);
    });

    // 6. Mode Selector (P1 vs All)
    const modeY = startGridY + 4 * (btnH + 8) + 12;
    const modeLabel = this.scene.add
      .text(gridX, modeY, "APLICAR AURA EM:", {
        fontSize: "13px",
        fontStyle: "bold",
        color: "#94a3b8",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
      })
      .setOrigin(0, 0.5);

    const modeBtnW = 240;
    const modeBtnH = 34;
    const modeBtnX = gridX + 220;
    const modeCont = this.scene.add.container(modeBtnX, modeY);

    this.modeBtnBg = this.scene.add.graphics();
    this.modeBtnText = this.scene.add
      .text(0, 0, this.currentMode === "p1" ? "APENAS JOGADOR 1 (P1)" : "TODOS OS LUTADORES", {
        fontSize: "12px",
        fontStyle: "bold",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
      })
      .setOrigin(0.5);

    const modeHit = this.scene.add
      .rectangle(0, 0, modeBtnW, modeBtnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    this.drawModeButton(false);
    modeCont.add([this.modeBtnBg, this.modeBtnText, modeHit]);

    modeHit.on("pointerover", () => this.drawModeButton(true));
    modeHit.on("pointerout", () => this.drawModeButton(false));
    modeHit.on("pointerdown", () => {
      this.currentMode = this.currentMode === "p1" ? "all" : "p1";
      this.modeBtnText.setText(this.currentMode === "p1" ? "APENAS JOGADOR 1 (P1)" : "TODOS OS LUTADORES");
      this.savePreference();
    });

    this.container.add([modeLabel, modeCont]);

    // 7. Footer Save Notification & Done Button
    const footerY = cardY + cardH / 2 - 28;
    this.saveToastText = this.scene.add
      .text(gridX, footerY, "✓ Salvo no LocalStorage", {
        fontSize: "13px",
        fontStyle: "bold",
        color: "#22c55e",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
      })
      .setOrigin(0, 0.5);

    const doneBtn = this.scene.add
      .rectangle(cardX + cardW / 2 - 100, footerY, 150, 36, 0x10b981)
      .setStrokeStyle(1.5, 0xffffff)
      .setInteractive({ useHandCursor: true });
    const doneTxt = this.scene.add
      .text(cardX + cardW / 2 - 100, footerY, "CONCLUIR", {
        fontSize: "14px",
        fontStyle: "bold",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
      })
      .setOrigin(0.5);

    doneBtn
      .on("pointerover", () => doneBtn.setFillStyle(0x059669))
      .on("pointerout", () => doneBtn.setFillStyle(0x10b981))
      .on("pointerdown", () => this.destroy());

    this.container.add([this.saveToastText, doneBtn, doneTxt]);

    // Update Visuals
    this.updateAuraVisuals();

    // Loop for breathing aura particles and pulse
    this.previewTimer = this.scene.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => this.updateAnimationStep(),
    });

    // Enter Animation
    this.container.setScale(0.95);
    this.container.setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      scale: 1,
      alpha: 1,
      duration: 200,
      ease: "Cubic.easeOut",
    });
  }

  private drawPresetButton(g: Phaser.GameObjects.Graphics, w: number, h: number, isSelected: boolean, isHover: boolean) {
    g.clear();
    const radius = 8;
    if (isSelected) {
      g.fillStyle(0x1e3a8a, 0.95);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
      g.lineStyle(2, 0x60a5fa, 1);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
    } else if (isHover) {
      g.fillStyle(0x334155, 0.9);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
      g.lineStyle(1.5, 0x94a3b8, 1);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
    } else {
      g.fillStyle(0x1e293b, 0.8);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
      g.lineStyle(1, 0x334155, 0.8);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
    }
  }

  private drawModeButton(isHover: boolean) {
    this.modeBtnBg.clear();
    const w = 240;
    const h = 34;
    this.modeBtnBg.fillStyle(isHover ? 0x2563eb : 0x1e293b, 0.95);
    this.modeBtnBg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    this.modeBtnBg.lineStyle(1.5, isHover ? 0x93c5fd : 0x3b82f6, 1);
    this.modeBtnBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
  }

  private selectPreset(presetId: string) {
    this.selectedPresetId = presetId;
    const { width } = this.scene.scale;
    const cardW = Math.min(880, width - 40);
    const gridW = cardW - 330;
    const btnW = Math.floor((gridW - 20) / 3);
    const btnH = 50;

    this.presetButtons.forEach((btn) => {
      this.drawPresetButton(btn.bg, btnW, btnH, btn.id === presetId, false);
    });

    this.savePreference();
    this.updateAuraVisuals();

    if (this.scene.cache.audio.exists("sfx_select")) {
      this.scene.sound.play("sfx_select", { volume: 0.5 });
    }
  }

  private savePreference() {
    AuraManager.setPreference(this.selectedPresetId, this.currentMode);

    this.saveToastText.setText("✓ Salvo no LocalStorage");
    this.saveToastText.setAlpha(1);
    this.scene.tweens.add({
      targets: this.saveToastText,
      scale: 1.1,
      duration: 100,
      yoyo: true,
    });
  }

  private updateCharacterSprite() {
    const idleKey = `${this.previewCharKey}_idle`;
    if (this.scene.textures.exists(idleKey)) {
      this.previewSprite.setTexture(idleKey);
      if (this.scene.anims.exists(idleKey)) {
        this.previewSprite.play(idleKey, true);
      }
    }
  }

  private updateAuraVisuals() {
    const preset = AURA_PRESETS.find((p) => p.id === this.selectedPresetId) || AURA_PRESETS[0];

    this.presetNameText.setText(preset.name.toUpperCase());
    this.descText.setText(preset.description);

    let color = preset.color;
    let ring = preset.ringColor;

    if (color === -1) {
      // Default canonical representation for character
      const defaultAura = AuraManager.getBattleAura(this.previewCharKey, true, 0);
      color = defaultAura.auraColor;
      ring = defaultAura.ringColor;
      this.presetNameText.setColor("#94a3b8");
    } else {
      this.presetNameText.setColor(preset.hex);
    }

    this.auraGlow.setFillStyle(color, 0.4);
    this.auraRing.setStrokeStyle(3, ring, 0.75);

    this.auraParticles.forEach((p) => {
      p.setFillStyle(ring, 0.85);
    });
  }

  private triggerChargeTest() {
    if (this.isCharging) return;
    this.isCharging = true;

    const chargeAnim = `${this.previewCharKey}_charge`;
    if (this.scene.anims.exists(chargeAnim)) {
      this.previewSprite.play(chargeAnim, true);
    }

    if (this.scene.cache.audio.exists("sfx_charge")) {
      this.scene.sound.play("sfx_charge", { volume: 0.6 });
    }

    this.scene.tweens.add({
      targets: [this.auraGlow, this.auraRing],
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0.9,
      duration: 600,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.isCharging = false;
        this.updateCharacterSprite();
      },
    });
  }

  private updateAnimationStep() {
    if (!this.container.active) return;
    const time = this.scene.time.now;

    // Pulse Glow
    const pulse = 1 + Math.sin(time * 0.008) * 0.12;
    if (!this.isCharging) {
      this.auraGlow.setScale(pulse);
      this.auraRing.setScale(0.95 + Math.sin(time * 0.015) * 0.08);
    }

    // Move Sparks Upwards
    const stageX = this.auraGlow.x;
    const stageY = this.auraGlow.y;

    this.auraParticles.forEach((spark, i) => {
      spark.y -= 1.8 + (i % 3);
      spark.x += Math.sin(time * 0.005 + i) * 0.8;
      spark.alpha -= 0.018;

      if (spark.y < stageY - 110 || spark.alpha <= 0) {
        spark.y = stageY + Phaser.Math.Between(10, 40);
        spark.x = stageX + Phaser.Math.Between(-35, 35);
        spark.alpha = Phaser.Math.FloatBetween(0.6, 0.95);
      }
    });
  }

  public destroy() {
    if (this.previewTimer) this.previewTimer.remove();
    this.scene.tweens.add({
      targets: this.container,
      scale: 0.95,
      alpha: 0,
      duration: 150,
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.container.destroy();
        if (this.onClose) this.onClose();
      },
    });
  }
}
