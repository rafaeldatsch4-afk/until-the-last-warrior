import Phaser from "phaser";
import { triggerVibration } from "../utils/haptics";
import type BattleScene from "../scenes/BattleScene";

export interface DamageTextOptions {
  color?: string;
  stroke?: string;
  strokeThickness?: number;
  fontSize?: string;
  duration?: number;
  yOffset?: number;
  scaleStart?: number;
}

export class BattleEffects {
  public scene: BattleScene;

  // Object Pools
  private flashPool!: Phaser.GameObjects.Group;
  private circlePool!: Phaser.GameObjects.Group;
  private rectPool!: Phaser.GameObjects.Group;
  private textPool!: Phaser.GameObjects.Group;
  private graphicsPool!: Phaser.GameObjects.Group;

  // Active particle emitters registry for clean teardown
  private activeEmitters: Set<Phaser.GameObjects.Particles.ParticleEmitter> = new Set();
  private activeTweens: Set<Phaser.Tweens.Tween> = new Set();

  constructor(scene: BattleScene) {
    this.scene = scene;
    this.initPools();
  }

  /**
   * Inicializa as pools de GameObjects do Phaser
   */
  private initPools() {
    this.flashPool = this.scene.add.group({
      classType: Phaser.GameObjects.Rectangle,
      maxSize: 6,
      runChildUpdate: false,
    });

    this.circlePool = this.scene.add.group({
      classType: Phaser.GameObjects.Arc,
      maxSize: 64,
      runChildUpdate: false,
    });

    this.rectPool = this.scene.add.group({
      classType: Phaser.GameObjects.Rectangle,
      maxSize: 128,
      runChildUpdate: false,
    });

    this.textPool = this.scene.add.group({
      classType: Phaser.GameObjects.Text,
      maxSize: 32,
      runChildUpdate: false,
    });

    this.graphicsPool = this.scene.add.group({
      classType: Phaser.GameObjects.Graphics,
      maxSize: 16,
      runChildUpdate: false,
    });
  }

  // ==========================================
  // POOL BORROW & RECYCLE HELPERS
  // ==========================================

  private borrowFlash(x: number, y: number, width: number, height: number, color: number, alpha: number = 0.8): Phaser.GameObjects.Rectangle {
    let flash = this.flashPool.getFirstDead(false) as Phaser.GameObjects.Rectangle | null;
    if (!flash) {
      flash = this.scene.add.rectangle(x, y, width, height, color);
      this.flashPool.add(flash);
    }
    this.scene.tweens.killTweensOf(flash);
    const safeAlpha = Math.min(alpha, 0.6);
    flash.setPosition(x, y)
      .setSize(width, height)
      .setFillStyle(color)
      .setAlpha(safeAlpha)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(30)
      .setScrollFactor(0)
      .setActive(true)
      .setVisible(true);
    return flash;
  }

  public borrowCircle(x: number, y: number, radius: number, fillColor?: number, fillAlpha?: number): Phaser.GameObjects.Arc {
    let circle = this.circlePool.getFirstDead(false) as Phaser.GameObjects.Arc | null;
    if (!circle) {
      circle = this.scene.add.circle(x, y, radius, fillColor, fillAlpha);
      this.circlePool.add(circle);
    }
    this.scene.tweens.killTweensOf(circle);
    circle.setPosition(x, y)
      .setRadius(radius)
      .setScale(1)
      .setRotation(0)
      .setAlpha(fillAlpha !== undefined ? fillAlpha : 1)
      .setBlendMode(Phaser.BlendModes.NORMAL)
      .setStrokeStyle(0, 0, 0)
      .setActive(true)
      .setVisible(true);
    
    if (fillColor !== undefined) {
      circle.setFillStyle(fillColor, fillAlpha !== undefined ? fillAlpha : 1);
    }
    return circle;
  }

  public borrowRect(x: number, y: number, width: number, height: number, fillColor?: number, fillAlpha?: number): Phaser.GameObjects.Rectangle {
    let rect = this.rectPool.getFirstDead(false) as Phaser.GameObjects.Rectangle | null;
    if (!rect) {
      rect = this.scene.add.rectangle(x, y, width, height, fillColor, fillAlpha);
      this.rectPool.add(rect);
    }
    this.scene.tweens.killTweensOf(rect);
    rect.setPosition(x, y)
      .setSize(width, height)
      .setScale(1)
      .setRotation(0)
      .setOrigin(0.5, 0.5)
      .setAlpha(fillAlpha !== undefined ? fillAlpha : 1)
      .setBlendMode(Phaser.BlendModes.NORMAL)
      .setActive(true)
      .setVisible(true);

    if (fillColor !== undefined) {
      rect.setFillStyle(fillColor, fillAlpha !== undefined ? fillAlpha : 1);
    }
    return rect;
  }

  public borrowText(x: number, y: number, text: string, style?: Phaser.Types.GameObjects.Text.TextStyle): Phaser.GameObjects.Text {
    let textObj = this.textPool.getFirstDead(false) as Phaser.GameObjects.Text | null;
    if (!textObj) {
      textObj = this.scene.add.text(x, y, text, style);
      this.textPool.add(textObj);
    } else {
      textObj.setText(text);
      if (style) {
        textObj.setStyle(style);
      }
    }
    this.scene.tweens.killTweensOf(textObj);
    textObj.setPosition(x, y)
      .setScale(1)
      .setRotation(0)
      .setAlpha(1)
      .setOrigin(0.5, 0.5)
      .setActive(true)
      .setVisible(true);
    return textObj;
  }

  public borrowGraphics(x: number, y: number): Phaser.GameObjects.Graphics {
    let g = this.graphicsPool.getFirstDead(false) as Phaser.GameObjects.Graphics | null;
    if (!g) {
      g = this.scene.add.graphics({ x, y });
      this.graphicsPool.add(g);
    }
    this.scene.tweens.killTweensOf(g);
    g.setPosition(x, y)
      .clear()
      .setAlpha(1)
      .setScale(1)
      .setRotation(0)
      .setActive(true)
      .setVisible(true);
    return g;
  }

