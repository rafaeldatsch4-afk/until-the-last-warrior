import { transitionTo } from "../utils/sceneTransition";
import Phaser from "phaser";
import { GameState } from "../types";
import { DailyChallenges, CHALLENGES } from "../systems/DailyChallenges";
import { ResponsiveUtils } from "../utils/ResponsiveUtils";
import { ArenaTextureBuilder } from "../battle/ArenaTextureBuilder";
import { LogoTextureBuilder } from "../utils/LogoTextureBuilder";

const ARENAS_LIST = [
  { id: "arena", name: "Planeta Terra", icon: "🌍", color: 0x3498db },
  { id: "arena_namek", name: "Namekusei", icon: "🪐", color: 0x2ecc71 },
  { id: "arena_city", name: "Cidade Destruída", icon: "🏙️", color: 0xe67e22 },
  { id: "arena_tournament", name: "Torneio de Artes Marciais", icon: "🏯", color: 0xf1c40f },
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
    this.cameras.main.setRoundPixels(false);
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
    const bounds = ResponsiveUtils.getSafeBounds(this);

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

    if (!this.textures.exists("arena")) {
      ArenaTextureBuilder.buildAllArenaTextures(this);
    }

    // Determine current selected arena
    const savedArena = this.state?.selectedArena || "arena";
    this.currentArenaIndex = ARENAS_LIST.findIndex((a) => a.id === savedArena);
    if (this.currentArenaIndex === -1) this.currentArenaIndex = 0;

    // 1. Deep Space / Ambient Base
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x060814, 0x0a0f24, 0x050713, 0x020308, 1);
    bg.fillRect(0, 0, width, height);

    // 2. Full Arena World Background (High-Fidelity)
    const currentArena = ARENAS_LIST[this.currentArenaIndex];
    this.bgImage = this.add
      .image(width / 2, height / 2, currentArena.id)
      .setDisplaySize(width * 1.05, height * 1.05)
      .setAlpha(0.85);

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

    // Sleek cinematic soft gradient overlay (gentle vignette for UI contrast)
    const darkOverlay = this.add.graphics();
    darkOverlay.fillGradientStyle(0x060814, 0x060814, 0x020308, 0x020308, 0.25);
    darkOverlay.fillRect(0, 0, width, height);

    // Vignette
    if (this.cameras.main.postFX) {
      this.cameras.main.postFX.addVignette(0.5, 0.5, 0.85, 0.3);
    }

    // 3. Thematic Arena Atmosphere Particles
    this.particlesGroup = this.add.group();
    this.spawnThematicParticles(width, height, currentArena.color);

    // --- Dynamic Mobile-Safe 2-Column Responsive Layout ---
    const buttonW = 225;
    const menuColX = Math.round(bounds.right - buttonW - 12);
    const leftRegionW = Math.max(260, menuColX - bounds.left);
    const leftColX = Math.round(bounds.left + leftRegionW / 2);

    // 4. Hero & Title Section (Left Column - Clean, Centered & Stylized)
    const titleContainer = this.add.container(leftColX, height / 2 - 50);
    titleContainer.setAlpha(0);
    titleContainer.setScale(0.94);

    // Stylized Hero Emblem / Card with Rounded Frame & Golden Glow
    const emblemCard = this.add.graphics();
    const cardW = Math.min(270, Math.floor(leftRegionW * 0.9));
    const cardH = 150;
    emblemCard.fillStyle(0x060814, 0.7);
    emblemCard.fillRoundedRect(-cardW / 2, -cardH / 2 - 15, cardW, cardH, 16);
    emblemCard.lineStyle(2, 0xd4af37, 0.85);
    emblemCard.strokeRoundedRect(-cardW / 2, -cardH / 2 - 15, cardW, cardH, 16);

    // Hero Logo Image with Smooth Scale inside Card
    LogoTextureBuilder.ensureLogoTexture(this);
    const logoImg = this.add.image(0, -15, LogoTextureBuilder.LOGO_KEY);
    logoImg.setDisplaySize(cardW - 20, Math.round((cardW - 20) * 0.56));
    if (logoImg.texture) {
      logoImg.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }

    const subtitle = this.add
      .text(0, 78, "⚔️ A BATALHA FINAL COMEÇA AQUI ⚔️", {
        fontSize: "12px",
        color: "#ffd54a",
        fontStyle: "bold",
        letterSpacing: 1.8,
        fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, sans-serif",
        stroke: "#1a1200",
        strokeThickness: 1.5,
        shadow: { color: "rgba(0, 0, 0, 0.9)", blur: 5, offsetX: 0, offsetY: 2, fill: true },
        padding: { x: 10, y: 6 },
        resolution: 4,
      })
      .setOrigin(0.5);
    subtitle.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

    titleContainer.add([emblemCard, logoImg, subtitle]);

    // Smooth entrance for Hero title
    this.tweens.add({
      targets: titleContainer,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 650,
      ease: "Cubic.easeOut",
      onComplete: () => {
        // Continuous subtle floating animation
        this.tweens.add({
          targets: titleContainer,
          y: titleContainer.y - 6,
          duration: 3000,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      },
    });

    // 5. World / Arena Switcher Badge (Bottom Left, Below Logo)
    this.createWorldBadge(leftColX, Math.min(height - 40, bounds.bottom - 24));

    // 6. Coins Display (Top Center)
    const coinDisplay = this.add.container(bounds.centerX, bounds.top + 10);
    coinDisplay.setAlpha(0);
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
        fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, sans-serif",
        padding: { x: 4, y: 4 },
        resolution: 4,
      })
      .setOrigin(0.5);
    coinSymbol.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

    this.coinText = this.add
      .text(-18, 0, `${this.state.coins || 0}`, {
        fontSize: "16px",
        color: "#ffdf00",
        fontStyle: "bold",
        stroke: "#0a0f1d",
        strokeThickness: 1.5,
        shadow: { color: "rgba(0, 0, 0, 0.8)", blur: 3, offsetX: 0, offsetY: 1, fill: true },
        fontFamily: "'Montserrat', 'Plus Jakarta Sans', sans-serif",
        padding: { x: 6, y: 4 },
        resolution: 4,
      })
      .setOrigin(0, 0.5);
    this.coinText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

    coinDisplay.add([
      bgGraphics,
      coinGlow,
      coinIcon,
      coinInner,
      coinSymbol,
      this.coinText,
    ]);

    // Drop in coins smoothly
    this.tweens.add({
      targets: coinDisplay,
      y: bounds.top + 22,
      alpha: 1,
      duration: 500,
      delay: 150,
      ease: "Cubic.easeOut",
    });

    // 7. Menu Buttons (Right Column - Dedicated, Clean Layout)
    const menuBlockHeight = 7 * 36 + 10;
    const startY = Math.round((height - menuBlockHeight) / 2) + 8;
    const spacing = 36;

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
      100,
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
      150,
    );

    this.createMenuButton(
      menuColX,
      startY + spacing * 2,
      "PERFIL",
      () => {
        this.resumeAudioContext();
        if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
        transitionTo(this, "ProfileScene");
      },
      0x38bdf8,
      200,
    );

    this.createMenuButton(
      menuColX,
      startY + spacing * 3,
      "TOP GLOBAL",
      () => {
        this.resumeAudioContext();
        if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
        transitionTo(this, "LeaderboardScene");
      },
      0x9b59b6,
      250,
    );

    this.createMenuButton(
      menuColX,
      startY + spacing * 4,
      "DESAFIOS DO DIA",
      () => {
        this.resumeAudioContext();
        if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
        this.showChallengesPopup();
      },
      0xf1c40f,
      300,
    );

    this.createMenuButton(
      menuColX,
      startY + spacing * 5,
      "CRIAR PERSONAGEM",
      () => {
        this.resumeAudioContext();
        if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
        transitionTo(this, "CharacterCreatorScene");
      },
      0x2ecc71,
      350,
    );

    this.createMenuButton(
      menuColX,
      startY + spacing * 6,
      "CONFIGURAÇÕES",
      () => {
        this.resumeAudioContext();
        if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
        transitionTo(this, "SettingsScene");
      },
      0x95a5a6,
      400,
    );
  }

  private createWorldBadge(x: number, y: number) {
    this.arenaBadgeContainer = this.add.container(x, y + 15);
    this.arenaBadgeContainer.setAlpha(0);

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
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        resolution: 3,
      })
      .setOrigin(0.5);

    // Left Arrow
    const leftArrow = this.add
      .text(-w / 2 + 18, 0, "◀", {
        fontSize: "14px",
        color: "#f1c40f",
        fontFamily: "system-ui, sans-serif",
      })
      .setOrigin(0.5);

    const leftHit = this.add
      .rectangle(-w / 2 + 18, 0, 48, 44, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    leftHit.on("pointerdown", () => this.cycleWorld(-1));
    leftHit.on("pointerover", () => leftArrow.setColor("#ffffff"));
    leftHit.on("pointerout", () => leftArrow.setColor("#f1c40f"));

    // Right Arrow
    const rightArrow = this.add
      .text(w / 2 - 18, 0, "▶", {
        fontSize: "14px",
        color: "#f1c40f",
        fontFamily: "system-ui, sans-serif",
      })
      .setOrigin(0.5);

    const rightHit = this.add
      .rectangle(w / 2 - 18, 0, 48, 44, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    rightHit.on("pointerdown", () => this.cycleWorld(1));
    rightHit.on("pointerover", () => rightArrow.setColor("#ffffff"));
    rightHit.on("pointerout", () => rightArrow.setColor("#f1c40f"));

    this.arenaBadgeContainer.add([bg, this.arenaBadgeText, leftArrow, leftHit, rightArrow, rightHit]);

    // Smooth slide-up fade-in for World Badge
    this.tweens.add({
      targets: this.arenaBadgeContainer,
      y: y,
      alpha: 1,
      duration: 500,
      delay: 220,
      ease: "Cubic.easeOut",
    });
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
    const bounds = ResponsiveUtils.getSafeBounds(this);

    const popupOverlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
      .setInteractive()
      .setDepth(100);

    const popupCard = this.add.container(width / 2, height / 2).setDepth(101);

    const todaysChallenges = DailyChallenges.getTodaysChallenges();
    const modalW = Math.min(520, width - 24);
    const modalH = Math.min(460, bounds.height - 20);
    const halfW = modalW / 2;
    const halfH = modalH / 2;

    // Background Graphic with rounded corners and golden border
    const popupBg = this.add.graphics();
    popupBg.fillStyle(0x0a0f1d, 0.98);
    popupBg.fillRoundedRect(-halfW, -halfH, modalW, modalH, 16);
    popupBg.lineStyle(2, 0xf59e0b, 0.9);
    popupBg.strokeRoundedRect(-halfW, -halfH, modalW, modalH, 16);

    // Subtle header accent line
    const headerLine = this.add.graphics();
    headerLine.lineStyle(1, 0x334155, 0.7);
    headerLine.lineBetween(-halfW + 16, -halfH + 48, halfW - 16, -halfH + 48);

    // Header Title
    const popupTitle = this.add
      .text(0, -halfH + 25, "⚡ MISSÕES DIÁRIAS & RECOMPENSAS", {
        fontSize: "17px",
        fontStyle: "bold",
        fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#fbbf24",
        padding: { x: 8, y: 4 },
        resolution: 4,
      })
      .setOrigin(0.5);
    popupTitle.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

    // Modern Close Button
    const closeBtnX = halfW - 24;
    const closeBtnY = -halfH + 24;
    const closeBtnBg = this.add.graphics();
    closeBtnBg.fillStyle(0x1e293b, 0.9);
    closeBtnBg.fillCircle(closeBtnX, closeBtnY, 14);
    closeBtnBg.lineStyle(1.5, 0x475569, 0.8);
    closeBtnBg.strokeCircle(closeBtnX, closeBtnY, 14);

    const closeBtnTxt = this.add
      .text(closeBtnX, closeBtnY, "✕", {
        fontSize: "13px",
        color: "#94a3b8",
        fontStyle: "bold",
        fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, sans-serif",
        padding: { x: 4, y: 4 },
        resolution: 4,
      })
      .setOrigin(0.5);
    closeBtnTxt.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

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
      closeBtnBg.fillCircle(closeBtnX, closeBtnY, 14);
      closeBtnTxt.setColor("#ffffff");
    });
    closeHit.on("pointerout", () => {
      closeBtnBg.clear();
      closeBtnBg.fillStyle(0x1e293b, 0.9);
      closeBtnBg.fillCircle(closeBtnX, closeBtnY, 14);
      closeBtnBg.lineStyle(1.5, 0x475569, 0.8);
      closeBtnBg.strokeCircle(closeBtnX, closeBtnY, 14);
      closeBtnTxt.setColor("#94a3b8");
    });
    closeHit.on("pointerdown", closePopup);
    popupOverlay.on("pointerdown", closePopup);

    popupCard.add([popupBg, headerLine, popupTitle, closeBtnBg, closeBtnTxt, closeHit]);

    // 1. Daily Streak Section
    const streakInfo = await DailyChallenges.getStreakInfo();
    const currentToday = DailyChallenges.getTodayDateStr();
    const hasClaimedStreakToday = streakInfo.lastClaimedDate === currentToday;
    const currentStreakCoins = DailyChallenges.getStreakReward(
      streakInfo.currentStreak,
    );

    const cardInnerW = modalW - 28;
    const streakY = -halfH + 76;

    const streakBg = this.add.graphics();
    streakBg.fillStyle(0x111827, 0.95);
    streakBg.fillRoundedRect(-cardInnerW / 2, streakY - 22, cardInnerW, 46, 10);
    streakBg.lineStyle(1.5, 0xf97316, 0.8);
    streakBg.strokeRoundedRect(-cardInnerW / 2, streakY - 22, cardInnerW, 46, 10);

    const streakTitleText = this.add.text(
      -cardInnerW / 2 + 14,
      streakY - 10,
      `🔥 Sequência Diária: ${streakInfo.currentStreak} ${streakInfo.currentStreak === 1 ? "Dia" : "Dias"}`,
      {
        fontSize: "13px",
        fontStyle: "bold",
        fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#fb923c",
        padding: { x: 4, y: 4 },
        resolution: 4,
      },
    );
    streakTitleText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

    const streakDetailText = this.add.text(
      -cardInnerW / 2 + 14,
      streakY + 8,
      `Bônus diário: +${currentStreakCoins} 🪙 de login`,
      {
        fontSize: "11px",
        color: "#cbd5e1",
        fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: { x: 4, y: 4 },
        resolution: 4,
      },
    );
    streakDetailText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

    popupCard.add([streakBg, streakTitleText, streakDetailText]);

    const streakBtnX = cardInnerW / 2 - 50;

    if (hasClaimedStreakToday) {
      const claimedStreakText = this.add
        .text(streakBtnX, streakY, "COLETADO ✓", {
          fontSize: "11px",
          color: "#22c55e",
          fontStyle: "bold",
          fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, sans-serif",
          padding: { x: 4, y: 4 },
          resolution: 4,
        })
        .setOrigin(0.5);
      claimedStreakText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      popupCard.add(claimedStreakText);
    } else {
      const claimStreakBg = this.add.graphics();
      const drawClaimStreak = (isH: boolean) => {
        claimStreakBg.clear();
        claimStreakBg.fillStyle(isH ? 0x16a34a : 0x22c55e, 1);
        claimStreakBg.fillRoundedRect(streakBtnX - 42, streakY - 14, 84, 28, 8);
      };
      drawClaimStreak(false);

      const claimStreakTxt = this.add
        .text(streakBtnX, streakY, "COLETAR", {
          fontSize: "11px",
          color: "#ffffff",
          fontStyle: "bold",
          fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, sans-serif",
          padding: { x: 4, y: 4 },
          resolution: 4,
        })
        .setOrigin(0.5);
      claimStreakTxt.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

      const claimStreakHit = this.add
        .rectangle(streakBtnX, streakY, 84, 28, 0x000000, 0)
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
              fontSize: "11px",
              color: "#22c55e",
              fontStyle: "bold",
              fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, sans-serif",
              padding: { x: 4, y: 4 },
              resolution: 4,
            })
            .setOrigin(0.5);
          claimedStreakText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
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
    todaysChallenges.forEach((challenge) => {
      const p = progress[challenge.id] || { current: 0, claimed: false };
      if (p.current >= challenge.target && !p.claimed) claimableCount++;
    });

    let startY = streakY + 54;
    const itemGap = 62;

    const categoryColors: Record<string, { bg: number; border: number; label: string; text: string }> = {
      combat: { bg: 0x450a0a, border: 0xef4444, label: "COMBATE", text: "#f87171" },
      skill: { bg: 0x1e1b4b, border: 0x6366f1, label: "HABILIDADE", text: "#818cf8" },
      defense: { bg: 0x064e3b, border: 0x10b981, label: "DEFESA", text: "#34d399" },
      mastery: { bg: 0x451a03, border: 0xf59e0b, label: "MESTRIA", text: "#fbbf24" },
    };

    todaysChallenges.forEach((challenge) => {
      const p = progress[challenge.id] || { current: 0, claimed: false };
      const cardY = startY;
      const isCompleted = p.current >= challenge.target;
      const catConfig = categoryColors[challenge.category] || categoryColors.combat;

      const chCard = this.add.graphics();
      chCard.fillStyle(0x0f172a, 0.92);
      chCard.fillRoundedRect(-cardInnerW / 2, cardY - 26, cardInnerW, 54, 10);
      chCard.lineStyle(1.5, isCompleted ? 0x10b981 : 0x1e293b, isCompleted ? 0.9 : 0.7);
      chCard.strokeRoundedRect(-cardInnerW / 2, cardY - 26, cardInnerW, 54, 10);

      // Icon + Category badge
      const chIconText = this.add.text(-cardInnerW / 2 + 10, cardY - 14, challenge.icon, {
        fontSize: "16px",
        padding: { x: 2, y: 2 },
        resolution: 4,
      });
      chIconText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

      const catBadgeText = this.add.text(-cardInnerW / 2 + 34, cardY - 15, `[${catConfig.label}]`, {
        fontSize: "10px",
        fontStyle: "bold",
        color: catConfig.text,
        fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, sans-serif",
        padding: { x: 2, y: 2 },
        resolution: 4,
      });
      catBadgeText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

      const chTitle = this.add.text(-cardInnerW / 2 + 106, cardY - 15, challenge.title, {
        fontSize: "13px",
        fontStyle: "bold",
        color: "#ffffff",
        fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: { x: 4, y: 2 },
        resolution: 4,
      });
      chTitle.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

      const chDesc = this.add.text(-cardInnerW / 2 + 12, cardY + 5, challenge.desc, {
        fontSize: "11px",
        color: "#cbd5e1",
        fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: { x: 4, y: 2 },
        resolution: 4,
      });
      chDesc.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

      // Progress bar background & fill
      const barW = 100;
      const barH = 6;
      const barX = cardInnerW / 2 - 195;
      const barY = cardY + 7;
      const fillRatio = Math.min(1, Math.max(0, p.current / challenge.target));

      const barBg = this.add.graphics();
      barBg.fillStyle(0x1e293b, 1);
      barBg.fillRoundedRect(barX, barY, barW, barH, 3);
      if (fillRatio > 0) {
        barBg.fillStyle(isCompleted ? 0x22c55e : 0x3b82f6, 1);
        barBg.fillRoundedRect(barX, barY, Math.max(4, barW * fillRatio), barH, 3);
      }

      const chProgressText = this.add
        .text(
          barX + barW + 8,
          barY + 3,
          `${Math.min(p.current, challenge.target)}/${challenge.target}`,
          {
            fontSize: "11px",
            fontStyle: "bold",
            color: isCompleted ? "#4ade80" : "#94a3b8",
            fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            padding: { x: 4, y: 2 },
            resolution: 4,
          },
        )
        .setOrigin(0, 0.5);
      chProgressText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

      const chReward = this.add
        .text(
          cardInnerW / 2 - 105,
          cardY - 12,
          `+${challenge.reward} 🪙`,
          {
            fontSize: "12px",
            fontStyle: "bold",
            color: "#fde047",
            fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            padding: { x: 4, y: 2 },
            resolution: 4,
          },
        )
        .setOrigin(1, 0.5);
      chReward.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

      popupCard.add([chCard, chIconText, catBadgeText, chTitle, chDesc, barBg, chProgressText, chReward]);

      const actionBtnX = cardInnerW / 2 - 50;

      if (p.claimed) {
        const claimedText = this.add
          .text(actionBtnX, cardY, "COLETADO ✓", {
            fontSize: "11px",
            color: "#22c55e",
            fontStyle: "bold",
            fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, sans-serif",
            padding: { x: 4, y: 4 },
            resolution: 4,
          })
          .setOrigin(0.5);
        claimedText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
        popupCard.add(claimedText);
      } else if (isCompleted) {
        const claimBtnBg = this.add.graphics();
        const drawClaimBtn = (isH: boolean) => {
          claimBtnBg.clear();
          claimBtnBg.fillStyle(isH ? 0xeab308 : 0xfacc15, 1);
          claimBtnBg.fillRoundedRect(actionBtnX - 38, cardY - 14, 76, 28, 8);
        };
        drawClaimBtn(false);

        const claimBtnTxt = this.add
          .text(actionBtnX, cardY, "COLETAR", {
            fontSize: "11px",
            color: "#000000",
            fontStyle: "bold",
            fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, sans-serif",
            padding: { x: 4, y: 4 },
            resolution: 4,
          })
          .setOrigin(0.5);
        claimBtnTxt.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

        const claimHit = this.add
          .rectangle(actionBtnX, cardY, 76, 28, 0x000000, 0)
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
                fontSize: "11px",
                color: "#22c55e",
                fontStyle: "bold",
                fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, sans-serif",
                padding: { x: 4, y: 4 },
                resolution: 4,
              })
              .setOrigin(0.5);
            claimedText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
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
      } else {
        const inProgressTxt = this.add
          .text(actionBtnX, cardY, "EM ANDAMENTO", {
            fontSize: "10px",
            color: "#94a3b8",
            fontStyle: "bold",
            fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, sans-serif",
            padding: { x: 4, y: 4 },
            resolution: 4,
          })
          .setOrigin(0.5);
        inProgressTxt.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
        popupCard.add(inProgressTxt);
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
        collectAllBg.fillRoundedRect(-80, collectAllY - 14, 160, 28, 8);
      };
      drawCollectAll(false);

      const collectAllTxt = this.add
        .text(0, collectAllY, "⚡ COLETAR TUDO", {
          fontSize: "12px",
          color: "#ffffff",
          fontStyle: "bold",
          fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, sans-serif",
          padding: { x: 4, y: 4 },
          resolution: 4,
        })
        .setOrigin(0.5);
      collectAllTxt.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

      const collectAllHit = this.add
        .rectangle(0, collectAllY, 160, 28, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      claimableCount = 0;
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
    const container = this.add.container(x + 95, y).setAlpha(0);
    container.setScale(0.92, 0.94);

    const height = 36;
    const width = 225;

    const hexColorStr = "#" + color.toString(16).padStart(6, "0");

    const txt = this.add
      .text(26, height / 2, text, {
        fontSize: "13.5px",
        fontStyle: "bold",
        fontFamily: "'Montserrat', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        letterSpacing: 0.8,
        color: "#f8fafc",
        stroke: "#090d16",
        strokeThickness: 1.5,
        shadow: { offsetX: 0, offsetY: 1.5, color: "rgba(0, 0, 0, 0.85)", blur: 3, fill: true },
        padding: { x: 8, y: 6 },
        resolution: 4,
      })
      .setOrigin(0, 0.5);
    txt.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

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

    // Smooth right-side chevron arrow
    const chevron = this.add
      .text(width - d - 10, height / 2, "›", {
        fontSize: "20px",
        fontStyle: "bold",
        fontFamily: "'Montserrat', 'Plus Jakarta Sans', sans-serif",
        color: hexColorStr,
        padding: { x: 4, y: 4 },
        resolution: 4,
      })
      .setOrigin(0.5, 0.54)
      .setAlpha(0.75);
    chevron.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

    container.add([polyShadow, hoverGlow, polyMain, txt, chevron]);

    // Smooth premium entrance animation (slide + scale settle + subtle gleam sweep)
    this.tweens.add({
      targets: container,
      x: x,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 460,
      ease: "Cubic.easeOut",
      delay: delayAnim,
      onComplete: () => {
        // Subtle sheen flash across button accent on arrival
        this.tweens.add({
          targets: hoverGlow,
          alpha: 0.45,
          duration: 160,
          yoyo: true,
          ease: "Sine.easeInOut",
        });
      },
    });

    // Interactive hit area (min 44px height touch area for mobile precision)
    const hitArea = this.add
      .rectangle(width / 2, height / 2, width + 10, 44, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    container.add(hitArea);

    let pulseTween: Phaser.Tweens.Tween | null = null;
    const overFn = () => {
      polyMain.setFillStyle(color);
      polyMain.setStrokeStyle(2.5, 0xffffff);
      txt.setColor("#ffffff");
      chevron.setColor("#ffffff").setAlpha(1);
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
      txt.setColor("#f8fafc");
      chevron.setColor(hexColorStr).setAlpha(0.75);
      this.tweens.add({ targets: hoverGlow, alpha: 0, duration: 150 });
      this.tweens.add({
        targets: container,
        x: x,
        duration: 200,
        ease: "Power2",
      });

      if (pulseTween) {
        try {
          if (pulseTween.stop) pulseTween.stop();
        } catch (e) {}
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
