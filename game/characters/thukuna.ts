import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class ThukunaFighter extends Fighter {
  readonly key = 'thukuna';
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
        // Thukuna Melee: Cleave (invisible slashes)
        attacker.play(bs.getAnimKey("thukuna", transLevel, "attack"));

        const slashCount = isComboFinisher ? 5 : 2;
        for (let i = 0; i < slashCount; i++) {
          bs.time.delayedCall(i * 100, () => {
            if (!bs.scene.isActive()) return;
            if (bs.cache.audio.exists("sfx_attack"))
              bs.sound.play("sfx_attack", { volume: 1.0 });

            // Draw slash lines on target
            const slash = bs.add.graphics().setDepth(10);
            slash.lineStyle(4, 0xffffff, 1);
            const ox = target.x + (Math.random() * 40 - 20);
            const oy = target.y + 120 + (Math.random() * 40 - 20);
            slash.lineBetween(ox - 20, oy - 20, ox + 20, oy + 20);

            bs.tweens.add({
              targets: slash,
              alpha: 0,
              duration: 150,
              onComplete: () => slash.destroy(),
            });
            bs.createImpactEffect(ox, oy, 0xff0000);
            bs.takeDamage(
              !isPlayer,
              Math.floor(6 * bs.getDamageMultiplier(transLevel)),
            );
          });
        }

        bs.time.delayedCall(slashCount * 100 + 200, () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("thukuna", transLevel, "idle"));
          bs.setActionState(isPlayer, false);
        });
      } else {
        // Thukuna Ki: Fire Arrow
        attacker.play(bs.getAnimKey("thukuna", transLevel, "attack"));
        bs.time.delayedCall(150, () => {
          if (!bs.scene.isActive()) return;
          if (bs.cache.audio.exists("sfx_beam"))
            bs.sound.play("sfx_beam", { volume: 1.2 });

          const hand = bs.getHandPosition(isPlayer);
          const arrow = bs.add
            .triangle(
              hand.x,
              hand.y,
              0,
              -10,
              0,
              10,
              attacker.x < target.x ? 30 : -30,
              0,
              0xff4500,
            )
            .setDepth(5);

          bs.tweens.add({
            targets: arrow,
            x: target.x,
            duration: 150,
            onComplete: () => {
              arrow.destroy();
              if (!bs.scene.isActive()) return;
              bs.createImpactEffect(target.x, target.y + 120, 0xff4500);
              bs.takeDamage(
                !isPlayer,
                Math.floor(
                  (isComboFinisher ? 25 : 15) *
                    bs.getDamageMultiplier(transLevel),
                ),
              );
              bs.cameras.main.shake(150, 0.02);
            },
          });

          bs.time.delayedCall(300, () => {
            if (!bs.scene.isActive()) return;
            attacker.play(bs.getAnimKey("thukuna", transLevel, "idle"));
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
