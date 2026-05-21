import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class NarutoFighter extends Fighter {
  readonly key = 'naruto';
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
        // Naruto Melee: Shadow Clone combo
        attacker.play(bs.getAnimKey("naruto", transLevel, "attack"));

        // Spawn clone
        const clone = bs.add
          .sprite(
            target.x + (attacker.x < target.x ? 40 : -40),
            target.y + 120,
            attacker.texture.key,
            attacker.frame.name,
          )
          .setScale(3)
          .setFlipX(!attacker.flipX)
          .setAlpha(0)
          .setTint(0xaaaaaa);

        bs.createImpactEffect(clone.x, clone.y + 120, 0xffffff); // Poof
        clone.setAlpha(1);

        bs.tweens.add({
          targets: attacker,
          x: target.x + (attacker.x < target.x ? -40 : 40),
          duration: 150,
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            if (bs.cache.audio.exists("sfx_attack"))
              bs.sound.play("sfx_attack", { volume: 1.2 });
            bs.createImpactEffect(target.x, target.y + 120, 0xffffff);
            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 20 : 12) *
                  bs.getDamageMultiplier(transLevel),
              ),
            );

            bs.time.delayedCall(200, () => {
              if (!bs.scene.isActive()) return;
              bs.createImpactEffect(clone.x, clone.y + 120, 0xffffff);
              clone.destroy();

              bs.tweens.add({
                targets: attacker,
                x: startX,
                duration: 150,
                onComplete: () => {
                  attacker.play(bs.getAnimKey("naruto", transLevel, "idle"));
                  bs.setActionState(isPlayer, false);
                },
              });
            });
          },
        });
      } else {
        // Naruto Ki: Rasengan thrust
        attacker.play(bs.getAnimKey("naruto", transLevel, "attack"));

        const hand = bs.getHandPosition(isPlayer);
        const rasengan = bs.add
          .circle(hand.x, hand.y, 15, 0x00ffff)
          .setDepth(6);
        rasengan.setBlendMode(Phaser.BlendModes.ADD);

        bs.tweens.add({
          targets: attacker,
          x: target.x + (attacker.x < target.x ? -40 : 40),
          duration: 200,
          ease: "Power2",
          onUpdate: () => {
            const hand = bs.getHandPosition(isPlayer);
            rasengan.x = hand.x;
            rasengan.y = hand.y;
          },
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            if (bs.cache.audio.exists("sfx_attack"))
              bs.sound.play("sfx_attack", { volume: 1.5 });
            bs.createImpactEffect(target.x, target.y + 120, 0x00ffff);
            rasengan.destroy();

            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 25 : 15) *
                  bs.getDamageMultiplier(transLevel),
              ),
            );
            bs.cameras.main.shake(150, 0.02);
            bs.tweens.add({
              targets: target,
              x: target.x + (attacker.x < target.x ? 80 : -80),
              duration: 150,
              yoyo: true,
            });

            bs.time.delayedCall(200, () => {
              if (!bs.scene.isActive()) return;
              bs.tweens.add({
                targets: attacker,
                x: startX,
                duration: 200,
                onComplete: () => {
                  attacker.play(bs.getAnimKey("naruto", transLevel, "idle"));
                  bs.setActionState(isPlayer, false);
                },
              });
            });
          },
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
