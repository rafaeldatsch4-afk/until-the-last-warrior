import { transitionTo } from "../utils/sceneTransition";
import Phaser from "phaser";
import { GameState } from "../types";
import { ResponsiveUtils } from "../utils/ResponsiveUtils";

export default class ModeSelectScene extends Phaser.Scene {
  declare registry: Phaser.Data.DataManager;
  declare cameras: Phaser.Cameras.Scene2D.CameraManager;
  declare sound:
    | Phaser.Sound.NoAudioSoundManager
    | Phaser.Sound.HTML5AudioSoundManager
    | Phaser.Sound.WebAudioSoundManager;
  declare add: Phaser.GameObjects.GameObjectFactory;
  declare scene: Phaser.Scenes.ScenePlugin;
  declare tweens: Phaser.Tweens.TweenManager;
  declare cache: Phaser.Cache.CacheManager;

  private gameState!: GameState;

  constructor() {
    super("ModeSelectScene");
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.gameState = this.registry.get("gameState") as GameState;

    if (this.cache.audio.exists("bgm_battle")) {
      this.sound.stopByKey("bgm_battle");
    }
    if (this.cache.audio.exists("bgm_menu")) {
      let isPlaying = false;
      this.sound.getAll("bgm_menu").forEach((s) => {
        if (s.isPlaying) isPlaying = true;
      });
      if (!isPlaying) {
        const bgmEnabled = this.registry.get("bgmEnabled") !== false;
        const bgmVol = this.registry.get("bgmVolume") ?? 0.5;
        this.sound.play("bgm_menu", { loop: true, volume: bgmEnabled ? bgmVol : 0 });
      }
    }

    const { width, height } = this.cameras.main;
    const bounds = ResponsiveUtils.getSafeBounds();

    // 1. Dark Base Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x060814, 0x0a0f24, 0x04060f, 0x020308, 1);
    bg.fillRect(0, 0, width, height);

    // 2. Arena/World Backdrop
    const selectedArena = this.gameState?.selectedArena || "arena";
    const bgArena = this.add
      .image(width / 2, height / 2, selectedArena)
      .setDisplaySize(width * 1.1, height * 1.1)
      .setAlpha(0.25)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    // Vignette
    if (this.cameras.main.postFX) {
      this.cameras.main.postFX.addVignette(0.5, 0.5, 0.7, 0.5);
    }

    // Atmospheric particles
    for (let i = 0; i < 25; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.FloatBetween(1, 3),
        0x60a5fa,
        Phaser.Math.FloatBetween(0.2, 0.6),
      );
      this.tweens.add({
        targets: star,
        y: star.y - Phaser.Math.Between(40, 100),
        alpha: 0,
        duration: Phaser.Math.Between(2500, 5000),
        repeat: -1,
        onRepeat: () => {
          star.y = height + 10;
          star.x = Phaser.Math.Between(0, width);
          star.alpha = Phaser.Math.FloatBetween(0.2, 0.6);
        },
      });
    }

    // 3. Top Back Button (High Depth, Pristine Positioning)
    this.createBackBtn(bounds.left + 70, bounds.top + 28, "← VOLTAR", () => {
      transitionTo(this, "MenuScene");
    });

    // 4. Header Title (Centered with generous breathing space)
    const headerContainer = this.add.container(width / 2, bounds.top + 28);

