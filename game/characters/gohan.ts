import Phaser from "phaser";
import { Fighter } from "./base/Fighter";
import { AttackParams, AttackResult } from "./base/FighterTypes";

export class GohanFighter extends Fighter {
  readonly key = "gohan";
  readonly specialName = "MASENKO";
  readonly superName = "FATHER-SON KAMEHAMEHA";
  readonly specialColor = 0xffff00;

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
      // Gohan Melee: High kick
      bs.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -30 : 30),
        y: target.y - 30,
        duration: 150,
        ease: "Sine.easeOut",
        onComplete: () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("gohan", transformLevel, "attack"));

          if (bs.cache.audio.exists("sfx_attack"))
            bs.sound.play("sfx_attack", { volume: 1.2 });
          bs.createImpactEffect(target.x, target.y + 120, 0xffffff);
          bs.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 20 : 12) *
                bs.getDamageMultiplier(transformLevel),
            ),
          );

          bs.time.delayedCall(150, () => {
            if (!bs.scene.isActive()) return;
            bs.tweens.add({
              targets: attacker,
              x: startX,
              y: startY,
              duration: 200,
              ease: "Sine.easeIn",
              onComplete: () => {
                attacker.play(bs.getAnimKey("gohan", transformLevel, "idle"));
                bs.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // Gohan Ki: Quick Masenko blast
      attacker.play(bs.getAnimKey("gohan", transformLevel, "attack"));
      bs.time.delayedCall(100, () => {
        if (!bs.scene.isActive()) return;
        if (bs.cache.audio.exists("sfx_beam"))
          bs.sound.play("sfx_beam", { volume: 1.0 });

        const hand = bs.getHandPosition(isPlayer);
        const blast = bs.add.circle(hand.x, hand.y, 12, 0xffff00).setDepth(5);
        const core = bs.add.circle(blast.x, blast.y, 6, 0xffffff).setDepth(6);

        bs.tweens.add({
          targets: [blast, core],
          x: target.x,
          duration: 120,
          onComplete: () => {
            blast.destroy();
            core.destroy();
            if (!bs.scene.isActive()) return;
            bs.createImpactEffect(target.x, target.y + 120, 0xffff00);
            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 18 : 10) *
                  bs.getDamageMultiplier(transformLevel),
              ),
            );
          },
        });

        bs.time.delayedCall(250, () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("gohan", transformLevel, "idle"));
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

    bs.specialBeam(isPlayer, false, 0xffff00, true, false, "masenko");

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

    const dmg = Math.floor(115 * bs.getDamageMultiplier(transformLevel));
    const hand = bs.getHandPosition(isPlayer);

    bs.log("FATHER-SON KAMEHAMEHA!");
    if (bs.cache.audio.exists("sfx_beam")) bs.sound.play("sfx_beam");

    // Ghost Goku (Visual representation)
    const ghost = bs.add
      .sprite(
        attacker.x + (attacker.x < target.x ? -40 : 40),
        attacker.y - 60,
        "goku_ssj",
        "0",
      )
      .setOrigin(0.5, 0.5)
      .setAlpha(0)
      .setScale(3.5)
      .setDepth(2); // In front of Gohan to be clearly visible
    ghost.setFlipX(!isPlayer);
    if (bs.anims.exists("goku_ssj_attack")) {
      ghost.play("goku_ssj_attack");
    }
    bs.tweens.add({ targets: ghost, alpha: 0.85, duration: 500 });

    // Charge Effect
    const chargeCore = bs.add.circle(hand.x, hand.y, 2, 0xffffff).setDepth(16);
    const chargeGlow = bs.add
      .circle(hand.x, hand.y, 5, 0x00ffff)
      .setDepth(15)
      .setBlendMode(Phaser.BlendModes.ADD);

    bs.cameras.main.shake(800, 0.01);

    // Gathering particles
    const gatherParticles = bs.add
      .particles(0, 0, "particle", {
        x: hand.x,
        y: hand.y,
        speed: { min: -250, max: 250 },
        scale: { start: 1.2, end: 0 },
        blendMode: "ADD",
        lifespan: 500,
        tint: 0x00ffff,
        gravityY: 0,
      })
      .setDepth(14);

    bs.tweens.add({
      targets: [chargeCore, chargeGlow],
      scale: 30,
      alpha: { start: 1, end: 0.8 },
      duration: 800,
      yoyo: true,
      repeat: 0,
      onComplete: () => {
        if (!bs.scene.isActive()) return;
        chargeCore.destroy();
        chargeGlow.destroy();
        gatherParticles.destroy();

        bs.createScreenFlash(0x00ffff, 500, 0.9);
        bs.cameras.main.shake(1200, 0.08);

        // Massive Beam using the new texture
        const beam = bs.add
          .sprite(hand.x, hand.y, "massive_beam")
          .setOrigin(0, 0.5)
          .setDepth(5)
          .setAlpha(0.9)
          .setBlendMode(Phaser.BlendModes.ADD);
        beam.scaleX = isPlayer ? 0.1 : -0.1;
        beam.scaleY = 0.5;

        const distance = Math.abs(target.x - hand.x) + 200;
        const targetScaleX = (isPlayer ? distance : -distance) / 128; // 128 is the width of massive_beam

        // Muzzle Flash
        const muzzle = bs.add.circle(hand.x, hand.y, 80, 0x00ffff).setDepth(6);
        muzzle.setBlendMode(Phaser.BlendModes.ADD);
        bs.tweens.add({
          targets: muzzle,
          scale: 0,
          alpha: 0,
          duration: 400,
          onComplete: () => muzzle.destroy(),
        });

        bs.tweens.add({
          targets: beam,
          scaleX: targetScaleX,
          scaleY: 4.5,
          duration: 200,
          ease: "Power2",
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            bs.createImpactEffect(target.x, target.y + 120, 0x00ffff, "beam");
            bs.takeDamage(!isPlayer, dmg);

            // Massive Shockwave rings
            for (let i = 0; i < 6; i++) {
              const ring = bs.add
                .circle(target.x, target.y + 120, 40, 0x00ffff)
                .setStrokeStyle(10, 0x00ffff)
                .setDepth(20)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              ring.isFilled = false;
              bs.tweens.add({
                targets: ring,
                scale: 10 + i * 4,
                alpha: { start: 1, end: 0 },
                duration: 400 + i * 120,
                ease: "Cubic.easeOut",
                onComplete: () => ring.destroy(),
              });
            }

            bs.tweens.add({
              targets: [beam, ghost],
              alpha: 0,
              duration: 600,
              onComplete: () => {
                beam.destroy();
                ghost.destroy();
                bs.onSpecialComplete(isPlayer);
              },
            });
          },
        });
      },
    });

    return null as any;
  }

  performTransform(
    scene: Phaser.Scene,
    isPlayer: boolean,
    level: number,
  ): void {
    // not yet extracted correctly
  }
}
