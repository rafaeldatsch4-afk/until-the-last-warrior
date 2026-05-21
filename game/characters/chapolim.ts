import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class ChapolimFighter extends Fighter {
  readonly key = 'chapolim';
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