    const titleShadow = this.add
      .text(0, 2, "MODO DE JOGO", {
        fontSize: "26px",
        color: "#000000",
        fontStyle: "900",
        letterSpacing: 3,
        fontFamily: "'Montserrat', 'Rajdhani', sans-serif",
        resolution: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0.6);

    const title = this.add
      .text(0, 0, "MODO DE JOGO", {
        fontSize: "26px",
        color: "#facc15",
        fontStyle: "900",
        letterSpacing: 3,
        fontFamily: "'Montserrat', 'Rajdhani', sans-serif",
        stroke: "#000000",
        strokeThickness: 3,
        shadow: {
          offsetX: 0,
          offsetY: 2,
          color: "#ca8a04",
          blur: 6,
          fill: true,
          stroke: true,
        },
        resolution: 3,
      })
      .setOrigin(0.5);

    headerContainer.add([titleShadow, title]);

    this.tweens.add({
      targets: headerContainer,
      y: bounds.top + 26,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const isMobile = !this.sys.game.device.os.desktop;

    const modes = [
      {
        text: "HISTÓRIA",
        icon: "📖",
        mode: "story",
        color: 0x7c3aed,
        accentColor: 0xa78bfa,
        desc: "Crie seu lutador e avance por batalhas épicas",
      },
      {
        text: "1 VS 1 (CPU)",
        icon: "🤖",
        mode: "single",
        color: 0x0284c7,
        accentColor: 0x38bdf8,
        desc: "Lute contra a inteligência artificial",
      },
      {
        text: "1 VS 1 (LOCAL)",
        icon: "👥",
        mode: "local_pvp",
        color: 0xd97706,
        accentColor: 0xfbbf24,
        desc: "Jogue contra um amigo no mesmo teclado",
      },
      {
        text: "TREINAMENTO",
        icon: "🥋",
        mode: "training",
        color: 0x16a34a,
        accentColor: 0x4ade80,
        desc: "Treine contra um oponente imóvel e imortal",
      },
      {
        text: "ARCADE",
        icon: "🕹️",
        mode: "arcade",
        color: 0x9333ea,
        accentColor: 0xc084fc,
        desc: "Enfrente uma série consecutiva de oponentes",
      },
      {
        text: "TORNEIO",
        icon: "🏅",
        mode: "tournament",
        color: 0xca8a04,
        accentColor: 0xfacc15,
        desc: "Chaveamento oficial de 8 lutadores",
      },
    ];

    if (isMobile) {
      const idx = modes.findIndex((m) => m.mode === "local_pvp");
      if (idx !== -1) modes.splice(idx, 1);
    }

    // Calculate vertical spacing dynamically to fit all screen sizes smoothly
    const startY = bounds.top + 68;
    const availableHeight = bounds.bottom - startY - 12;
    const modeCount = modes.length;
    const itemGap = Math.min(58, Math.floor(availableHeight / modeCount));

    modes.forEach((m, index) => {
      const yPos = startY + index * itemGap + itemGap / 2;
      this.createBtn(
        width / 2,
        yPos,
        m.icon,
        m.text,
        m.desc,
        () => {
          this.gameState.gameMode = m.mode as any;

          if (m.mode === "arcade") {
            this.gameState.arcadeRound = 1;
          }

          this.registry.set("gameState", this.gameState);
          if (m.mode === "story") {
            if (
              !this.gameState.storyState ||
              !this.gameState.storyState.customCharacter
            ) {
              transitionTo(this, "CharacterCreatorScene");
            } else {
              transitionTo(this, "StoryHubScene");
            }
          } else {
            transitionTo(this, "CharacterSelectScene");
          }
        },
        m.color,
        m.accentColor,
        100 + index * 60,
      );
    });
  }

  createBtn(
    x: number,
    y: number,
    icon: string,
    text: string,
    desc: string,
    onClick: () => void,
    color: number,
    accentColor: number,
    delayAnim: number = 0,
  ) {
    const container = this.add.container(x, y + 25);
    container.setAlpha(0);
    container.setScale(0.95, 0.95);

    this.tweens.add({
      targets: container,
      y: y,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 420,
      ease: "Cubic.easeOut",
      delay: delayAnim,
    });

    const graphics = this.add.graphics();
    const btnWidth = Math.min(520, this.cameras.main.width - 48);
    const btnHeight = 48;
    const radius = 8;

    const drawBtn = (isHover: boolean) => {
      graphics.clear();

      // Soft ambient drop shadow
      graphics.fillStyle(0x000000, 0.5);
      graphics.fillRoundedRect(
        -btnWidth / 2 + 2,
        -btnHeight / 2 + 3,
        btnWidth,
        btnHeight,
        radius,
      );

      // Dark card surface with vibrant tinted background
      graphics.fillStyle(isHover ? color : 0x0a1020, 0.94);
      graphics.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        radius,
      );

      // Left Accent Strip
      graphics.fillStyle(isHover ? 0xffffff : accentColor, 1);
      graphics.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        6,
        btnHeight,
        { tl: radius, bl: radius, tr: 0, br: 0 },
      );

      // Glass Top Highlight
      graphics.fillStyle(0xffffff, isHover ? 0.15 : 0.05);
      graphics.fillRoundedRect(
        -btnWidth / 2 + 6,
        -btnHeight / 2,
        btnWidth - 6,
        btnHeight / 2,
        { tl: 0, tr: radius, bl: 0, br: 0 },
      );

      // Border outline
      graphics.lineStyle(
        1.5,
        isHover ? 0xffffff : accentColor,
        isHover ? 0.95 : 0.45,
      );
      graphics.strokeRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        radius,
      );
    };

