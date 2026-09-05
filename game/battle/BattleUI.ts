import { Responsive } from "../utils/Responsive";
import { StoryStatsMath } from "../systems/StoryStatsMath";
export class BattleUI {
  scene: any;
  uiContainer!: Phaser.GameObjects.Container;
  p1HpBar!: Phaser.GameObjects.Rectangle;
  p1DmgBar!: Phaser.GameObjects.Rectangle;
  p2DmgBar!: Phaser.GameObjects.Rectangle;
  p1HpText!: Phaser.GameObjects.Text;
  p2HpText!: Phaser.GameObjects.Text;
  p1KiBar!: Phaser.GameObjects.Rectangle;
  p2HpBar!: Phaser.GameObjects.Rectangle;
  p2KiBar!: Phaser.GameObjects.Rectangle;
  logText!: Phaser.GameObjects.Text;
  p1KiPulseTween?: Phaser.Tweens.Tween;
  p2KiPulseTween?: Phaser.Tweens.Tween;
  p1KiPulseDuration: number = 0;
  p2KiPulseDuration: number = 0;
  p1KiReadyGlow!: Phaser.GameObjects.Rectangle;
  p2KiReadyGlow!: Phaser.GameObjects.Rectangle;
  p1NameText!: Phaser.GameObjects.Text;
  p2NameText!: Phaser.GameObjects.Text;

  p1ComboText!: Phaser.GameObjects.Text;
  p2ComboText!: Phaser.GameObjects.Text;
  p1ComboDmgText!: Phaser.GameObjects.Text;
  p2ComboDmgText!: Phaser.GameObjects.Text;
  p1ComboContainer!: Phaser.GameObjects.Container;
  p2ComboContainer!: Phaser.GameObjects.Container;
  p1ComboBg!: Phaser.GameObjects.Graphics;
  p2ComboBg!: Phaser.GameObjects.Graphics;
  p1ComboBar!: Phaser.GameObjects.Rectangle;
  p2ComboBar!: Phaser.GameObjects.Rectangle;
  p1ComboHideTimer?: Phaser.Time.TimerEvent;
  p1HudContainer!: Phaser.GameObjects.Container;
  p2HudContainer!: Phaser.GameObjects.Container;
  p2ComboHideTimer?: Phaser.Time.TimerEvent;
  pingText?: Phaser.GameObjects.Text;
  pauseOverlay?: Phaser.GameObjects.Container;

  p1KiGlow!: Phaser.GameObjects.Rectangle;
  p2KiGlow!: Phaser.GameObjects.Rectangle;
  p1GuardBar!: Phaser.GameObjects.Rectangle;
  p2GuardBar!: Phaser.GameObjects.Rectangle;
  p1GuardText?: Phaser.GameObjects.Text;
  p2GuardText?: Phaser.GameObjects.Text;
  lastP1HpP: number = 1;
  lastP2HpP: number = 1;
  lastP1KiP: number = 0;
  lastP2KiP: number = 0;
  lastP1GuardP: number = 0;
  lastP2GuardP: number = 0;

  constructor(scene: any) {
    this.scene = scene;
  }

