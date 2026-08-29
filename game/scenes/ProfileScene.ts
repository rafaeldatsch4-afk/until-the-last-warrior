import Phaser from "phaser";
import { transitionTo } from "../utils/sceneTransition";
import { ResponsiveUtils } from "../utils/ResponsiveUtils";
import { GameState } from "../types";
import { ACHIEVEMENTS, Achievement } from "../systems/Achievements";
import { auth, db } from "../../firebase/init";
import { doc, getDoc } from "firebase/firestore";

export default class ProfileScene extends Phaser.Scene {
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
  declare input: Phaser.Input.InputPlugin;

  private state!: GameState;
  private achievementsContainer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private maxScroll = 0;
  private maskHeight = 0;
  private scrollBarThumb?: Phaser.GameObjects.Graphics;
  private scrollBarTrack?: Phaser.GameObjects.Graphics;
  private playerNameText?: Phaser.GameObjects.Text;
  private playerAvatarText?: Phaser.GameObjects.Text;
  private equippedTitleText?: Phaser.GameObjects.Text;

  constructor() {
    super("ProfileScene");
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    ResponsiveUtils.init(this);
    const { width, height } = this.cameras.main;
    const bounds = ResponsiveUtils.getSafeBounds(this);

    this.state = this.registry.get("gameState") as GameState;
    if (!this.state && window.UTLW?.state) {
      this.state = window.UTLW.state;
    }

    // 1. Background Atmosphere
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x060913, 0x0c1427, 0x050914, 0x020408, 1);
    bg.fillRect(0, 0, width, height);

