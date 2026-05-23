import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class OptimusFighter extends Fighter {
  readonly key = 'optimus';
  readonly specialName = 'MISSILE STRIKE';
  readonly superName = 'MATRIX BLAST';
  readonly specialColor = 0x3498db;

  performTransform(scene: any, isPlayer: boolean): void {}

  performAttack(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, attackType, isComboFinisher, transformLevel } = params;
    const bs = scene as any;
    const startX = attacker ? attacker.x : (isPlayer ? bs.player.x : bs.enemy.x);
    const transLevel = transformLevel;

    if (attackType === "melee") {
      // Optimus Melee: Heavy punch
      bs.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 200,
        ease: "Power2",
        onComplete: () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("optimus", transLevel, "attack"));

          if (bs.cache.audio.exists("sfx_attack"))
            bs.sound.play("sfx_attack", { volume: 1.5 });
          bs.createImpactEffect(target.x, target.y + 120, 0xffaa00);
          bs.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 25 : 15) *
                bs.getDamageMultiplier(transLevel),
            ),
          );
          bs.cameras.main.shake(200, 0.02);

          bs.time.delayedCall(250, () => {
            if (!bs.scene.isActive()) return;
            bs.tweens.add({
              targets: attacker,
              x: startX,
              duration: 200,
              onComplete: () => {
                attacker.play(bs.getAnimKey("optimus", transLevel, "idle"));
                bs.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // Optimus Ki: Ion Blaster
      attacker.play(bs.getAnimKey("optimus", transLevel, "attack"));
      bs.time.delayedCall(100, () => {
        if (!bs.scene.isActive()) return;
        if (bs.cache.audio.exists("sfx_beam"))
          bs.sound.play("sfx_beam", { volume: 1.2 });

        const hand = bs.getHandPosition(isPlayer);
        const blast = bs.add
          .rectangle(hand.x, hand.y, 30, 8, 0x00ffff)
          .setDepth(5);

        bs.tweens.add({
          targets: blast,
          x: target.x,
          duration: 150,
          onComplete: () => {
            blast.destroy();
            if (!bs.scene.isActive()) return;
            bs.createImpactEffect(target.x, target.y + 120, 0x00ffff);
            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 20 : 12) *
                  bs.getDamageMultiplier(transLevel),
              ),
            );
          },
        });

        bs.time.delayedCall(300, () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("optimus", transLevel, "idle"));
          bs.setActionState(isPlayer, false);
        });
      });
    }

    return null as any;
  }

  performSpecial(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    const transLevel = transformLevel;
    
    // specialMissiles
    bs.log("MISSILE STRIKE!");
    const isS = false;
    const count = isS ? 12 : 6; // More missiles
    const hand = bs.getHandPosition(isPlayer);
    const baseDmg = isS ? 8 : 12;
    const dmg = Math.floor(baseDmg * bs.getDamageMultiplier(transLevel));

    const fireOne = (delay: number) => {
      bs.time.delayedCall(delay, () => {
        if (!bs.scene.isActive()) return;

        // Missile Graphic
        const m = bs.add
          .rectangle(hand.x, hand.y - 30, 20, 8, 0xffffff)
          .setDepth(5);
        const mGlow = bs.add
          .rectangle(hand.x, hand.y - 30, 30, 12, 0xffaa00)
          .setDepth(4)
          .setAlpha(0.6)
          .setBlendMode(Phaser.BlendModes.ADD);

        // Smoke Particle Emitter
        let smoke: any;
        try {
        smoke = bs.add.particles(0, 0, "particle", {
          follow: m,
          scale: { start: 1.2, end: 0 },
          lifespan: 600,
          tint: [0xffaa00, 0x555555, 0x222222], // Fire to smoke
          frequency: 15,
          blendMode: "ADD",
        });
        } catch(e) {}

        const targetX = target.x;
        const targetY = target.y + Phaser.Math.Between(-50, 100); // Hit various body parts

        // High Arc
        const midX = (hand.x + targetX) / 2 + Phaser.Math.Between(-100, 100);
        const midY = hand.y - Phaser.Math.Between(200, 400);

        const curve = new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(hand.x, hand.y - 30),
          new Phaser.Math.Vector2(midX, midY),
          new Phaser.Math.Vector2(targetX, targetY),
        );

        let t = { val: 0 };
        bs.tweens.add({
          targets: t,
          val: 1,
          duration: Phaser.Math.Between(500, 800),
          ease: "Sine.easeIn",
          onUpdate: () => {
            const pos = curve.getPoint(t.val);
            m.setPosition(pos.x, pos.y);
            mGlow.setPosition(pos.x, pos.y);
            const angle = curve.getTangent(t.val).angle();
            m.rotation = angle;
            mGlow.rotation = angle;
          },
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            m.destroy();
            mGlow.destroy();
            if (smoke) {
                smoke.stop();
                bs.time.delayedCall(600, () => smoke.destroy());
            }

            bs.createImpactEffect(targetX, targetY, 0xffaa00);
            bs.takeDamage(!isPlayer, dmg);

            // Shockwave ring
            const ring = bs.add
              .circle(targetX, targetY, 10, 0xffaa00)
              .setStrokeStyle(3, 0xffaa00)
              .setDepth(20)
              .setAlpha(0)
              .setBlendMode(Phaser.BlendModes.ADD);
            ring.isFilled = false;
            bs.tweens.add({
              targets: ring,
              scale: 4,
              alpha: { start: 1, end: 0 },
              duration: 200,
              ease: "Cubic.easeOut",
              onComplete: () => ring.destroy(),
            });

            // Small explosion
            const explosion = bs.add
              .circle(targetX, targetY, 5, 0xffaa00)
              .setDepth(20)
              .setBlendMode(Phaser.BlendModes.ADD);
            bs.tweens.add({
              targets: explosion,
              scale: 5,
              alpha: 0,
              duration: 200,
              onComplete: () => explosion.destroy(),
            });

            bs.cameras.main.shake(100, 0.02);
            if (bs.cache.audio.exists("sfx_explosion"))
              bs.sound.play("sfx_explosion", { volume: 0.3 });
          },
        });
      });
    };

    for (let i = 0; i < count; i++) fireOne(i * 100); // Rapid fire

    bs.time.delayedCall(count * 100 + 800, () => {
      if (bs.scene.isActive()) bs.onSpecialComplete(isPlayer);
    });

    return null as any;
  }

  performSuper(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    const transLevel = transformLevel;
    
    // specialMatrixBlast
    const dmg = Math.floor(125 * bs.getDamageMultiplier(transLevel));

    bs.log("MATRIX BLAST!");
    if (bs.cache.audio.exists("sfx_beam")) bs.sound.play("sfx_beam");

    // Open chest (visual effect)
    const hand = bs.getHandPosition(isPlayer);
    const matrix = bs.add
      .circle(hand.x, hand.y, 10, 0x00eaff)
      .setDepth(15)
      .setBlendMode(Phaser.BlendModes.ADD);
    const matrixCore = bs.add
      .circle(hand.x, hand.y, 5, 0xffffff)
      .setDepth(16);

    bs.cameras.main.shake(800, 0.01);

    // Gathering particles
    let gatherParticles: any;
    try {
    gatherParticles = bs.add
      .particles(0, 0, "particle", {
        x: hand.x,
        y: hand.y,
        speed: { min: -250, max: 250 },
        scale: { start: 1.8, end: 0 },
        blendMode: "ADD",
        lifespan: 500,
        tint: 0x00eaff,
        gravityY: 0,
      })
      .setDepth(14);
      } catch(e) {}

    bs.tweens.add({
      targets: [matrix, matrixCore],
      scale: 25,
      alpha: { start: 1, end: 0.8 },
      duration: 800,
      yoyo: true,
      repeat: 0,
      onComplete: () => {
        if (!bs.scene.isActive()) return;
        matrix.destroy();
        matrixCore.destroy();
        if (gatherParticles) gatherParticles.destroy();

        bs.createScreenFlash(0x00eaff, 500, 0.9);
        bs.cameras.main.shake(1200, 0.1);

        // Massive Beam
        const beamOuter = bs.add
          .rectangle(hand.x, hand.y, 0, 240, 0x00eaff)
          .setOrigin(0, 0.5)
          .setDepth(4)
          .setAlpha(0.5)
          .setBlendMode(Phaser.BlendModes.ADD);
        const beam = bs.add
          .rectangle(hand.x, hand.y, 0, 180, 0x00eaff)
          .setOrigin(0, 0.5)
          .setDepth(5)
          .setAlpha(0.9)
          .setBlendMode(Phaser.BlendModes.ADD);
        const beamCore = bs.add
          .rectangle(hand.x, hand.y, 0, 90, 0xffffff)
          .setOrigin(0, 0.5)
          .setDepth(6);
        beamOuter.scaleX = isPlayer ? 1 : -1;
        beam.scaleX = isPlayer ? 1 : -1;
        beamCore.scaleX = isPlayer ? 1 : -1;
        const distance = Math.abs(target.x - attacker.x) + 200;

        // Beam Head
        const beamHeadGlow = bs.add
          .ellipse(hand.x, hand.y, 140, 280, 0x00eaff)
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
            const tipX = isPlayer
              ? attacker.x + beam.width
              : attacker.x - beam.width;
            beamHeadGlow.setPosition(tipX, hand.y);
            beamHead.setPosition(tipX, hand.y);
          },
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            bs.createImpactEffect(target.x, target.y + 120, 0x00eaff, "beam");
            bs.takeDamage(!isPlayer, dmg);

            // Massive Shockwave rings
            for (let i = 0; i < 6; i++) {
              const ring = bs.add
                .circle(target.x, target.y + 120, 40, 0x00eaff)
                .setStrokeStyle(12, 0x00eaff)
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
}