  public recycle(obj: Phaser.GameObjects.GameObject | null | undefined) {
    if (!obj) return;
    this.scene.tweens.killTweensOf(obj);
    if ('setActive' in obj && typeof (obj as any).setActive === 'function') {
      (obj as any).setActive(false).setVisible(false);
    }
  }

  private runManagedTween(config: Phaser.Types.Tweens.TweenBuilderConfig): Phaser.Tweens.Tween {
    const origComplete = config.onComplete;
    config.onComplete = (tween, targets, ...args) => {
      this.activeTweens.delete(tweenInstance);
      if (origComplete) {
        origComplete(tween, targets, ...args);
      }
    };
    const tweenInstance = this.scene.tweens.add(config);
    this.activeTweens.add(tweenInstance);
    return tweenInstance;
  }

  // ==========================================
  // SCREEN FLASH EFFECT
  // ==========================================

  public createScreenFlash(color: number, duration: number, alpha: number = 0.8) {
    if (!this.scene.scene.isActive()) return;

    const safeDuration = Math.min(duration, 250);
    const safeAlpha = Math.min(alpha, 0.55);
    const flash = this.borrowFlash(480, 270, 960, 540, color, safeAlpha);
    
    // Safety auto-hide fallback
    const hideFlash = () => {
      try {
        if (flash && flash.active) {
          flash.setAlpha(0).setVisible(false).setActive(false);
          this.flashPool.killAndHide(flash);
        }
      } catch (e) {}
    };

    const safetyTimer = this.scene.time.delayedCall(safeDuration + 80, hideFlash);

    this.runManagedTween({
      targets: flash,
      alpha: 0,
      duration: safeDuration,
      ease: "Power2",
      onComplete: () => {
        try {
          if (safetyTimer) safetyTimer.remove();
        } catch (e) {}
        hideFlash();
      },
    });
  }

  // ==========================================
  // FLOATING DAMAGE & HIT TEXTS
  // ==========================================

