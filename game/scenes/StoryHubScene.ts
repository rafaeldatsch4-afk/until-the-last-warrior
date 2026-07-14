import Phaser from "phaser";
import { transitionTo } from "../utils/sceneTransition";
import { GameState } from "../types";

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
    bg.fillGradientStyle(0x0f0c29, 0x302b63, 0x0f0c29, 0x24243e, 1);
    bg.fillRect(0, 0, 960, 540);

    const title = this.add.text(480, 50, "MODO HISTÓRIA", {
      fontSize: "40px",
      color: "#f1c40f",
      fontStyle: "900",
      fontFamily: "system-ui, -apple-system, sans-serif",
      stroke: "#000",
      strokeThickness: 6
    }).setOrigin(0.5);

    // Back Button
    this.createBtn(100, 40, 120, 40, "VOLTAR", 0x7f8c8d, () => {
      transitionTo(this, "ModeSelectScene");
    });

    const storyState = this.gameState.storyState;
    if (!storyState) return;
    
    // Draw Character preview (left side)
    const char = storyState.customCharacter;
    if (char) {
       let previewKey = "custom_999"; // Usually what it's saved as
       if (this.anims.exists(previewKey + "_idle")) {
          const sprite = this.add.sprite(250, 260, previewKey).setScale(3);
          sprite.play(previewKey + "_idle");
       } else {
          this.add.text(250, 260, "IMAGEM\nINDISPONÍVEL", { color: "#fff" }).setOrigin(0.5);
       }
       this.add.text(250, 150, char.name.toUpperCase(), { fontSize: "28px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    }
    
    // Level & Exp
    this.add.text(250, 360, `Nível: ${storyState.level}`, { fontSize: "24px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    
    const expNeeded = (storyState.level + 1) * 100;
    // Exp bar
    this.add.rectangle(250, 400, 200, 15, 0x333333).setOrigin(0.5).setStrokeStyle(2, 0x000);
    const expWidth = Math.min(200, (storyState.exp / expNeeded) * 200);
    this.add.rectangle(150, 400, expWidth, 15, 0x2ecc71).setOrigin(0, 0.5);
    this.add.text(250, 400, `${storyState.exp} / ${expNeeded} EXP`, { fontSize: "10px", color: "#fff" }).setOrigin(0.5);

    // Stats side
    this.add.text(700, 130, "ATRIBUTOS", { fontSize: "28px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    
    const pointsTxt = this.add.text(700, 170, `Pontos Restantes: ${storyState.statPoints}`, { fontSize: "18px", color: storyState.statPoints > 0 ? "#f1c40f" : "#aaa" }).setOrigin(0.5);

    let startY = 220;
    const stats = ["attack", "defense", "ki", "speed", "health"];
    const labels: Record<string, string> = {
      attack: "Ataque",
      defense: "Defesa",
      ki: "Ki",
      speed: "Velocidade",
      health: "Vitalidade"
    };
    
    stats.forEach((stat, i) => {
       const y = startY + i * 45;
       const val = (storyState.stats as any)[stat];
       
       this.add.text(580, y, labels[stat], { fontSize: "20px", color: "#ddd" }).setOrigin(0, 0.5);
       const valTxt = this.add.text(760, y, val.toString(), { fontSize: "20px", color: "#fff", fontStyle: "bold" }).setOrigin(1, 0.5);
       
       const addBtn = this.add.text(800, y, "+", { fontSize: "24px", color: "#2ecc71", fontStyle: "bold", backgroundColor: "#000", padding: { x: 8, y: 2 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
       
       addBtn.on("pointerdown", () => {
          if (storyState.statPoints > 0) {
             storyState.statPoints--;
             (storyState.stats as any)[stat]++;
             valTxt.setText((storyState.stats as any)[stat].toString());
             pointsTxt.setText(`Pontos Restantes: ${storyState.statPoints}`);
             pointsTxt.setColor(storyState.statPoints > 0 ? "#f1c40f" : "#aaa");
             this.registry.set("gameState", this.gameState);
             if (window.UTLW) window.UTLW.save();
             if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
          }
       });
    });

    // Battle Button
    this.createBtn(480, 480, 300, 60, `PRÓXIMA BATALHA (LUTA ${storyState.stage})`, 0xe74c3c, () => {
       this.startNextBattle();
    });
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
  }
}
