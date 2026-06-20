import Phaser from "phaser";
import { Fighter } from "./base/Fighter";
import { AttackParams, AttackResult } from "./base/FighterTypes";

export class GojoFighter extends Fighter {
  readonly key = "gojo";
  readonly specialName = "RED & BLUE";
  readonly superName = "HOLLOW PURPLE";
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
      attacker.setAlpha(0);
      bs.createImpactEffect(attacker.x, attacker.y + 120, 0x00ffff);

      bs.time.delayedCall(100, () => {
        if (!bs.scene.isActive()) return;
        attacker.setAlpha(1);
        attacker.x = target.x + (attacker.x < target.x ? -30 : 30);
        attacker.play(bs.getAnimKey("gojo", transLevel, "attack"));

        if (bs.cache.audio.exists("sfx_attack"))
          bs.sound.play("sfx_attack", { volume: 1.2 });
        bs.createImpactEffect(target.x, target.y + 120, 0x00ffff);
        bs.takeDamage(
          !isPlayer,
          Math.floor(
            (isComboFinisher ? 22 : 12) * bs.getDamageMultiplier(transLevel),
          ),
        );

        bs.time.delayedCall(200, () => {
          if (!bs.scene.isActive()) return;
          attacker.setAlpha(0);
          bs.createImpactEffect(attacker.x, attacker.y + 120, 0x00ffff);

          bs.time.delayedCall(100, () => {
            if (!bs.scene.isActive()) return;
            attacker.setAlpha(1);
            attacker.x = startX;
            attacker.play(bs.getAnimKey("gojo", transLevel, "idle"));
            bs.setActionState(isPlayer, false);
          });
        });
      });
    } else {
      attacker.play(bs.getAnimKey("gojo", transLevel, "attack"));
      bs.time.delayedCall(100, () => {
        if (!bs.scene.isActive()) return;
        if (bs.cache.audio.exists("sfx_beam"))
          bs.sound.play("sfx_beam", { volume: 1.0 });

        const orbColor = Math.random() > 0.5 ? 0xff0000 : 0x0000ff;
        const hand = bs.getHandPosition(isPlayer);
        const orb = bs.add.circle(hand.x, hand.y, 10, orbColor).setDepth(5);

        bs.tweens.add({
          targets: orb,
          x: target.x,
          duration: 150,
          onComplete: () => {
            orb.destroy();
            if (!bs.scene.isActive()) return;
            bs.createImpactEffect(target.x, target.y + 120, orbColor);
            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 20 : 10) *
                  bs.getDamageMultiplier(transLevel),
              ),
            );
          },
        });

        bs.time.delayedCall(300, () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("gojo", transLevel, "idle"));
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
    const transLevel = transformLevel;

    // specialRedAndBlue
    const dmg = Math.floor(45 * bs.getDamageMultiplier(transLevel));

    bs.log("CURSED TECHNIQUE: RED & BLUE!");
    if (bs.cache.audio.exists("sfx_beam")) bs.sound.play("sfx_beam");

    const hand = bs.getHandPosition(isPlayer);

    // Create Blue (Attract)
    const blueGlow = bs.add
      .circle(hand.x, hand.y - 30, 20, 0x0000ff)
      .setDepth(9)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.6);
    const blue = bs.add
      .circle(hand.x, hand.y - 30, 8, 0x0000ff, 1)
      .setDepth(10);
    const blueCore = bs.add
      .circle(hand.x, hand.y - 30, 3, 0xffffff, 1)
      .setDepth(11);

    // Create Red (Repel)
    const redGlow = bs.add
      .circle(hand.x, hand.y + 30, 20, 0xff0000)
      .setDepth(9)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.6);
    const red = bs.add.circle(hand.x, hand.y + 30, 8, 0xff0000, 1).setDepth(10);
    const redCore = bs.add
      .circle(hand.x, hand.y + 30, 3, 0xffffff, 1)
      .setDepth(11);

    // Particles
    let blueParticles: any;
    let redParticles: any;
    try {
      blueParticles = bs.add
        .particles(0, 0, "particle", {
          follow: blue,
          scale: { start: 0.5, end: 0 },
          lifespan: 200,
          tint: 0x0000ff,
          blendMode: "ADD",
        })
        .setDepth(8);

      redParticles = bs.add
        .particles(0, 0, "particle", {
          follow: red,
          scale: { start: 0.5, end: 0 },
          lifespan: 200,
          tint: 0xff0000,
          blendMode: "ADD",
        })
        .setDepth(8);
    } catch (e) {}

    bs.tweens.add({
      targets: [blue, red, blueGlow, redGlow, blueCore, redCore],
      scale: 3,
      duration: 400,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        // Shoot them
        bs.tweens.add({
          targets: [blue, blueGlow, blueCore],
          x: target.x,
          y: target.y + 120,
          duration: 250,
          ease: "Power2",
        });
        bs.tweens.add({
          targets: [red, redGlow, redCore],
          x: target.x,
          y: target.y + 20,
          duration: 250,
          ease: "Power2",
          onComplete: () => {
            blue.destroy();
            blueGlow.destroy();
            blueCore.destroy();
            red.destroy();
            redGlow.destroy();
            redCore.destroy();
            if (blueParticles) blueParticles.stop();
            if (redParticles) redParticles.stop();
            bs.time.delayedCall(200, () => {
              if (blueParticles) blueParticles.destroy();
              if (redParticles) redParticles.destroy();
            });

            bs.createScreenFlash(0x8a2be2, 500, 1);
            bs.cameras.main.shake(800, 0.08);

            // Purple explosion
            const exp = bs.add
              .circle(target.x, target.y + 120, 20, 0x8a2be2)
              .setDepth(16)
              .setBlendMode(Phaser.BlendModes.ADD);
            bs.tweens.add({
              targets: exp,
              scale: 8,
              alpha: 0,
              duration: 400,
              onComplete: () => exp.destroy(),
            });

            bs.createImpactEffect(target.x, target.y + 120, 0x8a2be2, "beam");
            bs.takeDamage(!isPlayer, dmg);

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

    // specialHollowPurple
    const dmg = Math.floor(150 * bs.getDamageMultiplier(transLevel));

    bs.log("HOLLOW PURPLE!");
    if (bs.cache.audio.exists("sfx_beam"))
      bs.sound.play("sfx_beam", { rate: 0.8 });

    const hand = bs.getHandPosition(isPlayer);

    // Screen darken
    const darkOverlay = bs.add
      .rectangle(
        bs.cameras.main.width / 2,
        bs.cameras.main.height / 2,
        bs.cameras.main.width,
        bs.cameras.main.height,
        0x000000,
        0,
      )
      .setDepth(8);
    bs.tweens.add({ targets: darkOverlay, fillAlpha: 0.9, duration: 500 });

    // Combine Red and Blue
    const blueGlow = bs.add
      .circle(hand.x - (attacker.x < target.x ? 40 : -40), hand.y, 40, 0x0000ff)
      .setDepth(9)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.6);
    const blue = bs.add
      .circle(
        hand.x - (attacker.x < target.x ? 40 : -40),
        hand.y,
        20,
        0x0000ff,
        1,
      )
      .setDepth(10)
      .setBlendMode(Phaser.BlendModes.ADD);

    const redGlow = bs.add
      .circle(hand.x + (attacker.x < target.x ? 40 : -40), hand.y, 40, 0xff0000)
      .setDepth(9)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.6);
    const red = bs.add
      .circle(
        hand.x + (attacker.x < target.x ? 40 : -40),
        hand.y,
        20,
        0xff0000,
        1,
      )
      .setDepth(10)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Swirling particles
    const swirlEvent = bs.time.addEvent({
      delay: 20,
      callback: () => {
        if (!bs.scene.isActive()) return;
        const bPart = bs.add
          .circle(
            blue.x + (Math.random() * 40 - 20),
            blue.y + (Math.random() * 40 - 20),
            8,
            0x0000ff,
          )
          .setDepth(11)
          .setBlendMode(Phaser.BlendModes.ADD);
        const rPart = bs.add
          .circle(
            red.x + (Math.random() * 40 - 20),
            red.y + (Math.random() * 40 - 20),
            8,
            0xff0000,
          )
          .setDepth(11)
          .setBlendMode(Phaser.BlendModes.ADD);
        bs.tweens.add({
          targets: [bPart, rPart],
          alpha: 0,
          scale: 0.1,
          duration: 300,
          onComplete: () => {
            bPart.destroy();
            rPart.destroy();
          },
        });
      },
      repeat: 40,
    });

    bs.tweens.add({
      targets: [blue, red, blueGlow, redGlow],
      x: hand.x,
      duration: 800,
      ease: "Power2",
      onComplete: () => {
        blue.destroy();
        red.destroy();
        blueGlow.destroy();
        redGlow.destroy();

        // Purple Core
        const purpleGlow = bs.add
          .circle(hand.x, hand.y, 100, 0x8a2be2)
          .setDepth(9)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.8);
        const purple = bs.add
          .circle(hand.x, hand.y, 45, 0x8a2be2, 1)
          .setDepth(10);
        const purpleAura = bs.add
          .circle(hand.x, hand.y, 70, 0x8a2be2, 0.8)
          .setDepth(9)
          .setBlendMode(Phaser.BlendModes.ADD);
        const purpleCore = bs.add
          .circle(hand.x, hand.y, 20, 0xffffff, 1)
          .setDepth(11);

        bs.createScreenFlash(0x8a2be2, 500, 0.9);
        bs.cameras.main.shake(1000, 0.06);

        // Lightning around purple
        const lightningEvent = bs.time.addEvent({
          delay: 40,
          callback: () => {
            if (!bs.scene.isActive()) return;
            const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
            const length = Phaser.Math.Between(80, 150);
            const spark = bs.add
              .graphics()
              .setDepth(12)
              .setBlendMode(Phaser.BlendModes.ADD);
            spark.lineStyle(4, 0xffffff, 1);
            spark.beginPath();
            spark.moveTo(purple.x, purple.y);
            spark.lineTo(
              purple.x + Math.cos(angle) * length,
              purple.y + Math.sin(angle) * length,
            );
            spark.strokePath();
            bs.tweens.add({
              targets: spark,
              alpha: 0,
              duration: 100,
              onComplete: () => spark.destroy(),
            });
          },
          repeat: 15,
        });

        bs.time.delayedCall(600, () => {
          if (bs.cache.audio.exists("sfx_explosion"))
            bs.sound.play("sfx_explosion");

          // Fire Hollow Purple
          bs.tweens.add({
            targets: [purple, purpleAura, purpleCore, purpleGlow],
            x: isPlayer ? target.x + 300 : target.x - 300, // Go through target
            scale: 12,
            duration: 400,
            ease: "Power2",
            onUpdate: () => {
              // Destroy everything in its path (visual effect)
              if (!bs.scene.isActive()) return;

              // Use a local flag to trigger impact only once per attack
              if (
                !attacker.getData("hollowPurpleTriggered") &&
                Math.abs(purple.x - target.x) < 120
              ) {
                attacker.setData("hollowPurpleTriggered", true);
                bs.createImpactEffect(
                  target.x,
                  target.y + 120,
                  0x8a2be2,
                  "beam",
                );
                bs.cameras.main.shake(300, 0.15);

                // Spatial distortion rings
                for (let i = 0; i < 4; i++) {
                  const ring = bs.add
                    .circle(target.x, target.y + 120, 30, 0x8a2be2)
                    .setStrokeStyle(10, 0x8a2be2)
                    .setDepth(20)
                    .setAlpha(0.8)
                    .setBlendMode(Phaser.BlendModes.ADD);
                  ring.isFilled = false;
                  bs.tweens.add({
                    targets: ring,
                    scale: 15 + i * 5,
                    alpha: 0,
                    duration: 300 + i * 100,
                    ease: "Cubic.easeOut",
                    onComplete: () => ring.destroy(),
                  });
                }
              }
            },
            onComplete: () => {
              attacker.setData("hollowPurpleTriggered", false);
              purple.destroy();
              purpleAura.destroy();
              purpleCore.destroy();
              purpleGlow.destroy();
              lightningEvent.remove();

              bs.createScreenFlash(0x8a2be2, 600, 1);
              bs.cameras.main.shake(1500, 0.15);
              if (bs.cache.audio.exists("sfx_explosion"))
                bs.sound.play("sfx_explosion");

              // Massive Purple Void
              const voidGlow = bs.add
                .circle(target.x, target.y + 120, 300, 0x8a2be2)
                .setDepth(20)
                .setAlpha(0.6)
                .setBlendMode(Phaser.BlendModes.ADD);
              const purpleVoid = bs.add
                .circle(target.x, target.y + 120, 200, 0x4b0082)
                .setDepth(21);
              const voidCore = bs.add
                .circle(target.x, target.y + 120, 100, 0xffffff)
                .setDepth(22)
                .setBlendMode(Phaser.BlendModes.ADD);

              // Shockwave rings
              for (let i = 0; i < 8; i++) {
                const ring = bs.add
                  .circle(target.x, target.y + 120, 50, 0x8a2be2)
                  .setStrokeStyle(15, 0x8a2be2)
                  .setDepth(23)
                  .setAlpha(0)
                  .setBlendMode(Phaser.BlendModes.ADD);
                ring.isFilled = false;
                bs.tweens.add({
                  targets: ring,
                  scale: 15 + i * 10,
                  alpha: { start: 1, end: 0 },
                  duration: 600 + i * 150,
                  ease: "Cubic.easeOut",
                  onComplete: () => ring.destroy(),
                });
              }

              bs.tweens.add({
                targets: [purpleVoid, voidCore, voidGlow],
                scale: 4,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                  purpleVoid.destroy();
                  voidCore.destroy();
                  voidGlow.destroy();
                },
              });

              bs.createImpactEffect(target.x, target.y + 120, 0x8a2be2, "beam");
              bs.takeDamage(!isPlayer, dmg);

              bs.tweens.add({
                targets: darkOverlay,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                  darkOverlay.destroy();
                  bs.onSpecialComplete(isPlayer);
                },
              });
            },
          });
        });
      },
    });

    return null as any;
  }
}
