import { transitionTo } from "../utils/sceneTransition";
import Phaser from "phaser";
import { GameState } from "../types";
import { ResponsiveUtils } from "../utils/ResponsiveUtils";

export default class CharacterSelectScene extends Phaser.Scene {
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
  declare make: Phaser.GameObjects.GameObjectCreator;

  private state!: GameState;
  private charContainer!: Phaser.GameObjects.Container;
  private selectionStep: number = 0; // 0 = P1, 1 = P2
  private headerText!: Phaser.GameObjects.Text;
  private fightBtn!: Phaser.GameObjects.Container;

  private tooltipContainer!: Phaser.GameObjects.Container;
  private arenaSelectorContainer!: Phaser.GameObjects.Container;
  private arenaText!: Phaser.GameObjects.Text;
  private bgImage!: Phaser.GameObjects.Image;
  private arenas = [
    { id: "random", name: "🎲 Aleatório", color: 0xf1c40f },
    { id: "arena", name: "🌍 Planeta Terra", color: 0x3498db },
    { id: "arena_namek", name: "🪐 Namekusei", color: 0x2ecc71 },
    { id: "arena_city", name: "🏙️ Cidade Destruída", color: 0xe67e22 },
    { id: "arena_tournament", name: "🏟️ Torneio Supremo", color: 0xf1c40f },
    { id: "arena_ice", name: "❄️ Geleira Eterna", color: 0x00d2d3 },
    { id: "arena_lava", name: "🌋 Vulcão Infernal", color: 0xe74c3c },
    { id: "arena_desert", name: "🏜️ Deserto Esquecido", color: 0xd35400 },
    { id: "arena_dark", name: "🌌 Reino das Trevas", color: 0x8e44ad }
  ];
  private selectedArenaIndex = 0;
  private tooltipName!: Phaser.GameObjects.Text;
  private tooltipStats!: Phaser.GameObjects.Text;

  constructor() {
    super("CharacterSelectScene");
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.state = this.registry.get("gameState") as GameState;

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

    // Force single player on mobile if local_pvp
    const isMobile =
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      this.sys.game.device.os.android ||
      this.sys.game.device.os.iOS;
    if (isMobile && this.state.gameMode === "local_pvp") {
      this.state.gameMode = "single";
    }

    // Default P2 character if not set
    if (
      this.state.gameMode === "local_pvp" &&
      this.state.p2CharacterId === undefined
    ) {
      const unlockedChars = this.state.characters.filter((c) => c.unlocked);
      const different = unlockedChars.find(
        (c) => c.id !== this.state.p1CharacterId,
      );
      this.state.p2CharacterId = different ? different.id : unlockedChars[0].id;
    }

    const { width, height } = this.cameras.main;
    this.selectionStep = 0;

    // Add postFX to main camera (REMOVED to prevent WebGL pipeline flicker on Sprites)

    // Keyboard handlers for confirm
    this.input.keyboard?.on("keydown-ENTER", () => this.handleConfirm());
    this.input.keyboard?.on("keydown-TAB", (e: KeyboardEvent) => {
      e.preventDefault();
      this.handleConfirm();
    });

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x060814, 0x0a0f24, 0x04060f, 0x020308, 1);
    bg.fillRect(0, 0, width, height);

    const initialArena = this.state?.selectedArena || "arena";
    const initialTex = initialArena === "random" ? "arena" : initialArena;
    this.bgImage = this.add
      .image(width / 2, height / 2, initialTex)
      .setDisplaySize(width * 1.06, height * 1.06)
      .setAlpha(0.65);

