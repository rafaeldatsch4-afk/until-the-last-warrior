import { transitionTo } from "../utils/sceneTransition";
import { syncCloudSaveImmediate } from "../systems/CloudSave";
import Phaser from "phaser";
import { INITIAL_CHARACTERS } from "../data";
import { CharacterData } from "../types";
import { ResponsiveUtils } from "../utils/ResponsiveUtils";
import { CreatorState } from "../creator/CreatorState";
import { CreatorPreview } from "../creator/CreatorPreview";
import { CreatorUI } from "../creator/CreatorUI";
import {
  auraColors,
  giColors,
  hairColors,
  partOptions,
  skinColors,
} from "../creator/CreatorPartOptions";
import { generateCustomSprite } from "../sprites/CustomSprite";
import { AURA_PRESETS, AuraManager } from "../systems/AuraManager";

export default class CharacterCreatorScene extends Phaser.Scene {
  private state = new CreatorState();
  private preview?: CreatorPreview;
  private ui?: CreatorUI;

  private currentBaseObjIndex = 0;
  private currentColorIndex = 0;

  private customSp1Id = "goku";
  private customSp1Name = "Kamehameha";
  private customSp2Id = "goku";
  private customSp2Name = "Spirit Bomb";
  private previewIsTransformed = false;

  private builderData = {
    base: INITIAL_CHARACTERS[0],
    auraColor: auraColors[0],
    name: "Guerreiro Z",
  };

  private readonly AVAILABLE_SPECIALS = [
    { id: "goku", name: "Kamehameha" },
    { id: "vegeta", name: "Galick Gun" },
    { id: "kuririn", name: "Destructo Disc" },
    { id: "piccolo", name: "Special Beam" },
    { id: "trunks", name: "Burning Attack" },
    { id: "freeza", name: "Death Beam" },
    { id: "cell", name: "Kamehameha Solar" },
    { id: "buu", name: "Innocence Cannon" },
    { id: "gohan", name: "Masenko" },
    { id: "naruto", name: "Rasengan" },
    { id: "sasuke", name: "Chidori" },
    { id: "luffy", name: "Gomu Pistol" },
    { id: "zoro", name: "Onigiri" },
    { id: "saitama", name: "Normal Punch" },
    { id: "ichigo", name: "Getsuga Tensho" },
    { id: "jotaro", name: "Ora Ora Punch" },
    { id: "spiderman", name: "Web Shooter" },
    { id: "chapolim", name: "Marreta Bionica" },
  ];

  private readonly AVAILABLE_SUPERS = [
    { id: "goku", name: "Spirit Bomb" },
    { id: "vegeta", name: "Final Flash" },
    { id: "kuririn", name: "Super Disc" },
    { id: "piccolo", name: "Hellzone Grenade" },
    { id: "freeza", name: "Death Ball" },
    { id: "naruto", name: "Rasenshuriken" },
    { id: "sasuke", name: "Kirin" },
    { id: "zoro", name: "Asura" },
    { id: "saitama", name: "Serious Punch" },
    { id: "ichigo", name: "Mugetsu" },
    { id: "jotaro", name: "Star Platinum" },
    { id: "madara", name: "Tengai Shinsei" },
    { id: "obito", name: "Kamui" },
  ];

  private nameDisplayTxt?: Phaser.GameObjects.Text;
  private editIconTxt?: Phaser.GameObjects.Text;
  private particleEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private rightPanelContainer?: Phaser.GameObjects.Container;
  private rightPanelBg?: Phaser.GameObjects.Graphics;
  private headerContainer?: Phaser.GameObjects.Container;
  private backButtonContainer?: Phaser.GameObjects.Container;
  private isShuttingDown: boolean = false;

  constructor() {
    super("CharacterCreatorScene");
  }

  create() {
    this.isShuttingDown = false;
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Registro explícito do ciclo de vida para limpeza total de recursos
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.handleDestroy, this);

    const { width, height } = this.cameras.main;
    const bounds = ResponsiveUtils.getSafeBounds(this);

