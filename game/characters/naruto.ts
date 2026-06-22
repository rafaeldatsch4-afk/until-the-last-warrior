import Phaser from "phaser";
import { Fighter } from "./base/Fighter";
import { AttackParams, AttackResult } from "./base/FighterTypes";

export class NarutoFighter extends Fighter {
  readonly key = "naruto";
  readonly specialName = "RASENGAN";
  readonly superName = "RASENSHURIKEN";
  readonly specialColor = 0x3498db;

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
      // Naruto Melee: Shadow Clone combo
      attacker.play(bs.getAnimKey("naruto", transLevel, "attack"));

      // Spawn clone
      const clone = bs.add
        .sprite(
          target.x + (attacker.x < target.x ? 40 : -40),
          target.y + 120,
          attacker.texture.key,
          attacker.frame.name,
        )
        .setScale(3)
        .setFlipX(!attacker.flipX)
        .setAlpha(0)
        .setTint(0xaaaaaa);

      bs.createImpactEffect(clone.x, clone.y + 120, 0xffffff); // Poof
      clone.setAlpha(1);

      bs.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 150,
        onComplete: () => {
          if (!bs.scene.isActive()) return;
          if (bs.soundManager) bs.soundManager.playPunchImpact(true);
          bs.createImpactEffect(target.x, target.y + 120, 0xffffff);
          bs.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 20 : 12) * bs.getDamageMultiplier(transLevel),
            ),
          );

          bs.time.delayedCall(200, () => {
            if (!bs.scene.isActive()) return;
            bs.createImpactEffect(clone.x, clone.y + 120, 0xffffff);
            clone.destroy();

            bs.tweens.add({
              targets: attacker,
              x: startX,
              duration: 150,
              onComplete: () => {
                attacker.play(bs.getAnimKey("naruto", transLevel, "idle"));
                bs.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // Naruto Ki: Rasengan thrust
      attacker.play(bs.getAnimKey("naruto", transLevel, "attack"));

      const hand = bs.getHandPosition(isPlayer);
      const rasengan = bs.add.circle(hand.x, hand.y, 15, 0x00ffff).setDepth(6);
      rasengan.setBlendMode(Phaser.BlendModes.ADD);

      bs.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 200,
        ease: "Power2",
        onUpdate: () => {
          const hand = bs.getHandPosition(isPlayer);
          rasengan.x = hand.x;
          rasengan.y = hand.y;
        },
        onComplete: () => {
          if (!bs.scene.isActive()) return;
          if (bs.soundManager) bs.soundManager.playPunchImpact(true);
          bs.createImpactEffect(target.x, target.y + 120, 0x00ffff);
          rasengan.destroy();

          bs.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 25 : 15) * bs.getDamageMultiplier(transLevel),
            ),
          );
          bs.cameras.main.shake(150, 0.02);
          bs.tweens.add({
            targets: target,
            x: target.x + (attacker.x < target.x ? 80 : -80),
            duration: 150,
            yoyo: true,
          });

          bs.time.delayedCall(200, () => {
            if (!bs.scene.isActive()) return;
            bs.tweens.add({
              targets: attacker,
              x: startX,
              duration: 200,
              onComplete: () => {
                attacker.play(bs.getAnimKey("naruto", transLevel, "idle"));
                bs.setActionState(isPlayer, false);
              },
            });
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
    const isS = false;
    const startX = attacker.x;
    const startY = attacker.y;

    const baseDmg = 35;
    const dmg = Math.floor(baseDmg * bs.getDamageMultiplier(transLevel));

    let color = 0x3498db; // Blue Rasengan
    let scaleTarget = 15;
    let attackName = "RASENGAN!";

    if (transLevel === 1) {
      scaleTarget = 25; // Oodama Rasengan (Bigger)
      attackName = "OODAMA RASENGAN!";
    } else if (transLevel === 2) {
      color = 0xffaa00; // Tailed Beast Rasengan (Orange)
      scaleTarget = 30;
      attackName = "TAILED BEAST RASENGAN!";
    }

    bs.log(attackName);
    if (bs.soundManager) bs.soundManager.playPunchImpact(true);

    // Create Rasengan in hand
    const hand = bs.getHandPosition(isPlayer);
    const rasengan = bs.add
      .circle(hand.x, hand.y, 2, color)
      .setDepth(15)
      .setAlpha(0.8)
      .setBlendMode(Phaser.BlendModes.ADD);
    const rasenganCore = bs.add
      .circle(hand.x, hand.y, 1, 0xffffff)
      .setDepth(16)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Swirling particles during charge
    const particles = bs.add
      .particles(0, 0, "particle", {
        color: [color, 0xffffff],
        colorEase: "quad.out",
        lifespan: 400,
        angle: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0 },
        speed: { min: 100, max: 250 },
        blendMode: "ADD",
      })
      .setDepth(14);
    particles.startFollow(rasengan);

    bs.cameras.main.shake(600, 0.02);

    // 1. Charge effect (standing still)
    bs.tweens.add({
      targets: [rasengan, rasenganCore],
      scale: scaleTarget,
      duration: 600,
      ease: "Sine.easeOut",
      onUpdate: () => {
        const currentHand = bs.getHandPosition(isPlayer);
        rasengan.setPosition(currentHand.x, currentHand.y);
        rasenganCore.setPosition(currentHand.x, currentHand.y);
      },
      onComplete: () => {
        if (!bs.scene.isActive()) return;

        // Swirling effect
        const swirlTween = bs.tweens.add({
          targets: rasengan,
          scale: scaleTarget * 1.3,
          alpha: 0.6,
          duration: 100,
          yoyo: true,
          repeat: -1,
        });

        // 2. Dash towards enemy holding the Rasengan
        bs.tweens.add({
          targets: attacker,
          x: target.x + (attacker.x < target.x ? -40 : 40), // Get right up to the target
          duration: 200,
          ease: "Power2",
          onUpdate: () => {
            const currentHand = bs.getHandPosition(isPlayer);
            rasengan.setPosition(currentHand.x, currentHand.y);
            rasenganCore.setPosition(currentHand.x, currentHand.y);
          },
          onComplete: () => {
            if (!bs.scene.isActive()) return;

            swirlTween.stop();
            particles.stop();

            // 3. Impact!
            bs.createScreenFlash(color, 500, 1);
            bs.cameras.main.shake(1000, 0.1);
            if (bs.soundManager) bs.soundManager.playExplosion(true);

            // Explosion effect
            const explosion = bs.add
              .circle(target.x, target.y + 120, 10, color)
              .setDepth(20)
              .setBlendMode(Phaser.BlendModes.ADD);
            const explosionCore = bs.add
              .circle(target.x, target.y + 120, 5, 0xffffff)
              .setDepth(21)
              .setBlendMode(Phaser.BlendModes.ADD);

            // Shockwave rings
            for (let i = 0; i < 6; i++) {
              const ring = bs.add
                .circle(target.x, target.y + 120, 40, color)
                .setStrokeStyle(12, color)
                .setDepth(22)
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

            bs.tweens.add({
              targets: [explosion, explosionCore],
              scale: scaleTarget * 5,
              alpha: 0,
              duration: 800,
              onComplete: () => {
                explosion.destroy();
                explosionCore.destroy();
              },
            });

            bs.createImpactEffect(target.x, target.y + 120, color, "beam");
            bs.takeDamage(!isPlayer, dmg);

            rasengan.destroy();
            rasenganCore.destroy();
            bs.time.delayedCall(400, () => particles.destroy());

            // Target knockback
            bs.tweens.add({
              targets: target,
              x: target.x + (attacker.x < target.x ? 150 : -150),
              duration: 250,
              yoyo: true,
              ease: "Sine.easeOut",
            });

            // Jump back
            bs.tweens.add({
              targets: attacker,
              x: startX,
              y: startY,
              duration: 300,
              ease: "Power1",
              onComplete: () => {
                bs.onSpecialComplete(isPlayer);
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
    const transLevel = transformLevel;

    // specialRasenshuriken
    const dmg = Math.floor(120 * bs.getDamageMultiplier(transLevel));

    let color = 0x3498db; // Blue/White
    let attackName = "RASENSHURIKEN!";
    let scaleTarget = 1.5;

    if (transLevel === 1) {
      attackName = "SENPOU: RASENSHURIKEN!";
      scaleTarget = 2.0;
    } else if (transLevel === 2) {
      color = 0xffaa00; // Orange/Yellow
      attackName = "BIJUU RASENSHURIKEN!";
      scaleTarget = 2.5;
    }

    bs.log(attackName);
    if (bs.soundManager) bs.soundManager.playBeamFire();

    // Raise hand
    attacker.y -= 20;

    const hand = bs.getHandPosition(isPlayer);

    // Create Rasenshuriken
    const shuriken = bs.add
      .graphics()
      .setDepth(15)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Draw shuriken shape
    shuriken.fillStyle(color, 0.8);
    shuriken.fillCircle(0, 0, 15); // Core
    shuriken.fillStyle(0xffffff, 0.9);
    shuriken.fillCircle(0, 0, 8); // Inner core

    // Blades
    shuriken.lineStyle(6, color, 0.9);
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i;
      shuriken.lineBetween(
        Math.cos(angle) * 15,
        Math.sin(angle) * 15,
        Math.cos(angle) * 50,
        Math.sin(angle) * 50,
      );
    }

    shuriken.setPosition(hand.x, hand.y - 30);

    // Wind particles
    const wind = bs.add
      .particles(0, 0, "particle", {
        color: [0xffffff, color],
        colorEase: "quad.out",
        lifespan: 300,
        angle: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0 },
        speed: { min: 150, max: 300 },
        blendMode: "ADD",
      })
      .setDepth(14);
    wind.startFollow(shuriken);

    bs.cameras.main.shake(800, 0.03);

    // Spin and grow
    bs.tweens.add({
      targets: shuriken,
      rotation: Math.PI * 15,
      scale: scaleTarget,
      duration: 600,
      ease: "Sine.easeIn",
      onComplete: () => {
        if (!bs.scene.isActive()) return;
        attacker.y += 20; // Lower hand

        // Throw
        bs.tweens.add({
          targets: shuriken,
          x: target.x,
          y: target.y + 120,
          rotation: Math.PI * 30, // Keep spinning
          duration: 250,
          ease: "Power2",
          onComplete: () => {
            if (!bs.scene.isActive()) return;

            wind.stop();

            // Massive explosion sphere
            bs.createScreenFlash(color, 600, 1);
            bs.cameras.main.shake(1200, 0.12);
            if (bs.soundManager) bs.soundManager.playExplosion(true);

            const explosion = bs.add
              .circle(target.x, target.y + 120, 10, color)
              .setDepth(20)
              .setBlendMode(Phaser.BlendModes.ADD);
            const explosionCore = bs.add
              .circle(target.x, target.y + 120, 5, 0xffffff)
              .setDepth(21)
              .setBlendMode(Phaser.BlendModes.ADD);

            // Wind slashes inside explosion
            for (let i = 0; i < 15; i++) {
              const slash = bs.add
                .rectangle(
                  target.x + Phaser.Math.Between(-100, 100),
                  target.y + 120 + Phaser.Math.Between(-100, 100),
                  120,
                  4,
                  0xffffff,
                )
                .setDepth(22)
                .setRotation(Phaser.Math.Between(0, 360))
                .setBlendMode(Phaser.BlendModes.ADD);
              bs.tweens.add({
                targets: slash,
                scaleX: 4,
                alpha: 0,
                duration: 300,
                delay: i * 20,
                onComplete: () => slash.destroy(),
              });
            }

            // Shockwave rings
            for (let i = 0; i < 6; i++) {
              const ring = bs.add
                .circle(target.x, target.y + 120, 40, color)
                .setStrokeStyle(12, color)
                .setDepth(23)
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

            bs.tweens.add({
              targets: [explosion, explosionCore],
              scale: scaleTarget * 20,
              alpha: 0,
              duration: 1000,
              onComplete: () => {
                explosion.destroy();
                explosionCore.destroy();
              },
            });

            bs.createImpactEffect(target.x, target.y + 120, color, "beam");
            bs.takeDamage(!isPlayer, dmg);
            shuriken.destroy();
            bs.time.delayedCall(400, () => wind.destroy());

            bs.onSpecialComplete(isPlayer);
          },
        });
      },
    });

    return null as any;
  }
}
