import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class CyberninjaFighter extends Fighter {
  readonly key = 'cyberninja';
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
        // CyberNinja Melee: Katana dash
        attacker.play(bs.getAnimKey("cyberninja", transLevel, "attack"));

        // Dash line
        const dashLine = bs.add.graphics().setDepth(5);
        dashLine.lineStyle(2, 0x00ffff, 0.8);
        dashLine.lineBetween(
          attacker.x,
          attacker.y + 120,
          target.x + (attacker.x < target.x ? 40 : -40),
          target.y + 120,
        );
        bs.tweens.add({
          targets: dashLine,
          alpha: 0,
          duration: 200,
          onComplete: () => dashLine.destroy(),
        });

        bs.tweens.add({
          targets: attacker,
          x: target.x + (attacker.x < target.x ? 40 : -40),
          duration: 100, // Dash through
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            if (bs.cache.audio.exists("sfx_attack"))
              bs.sound.play("sfx_attack", { volume: 1.2 });
            bs.createImpactEffect(target.x, target.y + 120, 0x00ffff);
            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 22 : 12) *
                  bs.getDamageMultiplier(transLevel),
              ),
            );

            // Slash mark
            const slash = bs.add.graphics().setDepth(6);
            slash.lineStyle(3, 0xffffff, 1);
            slash.lineBetween(
              target.x - 20,
              target.y - 40,
              target.x + 20,
              target.y + 120,
            );
            bs.tweens.add({
              targets: slash,
              alpha: 0,
              duration: 150,
              onComplete: () => slash.destroy(),
            });

            bs.time.delayedCall(200, () => {
              if (!bs.scene.isActive()) return;
              attacker.setFlipX(!attacker.flipX); // Face back
              bs.tweens.add({
                targets: attacker,
                x: startX,
                duration: 150,
                onComplete: () => {
                  attacker.setFlipX(isPlayer ? false : true); // Reset flip
                  attacker.play(
                    bs.getAnimKey("cyberninja", transLevel, "idle"),
                  );
                  bs.setActionState(isPlayer, false);
                },
              });
            });
          },
        });
      } else {
        // CyberNinja Ki: Shuriken throw
        attacker.play(bs.getAnimKey("cyberninja", transLevel, "attack"));
        bs.time.delayedCall(100, () => {
          if (!bs.scene.isActive()) return;
          if (bs.cache.audio.exists("sfx_beam"))
            bs.sound.play("sfx_beam", { volume: 0.8 });

          const shurikenCount = isComboFinisher ? 3 : 1;
          for (let i = 0; i < shurikenCount; i++) {
            const hand = bs.getHandPosition(isPlayer);
            const shuriken = bs.add
              .star(hand.x, hand.y, 4, 4, 8, 0xaaaaaa)
              .setDepth(5);
            bs.tweens.add({
              targets: shuriken,
              rotation: isPlayer ? Math.PI * 4 : -Math.PI * 4,
              duration: 200,
            });

            bs.tweens.add({
              targets: shuriken,
              x: target.x,
              duration: 150,
              onComplete: () => {
                shuriken.destroy();
                if (!bs.scene.isActive()) return;
                bs.createImpactEffect(
                  target.x,
                  target.y + 120 + (i * 10 - 10),
                  0xaaaaaa,
                );
                bs.takeDamage(
                  !isPlayer,
                  Math.floor(8 * bs.getDamageMultiplier(transLevel)),
                );
              },
            });
          }

          bs.time.delayedCall(300, () => {
            if (!bs.scene.isActive()) return;
            attacker.play(bs.getAnimKey("cyberninja", transLevel, "idle"));
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
