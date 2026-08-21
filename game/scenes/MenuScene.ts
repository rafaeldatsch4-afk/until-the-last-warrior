import { transitionTo } from "../utils/sceneTransition";
import Phaser from "phaser";
import { GameState } from "../types";
import { DailyChallenges, CHALLENGES } from "../systems/DailyChallenges";
import { ResponsiveUtils } from "../utils/ResponsiveUtils";

const ARENAS_LIST = [
  { id: "arena", name: "Planeta Terra", icon: "🌍", color: 0x3498db },
  { id: "arena_namek", name: "Namekusei", icon: "🪐", color: 0x2ecc71 },
  { id: "arena_city", name: "Cidade Destruída", icon: "🏙️", color: 0xe67e22 },
  { id: "arena_tournament", name: "Torneio Supremo", icon: "🏟️", color: 0xf1c40f },
  { id: "arena_ice", name: "Geleira Eterna", icon: "❄️", color: 0x00d2d3 },
  { id: "arena_lava", name: "Vulcão Infernal", icon: "🌋", color: 0xe74c3c },
  { id: "arena_desert", name: "Deserto Esquecido", icon: "🏜️", color: 0xd35400 },
  { id: "arena_dark", name: "Reino das Trevas", icon: "🌌", color: 0x8e44ad },
];

export default class MenuScene extends Phaser.Scene {
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

  private state!: GameState;
  private coinText!: Phaser.GameObjects.Text;
  private menuItems: { over: () => void; out: () => void; click: () => void }[] = [];
  private selectedMenuIndex: number = -1;
  private navListener: any;
  private bgImage!: Phaser.GameObjects.Image;
  private arenaBadgeContainer!: Phaser.GameObjects.Container;
  private arenaBadgeText!: Phaser.GameObjects.Text;
  private currentArenaIndex: number = 0;
  private particlesGroup!: Phaser.GameObjects.Group;

