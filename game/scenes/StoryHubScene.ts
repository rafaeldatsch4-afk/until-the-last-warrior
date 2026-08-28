import Phaser from "phaser";
import { transitionTo } from "../utils/sceneTransition";
import { syncCloudSaveImmediate } from "../systems/CloudSave";
import { GameState, CharacterData } from "../types";
import { ResponsiveUtils } from "../utils/ResponsiveUtils";
import { generateCustomSprite } from "../sprites/CustomSprite";
import { INITIAL_CHARACTERS } from "../data";

export default class StoryHubScene extends Phaser.Scene {
  private gameState!: GameState;
  
  constructor() {
    super("StoryHubScene");
  }

  private ensureCustomAnimsExist(key: string) {
    const createAnim = (
      animKey: string,
      texture: string,
      start: number,
      end: number,
      frameRate: number,
      repeat: number = -1,
    ) => {
      if (!this.textures.exists(texture)) return;
      if (this.anims.exists(animKey)) return;

      const tex = this.textures.get(texture);
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = start; i <= end; i++) {
        if (!tex.has(i.toString())) {
          frames.push({ key: texture, frame: "0" });
        } else {
          frames.push({ key: texture, frame: i.toString() });
        }
      }
      this.anims.create({
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
      createAnim(`${baseKey}_special`, texKey, 8, 9, 12, -1);
      createAnim(`${baseKey}_defend`, texKey, 10, 10, 10, -1);
      createAnim(`${baseKey}_transform`, texKey, 0, 3, 24, -1);
      createAnim(`${baseKey}_charge`, texKey, 11, 11, 10, -1);
    };

    createAllForTex(key, key);
    createAllForTex(`${key}_ssj`, `${key}_ssj`);
    createAllForTex(`${key}_ui`, `${key}_ui`);
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.gameState = this.registry.get("gameState");

    // Bg
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0515, 0x000000, 0x1f0f38, 0x050510, 1);
    bg.fillRect(0, 0, 960, 540);

    // Grid pattern for retro feel
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x3498db, 0.1);
    for (let x = 0; x < 960; x += 40) grid.moveTo(x, 0).lineTo(x, 540);
    for (let y = 0; y < 540; y += 40) grid.moveTo(0, y).lineTo(960, y);
    grid.strokePath();

    this.add
      .image(480, 270, "arena")
      .setAlpha(0.15)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    const bounds = ResponsiveUtils.getSafeBounds(this);
    const headerY = Math.max(26, bounds.top + 18);

    // --- Header ---
    this.add.text(480, headerY - 2, "MODO HISTÓRIA", {
      fontSize: "20px",
      color: "#f1c40f",
      fontStyle: "900",
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      stroke: "#000000",
      strokeThickness: 4,
      shadow: { color: "#e67e22", blur: 8, fill: true },
    }).setOrigin(0.5);

    const storyState = this.gameState?.storyState;

    if (storyState) {
      this.add.text(480, headerY + 14, `LUTA ${storyState.stage} • PROGRESSÃO DO GUERREIRO`, {
        fontSize: "10.5px",
        color: "#94a3b8",
        fontStyle: "bold",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }).setOrigin(0.5);
    }

    // Back Button (Top Left)
    const backBtnX = Math.max(68, bounds.left + 54);
    this.createHeaderBtn(backBtnX, headerY, 104, 32, "← VOLTAR", 0x1e293b, 0x64748b, () => {
      syncCloudSaveImmediate();
      transitionTo(this, "ModeSelectScene");
    });

    this.input.keyboard?.on("keydown-ESC", () => {
      syncCloudSaveImmediate();
      transitionTo(this, "ModeSelectScene");
    });
    
    // Config Button (Top Right)
    const configBtnX = Math.min(892, bounds.right - 54);
    this.createHeaderBtn(configBtnX, headerY, 104, 32, "⚙ OPÇÕES", 0x1e293b, 0x64748b, () => {
      this.showConfigMenu();
    });

    if (!storyState) return;

