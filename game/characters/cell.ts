import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class CellFighter extends Fighter {
  readonly key = 'cell';
  readonly specialName = 'KAMEHAMEHA';
  readonly superName = 'SOLAR KAMEHAMEHA';
  readonly specialColor = 0x00ff00;

  performAttack(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, attackType, isComboFinisher, transformLevel } = params;
    const bs = scene as any;
    const startX = attacker.x;
    const startY = attacker.y;

    if (attackType === "melee") {
      attacker.setAlpha(0);
      bs.createImpactEffect(attacker.x, attacker.y + 120, 0x00ff00);

      bs.time.delayedCall(100, () => {
        if (!bs.scene.isActive()) return;
        attacker.setAlpha(1);
        attacker.x = target.x;
        attacker.y = target.y - 60;
        attacker.play(bs.getAnimKey("cell", transformLevel, "attack"));

        bs.tweens.add({
          targets: attacker,
          y: target.y,
          duration: 100,
          ease: "Expo.easeIn",
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            if (bs.cache.audio.exists("sfx_attack"))
              bs.sound.play("sfx_attack", { volume: 1.2 });
            bs.createImpactEffect(target.x, target.y + 120, 0x00ff00);
            bs.takeDamage(!isPlayer, Math.floor((isComboFinisher ? 22 : 12) * bs.getDamageMultiplier(transformLevel)));
            bs.cameras.main.shake(150, 0.02);

            bs.time.delayedCall(200, () => {
              if (!bs.scene.isActive()) return;
              attacker.setAlpha(0);
              bs.createImpactEffect(attacker.x, attacker.y + 120, 0x00ff00);
              bs.time.delayedCall(100, () => {
                if (!bs.scene.isActive()) return;
                attacker.setAlpha(1);
                attacker.x = startX;
                attacker.y = startY;
                attacker.play(bs.getAnimKey("cell", transformLevel, "idle"));
                bs.setActionState(isPlayer, false);
              });
            });
          },
        });
      });
    } else {
      attacker.play(bs.getAnimKey("cell", transformLevel, "attack"));
      bs.time.delayedCall(100, () => {
        if (!bs.scene.isActive()) return;
        if (bs.cache.audio.exists("sfx_beam"))
          bs.sound.play("sfx_beam", { volume: 1.0 });

        const hand = bs.getHandPosition(isPlayer);
        const beam = bs.add
          .rectangle(hand.x, hand.y, Math.abs(target.x - attacker.x), 2, 0xffff00)
          .setOrigin(isPlayer ? 0 : 1, 0.5)
          .setDepth(5);
        bs.tweens.add({
          targets: beam,
          alpha: 0,
          duration: 150,
          onComplete: () => beam.destroy(),
        });

        bs.createImpactEffect(target.x, target.y + 120, 0xffff00);
        bs.takeDamage(!isPlayer, Math.floor((isComboFinisher ? 18 : 10) * bs.getDamageMultiplier(transformLevel)));

        bs.time.delayedCall(250, () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("cell", transformLevel, "idle"));
          bs.setActionState(isPlayer, false);
        });
      });
    }

    return null as any;
  }

  performSpecial(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    bs.specialBeam(isPlayer, false, 0x00ff00, true, false, "kamehameha");
    return null as any;
  }

  performSuper(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    
    bs.specialBeam(isPlayer, true, 0xffff00, true, true, "SOLAR KAMEHAMEHA!");

    return null as any;
  }

  performTransform(scene: Phaser.Scene, isPlayer: boolean, level: number): void {}
}