import Phaser from "phaser";
import { Fighter } from "./base/Fighter";
import { AttackParams, AttackResult } from "./base/FighterTypes";

export class PiccoloFighter extends Fighter {
  readonly key = "piccolo";
  readonly specialName = "MAKANKOSAPPO";
  readonly superName = "HELLZONE GRENADE";
  readonly specialColor = 0xffaa00;

  performAttack(params: AttackParams): AttackResult {
    const {
      scene,
      attacker,
      defender: target,
      isPlayer,
      attackType,
      isComboFinisher,
      transformLevel,
    } = params;
    const bs = scene as any;
    const startX = attacker.x;
    const startY = attacker.y;

    if (attackType === "melee") {
      // Piccolo Melee: Stretchy arm
      attacker.play(bs.getAnimKey("piccolo", transformLevel, "attack"));

      const hand = bs.getHandPosition(isPlayer);
      const arm = bs.add
        .rectangle(hand.x, hand.y, 0, 8, 0x228b22)
        .setOrigin(isPlayer ? 0 : 1, 0.5)
        .setDepth(4);

      bs.tweens.add({
        targets: arm,
        width: Math.abs(target.x - attacker.x) - 20,
        duration: 100,
        onComplete: () => {
          if (!bs.scene.isActive()) return;
          if (bs.soundManager) bs.soundManager.playPunchImpact(true);
          bs.createImpactEffect(target.x, target.y + 120, 0xffffff);
          bs.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 18 : 10) *
                bs.getDamageMultiplier(transformLevel),
            ),
          );

          bs.tweens.add({
            targets: arm,
            width: 0,
            duration: 100,
            delay: 50,
            onComplete: () => {
              arm.destroy();
              attacker.play(bs.getAnimKey("piccolo", transformLevel, "idle"));
              bs.setActionState(isPlayer, false);
            },
          });
        },
      });
    } else {
      // Piccolo Ki: Eye laser
      attacker.play(bs.getAnimKey("piccolo", transformLevel, "attack"));
      bs.time.delayedCall(50, () => {
        if (!bs.scene.isActive()) return;
        if (bs.soundManager) bs.soundManager.playBeamFire();

        const hand = bs.getHandPosition(isPlayer);
        const beam1 = bs.add
          .rectangle(
            hand.x,
            hand.y,
            Math.abs(target.x - attacker.x),
            2,
            0xff0000,
          )
          .setOrigin(isPlayer ? 0 : 1, 0.5)
          .setDepth(5);
        const beam2 = bs.add
          .rectangle(
            hand.x,
            hand.y,
            Math.abs(target.x - attacker.x),
            2,
            0xff0000,
          )
          .setOrigin(isPlayer ? 0 : 1, 0.5)
          .setDepth(5);

        bs.tweens.add({
          targets: [beam1, beam2],
          alpha: 0,
          duration: 150,
          onComplete: () => {
            beam1.destroy();
            beam2.destroy();
          },
        });

        bs.createImpactEffect(target.x, target.y + 120, 0xff0000);
        bs.takeDamage(
          !isPlayer,
          Math.floor(
            (isComboFinisher ? 15 : 8) * bs.getDamageMultiplier(transformLevel),
          ),
        );

        bs.time.delayedCall(100, () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("piccolo", transformLevel, "idle"));
          bs.setActionState(isPlayer, false);
        });
      });
    }

    return null as any;
  }

  performSpecial(params: AttackParams): AttackResult {
    const {
      scene,
      attacker,
      defender: target,
      isPlayer,
      transformLevel,
    } = params;
    const bs = scene as any;

    // specialMakanko(isPlayer, false)
    const baseDmg = 45;
    const dmg = Math.floor(baseDmg * bs.getDamageMultiplier(transformLevel));
    const hand = bs.getHandPosition(isPlayer);
    const endX = target.x;
    const distance = Math.abs(endX - hand.x) + 50;

    bs.log("MAKANKOSAPPO!");

    // Charge Effect
    const chargeCore = bs.add.circle(hand.x, hand.y, 2, 0xffffff).setDepth(16);
    const chargeGlow = bs.add
      .circle(hand.x, hand.y, 5, 0xffaa00)
      .setDepth(15)
      .setBlendMode(Phaser.BlendModes.ADD);

    bs.cameras.main.shake(400, 0.01);

    // Gathering particles
    const gatherParticles = bs.add
      .particles(0, 0, "particle", {
        x: hand.x,
        y: hand.y,
        speed: { min: -100, max: 100 },
        scale: { start: 0.6, end: 0 },
        blendMode: "ADD",
        lifespan: 300,
        tint: 0xffaa00,
        gravityY: 0,
      })
      .setDepth(14);

    bs.tweens.add({
      targets: [chargeCore, chargeGlow],
      scale: 10,
      alpha: { start: 1, end: 0.8 },
      duration: 400,
      yoyo: true,
      repeat: 0,
      onComplete: () => {
        if (!bs.scene.isActive()) return;
        chargeCore.destroy();
        chargeGlow.destroy();
        gatherParticles.destroy();

        bs.createScreenFlash(0xffaa00, 200, 0.6);
        bs.cameras.main.shake(300, 0.03);

        const originX = 0;

        // Thicker central beam
        const coreGlow = bs.add
          .rectangle(hand.x, hand.y, 0, 20, 0xffaa00)
          .setOrigin(originX, 0.5)
          .setDepth(4)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.6);
        const core = bs.add
          .rectangle(hand.x, hand.y, 0, 10, 0xffff00)
          .setOrigin(originX, 0.5)
          .setDepth(5)
          .setBlendMode(Phaser.BlendModes.ADD);
        coreGlow.scaleX = isPlayer ? 1 : -1;
        core.scaleX = isPlayer ? 1 : -1;

        // Two separate graphics for the double helix
        const spiral1 = bs.add
          .graphics()
          .setDepth(6)
          .setBlendMode(Phaser.BlendModes.ADD);
        const spiral2 = bs.add
          .graphics()
          .setDepth(6)
          .setBlendMode(Phaser.BlendModes.ADD);

        const muzzle = bs.add
          .circle(hand.x, hand.y, 30, 0xffff00)
          .setDepth(7)
          .setBlendMode(Phaser.BlendModes.ADD);
        bs.tweens.add({
          targets: muzzle,
          scale: 2,
          alpha: 0,
          duration: 200,
          repeat: 1,
        });

        if (bs.soundManager) bs.soundManager.playBeamFire();

        bs.tweens.add({
          targets: [core, coreGlow],
          width: distance,
          duration: 250,
          onUpdate: () => {
            if (!bs.scene.isActive()) return;

            spiral1.clear();
            spiral2.clear();
            spiral1.lineStyle(6, 0xffaa00, 0.9); // Orange tint
            spiral2.lineStyle(6, 0xffd700, 0.9); // Gold tint

            const currentW = core.width;

            // Double Helix Math
            const freq = 0.08;
            const amp = 25;
            const speed = bs.time.now * 0.03;

            spiral1.beginPath();
            spiral2.beginPath();

            for (let i = 0; i < currentW; i += 5) {
              const angle = i * freq + speed;
              const sx = isPlayer ? hand.x + i : hand.x - i;

              // Spiral 1 (Sine)
              const sy1 = hand.y + Math.sin(angle) * amp;
              if (i === 0) spiral1.moveTo(sx, sy1);
              else spiral1.lineTo(sx, sy1);

              // Spiral 2 (Cosine / Opposite)
              const sy2 = hand.y + Math.sin(angle + Math.PI) * amp; // Phase shift PI
              if (i === 0) spiral2.moveTo(sx, sy2);
              else spiral2.lineTo(sx, sy2);
            }
            spiral1.strokePath();
            spiral2.strokePath();
          },
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            bs.createScreenFlash(0xffaa00, 500, 1);
            bs.cameras.main.shake(800, 0.08);
            bs.createImpactEffect(endX, hand.y, 0xffaa00, "beam");
            bs.takeDamage(!isPlayer, dmg);

            // Shockwave rings at impact
            for (let i = 0; i < 5; i++) {
              const ring = bs.add
                .circle(endX, hand.y, 40, 0xffaa00)
                .setStrokeStyle(10, 0xffaa00)
                .setDepth(20)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              ring.isFilled = false;
              bs.tweens.add({
                targets: ring,
                scale: 10 + i * 5,
                alpha: { start: 1, end: 0 },
                duration: 400 + i * 100,
                ease: "Cubic.easeOut",
                onComplete: () => ring.destroy(),
              });
            }

            bs.tweens.add({
              targets: [core, coreGlow, spiral1, spiral2, muzzle],
              alpha: 0,
              duration: 250,
              onComplete: () => {
                if (bs.scene.isActive()) {
                  core.destroy();
                  coreGlow.destroy();
                  spiral1.destroy();
                  spiral2.destroy();
                  muzzle.destroy();
                  bs.onSpecialComplete(isPlayer);
                }
              },
            });
          },
        });
      },
    });

    return null as any;
  }

  performSuper(params: AttackParams): AttackResult {
    const {
      scene,
      attacker,
      defender: target,
      isPlayer,
      transformLevel,
    } = params;
    const bs = scene as any;

    // specialHellzoneGrenade
    const dmg = Math.floor(105 * bs.getDamageMultiplier(transformLevel));

    bs.log("HELLZONE GRENADE!");
    if (bs.soundManager) bs.soundManager.playBeamFire();

    const orbs: any[] = [];
    const orbCount = 16;
    for (let i = 0; i < orbCount; i++) {
      const angle = (i / orbCount) * Math.PI * 2;
      const dist = 200;
      const ox = target.x + Math.cos(angle) * dist;
      const oy = target.y - 50 + Math.sin(angle) * dist;

      const orbGlow = bs.add
        .circle(ox, oy, 25, 0xffff00)
        .setDepth(14)
        .setAlpha(0)
        .setBlendMode(Phaser.BlendModes.ADD);
      const orb = bs.add.circle(ox, oy, 12, 0xffffff).setDepth(15).setAlpha(0);

      orbs.push({ orb, orbGlow });

      bs.tweens.add({
        targets: [orb, orbGlow],
        alpha: 1,
        duration: 400,
        delay: i * 40,
      });

      // Orbiting effect
      bs.tweens.add({
        targets: [orb, orbGlow],
        x: target.x + Math.cos(angle + Math.PI) * dist,
        y: target.y - 50 + Math.sin(angle + Math.PI) * dist,
        duration: 1000,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });
    }

    bs.time.delayedCall(1200, () => {
      if (!bs.scene.isActive()) return;

      bs.cameras.main.shake(400, 0.03);

      orbs.forEach((o, i) => {
        bs.tweens.killTweensOf([o.orb, o.orbGlow]); // Stop orbiting

        // Trail
        const trail = bs.add
          .particles(0, 0, "particle", {
            follow: o.orb,
            scale: { start: 1.0, end: 0 },
            lifespan: 250,
            tint: 0xffff00,
            blendMode: "ADD",
          })
          .setDepth(13);

        bs.tweens.add({
          targets: [o.orb, o.orbGlow],
          x: target.x + Phaser.Math.Between(-30, 30),
          y: target.y + 120 + Phaser.Math.Between(-30, 30),
          duration: 350,
          delay: i * 30,
          ease: "Back.easeIn",
          onComplete: () => {
            if (!bs.scene.isActive()) return;

            // Small explosion for each orb
            const exp = bs.add
              .circle(o.orb.x, o.orb.y, 20, 0xffff00)
              .setDepth(16)
              .setBlendMode(Phaser.BlendModes.ADD);
            bs.tweens.add({
              targets: exp,
              scale: 4,
              alpha: 0,
              duration: 250,
              onComplete: () => exp.destroy(),
            });

            bs.createImpactEffect(o.orb.x, o.orb.y, 0xffff00, "melee");
            bs.cameras.main.shake(100, 0.02);

            if (i === orbs.length - 1) {
              bs.createScreenFlash(0xffff00, 400, 0.9);
              bs.cameras.main.shake(800, 0.08);

              // Shockwave rings
              for (let j = 0; j < 5; j++) {
                const ring = bs.add
                  .circle(target.x, target.y + 120, 40, 0xffff00)
                  .setStrokeStyle(10, 0xffff00)
                  .setDepth(20)
                  .setAlpha(0)
                  .setBlendMode(Phaser.BlendModes.ADD);
                ring.isFilled = false;
                bs.tweens.add({
                  targets: ring,
                  scale: 8 + j * 4,
                  alpha: { start: 1, end: 0 },
                  duration: 400 + j * 120,
                  ease: "Cubic.easeOut",
                  onComplete: () => ring.destroy(),
                });
              }

              bs.createImpactEffect(target.x, target.y + 120, 0xffff00, "beam");
              bs.takeDamage(!isPlayer, dmg);
              bs.onSpecialComplete(isPlayer);
            }

            trail.stop();
            bs.time.delayedCall(250, () => trail.destroy());
            o.orb.destroy();
            o.orbGlow.destroy();
          },
        });
      });
    });

    return null as any;
  }

  performTransform(
    scene: Phaser.Scene,
    isPlayer: boolean,
    level: number,
  ): void {}
}