  constructor() {
    super("MenuScene");
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    window.dispatchEvent(
      new CustomEvent("scene-changed", { detail: "MenuScene" }),
    );

    this.menuItems = [];
    this.selectedMenuIndex = -1;
    this.navListener = (e: any) => this.handleMenuNav(e.detail);
    window.addEventListener("menu-nav", this.navListener);
    this.events.on("shutdown", () => {
      window.removeEventListener("menu-nav", this.navListener);
      window.dispatchEvent(new CustomEvent("scene-changed", { detail: null }));
    });

    this.state = this.registry.get("gameState") as GameState;
    const { width, height } = this.cameras.main;
    const bounds = ResponsiveUtils.getSafeBounds();

    if (this.registry.get("showPerfToast")) {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("achievement-unlocked", {
            detail: {
              title: "Desempenho Otimizado",
              desc: "Modo leve ativado automaticamente. Pode ser alterado em Configurações.",
            },
          }),
        );
      }, 500);
      this.registry.set("showPerfToast", false);
    }

    // Unlock Audio Context (Browser Policy)
    this.sound.pauseOnBlur = false;

    // Parar música de batalha e iniciar a do menu
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
        this.sound.play("bgm_menu", {
          loop: true,
          volume: bgmEnabled ? bgmVol : 0,
        });
      }
    }

    // Determine current selected arena
    const savedArena = this.state?.selectedArena || "arena";
    this.currentArenaIndex = ARENAS_LIST.findIndex((a) => a.id === savedArena);
    if (this.currentArenaIndex === -1) this.currentArenaIndex = 0;

    // 1. Deep Space / Ambient Dark Base
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x060814, 0x0a0f24, 0x050713, 0x020308, 1);
    bg.fillRect(0, 0, width, height);

    // 2. Full Arena World Background (High-Fidelity)
    const currentArena = ARENAS_LIST[this.currentArenaIndex];
    this.bgImage = this.add
      .image(width / 2, height / 2, currentArena.id)
      .setDisplaySize(width * 1.05, height * 1.05)
      .setAlpha(0.68);

    // Subtle atmospheric drift animation
    this.tweens.add({
      targets: this.bgImage,
      x: width / 2 + 10,
      y: height / 2 + 6,
      scaleX: 1.07,
      scaleY: 1.07,
      duration: 10000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Sleek cinematic gradient overlay (Darker on sides/bottom for UI contrast, clear in center)
    const darkOverlay = this.add.graphics();
    darkOverlay.fillGradientStyle(0x060814, 0x060814, 0x020308, 0x020308, 0.45);
    darkOverlay.fillRect(0, 0, width, height);

    // Left column backplate subtle shade for title/menu readability
    const leftShadow = this.add.graphics();
    leftShadow.fillStyle(0x060814, 0.4);
    leftShadow.fillRect(0, 0, width * 0.45, height);

    // Vignette
    if (this.cameras.main.postFX) {
      this.cameras.main.postFX.addVignette(0.5, 0.5, 0.8, 0.35);
    }

    // 3. Thematic Arena Atmosphere Particles
    this.particlesGroup = this.add.group();
    this.spawnThematicParticles(width, height, currentArena.color);

    // 4. Hero & Title Section (Left Column - Clean, Centered & Unobstructed)
    const leftColX = Math.round(width * 0.28);
    const titleContainer = this.add.container(leftColX, height / 2 - 45);

    const logoImg = this.add.image(0, -25, "utlw_logo");
    logoImg.setScale(0.24);
    logoImg.setAlpha(0);
    this.tweens.add({
      targets: logoImg,
      alpha: 1,
      duration: 800,
      ease: "Power2",
    });

    const subtitle = this.add
      .text(0, 95, "A BATALHA FINAL COMEÇA AQUI", {
        fontSize: "12px",
        color: "#ffd54a",
        fontStyle: "bold",
        letterSpacing: 2,
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        stroke: "#000000",
        strokeThickness: 3,
        shadow: { color: "#000000", blur: 4, fill: true },
        resolution: 2,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 800,
      delay: 200,
      ease: "Power2",
    });

    titleContainer.add([logoImg, subtitle]);

    this.tweens.add({
      targets: titleContainer,
      y: titleContainer.y - 6,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // 5. Minimalist World / Arena Switcher Badge (Bottom Left, Below Logo)
    this.createWorldBadge(leftColX, Math.min(height - 40, bounds.bottom - 24));

    // 6. Coins Display (Top Center)
    const coinDisplay = this.add.container(width / 2, bounds.top + 22);
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0x0a0f1d, 0.85);
    bgGraphics.fillRoundedRect(-55, -16, 110, 32, 16);
    bgGraphics.lineStyle(1.5, 0xd4af37, 0.9);
    bgGraphics.strokeRoundedRect(-55, -16, 110, 32, 16);

    const coinGlow = this.add.circle(-36, 0, 12, 0xffd700, 0.25);
    const coinIcon = this.add
      .circle(-36, 0, 9, 0xffd700)
      .setStrokeStyle(1.5, 0xffaa00);
    const coinInner = this.add.circle(-36, 0, 6, 0xffea00);
    const coinSymbol = this.add
      .text(-36, 0, "$", {
        fontSize: "11px",
        color: "#b8860b",
        fontStyle: "bold",
        fontFamily: "system-ui, -apple-system, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    this.coinText = this.add
      .text(-18, 0, `${this.state.coins || 0}`, {
        fontSize: "16px",
        color: "#ffdf00",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
        resolution: 2,
      })
      .setOrigin(0, 0.5);

    coinDisplay.add([
      bgGraphics,
      coinGlow,
      coinIcon,
      coinInner,
      coinSymbol,
      this.coinText,
    ]);

    // 7. Menu Buttons (Right Column - Dedicated, Clean Layout)
    const menuColX = Math.min(width - 270, bounds.right - 235);
    const menuBlockHeight = 5 * 43 + 36;
    const startY = Math.round((height - menuBlockHeight) / 2) + 12;
    const spacing = 43;

    this.createMenuButton(
      menuColX,
      startY,
      "COMEÇAR",
      () => {
        this.resumeAudioContext();
        if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
        transitionTo(this, "ModeSelectScene");
      },
      0xe74c3c,
      0,
    );

    this.createMenuButton(
      menuColX,
      startY + spacing,
      "LOJA DE GUERREIROS",
      () => {
        this.resumeAudioContext();
        if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
        transitionTo(this, "StoreScene");
      },
      0x3498db,
      60,
    );

    this.createMenuButton(
      menuColX,
      startY + spacing * 2,
      "DESAFIOS DO DIA",
      () => {
        this.resumeAudioContext();
        if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
        this.showChallengesPopup();
      },
      0xf1c40f,
      120,
    );

    this.createMenuButton(
      menuColX,
      startY + spacing * 3,
      "CONFIGURAÇÕES",
      () => {
        this.resumeAudioContext();
        if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
        transitionTo(this, "SettingsScene");
      },
      0x95a5a6,
      180,
    );

    this.createMenuButton(
      menuColX,
      startY + spacing * 4,
      "CRIAR PERSONAGEM",
      () => {
        this.resumeAudioContext();
        if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
        transitionTo(this, "CharacterCreatorScene");
      },
      0x2ecc71,
      240,
    );

    this.createMenuButton(
      menuColX,
      startY + spacing * 5,
      "TOP GLOBAL",
      () => {
        this.resumeAudioContext();
        if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
        transitionTo(this, "LeaderboardScene");
      },
      0x9b59b6,
      300,
    );
  }

  private createWorldBadge(x: number, y: number) {
    this.arenaBadgeContainer = this.add.container(x, y);

    const bg = this.add.graphics();
    const w = 260;
    const h = 34;
    bg.fillStyle(0x0a0f1d, 0.85);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 17);
    bg.lineStyle(1.5, 0x4a5568, 0.8);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 17);

    const currentArena = ARENAS_LIST[this.currentArenaIndex];
    this.arenaBadgeText = this.add
      .text(0, 0, `${currentArena.icon} ${currentArena.name}`, {
        fontSize: "13px",
        color: "#e2e8f0",
        fontStyle: "bold",
        fontFamily: "system-ui, -apple-system, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    // Left Arrow
    const leftArrow = this.add
      .text(-w / 2 + 18, 0, "◀", {
        fontSize: "13px",
        color: "#f1c40f",
        fontFamily: "system-ui, sans-serif",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    leftArrow.on("pointerdown", () => this.cycleWorld(-1));
    leftArrow.on("pointerover", () => leftArrow.setColor("#ffffff"));
    leftArrow.on("pointerout", () => leftArrow.setColor("#f1c40f"));

    // Right Arrow
    const rightArrow = this.add
      .text(w / 2 - 18, 0, "▶", {
        fontSize: "13px",
        color: "#f1c40f",
        fontFamily: "system-ui, sans-serif",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    rightArrow.on("pointerdown", () => this.cycleWorld(1));
    rightArrow.on("pointerover", () => rightArrow.setColor("#ffffff"));
    rightArrow.on("pointerout", () => rightArrow.setColor("#f1c40f"));

    this.arenaBadgeContainer.add([bg, this.arenaBadgeText, leftArrow, rightArrow]);
  }

  private cycleWorld(dir: number) {
    if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");

    this.currentArenaIndex =
      (this.currentArenaIndex + dir + ARENAS_LIST.length) % ARENAS_LIST.length;
    const newArena = ARENAS_LIST[this.currentArenaIndex];

    this.state.selectedArena = newArena.id;
    this.registry.set("gameState", this.state);

    this.arenaBadgeText.setText(`${newArena.icon} ${newArena.name}`);

    // Fade transition for the world background
    this.tweens.add({
      targets: this.bgImage,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.bgImage.setTexture(newArena.id);
        const { width, height } = this.cameras.main;
        this.spawnThematicParticles(width, height, newArena.color);
        this.tweens.add({
          targets: this.bgImage,
          alpha: 0.68,
          duration: 350,
        });
      },
    });
  }

  private spawnThematicParticles(width: number, height: number, color: number) {
    this.particlesGroup.clear(true, true);

    for (let i = 0; i < 30; i++) {
      const size = Phaser.Math.FloatBetween(1.5, 3.5);
      const p = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        size,
        color,
        Phaser.Math.FloatBetween(0.2, 0.7),
      );
      p.setBlendMode(Phaser.BlendModes.ADD);
      this.particlesGroup.add(p);

      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(80, 200),
        x: p.x + Phaser.Math.Between(-30, 30),
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(2500, 5500),
        ease: "Sine.inOut",
        repeat: -1,
        onRepeat: () => {
          p.y = height + 10;
          p.x = Phaser.Math.Between(0, width);
          p.scale = 1;
          p.alpha = Phaser.Math.FloatBetween(0.2, 0.7);
        },
      });
    }
  }

  async showChallengesPopup() {
    const { width, height } = this.cameras.main;
    const bounds = ResponsiveUtils.getSafeBounds();

    const popupOverlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.75)
      .setInteractive()
      .setDepth(100);

    const popupCard = this.add.container(width / 2, height / 2).setDepth(101);

    const modalW = Math.min(480, width - 30);
    const modalH = Math.min(410, bounds.height - 20);
    const halfW = modalW / 2;
    const halfH = modalH / 2;

    // Background Graphic with rounded corners and golden border
    const popupBg = this.add.graphics();
    popupBg.fillStyle(0x0f172a, 0.98);
    popupBg.fillRoundedRect(-halfW, -halfH, modalW, modalH, 12);
    popupBg.lineStyle(2, 0xf1c40f, 0.9);
    popupBg.strokeRoundedRect(-halfW, -halfH, modalW, modalH, 12);

    // Header Title
    const popupTitle = this.add
      .text(0, -halfH + 26, "DESAFIOS DO DIA", {
        fontSize: "20px",
        fontStyle: "900",
        fontFamily:
          "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
        color: "#f1c40f",
        stroke: "#000000",
        strokeThickness: 3,
        resolution: 2,
      })
      .setOrigin(0.5);

    // Modern Close Button
    const closeBtnX = halfW - 24;
    const closeBtnY = -halfH + 24;
    const closeBtnBg = this.add.graphics();
    closeBtnBg.fillStyle(0x1e293b, 0.9);
    closeBtnBg.fillCircle(closeBtnX, closeBtnY, 15);
    closeBtnBg.lineStyle(1.5, 0x475569, 0.8);
    closeBtnBg.strokeCircle(closeBtnX, closeBtnY, 15);

    const closeBtnTxt = this.add
      .text(closeBtnX, closeBtnY, "✕", {
        fontSize: "14px",
        color: "#94a3b8",
        fontStyle: "bold",
        fontFamily: "system-ui, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    const closeHit = this.add
      .circle(closeBtnX, closeBtnY, 18, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    const closePopup = () => {
      this.tweens.add({
        targets: popupCard,
        scale: 0.85,
        alpha: 0,
        duration: 150,
        ease: "Back.easeIn",
        onComplete: () => {
          popupOverlay.destroy();
          popupCard.destroy();
        },
      });
    };

    closeHit.on("pointerover", () => {
      closeBtnBg.clear();
      closeBtnBg.fillStyle(0xef4444, 1);
      closeBtnBg.fillCircle(closeBtnX, closeBtnY, 15);
      closeBtnTxt.setColor("#ffffff");
    });
    closeHit.on("pointerout", () => {
      closeBtnBg.clear();
      closeBtnBg.fillStyle(0x1e293b, 0.9);
      closeBtnBg.fillCircle(closeBtnX, closeBtnY, 15);
      closeBtnBg.lineStyle(1.5, 0x475569, 0.8);
      closeBtnBg.strokeCircle(closeBtnX, closeBtnY, 15);
      closeBtnTxt.setColor("#94a3b8");
    });
    closeHit.on("pointerdown", closePopup);
    popupOverlay.on("pointerdown", closePopup);

    popupCard.add([popupBg, popupTitle, closeBtnBg, closeBtnTxt, closeHit]);

    // 1. Daily Streak Section
    const streakInfo = await DailyChallenges.getStreakInfo();
    const currentToday = DailyChallenges.getTodayDateStr();
    const hasClaimedStreakToday = streakInfo.lastClaimedDate === currentToday;
    const currentStreakCoins = DailyChallenges.getStreakReward(
      streakInfo.currentStreak,
    );

    const cardInnerW = modalW - 32;
    const streakY = -halfH + 74;

    const streakBg = this.add.graphics();
    streakBg.fillStyle(0x18181b, 0.9);
    streakBg.fillRoundedRect(-cardInnerW / 2, streakY - 26, cardInnerW, 52, 8);
    streakBg.lineStyle(1.5, 0xf97316, 0.8);
    streakBg.strokeRoundedRect(-cardInnerW / 2, streakY - 26, cardInnerW, 52, 8);

    const streakTitleText = this.add.text(
      -cardInnerW / 2 + 14,
      streakY - 14,
      `Sequência Diária: ${streakInfo.currentStreak} Dias 🔥`,
      {
        fontSize: "14px",
        fontStyle: "bold",
        fontFamily:
          "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
        color: "#fb923c",
        resolution: 2,
      },
    );

    const streakDetailText = this.add.text(
      -cardInnerW / 2 + 14,
      streakY + 6,
      `Recompensa de Hoje: ${currentStreakCoins} 🪙 (Bônus de login ativo)`,
      {
        fontSize: "11px",
        color: "#94a3b8",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        resolution: 2,
      },
    );

    popupCard.add([streakBg, streakTitleText, streakDetailText]);

    const streakBtnX = cardInnerW / 2 - 55;

    if (hasClaimedStreakToday) {
      const claimedStreakText = this.add
        .text(streakBtnX, streakY, "CONCLUÍDO ✓", {
          fontSize: "12px",
          color: "#22c55e",
          fontStyle: "bold",
          fontFamily: "system-ui, sans-serif",
          resolution: 2,
        })
        .setOrigin(0.5);
      popupCard.add(claimedStreakText);
    } else {
      const claimStreakBg = this.add.graphics();
      const drawClaimStreak = (isH: boolean) => {
        claimStreakBg.clear();
        claimStreakBg.fillStyle(isH ? 0x16a34a : 0x22c55e, 1);
        claimStreakBg.fillRoundedRect(streakBtnX - 44, streakY - 14, 88, 28, 6);
      };
      drawClaimStreak(false);

      const claimStreakTxt = this.add
        .text(streakBtnX, streakY, "COLETAR", {
          fontSize: "12px",
          color: "#ffffff",
          fontStyle: "bold",
          fontFamily: "system-ui, sans-serif",
          resolution: 2,
        })
        .setOrigin(0.5);

      const claimStreakHit = this.add
        .rectangle(streakBtnX, streakY, 88, 28, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      claimStreakHit.on("pointerover", () => drawClaimStreak(true));
      claimStreakHit.on("pointerout", () => drawClaimStreak(false));
      claimStreakHit.on("pointerdown", async () => {
        const res = await DailyChallenges.claimStreakReward();
        if (res.success) {
          claimStreakBg.destroy();
          claimStreakTxt.destroy();
          claimStreakHit.destroy();
          const claimedStreakText = this.add
            .text(streakBtnX, streakY, "COLETADO ✓", {
              fontSize: "12px",
              color: "#22c55e",
              fontStyle: "bold",
              fontFamily: "system-ui, sans-serif",
              resolution: 2,
            })
            .setOrigin(0.5);
          popupCard.add(claimedStreakText);
          if (this.coinText)
            this.coinText.setText(`${window.UTLW.state.coins}`);
        }
      });
      popupCard.add([claimStreakBg, claimStreakTxt, claimStreakHit]);
    }

    // 2. Challenges Progress Section
    const progress = await DailyChallenges.getProgress();

    let claimableCount = 0;
    CHALLENGES.forEach((challenge) => {
      const p = progress[challenge.id] || { current: 0, claimed: false };
      if (p.current >= challenge.target && !p.claimed) claimableCount++;
    });

    let startY = streakY + 58;
    const itemGap = 54;

    CHALLENGES.forEach((challenge) => {
      const p = progress[challenge.id] || { current: 0, claimed: false };
      const cardY = startY;

      const chCard = this.add.graphics();
      chCard.fillStyle(0x131a2a, 0.9);
      chCard.fillRoundedRect(-cardInnerW / 2, cardY - 22, cardInnerW, 46, 6);
      chCard.lineStyle(1, 0x243247, 0.8);
      chCard.strokeRoundedRect(-cardInnerW / 2, cardY - 22, cardInnerW, 46, 6);

      const chTitle = this.add.text(-cardInnerW / 2 + 14, cardY - 12, challenge.title, {
        fontSize: "13px",
        fontStyle: "bold",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        resolution: 2,
      });

      const chReward = this.add.text(
        -cardInnerW / 2 + 14,
        cardY + 5,
        `Recompensa: ${challenge.reward} 🪙`,
        {
          fontSize: "11px",
          color: "#facc15",
          fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
          resolution: 2,
        },
      );

      const isCompleted = p.current >= challenge.target;
      const chProgressText = this.add
        .text(
          cardInnerW / 2 - 110,
          cardY,
          `${Math.min(p.current, challenge.target)} / ${challenge.target}`,
          {
            fontSize: "13px",
            fontStyle: "bold",
            color: isCompleted ? "#4ade80" : "#94a3b8",
            fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
            resolution: 2,
          },
        )
        .setOrigin(1, 0.5);

      popupCard.add([chCard, chTitle, chReward, chProgressText]);

      const actionBtnX = cardInnerW / 2 - 50;

      if (p.claimed) {
        const claimedText = this.add
          .text(actionBtnX, cardY, "COLETADO ✓", {
            fontSize: "12px",
            color: "#22c55e",
            fontStyle: "bold",
            fontFamily: "system-ui, sans-serif",
            resolution: 2,
          })
          .setOrigin(0.5);
        popupCard.add(claimedText);
      } else if (isCompleted) {
        const claimBtnBg = this.add.graphics();
        const drawClaimBtn = (isH: boolean) => {
          claimBtnBg.clear();
          claimBtnBg.fillStyle(isH ? 0xeab308 : 0xfacc15, 1);
          claimBtnBg.fillRoundedRect(actionBtnX - 38, cardY - 13, 76, 26, 6);
        };
        drawClaimBtn(false);

        const claimBtnTxt = this.add
          .text(actionBtnX, cardY, "COLETAR", {
            fontSize: "11px",
            color: "#000000",
            fontStyle: "900",
            fontFamily: "system-ui, sans-serif",
            resolution: 2,
          })
          .setOrigin(0.5);

        const claimHit = this.add
          .rectangle(actionBtnX, cardY, 76, 26, 0x000000, 0)
          .setInteractive({ useHandCursor: true });

        claimHit.on("pointerover", () => drawClaimBtn(true));
        claimHit.on("pointerout", () => drawClaimBtn(false));
        claimHit.on("pointerdown", async () => {
          if (await DailyChallenges.claimReward(challenge.id)) {
            claimBtnBg.destroy();
            claimBtnTxt.destroy();
            claimHit.destroy();
            const claimedText = this.add
              .text(actionBtnX, cardY, "COLETADO ✓", {
                fontSize: "12px",
                color: "#22c55e",
                fontStyle: "bold",
                fontFamily: "system-ui, sans-serif",
                resolution: 2,
              })
              .setOrigin(0.5);
            popupCard.add(claimedText);
            if (this.coinText)
              this.coinText.setText(`${window.UTLW.state.coins}`);

            // Refresh if collect all was visible
            if (claimableCount > 1) {
              popupOverlay.destroy();
              popupCard.destroy();
              this.showChallengesPopup();
            }
          }
        });
        popupCard.add([claimBtnBg, claimBtnTxt, claimHit]);
      }

      startY += itemGap;
    });

    // 3. Collect All Button (if multiple claimable rewards)
    if (claimableCount > 1) {
      const collectAllY = halfH - 24;
      const collectAllBg = this.add.graphics();
      const drawCollectAll = (isH: boolean) => {
        collectAllBg.clear();
        collectAllBg.fillStyle(isH ? 0x16a34a : 0x22c55e, 1);
        collectAllBg.fillRoundedRect(-80, collectAllY - 14, 160, 28, 6);
      };
      drawCollectAll(false);

      const collectAllTxt = this.add
        .text(0, collectAllY, "COLETAR TUDO", {
          fontSize: "12px",
          color: "#ffffff",
          fontStyle: "bold",
          fontFamily: "system-ui, sans-serif",
          resolution: 2,
        })
        .setOrigin(0.5);

      const collectAllHit = this.add
        .rectangle(0, collectAllY, 160, 28, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      collectAllHit.on("pointerover", () => drawCollectAll(true));
      collectAllHit.on("pointerout", () => drawCollectAll(false));
      collectAllHit.on("pointerdown", async () => {
        const total = await DailyChallenges.claimAllRewards();
        if (total > 0) {
          if (this.coinText)
            this.coinText.setText(`${window.UTLW.state.coins}`);
          popupOverlay.destroy();
          popupCard.destroy();
          this.showChallengesPopup();
        }
      });
      popupCard.add([collectAllBg, collectAllTxt, collectAllHit]);
    }

    popupCard.setScale(0.85).setAlpha(0);
    this.tweens.add({
      targets: popupCard,
      scale: 1,
      alpha: 1,
      duration: 200,
      ease: "Back.easeOut",
    });
  }

  resumeAudioContext() {
    if (
      this.sound &&
      this.sound instanceof Phaser.Sound.WebAudioSoundManager &&
      this.sound.context.state === "suspended"
    ) {
      this.sound.context.resume();
    }
  }

  handleMenuNav(key: string) {
    if (this.menuItems.length === 0) return;
    
    // Clear previous selection visually
    if (this.selectedMenuIndex >= 0 && this.selectedMenuIndex < this.menuItems.length) {
      this.menuItems[this.selectedMenuIndex].out();
    }
    
    if (key === 'ArrowDown') {
      this.selectedMenuIndex = (this.selectedMenuIndex + 1) % this.menuItems.length;
      if (this.cache.audio.exists("sfx_step")) this.sound.play("sfx_step", { volume: 0.5 });
    } else if (key === 'ArrowUp') {
      this.selectedMenuIndex = (this.selectedMenuIndex - 1 + this.menuItems.length) % this.menuItems.length;
      if (this.cache.audio.exists("sfx_step")) this.sound.play("sfx_step", { volume: 0.5 });
    } else if (key === 'ArrowLeft' || key === 'KeyA') {
      this.cycleWorld(-1);
      return;
    } else if (key === 'ArrowRight' || key === 'KeyD') {
      this.cycleWorld(1);
      return;
    } else if (key === 'Enter') {
      if (this.selectedMenuIndex >= 0 && this.selectedMenuIndex < this.menuItems.length) {
        this.menuItems[this.selectedMenuIndex].click();
      } else {
        // If nothing selected, default to first
        this.selectedMenuIndex = 0;
        this.menuItems[0].click();
      }
      return;
    }
    
    // Apply new selection visually
    if (this.selectedMenuIndex >= 0 && this.selectedMenuIndex < this.menuItems.length) {
      this.menuItems[this.selectedMenuIndex].over();
    }
  }

  createMenuButton(
    x: number,
    y: number,
    text: string,
    callback: () => void,
    color: number,
    delayAnim: number = 0,
  ) {
    const container = this.add.container(x + 80, y).setAlpha(0); // Starts slightly offset right with 0 alpha

    this.tweens.add({
      targets: container,
      x: x,
      alpha: 1,
      duration: 400,
      ease: "Cubic.easeOut",
      delay: delayAnim,
    });

    const height = 36;
    const width = 225;

    const txt = this.add
      .text(28, height / 2 - 1, text, {
        fontSize: "14px",
        fontStyle: "italic bold",
        fontFamily: "system-ui, -apple-system, sans-serif",
        letterSpacing: 1,
        color: "#e2e8f0",
        stroke: "#000000",
        strokeThickness: 3,
        shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 0, fill: true },
        resolution: 2,
      })
      .setOrigin(0, 0.5);

    // Draw slanted polygon geometry for the menu button background
    const d = 12; // Diagonal offset
    const points = [0, height, width - d, height, width, 0, d, 0];

    const polyShadow = this.add
      .polygon(3, 3, points, 0x000000, 0.4)
      .setOrigin(0, 0);
    const hoverGlow = this.add
      .polygon(0, 0, points, color, 0.8)
      .setOrigin(0, 0)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    const polyMain = this.add
      .polygon(0, 0, points, 0x111625)
      .setOrigin(0, 0)
      .setStrokeStyle(2, color);

    // Right side arrow / accent
    const accentOriginX = width - d - 8;
    const accent = this.add
      .polygon(
        accentOriginX,
        height / 2,
        [0, 6, 5, 0, 0, -6, -2, -6, 3, 0, -2, 6],
        color,
        1,
      )
      .setAlpha(0.6);

    container.add([polyShadow, hoverGlow, polyMain, txt, accent]);

    // Interactive hit area
    const hitArea = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    container.add(hitArea);

    let pulseTween: Phaser.Tweens.Tween | null = null;
    const overFn = () => {
      polyMain.setFillStyle(color);
      polyMain.setStrokeStyle(2.5, 0xffffff);
      txt.setColor("#ffffff");
      accent.setFillStyle(0xffffff).setAlpha(1);
      this.tweens.add({ targets: hoverGlow, alpha: 1, duration: 150 });
      this.tweens.add({
        targets: container,
        x: x + 10,
        duration: 200,
        ease: "Power2",
      });

      if (!pulseTween) {
        pulseTween = this.tweens.add({
          targets: container,
          scaleX: 1.02,
          scaleY: 1.02,
          yoyo: true,
          repeat: -1,
          duration: 600,
          ease: "Sine.easeInOut",
        });
      }
    };

    const outFn = () => {
      polyMain.setFillStyle(0x111625);
      polyMain.setStrokeStyle(2, color);
      txt.setColor("#e2e8f0");
      accent.setFillStyle(color).setAlpha(0.6);
      this.tweens.add({ targets: hoverGlow, alpha: 0, duration: 150 });
      this.tweens.add({
        targets: container,
        x: x,
        duration: 200,
        ease: "Power2",
      });

      if (pulseTween) {
        pulseTween.stop();
        pulseTween = null;
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
        });
      }
    };
    
    const clickFn = () => {
        this.tweens.add({
          targets: container,
          scale: 0.95,
          yoyo: true,
          duration: 50,
          onComplete: callback,
        });
    };

    const myIndex = this.menuItems.length;
    this.menuItems.push({ over: overFn, out: outFn, click: clickFn });

    hitArea
      .on("pointerover", () => {
         if (this.selectedMenuIndex >= 0 && this.selectedMenuIndex < this.menuItems.length) {
            this.menuItems[this.selectedMenuIndex].out();
         }
         this.selectedMenuIndex = myIndex; 
         overFn();
      })
      .on("pointerout", () => {
         // only unhighlight if we are still the selected one (mouse leaving)
         if (this.selectedMenuIndex === myIndex) {
            this.selectedMenuIndex = -1;
         }
         outFn();
      })
      .on("pointerdown", clickFn);
  }
}
