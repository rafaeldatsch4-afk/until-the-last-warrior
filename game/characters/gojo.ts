import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class GojoFighter extends Fighter {
  readonly key = 'gojo';
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
        attacker.setAlpha(0);
        bs.createImpactEffect(attacker.x, attacker.y + 120, 0x00ffff);

        bs.time.delayedCall(100, () => {
          if (!bs.scene.isActive()) return;
          attacker.setAlpha(1);
          attacker.x = target.x + (attacker.x < target.x ? -30 : 30);
          attacker.play(bs.getAnimKey("gojo", transLevel, "attack"));

          if (bs.cache.audio.exists("sfx_attack"))
            bs.sound.play("sfx_attack", { volume: 1.2 });
          bs.createImpactEffect(target.x, target.y + 120, 0x00ffff);
          bs.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 22 : 12) * bs.getDamageMultiplier(transLevel),
            ),
          );

          bs.time.delayedCall(200, () => {
            if (!bs.scene.isActive()) return;
            attacker.setAlpha(0);
            bs.createImpactEffect(attacker.x, attacker.y + 120, 0x00ffff);

            bs.time.delayedCall(100, () => {
              if (!bs.scene.isActive()) return;
              attacker.setAlpha(1);
              attacker.x = startX;
              attacker.play(bs.getAnimKey("gojo", transLevel, "idle"));
              bs.setActionState(isPlayer, false);
            });
          });
        });
      } else {
        attacker.play(bs.getAnimKey("gojo", transLevel, "attack"));
        bs.time.delayedCall(100, () => {
          if (!bs.scene.isActive()) return;
          if (bs.cache.audio.exists("sfx_beam"))
            bs.sound.play("sfx_beam", { volume: 1.0 });

          const orbColor = Math.random() > 0.5 ? 0xff0000 : 0x0000ff;
          const hand = bs.getHandPosition(isPlayer);
          const orb = bs.add.circle(hand.x, hand.y, 10, orbColor).setDepth(5);

          bs.tweens.add({
            targets: orb,
            x: target.x,
            duration: 150,
            onComplete: () => {
              orb.destroy();
              if (!bs.scene.isActive()) return;
              bs.createImpactEffect(target.x, target.y + 120, orbColor);
              bs.takeDamage(
                !isPlayer,
                Math.floor(
                  (isComboFinisher ? 20 : 10) *
                    bs.getDamageMultiplier(transLevel),
                ),
              );
            },
          });

          bs.time.delayedCall(300, () => {
            if (!bs.scene.isActive()) return;
            attacker.play(bs.getAnimKey("gojo", transLevel, "idle"));
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
