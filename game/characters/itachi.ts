import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class ItachiFighter extends Fighter {
  readonly key = 'itachi';
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
        // Itachi Melee: Kunai slash
        attacker.play(bs.getAnimKey("itachi", transLevel, "attack"));

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

            const hitColor = transLevel === 1 ? 0xff4500 : 0xcccccc; // Susanoo sword or kunai
            const hitLine = bs.add
              .rectangle(target.x, target.y + 120, 50, 4, hitColor)
              .setRotation(isPlayer ? 0.8 : -0.8)
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
                  attacker.play(bs.getAnimKey("itachi", transLevel, "idle"));
                  bs.setActionState(isPlayer, false);
                },
              });
            });
          },
        });
      } else {
        // Itachi Ki: Fireball (Katon)
        attacker.play(bs.getAnimKey("itachi", transLevel, "attack"));

        bs.time.delayedCall(100, () => {
          if (!bs.scene.isActive()) return;
          if (bs.cache.audio.exists("sfx_beam"))
            bs.sound.play("sfx_beam", { volume: 0.8 });

          const fireballColor = transLevel === 1 ? 0xff4500 : 0xff8c00; // Susanoo fire or normal fire
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

              if (bs.cache.audio.exists("sfx_explosion"))
                bs.sound.play("sfx_explosion", { volume: 0.8 });
              bs.createImpactEffect(target.x, target.y + 120, fireballColor);
              bs.takeDamage(
                !isPlayer,
                Math.floor(
                  (isComboFinisher ? 20 : 10) *
                    bs.getDamageMultiplier(transLevel),
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
            attacker.play(bs.getAnimKey("itachi", transLevel, "idle"));
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