    // Layout Dimensions for Mobile/Desktop Harmony
    const contentTopY = headerY + 26;
    const btnHeight = 40;
    const battleBtnY = Math.min(bounds.bottom - btnHeight / 2 - 8, 484);
    const maxPanelBottom = battleBtnY - btnHeight / 2 - 10;
    const panelY = contentTopY;
    const panelHeight = Math.min(345, maxPanelBottom - panelY);

    const availableW = Math.min(900, bounds.width - 16);
    const leftPanelW = Math.min(380, Math.floor(availableW * 0.44));
    const rightPanelW = Math.min(488, Math.floor(availableW * 0.53));
    const gap = 16;
    const totalW = leftPanelW + rightPanelW + gap;
    const leftPanelX = Math.floor(bounds.centerX - totalW / 2);
    const rightPanelX = leftPanelX + leftPanelW + gap;

    // LEFT PANEL (Character & Level)
    const leftPanel = this.add.graphics();
    leftPanel.fillStyle(0x0f172a, 0.85);
    leftPanel.fillRoundedRect(leftPanelX, panelY, leftPanelW, panelHeight, 10);
    leftPanel.lineStyle(1.5, 0x38bdf8, 0.7);
    leftPanel.strokeRoundedRect(leftPanelX, panelY, leftPanelW, panelHeight, 10);

    const char = storyState.customCharacter;
    const charCenterX = leftPanelX + leftPanelW / 2;

    if (char) {
       // Ensure textures and animations exist for custom character
       if (!this.textures.exists("custom_999")) {
         try {
           generateCustomSprite(this, char);
         } catch (e) {
           console.error("Error generating custom sprite in StoryHub:", e);
         }
       }
       this.ensureCustomAnimsExist("custom_999");

       // Character Name Badge
       this.add.text(charCenterX, panelY + 18, char.name.toUpperCase(), { 
           fontSize: "16px", 
           color: "#38bdf8", 
           fontStyle: "900",
           stroke: "#000",
           strokeThickness: 3,
           fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
       }).setOrigin(0.5);

       // Character Pedestal Frame & Shadow
       const pedestalY = panelY + 138;
       const shadow = this.add.graphics();
       // Frame background behind character
       shadow.fillStyle(0x020617, 0.6);
       shadow.fillRoundedRect(charCenterX - 52, panelY + 34, 104, 114, 8);
       shadow.lineStyle(1, 0x1e293b, 0.8);
       shadow.strokeRoundedRect(charCenterX - 52, panelY + 34, 104, 114, 8);

       // Pedestal ellipse
       shadow.fillStyle(0x000000, 0.5);
       shadow.fillEllipse(charCenterX, pedestalY + 2, 50, 10);

       const previewKey = "custom_999"; 
       if (this.anims.exists(previewKey + "_idle")) {
          const sprite = this.add.sprite(charCenterX, pedestalY + 2, previewKey).setScale(1.70).setOrigin(0.5, 0.92);
          sprite.play(previewKey + "_idle");
       } else if (this.textures.exists(previewKey)) {
          this.add.sprite(charCenterX, pedestalY + 2, previewKey, "0").setScale(1.70).setOrigin(0.5, 0.92);
       } else {
          this.add.text(charCenterX, panelY + 90, "IMAGEM\nINDISPONÍVEL", { color: "#fff", fontSize: "12px", align: "center" }).setOrigin(0.5);
       }
    }

    // Edit Visual Shortcut Button (Compact, right below character frame)
    const editSkinBtnY = panelY + 168;
    const editSkinContainer = this.add.container(charCenterX, editSkinBtnY);
    const editSkinBg = this.add.graphics();
    const drawEditSkin = (isHover: boolean) => {
      editSkinBg.clear();
      editSkinBg.fillStyle(isHover ? 0x0284c7 : 0x1e293b, 0.95);
      editSkinBg.fillRoundedRect(-75, -11, 150, 22, 5);
      editSkinBg.lineStyle(1, isHover ? 0x38bdf8 : 0x475569, 0.9);
      editSkinBg.strokeRoundedRect(-75, -11, 150, 22, 5);
    };
    drawEditSkin(false);

