import Phaser from "phaser";
import { Fighter } from "./base/Fighter";
import { AttackParams, AttackResult } from "./base/FighterTypes";

export class JotaroFighter extends Fighter {
  readonly key = "jotaro";
  readonly specialName = "STAR FINGER";
  readonly superName = "ORA ORA ORA";
  readonly specialColor = 0x8a2be2;

  performTransform(scene: any, isPlayer: boolean): void {}

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
    const startX = attacker ? attacker.x : isPlayer ? bs.player.x : bs.enemy.x;
    const startY = attacker ? attacker.y : isPlayer ? bs.player.y : bs.enemy.y;
    const transLevel = transformLevel;

    if (attackType === "melee") {
      // Jotaro Melee: ORA punches
      attacker.play(bs.getAnimKey("jotaro", transLevel, "attack"));

      // Dash forward
      bs.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 100,
        ease: "Power2",
        onComplete: () => {
          if (!bs.scene.isActive()) return;

          if (bs.soundManager) bs.soundManager.playPunchImpact(true);

          // Multiple punch impacts for Star Platinum
          const hitColor = transLevel === 1 ? 0x8a2be2 : 0xcccccc;

          const createPunch = (delay: number, offsetY: number) => {
            bs.time.delayedCall(delay, () => {
              if (!bs.scene.isActive()) return;
              const hitCircle = bs.add
                .circle(
                  target.x + (Math.random() * 20 - 10),
                  target.y + 120 + offsetY,
                  15,
                  hitColor,
                )
                .setAlpha(0.7)
                .setDepth(6);
              bs.tweens.add({
                targets: hitCircle,
                alpha: 0,
                scale: 1.5,
                duration: 100,
                onComplete: () => hitCircle.destroy(),
              });
              bs.createImpactEffect(
                target.x,
                target.y + 120 + offsetY,
                hitColor,
              );
            });
          };

          createPunch(0, 0);
          if (transLevel === 1) {
            createPunch(50, -10);
            createPunch(100, 10);
          }

          bs.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 25 : 15) * bs.getDamageMultiplier(transLevel),
            ),
          );
          bs.cameras.main.shake(150, 0.015);

          bs.time.delayedCall(200, () => {
            if (!bs.scene.isActive()) return;

            // Dash back
            bs.tweens.add({
              targets: attacker,
              x: startX,
              duration: 150,
              ease: "Power2",
              onComplete: () => {
                if (bs.scene.isActive()) {
                  attacker.play(bs.getAnimKey("jotaro", transLevel, "idle"));
                  bs.setActionState(isPlayer, false);
                }
              },
            });
          });
        },
      });
    } else {
      // Jotaro Ki: Star Finger (or throwing something)
      attacker.play(bs.getAnimKey("jotaro", transLevel, "attack"));
      if (bs.cache.audio.exists("sfx_ki"))
        bs.sound.play("sfx_ki", { volume: 0.8 });

      const projectileColor = transLevel === 1 ? 0x8a2be2 : 0xcccccc;

      // Star Finger visual (elongated beam/finger)
      const hand = bs.getHandPosition(isPlayer);
      const projectile = bs.add
        .rectangle(hand.x, hand.y, 30, 6, projectileColor)
        .setDepth(5);

      bs.tweens.add({
        targets: projectile,
        x: target.x,
        duration: 300,
        ease: "Linear",
        onComplete: () => {
          if (!bs.scene.isActive()) return;
          projectile.destroy();
          bs.createImpactEffect(target.x, target.y + 120, projectileColor);
          if (bs.cache.audio.exists("sfx_hit"))
            if (bs.soundManager) bs.soundManager.playPunchImpact(false);
          bs.takeDamage(
            !isPlayer,
            Math.floor(12 * bs.getDamageMultiplier(transLevel)),
          );

          bs.time.delayedCall(200, () => {
            if (bs.scene.isActive()) {
              attacker.play(bs.getAnimKey("jotaro", transLevel, "idle"));
              bs.setActionState(isPlayer, false);
            }
          });
        },
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
    const transLevel = transformLevel;

    // specialStarFinger
    const dmg = Math.floor(45 * bs.getDamageMultiplier(transLevel));

    bs.log("STAR FINGER!");
    attacker.play(bs.getAnimKey("jotaro", transLevel, "attack"));
    if (bs.soundManager) bs.soundManager.playBeamFire();

    // Stand aura
    const aura = bs.add
      .circle(attacker.x, attacker.y + 120, 60, 0x8a2be2)
      .setDepth(8)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    bs.tweens.add({
      targets: aura,
      alpha: 0.6,
      scale: 1.5,
      duration: 200,
      yoyo: true,
    });

    // Elongated purple beam
    const hand = bs.getHandPosition(isPlayer);
    const fingerGlow = bs.add
      .rectangle(hand.x, hand.y, 20, 20, 0x8a2be2)
      .setDepth(14)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.6);
    const finger = bs.add
      .rectangle(hand.x, hand.y, 10, 10, 0x8a2be2)
      .setDepth(15);
    const fingerCore = bs.add
      .rectangle(hand.x, hand.y, 4, 4, 0xffffff)
      .setDepth(16);

    bs.tweens.add({
      targets: [finger, fingerCore, fingerGlow],
      x: target.x,
      scaleX: 40, // Stretch it out
      duration: 150,
      ease: "Power2",
      onComplete: () => {
        bs.createImpactEffect(target.x, target.y + 120, 0x8a2be2, "beam");

        // Piercing effect
        const pierce = bs.add
          .circle(target.x, target.y + 120, 30, 0xffffff)
          .setDepth(20)
          .setBlendMode(Phaser.BlendModes.ADD);
        bs.tweens.add({
          targets: pierce,
          scale: 4,
          alpha: 0,
          duration: 200,
          onComplete: () => pierce.destroy(),
        });

        // Shockwave rings
        for (let i = 0; i < 4; i++) {
          const ring = bs.add
            .circle(target.x, target.y + 120, 40, 0x8a2be2)
            .setStrokeStyle(10, 0x8a2be2)
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

        bs.takeDamage(!isPlayer, dmg);
        bs.cameras.main.shake(600, 0.08);
        bs.createScreenFlash(0x8a2be2, 400, 0.8);
        if (bs.cache.audio.exists("sfx_hit"))
          if (bs.soundManager) bs.soundManager.playPunchImpact(false);

        bs.tweens.add({
          targets: [finger, fingerCore, fingerGlow],
          alpha: 0,
          duration: 150,
          onComplete: () => {
            finger.destroy();
            fingerCore.destroy();
            fingerGlow.destroy();
            bs.onSpecialComplete(isPlayer);
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
    const transLevel = transformLevel;

    // specialOraOraOra
    const dmg = Math.floor(110 * bs.getDamageMultiplier(transLevel));

    bs.log("ORA ORA ORA ORA ORA!");
    attacker.play(bs.getAnimKey("jotaro", transLevel, "attack"));
    if (bs.soundManager) bs.soundManager.playBeamFire();

    // Stand aura
    const aura = bs.add
      .circle(attacker.x, attacker.y + 120, 60, 0x8a2be2)
      .setDepth(8)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    bs.tweens.add({
      targets: aura,
      alpha: 0.6,
      scale: 1.8,
      duration: 150,
      yoyo: true,
      repeat: -1,
    });

    // Dash to target
    bs.tweens.add({
      targets: attacker,
      x: target.x + (attacker.x < target.x ? -50 : 50),
      duration: 150,
      ease: "Power2",
      onComplete: () => {
        // Flurry of punches
        let punches = 0;
        const maxPunches = 25;
        const punchInterval = bs.time.addEvent({
          delay: 30,
          callback: () => {
            if (!bs.scene.isActive()) return;

            const hitX = target.x + (Math.random() * 80 - 40);
            const hitY = target.y + 120 + (Math.random() * 80 - 40);

            // Fist graphic
            const hand = bs.getHandPosition(isPlayer);
            const fist = bs.add
              .circle(hand.x, hand.y, 20, 0x8a2be2)
              .setDepth(15)
              .setBlendMode(Phaser.BlendModes.ADD);

            bs.tweens.add({
              targets: fist,
              x: hitX,
              y: hitY,
              duration: 50,
              onComplete: () => {
                fist.destroy();

                const hitCircle = bs.add
                  .circle(hitX, hitY, 40, 0x8a2be2)
                  .setAlpha(0.8)
                  .setDepth(15)
                  .setBlendMode(Phaser.BlendModes.ADD);
                bs.tweens.add({
                  targets: hitCircle,
                  alpha: 0,
                  scale: 2.5,
                  duration: 150,
                  onComplete: () => hitCircle.destroy(),
                });

                // Impact lines (reduced to 1)
                const line = bs.add
                  .rectangle(hitX, hitY, 80, 4, 0xffffff)
                  .setDepth(17)
                  .setRotation(Math.random() * Math.PI * 2)
                  .setBlendMode(Phaser.BlendModes.ADD);
                bs.tweens.add({
                  targets: line,
                  scaleX: 2,
                  alpha: 0,
                  duration: 100,
                  onComplete: () => line.destroy(),
                });
              },
            });

            if (punches % 2 === 0 && bs.cache.audio.exists("sfx_attack")) {
              if (bs.soundManager) bs.soundManager.playPunchImpact(true);
            }

            bs.cameras.main.shake(50, 0.04);

            // Target hit flash
            target.setTintFill(0xffffff);
            bs.time.delayedCall(20, () => target.clearTint());

            punches++;

            if (punches >= maxPunches) {
              punchInterval.remove();

              // Final heavy punch
              bs.time.delayedCall(100, () => {
                bs.createScreenFlash(0xffd700, 600, 1);
                bs.createImpactEffect(
                  target.x,
                  target.y + 120,
                  0xffd700,
                  "beam",
                );
                bs.cameras.main.shake(1200, 0.12);
                if (bs.soundManager) bs.soundManager.playExplosion(true);

                // Huge impact circle
                const finalHitGlow = bs.add
                  .circle(target.x, target.y + 120, 150, 0xffd700)
                  .setDepth(19)
                  .setAlpha(0.6)
                  .setBlendMode(Phaser.BlendModes.ADD);
                const finalHit = bs.add
                  .circle(target.x, target.y + 120, 100, 0xffd700)
                  .setDepth(20)
                  .setAlpha(0.8);
                bs.tweens.add({
                  targets: [finalHit, finalHitGlow],
                  scale: 6,
                  alpha: 0,
                  duration: 600,
                  onComplete: () => {
                    finalHit.destroy();
                    finalHitGlow.destroy();
                  },
                });

                // Shockwave rings
                for (let i = 0; i < 5; i++) {
                  const ring = bs.add
                    .circle(target.x, target.y + 120, 50, 0xffd700)
                    .setStrokeStyle(12, 0xffd700)
                    .setDepth(21)
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

                // Knockback
                bs.tweens.add({
                  targets: target,
                  x: target.x + (attacker.x < target.x ? 200 : -200),
                  duration: 250,
                  yoyo: true,
                  ease: "Sine.easeOut",
                });

                // Dash back
                bs.tweens.add({
                  targets: attacker,
                  x: isPlayer ? bs.p1StartPos.x : bs.p2StartPos.x,
                  duration: 200,
                  ease: "Power2",
                  onComplete: () => {
                    aura.destroy();
                    attacker.play(bs.getAnimKey("jotaro", transLevel, "idle"));
                    bs.onSpecialComplete(isPlayer);
                  },
                });
              });
            }
          },
          repeat: maxPunches - 1,
        });
      },
    });

    return null as any;
  }
}
