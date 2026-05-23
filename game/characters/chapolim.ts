import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class ChapolimFighter extends Fighter {
  readonly key = 'chapolim';
  readonly specialName = 'CHIPOTE CHILLÓN';
  readonly superName = 'AEROLITOS';
  readonly specialColor = 0xff0000;

  performTransform(scene: any, isPlayer: boolean): void {}

  performAttack(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, attackType, isComboFinisher, transformLevel } = params;
    const bs = scene as any;
    const startX = attacker ? attacker.x : (isPlayer ? bs.player.x : bs.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? bs.player.y : bs.enemy.y);
    const transLevel = transformLevel;

    if (attackType === "melee") {
      attacker.play(bs.getAnimKey("chapolim", transLevel, "attack"));
      bs.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -30 : 30),
        y: target.y - 30,
        duration: 150,
        onComplete: () => {
          if (!bs.scene.isActive()) return;
          if (bs.cache.audio.exists("sfx_attack"))
            bs.sound.play("sfx_attack", { volume: 1.5 });

          const hammer = bs.add
            .rectangle(target.x, target.y + 120, 20, 10, 0xff0000)
            .setDepth(6);
          bs.tweens.add({
            targets: hammer,
            alpha: 0,
            y: target.y + 120,
            duration: 150,
            onComplete: () => hammer.destroy(),
          });

          bs.createImpactEffect(target.x, target.y + 120, 0xffff00);
          bs.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 25 : 15) *
                bs.getDamageMultiplier(transLevel),
            ),
          );
          bs.cameras.main.shake(100, 0.02);

          bs.time.delayedCall(200, () => {
            if (!bs.scene.isActive()) return;
            bs.tweens.add({
              targets: attacker,
              x: startX,
              y: startY,
              duration: 150,
              onComplete: () => {
                attacker.play(bs.getAnimKey("chapolim", transLevel, "idle"));
                bs.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      attacker.play(bs.getAnimKey("chapolim", transLevel, "attack"));
      bs.time.delayedCall(100, () => {
        if (!bs.scene.isActive()) return;
        if (bs.cache.audio.exists("sfx_beam"))
          bs.sound.play("sfx_beam", { volume: 0.8 });

        const hand = bs.getHandPosition(isPlayer);
        const heart = bs.add
          .text(hand.x, hand.y, "CH", {
            color: "#ffff00",
            fontSize: "16px",
            fontStyle: "bold",
          })
          .setOrigin(0.5)
          .setDepth(5);

        bs.tweens.add({
          targets: heart,
          x: target.x,
          duration: 200,
          onComplete: () => {
            heart.destroy();
            if (!bs.scene.isActive()) return;
            bs.createImpactEffect(target.x, target.y + 120, 0xffff00);
            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 15 : 8) *
                  bs.getDamageMultiplier(transLevel),
              ),
            );
          },
        });

        bs.time.delayedCall(300, () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("chapolim", transLevel, "idle"));
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
    
    // specialChipote
    const dmg = Math.floor(40 * bs.getDamageMultiplier(transLevel));

    bs.log("CHIPOTE CHILLÓN!");
    if (bs.cache.audio.exists("sfx_attack")) bs.sound.play("sfx_attack");

    // Create a giant mallet sprite (using graphics)
    const mallet = bs.add.graphics().setDepth(15);
    mallet.fillStyle(0xff0000, 1);
    mallet.fillRect(-20, -30, 40, 60); // Head
    mallet.fillStyle(0xffff00, 1);
    mallet.fillRect(-25, -20, 50, 40); // Yellow middle
    mallet.fillStyle(0xffff00, 1);
    mallet.fillRect(-5, 30, 10, 80); // Handle

    const startX = attacker.x + (attacker.x < target.x ? 50 : -50);
    const startY = attacker.y - 100;
    mallet.setPosition(startX, startY);
    mallet.rotation = isPlayer ? -Math.PI / 4 : Math.PI / 4;

    // Charge up effect
    bs.tweens.add({
      targets: mallet,
      scale: 2.5,
      duration: 300,
      ease: "Back.easeOut",
      onComplete: () => {
        bs.tweens.add({
          targets: mallet,
          x: target.x,
          y: target.y - 50,
          rotation: isPlayer ? Math.PI / 2 : -Math.PI / 2,
          duration: 200,
          ease: "Cubic.easeIn",
          onComplete: () => {
            bs.createScreenFlash(0xff0000, 300, 0.8);
            bs.cameras.main.shake(500, 0.05);

            // Shockwave rings
            for (let i = 0; i < 2; i++) {
              const ring = bs.add
                .circle(target.x, target.y + 120, 20, 0xff0000)
                .setStrokeStyle(6, 0xff0000)
                .setDepth(20)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              ring.isFilled = false;
              bs.tweens.add({
                targets: ring,
                scale: 6 + i * 3,
                alpha: { start: 1, end: 0 },
                duration: 300 + i * 100,
                ease: "Cubic.easeOut",
                onComplete: () => ring.destroy(),
              });
            }

            // Stars effect
            for (let i = 0; i < 5; i++) {
              const star = bs.add
                .circle(target.x, target.y + 120, 5, 0xffff00)
                .setDepth(16);
              bs.tweens.add({
                targets: star,
                x: target.x + Phaser.Math.Between(-100, 100),
                y: target.y + 120 + Phaser.Math.Between(-100, 100),
                alpha: 0,
                scale: 2,
                rotation: Math.PI * 4,
                duration: 500,
                ease: "Cubic.easeOut",
                onComplete: () => star.destroy(),
              });
            }

            bs.createImpactEffect(target.x, target.y + 120, 0xff0000, "beam");
            if (bs.cache.audio.exists("sfx_hit")) bs.sound.play("sfx_hit");
            bs.takeDamage(!isPlayer, dmg);

            bs.tweens.add({
              targets: mallet,
              alpha: 0,
              y: target.y + 120,
              duration: 200,
              onComplete: () => {
                mallet.destroy();
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
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    const transLevel = transformLevel;
    
    // specialAerolitos
    const dmg = Math.floor(110 * bs.getDamageMultiplier(transLevel));

    bs.log("AEROLITOS!");
    if (bs.cache.audio.exists("sfx_beam")) bs.sound.play("sfx_beam");

    bs.cameras.main.shake(1200, 0.03);

    // Drop multiple meteorites
    for (let i = 0; i < 20; i++) {
      bs.time.delayedCall(i * 60, () => {
        if (!bs.scene.isActive()) return;

        const size = Phaser.Math.Between(30, 60);
        const rock = bs.add.circle(0, 0, size, 0x7f8c8d).setDepth(15);

        // Fire trail
        let trail: any;
        try {
        trail = bs.add
          .particles(0, 0, "particle", {
            color: [0xffaa00, 0xff0000],
            colorEase: "quad.out",
            lifespan: 400,
            angle: { min: 250, max: 290 },
            scale: { start: size / 5, end: 0, ease: "sine.out" },
            speed: 150,
            advance: 2000,
            blendMode: "ADD",
          })
          .setDepth(14);
          } catch(e){}

        const startX = target.x + Phaser.Math.Between(-300, 300);
        const startY = -150;
        const targetX = target.x + Phaser.Math.Between(-80, 80);
        const targetY = target.y + 120 + Phaser.Math.Between(-30, 60);

        rock.setPosition(startX, startY);
        if(trail) trail.startFollow(rock);

        bs.tweens.add({
          targets: rock,
          x: targetX,
          y: targetY,
          duration: 250,
          ease: "Linear",
          onComplete: () => {
            bs.createImpactEffect(targetX, targetY, 0xe74c3c, "melee");
            bs.cameras.main.shake(80, 0.02);
            if (bs.cache.audio.exists("sfx_hit"))
              bs.sound.play("sfx_hit", { volume: 0.6 });

            // Small explosion for each rock
            const exp = bs.add
              .circle(targetX, targetY, size, 0xffaa00)
              .setDepth(16)
              .setBlendMode(Phaser.BlendModes.ADD);
            bs.tweens.add({
              targets: exp,
              scale: 3,
              alpha: 0,
              duration: 200,
              onComplete: () => exp.destroy(),
            });

            rock.destroy();
            if(trail) {
                 trail.stop();
                 bs.time.delayedCall(300, () => trail.destroy());
            }

            // Deal damage on the last hit
            if (i === 19) {
              bs.createScreenFlash(0xffaa00, 400, 0.9);
              bs.cameras.main.shake(600, 0.06);
              if (bs.cache.audio.exists("sfx_explosion"))
                bs.sound.play("sfx_explosion");

              // Massive final shockwave
              for (let j = 0; j < 5; j++) {
                const ring = bs.add
                  .circle(target.x, target.y + 120, 50, 0xffaa00)
                  .setStrokeStyle(10, 0xffaa00)
                  .setDepth(20)
                  .setAlpha(0)
                  .setBlendMode(Phaser.BlendModes.ADD);
                ring.isFilled = false;
                bs.tweens.add({
                  targets: ring,
                  scale: 12 + j * 5,
                  alpha: { start: 1, end: 0 },
                  duration: 400 + j * 120,
                  ease: "Cubic.easeOut",
                  onComplete: () => ring.destroy(),
                });
              }

              bs.takeDamage(!isPlayer, dmg);
              bs.onSpecialComplete(isPlayer);
            }
          },
        });
      });
    }

    return null as any;
  }
}