    const editSkinTxt = this.add.text(0, 0, "🎨 EDITAR VISUAL", {
      fontSize: "10.5px",
      color: "#94a3b8",
      fontStyle: "bold",
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    }).setOrigin(0.5);

    const editSkinHit = this.add.rectangle(0, 0, 150, 24, 0, 0).setInteractive({ useHandCursor: true });
    editSkinContainer.add([editSkinBg, editSkinTxt, editSkinHit]);

    editSkinHit.on("pointerover", () => {
      drawEditSkin(true);
      editSkinTxt.setColor("#ffffff");
    });
    editSkinHit.on("pointerout", () => {
      drawEditSkin(false);
      editSkinTxt.setColor("#94a3b8");
    });
    editSkinHit.on("pointerdown", () => {
      if (this.sound && this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
      transitionTo(this, "CharacterCreatorScene");
    });

    // Character Level & EXP Progress
    const expNeeded = (storyState.level + 1) * 100;
    const expBarWidth = Math.min(250, leftPanelW - 40);
    const expBarY = panelY + 236;
    const badgeY = panelY + 206;

    // Level Badge (Compact & Centered)
    const lvlBadge = this.add.graphics();
    lvlBadge.fillStyle(0x0284c7, 1);
    lvlBadge.fillCircle(charCenterX, badgeY, 14);
    lvlBadge.lineStyle(2, 0xffffff, 0.9);
    lvlBadge.strokeCircle(charCenterX, badgeY, 14);
    this.add.text(charCenterX, badgeY - 6, "LVL", { fontSize: "7.5px", color: "#e0f2fe", fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(charCenterX, badgeY + 5, `${storyState.level}`, { fontSize: "12.5px", color: "#ffffff", fontStyle: "900" }).setOrigin(0.5);

    // EXP Bar Background
    this.add.rectangle(charCenterX, expBarY, expBarWidth, 16, 0x1e293b).setOrigin(0.5).setStrokeStyle(1.5, 0x475569);
    
    // EXP Bar Fill
    const expRatio = Math.min(1, storyState.exp / expNeeded);
    const expFillWidth = Math.max(0, expBarWidth * expRatio);
    
    const expFill = this.add.graphics();
    expFill.fillGradientStyle(0x10b981, 0x059669, 0x10b981, 0x059669, 1);
    expFill.fillRect(charCenterX - expBarWidth / 2, expBarY - 8, expFillWidth, 16);
    
    // EXP Text (Centered on the bar)
    this.add.text(charCenterX, expBarY, `EXP: ${storyState.exp} / ${expNeeded}`, { 
        fontSize: "10px", 
        color: "#ffffff", 
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3 
    }).setOrigin(0.5);

    // Subtitle indicator on card footer
    this.add.text(charCenterX, panelY + panelHeight - 16, "⚔️ STATUS DE BATALHA: PRONTO", {
        fontSize: "9.5px",
        color: "#38bdf8",
        fontStyle: "bold",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    }).setOrigin(0.5);

    // RIGHT PANEL (Attributes)
    const rightPanel = this.add.graphics();
    rightPanel.fillStyle(0x0f172a, 0.85);
    rightPanel.fillRoundedRect(rightPanelX, panelY, rightPanelW, panelHeight, 10);
    rightPanel.lineStyle(1.5, 0xf59e0b, 0.7);
    rightPanel.strokeRoundedRect(rightPanelX, panelY, rightPanelW, panelHeight, 10);

    const rightPanelCenterX = rightPanelX + rightPanelW / 2;

    this.add.text(rightPanelX + 20, panelY + 18, "ATRIBUTOS DO GUERREIRO", { 
        fontSize: "14px", 
        color: "#f59e0b", 
        fontStyle: "900",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    }).setOrigin(0, 0.5);

    const pointsTxt = this.add.text(rightPanelX + rightPanelW - 20, panelY + 18, `PONTOS: ${storyState.statPoints}`, { 
        fontSize: "13px", 
        color: storyState.statPoints > 0 ? "#fbbf24" : "#64748b",
        fontStyle: "bold",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    }).setOrigin(1, 0.5);
    
    if (storyState.statPoints > 0) {
        this.tweens.add({
            targets: pointsTxt,
            scale: 1.1,
            yoyo: true,
            repeat: -1,
            duration: 500
        });
    }

    const startY = panelY + 48;
    const rowGap = 39;
    const stats = ["attack", "defense", "ki", "speed", "health"];
    const labels: Record<string, string> = {
      attack: "ATAQUE",
      defense: "DEFESA",
      ki: "KI",
      speed: "VELOCIDADE",
      health: "VITALIDADE"
    };
    const colors: Record<string, number> = {
      attack: 0xef4444,
      defense: 0x3b82f6,
      ki: 0xa855f7,
      speed: 0xeab308,
      health: 0x10b981
    };

    stats.forEach((stat, i) => {
       const y = startY + i * rowGap;
       const val = (storyState.stats as any)[stat];
       
       // Row background
       const rowBg = this.add.graphics();
       rowBg.fillStyle(0xffffff, 0.04);
       rowBg.fillRoundedRect(rightPanelX + 16, y - 15, rightPanelW - 32, 31, 6);
       rowBg.lineStyle(1, 0x334155, 0.6);
       rowBg.strokeRoundedRect(rightPanelX + 16, y - 15, rightPanelW - 32, 31, 6);

       // Color indicator pill
       this.add.rectangle(rightPanelX + 26, y, 5, 16, colors[stat]).setOrigin(0.5);

       this.add.text(rightPanelX + 38, y, labels[stat], {
         fontSize: "13px",
         color: "#e2e8f0",
         fontStyle: "bold",
         fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
       }).setOrigin(0, 0.5);

       const valTxt = this.add.text(rightPanelX + rightPanelW - 74, y, val.toString(), {
         fontSize: "15px",
         color: "#ffffff",
         fontStyle: "900",
         fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
       }).setOrigin(1, 0.5);
       
       // Add Button Container & Hitbox
       const btnX = rightPanelX + rightPanelW - 36;
       const addBtnContainer = this.add.container(btnX, y);
       const addBtnBg = this.add.graphics();
       const btnSize = 26;

       const drawAddBtn = (active: boolean, hover: boolean) => {
         addBtnBg.clear();
         if (active) {
           addBtnBg.fillStyle(hover ? 0x16a34a : 0x22c55e, 1);
           addBtnBg.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 5);
           addBtnBg.lineStyle(1.5, 0x86efac, 1);
           addBtnBg.strokeRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 5);
         } else {
           addBtnBg.fillStyle(0x334155, 0.5);
           addBtnBg.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 5);
           addBtnBg.lineStyle(1, 0x475569, 0.5);
           addBtnBg.strokeRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 5);
         }
       };

       const isActive = storyState.statPoints > 0;
       drawAddBtn(isActive, false);

       const addBtnTxt = this.add.text(0, 0, "+", {
         fontSize: "17px",
         color: isActive ? "#000000" : "#64748b",
         fontStyle: "900",
       }).setOrigin(0.5);

       const addHit = this.add.rectangle(0, 0, 40, 32, 0, 0).setInteractive({ useHandCursor: true });
       addBtnContainer.add([addBtnBg, addBtnTxt, addHit]);

       addHit.on("pointerover", () => {
         if (storyState.statPoints > 0) {
           drawAddBtn(true, true);
           this.tweens.add({ targets: addBtnContainer, scale: 1.1, duration: 80 });
         }
       });
       addHit.on("pointerout", () => {
         drawAddBtn(storyState.statPoints > 0, false);
         this.tweens.add({ targets: addBtnContainer, scale: 1, duration: 80 });
       });

       addHit.on("pointerdown", () => {
          if (storyState.statPoints > 0) {
             storyState.statPoints--;
             (storyState.stats as any)[stat]++;
             valTxt.setText((storyState.stats as any)[stat].toString());
             pointsTxt.setText(`PONTOS: ${storyState.statPoints}`);
             
             if (storyState.statPoints <= 0) {
                 pointsTxt.setColor("#64748b");
                 this.tweens.killTweensOf(pointsTxt);
                 pointsTxt.setScale(1);
             } else {
                 pointsTxt.setColor("#fbbf24");
             }

             this.registry.set("gameState", this.gameState);
             if (window.UTLW) window.UTLW.save();
             syncCloudSaveImmediate();
             if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
             
             // Update all buttons visually
             this.events.emit('update-stat-buttons');
             
             // Pop animation
             this.tweens.add({ targets: addBtnContainer, scale: 1.25, duration: 60, yoyo: true });
             this.tweens.add({ targets: valTxt, scale: 1.3, duration: 100, yoyo: true });
          }
       });
       
       this.events.on('update-stat-buttons', () => {
           const hasPts = storyState.statPoints > 0;
           drawAddBtn(hasPts, false);
           addBtnTxt.setColor(hasPts ? "#000000" : "#64748b");
       });
    });

    // Tip regarding Combat inside Right Panel
    this.add.text(rightPanelCenterX, panelY + panelHeight - 16, "💡 DICA: PARRY anula dano (DEFESA) • COMBOS aumentam Ki e dano (VELOCIDADE)", {
       fontSize: "9.5px",
       color: "#94a3b8",
       align: "center",
       fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    }).setOrigin(0.5);

    // --- Bottom Battle Button (Harmoniously Centered with Clean Margins) ---
    const battleBtnContainer = this.add.container(480, battleBtnY).setDepth(200);
    
    const btnGraphics = this.add.graphics();
    const btnWidth = Math.min(440, bounds.width - 48);
    const btnRadius = 8;
    
    const drawBattleBtn = (isHover: boolean) => {
        btnGraphics.clear();
        // Drop Shadow
        btnGraphics.fillStyle(0x000000, 0.45);
        btnGraphics.fillRoundedRect(-btnWidth / 2 + 3, -btnHeight / 2 + 3, btnWidth, btnHeight, btnRadius);

        // Main Surface
        btnGraphics.fillStyle(isHover ? 0xd93829 : 0xe74c3c, 1);
        btnGraphics.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, btnRadius);
        
        // Inner Top Highlight
        btnGraphics.fillStyle(0xffffff, isHover ? 0.2 : 0.12);
        btnGraphics.fillRoundedRect(-btnWidth / 2 + 2, -btnHeight / 2 + 2, btnWidth - 4, btnHeight / 2 - 2, { tl: btnRadius - 1, tr: btnRadius - 1, bl: 0, br: 0 });

        // Border
        btnGraphics.lineStyle(1.5, isHover ? 0xfef08a : 0xfca5a5, 1);
        btnGraphics.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, btnRadius);
    };
    
    drawBattleBtn(false);
    
    const battleTxt = this.add.text(0, 0, `⚔️ ENTRAR NA BATALHA (LUTA ${storyState.stage})`, { 
        fontSize: "15px", 
        color: "#ffffff", 
        fontStyle: "900", 
        stroke: "#000000", 
        strokeThickness: 3,
        letterSpacing: 0.5,
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" 
    }).setOrigin(0.5);
    
    battleBtnContainer.add([btnGraphics, battleTxt]);
    
    const battleHitZone = this.add.rectangle(0, 0, btnWidth, btnHeight + 8, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
    
    battleBtnContainer.add(battleHitZone);
    
    battleHitZone.on("pointerover", () => {
        drawBattleBtn(true);
        this.tweens.add({ targets: battleBtnContainer, scale: 1.03, duration: 100 });
    });
    
    battleHitZone.on("pointerout", () => {
        drawBattleBtn(false);
        this.tweens.add({ targets: battleBtnContainer, scale: 1.0, duration: 100 });
    });
    
    let isStarting = false;
    battleHitZone.on("pointerdown", () => {
       if (isStarting) return;
       isStarting = true;
       if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
       this.tweens.add({
         targets: battleBtnContainer,
         scale: 0.94,
         duration: 60,
         yoyo: true,
         onComplete: () => {
           this.startNextBattle();
         }
       });
    });
  }

  showConfigMenu() {
    const overlay = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.85).setInteractive().setDepth(300);
    const bg = this.add.graphics().setDepth(301);
    bg.fillStyle(0x0f172a, 0.98);
    bg.fillRoundedRect(480 - 210, 270 - 150, 420, 300, 12);
    bg.lineStyle(2, 0xf1c40f, 0.9);
    bg.strokeRoundedRect(480 - 210, 270 - 150, 420, 300, 12);

    const title = this.add.text(480, 160, "OPÇÕES DA HISTÓRIA", {
      fontSize: "20px",
      color: "#f1c40f",
      fontStyle: "900",
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    }).setOrigin(0.5).setDepth(302);

    const editBtn = this.createModalBtn(480, 220, 340, 44, "🎨 EDITAR VISUAL DO PERSONAGEM", 0x0284c7, () => {
       transitionTo(this, "CharacterCreatorScene");
    });

    const deleteBtn = this.createModalBtn(480, 280, 340, 44, "🗑️ REINICIAR MODO HISTÓRIA", 0xd93829, () => {
       this.gameState.storyState = undefined;
       this.registry.set("gameState", this.gameState);
       if (window.UTLW) window.UTLW.save();
       syncCloudSaveImmediate();
       transitionTo(this, "ModeSelectScene");
    });

    const closeBtn = this.createModalBtn(480, 345, 340, 44, "✕ FECHAR", 0x334155, () => {
       overlay.destroy();
       bg.destroy();
       title.destroy();
       editBtn.destroy();
       deleteBtn.destroy();
       closeBtn.destroy();
    });
  }

  createModalBtn(x: number, y: number, width: number, height: number, text: string, color: number, callback: () => void) {
    const container = this.add.container(x, y).setDepth(302);
    const bg = this.add.graphics();
    const radius = 8;

    const drawBtn = (isHover: boolean) => {
      bg.clear();
      bg.fillStyle(isHover ? color : color, isHover ? 1 : 0.9);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
      bg.lineStyle(1.5, isHover ? 0xffffff : 0x94a3b8, isHover ? 1 : 0.6);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
    };
    drawBtn(false);

    const txt = this.add.text(0, 0, text, {
      fontSize: "13px",
      color: "#ffffff",
      fontStyle: "bold",
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(0, 0, width + 10, height + 8, 0x000, 0).setInteractive({ useHandCursor: true });
    container.add([bg, txt, hitArea]);

    hitArea.on("pointerover", () => {
       drawBtn(true);
       this.tweens.add({ targets: container, scale: 1.03, duration: 80 });
    });
    hitArea.on("pointerout", () => {
       drawBtn(false);
       this.tweens.add({ targets: container, scale: 1.0, duration: 80 });
    });
    hitArea.on("pointerdown", () => {
       if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
       this.tweens.add({ targets: container, scale: 0.94, duration: 60, yoyo: true, onComplete: callback });
    });
    
    return {
       destroy: () => {
           container.destroy();
       }
    };
  }

  createHeaderBtn(x: number, y: number, width: number, height: number, text: string, bgColor: number, strokeColor: number, callback: () => void) {
    const container = this.add.container(x, y).setDepth(200);
    const radius = 8;
    const bg = this.add.graphics();

    const drawBtn = (isHover: boolean) => {
      bg.clear();
      bg.fillStyle(0x000000, 0.6);
      bg.fillRoundedRect(-width / 2 + 2, -height / 2 + 2, width, height, radius);
      bg.fillStyle(isHover ? 0xd93829 : bgColor, 0.95);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
      bg.lineStyle(1.5, isHover ? 0xfca5a5 : strokeColor, 0.9);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
    };
    drawBtn(false);

    const txt = this.add.text(0, 0, text, {
      fontSize: "13px",
      color: "#ffffff",
      fontStyle: "bold",
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      resolution: 3,
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(0, 0, width + 24, height + 16, 0, 0).setInteractive({ useHandCursor: true });
    container.add([bg, txt, hitArea]);

    hitArea.on("pointerover", () => {
       drawBtn(true);
       this.tweens.add({ targets: container, scale: 1.05, duration: 100 });
    });
    hitArea.on("pointerout", () => {
       drawBtn(false);
       this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });
    hitArea.on("pointerdown", () => {
       if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
       this.tweens.add({ targets: container, scale: 0.93, duration: 70, yoyo: true, onComplete: callback });
    });

    return container;
  }

  startNextBattle() {
     if (!this.gameState?.storyState) return;
     const storyState = this.gameState.storyState;
     
     // 1. Ensure gameMode is set to story
     this.gameState.gameMode = "story";
     
     // 2. Ensure customCharacter is registered in characters array
     if (storyState.customCharacter) {
        if (!this.gameState.characters) {
           this.gameState.characters = [...INITIAL_CHARACTERS];
        }
        this.gameState.characters = this.gameState.characters.filter(c => c.id !== 999);
        this.gameState.characters.push(storyState.customCharacter);
        
        if (!this.textures.exists("custom_999")) {
           try {
             generateCustomSprite(this, storyState.customCharacter);
           } catch (e) {
             console.error("Error generating custom sprite for battle:", e);
           }
        }
        this.ensureCustomAnimsExist("custom_999");
     }
     
     this.gameState.p1CharacterId = 999;
     
     // 3. Select enemy character based on stage
     const availableBaseChars = (this.gameState.characters || INITIAL_CHARACTERS).filter(c => c.id !== 999);
     const baseList = availableBaseChars.length > 0 ? availableBaseChars : INITIAL_CHARACTERS;
     const enemyIdx = Math.max(0, (storyState.stage - 1) % baseList.length);
     this.gameState.p2CharacterId = baseList[enemyIdx]?.id ?? INITIAL_CHARACTERS[0].id;
     
     // 4. Set difficulty based on stage
     this.gameState.difficulty = Math.min(2, Math.floor(storyState.stage / 5));
     
     // 5. Set thematic battle arena for the stage
     const storyArenas = [
       "arena",            // Stage 1: Planeta Terra
       "arena_namek",      // Stage 2: Namekusei
       "arena_city",       // Stage 3: Cidade Destruída
       "arena_tournament", // Stage 4: Torneio de Artes Marciais
       "arena_ice",        // Stage 5: Geleira Eterna
       "arena_lava",       // Stage 6: Vulcão Infernal
       "arena_desert",     // Stage 7: Deserto Esquecido
       "arena_dark",       // Stage 8: Reino das Trevas (Clímax)
     ];
     this.gameState.selectedArena = storyArenas[(storyState.stage - 1) % storyArenas.length];
     
     this.registry.set("gameState", this.gameState);
     if (window.UTLW) window.UTLW.save();
     syncCloudSaveImmediate();
     
     transitionTo(this, "BattleScene");
  }

  createBtn(x: number, y: number, width: number, height: number, text: string, color: number, callback: () => void) {
    const container = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, width, height, color).setStrokeStyle(2, 0xffffff);
    const txt = this.add.text(0, 0, text, { fontSize: Math.floor(height * 0.4) + "px", color: "#fff", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0.5);
    
    container.add([bg, txt]);
    
    const hitArea = this.add.rectangle(0, 0, width, height, 0x000, 0).setInteractive({ useHandCursor: true });
    container.add(hitArea);
    
    hitArea.on("pointerover", () => {
       bg.setFillStyle(0xffffff);
       txt.setColor("#000");
    });
    
    hitArea.on("pointerout", () => {
       bg.setFillStyle(color);
       txt.setColor("#fff");
    });
    
    hitArea.on("pointerdown", () => {
       if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
       this.tweens.add({ targets: container, scale: 0.9, duration: 50, yoyo: true, onComplete: callback });
    });
    return container;
  }
}