    drawBtn(false);

    // Title Text - Ultra Crisp Montserrat / Rajdhani typography
    const txt = this.add
      .text(0, -9, `${icon}  ${text}`, {
        fontSize: "15px",
        color: "#ffffff",
        fontStyle: "800",
        letterSpacing: 1.5,
        fontFamily: "'Montserrat', 'Rajdhani', sans-serif",
        stroke: "#000000",
        strokeThickness: 2,
        resolution: 3,
      })
      .setOrigin(0.5);

    // Description Text - Clean, modern Plus Jakarta Sans typography
    const descTxt = this.add
      .text(0, 11, desc, {
        fontSize: "11px",
        color: "#cbd5e1",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        letterSpacing: 0.3,
        stroke: "#000000",
        strokeThickness: 1.5,
        resolution: 3,
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
      txt.setColor("#ffffff");
      descTxt.setColor("#f8fafc");
      this.tweens.add({ targets: container, scale: 1.025, duration: 100 });
    });

    hitArea.on("pointerout", () => {
      drawBtn(false);
      txt.setColor("#ffffff");
      descTxt.setColor("#cbd5e1");
      this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });

    hitArea.on("pointerdown", () => {
      if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
      this.tweens.add({
        targets: container,
        scale: 0.97,
        duration: 60,
        yoyo: true,
        onComplete: onClick,
      });
    });
  }

  createBackBtn(x: number, y: number, text: string, onClick: () => void) {
    const container = this.add.container(x, y).setDepth(200);

    const graphics = this.add.graphics();
    const btnWidth = 104;
    const btnHeight = 32;
    const radius = 6;

    const drawBtn = (isHover: boolean) => {
      graphics.clear();
      graphics.fillStyle(0x000000, 0.4);
      graphics.fillRoundedRect(
        -btnWidth / 2 + 2,
        -btnHeight / 2 + 2,
        btnWidth,
        btnHeight,
        radius,
      );

      graphics.fillStyle(isHover ? 0x334155 : 0x0f172a, 0.92);
      graphics.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        radius,
      );

      graphics.lineStyle(1.5, isHover ? 0x38bdf8 : 0x334155, 0.9);
      graphics.strokeRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        radius,
      );
    };

    drawBtn(false);

    const txt = this.add
      .text(0, 0, text, {
        fontSize: "12px",
        color: "#f8fafc",
        fontStyle: "700",
        letterSpacing: 1,
        fontFamily: "'Rajdhani', 'Montserrat', sans-serif",
        resolution: 3,
      })
      .setOrigin(0.5);

    container.add([graphics, txt]);

    const hitArea = this.add
      .rectangle(0, 0, 130, 48, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    container.add(hitArea);

    this.input.keyboard?.on("keydown-ESC", () => {
      if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
      onClick();
    });

    hitArea.on("pointerover", () => {
      drawBtn(true);
      txt.setColor("#38bdf8");
      this.tweens.add({ targets: container, scale: 1.05, duration: 100 });
    });

    hitArea.on("pointerout", () => {
      drawBtn(false);
      txt.setColor("#f8fafc");
      this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });

    hitArea.on("pointerdown", () => {
      if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
      this.tweens.add({
        targets: container,
        scale: 0.94,
        duration: 60,
        yoyo: true,
        onComplete: onClick,
      });
    });
  }
}
