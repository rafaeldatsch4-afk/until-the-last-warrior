import Phaser from "phaser";
import { UniverseInfo, UniverseManager, UNIVERSES } from "../systems/UniverseManager";

export class UniverseDisplay extends Phaser.GameObjects.Container {
  private cardBg!: Phaser.GameObjects.Graphics;
  private glowBorder!: Phaser.GameObjects.Graphics;
  private contentContainer!: Phaser.GameObjects.Container;
  private badgeText!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private quoteText!: Phaser.GameObjects.Text;
  private dots: Phaser.GameObjects.Arc[] = [];
  private isAnimating: boolean = false;
  private currentUniverse: UniverseInfo;
  private onUniverseChangeCallback?: (universe: UniverseInfo) => void;

  private cardWidth: number = 340;
  private cardHeight: number = 126;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    onUniverseChange?: (universe: UniverseInfo) => void
  ) {
    super(scene, x, y);
    this.currentUniverse = UniverseManager.getSelectedUniverse();
    this.onUniverseChangeCallback = onUniverseChange;

    this.buildUI();
    this.scene.add.existing(this);
  }

  private buildUI() {
    const w = this.cardWidth;
    const h = this.cardHeight;
    const halfW = w / 2;
    const halfH = h / 2;

    // Shadow underneath
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x000000, 0.5);
    shadow.fillRoundedRect(-halfW + 4, -halfH + 4, w, h, 14);
    this.add(shadow);

    // Card background
    this.cardBg = this.scene.add.graphics();
    this.add(this.cardBg);

    // Glowing border
    this.glowBorder = this.scene.add.graphics();
    this.add(this.glowBorder);

    // "UNIVERSO ATUAL" top label pill
    const topLabelBg = this.scene.add.graphics();
    topLabelBg.fillStyle(0x000000, 0.85);
    topLabelBg.fillRoundedRect(-65, -halfH - 10, 130, 20, 10);
    topLabelBg.lineStyle(1, 0xd4af37, 0.7);
    topLabelBg.strokeRoundedRect(-65, -halfH - 10, 130, 20, 10);
    this.add(topLabelBg);

    const topLabelText = this.scene.add
      .text(0, -halfH, "✦ UNIVERSO ATUAL ✦", {
        fontSize: "10px",
        color: "#f1c40f",
        fontStyle: "bold",
        fontFamily: "system-ui, -apple-system, sans-serif",
        letterSpacing: 1,
        resolution: 2,
      })
      .setOrigin(0.5);
    this.add(topLabelText);

    // Content container for sliding transitions
    this.contentContainer = this.scene.add.container(0, 0);
    this.add(this.contentContainer);

    // Badge (e.g. 🐉 DRAGON BALL)
    this.badgeText = this.scene.add
      .text(0, -22, "", {
        fontSize: "11px",
        fontStyle: "bold",
        fontFamily: "system-ui, -apple-system, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    // Universe Name (e.g. UNIVERSO SAIYAJIN)
    this.nameText = this.scene.add
      .text(0, -2, "", {
        fontSize: "19px",
        fontStyle: "900",
        fontFamily: "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
        stroke: "#000000",
        strokeThickness: 3,
        shadow: { color: "#000000", blur: 4, fill: true },
        resolution: 2,
      })
      .setOrigin(0.5);

    // Subtitle (e.g. Guerreiros Z & Ki Divino)
    this.subtitleText = this.scene.add
      .text(0, 20, "", {
        fontSize: "12px",
        color: "#e2e8f0",
        fontFamily: "system-ui, -apple-system, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    // Quote / Lore snippet
    this.quoteText = this.scene.add
      .text(0, 36, "", {
        fontSize: "10px",
        color: "#94a3b8",
        fontStyle: "italic",
        fontFamily: "system-ui, -apple-system, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    this.contentContainer.add([
      this.badgeText,
      this.nameText,
      this.subtitleText,
      this.quoteText,
    ]);

    // Navigation buttons (Left & Right arrows)
    this.createNavArrow(-halfW + 20, 0, "◀", -1);
    this.createNavArrow(halfW - 20, 0, "▶", 1);

    // Pagination indicator dots
    this.createPaginationDots(halfH - 12);

    // Card interactive hover & click to cycle
    const hitArea = this.scene.add
      .rectangle(0, 0, w - 80, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.add(hitArea);

    hitArea.on("pointerover", () => {
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 150,
        ease: "Sine.easeOut",
      });
    });

    hitArea.on("pointerout", () => {
      this.scene.tweens.add({
        targets: this,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: "Sine.easeOut",
      });
    });

    hitArea.on("pointerdown", () => {
      this.changeUniverse(1);
    });

    // Update with current universe state
    this.renderUniverseVisuals(false, 1);
  }

  private createNavArrow(
    x: number,
    y: number,
    symbol: string,
    direction: 1 | -1
  ) {
    const arrowBg = this.scene.add
      .circle(x, y, 16, 0x111625, 0.9)
      .setStrokeStyle(1.5, 0x4a5568);

    const arrowTxt = this.scene.add
      .text(x, y, symbol, {
        fontSize: "14px",
        color: "#cbd5e1",
        fontStyle: "bold",
        fontFamily: "system-ui, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    const hit = this.scene.add
      .circle(x, y, 20, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    this.add([arrowBg, arrowTxt, hit]);

    hit.on("pointerover", () => {
      arrowBg.setFillStyle(this.currentUniverse.primaryColor, 0.85);
      arrowBg.setStrokeStyle(2, 0xffffff);
      arrowTxt.setColor("#ffffff");
      this.scene.tweens.add({
        targets: [arrowBg, arrowTxt],
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 120,
      });
    });

    hit.on("pointerout", () => {
      arrowBg.setFillStyle(0x111625, 0.9);
      arrowBg.setStrokeStyle(1.5, 0x4a5568);
      arrowTxt.setColor("#cbd5e1");
      this.scene.tweens.add({
        targets: [arrowBg, arrowTxt],
        scaleX: 1,
        scaleY: 1,
        duration: 120,
      });
    });

    hit.on("pointerdown", () => {
      this.scene.tweens.add({
        targets: [arrowBg, arrowTxt],
        scaleX: 0.9,
        scaleY: 0.9,
        yoyo: true,
        duration: 60,
        onComplete: () => {
          this.changeUniverse(direction);
        },
      });
    });
  }

  private createPaginationDots(y: number) {
    const total = UNIVERSES.length;
    const spacing = 14;
    const startX = -((total - 1) * spacing) / 2;

    for (let i = 0; i < total; i++) {
      const dotX = startX + i * spacing;
      const dot = this.scene.add
        .circle(dotX, y, 3, 0x4a5568, 0.8)
        .setInteractive({ useHandCursor: true });

      const targetUniverse = UNIVERSES[i];
      dot.on("pointerdown", () => {
        if (this.currentUniverse.id !== targetUniverse.id && !this.isAnimating) {
          const currentIndex = UniverseManager.getSelectedIndex();
          const direction = i > currentIndex ? 1 : -1;
          UniverseManager.setSelectedUniverse(targetUniverse.id);
          this.currentUniverse = UniverseManager.getSelectedUniverse();
          this.playThematicTransition(direction);
        }
      });

      this.dots.push(dot);
      this.add(dot);
    }
  }

  public changeUniverse(direction: 1 | -1) {
    if (this.isAnimating) return;
    this.currentUniverse = UniverseManager.cycleUniverse(direction);
    this.playThematicTransition(direction);
  }

  private playThematicTransition(direction: 1 | -1) {
    this.isAnimating = true;

    // Play SFX if available
    try {
      if (this.scene.cache.audio.exists("sfx_select")) {
        this.scene.sound.play("sfx_select", { volume: 0.7, rate: 1.1 });
      }
    } catch {}

    // 1. Spawn Thematic Energy Burst (Particles & Aura Rings)
    this.spawnThematicParticleBurst();

    // 2. Slide out old content swiftly
    const slideOffset = 45 * direction;
    this.scene.tweens.add({
      targets: this.contentContainer,
      x: -slideOffset,
      alpha: 0,
      scaleX: 0.85,
      scaleY: 0.85,
      duration: 160,
      ease: "Power2.easeIn",
      onComplete: () => {
        // Update content values
        this.renderUniverseVisuals(true, direction);

        // Position for slide-in
        this.contentContainer.setX(slideOffset);
        this.contentContainer.setScale(1.1);

        // Slide in new content with elastic pop
        this.scene.tweens.add({
          targets: this.contentContainer,
          x: 0,
          alpha: 1,
          scaleX: 1,
          scaleY: 1,
          duration: 260,
          ease: "Back.easeOut",
          onComplete: () => {
            this.isAnimating = false;
          },
        });
      },
    });

    // 3. Card scale punch
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.04,
      scaleY: 1.04,
      yoyo: true,
      duration: 180,
      ease: "Sine.easeInOut",
    });

    // Notify callback
    if (this.onUniverseChangeCallback) {
      this.onUniverseChangeCallback(this.currentUniverse);
    }
  }

  private renderUniverseVisuals(isAnimated: boolean, direction: number) {
    const u = this.currentUniverse;
    const w = this.cardWidth;
    const h = this.cardHeight;
    const halfW = w / 2;
    const halfH = h / 2;

    // Draw background with universe tint
    this.cardBg.clear();
    this.cardBg.fillStyle(0x0c1020, 0.94);
    this.cardBg.fillRoundedRect(-halfW, -halfH, w, h, 14);

    // Gradient accent bar inside top
    this.cardBg.fillStyle(u.primaryColor, 0.18);
    this.cardBg.fillRoundedRect(-halfW + 4, -halfH + 4, w - 8, h - 8, 10);

    // Glowing border styling
    this.glowBorder.clear();
    this.glowBorder.lineStyle(2, u.primaryColor, 0.9);
    this.glowBorder.strokeRoundedRect(-halfW, -halfH, w, h, 14);

    // Update texts
    this.badgeText.setText(u.badge).setColor(u.textColor);
    this.nameText.setText(u.name);
    this.nameText.setColor("#ffffff");
    this.nameText.setStroke(u.ambientHex, 4);

    this.subtitleText.setText(u.subtitle);
    this.quoteText.setText(`"${u.bannerQuote}"`);

    // Update pagination dots
    const currentIndex = UniverseManager.getSelectedIndex();
    this.dots.forEach((dot, idx) => {
      if (idx === currentIndex) {
        dot.setFillStyle(u.primaryColor, 1);
        dot.setRadius(4.5);
      } else {
        dot.setFillStyle(0x4a5568, 0.6);
        dot.setRadius(3);
      }
    });
  }

  private spawnThematicParticleBurst() {
    const u = this.currentUniverse;
    const particleCount = 24;

    for (let i = 0; i < particleCount; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(40, 160);
      const size = Phaser.Math.FloatBetween(2, 5);

      const spark = this.scene.add
        .circle(this.x, this.y, size, u.particleColor, 0.9)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(this.depth + 1);

      this.scene.tweens.add({
        targets: spark,
        x: this.x + Math.cos(angle) * speed,
        y: this.y + Math.sin(angle) * speed,
        scale: 0,
        alpha: 0,
        duration: Phaser.Math.Between(400, 750),
        ease: "Power2.easeOut",
        onComplete: () => spark.destroy(),
      });
    }

    // Expanding shockwave ring
    const ring = this.scene.add
      .graphics()
      .setDepth(this.depth + 1);
    ring.lineStyle(3, u.primaryColor, 0.9);
    ring.strokeRoundedRect(this.x - this.cardWidth / 2, this.y - this.cardHeight / 2, this.cardWidth, this.cardHeight, 14);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 1.18,
      scaleY: 1.18,
      alpha: 0,
      duration: 450,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }

  public getCurrentUniverse(): UniverseInfo {
    return this.currentUniverse;
  }
}