    // Subtle Grid Pattern
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1e293b, 0.22);
    for (let x = 0; x < width; x += 48) {
      grid.moveTo(x, 0).lineTo(x, height);
    }
    for (let y = 0; y < height; y += 48) {
      grid.moveTo(0, y).lineTo(width, y);
    }
    grid.strokePath();

    // Floating Sparks Particle Effect
    if (this.textures.exists("particle")) {
      this.add.particles(0, 0, "particle", {
        x: { min: 0, max: width },
        y: { min: 0, max: height },
        lifespan: 3000,
        speedY: { min: -10, max: -24 },
        speedX: { min: -6, max: 6 },
        scale: { start: 0.35, end: 0 },
        alpha: { start: 0.3, end: 0 },
        tint: [0x38bdf8, 0xf1c40f, 0x818cf8],
        quantity: 1,
        frequency: 300,
        blendMode: "ADD",
      });
    }

    if (this.cameras.main.postFX) {
      this.cameras.main.postFX.addVignette(0.5, 0.5, 0.75, 0.35);
    }

    // 2. HEADER TOP BAR
    const headerY = Math.max(24, bounds.top + 16);

    // Back Button (Left side)
    const backBtnX = Math.max(68, bounds.left + 54);
    const backBtnContainer = this.add.container(backBtnX, headerY).setDepth(300);

    const backBg = this.add.graphics();
    const btnW = 106;
    const btnH = 34;
    const radius = 7;

    const drawBackBtn = (isHover: boolean) => {
      backBg.clear();
      backBg.fillStyle(0x000000, 0.5);
      backBg.fillRoundedRect(-btnW / 2 + 2, -btnH / 2 + 2, btnW, btnH, radius);
      backBg.fillStyle(isHover ? 0xd93829 : 0x1e293b, 0.95);
      backBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, radius);
      backBg.lineStyle(1.5, isHover ? 0xfca5a5 : 0x475569, 0.9);
      backBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, radius);
    };
    drawBackBtn(false);

    const backTxt = this.add
      .text(0, 0, "← VOLTAR", {
        fontSize: "13px",
        fontStyle: "bold",
        color: "#ffffff",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        resolution: 3,
      })
      .setOrigin(0.5);

    const backHit = this.add
      .rectangle(0, 0, 126, 46, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    backBtnContainer.add([backBg, backTxt, backHit]);

    const exitToMenu = () => {
      if (this.sound && this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
      transitionTo(this, "MenuScene");
    };

    backHit.on("pointerover", () => {
      drawBackBtn(true);
      this.tweens.add({ targets: backBtnContainer, scale: 1.05, duration: 100 });
    });
    backHit.on("pointerout", () => {
      drawBackBtn(false);
      this.tweens.add({ targets: backBtnContainer, scale: 1, duration: 100 });
    });
    backHit.on("pointerdown", () => {
      this.tweens.add({
        targets: backBtnContainer,
        scale: 0.93,
        duration: 70,
        yoyo: true,
        onComplete: exitToMenu,
      });
    });

    this.input.keyboard?.on("keydown-ESC", exitToMenu);

    // Screen Title in the Center (Decorative lines placed outside text)
    const titleContainer = this.add.container(width / 2, headerY).setDepth(100);
    const titleDecor = this.add.graphics();
    titleDecor.lineStyle(1.5, 0x38bdf8, 0.6);
    titleDecor.moveTo(-210, 0).lineTo(-155, 0);
    titleDecor.moveTo(155, 0).lineTo(210, 0);
    titleDecor.strokePath();

    titleDecor.fillStyle(0x38bdf8, 0.9);
    titleDecor.fillCircle(-155, 0, 3);
    titleDecor.fillCircle(155, 0, 3);

    const titleTxt = this.add
      .text(0, -6, "PERFIL DO GUERREIRO", {
        fontSize: "19px",
        fontStyle: "900",
        color: "#38bdf8",
        stroke: "#000000",
        strokeThickness: 3.5,
        letterSpacing: 2,
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        shadow: { offsetY: 2, color: "#000000", blur: 4, fill: true },
        resolution: 3,
      })
      .setOrigin(0.5);

    const subtitleTxt = this.add
      .text(0, 11, "ESTATÍSTICAS & CONQUISTAS", {
        fontSize: "9px",
        fontStyle: "bold",
        color: "#94a3b8",
        letterSpacing: 1.5,
        fontFamily: "system-ui, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    titleContainer.add([titleDecor, titleTxt, subtitleTxt]);

    // Coins Display on Top Right
    const coinsX = Math.min(width - 68, bounds.right - 54);
    const coinsContainer = this.add.container(coinsX, headerY).setDepth(100);
    const coinsBg = this.add.graphics();
    coinsBg.fillStyle(0x0f172a, 0.95);
    coinsBg.fillRoundedRect(-54, -16, 108, 32, 7);
    coinsBg.lineStyle(1.5, 0xd97706, 0.9);
    coinsBg.strokeRoundedRect(-54, -16, 108, 32, 7);

    const coinIcon = this.add.circle(-34, 0, 7, 0xfacc15).setStrokeStyle(1, 0xb45309);
    const coinSymbol = this.add.text(-34, 0, "$", {
      fontSize: "9px",
      color: "#78350f",
      fontStyle: "bold",
    }).setOrigin(0.5);

    const coinsText = this.add.text(-20, 0, `${this.state.coins || 0}`, {
      fontSize: "13px",
      fontStyle: "bold",
      color: "#fde047",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      resolution: 3,
    }).setOrigin(0, 0.5);

    coinsContainer.add([coinsBg, coinIcon, coinSymbol, coinsText]);

    // 3. MAIN CONTENT LAYOUT
    const contentW = Math.min(910, width - Math.max(30, (width - bounds.width) + 16));
    const contentLeft = width / 2 - contentW / 2;

    // --- SECTION 1: HEADER USER PROFILE BANNER ---
    const bannerY = headerY + 24;
    const bannerH = 44;
    this.createProfileBanner(contentLeft, bannerY, contentW, bannerH);

    // Two Columns Layout below the banner
    const columnsY = bannerY + bannerH + 8;
    const columnGap = 10;
    const colW = (contentW - columnGap) / 2;
    const leftColX = contentLeft;
    const rightColX = contentLeft + colW + columnGap;
    const bottomLimit = Math.min(height - 12, bounds.bottom - 10);
    const totalColsH = Math.max(360, bottomLimit - columnsY);

    // --- SECTION 2: ESTATÍSTICAS PRINCIPAIS (Left Top) ---
    const statsH = 138;
    this.createMainStatsSection(leftColX, columnsY, colW, statsH);

    // --- SECTION 3: PROGRESSO DO MODO HISTÓRIA (Left Bottom) ---
    const storyY = columnsY + statsH + 8;
    const storyH = totalColsH - statsH - 8;
    this.createStoryProgressSection(leftColX, storyY, colW, storyH);

    // --- SECTION 4: CONQUISTAS & TÍTULOS (Right Column) ---
    this.createAchievementsSection(rightColX, columnsY, colW, totalColsH);

    // Fetch user details asynchronously if logged in
    this.loadUserData();
  }

  private createProfileBanner(x: number, y: number, w: number, h: number) {
    const bannerContainer = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x0b1120, 0.95);
    bg.fillRoundedRect(0, 0, w, h, 8);
    bg.lineStyle(1.5, 0x1e293b, 0.9);
    bg.strokeRoundedRect(0, 0, w, h, 8);

    // Golden left highlight border
    bg.fillStyle(0x38bdf8, 1);
    bg.fillRoundedRect(0, 0, 4, h, 2);

    // Avatar Box
    const avatarBoxSize = 36;
    const avatarX = 24;
    const avatarY = h / 2;

    const avatarBg = this.add.graphics();
    avatarBg.fillStyle(0x1e293b, 0.9);
    avatarBg.fillRoundedRect(avatarX - avatarBoxSize / 2, avatarY - avatarBoxSize / 2, avatarBoxSize, avatarBoxSize, 8);
    avatarBg.lineStyle(1.5, 0x38bdf8, 0.8);
    avatarBg.strokeRoundedRect(avatarX - avatarBoxSize / 2, avatarY - avatarBoxSize / 2, avatarBoxSize, avatarBoxSize, 8);

    this.playerAvatarText = this.add.text(avatarX, avatarY, "🥷", {
      fontSize: "19px",
      fontFamily: "system-ui",
      resolution: 2,
    }).setOrigin(0.5);

    // User Name
    const initialName = auth.currentUser?.displayName || "Guerreiro";
    this.playerNameText = this.add.text(50, avatarY - 8, initialName, {
      fontSize: "15px",
      fontStyle: "bold",
      color: "#f8fafc",
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      resolution: 2,
    }).setOrigin(0, 0.5);

    // Equipped Title Pill
    const equippedTitle = this.state.equippedTitle || this.state.unlockedTitles?.[0] || "Lutador Novato";
    this.equippedTitleText = this.add.text(50, avatarY + 9, `✦ ${equippedTitle.toUpperCase()}`, {
      fontSize: "10px",
      fontStyle: "bold",
      color: "#facc15",
      letterSpacing: 1,
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      resolution: 2,
    }).setOrigin(0, 0.5);

    // Right Side: Status Badge
    const statusPillW = 140;
    const statusPillX = w - statusPillW - 14;
    const statusPillBg = this.add.graphics();
    statusPillBg.fillStyle(0x0f172a, 0.85);
    statusPillBg.fillRoundedRect(statusPillX, avatarY - 14, statusPillW, 28, 6);
    statusPillBg.lineStyle(1, 0x334155, 0.8);
    statusPillBg.strokeRoundedRect(statusPillX, avatarY - 14, statusPillW, 28, 6);

    const statusDot = this.add.circle(statusPillX + 14, avatarY, 4, 0x22c55e);
    this.tweens.add({
      targets: statusDot,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    const statusTxt = this.add.text(statusPillX + 26, avatarY, "PERFIL SINCRONIZADO", {
      fontSize: "9px",
      fontStyle: "bold",
      color: "#94a3b8",
      fontFamily: "system-ui, sans-serif",
      resolution: 2,
    }).setOrigin(0, 0.5);

    bannerContainer.add([
      bg,
      avatarBg,
      this.playerAvatarText,
      this.playerNameText,
      this.equippedTitleText,
      statusPillBg,
      statusDot,
      statusTxt,
    ]);
  }

  private createMainStatsSection(x: number, y: number, w: number, h: number) {
    const container = this.add.container(x, y);

    // Section Frame
    const frame = this.add.graphics();
    frame.fillStyle(0x0b1120, 0.88);
    frame.fillRoundedRect(0, 0, w, h, 8);
    frame.lineStyle(1.5, 0x1e293b, 0.8);
    frame.strokeRoundedRect(0, 0, w, h, 8);

    // Section Title
    const titleTxt = this.add.text(14, 14, "📊 ESTATÍSTICAS GERAIS", {
      fontSize: "12px",
      fontStyle: "900",
      color: "#38bdf8",
      letterSpacing: 1,
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      resolution: 2,
    }).setOrigin(0, 0.5);

    container.add([frame, titleTxt]);

    // Stat Cards List (5 stats)
    const statsData = [
      {
        icon: "🏆",
        label: "Vitórias Totais",
        value: `${this.state.stats?.totalWins || 0}`,
        color: "#4ade80",
        border: 0x166534,
      },
      {
        icon: "🔥",
        label: "Maior Sequência",
        value: `${this.state.stats?.maxWinStreak || 0}`,
        color: "#fb923c",
        border: 0x9a3412,
      },
      {
        icon: "🏯",
        label: "Torneios Vencidos",
        value: `${this.state.stats?.tournamentsWon || 0}`,
        color: "#facc15",
        border: 0x854d0e,
      },
      {
        icon: "🕹️",
        label: "Arcade Completo",
        value: `${this.state.stats?.arcadeClears || 0}`,
        color: "#60a5fa",
        border: 0x1e40af,
      },
      {
        icon: "💰",
        label: "Moedas Acumuladas",
        value: `${this.state.coins || 0}`,
        color: "#fde047",
        border: 0xb45309,
      },
    ];

    // Grid layout: 2 columns in top row, 3 cards in second row
    const cardGap = 6;
    const cardPadX = 10;
    const startY = 28;

    // Row 1 (2 cards)
    const row1W = (w - cardPadX * 2 - cardGap) / 2;
    const row1H = 46;
    for (let i = 0; i < 2; i++) {
      const data = statsData[i];
      const cardX = cardPadX + i * (row1W + cardGap);
      const cardY = startY;
      this.createStatMiniCard(container, cardX, cardY, row1W, row1H, data);
    }

    // Row 2 (3 cards)
    const row2W = (w - cardPadX * 2 - cardGap * 2) / 3;
    const row2H = 46;
    const row2Y = startY + row1H + cardGap;
    for (let i = 2; i < 5; i++) {
      const data = statsData[i];
      const cardX = cardPadX + (i - 2) * (row2W + cardGap);
      this.createStatMiniCard(container, cardX, row2Y, row2W, row2H, data);
    }
  }

  private createStatMiniCard(
    parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    w: number,
    h: number,
    data: { icon: string; label: string; value: string; color: string; border: number }
  ) {
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x0f172a, 0.92);
    cardBg.fillRoundedRect(x, y, w, h, 6);
    cardBg.lineStyle(1, data.border, 0.6);
    cardBg.strokeRoundedRect(x, y, w, h, 6);

    const icon = this.add.text(x + 8, y + h / 2, data.icon, {
      fontSize: "15px",
      fontFamily: "system-ui",
    }).setOrigin(0, 0.5);

    const textStartX = x + 30;
    const label = this.add.text(textStartX, y + 12, data.label, {
      fontSize: "8.5px",
      fontStyle: "bold",
      color: "#94a3b8",
      fontFamily: "system-ui, sans-serif",
      resolution: 2,
    }).setOrigin(0, 0.5);

    const val = this.add.text(textStartX, y + 30, data.value, {
      fontSize: "14px",
      fontStyle: "900",
      color: data.color,
      fontFamily: "'Plus Jakarta Sans', monospace, sans-serif",
      resolution: 2,
    }).setOrigin(0, 0.5);

    parent.add([cardBg, icon, label, val]);
  }

  private createStoryProgressSection(x: number, y: number, w: number, h: number) {
    const container = this.add.container(x, y);

    const frame = this.add.graphics();
    frame.fillStyle(0x0b1120, 0.88);
    frame.fillRoundedRect(0, 0, w, h, 8);
    frame.lineStyle(1.5, 0x1e293b, 0.8);
    frame.strokeRoundedRect(0, 0, w, h, 8);

    // Section Title
    const titleTxt = this.add.text(14, 13, "⚔️ PROGRESSO DO MODO HISTÓRIA", {
      fontSize: "11px",
      fontStyle: "900",
      color: "#38bdf8",
      letterSpacing: 1,
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      resolution: 2,
    }).setOrigin(0, 0.5);

    container.add([frame, titleTxt]);

    const storyState = this.state.storyState;
    if (!storyState) {
      // Empty story state message
      const emptyContainer = this.add.container(w / 2, h / 2 + 6);
      const emptyIcon = this.add.text(0, -10, "📖", { fontSize: "22px" }).setOrigin(0.5);
      const emptyTitle = this.add.text(0, 14, "Modo História Não Iniciado", {
        fontSize: "11px",
        fontStyle: "bold",
        color: "#facc15",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }).setOrigin(0.5);
      const emptySub = this.add.text(0, 28, "Avance na campanha para evoluir nível e atributos!", {
        fontSize: "9.5px",
        color: "#64748b",
        fontFamily: "system-ui, sans-serif",
      }).setOrigin(0.5);

      emptyContainer.add([emptyIcon, emptyTitle, emptySub]);
      container.add(emptyContainer);
      return;
    }

    // 1. Level & EXP Bar (Top of story box)
    const levelX = 12;
    const levelY = 26;

    const lvlBadge = this.add.graphics();
    lvlBadge.fillStyle(0x0284c7, 1);
    lvlBadge.fillRoundedRect(levelX, levelY, 46, 18, 4);
    lvlBadge.lineStyle(1, 0x38bdf8, 1);
    lvlBadge.strokeRoundedRect(levelX, levelY, 46, 18, 4);

    const lvlTxt = this.add.text(levelX + 23, levelY + 9, `LVL ${storyState.level}`, {
      fontSize: "9.5px",
      fontStyle: "900",
      color: "#ffffff",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      resolution: 2,
    }).setOrigin(0.5);

    // EXP Bar
    const expNeeded = (storyState.level + 1) * 100;
    const expBarX = levelX + 50;
    const expBarW = w - expBarX - 12;
    const expBarH = 18;

    const expBarBg = this.add.graphics();
    expBarBg.fillStyle(0x0f172a, 0.95);
    expBarBg.fillRoundedRect(expBarX, levelY, expBarW, expBarH, 4);
    expBarBg.lineStyle(1, 0x334155, 0.8);
    expBarBg.strokeRoundedRect(expBarX, levelY, expBarW, expBarH, 4);

    const expRatio = Math.min(1, Math.max(0, storyState.exp / expNeeded));
    const expFillW = Math.max(0, (expBarW - 4) * expRatio);

    const expFill = this.add.graphics();
    if (expFillW > 0) {
      expFill.fillGradientStyle(0x10b981, 0x059669, 0x10b981, 0x059669, 1);
      expFill.fillRoundedRect(expBarX + 2, levelY + 2, expFillW, expBarH - 4, 3);
    }

    const expTxt = this.add.text(expBarX + expBarW / 2, levelY + expBarH / 2, `XP: ${storyState.exp} / ${expNeeded}`, {
      fontSize: "9.5px",
      fontStyle: "bold",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      resolution: 2,
    }).setOrigin(0.5);

    container.add([lvlBadge, lvlTxt, expBarBg, expFill, expTxt]);

    // 2. 5 Distributed Attributes in Mini Bars
    const statsList = [
      { key: "attack", label: "ATAQUE", val: storyState.stats.attack, color: 0xef4444, maxVal: 50 },
      { key: "defense", label: "DEFESA", val: storyState.stats.defense, color: 0x3b82f6, maxVal: 50 },
      { key: "ki", label: "KI", val: storyState.stats.ki, color: 0xa855f7, maxVal: 50 },
      { key: "speed", label: "VELOCIDADE", val: storyState.stats.speed, color: 0xeab308, maxVal: 50 },
      { key: "health", label: "VITALIDADE", val: storyState.stats.health, color: 0x10b981, maxVal: 50 },
    ];

    const statsStartY = levelY + 22;
    const statRowH = 17;
    const statGap = 3;

    statsList.forEach((st, idx) => {
      const rowY = statsStartY + idx * (statRowH + statGap);
      const rowBg = this.add.graphics();
      rowBg.fillStyle(0x0f172a, 0.6);
      rowBg.fillRoundedRect(12, rowY, w - 24, statRowH, 3);

      // Color indicator dot
      const dot = this.add.circle(19, rowY + statRowH / 2, 3.5, st.color);

      // Label
      const lbl = this.add.text(28, rowY + statRowH / 2, st.label, {
        fontSize: "8.5px",
        fontStyle: "bold",
        color: "#cbd5e1",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        resolution: 2,
      }).setOrigin(0, 0.5);

      // Mini Progress Bar
      const barX = 118;
      const barW = w - 24 - barX - 32;
      const barH = 7;
      const barY = rowY + (statRowH - barH) / 2;

      const miniTrack = this.add.graphics();
      miniTrack.fillStyle(0x1e293b, 0.9);
      miniTrack.fillRoundedRect(barX, barY, barW, barH, 2.5);

      const ratio = Math.min(1, Math.max(0.04, st.val / st.maxVal));
      const miniFill = this.add.graphics();
      miniFill.fillStyle(st.color, 1);
      miniFill.fillRoundedRect(barX, barY, barW * ratio, barH, 2.5);

      // Value text
      const valTxt = this.add.text(w - 16, rowY + statRowH / 2, `${st.val}`, {
        fontSize: "9.5px",
        fontStyle: "900",
        color: "#ffffff",
        fontFamily: "'Plus Jakarta Sans', monospace, sans-serif",
        resolution: 2,
      }).setOrigin(1, 0.5);

      container.add([rowBg, dot, lbl, miniTrack, miniFill, valTxt]);
    });
  }

  private createAchievementsSection(x: number, y: number, w: number, h: number) {
    const sectionContainer = this.add.container(x, y);

    // Section Frame
    const frame = this.add.graphics();
    frame.fillStyle(0x0b1120, 0.88);
    frame.fillRoundedRect(0, 0, w, h, 8);
    frame.lineStyle(1.5, 0x1e293b, 0.8);
    frame.strokeRoundedRect(0, 0, w, h, 8);

    // Header Title & Counter Pill
    const unlockedCount = ACHIEVEMENTS.filter((ach) => ach.check(this.state)).length;
    const totalCount = ACHIEVEMENTS.length;

    const titleTxt = this.add.text(14, 14, "🏆 CONQUISTAS", {
      fontSize: "12px",
      fontStyle: "900",
      color: "#38bdf8",
      letterSpacing: 1,
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      resolution: 2,
    }).setOrigin(0, 0.5);

    const counterPillW = 85;
    const counterPillX = w - counterPillW - 12;
    const counterPillBg = this.add.graphics();
    counterPillBg.fillStyle(0x0f172a, 0.95);
    counterPillBg.fillRoundedRect(counterPillX, 6, counterPillW, 18, 5);
    counterPillBg.lineStyle(1, 0xd4af37, 0.8);
    counterPillBg.strokeRoundedRect(counterPillX, 6, counterPillW, 18, 5);

    const counterTxt = this.add.text(counterPillX + counterPillW / 2, 15, `${unlockedCount} / ${totalCount} LIBERADAS`, {
      fontSize: "8.5px",
      fontStyle: "bold",
      color: "#fde047",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      resolution: 2,
    }).setOrigin(0.5);

    sectionContainer.add([frame, titleTxt, counterPillBg, counterTxt]);

    // Scrollable container for achievements
    const listStartY = 30;
    this.maskHeight = h - listStartY - 10;
    const listAbsoluteY = y + listStartY;

    this.achievementsContainer = this.add.container(0, listStartY);

    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(x + 6, listAbsoluteY, w - 12, this.maskHeight);
    this.achievementsContainer.setMask(maskShape.createGeometryMask());

    sectionContainer.add(this.achievementsContainer);

    // Scrollbar Track & Thumb
    this.scrollBarTrack = this.add.graphics();
    this.scrollBarThumb = this.add.graphics();
    const sbX = x + w - 8;
    this.scrollBarTrack.fillStyle(0x1e293b, 0.5);
    this.scrollBarTrack.fillRoundedRect(sbX, listAbsoluteY, 3, this.maskHeight, 1.5);

    // Render Achievement Cards
    const cardW = w - 24;
    const cardH = 44;
    const cardGap = 5;
    let cardY = 4;

    ACHIEVEMENTS.forEach((ach) => {
      const isUnlocked = ach.check(this.state);
      this.renderAchievementCard(this.achievementsContainer, 10, cardY, cardW, cardH, ach, isUnlocked);
      cardY += cardH + cardGap;
    });

    const totalHeight = cardY;
    this.maxScroll = Math.max(0, totalHeight - this.maskHeight);

    // Scroll Interactivity with Mobile Touch Drag Support
    const hitZone = this.add
      .rectangle(x + w / 2, listAbsoluteY + this.maskHeight / 2, w, this.maskHeight, 0x000000, 0)
      .setInteractive();

    this.input.on("wheel", (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
      if (this.maxScroll > 0) {
        this.scrollY -= deltaY * 0.5;
        this.constrainScroll(listStartY, y, x, w);
      }
    });

    let isDragging = false;
    let dragStartY = 0;
    hitZone.on("pointerdown", (pointer: any) => {
      isDragging = true;
      dragStartY = pointer.y - this.scrollY;
    });
    this.input.on("pointermove", (pointer: any) => {
      if (isDragging && this.maxScroll > 0) {
        this.scrollY = pointer.y - dragStartY;
        this.constrainScroll(listStartY, y, x, w);
      }
    });
    this.input.on("pointerup", () => {
      isDragging = false;
    });
    this.input.on("pointerupoutside", () => {
      isDragging = false;
    });

    this.constrainScroll(listStartY, y, x, w);
  }

  private constrainScroll(listStartY: number, originY: number, originX: number, colW: number) {
    if (this.scrollY > 0) this.scrollY = 0;
    if (this.scrollY < -this.maxScroll) this.scrollY = -this.maxScroll;

    this.achievementsContainer.y = listStartY + this.scrollY;

    if (this.scrollBarThumb && this.maxScroll > 0) {
      this.scrollBarThumb.clear();
      const listAbsoluteY = originY + listStartY;
      const sbX = originX + colW - 8;
      const thumbHeight = Math.max(16, (this.maskHeight / (this.maskHeight + this.maxScroll)) * this.maskHeight);
      const scrollRatio = Math.abs(this.scrollY) / this.maxScroll;
      const thumbY = listAbsoluteY + scrollRatio * (this.maskHeight - thumbHeight);

      this.scrollBarThumb.fillStyle(0x38bdf8, 0.85);
      this.scrollBarThumb.fillRoundedRect(sbX, thumbY, 3, thumbHeight, 1.5);
    }
  }

  private renderAchievementCard(
    parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    w: number,
    h: number,
    ach: Achievement,
    unlocked: boolean
  ) {
    const cardContainer = this.add.container(x, y);

    const cardBg = this.add.graphics();
    if (unlocked) {
      cardBg.fillStyle(0x0f172a, 0.95);
      cardBg.fillRoundedRect(0, 0, w, h, 6);
      cardBg.lineStyle(1.5, 0xd97706, 0.8);
      cardBg.strokeRoundedRect(0, 0, w, h, 6);
    } else {
      cardBg.fillStyle(0x070b14, 0.85);
      cardBg.fillRoundedRect(0, 0, w, h, 6);
      cardBg.lineStyle(1, 0x1e293b, 0.6);
      cardBg.strokeRoundedRect(0, 0, w, h, 6);
    }

    // Left status icon (Checkmark or Padlock)
    const icon = this.add.text(12, h / 2, unlocked ? "✓" : "🔒", {
      fontSize: unlocked ? "15px" : "13px",
      fontStyle: "900",
      color: unlocked ? "#22c55e" : "#475569",
      fontFamily: "system-ui",
      resolution: 2,
    }).setOrigin(0, 0.5);

    // Title and description
    const textStartX = 34;
    const nameTxt = this.add.text(textStartX, 12, ach.name, {
      fontSize: "11.5px",
      fontStyle: "bold",
      color: unlocked ? "#fef08a" : "#64748b",
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      resolution: 2,
    }).setOrigin(0, 0.5);

    const descTxt = this.add.text(textStartX, 29, ach.desc, {
      fontSize: "9px",
      color: unlocked ? "#94a3b8" : "#475569",
      fontFamily: "system-ui, sans-serif",
      resolution: 2,
    }).setOrigin(0, 0.5);

    // Right Badge (CONCLUÍDA / BLOQUEADA)
    const badgeW = 76;
    const badgeX = w - badgeW - 8;
    const badgeBg = this.add.graphics();

    if (unlocked) {
      badgeBg.fillStyle(0x1e293b, 0.9);
      badgeBg.fillRoundedRect(badgeX, 11, badgeW, 20, 4);
      badgeBg.lineStyle(1, 0xfacc15, 0.7);
      badgeBg.strokeRoundedRect(badgeX, 11, badgeW, 20, 4);
    } else {
      badgeBg.fillStyle(0x0f172a, 0.6);
      badgeBg.fillRoundedRect(badgeX, 11, badgeW, 20, 4);
      badgeBg.lineStyle(1, 0x1e293b, 0.5);
      badgeBg.strokeRoundedRect(badgeX, 11, badgeW, 20, 4);
    }

    const badgeTxt = this.add.text(badgeX + badgeW / 2, 21, unlocked ? "CONCLUÍDA" : "BLOQUEADA", {
      fontSize: "8px",
      fontStyle: "bold",
      color: unlocked ? "#facc15" : "#475569",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      resolution: 2,
    }).setOrigin(0.5);

    cardContainer.add([cardBg, icon, nameTxt, descTxt, badgeBg, badgeTxt]);

    // If unlocked, allow clicking to equip title
    if (unlocked) {
      const clickHit = this.add.rectangle(w / 2, h / 2, w, h, 0, 0).setInteractive({ useHandCursor: true });
      clickHit.on("pointerover", () => {
        cardBg.clear();
        cardBg.fillStyle(0x172554, 0.98);
        cardBg.fillRoundedRect(0, 0, w, h, 6);
        cardBg.lineStyle(1.5, 0x38bdf8, 1);
        cardBg.strokeRoundedRect(0, 0, w, h, 6);
      });
      clickHit.on("pointerout", () => {
        cardBg.clear();
        cardBg.fillStyle(0x0f172a, 0.95);
        cardBg.fillRoundedRect(0, 0, w, h, 6);
        cardBg.lineStyle(1.5, 0xd97706, 0.8);
        cardBg.strokeRoundedRect(0, 0, w, h, 6);
      });
      clickHit.on("pointerdown", () => {
        this.state.equippedTitle = ach.name;
        if (window.UTLW) window.UTLW.save();
        if (this.equippedTitleText) {
          this.equippedTitleText.setText(`✦ ${ach.name.toUpperCase()}`);
        }
        if (this.sound && this.cache.audio.exists("sfx_select")) {
          this.sound.play("sfx_select");
        }
      });
      cardContainer.add(clickHit);
    }

    parent.add(cardContainer);
  }

  private async loadUserData() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.username && this.playerNameText) {
          this.playerNameText.setText(data.username);
        }
        if (data.avatar && this.playerAvatarText) {
          this.playerAvatarText.setText(data.avatar);
        }
      }
    } catch (e) {
      // Ignore network errors smoothly
    }
  }
}
