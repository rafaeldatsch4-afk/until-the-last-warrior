import Phaser from "phaser";
import { Fighter } from "./base/Fighter";
import { AttackParams, AttackResult } from "./base/FighterTypes";

export class FrierenFighter extends Fighter {
  readonly key = "frieren";
  readonly specialName = "ZOLTRAAK";
  readonly superName = "BLACK HOLE";
  readonly specialColor = 0xffffff;

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
      attacker.play(bs.getAnimKey("frieren", transLevel, "attack"));
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
              (isComboFinisher ? 15 : 8) * bs.getDamageMultiplier(transLevel),
            ),
          );

          bs.time.delayedCall(200, () => {
            if (!bs.scene.isActive()) return;
            bs.tweens.add({
              targets: attacker,
              x: startX,
              duration: 150,
              onComplete: () => {
                attacker.play(bs.getAnimKey("frieren", transLevel, "idle"));
                bs.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      attacker.play(bs.getAnimKey("frieren", transLevel, "attack"));
      bs.time.delayedCall(100, () => {
        if (!bs.scene.isActive()) return;
        if (bs.soundManager) bs.soundManager.playBeamFire();

        const hand = bs.getHandPosition(isPlayer);
        const beam = bs.add
          .rectangle(
            hand.x,
            hand.y,
            Math.abs(target.x - attacker.x),
            4,
            0xffffff,
          )
          .setOrigin(isPlayer ? 0 : 1, 0.5)
          .setDepth(5);
        bs.tweens.add({
          targets: beam,
          alpha: 0,
          duration: 150,
          onComplete: () => beam.destroy(),
        });

        bs.createImpactEffect(target.x, target.y + 120, 0xffffff);
        bs.takeDamage(
          !isPlayer,
          Math.floor(
            (isComboFinisher ? 20 : 12) * bs.getDamageMultiplier(transLevel),
          ),
        );

        bs.time.delayedCall(250, () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("frieren", transLevel, "idle"));
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
    const isS = false;

    // specialZoltraak
    const hand = bs.getHandPosition(isPlayer);
    const circleOffset = attacker.x < target.x ? 40 : -40;
    const baseDmg = isS ? 80 : 50;
    const dmg = Math.floor(baseDmg * bs.getDamageMultiplier(transLevel));

    bs.log("ZOLTRAAK!");

    bs.cameras.main.shake(500, 0.01);

    // Always 3 Circles for maximum epicness
    const circles: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 3; i++) {
      const c = bs.add
        .graphics()
        .setDepth(5)
        .setBlendMode(Phaser.BlendModes.ADD);
      c.lineStyle(3 + i, 0xffffff, 0.8);
      c.strokeCircle(0, 0, 30 + i * 10); // Concentric sizes
      c.strokeRect(-20 - i * 5, -20 - i * 5, 40 + i * 10, 40 + i * 10);
      c.setPosition(hand.x + circleOffset, hand.y);
      c.setRotation(i * 0.5); // Different start rotations
      circles.push(c);
    }

    // Gathering particles
    let gatherParticles: any;
    try {
      gatherParticles = bs.add
        .particles(0, 0, "particle", {
          x: hand.x + circleOffset,
          y: hand.y,
          speed: { min: -150, max: 150 },
          scale: { start: 1, end: 0 },
          blendMode: "ADD",
          lifespan: 400,
          tint: 0xffffff,
          gravityY: 0,
        })
        .setDepth(14);
    } catch (e) {}

    // Spin up
    bs.tweens.add({
      targets: circles,
      angle: 360,
      scale: 1.5,
      duration: 600,
      ease: "Cubic.easeIn",
      onComplete: () => {
        if (!bs.scene.isActive()) return;
        circles.forEach((c) => c.destroy());
        if (gatherParticles) gatherParticles.destroy();

        bs.createScreenFlash(0xffffff, 300, 0.9);
        bs.cameras.main.shake(600, 0.05);

        // MASSIVE BEAM "JUDGEMENT" STYLE
        const distance = Math.abs(target.x - hand.x) + 200;
        const originX = 0; // FIX: Added origin direction logic

        // Outer Glow
        const beamOuter = bs.add
          .rectangle(hand.x, hand.y, distance, 250, 0xffffff)
          .setOrigin(originX, 0.5)
          .setAlpha(0.4)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(9);
        beamOuter.scaleX = isPlayer ? 1 : -1;

        // Black void beam
        const massiveBeam = bs.add
          .rectangle(hand.x, hand.y, distance, 150, 0x000000)
          .setOrigin(originX, 0.5) // FIX: Set Origin
          .setAlpha(0.9)
          .setDepth(10);
        massiveBeam.scaleX = isPlayer ? 1 : -1;

        // White hot core
        const core = bs.add
          .rectangle(hand.x, hand.y, distance, 60, 0xffffff)
          .setOrigin(originX, 0.5) // FIX: Set Origin
          .setDepth(11);
        core.scaleX = isPlayer ? 1 : -1;

        bs.createImpactEffect(target.x, hand.y, 0x000000, "beam");
        bs.createImpactEffect(target.x, target.y + 120, 0xffffff, "beam");
        bs.takeDamage(!isPlayer, dmg); // Buffed dmg

        // Massive Shockwave rings
        for (let i = 0; i < 3; i++) {
          const ring = bs.add
            .circle(target.x, target.y + 120, 40, 0xffffff)
            .setStrokeStyle(8, 0xffffff)
            .setDepth(20)
            .setAlpha(0)
            .setBlendMode(Phaser.BlendModes.ADD);
          ring.isFilled = false;
          bs.tweens.add({
            targets: ring,
            scale: 8 + i * 4,
            alpha: { start: 1, end: 0 },
            duration: 300 + i * 100,
            ease: "Cubic.easeOut",
            onComplete: () => ring.destroy(),
          });
        }

        bs.tweens.add({
          targets: [beamOuter, massiveBeam, core],
          scaleY: 0,
          alpha: 0,
          duration: 500,
          ease: "Quad.easeIn",
          onComplete: () => {
            beamOuter.destroy();
            massiveBeam.destroy();
            core.destroy();
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

    // specialBlackHole
    const dmg = Math.floor(115 * bs.getDamageMultiplier(transLevel));

    bs.log("BLACK HOLE!");
    if (bs.soundManager) bs.soundManager.playBeamFire();

    // Create black hole on target
    const hole = bs.add
      .circle(target.x, target.y + 120, 5, 0x000000)
      .setDepth(15);
    const ring = bs.add
      .circle(target.x, target.y + 120, 10, 0x9b59b6)
      .setDepth(14)
      .setStrokeStyle(6, 0x9b59b6)
      .setBlendMode(Phaser.BlendModes.ADD);
    const aura = bs.add
      .circle(target.x, target.y + 120, 15, 0x9b59b6)
      .setDepth(13)
      .setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD);

    bs.cameras.main.shake(800, 0.02);

    // Suck particles
    let suckParticles: any;
    try {
      suckParticles = bs.add
        .particles(0, 0, "particle", {
          x: target.x,
          y: target.y + 120,
          speed: { min: -300, max: -100 }, // Negative speed pulls them in
          scale: { start: 1.5, end: 0 },
          blendMode: "ADD",
          lifespan: 600,
          tint: [0x9b59b6, 0xffffff],
          gravityY: 0,
        })
        .setDepth(16);
    } catch (e) {}

    // Swirl effect
    const swirlTween = bs.tweens.add({
      targets: ring,
      rotation: Math.PI * 10,
      duration: 1500,
    });

    bs.tweens.add({
      targets: [hole, ring, aura],
      scale: 15,
      duration: 800,
      ease: "Sine.easeOut",
      onComplete: () => {
        if (!bs.scene.isActive()) return;

        bs.createScreenFlash(0x9b59b6, 300, 0.6);
        bs.cameras.main.shake(600, 0.05);

        // Suck effect on target
        bs.tweens.add({
          targets: target,
          scaleX: 0.2,
          scaleY: 0.2,
          alpha: 0.2,
          rotation: Math.PI * 4,
          duration: 600,
          yoyo: true,
          ease: "Cubic.easeInOut",
          onComplete: () => {
            if (!bs.scene.isActive()) return;

            if (suckParticles) suckParticles.stop();
            swirlTween.stop();

            // Massive explosion
            bs.createScreenFlash(0xffffff, 600, 1);
            bs.cameras.main.shake(1000, 0.1);

            const explosion = bs.add
              .circle(target.x, target.y + 120, 10, 0x9b59b6)
              .setDepth(20)
              .setBlendMode(Phaser.BlendModes.ADD);
            const explosionCore = bs.add
              .circle(target.x, target.y + 120, 5, 0xffffff)
              .setDepth(21)
              .setBlendMode(Phaser.BlendModes.ADD);

            // Shockwave rings
            for (let i = 0; i < 6; i++) {
              const shockRing = bs.add
                .circle(target.x, target.y + 120, 40, 0x9b59b6)
                .setStrokeStyle(12, 0x9b59b6)
                .setDepth(22)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              shockRing.isFilled = false;
              bs.tweens.add({
                targets: shockRing,
                scale: 12 + i * 6,
                alpha: { start: 1, end: 0 },
                duration: 500 + i * 120,
                ease: "Cubic.easeOut",
                onComplete: () => shockRing.destroy(),
              });
            }

            bs.tweens.add({
              targets: [explosion, explosionCore],
              scale: 45,
              alpha: 0,
              duration: 800,
              onComplete: () => {
                explosion.destroy();
                explosionCore.destroy();
              },
            });

            bs.createImpactEffect(target.x, target.y + 120, 0x9b59b6, "beam");
            bs.takeDamage(!isPlayer, dmg);

            bs.tweens.add({
              targets: [hole, ring, aura],
              scale: 0,
              alpha: 0,
              duration: 300,
              onComplete: () => {
                hole.destroy();
                ring.destroy();
                aura.destroy();
                bs.time.delayedCall(600, () => {
                  if (suckParticles) suckParticles.destroy();
                });
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
