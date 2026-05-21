import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class BatmanFighter extends Fighter {
  readonly key = 'batman';
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
        // Batman Melee: Slide kick
        attacker.play(bs.getAnimKey("batman", transLevel, "attack"));
        bs.tweens.add({
          targets: attacker,
          x: target.x + (attacker.x < target.x ? -40 : 40),
          y: target.y + 20,
          rotation: isPlayer ? 0.5 : -0.5,
          duration: 150,
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            if (bs.cache.audio.exists("sfx_attack"))
              bs.sound.play("sfx_attack", { volume: 1.0 });
            bs.createImpactEffect(target.x, target.y + 120, 0xffffff);
            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 18 : 10) *
                  bs.getDamageMultiplier(transLevel),
              ),
            );
            target.y -= 20; // Knock up slightly
            bs.tweens.add({
              targets: target,
              y: target.y + 20,
              duration: 100,
              ease: "Bounce.easeOut",
            });

            bs.time.delayedCall(200, () => {
              if (!bs.scene.isActive()) return;
              bs.tweens.add({
                targets: attacker,
                x: startX,
                y: startY,
                rotation: 0,
                duration: 150,
                onComplete: () => {
                  attacker.play(bs.getAnimKey("batman", transLevel, "idle"));
                  bs.setActionState(isPlayer, false);
                },
              });
            });
          },
        });
      } else {
        // Batman Ki: Batarang throw
        attacker.play(bs.getAnimKey("batman", transLevel, "attack"));
        bs.time.delayedCall(100, () => {
          if (!bs.scene.isActive()) return;
          if (bs.cache.audio.exists("sfx_beam"))
            bs.sound.play("sfx_beam", { volume: 0.8 });

          const hand = bs.getHandPosition(isPlayer);
          const batarang = bs.add
            .triangle(
              hand.x,
              hand.y,
              0,
              -5,
              0,
              5,
              attacker.x < target.x ? 15 : -15,
              0,
              0x333333,
            )
            .setDepth(5);
          bs.tweens.add({
            targets: batarang,
            rotation: isPlayer ? Math.PI * 4 : -Math.PI * 4,
            duration: 200,
          });

          bs.tweens.add({
            targets: batarang,
            x: target.x,
            duration: 200,
            onComplete: () => {
              batarang.destroy();
              if (!bs.scene.isActive()) return;
              bs.createImpactEffect(target.x, target.y + 120, 0x333333);
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
            attacker.play(bs.getAnimKey("batman", transLevel, "idle"));
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
