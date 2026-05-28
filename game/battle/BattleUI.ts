export class BattleUI {
  scene: any;
  uiContainer!: Phaser.GameObjects.Container;
  p1HpBar!: Phaser.GameObjects.Rectangle;
  p1KiBar!: Phaser.GameObjects.Rectangle;
  p2HpBar!: Phaser.GameObjects.Rectangle;
  p2KiBar!: Phaser.GameObjects.Rectangle;
  logText!: Phaser.GameObjects.Text;
  p1KiPulseTween?: Phaser.Tweens.Tween;
  p2KiPulseTween?: Phaser.Tweens.Tween;
  p1NameText!: Phaser.GameObjects.Text;
  p2NameText!: Phaser.GameObjects.Text;

  constructor(scene: any) {
    this.scene = scene;
  }

  createUI(playerData: any, enemyData: any, gameMode: string, arcadeRound: number) {
    const bs = this.scene as any;
    this.uiContainer = bs.add.container(0, 0).setScrollFactor(0).setDepth(10);
    
    // Player 1 HP/Ki Backgrounds
    const p1HpBg = bs.add.rectangle(150, 50, 250, 22, 0x111111).setStrokeStyle(3, 0xffffff, 0.8);
    const p1KiBg = bs.add.rectangle(150, 80, 250, 12, 0x111111).setStrokeStyle(2, 0xaaaaaa, 0.6);
    this.uiContainer.add([p1HpBg, p1KiBg]);

    // Player 2 HP/Ki Backgrounds
    const p2HpBg = bs.add.rectangle(810, 50, 250, 22, 0x111111).setStrokeStyle(3, 0xffffff, 0.8);
    const p2KiBg = bs.add.rectangle(810, 80, 250, 12, 0x111111).setStrokeStyle(2, 0xaaaaaa, 0.6);
    this.uiContainer.add([p2HpBg, p2KiBg]);

    this.p1HpBar = bs.add
      .rectangle(25, 50, 250, 22, 0x2ecc71)
      .setOrigin(0, 0.5);
    this.uiContainer.add(this.p1HpBar);

    this.p1KiBar = bs.add
      .rectangle(25, 80, 250, 12, 0x3498db)
      .setOrigin(0, 0.5);
    this.uiContainer.add(this.p1KiBar);
    this.p1KiBar.scaleX = 0; // Starts with 0 Ki

    this.p2HpBar = bs.add
      .rectangle(685, 50, 250, 22, 0xe74c3c)
      .setOrigin(0, 0.5);
    this.uiContainer.add(this.p2HpBar);

    this.p2KiBar = bs.add
      .rectangle(685, 80, 250, 12, 0xf1c40f)
      .setOrigin(0, 0.5);
    this.uiContainer.add(this.p2KiBar);
    this.p2KiBar.scaleX = 0; // Starts with 0 Ki

    // Player 1 Name
    this.p1NameText = bs.add
      .text(25, 15, playerData.name, {
        fontSize: "22px",
        fontFamily: "Impact, sans-serif",
        color: "#fff",
        stroke: "#000",
        strokeThickness: 4,
        shadow: { color: "#3498db", blur: 4, fill: true }
      });
    this.uiContainer.add(this.p1NameText);
      
    // Player 2 Name
    this.p2NameText = bs.add
      .text(935, 15, enemyData.name, {
        fontSize: "22px",
        fontFamily: "Impact, sans-serif",
        color: "#fff",
        stroke: "#000",
        strokeThickness: 4,
        shadow: { color: "#e74c3c", blur: 4, fill: true }
      })
      .setOrigin(1, 0);
    this.uiContainer.add(this.p2NameText);
      
    this.logText = bs.add
      .text(480, 120, "", {
        fontSize: "26px",
        color: "#fff",
        fontFamily: "Impact, sans-serif",
        stroke: "#000",
        strokeThickness: 5,
        shadow: { color: "#000", blur: 4, offsetX: 2, offsetY: 2, fill: true }
      })
      .setOrigin(0.5);
    this.uiContainer.add(this.logText);

    if (gameMode === "arcade") {
      bs.add
        .text(480, 25, `ARCADE: ROUND ${arcadeRound || 1} / 5`, {
          fontSize: "22px",
          color: "#f1c40f",
          fontFamily: "Impact, sans-serif",
          stroke: "#000",
          strokeThickness: 4,
          shadow: { color: "#000", blur: 4, fill: true }
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(10);
    }
  }

  updateBars(p1HpP: number, p2HpP: number, p1KiP: number, p2KiP: number) {
    if (this.p1HpBar && this.p1HpBar.active) {
      // Liquid HP Bars
      this.scene.tweens.add({
        targets: this.p1HpBar,
        scaleX: Math.max(0, p1HpP),
        duration: 300,
        ease: "Cubic.easeOut",
        overwrite: true,
      });
      this.scene.tweens.add({
        targets: this.p2HpBar,
        scaleX: Math.max(0, p2HpP),
        duration: 300,
        ease: "Cubic.easeOut",
        overwrite: true,
      });
      // Liquid Ki Bars
      this.p1KiBar.scaleX = Math.max(0, p1KiP);
      this.p2KiBar.scaleX = Math.max(0, p2KiP);

      // Pulse Player 1 Ki Bar at 100% (p1KiP >= 1.0)
      if (p1KiP >= 1) {
        if (!this.p1KiPulseTween) {
          this.p1KiPulseTween = this.scene.tweens.add({
            targets: this.p1KiBar,
            alpha: { from: 1, to: 0.4 },
            duration: 350,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        }
      } else {
        if (this.p1KiPulseTween) {
          this.p1KiPulseTween.stop();
          this.p1KiPulseTween = undefined;
          this.p1KiBar.setAlpha(1);
        }
      }

      // Pulse Player 2 Ki Bar at 100% (p2KiP >= 1.0)
      if (p2KiP >= 1) {
        if (!this.p2KiPulseTween) {
          this.p2KiPulseTween = this.scene.tweens.add({
            targets: this.p2KiBar,
            alpha: { from: 1, to: 0.4 },
            duration: 350,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        }
      } else {
        if (this.p2KiPulseTween) {
          this.p2KiPulseTween.stop();
          this.p2KiPulseTween = undefined;
          this.p2KiBar.setAlpha(1);
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

  showCombo(x: number, y: number) {
    const comboText = this.scene.add
      .text(x, y, "COMBO FINISH!", {
        fontSize: "24px",
        color: "#ff0000",
        fontStyle: "bold",
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
}
