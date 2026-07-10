import Phaser from "phaser";
import type BattleScene from "../scenes/BattleScene";

export class BattleEffects {
  scene: BattleScene;

  constructor(scene: BattleScene) {
    this.scene = scene;
  }

  createScreenFlash(color: number, duration: number, alpha: number = 0.8) {
    const flash = this.scene.add
      .rectangle(480, 270, 960, 540, color)
      .setDepth(30)
      .setAlpha(alpha);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: duration,
      ease: "Power2",
      onComplete: () => flash.destroy(),
    });
  }
  public specialBeam(
    isP: boolean,
    isS: boolean,
    col: number,
    hasInner: boolean,
    vibrate: boolean,
    type: string,
  ) {
    const attacker = isP ? this.scene.player : this.scene.enemy;
    const target = isP ? this.scene.enemy : this.scene.player;
    const transLevel = isP
      ? this.scene.playerTransformLevel
      : this.scene.enemyTransformLevel;
    if (!attacker.active || !target.active) {
      this.scene.setActionState(isP, false);
      return;
    }

    const baseDmg = isS ? 60 : 35;
    const dmg = Math.floor(baseDmg * this.scene.getDamageMultiplier(transLevel));

    const size = isS ? 3.5 : 2.0;

    const hand = this.scene.getHandPosition(isP);
    const endX = target.x;
    const distance = Math.abs(endX - hand.x) + 50;

    if (this.scene.battleUI)
      this.scene.battleUI.showLog(isS ? "SUPER ATTACK!" : type.toUpperCase() + "!");
    if (this.scene.soundManager) this.scene.soundManager.playBeamCharge();

    // Charge Effect
    const chargeCore = this.scene.add
      .circle(hand.x, hand.y, 2, 0xffffff)
      .setDepth(16);
    const chargeGlow = this.scene.add
      .circle(hand.x, hand.y, 5, col)
      .setDepth(15)
      .setBlendMode(Phaser.BlendModes.ADD);

    if (this.scene.battleCamera) this.scene.battleCamera.shake(400, 0.01);

    // Gathering particles
    const gatherParticles = this.scene.add
      .particles(0, 0, "particle", {
        x: hand.x,
        y: hand.y,
        speed: { min: -150, max: 150 },
        scale: { start: 0.8, end: 0 },
        blendMode: "ADD",
        lifespan: 300,
        tint: col,
        gravityY: 0,
      })
      .setDepth(14);

    this.scene.tweens.add({
      targets: [chargeCore, chargeGlow],
      scale: 12 * size,
      alpha: { start: 1, end: 0.8 },
      duration: 400,
      yoyo: true,
      repeat: 0,
      onComplete: () => {
        if (!this.scene.scene.isActive()) return;
        if (this.scene.soundManager) this.scene.soundManager.playBeamFire();
        chargeCore.destroy();
        chargeGlow.destroy();
        gatherParticles.destroy();

        this.createScreenFlash(col, 200, 0.6);
        if (this.scene.battleCamera) this.scene.battleCamera.shake(300, 0.03);

        // The Beam Structure
        const originX = 0;

        // Outer Glow
        const beamOuter = this.scene.add
          .rectangle(hand.x, hand.y, 0, 40 * size, col)
          .setOrigin(originX, 0.5)
          .setDepth(4)
          .setAlpha(0.6)
          .setBlendMode(Phaser.BlendModes.ADD);
        // Main Color Beam
        const beamMain = this.scene.add
          .rectangle(hand.x, hand.y, 0, 24 * size, col)
          .setOrigin(originX, 0.5)
          .setDepth(5)
          .setAlpha(0.9)
          .setBlendMode(Phaser.BlendModes.ADD);
        // Inner Core (White/Bright)
        const beamCore = this.scene.add
          .rectangle(hand.x, hand.y, 0, 12 * size, 0xffffff)
          .setOrigin(originX, 0.5)
          .setDepth(6);

        beamOuter.scaleX = isP ? 1 : -1;
        beamMain.scaleX = isP ? 1 : -1;
        beamCore.scaleX = isP ? 1 : -1;

        // Beam Head/Tip
        const beamHeadGlow = this.scene.add
          .circle(hand.x, hand.y, 30 * size, col)
          .setDepth(5)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.8);
        const beamHead = this.scene.add
          .circle(hand.x, hand.y, 15 * size, 0xffffff)
          .setDepth(6);

        // Particles Emitter for Beam
        const particles = this.scene.add
          .particles(0, 0, "particle", {
            speed: { min: 50, max: 200 },
            angle: { min: isP ? 160 : -20, max: isP ? 200 : 20 },
            scale: { start: 0.8 * size, end: 0 },
            blendMode: "ADD",
            lifespan: 300,
            tint: col,
          })
          .setDepth(7);

        // Animation
        this.scene.tweens.add({
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

            // Tip Position
            const tipX = isP
              ? hand.x + beamMain.width
              : hand.x - beamMain.width;
            beamHeadGlow.setPosition(tipX, hand.y + jitterY);
            beamHead.setPosition(tipX, hand.y + jitterY);

            // Particle Emitter follows tip
            particles.setPosition(tipX, hand.y + jitterY);
          },
          onComplete: () => {
            if (!this.scene.scene.isActive()) return;

            this.scene.createImpactEffect(endX, hand.y, col, "beam");
            this.scene.takeDamage(!isP, dmg);
            particles.stop();

            // Shockwave rings at impact
            for (let i = 0; i < 3; i++) {
              const ring = this.scene.add
                .circle(endX, hand.y, 20, col)
                .setStrokeStyle(4 + size * 2, col)
                .setDepth(20)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              ring.isFilled = false;
              this.scene.tweens.add({
                targets: ring,
                scale: 4 + i * 1.5 + size,
                alpha: { start: 1, end: 0 },
                duration: 200 + i * 50,
                ease: "Cubic.easeOut",
                onComplete: () => ring.destroy(),
              });
            }

            // Fade Out
            this.scene.tweens.add({
              targets: [beamOuter, beamMain, beamCore, beamHead, beamHeadGlow],
              alpha: 0,
              scaleY: 0,
              duration: 300,
              onComplete: () => {
                beamOuter.destroy();
                beamMain.destroy();
                beamCore.destroy();
                beamHead.destroy();
                beamHeadGlow.destroy();
                particles.destroy();
                this.scene.onSpecialComplete(isP);
              },
            });
          },
        });
      },
    });
  }


}