  createUI(
    playerData: any,
    enemyData: any,
    gameMode: string,
    arcadeRound: number,
  ) {
    const bs = this.scene as any;
    this.uiContainer = bs.add.container(0, 0).setScrollFactor(0).setDepth(10);

    const visible = Responsive.getVisibleBounds(this.scene);
    
    const clampToSafeArea = (x: number, y: number): { x: number; y: number } => {
      const margin = 20; // margem mínima visível, mesmo se o HUD estiver "no limite"
      const clampedX = Math.max(visible.left - 40, Math.min(x, visible.right - margin));
      const clampedY = Math.max(visible.top - 10, Math.min(y, visible.bottom - margin));
      return { x: clampedX, y: clampedY };
    };

    // HUD Draggable Containers
    let p1HudX = visible.left, p1HudY = visible.top;
    const savedP1 = localStorage.getItem(`hudPos_P1`);
    if (savedP1) {
      try {
        const parsed = JSON.parse(savedP1);
        const clamped = clampToSafeArea(parsed.x, parsed.y);
        p1HudX = clamped.x;
        p1HudY = clamped.y;
      } catch (e) {}
    }
    this.p1HudContainer = bs.add.container(p1HudX, p1HudY).setScrollFactor(0).setDepth(11);
    this.uiContainer.add(this.p1HudContainer);

    let p2HudX = -(960 - visible.right), p2HudY = visible.top;
    const savedP2 = localStorage.getItem(`hudPos_P2`);
    if (savedP2) {
      try {
        const parsed = JSON.parse(savedP2);
        const clamped = clampToSafeArea(parsed.x, parsed.y);
        p2HudX = clamped.x;
        p2HudY = clamped.y;
      } catch (e) {}
    }
    this.p2HudContainer = bs.add.container(p2HudX, p2HudY).setScrollFactor(0).setDepth(11);
    this.uiContainer.add(this.p2HudContainer);

    // Draggable setup for P1 (only interactive when editing HUD)
    const rectContains = (r: Phaser.Geom.Rectangle, x: number, y: number) => {
      return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
    };

    this.p1HudContainer.setInteractive(new Phaser.Geom.Rectangle(25, 10, 250, 100), rectContains);
    bs.input.setDraggable(this.p1HudContainer);
    this.p1HudContainer.disableInteractive(); // Disabled by default during combat to avoid touch conflicts

    this.p1HudContainer.on('drag', (pointer: any, dragX: number, dragY: number) => {
      if (!bs.battleInput?.isEditingHUD) return;
      this.p1HudContainer.x = dragX;
      this.p1HudContainer.y = dragY;
    });
    this.p1HudContainer.on('dragend', () => {
      if (!bs.battleInput?.isEditingHUD) return;
      localStorage.setItem(`hudPos_P1`, JSON.stringify({ x: this.p1HudContainer.x, y: this.p1HudContainer.y }));
    });

    // Draggable setup for P2 (only interactive when editing HUD)
    this.p2HudContainer.setInteractive(new Phaser.Geom.Rectangle(685, 10, 250, 100), rectContains);
    bs.input.setDraggable(this.p2HudContainer);
    this.p2HudContainer.disableInteractive(); // Disabled by default during combat to avoid touch conflicts

    this.p2HudContainer.on('drag', (pointer: any, dragX: number, dragY: number) => {
      if (!bs.battleInput?.isEditingHUD) return;
      this.p2HudContainer.x = dragX;
      this.p2HudContainer.y = dragY;
    });
    this.p2HudContainer.on('dragend', () => {
      if (!bs.battleInput?.isEditingHUD) return;
      localStorage.setItem(`hudPos_P2`, JSON.stringify({ x: this.p2HudContainer.x, y: this.p2HudContainer.y }));
    });

    // Player 1 HP/Ki Backgrounds
    const p1HpBg = bs.add
      .rectangle(150, 50, 250, 22, 0x111111)
      .setStrokeStyle(3, 0xffffff, 0.8);
    const p1KiBg = bs.add
      .rectangle(150, 80, 250, 12, 0x111111)
      .setStrokeStyle(2, 0xaaaaaa, 0.6);
    this.p1HudContainer.add([p1HpBg, p1KiBg]);

    // Player 2 HP/Ki Backgrounds
    const p2HpBg = bs.add
      .rectangle(810, 50, 250, 22, 0x111111)
      .setStrokeStyle(3, 0xffffff, 0.8);
    const p2KiBg = bs.add
      .rectangle(810, 80, 250, 12, 0x111111)
      .setStrokeStyle(2, 0xaaaaaa, 0.6);
    this.p2HudContainer.add([p2HpBg, p2KiBg]);

    this.p1DmgBar = bs.add
      .rectangle(25, 50, 250, 22, 0xffaa00)
      .setOrigin(0, 0.5);
    this.p1HudContainer.add(this.p1DmgBar);

    this.p1HpBar = bs.add
      .rectangle(25, 50, 250, 22, 0x2ecc71)
      .setOrigin(0, 0.5);
    this.p1HudContainer.add(this.p1HpBar);

    this.p1HpText = bs.add
      .text(150, 50, "100%", { fontSize: "14px", fontStyle: "bold", fontFamily: "system-ui", color: "#ffffff", stroke: "#000000", strokeThickness: 3 })
      .setOrigin(0.5, 0.5);
    this.p1HudContainer.add(this.p1HpText);

    this.p1KiBar = bs.add
      .rectangle(25, 80, 250, 12, 0x3498db)
      .setOrigin(0, 0.5);
    this.p1HudContainer.add(this.p1KiBar);
    this.p1KiBar.scaleX = 0; // Starts with 0 Ki

    this.p1KiGlow = bs.add
      .rectangle(25, 80, 250, 12, 0xffffff)
      .setOrigin(0, 0.5)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.p1HudContainer.add(this.p1KiGlow);
    
    this.p1KiReadyGlow = bs.add
      .rectangle(25, 80, 250, 12, 0x00ffff)
      .setOrigin(0, 0.5)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.p1HudContainer.add(this.p1KiReadyGlow);
    this.p1KiReadyGlow.scaleX = 0;

    // Player 1 Guard / Posture Bar
    const p1GuardBg = bs.add
      .rectangle(150, 95, 250, 5, 0x111111)
      .setStrokeStyle(1, 0x555555, 0.7);
    this.p1GuardBar = bs.add
      .rectangle(25, 95, 250, 5, 0x3498db)
      .setOrigin(0, 0.5);
    this.p1GuardBar.scaleX = 0;
    this.p1GuardText = bs.add
      .text(25, 103, "🛡️ POSTURA", {
        fontSize: "10px",
        fontStyle: "bold",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        color: "#94a3b8",
        stroke: "#000",
        strokeThickness: 2,
      });
    this.p1HudContainer.add([p1GuardBg, this.p1GuardBar, this.p1GuardText]);

    this.p2DmgBar = bs.add
      .rectangle(685, 50, 250, 22, 0xffaa00)
      .setOrigin(0, 0.5);
    this.p2HudContainer.add(this.p2DmgBar);

    this.p2HpBar = bs.add
      .rectangle(685, 50, 250, 22, 0xe74c3c)
      .setOrigin(0, 0.5);
    this.p2HudContainer.add(this.p2HpBar);

    this.p2HpText = bs.add
      .text(810, 50, "100%", { fontSize: "14px", fontStyle: "bold", fontFamily: "system-ui", color: "#ffffff", stroke: "#000000", strokeThickness: 3 })
      .setOrigin(0.5, 0.5);
    this.p2HudContainer.add(this.p2HpText);

    this.p2KiBar = bs.add
      .rectangle(685, 80, 250, 12, 0xf1c40f)
      .setOrigin(0, 0.5);
    this.p2HudContainer.add(this.p2KiBar);
    this.p2KiBar.scaleX = 0; // Starts with 0 Ki

    this.p2KiGlow = bs.add
      .rectangle(685, 80, 250, 12, 0xffffff)
      .setOrigin(0, 0.5)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.p2HudContainer.add(this.p2KiGlow);
    
    this.p2KiReadyGlow = bs.add
      .rectangle(685, 80, 250, 12, 0x00ffff)
      .setOrigin(0, 0.5)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.p2HudContainer.add(this.p2KiReadyGlow);
    this.p2KiReadyGlow.scaleX = 0;

    // Player 2 Guard / Posture Bar
    const p2GuardBg = bs.add
      .rectangle(810, 95, 250, 5, 0x111111)
      .setStrokeStyle(1, 0x555555, 0.7);
    this.p2GuardBar = bs.add
      .rectangle(685, 95, 250, 5, 0x3498db)
      .setOrigin(0, 0.5);
    this.p2GuardBar.scaleX = 0;
    this.p2GuardText = bs.add
      .text(935, 103, "POSTURA 🛡️", {
        fontSize: "10px",
        fontStyle: "bold",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        color: "#94a3b8",
        stroke: "#000",
        strokeThickness: 2,
      })
      .setOrigin(1, 0);
    this.p2HudContainer.add([p2GuardBg, this.p2GuardBar, this.p2GuardText]);

    // Reset tracking state for new rounds
    this.lastP1HpP = 1;
    this.lastP2HpP = 1;
    this.lastP1KiP = 0;
    this.lastP2KiP = 0;
    this.lastP1GuardP = 0;
    this.lastP2GuardP = 0;

    // Format names with levels for story mode
    let p1DisplayName = playerData.name;
    let p2DisplayName = enemyData.name;

    if (gameMode === "story") {
      const storyState = bs.gameState?.storyState;
      const playerLvl = storyState?.level || 1;
      p1DisplayName = `LVL ${playerLvl} • ${playerData.name}`;

      const enemyLevel = bs.gameState?.storyEnemyState?.enemyLevel
        ?? StoryStatsMath.getEnemyLevel(storyState?.stage || 1, playerLvl);
      const isBoss = bs.gameState?.storyEnemyState?.isBoss
        ?? ((storyState?.stage || 1) % 5 === 0);
      
      p2DisplayName = isBoss
        ? `👑 LVL ${enemyLevel} • ${enemyData.name}`
        : `LVL ${enemyLevel} • ${enemyData.name}`;
    }

    // Player 1 Name
    this.p1NameText = bs.add.text(25, 15, p1DisplayName, {
      fontSize: gameMode === "story" ? "17px" : "20px",
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontStyle: "bold",
      color: "#fff",
      stroke: "#000",
      strokeThickness: 3,
      shadow: { color: "#3498db", blur: 4, fill: true },
      resolution: 3,
    });
    this.p1HudContainer.add(this.p1NameText);

    // Player 2 Name
    this.p2NameText = bs.add
      .text(935, 15, p2DisplayName, {
        fontSize: gameMode === "story" ? "17px" : "20px",
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontStyle: "bold",
        color: gameMode === "story" && bs.gameState?.storyEnemyState?.isBoss ? "#fbbf24" : "#fff",
        stroke: "#000",
        strokeThickness: 3,
        shadow: { color: "#e74c3c", blur: 4, fill: true },
        resolution: 3,
      })
      .setOrigin(1, 0);
    this.p2HudContainer.add(this.p2NameText);

    // Player 1 Combo Sub-Container
    this.p1ComboContainer = bs.add.container(25, 120).setAlpha(0);
    this.p1HudContainer.add(this.p1ComboContainer);

    this.p1ComboBg = bs.add.graphics();
    this.p1ComboBg.fillStyle(0x000000, 0.65);
    this.p1ComboBg.fillRoundedRect(0, -35, 240, 76, 8);
    this.p1ComboBg.lineStyle(2, 0xffaa00, 0.9);
    this.p1ComboBg.strokeRoundedRect(0, -35, 240, 76, 8);
    this.p1ComboBg.fillStyle(0xff3300, 1.0);
    this.p1ComboBg.fillRect(0, -35, 8, 76);
    this.p1ComboContainer.add(this.p1ComboBg);

    this.p1ComboText = bs.add
      .text(20, -4, "", {
        fontSize: "34px",
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontStyle: "bold italic",
        color: "#ffcc00",
        stroke: "#000000",
        strokeThickness: 4,
        shadow: { color: "#ff0000", blur: 6, fill: true },
        resolution: 3,
      })
      .setOrigin(0, 0.5);
    this.p1ComboContainer.add(this.p1ComboText);

    this.p1ComboDmgText = bs.add
      .text(20, 26, "", {
        fontSize: "22px",
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        fontStyle: "italic bold",
        color: "#ff5500",
        stroke: "#000000",
        strokeThickness: 3,
        resolution: 3,
      })
      .setOrigin(0, 0.5);
    this.p1ComboContainer.add(this.p1ComboDmgText);

    this.p1ComboBar = bs.add
      .rectangle(20, 14, 200, 4, 0xffaa00)
      .setOrigin(0, 0.5);
    this.p1ComboContainer.add(this.p1ComboBar);

    // Player 2 Combo Sub-Container
    this.p2ComboContainer = bs.add.container(935, 120).setAlpha(0);
    this.p2HudContainer.add(this.p2ComboContainer);

    this.p2ComboBg = bs.add.graphics();
    this.p2ComboBg.fillStyle(0x000000, 0.65);
    this.p2ComboBg.fillRoundedRect(-240, -35, 240, 76, 8);
    this.p2ComboBg.lineStyle(2, 0xffaa00, 0.9);
    this.p2ComboBg.strokeRoundedRect(-240, -35, 240, 76, 8);
    this.p2ComboBg.fillStyle(0xff3300, 1.0);
    this.p2ComboBg.fillRect(-8, -35, 8, 76);
    this.p2ComboContainer.add(this.p2ComboBg);

    this.p2ComboText = bs.add
      .text(-20, -4, "", {
        fontSize: "34px",
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontStyle: "bold italic",
        color: "#ffcc00",
        stroke: "#000000",
        strokeThickness: 4,
        shadow: { color: "#ff0000", blur: 6, fill: true },
        resolution: 3,
      })
      .setOrigin(1, 0.5);
    this.p2ComboContainer.add(this.p2ComboText);

    this.p2ComboDmgText = bs.add
      .text(-20, 26, "", {
        fontSize: "22px",
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        fontStyle: "italic bold",
        color: "#ff5500",
        stroke: "#000000",
        strokeThickness: 3,
        resolution: 3,
      })
      .setOrigin(1, 0.5);
    this.p2ComboContainer.add(this.p2ComboDmgText);

    this.p2ComboBar = bs.add
      .rectangle(-20, 14, 200, 4, 0xffaa00)
      .setOrigin(1, 0.5);
    this.p2ComboContainer.add(this.p2ComboBar);

    this.logText = bs.add
      .text(480, 120, "", {
        fontSize: "24px",
        color: "#fff",
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 4,
        shadow: { color: "#000", blur: 4, offsetX: 1, offsetY: 1, fill: true },
        resolution: 3,
      })
      .setOrigin(0.5);
    this.uiContainer.add(this.logText);

    
    if (gameMode === "online_pvp") {
      this.pingText = bs.add.text(480, 50, "Ping: -- ms", {
        fontSize: "14px",
        color: "#ffffff",
        fontFamily: "monospace",
        stroke: "#000",
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(15).setScrollFactor(0);
      this.uiContainer.add(this.pingText);
      
      const overlayBg = bs.add.rectangle(480, 270, 960, 540, 0x000000, 0.7);
      const pauseText = bs.add.text(480, 270, "Aguardando oponente reconectar...", {
        fontSize: "24px",
        color: "#f1c40f",
        fontFamily: "Impact, sans-serif"
      }).setOrigin(0.5);
      
      this.pauseOverlay = bs.add.container(0, 0, [overlayBg, pauseText]).setScrollFactor(0).setDepth(100).setVisible(false);
      this.uiContainer.add(this.pauseOverlay);
    }

    if (gameMode === "arcade") {

      bs.add
        .text(480, 25, `ARCADE: ROUND ${arcadeRound || 1} / 5`, {
          fontSize: "22px",
          color: "#f1c40f",
          fontFamily:
            "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
          stroke: "#000",
          strokeThickness: 4,
          shadow: { color: "#000", blur: 4, fill: true },
          resolution: 2,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(10);
    }
  }

  
  updatePing(ping: number) {
    if (this.pingText) {
      this.pingText.setText(`Ping: ${ping} ms`);
      this.pingText.setColor(ping < 80 ? '#2ecc71' : ping < 150 ? '#f1c40f' : '#e74c3c');
    }
  }
  
  setPaused(paused: boolean) {
    if (this.pauseOverlay) {
      this.pauseOverlay.setVisible(paused);
    }
  }

  updateBars(p1HpP: number, p2HpP: number, p1KiP: number, p2KiP: number, p1GuardP: number = 0, p2GuardP: number = 0) {

    if (this.p1HpBar && this.p1HpBar.active) {
      if (this.p1HpText) {
        this.p1HpText.setText(`${Math.round(Math.max(0, p1HpP) * 100)}%`);
      }
      if (this.p2HpText) {
        this.p2HpText.setText(`${Math.round(Math.max(0, p2HpP) * 100)}%`);
      }

      // Liquid HP Bars (only update when actual target value changes)
      if (p1HpP !== this.lastP1HpP) {
        this.scene.tweens.add({
          targets: this.p1HpBar,
          scaleX: Math.max(0, p1HpP),
          duration: 300,
          ease: "Cubic.easeOut",
          overwrite: true,
        });
        
        // Damage overlay logic for P1
        if (p1HpP < this.lastP1HpP) {
            this.scene.tweens.add({
                targets: this.p1DmgBar,
                scaleX: Math.max(0, p1HpP),
                duration: 1000,
                delay: 400,
                ease: "Cubic.easeOut",
                overwrite: true,
            });
        } else {
            this.p1DmgBar.scaleX = Math.max(0, p1HpP);
        }

        this.lastP1HpP = p1HpP;
      }

      if (p2HpP !== this.lastP2HpP) {
        this.scene.tweens.add({
          targets: this.p2HpBar,
          scaleX: Math.max(0, p2HpP),
          duration: 300,
          ease: "Cubic.easeOut",
          overwrite: true,
        });
        
        // Damage overlay logic for P2
        if (p2HpP < this.lastP2HpP) {
            this.scene.tweens.add({
                targets: this.p2DmgBar,
                scaleX: Math.max(0, p2HpP),
                duration: 1000,
                delay: 400,
                ease: "Cubic.easeOut",
                overwrite: true,
            });
        } else {
            this.p2DmgBar.scaleX = Math.max(0, p2HpP);
        }

        this.lastP2HpP = p2HpP;
      }

      // Smooth Ki Bar Fill & Pulse Effects on Gain
      if (p1KiP !== this.lastP1KiP) {
        const isGain = p1KiP > this.lastP1KiP;

        // Smoothly animate the horizontal fill of the bar and glow overlay
        this.scene.tweens.add({
          targets: [this.p1KiBar, this.p1KiGlow, this.p1KiReadyGlow],
          scaleX: Math.max(0, p1KiP),
          duration: 250,
          ease: "Quad.easeOut",
          overwrite: true,
        });

        // Trigger visual pulse/glow effect when gaining Ki points
        if (isGain) {
          // A) SWELL EFFECT: briefly swell the height (scaleY) and snap back with a bouncy ease
          this.scene.tweens.add({
            targets: [this.p1KiBar, this.p1KiGlow, this.p1KiReadyGlow],
            scaleY: { from: 2.2, to: 1.0 },
            duration: 300,
            ease: "Back.easeOut",
            overwrite: true,
          });

          // B) ENERGY FLASH EFFECT: flash the overlay bright white and fade out smoothly
          this.p1KiGlow.setAlpha(0.95);
          this.scene.tweens.add({
            targets: this.p1KiGlow,
            alpha: 0,
            duration: 400,
            ease: "Quad.easeOut",
            overwrite: true,
          });
        }

        this.lastP1KiP = p1KiP;
      }

      if (p2KiP !== this.lastP2KiP) {
        const isGain = p2KiP > this.lastP2KiP;

        // Smoothly animate the horizontal fill of the bar and glow overlay
        this.scene.tweens.add({
          targets: [this.p2KiBar, this.p2KiGlow, this.p2KiReadyGlow],
          scaleX: Math.max(0, p2KiP),
          duration: 250,
          ease: "Quad.easeOut",
          overwrite: true,
        });

        // Trigger visual pulse/glow effect when gaining Ki points
        if (isGain) {
          // A) SWELL EFFECT: briefly swell the height (scaleY) and snap back with a bouncy ease
          this.scene.tweens.add({
            targets: [this.p2KiBar, this.p2KiGlow, this.p2KiReadyGlow],
            scaleY: { from: 2.2, to: 1.0 },
            duration: 300,
            ease: "Back.easeOut",
            overwrite: true,
          });

          // B) ENERGY FLASH EFFECT: flash the overlay bright white and fade out smoothly
          this.p2KiGlow.setAlpha(0.95);
          this.scene.tweens.add({
            targets: this.p2KiGlow,
            alpha: 0,
            duration: 400,
            ease: "Quad.easeOut",
            overwrite: true,
          });
        }

        this.lastP2KiP = p2KiP;
      }

      // Dynamic Pulse Player 1 Ki Bar for Special (>= 0.5) and Super (>= 1.0)

      if (p1KiP >= 0.5) {
        let isSuper = p1KiP >= 1;
        let pulseDuration = isSuper ? 150 : 400;
        let pulseAlpha = isSuper ? 0.8 : 0.4;
        let glowColor = isSuper ? 0xffaa00 : 0x00ffff; // Yellow/Orange for super, Cyan for special
        
        this.p1KiReadyGlow.fillColor = glowColor;
        
        // If the tween exists but the duration needs to change
        if (this.p1KiPulseTween && this.p1KiPulseDuration !== pulseDuration) {
          try {
            if (this.p1KiPulseTween.stop) this.p1KiPulseTween.stop();
          } catch (e) {}
          this.p1KiPulseTween = undefined;
        }

        if (!this.p1KiPulseTween) {
          this.p1KiPulseDuration = pulseDuration;
          this.p1KiPulseTween = this.scene.tweens.add({
            targets: this.p1KiReadyGlow,
            alpha: { from: 0, to: pulseAlpha },
            duration: pulseDuration,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
        }
      } else {
        if (this.p1KiPulseTween) {
          try {
            if (this.p1KiPulseTween.stop) this.p1KiPulseTween.stop();
          } catch (e) {}
          this.p1KiPulseTween = undefined;
          this.p1KiPulseDuration = 0;
          this.p1KiReadyGlow.setAlpha(0);
        }
      }

      // Dynamic Pulse Player 2 Ki Bar for Special (>= 0.5) and Super (>= 1.0)

      if (p2KiP >= 0.5) {
        let isSuper = p2KiP >= 1;
        let pulseDuration = isSuper ? 150 : 400;
        let pulseAlpha = isSuper ? 0.8 : 0.4;
        let glowColor = isSuper ? 0xffaa00 : 0x00ffff; // Yellow/Orange for super, Cyan for special
        
        this.p2KiReadyGlow.fillColor = glowColor;

        if (this.p2KiPulseTween && this.p2KiPulseDuration !== pulseDuration) {
          try {
            if (this.p2KiPulseTween.stop) this.p2KiPulseTween.stop();
          } catch (e) {}
          this.p2KiPulseTween = undefined;
        }

        if (!this.p2KiPulseTween) {
          this.p2KiPulseDuration = pulseDuration;
          this.p2KiPulseTween = this.scene.tweens.add({
            targets: this.p2KiReadyGlow,
            alpha: { from: 0, to: pulseAlpha },
            duration: pulseDuration,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
        }
      } else {
        if (this.p2KiPulseTween) {
          try {
            if (this.p2KiPulseTween.stop) this.p2KiPulseTween.stop();
          } catch (e) {}
          this.p2KiPulseTween = undefined;
          this.p2KiPulseDuration = 0;
          this.p2KiReadyGlow.setAlpha(0);
        }
      }

      // Guard / Posture Bars Update
      if (this.p1GuardBar && this.p1GuardBar.active) {
        const clampedP1Guard = Phaser.Math.Clamp(p1GuardP, 0, 1);
        this.p1GuardBar.scaleX = clampedP1Guard;

        if (clampedP1Guard >= 0.85) {
          this.p1GuardBar.fillColor = 0xff2200; // Danger Red
          if (this.p1GuardText) {
            this.p1GuardText.setText(clampedP1Guard >= 1 ? "💥 QUEBRADA!" : "⚠️ POSTURA CRÍTICA!");
            this.p1GuardText.setColor("#ff3333");
          }
        } else if (clampedP1Guard >= 0.5) {
          this.p1GuardBar.fillColor = 0xf39c12; // Warning Amber
          if (this.p1GuardText) {
            this.p1GuardText.setText("🛡️ INSTÁVEL");
            this.p1GuardText.setColor("#f59e0b");
          }
        } else {
          this.p1GuardBar.fillColor = 0x3498db; // Normal Stance
          if (this.p1GuardText) {
            this.p1GuardText.setText("🛡️ POSTURA");
            this.p1GuardText.setColor("#94a3b8");
          }
        }
      }

      if (this.p2GuardBar && this.p2GuardBar.active) {
        const clampedP2Guard = Phaser.Math.Clamp(p2GuardP, 0, 1);
        this.p2GuardBar.scaleX = clampedP2Guard;

        if (clampedP2Guard >= 0.85) {
          this.p2GuardBar.fillColor = 0xff2200;
          if (this.p2GuardText) {
            this.p2GuardText.setText(clampedP2Guard >= 1 ? "QUEBRADA! 💥" : "POSTURA CRÍTICA! ⚠️");
            this.p2GuardText.setColor("#ff3333");
          }
        } else if (clampedP2Guard >= 0.5) {
          this.p2GuardBar.fillColor = 0xf39c12;
          if (this.p2GuardText) {
            this.p2GuardText.setText("INSTÁVEL 🛡️");
            this.p2GuardText.setColor("#f59e0b");
          }
        } else {
          this.p2GuardBar.fillColor = 0x3498db;
          if (this.p2GuardText) {
            this.p2GuardText.setText("POSTURA 🛡️");
            this.p2GuardText.setColor("#94a3b8");
          }
        }
      }
    }
  }

  showLog(m: string) {
    if (!this.logText || !this.logText.active) return;
    this.scene.tweens.killTweensOf(this.logText);
    this.logText.setText(m).setAlpha(1);
    this.scene.tweens.add({
      targets: this.logText,
      alpha: 0,
      delay: 1000,
      duration: 500,
    });
  }

  updateCombo(comboCount: number, isP1: boolean, comboDamage?: number) {
    if (comboCount < 2 && this.scene.gameState.gameMode !== "training") return;

    const container = isP1 ? this.p1ComboContainer : this.p2ComboContainer;
    const textObj = isP1 ? this.p1ComboText : this.p2ComboText;
    const barObj = isP1 ? this.p1ComboBar : this.p2ComboBar;

    if (!container || !container.active || !textObj || !textObj.active) return;

    textObj.setText(`${comboCount} HITS!`);
    
    const dmgTextObj = isP1 ? this.p1ComboDmgText : this.p2ComboDmgText;
    if (dmgTextObj) {
      if (comboDamage !== undefined && comboDamage > 0) {
        dmgTextObj.setText(`${comboDamage} DMG`);
      } else {
        dmgTextObj.setText("");
      }
    }

    // Kill any existing animations on the container or bar
    this.scene.tweens.killTweensOf(container);
    this.scene.tweens.killTweensOf(barObj);

    // Reset visibility and apply an energetic entrance scaling and rotation slant
    container.setAlpha(1);
    container.setScale(1.5);
    container.setRotation(isP1 ? -0.06 : 0.06);

    // Smoothly drain the active combo timer bar over 2 seconds
    barObj.scaleX = 1.0;
    this.scene.tweens.add({
      targets: barObj,
      scaleX: 0,
      duration: 2000,
      ease: "Linear",
    });

    // Animate the container settling with a Back ease bounce
    this.scene.tweens.add({
      targets: container,
      scaleX: 1.0,
      scaleY: 1.0,
      rotation: 0,
      duration: 180,
      ease: "Back.easeOut",
      onComplete: () => {
        // Apply slight physical shaking proportionate to combo size
        const shakeIntensity = Math.min(8, comboCount);
        const originalX = isP1 ? 25 : 935;
        this.scene.tweens.add({
          targets: container,
          x: originalX + (isP1 ? shakeIntensity : -shakeIntensity),
          yoyo: true,
          repeat: 3,
          duration: 30,
          onComplete: () => {
            container.setX(originalX);
          },
        });
      },
    });

    // Set a delayed fade-out timer for when the combo ends/times out (2 seconds)
    if (isP1) {
      if (this.p1ComboHideTimer) this.p1ComboHideTimer.remove();
      this.p1ComboHideTimer = this.scene.time.delayedCall(2000, () => {
        this.scene.tweens.add({
          targets: container,
          alpha: 0,
          scaleX: 0.8,
          scaleY: 0.8,
          duration: 200,
          ease: "Quad.easeIn",
        });
      });
    } else {
      if (this.p2ComboHideTimer) this.p2ComboHideTimer.remove();
      this.p2ComboHideTimer = this.scene.time.delayedCall(2000, () => {
        this.scene.tweens.add({
          targets: container,
          alpha: 0,
          scaleX: 0.8,
          scaleY: 0.8,
          duration: 200,
          ease: "Quad.easeIn",
        });
      });
    }
  }

  showCombo(x: number, y: number) {
    const comboText = this.scene.add
      .text(x, y, "COMBO FINISH!", {
        fontSize: "24px",
        color: "#ff0000",
        fontStyle: "bold",
        fontFamily:
          "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.scene.tweens.add({
      targets: comboText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => comboText.destroy(),
    });
  }

  public destroy() {
    if (this.p1ComboHideTimer) {
      this.p1ComboHideTimer.remove();
      this.p1ComboHideTimer = undefined;
    }
    if (this.p2ComboHideTimer) {
      this.p2ComboHideTimer.remove();
      this.p2ComboHideTimer = undefined;
    }
    if (this.p1KiPulseTween) {
      try {
        if (this.p1KiPulseTween.stop) this.p1KiPulseTween.stop();
      } catch (e) {}
      this.p1KiPulseTween = undefined;
    }
    if (this.p2KiPulseTween) {
      try {
        if (this.p2KiPulseTween.stop) this.p2KiPulseTween.stop();
      } catch (e) {}
      this.p2KiPulseTween = undefined;
    }
    if (this.uiContainer) {
      try {
        this.uiContainer.destroy(true);
      } catch (e) {}
    }
    if (this.pauseOverlay) {
      try {
        this.pauseOverlay.destroy(true);
      } catch (e) {}
    }
  }

  public setHudEditMode(enabled: boolean) {
    if (this.p1HudContainer) {
      if (enabled) {
        this.p1HudContainer.setInteractive();
      } else {
        this.p1HudContainer.disableInteractive();
      }
    }
    if (this.p2HudContainer) {
      if (enabled) {
        this.p2HudContainer.setInteractive();
      } else {
        this.p2HudContainer.disableInteractive();
      }
    }
  }
}