    // 1. Cosmic Gradient Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x060913, 0x0a1020, 0x03060c, 0x020408, 1);
    bg.fillRect(0, 0, width, height);

    // Subtle Hex/Grid Lines
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1e293b, 0.2);
    for (let x = 0; x < width; x += 44) grid.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y < height; y += 44) grid.moveTo(0, y).lineTo(width, y);
    grid.strokePath();

    // Ambient floating embers/energy particles
    if (this.textures.exists("particle")) {
      this.particleEmitter = this.add.particles(0, 0, "particle", {
        x: { min: 0, max: width },
        y: { min: 0, max: height },
        lifespan: 4000,
        speedY: { min: -10, max: -26 },
        speedX: { min: -6, max: 6 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.3, end: 0 },
        tint: [0x38bdf8, 0xfacc15, 0x818cf8],
        quantity: 1,
        frequency: 300,
        blendMode: "ADD",
      });
    }

    if (this.cameras.main.postFX) {
      this.cameras.main.postFX.addVignette(0.5, 0.5, 0.75, 0.35);
    }

    // 2. TOP HEADER
    const headerY = Math.max(26, bounds.top + 22);
    this.backButtonContainer = this.createHeaderBackButton(bounds.left + 64, headerY);

    this.headerContainer = this.add.container(width / 2, headerY);
    const headerTitle = this.add
      .text(0, -5, "CRIAR PERSONAGEM", {
        fontSize: "20px",
        fontStyle: "900",
        color: "#facc15",
        stroke: "#000000",
        strokeThickness: 3.5,
        letterSpacing: 2,
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        shadow: { color: "#000000", blur: 4, fill: true, stroke: true },
        resolution: 2,
      })
      .setOrigin(0.5);

    const headerSub = this.add
      .text(0, 13, "ESTÚDIO DE CUSTOMIZAÇÃO DE GUERREIROS", {
        fontSize: "9.5px",
        fontStyle: "bold",
        color: "#94a3b8",
        letterSpacing: 1.5,
        fontFamily: "system-ui, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    this.headerContainer.add([headerTitle, headerSub]);

    // 3. RESPONSIVE TWO-COLUMN LAYOUT (Balanced proportions)
    const contentTopY = bounds.top + 46;
    const contentH = Math.min(474, bounds.bottom - contentTopY - 12);

    // Dynamic columns for standard & ultra-wide screens
    const availableW = bounds.width - 24;
    const leftColW = Math.min(540, Math.floor(availableW * 0.58));
    const rightColW = Math.min(370, Math.floor(availableW * 0.40));
    const gap = 14;
    const totalW = leftColW + rightColW + gap;
    const startX = Math.max(bounds.left + 8, Math.floor(bounds.centerX - totalW / 2));

    const leftColX = startX;
    const rightColX = leftColX + leftColW + gap;

    // Load saved character data if present
    this.loadInitialCustomData();

    // 4. PREVIEW INITIALIZATION (Positioned precisely within the character stage viewport above the buttons)
    const previewCenterX = rightColX + rightColW / 2;
    const stageTop = contentTopY + 52;
    const stageBottom = contentTopY + contentH - 96;
    const stageH = Math.max(160, stageBottom - stageTop);
    const previewCenterY = stageTop + Math.floor(stageH * 0.46);

    this.preview = new CreatorPreview(this, previewCenterX, previewCenterY, stageH);
    this.ui = new CreatorUI(this, () => this.updatePreview());
    this.ui.onTestCharge = () => {
      if (this.preview) {
        this.preview.triggerChargeEffect();
      }
    };

    // 5. LEFT COLUMN: STUDIO CUSTOMIZER (Tabs: Estilo, Cores, Aura, Poderes)
    this.ui.customSp1Id = this.customSp1Id;
    this.ui.customSp1Name = this.customSp1Name;
    this.ui.customSp2Id = this.customSp2Id;
    this.ui.customSp2Name = this.customSp2Name;

    this.ui.initStudioPanel(
      leftColX,
      contentTopY,
      leftColW,
      contentH,
      this.state,
      this.AVAILABLE_SPECIALS,
      this.AVAILABLE_SUPERS
    );

    // 6. RIGHT COLUMN: SHOWCASE STAGE & ACTIONS
    this.buildRightShowcasePanel(
      rightColX,
      contentTopY,
      rightColW,
      contentH,
      previewCenterX,
      previewCenterY
    );

    // Renderização inicial imediata do preview
    if (this.preview) {
      this.preview.updatePreviewImmediate(
        this.state,
        this.currentBaseObjIndex,
        this.currentColorIndex,
        this.customSp1Id,
        this.customSp2Id,
        this.previewIsTransformed
      );
    }
  }

  private loadInitialCustomData() {
    const pref = AuraManager.getPreference();
    this.state.aura_preset_id = pref.id;
    this.state.aura_mode = pref.mode;

    const initialPreset = AURA_PRESETS.find((p) => p.id === pref.id) || AURA_PRESETS[1];
    if (initialPreset && initialPreset.color !== -1) {
      this.builderData.auraColor = initialPreset.color;
    }

    const gameState = this.registry.get("gameState");
    if (gameState && gameState.characters) {
      const existing = gameState.characters.find((c: CharacterData) => c.id === 999);
      if (existing) {
        if (existing.name) this.builderData.name = existing.name;
        if (existing.specialColor) this.builderData.auraColor = existing.specialColor;
        if (existing.customData) {
          const cd = existing.customData as any;
          if (cd.aura_id) {
            this.state.aura_preset_id = cd.aura_id;
            const p = AURA_PRESETS.find((pr) => pr.id === cd.aura_id);
            if (p && p.color !== -1) this.builderData.auraColor = p.color;
          }
          if (cd.part_head) {
            const idx = partOptions.head.indexOf(cd.part_head);
            if (idx !== -1) this.state.style_idx.head = idx;
          }
          if (cd.part_torso) {
            const idx = partOptions.torso.indexOf(cd.part_torso);
            if (idx !== -1) this.state.style_idx.torso = idx;
          }
          if (cd.part_legs) {
            const idx = partOptions.legs.indexOf(cd.part_legs);
            if (idx !== -1) this.state.style_idx.legs = idx;
          }
          if (cd.part_feet) {
            const idx = partOptions.feet.indexOf(cd.part_feet);
            if (idx !== -1) this.state.style_idx.feet = idx;
          }
          if (cd.part_accessory) {
            const idx = partOptions.accessory.indexOf(cd.part_accessory);
            if (idx !== -1) this.state.style_idx.accessory = idx;
          }

          if (cd.sp1_id) {
            this.customSp1Id = cd.sp1_id;
            const sp = this.AVAILABLE_SPECIALS.find((s) => s.id === cd.sp1_id);
            if (sp) this.customSp1Name = sp.name;
          }
          if (cd.sp2_id) {
            this.customSp2Id = cd.sp2_id;
            const sp = this.AVAILABLE_SUPERS.find((s) => s.id === cd.sp2_id);
            if (sp) this.customSp2Name = sp.name;
          }
        }
      }
    }
  }

  private buildRightShowcasePanel(
    panelX: number,
    panelY: number,
    panelW: number,
    panelH: number,
    _previewCenterX: number,
    _previewCenterY: number
  ) {
    if (this.rightPanelBg) {
      this.rightPanelBg.destroy();
      this.rightPanelBg = undefined;
    }
    if (this.rightPanelContainer) {
      this.rightPanelContainer.destroy(true);
      this.rightPanelContainer = undefined;
    }

    // 1. Right Glass Panel Background (Depth 3: underneath character preview, pedestal & auras)
    const bg = this.add.graphics().setDepth(3);
    this.rightPanelBg = bg;
    bg.fillStyle(0x0a0f1d, 0.88);
    bg.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
    bg.lineStyle(1.5, 0x1e293b, 0.9);
    bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

    // Corner accents
    bg.lineStyle(2, 0xfacc15, 0.7);
    const bLen = 14;
    // Top-Left
    bg.moveTo(panelX, panelY + bLen).lineTo(panelX, panelY).lineTo(panelX + bLen, panelY);
    // Top-Right
    bg.moveTo(panelX + panelW - bLen, panelY).lineTo(panelX + panelW, panelY).lineTo(panelX + panelW, panelY + bLen);
    // Bottom-Left
    bg.moveTo(panelX, panelY + panelH - bLen).lineTo(panelX, panelY + panelH).lineTo(panelX + bLen, panelY + panelH);
    // Bottom-Right
    bg.moveTo(panelX + panelW - bLen, panelY + panelH).lineTo(panelX + panelW, panelY + panelH).lineTo(panelX + panelW, panelY + panelH - bLen);
    bg.strokePath();

    // 2. Interactive container for Name Card, SSJ/Random Buttons, and Save Button (Depth 25: on top of stage)
    const container = this.add.container(panelX, panelY).setDepth(25);
    this.rightPanelContainer = container;

    // 2. Character Name Header Card (Interactive click to edit name)
    const nameCardW = panelW - 24;
    const nameCardH = 38;
    const nameCardY = 10;
    const nameCardCenterX = panelW / 2;

    const nameCardBg = this.add.graphics();
    const drawNameBg = (isHover: boolean) => {
      nameCardBg.clear();
      nameCardBg.fillStyle(isHover ? 0x1e293b : 0x0f172a, 0.95);
      nameCardBg.fillRoundedRect(12, nameCardY, nameCardW, nameCardH, 6);
      nameCardBg.lineStyle(1.5, isHover ? 0x38bdf8 : 0x334155, 0.9);
      nameCardBg.strokeRoundedRect(12, nameCardY, nameCardW, nameCardH, 6);
    };
    drawNameBg(false);

    this.nameDisplayTxt = this.add
      .text(nameCardCenterX - 8, nameCardY + nameCardH / 2, `⚔️ ${this.builderData.name}`, {
        fontSize: "14px",
        fontStyle: "bold",
        color: "#facc15",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    this.editIconTxt = this.add
      .text(nameCardCenterX + this.nameDisplayTxt.width / 2 + 10, nameCardY + nameCardH / 2, "✎", {
        fontSize: "13px",
        color: "#38bdf8",
      })
      .setOrigin(0.5);

    const nameHit = this.add
      .rectangle(nameCardCenterX, nameCardY + nameCardH / 2, nameCardW, nameCardH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    nameHit.on("pointerover", () => {
      if (this.isShuttingDown) return;
      drawNameBg(true);
      if (this.editIconTxt) this.editIconTxt.setColor("#facc15");
    });
    nameHit.on("pointerout", () => {
      if (this.isShuttingDown) return;
      drawNameBg(false);
      if (this.editIconTxt) this.editIconTxt.setColor("#38bdf8");
    });
    nameHit.on("pointerdown", () => {
      if (this.isShuttingDown) return;
      window.dispatchEvent(
        new CustomEvent("request-text-input", {
          detail: {
            title: "Nome do seu Guerreiro:",
            currentValue: this.builderData.name,
            onComplete: (newName: string) => {
              if (this.isShuttingDown) return;
              if (newName && newName.trim().length > 0) {
                this.builderData.name = newName.trim().substring(0, 16);
                if (this.nameDisplayTxt && this.editIconTxt) {
                  this.nameDisplayTxt.setText(`⚔️ ${this.builderData.name}`);
                  this.editIconTxt.setX(nameCardCenterX + this.nameDisplayTxt.width / 2 + 10);
                }
              }
            },
          },
        })
      );
    });

    container.add([nameCardBg, this.nameDisplayTxt, this.editIconTxt, nameHit]);

    // 3. Action Row: [ ⚡ SSJ MODE ] & [ 🎲 ALEATÓRIO ]
    const btnRowY = panelH - 74;
    const halfBtnW = (panelW - 32) / 2;

    const transBtnX = 12 + halfBtnW / 2;
    const transBtn = this.createStageActionButton(
      transBtnX,
      btnRowY,
      halfBtnW,
      34,
      "⚡ SSJ MODE",
      0xd97706,
      () => {
        this.previewIsTransformed = !this.previewIsTransformed;
        this.updatePreview();
      }
    );

    const randBtnX = 12 + halfBtnW + 8 + halfBtnW / 2;
    const randBtn = this.createStageActionButton(
      randBtnX,
      btnRowY,
      halfBtnW,
      34,
      "🎲 ALEATÓRIO",
      0x7c3aed,
      () => {
        this.randomizeCharacter();
      }
    );

    container.add([transBtn, randBtn]);

    // 4. PRIMARY CTA: [ 💾 SALVAR E EQUIPAR ]
    const saveBtnY = panelH - 30;
    const saveBtnW = panelW - 24;
    const saveBtn = this.createHeroSaveButton(
      panelW / 2,
      saveBtnY,
      saveBtnW,
      46,
      "SALVAR E EQUIPAR",
      () => {
        this.saveAndEquipCharacter();
      }
    );

    container.add(saveBtn);
  }

  private createStageActionButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    colorHex: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    const drawBg = (isHover: boolean) => {
      bg.clear();
      bg.fillStyle(isHover ? colorHex : 0x0f172a, 0.95);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
      bg.lineStyle(1.5, isHover ? 0xffffff : colorHex, 0.9);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    };
    drawBg(false);

    const txt = this.add
      .text(0, 0, label, {
        fontSize: "12px",
        fontStyle: "bold",
        color: "#ffffff",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    const hit = this.add
      .rectangle(0, 0, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hit.on("pointerover", () => {
      if (this.isShuttingDown) return;
      drawBg(true);
      this.tweens.add({ targets: container, scale: 1.04, duration: 100 });
    });
    hit.on("pointerout", () => {
      if (this.isShuttingDown) return;
      drawBg(false);
      this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });
    hit.on("pointerdown", () => {
      if (this.isShuttingDown) return;
      this.tweens.add({
        targets: container,
        scale: 0.95,
        yoyo: true,
        duration: 60,
        onComplete: onClick,
      });
    });

    container.add([bg, txt, hit]);
    return container;
  }

  private createHeroSaveButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    const drawBg = (isHover: boolean) => {
      bg.clear();
      bg.fillStyle(0x000000, 0.4);
      bg.fillRoundedRect(-w / 2 + 2, -h / 2 + 2, w, h, 8);
      bg.fillStyle(isHover ? 0x16a34a : 0x15803d, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
      bg.lineStyle(2, isHover ? 0x86efac : 0x22c55e, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    };
    drawBg(false);

    const txt = this.add
      .text(0, 0, `💾  ${label}`, {
        fontSize: "14px",
        fontStyle: "900",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        letterSpacing: 1,
        stroke: "#064e3b",
        strokeThickness: 3,
        resolution: 2,
      })
      .setOrigin(0.5);

    const hit = this.add
      .rectangle(0, 0, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hit.on("pointerover", () => {
      if (this.isShuttingDown) return;
      drawBg(true);
      this.tweens.add({ targets: container, scale: 1.03, duration: 120 });
    });
    hit.on("pointerout", () => {
      if (this.isShuttingDown) return;
      drawBg(false);
      this.tweens.add({ targets: container, scale: 1, duration: 120 });
    });
    hit.on("pointerdown", () => {
      if (this.isShuttingDown) return;
      this.tweens.add({
        targets: container,
        scale: 0.96,
        yoyo: true,
        duration: 80,
        onComplete: onClick,
      });
    });

    container.add([bg, txt, hit]);
    return container;
  }

  private createHeaderBackButton(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setDepth(200);

    const bg = this.add.graphics();
    const btnW = 104;
    const btnH = 34;

    const drawBg = (isHover: boolean) => {
      bg.clear();
      bg.fillStyle(0x000000, 0.6);
      bg.fillRoundedRect(-btnW / 2 + 2, -btnH / 2 + 2, btnW, btnH, 6);
      bg.fillStyle(isHover ? 0x334155 : 0x1e293b, 0.95);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
      bg.lineStyle(1.5, isHover ? 0x38bdf8 : 0x475569, 0.9);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
    };
    drawBg(false);

    const txt = this.add
      .text(0, 0, "← VOLTAR", {
        fontSize: "13px",
        fontStyle: "bold",
        color: "#ffffff",
        fontFamily: "system-ui, sans-serif",
        resolution: 3,
      })
      .setOrigin(0.5);

    // Generous touch hitbox for mobile
    const hit = this.add
      .rectangle(0, 0, 130, 48, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    const handleBack = () => {
      if (this.isShuttingDown) return;
      if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
      const gs = this.registry.get("gameState");
      if (gs && gs.gameMode === "story") {
        transitionTo(this, "ModeSelectScene");
      } else {
        transitionTo(this, "MenuScene");
      }
    };

    hit.on("pointerover", () => {
      if (this.isShuttingDown) return;
      drawBg(true);
      txt.setColor("#38bdf8");
      this.tweens.add({ targets: container, scale: 1.05, duration: 100 });
    });
    hit.on("pointerout", () => {
      if (this.isShuttingDown) return;
      drawBg(false);
      txt.setColor("#ffffff");
      this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });
    hit.on("pointerdown", () => {
      if (this.isShuttingDown) return;
      this.tweens.add({
        targets: container,
        scale: 0.93,
        duration: 70,
        yoyo: true,
        onComplete: handleBack,
      });
    });

    this.input.keyboard?.on("keydown-ESC", handleBack);

    container.add([bg, txt, hit]);
    return container;
  }

  private randomizeCharacter() {
    if (this.isShuttingDown) return;

    // Randomize styles
    this.state.style_idx.accessory = Phaser.Math.Between(0, partOptions.accessory.length - 1);
    const availableHeads = this.state.getAvailableHeads();
    this.state.style_idx.head = Phaser.Math.Between(0, availableHeads.length - 1);
    this.state.style_idx.torso = Phaser.Math.Between(0, partOptions.torso.length - 1);
    this.state.style_idx.legs = Phaser.Math.Between(0, partOptions.legs.length - 1);
    this.state.style_idx.feet = Phaser.Math.Between(0, partOptions.feet.length - 1);
    this.state.validateConstraints();

    // Randomize colors
    this.state.p_idx.skin = Phaser.Math.Between(0, skinColors.length - 1);
    this.state.p_idx.hair = Phaser.Math.Between(0, hairColors.length - 1);
    this.state.p_idx.torso_1 = Phaser.Math.Between(0, giColors.length - 1);
    this.state.p_idx.torso_2 = Phaser.Math.Between(0, giColors.length - 1);
    this.state.p_idx.legs_1 = Phaser.Math.Between(0, giColors.length - 1);
    this.state.p_idx.legs_2 = Phaser.Math.Between(0, giColors.length - 1);
    this.state.p_idx.feet_1 = Phaser.Math.Between(0, giColors.length - 1);
    this.state.p_idx.feet_2 = Phaser.Math.Between(0, giColors.length - 1);
    this.state.p_idx.acc_1 = Phaser.Math.Between(0, giColors.length - 1);

    // Randomize specials
    const sp1 = Phaser.Utils.Array.GetRandom(this.AVAILABLE_SPECIALS);
    const sp2 = Phaser.Utils.Array.GetRandom(this.AVAILABLE_SUPERS);
    this.customSp1Id = sp1.id;
    this.customSp1Name = sp1.name;
    this.customSp2Id = sp2.id;
    this.customSp2Name = sp2.name;

    if (this.ui) {
      this.ui.customSp1Id = sp1.id;
      this.ui.customSp1Name = sp1.name;
      this.ui.customSp2Id = sp2.id;
      this.ui.customSp2Name = sp2.name;
    }

    // Refresh UI & Preview
    this.updatePreview();

    const bounds = ResponsiveUtils.getSafeBounds(this);
    const contentTopY = bounds.top + 48;
    const contentH = Math.min(450, bounds.bottom - contentTopY - 10);
    const availableW = bounds.width;
    const leftColW = Math.min(515, Math.floor(availableW * 0.58));
    const rightColW = Math.min(345, Math.floor(availableW * 0.38));
    const gap = 16;
    const totalW = leftColW + rightColW + gap;
    const startX = Math.max(bounds.left + 4, Math.floor(bounds.centerX - totalW / 2));

    if (this.ui) {
      this.ui.initStudioPanel(
        startX,
        contentTopY,
        leftColW,
        contentH,
        this.state,
        this.AVAILABLE_SPECIALS,
        this.AVAILABLE_SUPERS
      );
    }
  }

  private updatePreview() {
    if (this.isShuttingDown || !this.preview) return;

    this.preview.updatePreview(
      this.state,
      this.currentBaseObjIndex,
      this.currentColorIndex,
      this.customSp1Id,
      this.customSp2Id,
      this.previewIsTransformed
    );
  }

  private saveAndEquipCharacter() {
    if (this.isShuttingDown) return;

    const preset =
      AURA_PRESETS.find((p) => p.id === this.state.aura_preset_id) || AURA_PRESETS[1];
    const auraColor = preset.color !== -1 ? preset.color : 0xffd700;
    this.builderData.auraColor = auraColor;
    AuraManager.setPreference(this.state.aura_preset_id, this.state.aura_mode);

    const customData = {
      gi1: 0,
      gi2: 0,
      skin: skinColors[this.state.p_idx.skin],
      hair: hairColors[this.state.p_idx.hair],
      color_torso_1: giColors[this.state.p_idx.torso_1],
      color_torso_2: giColors[this.state.p_idx.torso_2],
      color_legs_1: giColors[this.state.p_idx.legs_1],
      color_legs_2: giColors[this.state.p_idx.legs_2],
      color_feet_1: giColors[this.state.p_idx.feet_1],
      color_feet_2: giColors[this.state.p_idx.feet_2],
      color_head_1: giColors[this.state.p_idx.head_1],
      color_head_2: giColors[this.state.p_idx.head_2],
      color_acc_1: giColors[this.state.p_idx.acc_1],
      aura_id: this.state.aura_preset_id,
      aura_color: auraColor,
      aura_ring_color: preset.ringColor,
      sp1_id: this.customSp1Id || this.builderData.base.key,
      sp2_id: this.customSp2Id || this.builderData.base.key,
      part_head: this.state.getEquippedHead(),
      part_torso: partOptions.torso[this.state.style_idx.torso],
      part_legs: partOptions.legs[this.state.style_idx.legs],
      part_feet: partOptions.feet[this.state.style_idx.feet],
      part_accessory: this.state.getEquippedAccessory(),
    };

    const customChar: CharacterData = {
      ...this.builderData.base,
      id: 999,
      key: "custom_999",
      baseKey: this.builderData.base.key,
      name: this.builderData.name,
      specialColor: auraColor,
      specialName: this.customSp1Name || this.builderData.base.specialName,
      superName: this.customSp2Name || this.builderData.base.superName,
      price: 0,
      unlocked: true,
      customData: customData,
    };

    generateCustomSprite(this, customChar);

    const createAllForTex = (baseKey: string, texKey: string) => {
      const createAnim = (
        animKey: string,
        start: number,
        end: number,
        frameRate: number,
        repeat: number = -1
      ) => {
        if (this.anims.exists(animKey)) this.anims.remove(animKey);
        const frames = [];
        for (let i = start; i <= end; i++) {
          frames.push({ key: texKey, frame: i.toString() });
        }
        if (frames.length > 0) {
          this.anims.create({ key: animKey, frames, frameRate, repeat });
        }
      };
      createAnim(`${baseKey}_idle`, 0, 3, 10, -1);
      createAnim(`${baseKey}_walk`, 4, 7, 12, -1);
      createAnim(`${baseKey}_attack`, 8, 9, 16, 0);
      createAnim(`${baseKey}_special`, 8, 9, 12, -1);
      createAnim(`${baseKey}_defend`, 10, 10, 10, -1);
      createAnim(`${baseKey}_transform`, 0, 3, 24, -1);
      createAnim(`${baseKey}_charge`, 11, 11, 10, -1);
    };

    createAllForTex("custom_999", "custom_999");
    createAllForTex("custom_999_ssj", "custom_999_ssj");
    createAllForTex("custom_999_ui", "custom_999_ui");

    const gameState = this.registry.get("gameState");
    if (gameState) {
      gameState.characters = (gameState.characters || []).filter((c: CharacterData) => c.id !== 999);
      gameState.characters.push(customChar);
      gameState.p1CharacterId = 999;
      this.registry.set("gameState", gameState);
      // @ts-ignore
      if (window.UTLW) window.UTLW.save();
      syncCloudSaveImmediate();
    }

    if (gameState?.gameMode === "story") {
      if (!gameState.storyState) {
        gameState.storyState = {
          level: 0,
          exp: 0,
          statPoints: 0,
          stats: { attack: 10, defense: 10, ki: 10, speed: 10, health: 100 },
          stage: 1,
        };
      }
      gameState.storyState.customCharacter = customChar;
      this.registry.set("gameState", gameState);
      // @ts-ignore
      if (window.UTLW) window.UTLW.save();
      syncCloudSaveImmediate();
      transitionTo(this, "StoryHubScene");
      return;
    }

    // Success Toast Notification
    const toast = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2).setDepth(2000);
    const toastBg = this.add.graphics();
    toastBg.fillStyle(0x064e3b, 0.95);
    toastBg.fillRoundedRect(-180, -26, 360, 52, 10);
    toastBg.lineStyle(2, 0x4ade80, 1);
    toastBg.strokeRoundedRect(-180, -26, 360, 52, 10);

    const toastTxt = this.add
      .text(0, 0, "✓ GUERREIRO EQUIPADO COMO PLAYER 1!", {
        fontSize: "13px",
        fontStyle: "bold",
        color: "#ffffff",
        fontFamily: "system-ui, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    toast.add([toastBg, toastTxt]);
    this.tweens.add({
      targets: toast,
      scale: { from: 0.8, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 200,
      ease: "Back.easeOut",
      onComplete: () => {
        if (this.isShuttingDown) return;
        this.time.delayedCall(1600, () => {
          if (this.isShuttingDown || !toast.scene) return;
          this.tweens.add({
            targets: toast,
            alpha: 0,
            y: toast.y - 20,
            duration: 300,
            onComplete: () => toast.destroy(true),
          });
        });
      },
    });
  }

  private handleShutdown() {
    this.isShuttingDown = true;

    // 1. Interromper todos os tweens e timers da cena
    this.tweens.killAll();
    this.time.removeAllEvents();

    // 2. Destruição segura de UI e Preview
    if (this.ui) {
      this.ui.destroy();
      this.ui = undefined;
    }

    if (this.preview) {
      this.preview.destroy();
      this.preview = undefined;
    }

    // 3. Destruir containers locais
    if (this.rightPanelBg) {
      this.rightPanelBg.destroy();
      this.rightPanelBg = undefined;
    }
    if (this.rightPanelContainer) {
      this.rightPanelContainer.destroy(true);
      this.rightPanelContainer = undefined;
    }
    if (this.headerContainer) {
      this.headerContainer.destroy(true);
      this.headerContainer = undefined;
    }
    if (this.backButtonContainer) {
      this.backButtonContainer.destroy(true);
      this.backButtonContainer = undefined;
    }

    // 4. Limpar emissores de partículas
    if (this.particleEmitter) {
      this.particleEmitter.destroy();
      this.particleEmitter = undefined;
    }

    // 5. Remover ouvintes de eventos da cena e de input
    this.input.removeAllListeners();
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.events.off(Phaser.Scenes.Events.DESTROY, this.handleDestroy, this);
  }

  private handleDestroy() {
    this.handleShutdown();
  }
}
