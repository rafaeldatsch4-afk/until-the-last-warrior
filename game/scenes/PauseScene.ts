import { transitionTo } from "../utils/sceneTransition";
import { ResponsiveUtils } from "../utils/ResponsiveUtils";
import Phaser from "phaser";

export default class PauseScene extends Phaser.Scene {
  declare sound:
    | Phaser.Sound.NoAudioSoundManager
    | Phaser.Sound.HTML5AudioSoundManager
    | Phaser.Sound.WebAudioSoundManager;

  isOnline: boolean = false;

  constructor() {
    super("PauseScene");
  }

  init(data: { online?: boolean }) {
    this.isOnline = data?.online || false;
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const { width, height } = this.cameras.main;
    const bounds = ResponsiveUtils.getSafeBounds(this);

    // Semi-transparent background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75).setInteractive();

    const panelW = Math.min(380, bounds.width - 24);
    const panelH = this.isOnline ? 340 : 290;
    const panelX = bounds.centerX;
    const panelY = bounds.centerY;

    // Card background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0f1d, 0.95);
    bg.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 16);
    bg.lineStyle(2, 0xd4af37, 0.85);
    bg.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 16);

    // Pause Title
    this.add
      .text(panelX, panelY - panelH / 2 + 36, "PAUSADO", {
        fontSize: "26px",
        color: "#fbbf24",
        fontStyle: "bold",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        stroke: "#000000",
        strokeThickness: 3,
        resolution: 3,
      })
      .setOrigin(0.5);

    let currentY = panelY - panelH / 2 + 90;
    const btnSpacing = 52;

    // Helper for touch-friendly styled buttons (min 44px touch height)
    const createPauseButton = (
      text: string,
      color: number,
      hoverColor: number,
      callback: () => void,
    ) => {
      const container = this.add.container(panelX, currentY);
      const bW = panelW - 48;
      const bH = 42;
      const radius = 10;

      const btnG = this.add.graphics();
      const drawBtn = (isHover: boolean) => {
        btnG.clear();
        btnG.fillStyle(isHover ? hoverColor : color, 0.95);
        btnG.fillRoundedRect(-bW / 2, -bH / 2, bW, bH, radius);
        btnG.lineStyle(1.5, isHover ? 0xffffff : 0x475569, 0.9);
        btnG.strokeRoundedRect(-bW / 2, -bH / 2, bW, bH, radius);
      };
      drawBtn(false);

      const btnTxt = this.add
        .text(0, 0, text, {
          fontSize: "15px",
          fontStyle: "bold",
          color: "#ffffff",
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          resolution: 3,
        })
        .setOrigin(0.5);

      const hit = this.add
        .rectangle(0, 0, bW, 48, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      container.add([btnG, btnTxt, hit]);

      hit.on("pointerover", () => {
        drawBtn(true);
        this.tweens.add({ targets: container, scale: 1.03, duration: 100 });
      });
      hit.on("pointerout", () => {
        drawBtn(false);
        this.tweens.add({ targets: container, scale: 1, duration: 100 });
      });
      hit.on("pointerdown", () => {
        this.tweens.add({
          targets: container,
          scale: 0.94,
          duration: 70,
          yoyo: true,
          onComplete: callback,
        });
      });

      currentY += btnSpacing;
    };

    // 1. Resume
    createPauseButton("CONTINUAR COMBATE", 0x16a34a, 0x22c55e, () => {
      this.sound.play("sfx_select");
      if (!this.isOnline) {
        this.scene.resume("BattleScene");
      }
      this.scene.stop();
    });

    // 2. Settings
    createPauseButton("CONFIGURAÇÕES", 0xd97706, 0xf59e0b, () => {
      this.sound.play("sfx_select", { volume: this.registry.get("sfxVolume") ?? 1.0 });
      this.scene.launch("SettingsScene", { fromScene: "PauseScene" });
      this.scene.sleep();
    });

    // 3. Quit
    createPauseButton("SAIR PARA O MENU", 0xdc2626, 0xef4444, () => {
      this.sound.play("sfx_select");
      this.scene.stop("BattleScene");
      transitionTo(this, "MenuScene");
    });

    if (this.isOnline) {
      this.add
        .text(
          panelX,
          panelY + panelH / 2 - 20,
          "⚠️ Partidas online não pausam o combate!",
          {
            fontSize: "12px",
            color: "#fbbf24",
            fontStyle: "bold",
            fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
            stroke: "#000000",
            strokeThickness: 2,
            resolution: 3,
          },
        )
        .setOrigin(0.5);
    }

    // Listen for ESC to resume
    const escListener = () => {
      if (!this.isOnline) {
        this.scene.resume("BattleScene");
      }
      this.scene.stop();
    };
    this.input.keyboard?.on("keydown-ESC", escListener);

    this.events.on("shutdown", () => {
      this.input.keyboard?.off("keydown-ESC", escListener);
    });
  }
}