    // Subtle drift animation
    this.tweens.add({
      targets: this.bgImage,
      x: width / 2 + 8,
      y: height / 2 + 5,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 9000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Dark overlay on bottom & edges to keep character grid and UI sharp and clear
    const darkOverlay = this.add.graphics();
    darkOverlay.fillGradientStyle(0x060814, 0x0a0f24, 0x020308, 0x020308, 0.5);
    darkOverlay.fillRect(0, 0, width, height);

    // Animated thematic particles
    for (let i = 0; i < 25; i++) {
      const p = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.FloatBetween(1, 3),
        0x60a5fa,
        Phaser.Math.FloatBetween(0.2, 0.6),
      );
      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(40, 100),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 4000),
        repeat: -1,
        onRepeat: () => {
          p.y = height + 10;
          p.x = Phaser.Math.Between(0, width);
        },
      });
    }

    const bounds = ResponsiveUtils.getSafeBounds();

    // 1. Botão Voltar (Top Left, Highest Depth, Clean Hit Area)
    const backBtnContainer = this.add
      .container(bounds.left + 65, bounds.top + 26)
      .setDepth(500);

    const backBg = this.add.graphics();
    const btnW = 110;
    const btnH = 34;
    const radius = 6;

    const drawBackBtn = (isHover: boolean) => {
      backBg.clear();
      backBg.fillStyle(0x000000, 0.6);
      backBg.fillRoundedRect(-btnW / 2 + 2, -btnH / 2 + 3, btnW, btnH, radius);

      backBg.fillStyle(isHover ? 0x475569 : 0x1e293b, 0.95);
      backBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, radius);

      backBg.lineStyle(1.5, isHover ? 0x60a5fa : 0x94a3b8, 0.9);
      backBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, radius);
    };

    drawBackBtn(false);

    const backTxt = this.add
      .text(0, 0, "← VOLTAR", {
        fontSize: "14px",
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
      this.tweens.add({ targets: backBtnContainer, scale: 1.08, duration: 100 });
    });
    backHit.on("pointerout", () => {
      drawBackBtn(false);
      this.tweens.add({ targets: backBtnContainer, scale: 1, duration: 100 });
    });
    backHit.on("pointerdown", () => {
      if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
      transitionTo(this, "MenuScene");
    });

    // 2. Header Title (Centered, Safe From Back Button)
    this.headerText = this.add
      .text(width / 2, bounds.top + 26, "", {
        fontSize: "26px",
        color: "#ffd54a",
        fontStyle: "900",
        stroke: "#000",
        strokeThickness: 5,
        letterSpacing: 2,
        fontFamily:
          "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
        shadow: {
          offsetX: 0,
          offsetY: 3,
          color: "#000000",
          blur: 4,
          stroke: true,
          fill: true,
        },
        resolution: 2,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: this.headerText,
      y: bounds.top + 24,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // 3. Character Grid Container (Spaced Safely Below Header)
    this.charContainer = this.add.container(width / 2, bounds.top + 92);

    // Botão de Luta e Seletor de Arena
    this.createArenaSelector();
    this.createFightButton();
    this.createTooltip();

    this.updateUI();
  }

  private infoDesc!: Phaser.GameObjects.Text;

  createTooltip() {
    const { width } = this.cameras.main;
    const bounds = ResponsiveUtils.getSafeBounds();
    this.tooltipContainer = this.add
      .container(width / 2, bounds.bottom - 100)
      .setDepth(200)
      .setVisible(false);
    const bg = this.add
      .rectangle(0, 0, Math.min(520, width - 40), 75, 0x0a0f1d, 0.95)
      .setStrokeStyle(1.5, 0x3b82f6);
    this.tooltipName = this.add.text(-240, -25, "", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ffd54a",
      fontFamily: "system-ui, -apple-system, sans-serif",
      resolution: 2,
    });
    this.tooltipStats = this.add
      .text(240, -25, "", {
        fontSize: "13px",
        color: "#60a5fa",
        fontStyle: "bold",
        fontFamily: "system-ui, -apple-system, sans-serif",
        resolution: 2,
      })
      .setOrigin(1, 0);
    this.infoDesc = this.add.text(-240, 4, "", {
      fontSize: "13px",
      color: "#cbd5e1",
      fontFamily: "system-ui, -apple-system, sans-serif",
      wordWrap: { width: 480 },
      resolution: 2,
    });
    this.tooltipContainer.add([
      bg,
      this.tooltipName,
      this.tooltipStats,
      this.infoDesc,
    ]);
  }

  showTooltip(char: any, x: number, y: number) {
    this.tooltipContainer.setVisible(true);
    this.tooltipName.setText(char.name);

    const hp = char.maxHp || 200;
    const str = char.strength ?? Math.floor(hp / 2.5);
    const spd = char.speed ?? Math.floor(300 - hp);
    this.tooltipStats.setText(`HP: ${hp} | FOR: ${str} | VEL: ${spd}`);
    this.infoDesc.setText(char.description || "Um formidável guerreiro supremo.");
  }

  hideTooltip() {
    this.tooltipContainer.setVisible(false);
  }

  createArenaSelector() {
    const { width } = this.cameras.main;
    const bounds = ResponsiveUtils.getSafeBounds();
    this.arenaSelectorContainer = this.add.container(
      width / 2,
      bounds.bottom - 74,
    );

    // Initial state
    this.state.selectedArena = this.arenas[this.selectedArenaIndex].id;
    this.registry.set("gameState", this.state);

    const bg = this.add.graphics();
    const w = 240;
    const h = 32;
    bg.fillStyle(0x0a0f1d, 0.9);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
    bg.lineStyle(1.5, 0x475569, 0.8);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);

    const labelText = this.add
      .text(0, -22, "CENÁRIO DA BATALHA", {
        fontSize: "11px",
        color: "#94a3b8",
        fontStyle: "bold",
        letterSpacing: 1,
        fontFamily: "system-ui, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    this.arenaText = this.add
      .text(0, 0, this.arenas[this.selectedArenaIndex].name, {
        fontSize: "13px",
        color: "#ffffff",
        fontStyle: "bold",
        fontFamily: "system-ui, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    // Left Arrow
    const leftBtn = this.add
      .text(-w / 2 + 18, 0, "◀", {
        fontSize: "13px",
        color: "#f1c40f",
        fontStyle: "bold",
        fontFamily: "system-ui, sans-serif",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    leftBtn.on("pointerdown", () => {
      if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
      this.selectedArenaIndex--;
      if (this.selectedArenaIndex < 0)
        this.selectedArenaIndex = this.arenas.length - 1;
      this.updateArena();
    });

    leftBtn.on("pointerover", () => leftBtn.setColor("#fff"));
    leftBtn.on("pointerout", () => leftBtn.setColor("#f1c40f"));

    // Right Arrow
    const rightBtn = this.add
      .text(w / 2 - 18, 0, "▶", {
        fontSize: "13px",
        color: "#f1c40f",
        fontStyle: "bold",
        fontFamily: "system-ui, sans-serif",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    rightBtn.on("pointerdown", () => {
      if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
      this.selectedArenaIndex++;
      if (this.selectedArenaIndex >= this.arenas.length)
        this.selectedArenaIndex = 0;
      this.updateArena();
    });

    rightBtn.on("pointerover", () => rightBtn.setColor("#fff"));
    rightBtn.on("pointerout", () => rightBtn.setColor("#f1c40f"));

    this.arenaSelectorContainer.add([
      bg,
      labelText,
      this.arenaText,
      leftBtn,
      rightBtn,
    ]);

    if (
      this.state.gameMode === "story" ||
      this.state.gameMode === "tournament"
    ) {
      this.arenaSelectorContainer.setVisible(false);
    }
  }

  updateArena() {
    const chosen = this.arenas[this.selectedArenaIndex];
    this.arenaText.setText(chosen.name);
    this.state.selectedArena = chosen.id;
    this.registry.set("gameState", this.state);

    if (this.bgImage && chosen.id !== "random" && this.textures.exists(chosen.id)) {
      this.tweens.add({
        targets: this.bgImage,
        alpha: 0,
        duration: 180,
        onComplete: () => {
          this.bgImage.setTexture(chosen.id);
          this.tweens.add({
            targets: this.bgImage,
            alpha: 0.65,
            duration: 250,
          });
        },
      });
    }
  }

  createFightButton() {
    const { width } = this.cameras.main;
    const bounds = ResponsiveUtils.getSafeBounds();
    this.fightBtn = this.add
      .container(width / 2, bounds.bottom - 28)
      .setDepth(300)
      .setVisible(false);

    const btnW = 180;
    const btnH = 40;
    const radius = 8;

    const graphics = this.add.graphics();
    const drawFightBtn = (isHover: boolean) => {
      graphics.clear();
      graphics.fillStyle(0x000000, 0.6);
      graphics.fillRoundedRect(-btnW / 2 + 2, -btnH / 2 + 3, btnW, btnH, radius);

      graphics.fillStyle(isHover ? 0x2ecc71 : 0x27ae60, 1);
      graphics.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, radius);

      graphics.fillStyle(0xffffff, isHover ? 0.25 : 0.1);
      graphics.fillRoundedRect(
        -btnW / 2 + 2,
        -btnH / 2 + 2,
        btnW - 4,
        btnH / 2,
        radius - 2,
      );

      graphics.lineStyle(2, 0xffffff, isHover ? 1 : 0.8);
      graphics.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, radius);
    };

    drawFightBtn(false);

    const txt = this.add
      .text(0, 0, "LUTAR!", {
        fontSize: "18px",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 4,
        fontFamily:
          "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
        shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 2, fill: true },
        resolution: 2,
      })
      .setOrigin(0.5);

    this.fightBtn.add([graphics, txt]);

    this.tweens.add({
      targets: this.fightBtn,
      scale: 1.04,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const hitArea = this.add
      .rectangle(0, 0, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.fightBtn.add(hitArea);

    hitArea
      .on("pointerover", () => drawFightBtn(true))
      .on("pointerout", () => drawFightBtn(false))
      .on("pointerdown", () => this.handleConfirm());
  }

  handleConfirm() {
    if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");

    if (this.state.gameMode === "local_pvp") {
      if (this.selectionStep === 0) {
        this.selectionStep = 1;
        if (
          this.state.p2CharacterId === undefined ||
          this.state.p2CharacterId === this.state.p1CharacterId
        ) {
          const unlockedChars = this.state.characters.filter((c) => c.unlocked);
          const different = unlockedChars.find(
            (c) => c.id !== this.state.p1CharacterId,
          );
          this.state.p2CharacterId = different
            ? different.id
            : unlockedChars[0].id;
        }
        this.updateUI();
        return;
      } else {
        transitionTo(this, "BattleScene");
        return;
      }
    }

    if (
      this.state.gameMode === "online_pvp" ||
      this.state.gameMode === "ranked_pvp"
    ) {
      transitionTo(this, "MultiplayerLobbyScene");
      return;
    }

    this.showDifficultyDialog();
  }

  showDifficultyDialog() {
    const overlay = this.add
      .rectangle(0, 0, 800, 600, 0x000000, 0.8)
      .setOrigin(0, 0)
      .setDepth(100)
      .setInteractive();

    const dialog = this.add.container(400, 300).setDepth(101);

    const bg = this.add.graphics();
    bg.lineStyle(4, 0x3498db);
    bg.fillStyle(0x1a1a24, 1);
    bg.strokeRect(-200, -150, 400, 300);
    bg.fillRect(-200, -150, 400, 300);

    const title = this.add
      .text(0, -100, "SELECIONE A DIFICULDADE", {
        fontSize: "24px",
        fontFamily: '"Space Grotesk", sans-serif',
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    dialog.add([bg, title]);

    const difficulties = [
      { label: "FÁCIL", value: 0, color: 0x2ecc71 },
      { label: "NORMAL", value: 1, color: 0xf1c40f },
      { label: "DIFÍCIL", value: 2, color: 0xe74c3c },
    ];

    difficulties.forEach((diff, i) => {
      const btnY = -30 + i * 60;

      const btnBg = this.add
        .rectangle(0, btnY, 200, 40, diff.color)
        .setInteractive({ useHandCursor: true });
      const btnText = this.add
        .text(0, btnY, diff.label, {
          fontSize: "20px",
          fontFamily: '"JetBrains Mono", monospace',
          color: "#000000",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      btnBg
        .on("pointerover", () => btnBg.setAlpha(0.8))
        .on("pointerout", () => btnBg.setAlpha(1))
        .on("pointerdown", () => {
          if (this.cache.audio.exists("sfx_select"))
            this.sound.play("sfx_select");
          this.state.difficulty = diff.value;
          this.registry.set("gameState", this.state);
          dialog.destroy();
          overlay.destroy();
          this.proceedToBattle();
        });

      dialog.add([btnBg, btnText]);
    });

    const closeBtn = this.add
      .text(175, -135, "X", {
        fontSize: "24px",
        fontFamily: '"Space Grotesk", sans-serif',
        color: "#e74c3c",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    closeBtn.on("pointerdown", () => {
      if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
      dialog.destroy();
      overlay.destroy();
    });
    dialog.add(closeBtn);
  }

  proceedToBattle() {
    if (this.state.gameMode === "tournament") {
      this.state.tournamentPlayerCharId = this.state.p1CharacterId;

      const chars = this.state.characters;
      const participants = [this.state.p1CharacterId];
      const available = chars.filter((c) => c.id !== this.state.p1CharacterId);
      Phaser.Utils.Array.Shuffle(available);
      for (let i = 0; i < 7; i++) {
        participants.push(available[i].id);
      }
      Phaser.Utils.Array.Shuffle(participants);

      this.state.tournamentRounds = [
        {
          matches: [
            { p1: participants[0], p2: participants[1], winner: null },
            { p1: participants[2], p2: participants[3], winner: null },
            { p1: participants[4], p2: participants[5], winner: null },
            { p1: participants[6], p2: participants[7], winner: null },
          ],
        },
        {
          matches: [
            { p1: null, p2: null, winner: null },
            { p1: null, p2: null, winner: null },
          ],
        },
        { matches: [{ p1: null, p2: null, winner: null }] },
      ];
      this.state.tournamentCurrentRoundIndex = 0;
      this.registry.set("gameState", this.state);
      transitionTo(this, "TournamentScene");
    } else {
      transitionTo(this, "BattleScene");
    }
  }

  updateUI() {
    this.headerText.setText(this.getSelectionText());
    if (this.arenaSelectorContainer) {
      if (this.state.gameMode === "local_pvp") {
        this.arenaSelectorContainer.setVisible(this.selectionStep === 1);
      }
    }
    this.createCharacterSelector();

    const txt = this.fightBtn.list[1] as Phaser.GameObjects.Text;

    if (this.state.gameMode !== "local_pvp") {
      txt.setText("LUTAR!");
      this.fightBtn.setVisible(true);
    } else {
      if (this.selectionStep === 0) {
        txt.setText("CONFIRMAR P1");
        this.fightBtn.setVisible(true);
      } else if (this.selectionStep === 1) {
        txt.setText("CONFIRMAR P2");
        this.fightBtn.setVisible(true);
      }
    }
  }

  getSelectionText(): string {
    if (this.state.gameMode !== "local_pvp") return "ESCOLHA SEU HERÓI";
    return this.selectionStep === 0 ? "PLAYER 1: ESCOLHA" : "PLAYER 2: ESCOLHA";
  }

  createCharacterSelector() {
    this.charContainer.removeAll(true);
    const unlockedChars = this.state.characters.filter((c) => c.unlocked);

    const { width } = this.cameras.main;
    const isSmall = width < 680;
    const cardW = isSmall ? 64 : 76;
    const cardH = isSmall ? 74 : 84;
    const gapX = isSmall ? 6 : 8;
    const gapY = isSmall ? 8 : 10;

    let itemsPerRow = Math.floor((width - 60) / (cardW + gapX));
    if (itemsPerRow < 1) itemsPerRow = 1;
    if (itemsPerRow > 10) itemsPerRow = 10;

    const colsInRow = Math.min(unlockedChars.length, itemsPerRow);
    const totalWidth = colsInRow * cardW + Math.max(0, colsInRow - 1) * gapX;
    const startX = -(totalWidth / 2) + cardW / 2;

    unlockedChars.forEach((char, index) => {
      const col = index % itemsPerRow;
      const row = Math.floor(index / itemsPerRow);
      const x = startX + col * (cardW + gapX);
      const y = row * (cardH + gapY) + cardH / 2;

      const isP1 = this.state.p1CharacterId === char.id;
      const isP2 =
        this.state.p2CharacterId === char.id &&
        this.state.gameMode === "local_pvp" &&
        this.selectionStep === 1;
      const isSelected = isP1 || isP2;

      const card = this.add.container(x, y);

      let strokeColor = 0x475569;
      let bgColor = 0x111827;
      if (isP1) {
        strokeColor = 0x3b82f6;
        bgColor = 0x1e3a8a;
      } else if (isP2) {
        strokeColor = 0xef4444;
        bgColor = 0x7f1d1d;
      }

      // Card Graphics
      const cardGraphics = this.add.graphics();
      const radius = 6;

      const drawCardBg = (isHover: boolean) => {
        cardGraphics.clear();
        // Shadow
        cardGraphics.fillStyle(0x000000, 0.5);
        cardGraphics.fillRoundedRect(
          -cardW / 2 + 2,
          -cardH / 2 + 3,
          cardW,
          cardH,
          radius,
        );

        // Main fill
        cardGraphics.fillStyle(bgColor, isHover ? 1 : 0.85);
        cardGraphics.fillRoundedRect(
          -cardW / 2,
          -cardH / 2,
          cardW,
          cardH,
          radius,
        );

        // Border
        cardGraphics.lineStyle(
          isSelected ? 3 : isHover ? 2 : 1.5,
          isSelected ? (isP1 ? 0x60a5fa : 0xf87171) : isHover ? 0xffffff : strokeColor,
          1,
        );
        cardGraphics.strokeRoundedRect(
          -cardW / 2,
          -cardH / 2,
          cardW,
          cardH,
          radius,
        );
      };

      drawCardBg(false);

      // Character Sprite
      const spriteScale = isSmall ? 0.65 : 0.8;
      const sprite = this.add
        .sprite(0, -6, char.key, "0")
        .setOrigin(0.5, 0.75)
        .setScale(spriteScale);

      if (this.anims.exists(`${char.key}_idle`)) {
        sprite.play(`${char.key}_idle`, true);
      }

      // Name banner on card footer
      const nameBg = this.add.graphics();
      nameBg.fillStyle(0x000000, 0.8);
      nameBg.fillRoundedRect(-cardW / 2 + 2, cardH / 2 - 20, cardW - 4, 18, 4);

      const nameTxt = this.add
        .text(0, cardH / 2 - 11, char.name, {
          fontSize: isSmall ? "8.5px" : "10px",
          fontStyle: "bold",
          color: isSelected ? "#ffffff" : "#cbd5e1",
          fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
          resolution: 2,
        })
        .setOrigin(0.5);

      card.add([cardGraphics, sprite, nameBg, nameTxt]);

      // Badges for P1 / P2
      let p1BadgeX = 0;
      let p2BadgeX = 0;
      if (isP1 && isP2) {
        p1BadgeX = -18;
        p2BadgeX = 18;
      }

      if (isP1) {
        const p1Badge = this.add.graphics();
        p1Badge.fillStyle(0x2563eb, 1);
        p1Badge.fillRoundedRect(p1BadgeX - 16, -cardH / 2 - 8, 32, 16, 4);
        p1Badge.lineStyle(1.5, 0xffffff, 1);
        p1Badge.strokeRoundedRect(p1BadgeX - 16, -cardH / 2 - 8, 32, 16, 4);

        const p1Txt = this.add
          .text(p1BadgeX, -cardH / 2, "P1", {
            fontSize: "10px",
            color: "#ffffff",
            fontStyle: "bold",
            fontFamily: "system-ui, -apple-system, sans-serif",
            resolution: 2,
          })
          .setOrigin(0.5);
        card.add([p1Badge, p1Txt]);
      }

      if (isP2) {
        const p2Badge = this.add.graphics();
        p2Badge.fillStyle(0xdc2626, 1);
        p2Badge.fillRoundedRect(p2BadgeX - 16, -cardH / 2 - 8, 32, 16, 4);
        p2Badge.lineStyle(1.5, 0xffffff, 1);
        p2Badge.strokeRoundedRect(p2BadgeX - 16, -cardH / 2 - 8, 32, 16, 4);

        const p2Txt = this.add
          .text(p2BadgeX, -cardH / 2, "P2", {
            fontSize: "10px",
            color: "#ffffff",
            fontStyle: "bold",
            fontFamily: "system-ui, -apple-system, sans-serif",
            resolution: 2,
          })
          .setOrigin(0.5);
        card.add([p2Badge, p2Txt]);
      }

      // Hit Area
      const hitArea = this.add
        .rectangle(0, 0, cardW, cardH, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      card.add(hitArea);

      hitArea
        .on("pointerdown", () => this.selectCharacter(char.id))
        .on("pointerover", (pointer: Phaser.Input.Pointer) => {
          if (!isSelected) {
            drawCardBg(true);
            this.tweens.add({
              targets: card,
              scale: 1.08,
              duration: 80,
              ease: "Sine.easeInOut",
            });
            nameTxt.setColor("#ffffff");
          }
          this.showTooltip(char, pointer.x, pointer.y);
        })
        .on("pointermove", (pointer: Phaser.Input.Pointer) => {
          this.showTooltip(char, pointer.x, pointer.y);
        })
        .on("pointerout", () => {
          if (!isSelected) {
            drawCardBg(false);
            this.tweens.add({
              targets: card,
              scale: 1.0,
              duration: 80,
              ease: "Sine.easeInOut",
            });
            nameTxt.setColor("#cbd5e1");
          }
          this.hideTooltip();
        });

      if (isSelected) {
        this.tweens.add({
          targets: card,
          scale: 1.04,
          duration: 700,
          yoyo: true,
          repeat: -1,
        });
      }

      this.charContainer.add(card);
    });
  }

  selectCharacter(id: number) {
    if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
    if (this.state.gameMode !== "local_pvp") {
      this.state.p1CharacterId = id;
    } else {
      if (this.selectionStep === 0) {
        this.state.p1CharacterId = id;
      } else {
        this.state.p2CharacterId = id;
      }
    }
    this.updateUI();
  }
}
