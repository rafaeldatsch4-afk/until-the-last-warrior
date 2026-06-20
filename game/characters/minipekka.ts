import Phaser from "phaser";
import { Fighter } from "./base/Fighter";
import { AttackParams, AttackResult } from "./base/FighterTypes";

export class MiniPekkaFighter extends Fighter {
  readonly key = "minipekka";
  readonly specialName = "PANCAKES";
  readonly superName = "MEGA PANCAKE";
  readonly specialColor = 0xffaa00;

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
    const transLevel = transformLevel;

    if (attackType === "melee") {
      // MiniPekka Melee: Heavy sword slash
      bs.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -30 : 30),
        duration: 150,
        onComplete: () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("minipekka", transLevel, "attack"));

          if (bs.cache.audio.exists("sfx_attack"))
            bs.sound.play("sfx_attack", { volume: 1.5 });

          // Sword arc
          const arc = bs.add.graphics().setDepth(6);
          arc.lineStyle(6, 0xaaaaaa, 1);
          arc.beginPath();
          arc.arc(
            attacker.x,
            attacker.y,
            40,
            isPlayer ? -Math.PI / 2 : Math.PI / 2,
            isPlayer ? Math.PI / 2 : -Math.PI / 2,
            isPlayer ? false : true,
          );
          arc.strokePath();
          bs.tweens.add({
            targets: arc,
            alpha: 0,
            scale: 1.2,
            duration: 150,
            onComplete: () => arc.destroy(),
          });

          bs.createImpactEffect(target.x, target.y + 120, 0xffffff);
          bs.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 30 : 15) * bs.getDamageMultiplier(transLevel),
            ),
          );
          bs.cameras.main.shake(150, 0.02);

          bs.time.delayedCall(200, () => {
            if (!bs.scene.isActive()) return;
            bs.tweens.add({
              targets: attacker,
              x: startX,
              duration: 200,
              onComplete: () => {
                attacker.play(bs.getAnimKey("minipekka", transLevel, "idle"));
                bs.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // MiniPekka Ki: Pancake throw
      attacker.play(bs.getAnimKey("minipekka", transLevel, "attack"));
      bs.time.delayedCall(100, () => {
        if (!bs.scene.isActive()) return;
        if (bs.cache.audio.exists("sfx_beam"))
          bs.sound.play("sfx_beam", { volume: 0.8 });

        const hand = bs.getHandPosition(isPlayer);
        const pancake = bs.add
          .ellipse(hand.x, hand.y, 20, 10, 0xd2b48c)
          .setDepth(5);

        bs.tweens.add({
          targets: pancake,
          x: target.x,
          rotation: Math.PI * 2,
          duration: 200,
          onComplete: () => {
            pancake.destroy();
            if (!bs.scene.isActive()) return;
            bs.createImpactEffect(target.x, target.y + 120, 0xd2b48c);
            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 15 : 8) * bs.getDamageMultiplier(transLevel),
              ),
            );
          },
        });

        bs.time.delayedCall(300, () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("minipekka", transLevel, "idle"));
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
    const startX = attacker.x;
    const startY = attacker.y;
    const transLevel = transformLevel;

    // specialPancake
    const isS = false;
    const baseDmg = isS ? 80 : 50;
    const dmg = Math.floor(baseDmg * bs.getDamageMultiplier(transLevel));

    bs.log("PANCAKES!");
    if (bs.cache.audio.exists("sfx_attack")) bs.sound.play("sfx_attack");

    const animKeySpecial = bs.getAnimKey("minipekka", transLevel, "special");
    const animKeyIdle = bs.getAnimKey("minipekka", transLevel, "idle");
    attacker.play(animKeySpecial);

    // Charge squash
    bs.tweens.add({
      targets: attacker,
      scaleX: 3.5,
      scaleY: 2.5,
      duration: 200,
      ease: "Quad.easeOut",
      onComplete: () => {
        if (!bs.scene.isActive()) return;

        // Shadow looming over target
        const shadow = bs.add.ellipse(
          target.x,
          target.y + 30,
          10,
          5,
          0x000000,
          0.5,
        );
        bs.tweens.add({
          targets: shadow,
          scaleX: 10,
          scaleY: 5,
          duration: 400,
        });

        bs.tweens.add({
          targets: attacker,
          y: startY - 400, // Higher jump
          x: target.x,
          scaleX: 3,
          scaleY: 3,
          duration: 400,
          ease: "Cubic.easeOut",
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            bs.tweens.add({
              targets: attacker,
              y: startY,
              duration: 150, // Faster drop
              ease: "Bounce.easeOut",
              onComplete: () => {
                if (!bs.scene.isActive()) return;

                bs.createScreenFlash(0xffaa00, 300, 0.8);
                bs.cameras.main.shake(500, 0.08); // Big shake

                // Shockwave Rings
                for (let i = 0; i < 3; i++) {
                  const ring = bs.add
                    .circle(target.x, startY, 20, 0xffaa00)
                    .setStrokeStyle(6, 0xffaa00)
                    .setDepth(20)
                    .setAlpha(0)
                    .setBlendMode(Phaser.BlendModes.ADD);
                  ring.isFilled = false;
                  bs.tweens.add({
                    targets: ring,
                    scale: 8 + i * 3,
                    alpha: { start: 1, end: 0 },
                    duration: 300 + i * 100,
                    ease: "Cubic.easeOut",
                    onComplete: () => ring.destroy(),
                  });
                }

                // Impact dust

                try {
                  const dust = bs.add
                    .particles(0, 0, "particle", {
                      x: target.x,
                      y: startY,
                      speed: { min: 100, max: 300 },
                      angle: { min: 180, max: 360 },
                      scale: { start: 2, end: 0 },
                      blendMode: "ADD",
                      lifespan: 500,
                      tint: 0xffaa00,
                      gravityY: 200,
                    })
                    .setDepth(19);
                  bs.time.delayedCall(500, () => dust.destroy());
                } catch (e) {}

                bs.createImpactEffect(target.x, startY, 0xffaa00);
                bs.takeDamage(!isPlayer, dmg);
                shadow.destroy();

                bs.time.delayedCall(400, () => {
                  if (bs.scene.isActive()) {
                    bs.tweens.add({
                      targets: attacker,
                      x: startX,
                      y: startY,
                      duration: 300,
                      onComplete: () => {
                        bs.onSpecialComplete(isPlayer);
                      },
                    });
                  }
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
    const startX = attacker.x;
    const startY = attacker.y;
    const transLevel = transformLevel;

    // specialMegaPancake
    const dmg = Math.floor(130 * bs.getDamageMultiplier(transLevel));

    bs.log("MEGA PANCAKE!");
    if (bs.cache.audio.exists("sfx_attack")) bs.sound.play("sfx_attack");

    const animKeySpecial = bs.getAnimKey("minipekka", transLevel, "special");
    const animKeyIdle = bs.getAnimKey("minipekka", transLevel, "idle");
    attacker.play(animKeySpecial);

    // Charge squash
    bs.tweens.add({
      targets: attacker,
      scaleX: 4,
      scaleY: 2,
      duration: 300,
      ease: "Quad.easeOut",
      onComplete: () => {
        if (!bs.scene.isActive()) return;

        // Shadow looming over target
        const shadow = bs.add.ellipse(
          target.x,
          target.y + 30,
          10,
          5,
          0x000000,
          0.5,
        );
        bs.tweens.add({
          targets: shadow,
          scaleX: 30,
          scaleY: 15,
          duration: 600,
        });

        // Giant Pancake visual
        const pancakeGlow = bs.add
          .ellipse(target.x, target.y - 800, 200, 60, 0xffaa00)
          .setDepth(15)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.6);
        const pancake = bs.add
          .ellipse(target.x, target.y - 800, 180, 50, 0xd35400)
          .setDepth(16);
        const butter = bs.add
          .rectangle(target.x, target.y - 810, 40, 25, 0xf1c40f)
          .setDepth(17);

        // Fire trail
        let trail: any;
        try {
          trail = bs.add
            .particles(0, 0, "particle", {
              follow: pancake,
              speed: { min: -100, max: 100 },
              scale: { start: 2, end: 0 },
              blendMode: "ADD",
              lifespan: 400,
              tint: [0xffaa00, 0xff0000],
              gravityY: -200,
            })
            .setDepth(14);
        } catch (e) {}

        bs.tweens.add({
          targets: [pancakeGlow, pancake, butter],
          y: "+=800",
          duration: 600,
          ease: "Cubic.easeIn",
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            if (trail) trail.stop();

            bs.createScreenFlash(0xffaa00, 500, 1);
            bs.cameras.main.shake(1200, 0.12); // MASSIVE SHAKE

            // Shockwave Rings
            for (let i = 0; i < 6; i++) {
              const ring = bs.add
                .ellipse(target.x, target.y + 20, 120, 40, 0xffaa00)
                .setStrokeStyle(12, 0xffaa00)
                .setDepth(20)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              ring.isFilled = false;
              bs.tweens.add({
                targets: ring,
                scale: 10 + i * 4,
                alpha: { start: 1, end: 0 },
                duration: 500 + i * 150,
                ease: "Cubic.easeOut",
                onComplete: () => ring.destroy(),
              });
            }

            // Impact dust
            try {
              const dust = bs.add
                .particles(0, 0, "particle", {
                  x: target.x,
                  y: target.y + 20,
                  speed: { min: 300, max: 700 },
                  angle: { min: 180, max: 360 },
                  scale: { start: 4, end: 0 },
                  blendMode: "ADD",
                  lifespan: 800,
                  tint: 0xffaa00,
                  gravityY: 400,
                })
                .setDepth(19);
              bs.time.delayedCall(800, () => dust.destroy());
            } catch (e) {}

            bs.createImpactEffect(target.x, target.y + 120, 0xd35400, "beam");
            bs.takeDamage(!isPlayer, dmg);

            bs.tweens.add({
              targets: attacker,
              scaleX: 3,
              scaleY: 3,
              duration: 200,
              ease: "Quad.easeIn",
            });

            bs.tweens.add({
              targets: [pancakeGlow, pancake, butter, shadow],
              alpha: 0,
              duration: 500,
              onComplete: () => {
                pancakeGlow.destroy();
                pancake.destroy();
                butter.destroy();
                shadow.destroy();
                attacker.play(animKeyIdle);
                bs.time.delayedCall(500, () => {
                  if (trail) trail.destroy();
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
