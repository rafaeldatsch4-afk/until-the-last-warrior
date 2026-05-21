import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class FrierenFighter extends Fighter {
  readonly key = 'frieren';
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
        attacker.play(bs.getAnimKey("frieren", transLevel, "attack"));
        bs.tweens.add({
          targets: attacker,
          x: target.x + (attacker.x < target.x ? -40 : 40),
          duration: 150,
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            if (bs.cache.audio.exists("sfx_attack"))
              bs.sound.play("sfx_attack", { volume: 1.0 });
            bs.createImpactEffect(target.x, target.y + 120, 0xffffff);
            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 15 : 8) * bs.getDamageMultiplier(transLevel),
              ),
            );

            bs.time.delayedCall(200, () => {
              if (!bs.scene.isActive()) return;
              bs.tweens.add({
                targets: attacker,
                x: startX,
                duration: 150,
                onComplete: () => {
                  attacker.play(bs.getAnimKey("frieren", transLevel, "idle"));
                  bs.setActionState(isPlayer, false);
                },
              });
            });
          },
        });
      } else {
        attacker.play(bs.getAnimKey("frieren", transLevel, "attack"));
        bs.time.delayedCall(100, () => {
          if (!bs.scene.isActive()) return;
          if (bs.cache.audio.exists("sfx_beam"))
            bs.sound.play("sfx_beam", { volume: 1.0 });

          const hand = bs.getHandPosition(isPlayer);
          const beam = bs.add
            .rectangle(
              hand.x,
              hand.y,
              Math.abs(target.x - attacker.x),
              4,
              0xffffff,
            )
            .setOrigin(isPlayer ? 0 : 1, 0.5)
            .setDepth(5);
          bs.tweens.add({
            targets: beam,
            alpha: 0,
            duration: 150,
            onComplete: () => beam.destroy(),
          });

          bs.createImpactEffect(target.x, target.y + 120, 0xffffff);
          bs.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 20 : 12) * bs.getDamageMultiplier(transLevel),
            ),
          );

          bs.time.delayedCall(250, () => {
            if (!bs.scene.isActive()) return;
            attacker.play(bs.getAnimKey("frieren", transLevel, "idle"));
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
