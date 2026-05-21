import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class JotaroFighter extends Fighter {
  readonly key = 'jotaro';
  readonly specialName = 'SPECIAL';
  readonly superName = 'SUPER';
  readonly specialColor = 0xffffff;

  performAttack(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, attackType, isComboFinisher, transformLevel } = params;
    const bs = scene as any;
    const startX = attacker.x;
    const startY = attacker.y;
    const transLevel = transformLevel;

    
      
      
      
      

      if (attackType === "melee") {
        // Jotaro Melee: ORA punches
        attacker.play(bs.getAnimKey("jotaro", transLevel, "attack"));

        // Dash forward
        bs.tweens.add({
          targets: attacker,
          x: target.x + (attacker.x < target.x ? -40 : 40),
          duration: 100,
          ease: "Power2",
          onComplete: () => {
            if (!bs.scene.isActive()) return;

            if (bs.cache.audio.exists("sfx_attack"))
              bs.sound.play("sfx_attack", { volume: 1.2 });

            // Multiple punch impacts for Star Platinum
            const hitColor = transLevel === 1 ? 0x8a2be2 : 0xcccccc;

            const createPunch = (delay: number, offsetY: number) => {
              bs.time.delayedCall(delay, () => {
                if (!bs.scene.isActive()) return;
                const hitCircle = bs.add
                  .circle(
                    target.x + (Math.random() * 20 - 10),
                    target.y + 120 + offsetY,
                    15,
                    hitColor,
                  )
                  .setAlpha(0.7)
                  .setDepth(6);
                bs.tweens.add({
                  targets: hitCircle,
                  alpha: 0,
                  scale: 1.5,
                  duration: 100,
                  onComplete: () => hitCircle.destroy(),
                });
                bs.createImpactEffect(
                  target.x,
                  target.y + 120 + offsetY,
                  hitColor,
                );
              });
            };

            createPunch(0, 0);
            if (transLevel === 1) {
              createPunch(50, -10);
              createPunch(100, 10);
            }

            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 25 : 15) *
                  bs.getDamageMultiplier(transLevel),
              ),
            );
            bs.cameras.main.shake(150, 0.015);

            bs.time.delayedCall(200, () => {
              if (!bs.scene.isActive()) return;

              // Dash back
              bs.tweens.add({
                targets: attacker,
                x: startX,
                duration: 150,
                ease: "Power2",
                onComplete: () => {
                  if (bs.scene.isActive()) {
                    attacker.play(bs.getAnimKey("jotaro", transLevel, "idle"));
                    bs.setActionState(isPlayer, false);
                  }
                },
              });
            });
          },
        });
      } else {
        // Jotaro Ki: Star Finger (or throwing something)
        attacker.play(bs.getAnimKey("jotaro", transLevel, "attack"));
        if (bs.cache.audio.exists("sfx_ki"))
          bs.sound.play("sfx_ki", { volume: 0.8 });

        const projectileColor = transLevel === 1 ? 0x8a2be2 : 0xcccccc;

        // Star Finger visual (elongated beam/finger)
        const hand = bs.getHandPosition(isPlayer);
        const projectile = bs.add
          .rectangle(hand.x, hand.y, 30, 6, projectileColor)
          .setDepth(5);

        bs.tweens.add({
          targets: projectile,
          x: target.x,
          duration: 300,
          ease: "Linear",
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            projectile.destroy();
            bs.createImpactEffect(target.x, target.y + 120, projectileColor);
            if (bs.cache.audio.exists("sfx_hit"))
              bs.sound.play("sfx_hit", { volume: 0.8 });
            bs.takeDamage(
              !isPlayer,
              Math.floor(12 * bs.getDamageMultiplier(transLevel)),
            );

            bs.time.delayedCall(200, () => {
              if (bs.scene.isActive()) {
                attacker.play(bs.getAnimKey("jotaro", transLevel, "idle"));
                bs.setActionState(isPlayer, false);
              }
            });
          },
        });
      }

    return null as any;
  }

  performSpecial(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    // Proxy call
    return null as any;
  }

  performSuper(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    // Proxy call
    return null as any;
  }

  performTransform(scene: Phaser.Scene, isPlayer: boolean, level: number): void {}
}
