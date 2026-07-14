import { transitionTo } from "../utils/sceneTransition";
import Phaser from "phaser";
import { GameState } from "../types";

export default class ModeSelectScene extends Phaser.Scene {
  private gameState!: GameState;

  constructor() {
    super("ModeSelectScene");
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.gameState = this.registry.get("gameState");

    if (this.cache.audio.exists("bgm_battle")) {
      this.sound.stopByKey("bgm_battle");
    }
    if (this.cache.audio.exists("bgm_menu")) {
      let isPlaying = false;
      this.sound.getAll("bgm_menu").forEach((s) => {
        if (s.isPlaying) isPlaying = true;
      });
      if (!isPlaying) {
        const bgmEnabled = this.registry.get("bgmEnabled") !== false; const bgmVol = this.registry.get("bgmVolume") ?? 0.5; this.sound.play("bgm_menu", { loop: true, volume: bgmEnabled ? bgmVol : 0 });
      }
    }

    // Background (Gradient)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f0c29, 0x302b63, 0x0f0c29, 0x24243e, 1);
    bg.fillRect(0, 0, 960, 540);

    // Add postFX to main camera
    if (this.cameras.main.postFX) {
      this.cameras.main.postFX.addVignette(0.5, 0.5, 0.8, 0.4);
      const cm = this.cameras.main.postFX.addColorMatrix();
      // saturation removed
    }

    // Animated grid or particles in background
    for (let i = 0; i < 20; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, 960),
        Phaser.Math.Between(0, 540),
        Phaser.Math.FloatBetween(1, 3),
        0xffffff,
        Phaser.Math.FloatBetween(0.1, 0.5),
      );
      this.tweens.add({
        targets: star,
        y: star.y - 50,
        alpha: 0,
        duration: Phaser.Math.Between(2000, 5000),
        repeat: -1,
        yoyo: false,
        onRepeat: () => {
          star.y = 540;
          star.x = Phaser.Math.Between(0, 960);
          star.alpha = Phaser.Math.FloatBetween(0.1, 0.5);
        },
      });
    }

    // Title
    const title = this.add
      .text(480, 60, "MODO DE JOGO", {
        fontSize: "48px",
        color: "#ffffff",
        fontStyle: "900",
        fontFamily: "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
        shadow: {
          offsetX: 0,
          offsetY: 6,
          color: "#f1c40f",
          blur: 0,
          stroke: true,
          fill: true,
        },
        resolution: 2,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: 55,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const isMobile = !this.sys.game.device.os.desktop;

    const modes = [
      {
        text: "📖 HISTÓRIA",
        mode: "story",
        color: 0x8e44ad,
        desc: "Crie seu lutador e avance por batalhas épicas",
      },
      {
        text: "🤖 1 VS 1 (CPU)",
        mode: "single",
        color: 0x3498db,
        desc: "Lute contra a inteligência artificial",
      },
      {
        text: "👥 1 VS 1 (LOCAL)",
        mode: "local_pvp",
        color: 0xe74c3c,
        desc: "Jogue contra um amigo no mesmo teclado",
      },
      {
        text: "🥋 TREINAMENTO",
        mode: "training",
        color: 0x2ecc71,
        desc: "Treine contra um oponente imóvel e imortal",
      },
      {
        text: "⚡ PARTIDA RÁPIDA",
        mode: "online_pvp",
        color: 0x27ae60,
        desc: "Jogue online por diversão",
      },
      {
        text: "🏆 RANQUEADA",
        mode: "ranked_pvp",
        color: 0xd35400,
        desc: "Suba nas ligas lutando a sério",
      },
      {
        text: "🕹️ ARCADE",
        mode: "arcade",
        color: 0x9b59b6,
        desc: "Enfrente uma série de oponentes",
      },
      {
        text: "🏅 TORNEIO",
        mode: "tournament",
        color: 0xf1c40f,
        desc: "Chaveamento de 8 lutadores",
      },
    ];

    // Filter out local pvp if mobile
    if (isMobile) {
      const idx = modes.findIndex(m => m.mode === "local_pvp");
      if (idx !== -1) modes.splice(idx, 1);
    }

    modes.forEach((m, index) => {
      const yPos = 120 + index * 52;
      this.createBtn(
        480,
        yPos,
        m.text,
        m.desc,
        () => {
          this.gameState.gameMode = m.mode as any;

          if (m.mode === "arcade") {
            this.gameState.arcadeRound = 1;
          }

          this.registry.set("gameState", this.gameState);
          if (m.mode === "story") {
            if (!this.gameState.storyState || !this.gameState.storyState.customCharacter) {
               transitionTo(this, "CharacterCreatorScene");
            } else {
               transitionTo(this, "StoryHubScene");
            }
          } else {
            transitionTo(this, "CharacterSelectScene");
          }
        },
        m.color,
      );
    });

    // Back Button
    this.createBackBtn(100, 50, "VOLTAR", () => {
      transitionTo(this, "MenuScene");
    });
  }

  createBtn(
    x: number,
    y: number,
    text: string,
    desc: string,
    onClick: () => void,
    color: number,
  ) {
    const container = this.add.container(x, y);

    // Using graphics to draw a more stylish rounded button
    const graphics = this.add.graphics();
    const btnWidth = 420;
    const btnHeight = 46;
    const radius = 8;
    
    // Draw initial state
    const drawBtn = (isHover: boolean) => {
      graphics.clear();
      
      // Shadow
      graphics.fillStyle(0x000000, 0.6);
      graphics.fillRoundedRect(-btnWidth/2 + 4, -btnHeight/2 + 6, btnWidth, btnHeight, radius);
      
      // Background (brighter on hover)
      const r = (color >> 16) & 255;
      const g = (color >> 8) & 255;
      const b = color & 255;
      
      let fillColor = color;
      if (isHover) {
         fillColor = (Math.min(255, r + 40) << 16) | (Math.min(255, g + 40) << 8) | Math.min(255, b + 40);
      }
      
      graphics.fillStyle(fillColor, 1);
      graphics.fillRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, radius);
      
      // Inner dark gradient/glow
      graphics.fillStyle(0x000000, 0.2);
      graphics.fillRoundedRect(-btnWidth/2 + 2, -btnHeight/2 + 2, btnWidth - 4, btnHeight / 2, radius - 2);
      
      // Border
      graphics.lineStyle(2, isHover ? 0xffffff : 0x000000, isHover ? 0.8 : 0.5);
      graphics.strokeRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, radius);
    };
    
    drawBtn(false);

    const txt = this.add
      .text(0, -8, text, {
        fontSize: "20px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 3,
        fontFamily: "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    const descTxt = this.add
      .text(0, 12, desc, {
        fontSize: "12px",
        color: "#eeeeee",
        fontStyle: "italic",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    container.add([graphics, txt, descTxt]);

    // Hit area
    const hitArea = this.add
      .rectangle(0, 0, btnWidth, btnHeight, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    container.add(hitArea);

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
      this.tweens.add({
        targets: container,
        scale: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: onClick,
      });
    });
  }

  createBackBtn(x: number, y: number, text: string, onClick: () => void) {
    const container = this.add.container(x, y);
    
    const graphics = this.add.graphics();
    const btnWidth = 120;
    const btnHeight = 40;
    const radius = 6;
    
    const drawBtn = (isHover: boolean) => {
      graphics.clear();
      graphics.fillStyle(0x000000, 0.6);
      graphics.fillRoundedRect(-btnWidth/2 + 2, -btnHeight/2 + 3, btnWidth, btnHeight, radius);
      
      graphics.fillStyle(isHover ? 0x777777 : 0x555555, 1);
      graphics.fillRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, radius);
      
      graphics.lineStyle(2, 0xffffff, 0.8);
      graphics.strokeRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, radius);
    };
    
    drawBtn(false);

    const txt = this.add
      .text(0, 0, text, {
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    container.add([graphics, txt]);

    const hitArea = this.add
      .rectangle(0, 0, btnWidth, btnHeight, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on("pointerover", () => {
      drawBtn(true);
      this.tweens.add({ targets: container, scale: 1.1, duration: 100 });
    });
    
    hitArea.on("pointerout", () => {
      drawBtn(false);
      this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });
    
    hitArea.on("pointerdown", () => {
      if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
      this.tweens.add({
        targets: container,
        scale: 0.9,
        duration: 50,
        yoyo: true,
        onComplete: onClick,
      });
    });
  }
}
