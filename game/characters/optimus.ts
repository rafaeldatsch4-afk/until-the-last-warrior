import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class OptimusFighter extends Fighter {
  readonly key = 'optimus';
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
        // Optimus Melee: Heavy punch
        bs.tweens.add({
          targets: attacker,
          x: target.x + (attacker.x < target.x ? -40 : 40),
          duration: 200,
          ease: "Power2",
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            attacker.play(bs.getAnimKey("optimus", transLevel, "attack"));

            if (bs.cache.audio.exists("sfx_attack"))
              bs.sound.play("sfx_attack", { volume: 1.5 });
            bs.createImpactEffect(target.x, target.y + 120, 0xffaa00);
            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 25 : 15) *
                  bs.getDamageMultiplier(transLevel),
              ),
            );
            bs.cameras.main.shake(200, 0.02);

            bs.time.delayedCall(250, () => {
              if (!bs.scene.isActive()) return;
              bs.tweens.add({
                targets: attacker,
                x: startX,
                duration: 200,
                onComplete: () => {
                  attacker.play(bs.getAnimKey("optimus", transLevel, "idle"));
                  bs.setActionState(isPlayer, false);
                },
              });
            });
          },
        });
      } else {
        // Optimus Ki: Ion Blaster
        attacker.play(bs.getAnimKey("optimus", transLevel, "attack"));
        bs.time.delayedCall(100, () => {
          if (!bs.scene.isActive()) return;
          if (bs.cache.audio.exists("sfx_beam"))
            bs.sound.play("sfx_beam", { volume: 1.2 });

          const hand = bs.getHandPosition(isPlayer);
          const blast = bs.add
            .rectangle(hand.x, hand.y, 30, 8, 0x00ffff)
            .setDepth(5);

          bs.tweens.add({
            targets: blast,
            x: target.x,
            duration: 150,
            onComplete: () => {
              blast.destroy();
              if (!bs.scene.isActive()) return;
              bs.createImpactEffect(target.x, target.y + 120, 0x00ffff);
              bs.takeDamage(
                !isPlayer,
                Math.floor(
                  (isComboFinisher ? 20 : 12) *
                    bs.getDamageMultiplier(transLevel),
                ),
              );
            },
          });

          bs.time.delayedCall(300, () => {
            if (!bs.scene.isActive()) return;
            attacker.play(bs.getAnimKey("optimus", transLevel, "idle"));
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
