import Phaser from "phaser";
import { transitionTo } from "../utils/sceneTransition";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase/init";
import { ResponsiveUtils } from "../utils/ResponsiveUtils";

export default class LeaderboardScene extends Phaser.Scene {
  private unsubscribe: any = null;
  private listContainer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private maxScroll = 0;
  private loadingText!: Phaser.GameObjects.Text;
  private loadingSpinner!: Phaser.GameObjects.Arc;
  private players: any[] = [];
  private tableTopY = 0;
  private maskHeight = 0;
  private scrollBarThumb?: Phaser.GameObjects.Graphics;
  private scrollBarTrack?: Phaser.GameObjects.Graphics;

  constructor() {
    super("LeaderboardScene");
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const { width, height } = this.cameras.main;
    const bounds = ResponsiveUtils.getSafeBounds();

    // 1. Rich Atmospheric Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x060913, 0x0a1020, 0x03060c, 0x020408, 1);
    bg.fillRect(0, 0, width, height);

    // Subtle Hexagonal / Grid Lines
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1e293b, 0.25);
    for (let x = 0; x < width; x += 48) {
      grid.moveTo(x, 0).lineTo(x, height);
    }
    for (let y = 0; y < height; y += 48) {
      grid.moveTo(0, y).lineTo(width, y);
    }
    grid.strokePath();

    // Ambient floating golden embers / energy sparks
    if (this.textures.exists("particle")) {
      this.add.particles(0, 0, "particle", {
        x: { min: 0, max: width },
        y: { min: 0, max: height },
        lifespan: 3500,
        speedY: { min: -12, max: -28 },
        speedX: { min: -8, max: 8 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.35, end: 0 },
        tint: [0xf1c40f, 0xe67e22, 0x3498db],
        quantity: 1,
        frequency: 250,
        blendMode: "ADD",
      });
    }

    if (this.cameras.main.postFX) {
      this.cameras.main.postFX.addVignette(0.5, 0.5, 0.75, 0.35);
    }

    // 2. Back Button (Top Left, Elevated Z-Index)
    const backBtnContainer = this.add
      .container(bounds.left + 55, bounds.top + 26)
      .setDepth(500);

    const backBg = this.add.graphics();
    const btnW = 100;
    const btnH = 32;
    const radius = 6;

