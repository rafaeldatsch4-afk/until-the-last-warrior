import Phaser from "phaser";
import { Fighter } from "./base/Fighter";
import { AttackParams, AttackResult } from "./base/FighterTypes";

export class ObitoFighter extends Fighter {
  readonly key = "obito";
  readonly specialName = "KAMUI";
  readonly superName = "TEN-TAILS BEAST BOMB";
  readonly specialColor = 0x000000;

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
    const startY = attacker.y;

    if (attackType === "melee") {
      // Obito Melee: Staff strike (Paulada)
      attacker.play(bs.getAnimKey("obito", transformLevel, "attack"));

      // Dash forward
      bs.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 100,
        ease: "Power2",
        onComplete: () => {
          if (!bs.scene.isActive()) return;

          if (bs.soundManager) bs.soundManager.playPunchImpact(true);

          // Visual effect for the staff hit
          const hitColor = transformLevel === 1 ? 0x000000 : 0xffaa00;
          const hitLine = bs.add
            .rectangle(target.x, target.y + 120, 60, 6, hitColor)
            .setRotation(isPlayer ? 0.5 : -0.5)
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
          bs.cameras.main.shake(150, 0.02);

          bs.time.delayedCall(200, () => {
            if (!bs.scene.isActive()) return;

            // Dash back
            bs.tweens.add({
              targets: attacker,
              x: startX,
              duration: 150,
              ease: "Power2",
              onComplete: () => {
                attacker.play(bs.getAnimKey("obito", transformLevel, "idle"));
                bs.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // Obito Ki: Fireball / Truth-Seeking Orb
      attacker.play(bs.getAnimKey("obito", transformLevel, "attack"));
      bs.time.delayedCall(150, () => {
        if (!bs.scene.isActive()) return;
        if (bs.soundManager) bs.soundManager.playBeamFire();

        const orbColor = transformLevel === 1 ? 0x111111 : 0xff4500;
        const hand = bs.getHandPosition(isPlayer);
        const orb = bs.add
          .circle(hand.x, hand.y, isComboFinisher ? 25 : 15, orbColor)
          .setDepth(5);
        if (transformLevel === 1) orb.setStrokeStyle(2, 0xffffff); // White outline for truth-seeking orb

        bs.tweens.add({
          targets: orb,
          x: target.x,
          duration: 200,
          onComplete: () => {
            orb.destroy();
            if (!bs.scene.isActive()) return;
            bs.createImpactEffect(target.x, target.y + 120, orbColor);
            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 25 : 15) *
                  bs.getDamageMultiplier(transformLevel),
              ),
            );
            bs.cameras.main.shake(isComboFinisher ? 150 : 50, 0.01);

            attacker.play(bs.getAnimKey("obito", transformLevel, "idle"));
            bs.setActionState(isPlayer, false);
          },
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

    // Obito specialKamui
    const dmg = Math.floor(60 * bs.getDamageMultiplier(transformLevel));
    const startX = attacker.x;

    bs.log("KAMUI!");
    if (bs.soundManager) bs.soundManager.playPunchImpact(true);

    // Swirl effect around attacker
    const swirlGlow = bs.add
      .circle(attacker.x, attacker.y + 120, 60, 0x000000)
      .setDepth(14)
      .setAlpha(0.6);
    const swirl = bs.add.graphics().setDepth(15);
    swirl.lineStyle(10, 0x000000, 0.9);
    swirl.strokeCircle(attacker.x, attacker.y, 40);

    const swirlCore = bs.add
      .circle(attacker.x, attacker.y + 120, 15, 0x000000)
      .setDepth(16);

    // Distortion spiral
    const spiral = bs.add
      .particles(attacker.x, attacker.y, "particle", {
        color: [0x000000, 0x444444],
        colorEase: "quad.out",
        lifespan: 500,
        angle: { min: 0, max: 360 },
        scale: { start: 2, end: 0 },
        speed: { min: 100, max: 200 },
        blendMode: "MULTIPLY",
      })
      .setDepth(14);

    bs.cameras.main.shake(300, 0.02);

    bs.tweens.add({
      targets: [swirl, swirlCore],
      scale: 0,
      duration: 300,
      ease: "Cubic.easeIn",
      onComplete: () => {
        if (!bs.scene.isActive()) return;
        spiral.stop();

        // Warp attacker out
        bs.tweens.add({
          targets: attacker,
          scale: 0,
          alpha: 0,
          duration: 100,
          onComplete: () => {
            if (!bs.scene.isActive()) return;

            // Instantly warp to target
            attacker.x = target.x + (attacker.x < target.x ? 60 : -60);

            // Warp attacker back in
            bs.tweens.add({
              targets: attacker,
              scale: 2,
              alpha: 1,
              duration: 100,
              onComplete: () => {
                // Strike
                bs.createImpactEffect(
                  target.x,
                  target.y + 120,
                  0x000000,
                  "melee",
                );
                bs.takeDamage(!isPlayer, dmg);
                bs.cameras.main.shake(200, 0.04);

                bs.time.delayedCall(200, () => {
                  if (!bs.scene.isActive()) return;

                  // Warp out again
                  bs.tweens.add({
                    targets: attacker,
                    scale: 0,
                    alpha: 0,
                    duration: 100,
                    onComplete: () => {
                      // Warp back to start position
                      attacker.x = startX;
                      bs.tweens.add({
                        targets: attacker,
                        scale: 2,
                        alpha: 1,
                        duration: 100,
                        onComplete: () => {
                          swirl.destroy();
                          swirlCore.destroy();
                          swirlGlow.destroy();
                          spiral.destroy();
                          bs.onSpecialComplete(isPlayer);
                        },
                      });
                    },
                  });
                });
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

    // specialTenTailsBeastBomb
    const dmg = Math.floor(130 * bs.getDamageMultiplier(transformLevel));

    bs.log("TEN-TAILS BEAST BOMB!");
    if (bs.soundManager) bs.soundManager.playBeamFire();

    // Charge massive dark red/black sphere
    const bombGlow = bs.add
      .circle(attacker.x, attacker.y - 120, 15, 0xcc0000)
      .setDepth(14)
      .setAlpha(0.6)
      .setBlendMode(Phaser.BlendModes.ADD);
    const bomb = bs.add
      .circle(attacker.x, attacker.y - 120, 5, 0x111111)
      .setDepth(15);
    const aura = bs.add
      .circle(attacker.x, attacker.y - 120, 8, 0xcc0000)
      .setDepth(14)
      .setAlpha(0.6)
      .setBlendMode(Phaser.BlendModes.ADD);

    bs.cameras.main.shake(1000, 0.02);

    // Gathering particles
    const gatherParticles = bs.add
      .particles(0, 0, "particle", {
        x: attacker.x,
        y: attacker.y - 120,
        speed: { min: -350, max: 350 },
        scale: { start: 2, end: 0 },
        blendMode: "ADD",
        lifespan: 500,
        tint: 0xcc0000,
        gravityY: 0,
      })
      .setDepth(16);

    bs.tweens.add({
      targets: [bomb, aura, bombGlow],
      scale: 15,
      duration: 1000,
      onComplete: () => {
        if (!bs.scene.isActive()) return;
        gatherParticles.destroy();

        bs.createScreenFlash(0xcc0000, 500, 0.9);
        bs.cameras.main.shake(1000, 0.08);

        // Fire as a massive beam
        const beamOuter = bs.add
          .rectangle(attacker.x, attacker.y - 120, 0, 250, 0xcc0000)
          .setOrigin(isPlayer ? 0 : 1, 0.5)
          .setDepth(10)
          .setBlendMode(Phaser.BlendModes.ADD);

        const beamCore = bs.add
          .rectangle(attacker.x, attacker.y - 120, 0, 180, 0x111111) // Black core
          .setOrigin(isPlayer ? 0 : 1, 0.5)
          .setDepth(11);

        const dist = Math.abs(target.x - attacker.x) + 300;

        bs.tweens.add({
          targets: [beamOuter, beamCore],
          width: dist,
          duration: 150,
          ease: "Power2",
          onComplete: () => {
            if (!bs.scene.isActive()) return;

            bomb.destroy();
            aura.destroy();
            bombGlow.destroy();

            bs.createScreenFlash(0xcc0000, 600, 1);
            bs.cameras.main.shake(1500, 0.15);

            bs.createImpactEffect(target.x, target.y + 120, 0xcc0000, "beam");
            bs.takeDamage(!isPlayer, dmg);

            bs.tweens.add({
              targets: [beamOuter, beamCore],
              alpha: 0,
              duration: 400,
              ease: "Cubic.easeOut",
              onComplete: () => {
                beamOuter.destroy();
                beamCore.destroy();
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
