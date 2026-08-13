import Phaser from "phaser";
import { transitionTo } from "../utils/sceneTransition";
import { syncCloudSaveImmediate } from "../systems/CloudSave";
import { GameState } from "../types";
import { ResponsiveUtils } from "../utils/ResponsiveUtils";

export default class StoryHubScene extends Phaser.Scene {
  private gameState!: GameState;
  
  constructor() {
    super("StoryHubScene");
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
    const title = this.add.text(480, bounds.top + 45, "MODO HISTÓRIA", {
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

    const storyState = this.gameState.storyState;
    if (!storyState) return;

    // LEFT PANEL (Character & Level)
    const leftPanel = this.add.graphics();
    leftPanel.fillStyle(0x000000, 0.6);
    leftPanel.fillRoundedRect(50, 95, 380, 360, 12);
    leftPanel.lineStyle(2, 0x3498db, 0.8);
    leftPanel.strokeRoundedRect(50, 95, 380, 360, 12);

    const char = storyState.customCharacter;
    if (char) {
       this.add.text(240, 130, char.name.toUpperCase(), { 
           fontSize: "32px", 
           color: "#3498db", 
           fontStyle: "900",
           stroke: "#000",
           strokeThickness: 4,
           fontFamily: "system-ui, -apple-system, sans-serif"
       }).setOrigin(0.5);

       let previewKey = "custom_999"; 
       if (this.anims.exists(previewKey + "_idle")) {
          const sprite = this.add.sprite(240, 250, previewKey).setScale(2);
          sprite.play(previewKey + "_idle");
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
    lvlBadge.fillStyle(0x3498db, 1); // Blue to match the theme instead of red
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

    let startY = 210;
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

    // Battle Button
    // If we have stat points, maybe we want to hint the user
    const hasPoints = storyState.statPoints > 0;
    
    // Slanted Battle Button
    const battleBtnX = 480;
    const battleBtnY = 490;
    
    const battleBtnContainer = this.add.container(battleBtnX, battleBtnY);
    
    // We will use a shape for slanted button
    const btnGraphics = this.add.graphics();
    const btnWidth = 400;
    const btnHeight = 60;
    
    const drawBtn = (color: number) => {
        btnGraphics.clear();
        btnGraphics.fillStyle(color, 1);
        btnGraphics.beginPath();
        btnGraphics.moveTo(-btnWidth/2 + 20, -btnHeight/2);
        btnGraphics.lineTo(btnWidth/2, -btnHeight/2);
        btnGraphics.lineTo(btnWidth/2 - 20, btnHeight/2);
        btnGraphics.lineTo(-btnWidth/2, btnHeight/2);
        btnGraphics.closePath();
        btnGraphics.fillPath();
        
        btnGraphics.lineStyle(3, 0xffffff, 1);
        btnGraphics.strokePath();
    }
    
    drawBtn(0xe74c3c);
    
    const battleTxt = this.add.text(0, 0, `ENTRAR NA BATALHA (LUTA ${storyState.stage})`, { 
        fontSize: "22px", 
        color: "#fff", 
        fontStyle: "900", 
        fontFamily: "system-ui, -apple-system, sans-serif" 
    }).setOrigin(0.5);
    
    battleBtnContainer.add([btnGraphics, battleTxt]);
    
    // Hit Area (polygon)
    const hitArea = new Phaser.Geom.Polygon([
        -btnWidth/2 + 20, -btnHeight/2,
        btnWidth/2, -btnHeight/2,
        btnWidth/2 - 20, btnHeight/2,
        -btnWidth/2, btnHeight/2
    ]);
    
    const hitZone = this.add.zone(0, 0, btnWidth, btnHeight)
        .setInteractive({ hitArea: hitArea, hitAreaCallback: Phaser.Geom.Polygon.Contains, useHandCursor: true });
    
    battleBtnContainer.add(hitZone);
    
    hitZone.on("pointerover", () => {
        drawBtn(0xc0392b);
        if (hasPoints) {
            // maybe a warning
        }
    });
    
    hitZone.on("pointerout", () => {
        drawBtn(0xe74c3c);
    });
    
    hitZone.on("pointerdown", () => {
       if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
       this.tweens.add({ targets: battleBtnContainer, scale: 0.95, duration: 50, yoyo: true, onComplete: () => {
           this.startNextBattle();
       }});
    });
    
    if (hasPoints) {
        this.add.text(battleBtnX, battleBtnY + 35, "Você tem pontos de atributo não gastos!", { fontSize: "12px", color: "#f1c40f" }).setOrigin(0.5);
    }
  }

  showConfigMenu() {
    const overlay = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.8).setInteractive();
    const bg = this.add.rectangle(480, 270, 400, 300, 0x111111).setStrokeStyle(3, 0xf1c40f);
    const title = this.add.text(480, 160, "OPÇÕES DA HISTÓRIA", { fontSize: "28px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);

    const editBtn = this.createModalBtn(480, 220, 300, 50, "EDITAR VISUAL DO PERSONAGEM", 0x2ecc71, () => {
       // Transition to CharacterCreatorScene to edit character visual
       transitionTo(this, "CharacterCreatorScene");
    });

    const deleteBtn = this.createModalBtn(480, 290, 300, 50, "EXCLUIR PROGRESSO (RESET)", 0xe74c3c, () => {
       // Excluir historia
       this.gameState.storyState = undefined;
       this.registry.set("gameState", this.gameState);
       if (window.UTLW) window.UTLW.save();
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
    
    // Create a destroy wrapper to clean up the container
    const destroyObj = {
       destroy: () => {
           container.destroy();
       }
    };
    return destroyObj;
  }

  startNextBattle() {
     // Prepare the battle setup
     const storyState = this.gameState.storyState!;
     this.gameState.p1CharacterId = 999;
     // Enemy character based on stage
     const availableBaseChars = this.gameState.characters.filter(c => c.id !== 999);
     const enemyIdx = (storyState.stage - 1) % availableBaseChars.length;
     this.gameState.p2CharacterId = availableBaseChars[enemyIdx].id;
     
     // Set difficulty based on stage
     this.gameState.difficulty = Math.min(2, Math.floor(storyState.stage / 5)); // gets harder every 5 stages
     
     this.registry.set("gameState", this.gameState);
     if (window.UTLW) window.UTLW.save();
     
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
