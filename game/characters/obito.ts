import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class ObitoFighter extends Fighter {
  readonly key = 'obito';
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
        // Obito Melee: Staff strike (Paulada)
        attacker.play(bs.getAnimKey("obito", transLevel, "attack"));

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

            // Visual effect for the staff hit
            const hitColor = transLevel === 1 ? 0x000000 : 0xffaa00;
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
                  bs.getDamageMultiplier(transLevel),
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
                  attacker.play(bs.getAnimKey("obito", transLevel, "idle"));
                  bs.setActionState(isPlayer, false);
                },
              });
            });
          },
        });
      } else {
        // Obito Ki: Fireball / Truth-Seeking Orb
        attacker.play(bs.getAnimKey("obito", transLevel, "attack"));
        bs.time.delayedCall(150, () => {
          if (!bs.scene.isActive()) return;
          if (bs.cache.audio.exists("sfx_beam"))
            bs.sound.play("sfx_beam", { volume: 1.0 });

          const orbColor = transLevel === 1 ? 0x111111 : 0xff4500;
          const hand = bs.getHandPosition(isPlayer);
          const orb = bs.add
            .circle(hand.x, hand.y, isComboFinisher ? 25 : 15, orbColor)
            .setDepth(5);
          if (transLevel === 1) orb.setStrokeStyle(2, 0xffffff); // White outline for truth-seeking orb

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
                    bs.getDamageMultiplier(transLevel),
                ),
              );
              bs.cameras.main.shake(isComboFinisher ? 150 : 50, 0.01);
            },
          });

          bs.time.delayedCall(400, () => {
            if (!bs.scene.isActive()) return;
            attacker.play(bs.getAnimKey("obito", transLevel, "idle"));
            bs.setActionState(isPlayer, false);
          });
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
