import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class MinipekkaFighter extends Fighter {
  readonly key = 'minipekka';
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
                (isComboFinisher ? 30 : 15) *
                  bs.getDamageMultiplier(transLevel),
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
                  (isComboFinisher ? 15 : 8) *
                    bs.getDamageMultiplier(transLevel),
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
    return null as any;
  }

  performSuper(params: AttackParams): AttackResult {
    return null as any;
  }

  performTransform(scene: Phaser.Scene, isPlayer: boolean, level: number): void {}
}
