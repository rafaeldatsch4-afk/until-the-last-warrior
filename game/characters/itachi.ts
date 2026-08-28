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
      // Itachi Melee: Totsuka slash (Susanoo) or Kunai slash (Base)
      attacker.play(bs.getAnimKey("itachi", transformLevel, "attack"));

      // Dash forward
      bs.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 100,
        ease: "Power2",
        onComplete: () => {
          if (!bs.scene.isActive()) return;

          if (bs.soundManager) bs.soundManager.playSwordSlash(isComboFinisher);

          const hitColor = transformLevel === 1 ? 0xff4500 : 0xcccccc; // Susanoo sword or kunai
          
          // Minecraft Java Style Sword/Kunai Sweep Trail
          if (bs.createSwordSweepSlash) {
            bs.createSwordSweepSlash(target.x, target.y + 60, isPlayer, hitColor, transformLevel === 1 ? 1.4 : 1.15);
          } else if (bs.effects?.createSwordSweepSlash) {
            bs.effects.createSwordSweepSlash(target.x, target.y + 60, isPlayer, hitColor, transformLevel === 1 ? 1.4 : 1.15);
          }

          bs.createImpactEffect(target.x, target.y + 60, hitColor, "melee");
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
      attacker.play(bs.getAnimKey("itachi", transformLevel, "punch"));

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
    attacker.play(bs.getAnimKey("itachi", transformLevel, "punch"));
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
    
    // Safety auto-destroy fallback
    bs.time.delayedCall(3000, () => {
      try {
        if (darkOverlay && darkOverlay.active) darkOverlay.destroy();
      } catch (e) {}
    });

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
        if (particles) {
          try {
            if (particles.stop) particles.stop();
          } catch (e) {}
          bs.time.delayedCall(800, () => {
            try { particles.destroy(); } catch (e) {}
          });
        }
      },
    });

    bs.time.delayedCall(1000, () => {
      if (!bs.scene.isActive()) return;
      if (bs.soundManager) bs.soundManager.playExplosion(true);

      bs.createScreenFlash(0xff3333, 220, 0.45);
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
    attacker.play(bs.getAnimKey("itachi", transformLevel, "punch"));
    if (bs.soundManager) bs.soundManager.playBeamFire();

    // Red Tsukuyomi Dimension Background
    const bg = bs.add
      .rectangle(480, 270, 960, 540, 0x8b0000)
      .setDepth(13)
      .setAlpha(0);

    // Guaranteed cleanup safety timer so red screen never freezes
    const cleanupElements = () => {
      try {
        if (bg && bg.active) bg.destroy();
      } catch (e) {}
    };
    bs.time.delayedCall(4500, cleanupElements);

    bs.tweens.add({
      targets: bg,
      alpha: 0.85,
      duration: 250,
      onComplete: () => {
        if (!bs.scene.isActive()) {
          cleanupElements();
          return;
        }

        // Giant Sharingan Eye in Background
        const eyeGlow = bs.add
          .circle(480, 270, 180, 0xff0000)
          .setDepth(13)
          .setAlpha(0)
          .setBlendMode(Phaser.BlendModes.ADD);
        const eye = bs.add
          .circle(480, 270, 140, 0xd63031)
          .setDepth(14)
          .setAlpha(0);
        const pupil = bs.add
          .circle(480, 270, 26, 0x111111)
          .setDepth(14)
          .setAlpha(0);

        // Sharingan Tomoe Container
        const tomoeContainer = bs.add.container(480, 270).setDepth(14).setAlpha(0);
        const tomoes: Phaser.GameObjects.Graphics[] = [];
        for (let i = 0; i < 3; i++) {
          const t = bs.add.graphics();
          t.fillStyle(0x111111, 1);
          t.fillCircle(0, 0, 14);
          const angle = (i * Math.PI * 2) / 3;
          t.setPosition(Math.cos(angle) * 70, Math.sin(angle) * 70);
          tomoeContainer.add(t);
          tomoes.push(t);
        }

        bs.createScreenFlash(0xffffff, 200, 0.8);
        bs.cameras.main.shake(800, 0.02);

        // Fade in Sharingan Eye
        bs.tweens.add({
          targets: [eye, pupil, eyeGlow, tomoeContainer],
          alpha: 1,
          scale: 1.4,
          duration: 400,
          ease: "Power2",
          onComplete: () => {
            // Spin the tomoes smoothly
            bs.tweens.add({
              targets: tomoeContainer,
              angle: 360,
              duration: 900,
              ease: "Linear",
              onComplete: () => {
                // Fade out Sharingan Eye
                bs.tweens.add({
                  targets: [eye, pupil, eyeGlow, tomoeContainer],
                  alpha: 0,
                  scale: 0.8,
                  duration: 250,
                  onComplete: () => {
                    eye.destroy();
                    pupil.destroy();
                    eyeGlow.destroy();
                    tomoeContainer.destroy();
                  },
                });

                // Fade out red background
                bs.tweens.add({
                  targets: bg,
                  alpha: 0,
                  duration: 300,
                  onComplete: () => {
                    cleanupElements();
                  },
                });

                if (bs.soundManager) bs.soundManager.playExplosion(true);

                // Multiple Tsukuyomi invisible slashes
                for (let i = 0; i < 8; i++) {
                  bs.time.delayedCall(i * 70, () => {
                    if (!bs.scene.isActive()) return;
                    bs.createImpactEffect(
                      target.x + Phaser.Math.Between(-40, 40),
                      target.y + 120 + Phaser.Math.Between(-40, 40),
                      0x000000,
                      "melee",
                    );
                    bs.cameras.main.shake(120, 0.02);
                  });
                }

                bs.time.delayedCall(650, () => {
                  if (!bs.scene.isActive()) {
                    cleanupElements();
                    return;
                  }

                  bs.createScreenFlash(0xffffff, 500, 1);
                  bs.takeDamage(!isPlayer, dmg);
                  bs.cameras.main.shake(800, 0.08);

                  // Shockwave rings
                  for (let i = 0; i < 5; i++) {
                    const ring = bs.add
                      .circle(target.x, target.y + 120, 40, 0x8b0000)
                      .setStrokeStyle(10, 0x8b0000)
                      .setDepth(20)
                      .setAlpha(0)
                      .setBlendMode(Phaser.BlendModes.ADD);
                    ring.isFilled = false;
                    bs.tweens.add({
                      targets: ring,
                      scale: 10 + i * 5,
                      alpha: { start: 1, end: 0 },
                      duration: 400 + i * 120,
                      ease: "Cubic.easeOut",
                      onComplete: () => ring.destroy(),
                    });
                  }

                  cleanupElements();
                  bs.onSpecialComplete(isPlayer);
                });
              },
            });
          },
        });
      },
    });

    return null as any;
  }
}
