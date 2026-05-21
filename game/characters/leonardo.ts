import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class LeonardoFighter extends Fighter {
  readonly key = 'leonardo';
  readonly specialName = 'NINJA SLASH';
  readonly superName = 'NINJA BARRAGE';
  readonly specialColor = 0x00ff00;

  performAttack(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, attackType, isComboFinisher, transformLevel } = params;
    const bs = scene as any;
    const startX = attacker.x;
    const startY = attacker.y;
    const transLevel = transformLevel;

    if (attackType === "melee") {
      attacker.play(bs.getAnimKey("leonardo", transLevel, "attack"));
      bs.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 150,
        onComplete: () => {
          if (!bs.scene.isActive()) return;
          if (bs.cache.audio.exists("sfx_attack"))
            bs.sound.play("sfx_attack", { volume: 1.2 });

          const slash = bs.add.graphics().setDepth(6);
          slash.lineStyle(4, 0x00ff00, 1);
          slash.lineBetween(
            target.x - 20,
            target.y - 30,
            target.x + 20,
            target.y + 120,
          );
          bs.tweens.add({
            targets: slash,
            alpha: 0,
            duration: 150,
            onComplete: () => slash.destroy(),
          });

          bs.createImpactEffect(target.x, target.y + 120, 0x00ff00);
          bs.takeDamage(!isPlayer, Math.floor((isComboFinisher ? 20 : 12) * bs.getDamageMultiplier(transLevel)));

          bs.time.delayedCall(200, () => {
            if (!bs.scene.isActive()) return;
            bs.tweens.add({
              targets: attacker,
              x: startX,
              duration: 150,
              onComplete: () => {
                attacker.play(bs.getAnimKey("leonardo", transLevel, "idle"));
                bs.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      attacker.play(bs.getAnimKey("leonardo", transLevel, "attack"));
      bs.time.delayedCall(100, () => {
        if (!bs.scene.isActive()) return;
        if (bs.cache.audio.exists("sfx_beam"))
          bs.sound.play("sfx_beam", { volume: 0.8 });

        const hand = bs.getHandPosition(isPlayer);
        const shuriken = bs.add
          .star(hand.x, hand.y, 4, 4, 8, 0x00ff00)
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
            bs.createImpactEffect(target.x, target.y + 120, 0x00ff00);
            bs.takeDamage(!isPlayer, Math.floor((isComboFinisher ? 15 : 8) * bs.getDamageMultiplier(transLevel)));
          },
        });

        bs.time.delayedCall(300, () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("leonardo", transLevel, "idle"));
          bs.setActionState(isPlayer, false);
        });
      });
    }

    return null as any;
  }

  performSpecial(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    bs.specialSlash(isPlayer, false);
    return null as any;
  }

  performSuper(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    bs.specialNinjaBarrage(isPlayer);
    return null as any;
  }

  performTransform(scene: Phaser.Scene, isPlayer: boolean, level: number): void {}
}