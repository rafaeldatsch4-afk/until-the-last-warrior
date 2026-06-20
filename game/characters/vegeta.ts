import Phaser from "phaser";
import { Fighter } from "./base/Fighter";
import { AttackParams, AttackResult } from "./base/FighterTypes";

export class VegetaFighter extends Fighter {
  readonly key = "vegeta";
  readonly specialName = "BIG BANG ATTACK"; // or GALICK GUN, but let's use what data had: "BIG BANG ATTACK"
  readonly superName = "FINAL FLASH";
  readonly specialColor = 0x0000ff; // Need to verify if it's 0x0000ff. I can just use whatever was passed in performCastSequence.

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
      // Vegeta Melee: Rapid aggressive punches
      bs.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 100,
        onComplete: () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("vegeta", transformLevel, "attack"));
          const hits = isComboFinisher ? 4 : 2;
          for (let i = 0; i < hits; i++) {
            bs.time.delayedCall(i * 100, () => {
              if (!bs.scene.isActive()) return;
              if (bs.cache.audio.exists("sfx_attack"))
                bs.sound.play("sfx_attack", { volume: 0.8 });
              bs.createImpactEffect(
                target.x + (Math.random() * 20 - 10),
                target.y + 120 + (Math.random() * 20 - 10),
                0xffffff,
              );
              bs.takeDamage(
                !isPlayer,
                Math.floor(5 * bs.getDamageMultiplier(transformLevel)),
              );
              bs.modifyKi(isPlayer, 2);
            });
          }
          bs.time.delayedCall(hits * 100, () => {
            if (!bs.scene.isActive()) return;
            bs.tweens.add({
              targets: attacker,
              x: startX,
              duration: 150,
              onComplete: () => {
                attacker.play(bs.getAnimKey("vegeta", transformLevel, "idle"));
                bs.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // Vegeta Ki: Continuous energy bullets (Lucora Gun)
      attacker.play(bs.getAnimKey("vegeta", transformLevel, "attack"));
      const blastCount = isComboFinisher ? 8 : 4;
      for (let i = 0; i < blastCount; i++) {
        bs.time.delayedCall(i * 50, () => {
          if (!bs.scene.isActive()) return;
          if (bs.cache.audio.exists("sfx_beam"))
            bs.sound.play("sfx_beam", { volume: 0.3 });
          const hand = bs.getHandPosition(isPlayer);
          const blast = bs.add
            .circle(hand.x, hand.y + (Math.random() * 20 - 10), 6, 0xffff00)
            .setDepth(5);
          bs.tweens.add({
            targets: blast,
            x: target.x,
            duration: 120,
            onComplete: () => {
              blast.destroy();
              if (!bs.scene.isActive()) return;
              bs.createImpactEffect(
                target.x,
                target.y + 120 + (Math.random() * 40 - 20),
                0xffff00,
              );
              bs.takeDamage(
                !isPlayer,
                Math.floor(4 * bs.getDamageMultiplier(transformLevel)),
              );
            },
          });
        });
      }
      bs.time.delayedCall(blastCount * 50 + 200, () => {
        if (!bs.scene.isActive()) return;
        attacker.play(bs.getAnimKey("vegeta", transformLevel, "idle"));
        bs.setActionState(isPlayer, false);
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

    bs.specialBeam(isPlayer, false, 0x9b59b6, true, true, "galick");

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

    const dmg = Math.floor(110 * bs.getDamageMultiplier(transformLevel));
    const hand = bs.getHandPosition(isPlayer);

    bs.log("FINAL FLASH!");
    if (bs.cache.audio.exists("sfx_beam")) bs.sound.play("sfx_beam");

    // Charge
    const charge = bs.add
      .circle(hand.x, hand.y, 5, 0xffff00)
      .setDepth(15)
      .setBlendMode(Phaser.BlendModes.ADD);
    const chargeCore = bs.add.circle(hand.x, hand.y, 2, 0xffffff).setDepth(16);

    bs.cameras.main.shake(800, 0.01); // Shake while charging

    // Lightning sparks
    const sparkEvent = bs.time.addEvent({
      delay: 40,
      callback: () => {
        if (!bs.scene.isActive()) return;
        for (let i = 0; i < 2; i++) {
          const spark = bs.add
            .rectangle(
              hand.x + (Math.random() * 80 - 40),
              hand.y + (Math.random() * 80 - 40),
              25,
              4,
              0xffffff,
            )
            .setDepth(16)
            .setRotation(Math.random() * Math.PI)
            .setBlendMode(Phaser.BlendModes.ADD);
          bs.tweens.add({
            targets: spark,
            alpha: 0,
            duration: 150,
            onComplete: () => spark.destroy(),
          });
        }
      },
      repeat: 25,
    });

    // Gathering particles
    const gatherParticles = bs.add
      .particles(0, 0, "particle", {
        x: hand.x,
        y: hand.y,
        speed: { min: -250, max: 250 },
        scale: { start: 1.2, end: 0 },
        blendMode: "ADD",
        lifespan: 500,
        tint: 0xffff00,
        gravityY: 0,
      })
      .setDepth(14);

    bs.tweens.add({
      targets: [charge, chargeCore],
      scale: 35,
      alpha: { start: 1, end: 0.8 },
      duration: 800,
      yoyo: true,
      repeat: 0,
      onComplete: () => {
        if (!bs.scene.isActive()) return;
        charge.destroy();
        chargeCore.destroy();
        gatherParticles.destroy();

        bs.createScreenFlash(0xffff00, 500, 0.9);
        bs.cameras.main.shake(1200, 0.1);

        // Massive Beam
        const beamOuter = bs.add
          .rectangle(hand.x, hand.y, 0, 240, 0xffff00)
          .setOrigin(0, 0.5)
          .setDepth(4)
          .setAlpha(0.5)
          .setBlendMode(Phaser.BlendModes.ADD);
        const beam = bs.add
          .rectangle(hand.x, hand.y, 0, 180, 0xffff00)
          .setOrigin(0, 0.5)
          .setDepth(5)
          .setAlpha(0.9)
          .setBlendMode(Phaser.BlendModes.ADD);
        const beamCore = bs.add
          .rectangle(hand.x, hand.y, 0, 90, 0xffffff)
          .setOrigin(0, 0.5)
          .setDepth(6)
          .setAlpha(1);
        beamOuter.scaleX = isPlayer ? 1 : -1;
        beam.scaleX = isPlayer ? 1 : -1;
        beamCore.scaleX = isPlayer ? 1 : -1;

        const distance = Math.abs(target.x - hand.x) + 200;

        // Beam Head
        const beamHeadGlow = bs.add
          .ellipse(hand.x, hand.y, 140, 280, 0xffff00)
          .setDepth(5)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.8);
        const beamHead = bs.add
          .ellipse(hand.x, hand.y, 70, 140, 0xffffff)
          .setDepth(6);

        bs.tweens.add({
          targets: [beamOuter, beam, beamCore],
          width: distance,
          duration: 150,
          ease: "Power2",
          onUpdate: () => {
            if (!bs.scene.isActive()) return;
            const tipX = isPlayer ? hand.x + beam.width : hand.x - beam.width;
            beamHeadGlow.setPosition(tipX, hand.y);
            beamHead.setPosition(tipX, hand.y);
          },
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            bs.createImpactEffect(target.x, target.y + 120, 0xffff00, "beam");
            bs.takeDamage(!isPlayer, dmg);

            // Massive Shockwave rings
            for (let i = 0; i < 6; i++) {
              const ring = bs.add
                .circle(target.x, target.y + 120, 40, 0xffff00)
                .setStrokeStyle(12, 0xffff00)
                .setDepth(20)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              ring.isFilled = false;
              bs.tweens.add({
                targets: ring,
                scale: 12 + i * 6,
                alpha: { start: 1, end: 0 },
                duration: 400 + i * 120,
                ease: "Cubic.easeOut",
                onComplete: () => ring.destroy(),
              });
            }

            bs.tweens.add({
              targets: [beamOuter, beam, beamCore, beamHead, beamHeadGlow],
              alpha: 0,
              scaleY: 0,
              duration: 500,
              onComplete: () => {
                beamOuter.destroy();
                beam.destroy();
                beamCore.destroy();
                beamHead.destroy();
                beamHeadGlow.destroy();
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
    // To be implemented if we pull UI/UE transformations
  }
}