    const drawBackBtn = (isHover: boolean) => {
      backBg.clear();
      // Drop Shadow
      backBg.fillStyle(0x000000, 0.5);
      backBg.fillRoundedRect(-btnW / 2 + 2, -btnH / 2 + 2, btnW, btnH, radius);
      // Surface
      backBg.fillStyle(isHover ? 0x334155 : 0x1e293b, 0.95);
      backBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, radius);
      // Border
      backBg.lineStyle(1.5, isHover ? 0x38bdf8 : 0x475569, 0.9);
      backBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, radius);
    };

    drawBackBtn(false);

    const backTxt = this.add
      .text(0, 0, "← VOLTAR", {
        fontSize: "13px",
        fontStyle: "bold",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    backBtnContainer.add([backBg, backTxt]);

    const backHit = this.add
      .rectangle(0, 0, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    backBtnContainer.add(backHit);

    backHit.on("pointerover", () => {
      drawBackBtn(true);
      backTxt.setColor("#38bdf8");
      this.tweens.add({ targets: backBtnContainer, scale: 1.05, duration: 100 });
    });
    backHit.on("pointerout", () => {
      drawBackBtn(false);
      backTxt.setColor("#ffffff");
      this.tweens.add({ targets: backBtnContainer, scale: 1, duration: 100 });
    });
    backHit.on("pointerdown", () => {
      transitionTo(this, "MenuScene");
    });

    // 3. Header Title & Trophy Decorator
    const headerContainer = this.add.container(width / 2, bounds.top + 26).setDepth(100);

    // Decorative Wings / Lines around Title
    const headerDecor = this.add.graphics();
    headerDecor.lineStyle(2, 0xd4af37, 0.6);
    headerDecor.moveTo(-180, 0).lineTo(-100, 0);
    headerDecor.moveTo(100, 0).lineTo(180, 0);
    headerDecor.strokePath();

    // Diamond accents
    headerDecor.fillStyle(0xf1c40f, 0.9);
    headerDecor.fillCircle(-100, 0, 3.5);
    headerDecor.fillCircle(100, 0, 3.5);

    // Main Title Text (Safe from broken emoji glyphs)
    const headerTitle = this.add
      .text(0, -4, "TOP GLOBAL", {
        fontSize: "22px",
        fontStyle: "900",
        color: "#facc15",
        stroke: "#000000",
        strokeThickness: 4,
        letterSpacing: 3,
        fontFamily:
          "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
        shadow: {
          offsetY: 2,
          color: "#000000",
          blur: 4,
          stroke: true,
          fill: true,
        },
        resolution: 2,
      })
      .setOrigin(0.5);

    const headerSub = this.add
      .text(0, 14, "CLASSIFICAÇÃO OFICIAL DOS GUERREIROS", {
        fontSize: "9px",
        fontStyle: "bold",
        color: "#94a3b8",
        letterSpacing: 2,
        fontFamily: "system-ui, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    headerContainer.add([headerDecor, headerTitle, headerSub]);

    this.tweens.add({
      targets: headerContainer,
      y: bounds.top + 24,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // 4. Main Frame & Table Layout
    this.tableTopY = bounds.top + 58;
    const tableW = Math.min(840, width - 40);
    const tableX = width / 2;
    const tableLeft = tableX - tableW / 2;
    const tableBottom = bounds.bottom - 22;
    const totalFrameH = tableBottom - this.tableTopY;

    // Outer Glass Panel Frame
    const outerFrame = this.add.graphics();
    outerFrame.fillStyle(0x0a0f1d, 0.75);
    outerFrame.fillRoundedRect(tableLeft - 8, this.tableTopY - 4, tableW + 16, totalFrameH + 8, 10);
    outerFrame.lineStyle(1.5, 0x1e293b, 0.8);
    outerFrame.strokeRoundedRect(tableLeft - 8, this.tableTopY - 4, tableW + 16, totalFrameH + 8, 10);

    // Glowing corner accents
    outerFrame.lineStyle(2.5, 0xf1c40f, 0.7);
    const bracketSize = 12;
    // Top-Left
    outerFrame.moveTo(tableLeft - 8, this.tableTopY - 4 + bracketSize).lineTo(tableLeft - 8, this.tableTopY - 4).lineTo(tableLeft - 8 + bracketSize, this.tableTopY - 4);
    // Top-Right
    outerFrame.moveTo(tableLeft + tableW + 8 - bracketSize, this.tableTopY - 4).lineTo(tableLeft + tableW + 8, this.tableTopY - 4).lineTo(tableLeft + tableW + 8, this.tableTopY - 4 + bracketSize);
    // Bottom-Left
    outerFrame.moveTo(tableLeft - 8, this.tableTopY + totalFrameH + 4 - bracketSize).lineTo(tableLeft - 8, this.tableTopY + totalFrameH + 4).lineTo(tableLeft - 8 + bracketSize, this.tableTopY + totalFrameH + 4);
    // Bottom-Right
    outerFrame.moveTo(tableLeft + tableW + 8 - bracketSize, this.tableTopY + totalFrameH + 4).lineTo(tableLeft + tableW + 8, this.tableTopY + totalFrameH + 4).lineTo(tableLeft + tableW + 8, this.tableTopY + totalFrameH + 4 - bracketSize);
    outerFrame.strokePath();

    // Column Headers Bar
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0f172a, 0.95);
    headerBg.fillRoundedRect(tableLeft, this.tableTopY, tableW, 32, 6);
    headerBg.lineStyle(1, 0x334155, 0.9);
    headerBg.strokeRoundedRect(tableLeft, this.tableTopY, tableW, 32, 6);

    const headerTextY = this.tableTopY + 16;
    const colRankX = tableLeft + 45;
    const colPlayerX = tableLeft + 100;
    const colEloX = tableLeft + tableW * 0.52;
    const colWinRateX = tableLeft + tableW * 0.68;
    const colWinsX = tableLeft + tableW * 0.82;
    const colMatchesX = tableLeft + tableW * 0.93;

    this.add.text(colRankX, headerTextY, "# RANK", {
      fontSize: "11px",
      color: "#94a3b8",
      fontStyle: "bold",
      fontFamily: "system-ui, sans-serif",
      resolution: 2,
    }).setOrigin(0.5);

    this.add.text(colPlayerX, headerTextY, "GUERREIRO", {
      fontSize: "11px",
      color: "#94a3b8",
      fontStyle: "bold",
      fontFamily: "system-ui, sans-serif",
      resolution: 2,
    }).setOrigin(0, 0.5);

    this.add.text(colEloX, headerTextY, "TIER / ELO", {
      fontSize: "11px",
      color: "#94a3b8",
      fontStyle: "bold",
      fontFamily: "system-ui, sans-serif",
      resolution: 2,
    }).setOrigin(0.5);

    this.add.text(colWinRateX, headerTextY, "% VITÓRIA", {
      fontSize: "11px",
      color: "#94a3b8",
      fontStyle: "bold",
      fontFamily: "system-ui, sans-serif",
      resolution: 2,
    }).setOrigin(0.5);

    this.add.text(colWinsX, headerTextY, "VITÓRIAS", {
      fontSize: "11px",
      color: "#94a3b8",
      fontStyle: "bold",
      fontFamily: "system-ui, sans-serif",
      resolution: 2,
    }).setOrigin(0.5);

    this.add.text(colMatchesX, headerTextY, "PARTIDAS", {
      fontSize: "11px",
      color: "#94a3b8",
      fontStyle: "bold",
      fontFamily: "system-ui, sans-serif",
      resolution: 2,
    }).setOrigin(0.5);

    // List Container & Mask
    const listStartY = this.tableTopY + 38;
    this.maskHeight = Math.max(120, totalFrameH - 46);
    this.listContainer = this.add.container(0, listStartY);

    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(tableLeft - 10, listStartY, tableW + 20, this.maskHeight);
    this.listContainer.setMask(maskShape.createGeometryMask());

    // Scrollbar Graphics
    this.scrollBarTrack = this.add.graphics();
    this.scrollBarThumb = this.add.graphics();
    const sbX = tableLeft + tableW + 2;
    this.scrollBarTrack.fillStyle(0x1e293b, 0.5);
    this.scrollBarTrack.fillRoundedRect(sbX, listStartY, 4, this.maskHeight, 2);

    // Scroll Interactivity Zone
    const zone = this.add
      .zone(tableX, listStartY + this.maskHeight / 2, tableW, this.maskHeight)
      .setInteractive();

    this.input.on("wheel", (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
      this.scrollY -= deltaY * 0.6;
      this.constrainScroll();
    });

    let isDragging = false;
    let dragStartY = 0;
    zone.on("pointerdown", (pointer: any) => {
      isDragging = true;
      dragStartY = pointer.y - this.scrollY;
    });
    this.input.on("pointermove", (pointer: any) => {
      if (isDragging) {
        this.scrollY = pointer.y - dragStartY;
        this.constrainScroll();
      }
    });
    this.input.on("pointerup", () => {
      isDragging = false;
    });

    // 5. Loading Indicator Spinner
    this.loadingSpinner = this.add.arc(width / 2, listStartY + 50, 14, 0, 270, false, 0x38bdf8, 1);
    this.loadingSpinner.setStrokeStyle(3, 0x38bdf8);
    this.tweens.add({
      targets: this.loadingSpinner,
      angle: 360,
      duration: 900,
      repeat: -1,
      ease: "Linear",
    });

    this.loadingText = this.add
      .text(width / 2, listStartY + 80, "Sincronizando Ranking em Tempo Real...", {
        fontSize: "13px",
        fontFamily: "system-ui, sans-serif",
        color: "#94a3b8",
        fontStyle: "bold",
        resolution: 2,
      })
      .setOrigin(0.5);

    this.events.on("shutdown", () => {
      if (this.unsubscribe) this.unsubscribe();
    });

    this.loadLeaderboardLive();
  }

  constrainScroll() {
    if (this.scrollY > 0) this.scrollY = 0;
    if (this.scrollY < -this.maxScroll) this.scrollY = -this.maxScroll;
    const listStartY = this.tableTopY + 38;
    this.listContainer.y = listStartY + this.scrollY;

    // Update Scrollbar Thumb
    if (this.scrollBarThumb && this.maxScroll > 0) {
      this.scrollBarThumb.clear();
      const bounds = ResponsiveUtils.getSafeBounds();
      const tableW = Math.min(840, this.cameras.main.width - 40);
      const tableLeft = this.cameras.main.width / 2 - tableW / 2;
      const sbX = tableLeft + tableW + 2;

      const thumbHeight = Math.max(20, (this.maskHeight / (this.maskHeight + this.maxScroll)) * this.maskHeight);
      const scrollRatio = Math.abs(this.scrollY) / this.maxScroll;
      const thumbY = listStartY + scrollRatio * (this.maskHeight - thumbHeight);

      this.scrollBarThumb.fillStyle(0x38bdf8, 0.85);
      this.scrollBarThumb.fillRoundedRect(sbX, thumbY, 4, thumbHeight, 2);
    }
  }

  loadLeaderboardLive() {
    const usersRef = collection(db, "leaderboard_public");
    const topPlayersQuery = query(usersRef, orderBy("wins", "desc"), limit(30));

    this.unsubscribe = onSnapshot(
      topPlayersQuery,
      (snapshot) => {
        this.players = [];
        snapshot.forEach((doc) => {
          this.players.push(doc.data());
        });
        this.renderList();
      },
      (error) => {
        console.error("Erro no Leaderboard:", error);
        if (this.loadingSpinner && this.loadingSpinner.active) {
          this.loadingSpinner.destroy();
        }
        if (this.loadingText && this.loadingText.active) {
          this.loadingText.setText("Não foi possível conectar ao servidor de ranking.");
          this.loadingText.setColor("#ef4444");
        }
      }
    );
  }

  getEloTier(elo: number): { title: string; color: string; badgeColor: number } {
    if (elo >= 2000) return { title: "MESTRE SUPREMO", color: "#f43f5e", badgeColor: 0xe11d48 };
    if (elo >= 1600) return { title: "DIAMANTE", color: "#38bdf8", badgeColor: 0x0284c7 };
    if (elo >= 1300) return { title: "OURO", color: "#facc15", badgeColor: 0xca8a04 };
    if (elo >= 1100) return { title: "PRATA", color: "#cbd5e1", badgeColor: 0x64748b };
    return { title: "BRONZE", color: "#fdba74", badgeColor: 0xc2410c };
  }

  renderList() {
    if (this.loadingSpinner && this.loadingSpinner.active) {
      this.loadingSpinner.destroy();
    }
    if (this.loadingText && this.loadingText.active) {
      this.loadingText.destroy();
    }
    this.listContainer.removeAll(true);

    this.players.sort((a, b) => {
      const winsA = a.wins || 0;
      const winsB = b.wins || 0;
      if (winsB !== winsA) return winsB - winsA;
      const eloA = a.elo || 1000;
      const eloB = b.elo || 1000;
      if (eloB !== eloA) return eloB - eloA;
      const matchesA = a.matches || 0;
      const matchesB = b.matches || 0;
      return matchesA - matchesB;
    });

    const { width } = this.cameras.main;
    const tableW = Math.min(840, width - 40);
    const tableX = width / 2;
    const tableLeft = tableX - tableW / 2;

    const colRankX = tableLeft + 45;
    const colPlayerAvatarX = tableLeft + 112;
    const colPlayerNameX = tableLeft + 140;
    const colEloX = tableLeft + tableW * 0.52;
    const colWinRateX = tableLeft + tableW * 0.68;
    const colWinsX = tableLeft + tableW * 0.82;
    const colMatchesX = tableLeft + tableW * 0.93;

    if (this.players.length === 0) {
      const emptyContainer = this.add.container(tableX, 60);

      const emptyIcon = this.add.text(0, -10, "⚔️", {
        fontSize: "32px",
      }).setOrigin(0.5);

      const emptyTitle = this.add.text(0, 24, "Nenhum Guerreiro Registrado Ainda", {
        fontSize: "15px",
        fontStyle: "bold",
        color: "#facc15",
        fontFamily: "system-ui, sans-serif",
        resolution: 2,
      }).setOrigin(0.5);

      const emptyDesc = this.add.text(0, 46, "Vença uma partida no modo Batalha para entrar no Ranking Global!", {
        fontSize: "12px",
        color: "#94a3b8",
        fontFamily: "system-ui, sans-serif",
        resolution: 2,
      }).setOrigin(0.5);

      emptyContainer.add([emptyIcon, emptyTitle, emptyDesc]);
      this.listContainer.add(emptyContainer);
      this.maxScroll = 0;
      return;
    }

    let yPos = 4;
    const rowHeight = 46;

    this.players.forEach((data, index) => {
      const rank = index + 1;
      const username = data.username || "Guerreiro Anônimo";
      const wins = data.wins || 0;
      const elo = data.elo || 1000;
      const matches = data.matches || 0;
      const avatar = data.avatar || "🥷";

      const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
      const tier = this.getEloTier(elo);

      const isTop1 = rank === 1;
      const isTop2 = rank === 2;
      const isTop3 = rank === 3;

      let rankColor = "#94a3b8";
      let borderCol = 0x1e293b;
      let bgCol = rank % 2 === 0 ? 0x0b1120 : 0x0f172a;
      let rankPrefix = `#${rank}`;

      if (isTop1) {
        rankColor = "#facc15";
        borderCol = 0xeab308;
        bgCol = 0x1f1606;
        rankPrefix = `👑 #1`;
      } else if (isTop2) {
        rankColor = "#e2e8f0";
        borderCol = 0x94a3b8;
        bgCol = 0x172033;
        rankPrefix = `🥈 #2`;
      } else if (isTop3) {
        rankColor = "#fdba74";
        borderCol = 0xd97706;
        bgCol = 0x1c1510;
        rankPrefix = `🥉 #3`;
      }

      const rowContainer = this.add.container(0, yPos);

      // Card Background
      const rowCard = this.add.graphics();
      rowCard.fillStyle(bgCol, 0.92);
      rowCard.fillRoundedRect(tableLeft, 0, tableW, 40, 7);
      rowCard.lineStyle(1.5, borderCol, isTop1 ? 1 : 0.7);
      rowCard.strokeRoundedRect(tableLeft, 0, tableW, 40, 7);

      const centerY = 20;

      // 1. Rank Badge
      const txtRank = this.add
        .text(colRankX, centerY, rankPrefix, {
          fontSize: isTop1 ? "14px" : "13px",
          color: rankColor,
          fontStyle: "900",
          fontFamily:
            "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
          resolution: 2,
        })
        .setOrigin(0.5);

      // 2. Avatar Box with rounded frame
      const avatarFrame = this.add.graphics();
      avatarFrame.fillStyle(0x1e293b, 0.8);
      avatarFrame.fillRoundedRect(colPlayerAvatarX - 14, centerY - 14, 28, 28, 6);
      avatarFrame.lineStyle(1, isTop1 ? 0xfacc15 : 0x475569, 0.8);
      avatarFrame.strokeRoundedRect(colPlayerAvatarX - 14, centerY - 14, 28, 28, 6);

      const txtAvatar = this.add
        .text(colPlayerAvatarX, centerY, avatar, {
          fontSize: "16px",
          fontFamily: "system-ui",
          resolution: 2,
        })
        .setOrigin(0.5);

      // 3. Username + Subtitle Title
      const txtName = this.add
        .text(colPlayerNameX, centerY - 5, username, {
          fontSize: "13px",
          color: isTop1 ? "#fef08a" : "#f8fafc",
          fontStyle: "bold",
          fontFamily: "system-ui, sans-serif",
          resolution: 2,
        })
        .setOrigin(0, 0.5);

      const txtTitleBadge = this.add
        .text(colPlayerNameX, centerY + 9, isTop1 ? "REI DA ARENA" : tier.title, {
          fontSize: "8.5px",
          color: isTop1 ? "#fbbf24" : tier.color,
          fontStyle: "bold",
          letterSpacing: 1,
          fontFamily: "system-ui, sans-serif",
          resolution: 2,
        })
        .setOrigin(0, 0.5);

      // 4. Elo Badge Pill
      const eloBg = this.add.graphics();
      eloBg.fillStyle(0x18181b, 0.9);
      eloBg.fillRoundedRect(colEloX - 38, centerY - 11, 76, 22, 5);
      eloBg.lineStyle(1, tier.badgeColor, 0.8);
      eloBg.strokeRoundedRect(colEloX - 38, centerY - 11, 76, 22, 5);

      const txtElo = this.add
        .text(colEloX, centerY, `✦ ${elo}`, {
          fontSize: "11.5px",
          color: tier.color,
          fontStyle: "bold",
          fontFamily: "system-ui, sans-serif",
          resolution: 2,
        })
        .setOrigin(0.5);

      // 5. Win Rate % Badge
      const wrColor = winRate >= 60 ? "#22c55e" : winRate >= 45 ? "#eab308" : "#94a3b8";
      const txtWinRate = this.add
        .text(colWinRateX, centerY, `${winRate}%`, {
          fontSize: "13px",
          color: wrColor,
          fontStyle: "bold",
          fontFamily: "system-ui, sans-serif",
          resolution: 2,
        })
        .setOrigin(0.5);

      // 6. Wins (Green Victory Tag)
      const txtWins = this.add
        .text(colWinsX, centerY, `${wins} V`, {
          fontSize: "12px",
          color: "#4ade80",
          fontStyle: "bold",
          fontFamily: "system-ui, sans-serif",
          resolution: 2,
        })
        .setOrigin(0.5);

      // 7. Matches
      const txtMatches = this.add
        .text(colMatchesX, centerY, `${matches}`, {
          fontSize: "12px",
          color: "#60a5fa",
          fontStyle: "bold",
          fontFamily: "system-ui, sans-serif",
          resolution: 2,
        })
        .setOrigin(0.5);

      // Row Hover Interaction
      const hitZone = this.add
        .rectangle(tableX, centerY, tableW, 40, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      hitZone.on("pointerover", () => {
        rowCard.clear();
        rowCard.fillStyle(isTop1 ? 0x2e2008 : 0x1e293b, 0.98);
        rowCard.fillRoundedRect(tableLeft, 0, tableW, 40, 7);
        rowCard.lineStyle(1.5, isTop1 ? 0xfde047 : 0x38bdf8, 1);
        rowCard.strokeRoundedRect(tableLeft, 0, tableW, 40, 7);
      });

      hitZone.on("pointerout", () => {
        rowCard.clear();
        rowCard.fillStyle(bgCol, 0.92);
        rowCard.fillRoundedRect(tableLeft, 0, tableW, 40, 7);
        rowCard.lineStyle(1.5, borderCol, isTop1 ? 1 : 0.7);
        rowCard.strokeRoundedRect(tableLeft, 0, tableW, 40, 7);
      });

      rowContainer.add([
        rowCard,
        txtRank,
        avatarFrame,
        txtAvatar,
        txtName,
        txtTitleBadge,
        eloBg,
        txtElo,
        txtWinRate,
        txtWins,
        txtMatches,
        hitZone,
      ]);

      this.listContainer.add(rowContainer);
      yPos += rowHeight;
    });

    const totalHeight = this.players.length * rowHeight;
    this.maxScroll = Math.max(0, totalHeight - this.maskHeight + 15);
    this.constrainScroll();
  }
}
