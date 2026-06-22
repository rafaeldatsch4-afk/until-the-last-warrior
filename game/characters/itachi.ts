import Phaser from "phaser";
import { Fighter } from "./base/Fighter";
import { AttackParams, AttackResult } from "./base/FighterTypes";

export class ItachiFighter extends Fighter {
  readonly key = "itachi";
  readonly specialName = "AMATERASU";
  readonly superName = "TSUKUYOMI";
  readonly specialColor = 0xff0000;

  performTransform(scene: any, isPlayer: boolean): void {
    // Basic transform is handled by the overall BattleScene sequence
  }

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

    if (attackType === "melee") {
      // Itachi Melee: Kunai slash
      attacker.play(bs.getAnimKey("itachi", transformLevel, "attack"));

      // Dash forward
      bs.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 100,
        ease: "Power2",
        onComplete: () => {
          if (!bs.scene.isActive()) return;

          if (bs.soundManager) bs.soundManager.playPunchImpact(true);

          const hitColor = transformLevel === 1 ? 0xff4500 : 0xcccccc; // Susanoo sword or kunai
          const hitLine = bs.add
            .rectangle(target.x, target.y + 120, 50, 4, hitColor)
            .setRotation(isPlayer ? 0.8 : -0.8)
            .setDepth(6);
          bs.tweens.add({
            targets: hitLine,
            alpha: 0,
            scaleX: 1.5,
            duration: 150,
            onComplete: () => hitLine.destroy(),
          });

          bs.createImpactEffect(target.x, target.y + 120, hitColor);
          bs.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 22 : 12) *
                bs.getDamageMultiplier(transformLevel),
            ),
          );
          bs.cameras.main.shake(100, 0.01);

          bs.time.delayedCall(200, () => {
            if (!bs.scene.isActive()) return;

            // Dash back
            bs.tweens.add({
              targets: attacker,
              x: startX,
              duration: 150,
              ease: "Power2",
              onComplete: () => {
                attacker.play(bs.getAnimKey("itachi", transformLevel, "idle"));
                bs.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // Itachi Ki: Fireball (Katon)
      attacker.play(bs.getAnimKey("itachi", transformLevel, "attack"));

      bs.time.delayedCall(100, () => {
        if (!bs.scene.isActive()) return;
        if (bs.soundManager) bs.soundManager.playBeamFire();

        const fireballColor = transformLevel === 1 ? 0xff4500 : 0xff8c00; // Susanoo fire or normal fire
        const hand = bs.getHandPosition(isPlayer);
        const fireball = bs.add
          .circle(hand.x, hand.y, 15, fireballColor)
          .setDepth(5);

        // Add some fire particles/glow
        const glow = bs.add
          .circle(fireball.x, fireball.y, 25, 0xff0000, 0.5)
          .setDepth(4);

        bs.tweens.add({
          targets: [fireball, glow],
          x: target.x,
          duration: 300,
          ease: "Power1",
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            fireball.destroy();
            glow.destroy();

            if (bs.soundManager) bs.soundManager.playExplosion(true);
            bs.createImpactEffect(target.x, target.y + 120, fireballColor);
            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 20 : 10) *
                  bs.getDamageMultiplier(transformLevel),
              ),
            );

            // Fire explosion effect
            const explosion = bs.add
              .circle(target.x, target.y + 120, 10, 0xff0000)
              .setDepth(6);
            bs.tweens.add({
              targets: explosion,
              scale: 4,
              alpha: 0,
              duration: 200,
              onComplete: () => explosion.destroy(),
            });
          },
        });

        bs.time.delayedCall(400, () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("itachi", transformLevel, "idle"));
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

    // specialAmaterasu
    const dmg = Math.floor(40 * bs.getDamageMultiplier(transformLevel));

    bs.log("AMATERASU!");
    attacker.play(bs.getAnimKey("itachi", transformLevel, "attack"));
    if (bs.soundManager) bs.soundManager.playBeamFire();

    // Eye bleeding effect on attacker (Itachi)
    const eyeBleed = bs.add
      .rectangle(
        attacker.x + (isPlayer ? 5 : -5),
        attacker.y - 25,
        2,
        10,
        0xff0000,
      )
      .setDepth(15);
    bs.tweens.add({
      targets: eyeBleed,
      scaleY: 3,
      alpha: 0,
      duration: 800,
      ease: "Sine.easeIn",
      onComplete: () => eyeBleed.destroy(),
    });

    // Screen darkens slightly
    const darkOverlay = bs.add
      .rectangle(480, 270, 960, 540, 0x000000, 0)
      .setDepth(13);
    bs.tweens.add({
      targets: darkOverlay,
      fillAlpha: 0.5,
      duration: 300,
      yoyo: true,
      hold: 1000,
    });

    // Black fire on target
    const fireGlow = bs.add
      .circle(target.x, target.y + 120, 60, 0x8b0000)
      .setDepth(14)
      .setAlpha(0.6)
      .setBlendMode(Phaser.BlendModes.ADD);
    const fire = bs.add
      .circle(target.x, target.y + 120, 30, 0x000000)
      .setDepth(15)
      .setAlpha(0.9);

    // Black fire particles
    const particles = bs.add
      .particles(0, 0, "particle", {
        color: [0x000000, 0x8b0000],
        colorEase: "quad.out",
        lifespan: 800,
        angle: { min: 240, max: 300 },
        scale: { start: 1.5, end: 0 },
        speed: { min: 100, max: 250 },
        blendMode: "NORMAL",
      })
      .setDepth(16);
    particles.startFollow(fire);

    bs.cameras.main.shake(1000, 0.02);

    bs.tweens.add({
      targets: [fire, fireGlow],
      scale: 3.5,
      yoyo: true,
      repeat: 3,
      duration: 250,
      onComplete: () => {
        fire.destroy();
        fireGlow.destroy();
        particles.stop();
        bs.time.delayedCall(800, () => particles.destroy());
      },
    });

    bs.time.delayedCall(1000, () => {
      if (!bs.scene.isActive()) return;
      if (bs.soundManager) bs.soundManager.playExplosion(true);

      bs.createScreenFlash(0x8b0000, 500, 1);
      bs.createImpactEffect(target.x, target.y + 120, 0x000000, "beam");

      // Shockwave rings
      for (let i = 0; i < 5; i++) {
        const ring = bs.add
          .circle(target.x, target.y + 120, 40, 0x8b0000)
          .setStrokeStyle(12, 0x8b0000)
          .setDepth(20)
          .setAlpha(0)
          .setBlendMode(Phaser.BlendModes.ADD);
        ring.isFilled = false;
        bs.tweens.add({
          targets: ring,
          scale: 12 + i * 6,
          alpha: { start: 1, end: 0 },
          duration: 500 + i * 150,
          ease: "Cubic.easeOut",
          onComplete: () => ring.destroy(),
        });
      }

      bs.takeDamage(!isPlayer, dmg);
      bs.cameras.main.shake(1000, 0.1);

      bs.time.delayedCall(300, () => {
        darkOverlay.destroy();
        bs.onSpecialComplete(isPlayer);
      });
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

    // specialTsukuyomi
    const dmg = Math.floor(100 * bs.getDamageMultiplier(transformLevel));

    bs.log("TSUKUYOMI!");
    attacker.play(bs.getAnimKey("itachi", transformLevel, "attack"));
    if (bs.soundManager) bs.soundManager.playBeamFire();

    // Screen turns red/black
    const bg = bs.add
      .rectangle(480, 270, 960, 540, 0x8b0000)
      .setDepth(13)
      .setAlpha(0);

    bs.tweens.add({
      targets: bg,
      alpha: 0.9,
      duration: 300,
      onComplete: () => {
        // Giant Sharingan eye in background
        const eyeGlow = bs.add
          .circle(480, 270, 200, 0xff0000)
          .setDepth(13)
          .setAlpha(0)
          .setBlendMode(Phaser.BlendModes.ADD);
        const eye = bs.add
          .circle(480, 270, 150, 0xff0000)
          .setDepth(14)
          .setAlpha(0);
        const pupil = bs.add
          .circle(480, 270, 30, 0x000000)
          .setDepth(14)
          .setAlpha(0);

        // Tomoe
        const tomoes: Phaser.GameObjects.Graphics[] = [];
        for (let i = 0; i < 3; i++) {
          const t = bs.add.graphics().setDepth(14).setAlpha(0);
          t.fillStyle(0x000000, 1);
          t.fillCircle(0, 0, 15);
          t.setPosition(
            480 + Math.cos((i * Math.PI * 2) / 3) * 80,
            270 + Math.sin((i * Math.PI * 2) / 3) * 80,
          );
          tomoes.push(t);
        }

        // Invert colors effect
        // We can't easily invert colors with standard Phaser without a custom pipeline,
        // so we'll simulate it with a strong flash and color overlay
        bs.createScreenFlash(0xffffff, 300, 0.9);
        bs.cameras.main.shake(1000, 0.02);

        bs.tweens.add({
          targets: [eye, pupil, eyeGlow, ...tomoes],
          alpha: 0.9,
          scale: 1.8,
          duration: 500,
          yoyo: true,
          hold: 1000,
          onUpdate: (tween: any) => {
            // Spin tomoes
            const progress = tween.getValue();
            tomoes.forEach((t: any, i: number) => {
              const angle = (i * Math.PI * 2) / 3 + progress * Math.PI * 6;
              t.setPosition(
                480 + Math.cos(angle) * 80 * progress,
                270 + Math.sin(angle) * 80 * progress,
              );
            });
          },
          onComplete: () => {
            eye.destroy();
            pupil.destroy();
            eyeGlow.destroy();
            tomoes.forEach((t: any) => t.destroy());

            bs.tweens.add({
              targets: bg,
              alpha: 0,
              duration: 300,
              onComplete: () => bg.destroy(),
            });

            if (bs.soundManager) bs.soundManager.playExplosion(true);

            // Multiple invisible slashes
            for (let i = 0; i < 8; i++) {
              bs.time.delayedCall(i * 80, () => {
                if (!bs.scene.isActive()) return;
                bs.createImpactEffect(
                  target.x + Phaser.Math.Between(-40, 40),
                  target.y + 120 + Phaser.Math.Between(-40, 40),
                  0x000000,
                  "melee",
                );
                bs.cameras.main.shake(150, 0.03);
              });
            }

            bs.time.delayedCall(700, () => {
              bs.createScreenFlash(0xffffff, 600, 1);
              bs.takeDamage(!isPlayer, dmg);
              bs.cameras.main.shake(1000, 0.1);

              // Shockwave rings
              for (let i = 0; i < 6; i++) {
                const ring = bs.add
                  .circle(target.x, target.y + 120, 50, 0x8b0000)
                  .setStrokeStyle(12, 0x8b0000)
                  .setDepth(20)
                  .setAlpha(0)
                  .setBlendMode(Phaser.BlendModes.ADD);
                ring.isFilled = false;
                bs.tweens.add({
                  targets: ring,
                  scale: 12 + i * 6,
                  alpha: { start: 1, end: 0 },
                  duration: 500 + i * 150,
                  ease: "Cubic.easeOut",
                  onComplete: () => ring.destroy(),
                });
              }

              bs.onSpecialComplete(isPlayer);
            });
          },
        });
      },
    });

    return null as any;
  }
}
