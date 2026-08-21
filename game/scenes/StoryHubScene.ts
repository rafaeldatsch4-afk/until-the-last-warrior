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

    const bounds = ResponsiveUtils.getSafeBounds();
    this.add.text(480, bounds.top + 45, "MODO HISTÓRIA", {
      fontSize: "36px",
      color: "#f1c40f",
      fontStyle: "900",
      fontFamily: "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
      stroke: "#000",
      strokeThickness: 6,
      shadow: { color: "#e67e22", blur: 10, fill: true }
    }).setOrigin(0.5);

    // Back Button (Top Left)
    this.createBtn(bounds.left + 70, bounds.top + 40, 140, 40, "VOLTAR", 0x34495e, () => {
      syncCloudSaveImmediate();
      transitionTo(this, "ModeSelectScene");
    });
    
    // Config Button (Top Right)
    this.createBtn(bounds.right - 70, bounds.top + 40, 140, 40, "OPÇÕES", 0x34495e, () => {
      this.showConfigMenu();
    });

    const storyState = this.gameState?.storyState;
    if (!storyState) return;

    // LEFT PANEL (Character & Level)
    const leftPanel = this.add.graphics();
    leftPanel.fillStyle(0x000000, 0.6);
    leftPanel.fillRoundedRect(50, 95, 380, 360, 12);
    leftPanel.lineStyle(2, 0x3498db, 0.8);
    leftPanel.strokeRoundedRect(50, 95, 380, 360, 12);

    const char = storyState.customCharacter;
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

       this.add.text(240, 130, char.name.toUpperCase(), { 
           fontSize: "32px", 
           color: "#3498db", 
           fontStyle: "900",
           stroke: "#000",
           strokeThickness: 4,
           fontFamily: "system-ui, -apple-system, sans-serif"
       }).setOrigin(0.5);

       const previewKey = "custom_999"; 
       if (this.anims.exists(previewKey + "_idle")) {
          const sprite = this.add.sprite(240, 250, previewKey).setScale(2.2);
          sprite.play(previewKey + "_idle");
       } else if (this.textures.exists(previewKey)) {
          this.add.sprite(240, 250, previewKey, "0").setScale(2.2);
       } else {
          this.add.text(240, 250, "IMAGEM\nINDISPONÍVEL", { color: "#fff" }).setOrigin(0.5);
       }
    }

    // Character Level & EXP Below Character (Just below feet)
    const expNeeded = (storyState.level + 1) * 100;
    
    const uiY = 415; // Just below the character's feet

    // Exp bar bg
    const barWidth = 260;
    const barX = 240; // Centered exactly under character
    
    // Level Badge (Centered above the EXP bar)
    const badgeY = uiY - 28;
    const lvlBadge = this.add.graphics();
    lvlBadge.fillStyle(0x3498db, 1);
    lvlBadge.fillCircle(barX, badgeY, 18);
    lvlBadge.lineStyle(2, 0xffffff, 1);
    lvlBadge.strokeCircle(barX, badgeY, 18);
    this.add.text(barX, badgeY - 8, "LVL", { fontSize: "10px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(barX, badgeY + 6, `${storyState.level}`, { fontSize: "16px", color: "#fff", fontStyle: "900" }).setOrigin(0.5);

    this.add.rectangle(barX, uiY, barWidth, 20, 0x222222).setOrigin(0.5).setStrokeStyle(2, 0x555555);
    
    // Exp bar fill
    const expRatio = Math.min(1, storyState.exp / expNeeded);
    const expFillWidth = barWidth * expRatio;
    
    const expFill = this.add.graphics();
    expFill.fillGradientStyle(0x2ecc71, 0x27ae60, 0x2ecc71, 0x27ae60, 1);
    expFill.fillRect(barX - barWidth/2, uiY - 10, expFillWidth, 20);
    
    // EXP Text (Centered on the bar)
    this.add.text(barX, uiY, `EXP: ${storyState.exp} / ${expNeeded}`, { 
        fontSize: "12px", 
        color: "#fff", 
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 3 
    }).setOrigin(0.5);

    // RIGHT PANEL (Attributes)
    const rightPanel = this.add.graphics();
    rightPanel.fillStyle(0x000000, 0.6);
    rightPanel.fillRoundedRect(470, 95, 440, 360, 12);
    rightPanel.lineStyle(2, 0xe67e22, 0.8);
    rightPanel.strokeRoundedRect(470, 95, 440, 360, 12);

    this.add.text(690, 130, "ATRIBUTOS", { 
        fontSize: "28px", 
        color: "#e67e22", 
        fontStyle: "900",
        fontFamily: "system-ui, -apple-system, sans-serif"
    }).setOrigin(0.5);

    const pointsTxt = this.add.text(690, 165, `PONTOS RESTANTES: ${storyState.statPoints}`, { 
        fontSize: "18px", 
        color: storyState.statPoints > 0 ? "#f1c40f" : "#7f8c8d",
        fontStyle: "bold"
    }).setOrigin(0.5);
    
    if (storyState.statPoints > 0) {
        this.tweens.add({
            targets: pointsTxt,
            alpha: 0.5,
            yoyo: true,
            repeat: -1,
            duration: 600
        });
    }

    const startY = 210;
    const stats = ["attack", "defense", "ki", "speed", "health"];
    const labels: Record<string, string> = {
      attack: "ATAQUE",
      defense: "DEFESA",
      ki: "KI",
      speed: "VELOCIDADE",
      health: "VITALIDADE"
    };
    const colors: Record<string, number> = {
      attack: 0xe74c3c,
      defense: 0x3498db,
      ki: 0x9b59b6,
      speed: 0xf1c40f,
      health: 0x2ecc71
    };

    stats.forEach((stat, i) => {
       const y = startY + i * 45;
       const val = (storyState.stats as any)[stat];
       
       // Row background
       const rowBg = this.add.graphics();
       rowBg.fillStyle(0xffffff, 0.05);
       rowBg.fillRoundedRect(500, y - 18, 380, 36, 6);

       // Color indicator
       this.add.rectangle(510, y, 8, 20, colors[stat]).setOrigin(0.5);

       this.add.text(525, y, labels[stat], { fontSize: "18px", color: "#ddd", fontStyle: "bold" }).setOrigin(0, 0.5);
       const valTxt = this.add.text(780, y, val.toString(), { fontSize: "22px", color: "#fff", fontStyle: "900" }).setOrigin(1, 0.5);
       
       // Add Button
       const btnSize = 30;
       const btnX = 840;
       
       const addBtnBg = this.add.rectangle(btnX, y, btnSize, btnSize, 0x2ecc71).setOrigin(0.5).setInteractive({ useHandCursor: true });
       const addBtnTxt = this.add.text(btnX, y, "+", { fontSize: "24px", color: "#000", fontStyle: "bold" }).setOrigin(0.5);
       
       if (storyState.statPoints <= 0) {
           addBtnBg.setFillStyle(0x555555);
           addBtnTxt.setColor("#888");
       }

       addBtnBg.on("pointerover", () => {
           if (storyState.statPoints > 0) addBtnBg.setFillStyle(0x27ae60);
       });
       addBtnBg.on("pointerout", () => {
           if (storyState.statPoints > 0) addBtnBg.setFillStyle(0x2ecc71);
       });

       addBtnBg.on("pointerdown", () => {
          if (storyState.statPoints > 0) {
             storyState.statPoints--;
             (storyState.stats as any)[stat]++;
             valTxt.setText((storyState.stats as any)[stat].toString());
             pointsTxt.setText(`PONTOS RESTANTES: ${storyState.statPoints}`);
             
             if (storyState.statPoints <= 0) {
                 pointsTxt.setColor("#7f8c8d");
                 this.tweens.killTweensOf(pointsTxt);
                 pointsTxt.setAlpha(1);
             } else {
                 pointsTxt.setColor("#f1c40f");
             }

             this.registry.set("gameState", this.gameState);
             if (window.UTLW) window.UTLW.save();
             syncCloudSaveImmediate();
             if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
             
             // Update all buttons visually
             this.events.emit('update-stat-buttons');
             
             // Pop animation
             this.tweens.add({ targets: [addBtnBg, addBtnTxt], scale: 1.2, duration: 50, yoyo: true });
             this.tweens.add({ targets: valTxt, scale: 1.3, duration: 100, yoyo: true });
          }
       });
       
       this.events.on('update-stat-buttons', () => {
           if (storyState.statPoints <= 0) {
               addBtnBg.setFillStyle(0x555555);
               addBtnTxt.setColor("#888");
           } else {
               addBtnBg.setFillStyle(0x2ecc71);
               addBtnTxt.setColor("#000");
           }
       });
    });

    // Tip regarding Parry and Defense
    this.add.text(690, 436, "💡 Dica: Defenda no impacto exato para PARRY (+Ki e Contra-Ataque).\nEvoluir DEFESA amplia a janela de tempo do Parry!", {
       fontSize: "11px",
       color: "#bdc3c7",
       align: "center",
       lineSpacing: 3,
    }).setOrigin(0.5);

    // Battle Button
    const hasPoints = storyState.statPoints > 0;
    
    // Slanted Battle Button
    const battleBtnX = 480;
    const battleBtnY = Math.min(490, bounds.bottom - 35);
    
    const battleBtnContainer = this.add.container(battleBtnX, battleBtnY);
    
    const btnGraphics = this.add.graphics();
    const btnWidth = 440;
    const btnHeight = 56;
    
    const drawBtn = (color: number, strokeColor: number = 0xffffff) => {
        btnGraphics.clear();
        btnGraphics.fillStyle(color, 1);
        btnGraphics.beginPath();
        btnGraphics.moveTo(-btnWidth/2 + 20, -btnHeight/2);
        btnGraphics.lineTo(btnWidth/2, -btnHeight/2);
        btnGraphics.lineTo(btnWidth/2 - 20, btnHeight/2);
        btnGraphics.lineTo(-btnWidth/2, btnHeight/2);
        btnGraphics.closePath();
        btnGraphics.fillPath();
        
        btnGraphics.lineStyle(3, strokeColor, 1);
        btnGraphics.strokePath();
    };
    
    drawBtn(0xe74c3c, 0xf39c12);
    
    const battleTxt = this.add.text(0, 0, `⚔ ENTRAR NA BATALHA (LUTA ${storyState.stage})`, { 
        fontSize: "20px", 
        color: "#ffffff", 
        fontStyle: "900", 
        stroke: "#000000",
        strokeThickness: 4,
        fontFamily: "system-ui, -apple-system, sans-serif" 
    }).setOrigin(0.5);
    
    battleBtnContainer.add([btnGraphics, battleTxt]);
    
    // Reliable interactive hit zone using rectangle
    const hitZone = this.add.rectangle(0, 0, btnWidth, btnHeight, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
    
    battleBtnContainer.add(hitZone);
    
    hitZone.on("pointerover", () => {
        drawBtn(0xc0392b, 0xffffff);
        this.tweens.add({ targets: battleBtnContainer, scale: 1.03, duration: 100 });
    });
    
    hitZone.on("pointerout", () => {
        drawBtn(0xe74c3c, 0xf39c12);
        this.tweens.add({ targets: battleBtnContainer, scale: 1.0, duration: 100 });
    });
    
    let isStarting = false;
    hitZone.on("pointerdown", () => {
       if (isStarting) return;
       isStarting = true;
       if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
       this.tweens.add({
         targets: battleBtnContainer,
         scale: 0.95,
         duration: 60,
         yoyo: true,
         onComplete: () => {
           this.startNextBattle();
         }
       });
    });
    
    if (hasPoints) {
        this.add.text(battleBtnX, battleBtnY + 34, "Você tem pontos de atributo não gastos!", {
          fontSize: "12px",
          color: "#f1c40f",
          fontStyle: "bold"
        }).setOrigin(0.5);
    }
  }

  showConfigMenu() {
    const overlay = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.8).setInteractive();
    const bg = this.add.rectangle(480, 270, 400, 300, 0x111111).setStrokeStyle(3, 0xf1c40f);
    const title = this.add.text(480, 160, "OPÇÕES DA HISTÓRIA", { fontSize: "28px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);

    const editBtn = this.createModalBtn(480, 220, 300, 50, "EDITAR VISUAL DO PERSONAGEM", 0x2ecc71, () => {
       transitionTo(this, "CharacterCreatorScene");
    });

    const deleteBtn = this.createModalBtn(480, 290, 300, 50, "EXCLUIR PROGRESSO (RESET)", 0xe74c3c, () => {
       this.gameState.storyState = undefined;
       this.registry.set("gameState", this.gameState);
       if (window.UTLW) window.UTLW.save();
       syncCloudSaveImmediate();
       transitionTo(this, "ModeSelectScene");
    });

    const closeBtn = this.createModalBtn(480, 360, 300, 50, "FECHAR", 0x7f8c8d, () => {
       overlay.destroy();
       bg.destroy();
       title.destroy();
       editBtn.destroy();
       deleteBtn.destroy();
       closeBtn.destroy();
    });
  }

  createModalBtn(x: number, y: number, width: number, height: number, text: string, color: number, callback: () => void) {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, width, height, color).setStrokeStyle(2, 0xffffff);
    const txt = this.add.text(0, 0, text, { fontSize: Math.floor(height * 0.4) + "px", color: "#fff", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0.5);
    container.add([bg, txt]);
    const hitArea = this.add.rectangle(0, 0, width, height, 0x000, 0).setInteractive({ useHandCursor: true });
    container.add(hitArea);
    hitArea.on("pointerdown", () => {
       if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
       this.tweens.add({ targets: container, scale: 0.9, duration: 50, yoyo: true, onComplete: callback });
    });
    
    return {
       destroy: () => {
           container.destroy();
       }
    };
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