  public showDamageText(
    x: number,
    y: number,
    content: string | number,
    isCritical: boolean = false,
    isBlock: boolean = false,
    options?: DamageTextOptions
  ) {
    if (!this.scene.scene.isActive()) return;

    const textStr = typeof content === "number"
      ? (content === 0 && isBlock ? "BLOQUEIO" : `-${content}`)
      : content;

    const color = options?.color || (isBlock ? "#3498db" : isCritical ? "#e74c3c" : "#ffffff");
    const stroke = options?.stroke || "#000000";
    const strokeThickness = options?.strokeThickness !== undefined ? options.strokeThickness : (isCritical ? 6 : 4);
    const fontSize = options?.fontSize || (isCritical ? "36px" : "28px");

    const jitterX = Phaser.Math.Between(-20, 20);
    const jitterY = Phaser.Math.Between(-10, 10);
    const posX = x + jitterX;
    const posY = y + jitterY;

    const textObj = this.borrowText(posX, posY, textStr, {
      fontFamily: "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
      fontSize: fontSize,
      color: color,
      stroke: stroke,
      strokeThickness: strokeThickness,
      shadow: { color: "#000", blur: 4, offsetX: 2, offsetY: 2, fill: true },
      resolution: 2,
    });

    textObj.setDepth(100);

    const duration = options?.duration || (isCritical ? 1000 : 800);
    const yOffset = options?.yOffset !== undefined ? options.yOffset : (isCritical ? -100 : -60);
    const scaleStart = options?.scaleStart !== undefined ? options.scaleStart : (isCritical ? 1.5 : 1);

    textObj.setScale(scaleStart);

    this.runManagedTween({
      targets: textObj,
      y: posY + yOffset,
      alpha: { start: 1, end: 0 },
      scale: 1,
      duration: duration,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.textPool.killAndHide(textObj);
      },
    });
  }

  public createFloatingDamage(
    x: number,
    y: number,
    amount: number,
    isCritical: boolean = false,
    isBlock: boolean = false
  ) {
    this.showDamageText(x, y, amount, isCritical, isBlock);
  }

  // ==========================================
  // IMPACT & HIT EFFECTS
  // ==========================================

  public createImpactEffect(
    x: number,
    y: number,
    color: number,
    type: "melee" | "beam" | "block" | "super" | "clash" = "melee",
    damage: number = 0
  ) {
    if (!this.scene.scene.isActive()) return;

    const isSuperMode = type === "super" || this.scene.p1SuperActive || this.scene.p2SuperActive;
    const isBeam = type === "beam" || (isSuperMode && type !== "block" && type !== "clash");
    const isBlock = type === "block";
    const isClash = type === "clash";

    if (!isBlock && typeof window !== "undefined") {
      let intensity = "medium";
      if (isClash || isSuperMode) intensity = "heavy";
      else if (isBeam) intensity = "heavy";
      else {
        if (damage >= 25) intensity = "heavy";
        else if (damage >= 10) intensity = "medium";
        else intensity = "light";
      }
      if (this.scene.gameState?.settings?.lowPerformanceMode && intensity === "heavy") {
        intensity = "medium";
      }
      window.dispatchEvent(new CustomEvent("shake-screen", { detail: { intensity } }));
      if (this.scene.soundManager) {
        this.scene.soundManager.playShakeScreenAudio(intensity);
      }
    }

    // 1. Main Boom Circle from Pool
    const boomRadius = isClash ? 80 : isSuperMode ? 60 : isBeam ? 40 : isBlock ? 15 : 20;
    const boomScale = isClash ? 15 : isSuperMode ? 12 : isBeam ? 8 : isBlock ? 3 : 6;
    const boomDuration = isClash ? 600 : isSuperMode ? 500 : isBeam ? 350 : 250;

    const boom = this.borrowCircle(x, y, boomRadius, isClash ? 0xffffff : color);
    boom.setDepth(20);
    this.runManagedTween({
      targets: boom,
      scale: boomScale,
      alpha: 0,
      duration: boomDuration,
      ease: "Cubic.easeOut",
      onComplete: () => this.circlePool.killAndHide(boom),
    });

    // 2. Inner White Core from Pool
    const coreRadius = isClash ? 45 : isSuperMode ? 35 : isBeam ? 20 : 10;
    const coreScale = isClash ? 10 : isSuperMode ? 8 : isBeam ? 6 : 4;
    const coreDuration = isClash ? 400 : isSuperMode ? 300 : isBeam ? 200 : 150;

    const core = this.borrowCircle(x, y, coreRadius, 0xffffff);
    core.setDepth(21);
    this.runManagedTween({
      targets: core,
      scale: coreScale,
      alpha: 0,
      duration: coreDuration,
      ease: "Cubic.easeOut",
      onComplete: () => this.circlePool.killAndHide(core),
    });

    // 3. Sparks & Particles using Particle System
    const isPotato = this.scene.gameState?.settings?.lowPerformanceMode;
    const sparkCount = isPotato
      ? (isClash ? 16 : isSuperMode ? 14 : isBlock ? 6 : 9)
      : (isClash ? 35 : isBlock ? 10 : isSuperMode ? 30 : 15);
    const streakCount = isPotato
      ? (isClash ? 6 : isSuperMode ? 4 : 3)
      : (isClash ? 15 : isSuperMode ? 10 : 6);
    const sparkColor = isBlock ? 0x3498db : (isClash ? 0xfffc00 : color);

    try {
      const particles = this.scene.add.particles(x, y, "hit_spark", {
        speed: { min: isBlock ? 100 : 250, max: isClash ? 1000 : (isBlock ? 400 : 700) },
        angle: { min: 0, max: 360 },
        scale: { start: isClash ? 1.5 : 1, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: sparkColor,
        blendMode: Phaser.BlendModes.ADD,
        lifespan: { min: isPotato ? 160 : 300, max: isPotato ? 320 : (isClash ? 700 : 500) },
        gravityY: isBlock ? 100 : 400,
        quantity: sparkCount,
        emitting: false,
      });
      particles.setDepth(23);
      particles.explode(sparkCount);
      this.activeEmitters.add(particles);

      const streaks = this.scene.add.particles(x, y, "hit_spark_streak", {
        speed: { min: isBlock ? 150 : 300, max: isClash ? 1200 : (isBlock ? 500 : 900) },
        angle: { min: 0, max: 360 },
        scaleX: { start: isClash ? 2 : 1.5, end: 0 },
        scaleY: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: 0xffffff,
        blendMode: Phaser.BlendModes.ADD,
        lifespan: { min: isPotato ? 80 : 100, max: isPotato ? 200 : (isClash ? 400 : 300) },
        gravityY: 0,
        quantity: streakCount,
        emitting: false,
        rotate: (particle: any) => {
          return Phaser.Math.RadToDeg(Math.atan2(particle.velocityY, particle.velocityX));
        },
      });
      streaks.setDepth(24);
      streaks.explode(streakCount);
      this.activeEmitters.add(streaks);

      this.scene.time.delayedCall(isPotato ? 600 : 1200, () => {
        if (particles) {
          this.activeEmitters.delete(particles);
          try { particles.destroy(); } catch (e) {}
        }
        if (streaks) {
          this.activeEmitters.delete(streaks);
          try { streaks.destroy(); } catch (e) {}
        }
      });
    } catch (err) {
      // Fallback if textures aren't loaded
    }

    // 4. Energy Slash lines using Pooled Rectangles
    if (type === "melee" || isSuperMode || isClash) {
      const slashCount = isClash ? 4 : isSuperMode ? 3 : 1;
      for (let i = 0; i < slashCount; i++) {
        const slashLength = isClash ? 400 : isSuperMode ? 300 : 180;
        const slashThick = isClash ? 25 : isSuperMode ? 15 : 8;

        const slash = this.borrowRect(x, y, slashLength, slashThick, 0xffffff);
        slash.setRotation(Phaser.Math.FloatBetween(0, Math.PI)).setDepth(22);

        this.runManagedTween({
          targets: slash,
          alpha: 0,
          scaleX: isClash ? 2 : 1.5,
          scaleY: 0,
          duration: isClash ? 300 : 200,
          ease: "Expo.easeOut",
          onComplete: () => this.rectPool.killAndHide(slash),
        });
      }
    }

    // 5. Lightning Arcs for Clash using Pooled Graphics
    if (isClash) {
      for (let i = 0; i < 4; i++) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const lightningData: Phaser.Types.Math.Vector2Like[] = [{ x: 0, y: 0 }];
        let cx = 0;
        let cy = 0;
        for (let j = 0; j < 4; j++) {
          cx += Math.cos(angle + Phaser.Math.FloatBetween(-0.5, 0.5)) * 40;
          cy += Math.sin(angle + Phaser.Math.FloatBetween(-0.5, 0.5)) * 40;
          lightningData.push({ x: cx, y: cy });
        }
        const lightning = this.borrowGraphics(x, y);
        lightning.setDepth(23);
        lightning.lineStyle(4, 0xfffc00, 1);
        lightning.beginPath();
        lightning.moveTo(0, 0);
        for (let j = 1; j < lightningData.length; j++) {
          lightning.lineTo(lightningData[j].x!, lightningData[j].y!);
        }
        lightning.strokePath();

        this.runManagedTween({
          targets: lightning,
          alpha: 0,
          duration: 150,
          onComplete: () => this.graphicsPool.killAndHide(lightning),
        });
      }
    }

    // 6. Debris & Spark Particles using Pooled Rectangles
    const debrisCount = isPotato
      ? (isClash ? 16 : isSuperMode ? 10 : isBeam ? 8 : isBlock ? 4 : 6)
      : (isClash ? 40 : isSuperMode ? 25 : isBeam ? 16 : isBlock ? 8 : 12);

    for (let i = 0; i < debrisCount; i++) {
      const sparkColor = isClash
        ? Phaser.Utils.Array.GetRandom([0xffffff, 0xfffc00, 0xff0000])
        : isBlock
          ? 0x3498db
          : Math.random() > 0.5
            ? 0xffffff
            : color;

      const p = this.borrowRect(
        x,
        y,
        isClash ? 18 : isSuperMode ? 14 : isBeam ? 10 : 6,
        isClash ? 4 : isSuperMode ? 3 : isBeam ? 2 : 6,
        sparkColor
      );
      p.setDepth(20);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = isClash
        ? Phaser.Math.Between(300, 700)
        : isSuperMode
          ? Phaser.Math.Between(250, 550)
          : isBeam
            ? Phaser.Math.Between(150, 350)
            : Phaser.Math.Between(80, 200);

      this.runManagedTween({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleY: 0.1,
        scaleX: isClash ? 4 : isSuperMode ? 3 : isBeam ? 2 : 0.1,
        rotation: angle,
        duration: Phaser.Math.Between(
          isClash ? (isPotato ? 400 : 700) : isSuperMode ? (isPotato ? 350 : 600) : (isPotato ? 250 : 400),
          isClash ? (isPotato ? 700 : 1500) : isSuperMode ? (isPotato ? 600 : 1200) : (isPotato ? 400 : 800)
        ),
        ease: "Expo.easeOut",
        onComplete: () => this.rectPool.killAndHide(p),
      });
    }

    // 7. Shockwave Rings using Pooled Circles with Stroke
    if (isSuperMode || isBeam || isClash) {
      const ringCount = isClash ? (isPotato ? 2 : 4) : isSuperMode ? (isPotato ? 2 : 3) : 1;
      for (let r = 0; r < ringCount; r++) {
        const ring = this.borrowCircle(x, y, 30 + r * 15);
        ring.isFilled = false;
        ring.setStrokeStyle(
          isClash ? 8 : isSuperMode ? 6 : 4,
          isClash ? 0xffffff : color
        );
        ring.setDepth(19);

        this.runManagedTween({
          targets: ring,
          scale: isClash ? 10 + r * 3 : isSuperMode ? 8 + r * 2 : 5,
          alpha: 0,
          delay: r * (isClash ? 50 : 80),
          duration: isClash ? 800 : isSuperMode ? 600 : 400,
          ease: "Cubic.easeOut",
          onComplete: () => this.circlePool.killAndHide(ring),
        });
      }

      // Camera Shake & Screen Flash (Balanced via BattleCamera)
      if (this.scene.battleCamera) {
        if (isClash) {
          this.scene.battleCamera.flash(400, 255, 255, 255, true);
          this.scene.battleCamera.shake(700, 0.1);
        } else if (isSuperMode) {
          this.scene.battleCamera.flash(300, 255, 255, 255, true);
          this.scene.battleCamera.shake(500, 0.08);
        } else {
          this.scene.battleCamera.flash(150, 255, 255, 255, true);
          this.scene.battleCamera.shake(300, 0.05);
        }
      }
    } else if (isBlock) {
      if (this.scene.battleCamera) {
        this.scene.battleCamera.shake(100, 0.01);
      }
    } else {
      if (this.scene.battleCamera) {
        this.scene.battleCamera.shake(150, 0.02);
      }
    }
  }

  public showHitEffect(
    x: number,
    y: number,
    color: number,
    type: "melee" | "beam" | "block" | "super" | "clash" = "melee",
    damage: number = 0
  ) {
    this.createImpactEffect(x, y, color, type, damage);
  }

  // ==========================================
  // SPECIAL BEAM ATTACK
  // ==========================================

  public specialBeam(
    isP: boolean,
    isS: boolean,
    col: number,
    hasInner: boolean,
    vibrate: boolean,
    type: string
  ) {
    const attacker = isP ? this.scene.player : this.scene.enemy;
    const target = isP ? this.scene.enemy : this.scene.player;
    const transLevel = isP
      ? this.scene.playerTransformLevel
      : this.scene.enemyTransformLevel;

    if (!attacker || !target || !attacker.active || !target.active) {
      this.scene.setActionState(isP, false);
      return;
    }

    const baseDmg = isS ? 60 : 35;
    const dmg = Math.floor(baseDmg * this.scene.getDamageMultiplier(transLevel));
    const size = isS ? 3.5 : 2.0;

    const hand = this.scene.getHandPosition(isP);
    const endX = target.x;
    const distance = Math.abs(endX - hand.x) + 50;

    if (this.scene.battleUI) {
      this.scene.battleUI.showLog(isS ? "SUPER ATTACK!" : type.toUpperCase() + "!");
    }
    if (this.scene.soundManager) this.scene.soundManager.playBeamCharge();

    // Charge Circles from Pool
    const chargeCore = this.borrowCircle(hand.x, hand.y, 2, 0xffffff);
    chargeCore.setDepth(16);

    const chargeGlow = this.borrowCircle(hand.x, hand.y, 5, col);
    chargeGlow.setDepth(15).setBlendMode(Phaser.BlendModes.ADD);

    if (this.scene.battleCamera) this.scene.battleCamera.shake(400, 0.01);
    if (vibrate) triggerVibration("beam_charge");

    // Gathering particles
    let gatherParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    try {
      gatherParticles = this.scene.add.particles(0, 0, "particle", {
        x: hand.x,
        y: hand.y,
        speed: { min: -150, max: 150 },
        scale: { start: 0.8, end: 0 },
        blendMode: "ADD",
        lifespan: 300,
        tint: col,
        gravityY: 0,
      }).setDepth(14);
      this.activeEmitters.add(gatherParticles);
    } catch (e) {}

    this.runManagedTween({
      targets: [chargeCore, chargeGlow],
      scale: 12 * size,
      alpha: { start: 1, end: 0.8 },
      duration: 400,
      yoyo: true,
      repeat: 0,
      onComplete: () => {
        if (!this.scene.scene.isActive()) return;
        if (this.scene.soundManager) this.scene.soundManager.playBeamFire();

        this.circlePool.killAndHide(chargeCore);
        this.circlePool.killAndHide(chargeGlow);

        if (gatherParticles) {
          this.activeEmitters.delete(gatherParticles);
          try { gatherParticles.destroy(); } catch (e) {}
        }

        this.createScreenFlash(col, 200, 0.6);
        if (this.scene.battleCamera) this.scene.battleCamera.shake(300, 0.03);
        if (vibrate) triggerVibration("beam_fire");

        // Pooled Beam Segments
        const originX = 0;

        // Outer Glow
        const beamOuter = this.borrowRect(hand.x, hand.y, 0, 40 * size, col, 0.6);
        beamOuter.setOrigin(originX, 0.5).setDepth(4).setBlendMode(Phaser.BlendModes.ADD);

        // Main Beam
        const beamMain = this.borrowRect(hand.x, hand.y, 0, 24 * size, col, 0.9);
        beamMain.setOrigin(originX, 0.5).setDepth(5).setBlendMode(Phaser.BlendModes.ADD);

        // Inner Core
        const beamCore = this.borrowRect(hand.x, hand.y, 0, 12 * size, 0xffffff, 1);
        beamCore.setOrigin(originX, 0.5).setDepth(6);

        beamOuter.scaleX = isP ? 1 : -1;
        beamMain.scaleX = isP ? 1 : -1;
        beamCore.scaleX = isP ? 1 : -1;

        // Beam Head Circles from Pool
        const beamHeadGlow = this.borrowCircle(hand.x, hand.y, 30 * size, col, 0.8);
        beamHeadGlow.setDepth(5).setBlendMode(Phaser.BlendModes.ADD);

        const beamHead = this.borrowCircle(hand.x, hand.y, 15 * size, 0xffffff, 1);
        beamHead.setDepth(6);

        // Particle Emitter for Beam Tip
        let particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
        try {
          particles = this.scene.add.particles(0, 0, "particle", {
            speed: { min: 50, max: 200 },
            angle: { min: isP ? 160 : -20, max: isP ? 200 : 20 },
            scale: { start: 0.8 * size, end: 0 },
            blendMode: "ADD",
            lifespan: 300,
            tint: col,
          }).setDepth(7);
          this.activeEmitters.add(particles);
        } catch (e) {}

        // Animation Tween
        this.runManagedTween({
          targets: [beamOuter, beamMain, beamCore],
          width: distance,
          duration: type === "masenko" ? 100 : 200,
          ease: "Power2",
          onUpdate: () => {
            if (!this.scene.scene.isActive()) return;

            const shakeAmt = vibrate ? 6 : 2;
            const jitterY = Phaser.Math.Between(-shakeAmt, shakeAmt);

            beamOuter.setPosition(hand.x, hand.y + jitterY);
            beamMain.setPosition(hand.x, hand.y + jitterY);
            beamCore.setPosition(hand.x, hand.y + jitterY / 2);

            const tipX = isP
              ? hand.x + beamMain.width
              : hand.x - beamMain.width;
            beamHeadGlow.setPosition(tipX, hand.y + jitterY);
            beamHead.setPosition(tipX, hand.y + jitterY);

            if (particles) {
              particles.setPosition(tipX, hand.y + jitterY);
            }
          },
          onComplete: () => {
            if (!this.scene.scene.isActive()) return;

            this.createImpactEffect(endX, hand.y, col, "beam");
            this.scene.takeDamage(!isP, dmg);
            if (particles) {
              try {
                if (particles.stop) particles.stop();
              } catch (e) {}
            }

            // Shockwave rings at impact
            for (let i = 0; i < 3; i++) {
              const ring = this.borrowCircle(endX, hand.y, 20);
              ring.isFilled = false;
              ring.setStrokeStyle(4 + size * 2, col);
              ring.setDepth(20);
              ring.setAlpha(0);
              ring.setBlendMode(Phaser.BlendModes.ADD);

              this.runManagedTween({
                targets: ring,
                scale: 4 + i * 1.5 + size,
                alpha: { start: 1, end: 0 },
                duration: 200 + i * 50,
                ease: "Cubic.easeOut",
                onComplete: () => this.circlePool.killAndHide(ring),
              });
            }

            // Fade Out & return to pool
            this.runManagedTween({
              targets: [beamOuter, beamMain, beamCore, beamHead, beamHeadGlow],
              alpha: 0,
              scaleY: 0,
              duration: 300,
              onComplete: () => {
                this.rectPool.killAndHide(beamOuter);
                this.rectPool.killAndHide(beamMain);
                this.rectPool.killAndHide(beamCore);
                this.circlePool.killAndHide(beamHead);
                this.circlePool.killAndHide(beamHeadGlow);

                if (particles) {
                  this.activeEmitters.delete(particles);
                  try { particles.destroy(); } catch (e) {}
                }
                this.scene.onSpecialComplete(isP);
              },
            });
          },
        });
      },
    });
  }

  // ==========================================
  // MINECRAFT JAVA STYLE SWORD SWEEP SLASH
  // ==========================================

  public createSwordSweepSlash(
    x: number,
    y: number,
    isPlayer: boolean,
    color: number = 0xffffff,
    scale: number = 1.0,
    isSpecial: boolean = false
  ) {
    if (!this.scene.scene.isActive()) return;

    const dir = isPlayer ? 1 : -1;
    const isPotato = this.scene.gameState?.settings?.lowPerformanceMode;
    const sweepScale = (isSpecial ? 1.4 : 1.0) * scale;
    const sweepDuration = isSpecial ? 220 : 175;

    // 1. Minecraft Java Sweep Arc Graphics (Multi-layered crescent swoosh)
    const sweepGraphics = this.borrowGraphics(x - dir * 20 * sweepScale, y);
    sweepGraphics.setDepth(28);

    // Orientation & Angles: Sweep curved blade wake
    const startAngle = dir > 0 ? -0.85 : Math.PI - 0.85;
    const endAngle = dir > 0 ? 0.85 : Math.PI + 0.85;
    const radius = 55 * sweepScale;

    // Outer glow / energy halo
    sweepGraphics.lineStyle(12 * sweepScale, color, 0.4);
    sweepGraphics.beginPath();
    sweepGraphics.arc(0, 0, radius, startAngle, endAngle, dir < 0);
    sweepGraphics.strokePath();

    // Mid sweep body (colored crescent trail)
    sweepGraphics.lineStyle(7 * sweepScale, color, 0.8);
    sweepGraphics.beginPath();
    sweepGraphics.arc(0, 0, radius - 2 * sweepScale, startAngle + 0.05, endAngle - 0.05, dir < 0);
    sweepGraphics.strokePath();

    // Core white cutting razor edge (signature bright blade trail)
    sweepGraphics.lineStyle(3.5 * sweepScale, 0xffffff, 1.0);
    sweepGraphics.beginPath();
    sweepGraphics.arc(0, 0, radius - 4 * sweepScale, startAngle + 0.1, endAngle - 0.1, dir < 0);
    sweepGraphics.strokePath();

    // Trailing echo swoosh (Minecraft sweep motion blur)
    sweepGraphics.lineStyle(4 * sweepScale, color, 0.35);
    sweepGraphics.beginPath();
    sweepGraphics.arc(-10 * dir * sweepScale, 0, radius * 0.8, startAngle + 0.15, endAngle - 0.15, dir < 0);
    sweepGraphics.strokePath();

    // Sharp crescent tips
    sweepGraphics.fillStyle(0xffffff, 0.9);
    const tipTopX = Math.cos(startAngle) * (radius - 4 * sweepScale);
    const tipTopY = Math.sin(startAngle) * (radius - 4 * sweepScale);
    const tipBotX = Math.cos(endAngle) * (radius - 4 * sweepScale);
    const tipBotY = Math.sin(endAngle) * (radius - 4 * sweepScale);
    sweepGraphics.fillCircle(tipTopX, tipTopY, 2.5 * sweepScale);
    sweepGraphics.fillCircle(tipBotX, tipBotY, 2.5 * sweepScale);

    // Initial scale and rapid forward sweep expansion
    sweepGraphics.setScale(0.4 * sweepScale, 0.7 * sweepScale);
    sweepGraphics.setAlpha(1);

    this.runManagedTween({
      targets: sweepGraphics,
      x: x + dir * 42 * sweepScale,
      scaleX: 1.55 * sweepScale,
      scaleY: 1.25 * sweepScale,
      alpha: 0,
      duration: sweepDuration,
      ease: "Cubic.easeOut",
      onComplete: () => this.graphicsPool.killAndHide(sweepGraphics),
    });

    // 2. Razor Cut Slice Line through Opponent
    const sliceLength = (isSpecial ? 120 : 80) * sweepScale;
    const sliceThick = (isSpecial ? 5 : 3.5) * sweepScale;
    const sliceLine = this.borrowRect(x, y, sliceLength, sliceThick, 0xffffff);
    sliceLine.setRotation(dir * 0.25).setDepth(29);

    this.runManagedTween({
      targets: sliceLine,
      scaleX: 1.6,
      scaleY: 0,
      alpha: 0,
      duration: sweepDuration - 20,
      ease: "Expo.easeOut",
      onComplete: () => this.rectPool.killAndHide(sliceLine),
    });

    // 3. Minecraft Sweep Pixel Particle Sparks
    const particleCount = isPotato ? (isSpecial ? 5 : 3) : (isSpecial ? 10 : 7);
    for (let i = 0; i < particleCount; i++) {
      const angleOffset = (i / (particleCount - 1) - 0.5) * 1.5;
      const baseAngle = dir > 0 ? angleOffset : Math.PI - angleOffset;
      const spawnDist = radius * 0.85;
      const px = x + Math.cos(baseAngle) * spawnDist;
      const py = y + Math.sin(baseAngle) * spawnDist;

      const pSize = Phaser.Math.Between(3, 5) * sweepScale;
      const pColor = i % 2 === 0 ? 0xffffff : color;
      const p = this.borrowRect(px, py, pSize, pSize, pColor);
      p.setDepth(30);

      const flyDist = Phaser.Math.Between(30, 75) * sweepScale;
      this.runManagedTween({
        targets: p,
        x: px + Math.cos(baseAngle) * flyDist,
        y: py + Math.sin(baseAngle) * flyDist + Phaser.Math.Between(-10, 10),
        scaleX: 0.2,
        scaleY: 0.2,
        alpha: 0,
        duration: Phaser.Math.Between(130, 210),
        ease: "Quad.easeOut",
        onComplete: () => this.rectPool.killAndHide(p),
      });
    }

    // 4. Secondary Cross-Slash for Special Sword Moves
    if (isSpecial) {
      const crossSweep = this.borrowGraphics(x - dir * 15 * sweepScale, y);
      crossSweep.setDepth(28);
      crossSweep.lineStyle(6 * sweepScale, 0xffffff, 0.9);
      crossSweep.beginPath();
      crossSweep.arc(0, 0, radius * 0.9, endAngle, startAngle, dir > 0);
      crossSweep.strokePath();
      crossSweep.setScale(0.4 * sweepScale, 0.6 * sweepScale);

      this.runManagedTween({
        targets: crossSweep,
        x: x + dir * 35 * sweepScale,
        scaleX: 1.4 * sweepScale,
        scaleY: 1.1 * sweepScale,
        alpha: 0,
        duration: sweepDuration,
        ease: "Cubic.easeOut",
        onComplete: () => this.graphicsPool.killAndHide(crossSweep),
      });
    }
  }

  public playMeleeHitEffect(
    target: Phaser.GameObjects.Sprite,
    isPlayer: boolean,
    slashColor: number | null,
    isComboFinisher: boolean,
    damage: number,
    onComplete?: () => void
  ) {
    if (slashColor !== null) {
      this.createSwordSweepSlash(target.x, target.y + 60, isPlayer, slashColor, isComboFinisher ? 1.4 : 1.15);
    }
    this.scene.createImpactEffect(target.x, target.y + 60, 0xffffff, "melee", damage);

    // Target hit flash
    this.scene.tweens.add({
      targets: target,
      alpha: 0.5,
      yoyo: true,
      duration: 50,
      repeat: 1,
    });

    // Knockback Target
    const knockbackDist = isComboFinisher
      ? isPlayer
        ? 80
        : -80
      : isPlayer
        ? 30
        : -30;
    this.scene.tweens.add({
      targets: target,
      x: target.x + knockbackDist,
      duration: 100,
      yoyo: true,
      ease: "Sine.easeOut",
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });
  }

  // ==========================================
  // CLEANUP & LIFECYCLE MANAGEMENT
  // ==========================================

  /**
   * Reseta todos os efeitos ativos e retorna todos os GameObjects para suas pools
   */
  // ==========================================
  // GHOSTING & AFTERIMAGE EFFECTS
  // ==========================================

  /**
   * Cria um único rastro fantasma (afterimage / ghost) para o sprite do personagem
   */
  public createGhostingAfterimage(
    sprite: Phaser.GameObjects.Sprite,
    options: {
      color?: number;
      alpha?: number;
      duration?: number;
      scaleXMult?: number;
      scaleYMult?: number;
      offsetX?: number;
      offsetY?: number;
      blendMode?: Phaser.BlendModes | number;
      useTintFill?: boolean;
    } = {}
  ): Phaser.GameObjects.Sprite | null {
    if (!this.scene.scene.isActive() || !sprite || !sprite.active || !sprite.texture) return null;

    const isPotato = this.scene.gameState?.settings?.lowPerformanceMode;
    const color = options.color ?? 0x00ffff;
    const initialAlpha = options.alpha ?? (isPotato ? 0.45 : 0.65);
    const duration = options.duration ?? 280;
    const scaleXMult = options.scaleXMult ?? 1.05;
    const scaleYMult = options.scaleYMult ?? 0.98;
    const offsetX = options.offsetX ?? 0;
    const offsetY = options.offsetY ?? 0;
    const useTintFill = options.useTintFill !== undefined ? options.useTintFill : true;

    try {
      const ghost = this.scene.add
        .sprite(sprite.x + offsetX, sprite.y + offsetY, sprite.texture.key, sprite.frame.name)
        .setOrigin(sprite.originX, sprite.originY)
        .setScale(sprite.scaleX * scaleXMult, sprite.scaleY * scaleYMult)
        .setFlipX(sprite.flipX)
        .setRotation(sprite.rotation)
        .setAlpha(initialAlpha)
        .setDepth(Math.max(1, sprite.depth - 1));

      if (options.blendMode !== undefined) {
        ghost.setBlendMode(options.blendMode);
      } else if (!isPotato) {
        ghost.setBlendMode(Phaser.BlendModes.ADD);
      }

      if (useTintFill) {
        ghost.setTintFill(color);
      } else {
        ghost.setTint(color);
      }

      const tween = this.scene.tweens.add({
        targets: ghost,
        alpha: 0,
        scaleX: ghost.scaleX * 1.15,
        scaleY: ghost.scaleY * 0.92,
        duration: duration,
        ease: "Cubic.easeOut",
        onComplete: () => {
          this.activeTweens.delete(tween);
          ghost.destroy();
        },
      });

      this.activeTweens.add(tween);
      return ghost;
    } catch (e) {
      return null;
    }
  }

  /**
   * Cria um rastro contínuo de fantasmas (dash ghost trail) durante movimento rápido
   */
  public createSpeedDashTrail(
    sprite: Phaser.GameObjects.Sprite,
    color: number,
    direction: number,
    count: number = 7,
    intervalMs: number = 28
  ) {
    if (!this.scene.scene.isActive() || !sprite || !sprite.active) return;
    const isPotato = this.scene.gameState?.settings?.lowPerformanceMode;
    const actualCount = isPotato ? Math.min(count, 3) : count;
    const actualInterval = isPotato ? Math.max(intervalMs, 45) : intervalMs;

    let emitted = 0;
    const timer = this.scene.time.addEvent({
      delay: actualInterval,
      repeat: actualCount - 1,
      callback: () => {
        if (!this.scene.scene.isActive() || !sprite.active) {
          timer.remove();
          return;
        }
        emitted++;

        // Alterna entre tom primário e brilho esbranquiçado/neon
        const ghostColor = emitted % 2 === 0 ? color : 0xffffff;
        const offsetSpeed = (emitted * 4) * -direction;

        this.createGhostingAfterimage(sprite, {
          color: ghostColor,
          alpha: 0.65 - emitted * 0.05,
          duration: 260 + emitted * 25,
          scaleXMult: 1.12,
          scaleYMult: 0.95,
          offsetX: offsetSpeed,
          useTintFill: emitted % 3 !== 0,
        });

        // Partículas de poeira e faíscas de velocidade
        if (!isPotato && emitted % 2 === 0) {
          const spark = this.borrowCircle(
            sprite.x + Phaser.Math.Between(-15, 15) - direction * 20,
            sprite.y + Phaser.Math.Between(-20, 60),
            Phaser.Math.Between(2, 4),
            color,
            0.8
          );
          spark.setDepth(sprite.depth - 2);
          this.scene.tweens.add({
            targets: spark,
            x: spark.x - direction * Phaser.Math.Between(20, 50),
            alpha: 0,
            scale: 0.2,
            duration: 220,
            onComplete: () => this.recycle(spark),
          });
        }
      },
    });
  }

  /**
   * Efeito cinematográfico de rastro de esquiva perfeita (Perfect Dodge Ghosting)
   */
  public createPerfectDodgeGhosting(
    target: Phaser.GameObjects.Sprite,
    characterSpecialColor: number = 0x00ff88
  ) {
    if (!this.scene.scene.isActive() || !target || !target.active) return;
    const isPotato = this.scene.gameState?.settings?.lowPerformanceMode;
    const dodgeDirection = target.flipX ? 1 : -1;

    // Paleta em degradê de esquiva ágil (Emerald / Cyan / Aura Color / White)
    const trailColors = isPotato
      ? [0x00ff88, characterSpecialColor, 0xffffff]
      : [0x00ff88, characterSpecialColor, 0x00f5d4, 0x55efc4, 0xffffff];

    // 1. Múltiplas camadas de fantasmas desfasados espacialmente
    trailColors.forEach((ghostColor, index) => {
      const offsetDist = (index + 1) * (isPotato ? 24 : 20) * dodgeDirection;
      const ghost = this.createGhostingAfterimage(target, {
        color: ghostColor,
        alpha: 0.85 - index * 0.12,
        duration: 240 + index * 60,
        scaleXMult: 1.25 + index * 0.05,
        scaleYMult: 0.92,
        offsetX: offsetDist,
        useTintFill: index !== 0,
      });

      if (ghost) {
        this.scene.tweens.add({
          targets: ghost,
          x: ghost.x + (index + 1) * 14 * dodgeDirection,
          alpha: 0,
          scaleX: ghost.scaleX * 1.3,
          scaleY: ghost.scaleY * 0.88,
          duration: 260 + index * 50,
          ease: "Cubic.easeOut",
        });
      }
    });

    // 2. Phasing Flicker no sprite principal (brilho de fase instantâneo)
    target.setAlpha(0.35);
    target.setTintFill(0x00ff88);
    this.scene.time.delayedCall(45, () => {
      if (target && target.active) {
        target.setAlpha(0.75);
        target.setTint(characterSpecialColor);
        this.scene.time.delayedCall(70, () => {
          if (target && target.active) {
            target.setAlpha(1.0);
            target.clearTint();
          }
        });
      }
    });

    // 3. Linhas de vácuo / Speed Streaks
    if (!isPotato) {
      for (let s = 0; s < 4; s++) {
        const streakY = target.y + Phaser.Math.Between(-30, 50);
        const streakGraphics = this.borrowGraphics(0, 0).setDepth(target.depth + 1);
        streakGraphics.lineStyle(3, 0x00ff88, 0.9);
        streakGraphics.beginPath();
        const startX = target.x - dodgeDirection * 45;
        const endX = target.x + dodgeDirection * 85;
        streakGraphics.moveTo(startX, streakY);
        streakGraphics.lineTo(endX, streakY);
        streakGraphics.strokePath();

        this.scene.tweens.add({
          targets: streakGraphics,
          alpha: 0,
          duration: 220 + s * 40,
          onComplete: () => this.recycle(streakGraphics),
        });
      }

      // Anel de choque de esquiva instantânea
      const shockRing = this.borrowCircle(target.x, target.y + 30, 15);
      shockRing.setStrokeStyle(3, 0x00ff88, 0.9).setFillStyle(0x00ff88, 0.2).setDepth(target.depth - 2);
      this.scene.tweens.add({
        targets: shockRing,
        radius: 65,
        alpha: 0,
        duration: 320,
        ease: "Cubic.easeOut",
        onComplete: () => this.recycle(shockRing),
      });
    }
  }

  public clearAll() {
    // Kill active managed tweens
    this.activeTweens.forEach((tw) => {
      try {
        if (tw && tw.stop) tw.stop();
      } catch (e) {}
    });
    this.activeTweens.clear();

    // Destroy/clear active particle emitters
    this.activeEmitters.forEach((em) => {
      try {
        em.destroy();
      } catch (e) {}
    });
    this.activeEmitters.clear();

    // Hide & deactivate all pooled items
    const pools = [this.flashPool, this.circlePool, this.rectPool, this.textPool, this.graphicsPool];
    pools.forEach((pool) => {
      if (pool) {
        pool.getChildren().forEach((child) => {
          this.scene.tweens.killTweensOf(child);
          if ('setActive' in child && typeof (child as any).setActive === 'function') {
            (child as any).setActive(false).setVisible(false);
          }
        });
      }
    });
  }

  /**
   * Destrói completamente as pools ao descarregar a cena
   */
  public destroy() {
    this.clearAll();

    if (this.flashPool) {
      try { this.flashPool.destroy(true); } catch (e) {}
    }
    if (this.circlePool) {
      try { this.circlePool.destroy(true); } catch (e) {}
    }
    if (this.rectPool) {
      try { this.rectPool.destroy(true); } catch (e) {}
    }
    if (this.textPool) {
      try { this.textPool.destroy(true); } catch (e) {}
    }
    if (this.graphicsPool) {
      try { this.graphicsPool.destroy(true); } catch (e) {}
    }
  }
}
