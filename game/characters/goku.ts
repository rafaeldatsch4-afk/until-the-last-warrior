import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class GokuFighter extends Fighter {
  readonly key = 'goku';
  readonly specialName = 'KAMEHAMEHA';
  readonly superName = 'GENKIDAMA';
  readonly specialColor = 0x00ffff;

  performAttack(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, attackType, isComboFinisher, transformLevel } = params;
    const bs = scene as any;
    const startX = attacker.x;
    const startY = attacker.y;

    if (attackType === "melee") {
      // Goku Melee: Teleport strike
      attacker.setAlpha(0);
      bs.createImpactEffect(attacker.x, attacker.y + 120, 0xffffff); // Teleport poof

      bs.time.delayedCall(100, () => {
        if (!bs.scene.isActive()) return;
        attacker.setAlpha(1);
        attacker.x = target.x + (attacker.x < target.x ? -40 : 40);
        attacker.y = target.y - (isComboFinisher ? 50 : 0); // Attack from above on finisher
        attacker.play(bs.getAnimKey("goku", transformLevel, "attack"));

        if (bs.cache.audio.exists("sfx_attack"))
          bs.sound.play("sfx_attack", { volume: 1.2 });
        bs.takeDamage(
          !isPlayer,
          Math.floor(
            (isComboFinisher ? 20 : 10) * bs.getDamageMultiplier(transformLevel),
          ),
        );
        bs.modifyKi(isPlayer, 5);
        bs.createImpactEffect(target.x, target.y + 120, 0xffa500);
        bs.cameras.main.shake(
          isComboFinisher ? 200 : 100,
          isComboFinisher ? 0.02 : 0.01,
        );

        bs.tweens.add({
          targets: target,
          x: target.x + (attacker.x < target.x ? 50 : -50),
          duration: 100,
          yoyo: true,
        });

        bs.time.delayedCall(200, () => {
          if (!bs.scene.isActive()) return;
          attacker.setAlpha(0);
          bs.createImpactEffect(attacker.x, attacker.y + 120, 0xffffff);
          bs.time.delayedCall(100, () => {
            if (!bs.scene.isActive()) return;
            attacker.setAlpha(1);
            attacker.x = startX;
            attacker.y = startY;
            attacker.play(bs.getAnimKey("goku", transformLevel, "idle"));
            bs.setActionState(isPlayer, false);
          });
        });
      });
    } else {
      // Goku Ki: Rapid small blasts
      attacker.play(bs.getAnimKey("goku", transformLevel, "attack"));
      const blastCount = isComboFinisher ? 5 : 3;
      for (let i = 0; i < blastCount; i++) {
        bs.time.delayedCall(i * 80, () => {
          if (!bs.scene.isActive()) return;
          if (bs.cache.audio.exists("sfx_beam"))
            bs.sound.play("sfx_beam", { volume: 0.5 });
          const hand = bs.getHandPosition(isPlayer);
          const blast = bs.add
            .circle(hand.x, hand.y, 8, 0x00ffff)
            .setDepth(5);
          bs.tweens.add({
            targets: blast,
            x: target.x,
            duration: 150,
            onComplete: () => {
              blast.destroy();
              if (!bs.scene.isActive()) return;
              bs.createImpactEffect(
                target.x,
                target.y + 120 + (Math.random() * 20 - 10),
                0x00ffff,
              );
              bs.takeDamage(
                !isPlayer,
                Math.floor(5 * bs.getDamageMultiplier(transformLevel)),
              );
            },
          });
        });
      }
      bs.time.delayedCall(blastCount * 80 + 200, () => {
        if (!bs.scene.isActive()) return;
        attacker.play(bs.getAnimKey("goku", transformLevel, "idle"));
        bs.setActionState(isPlayer, false);
      });
    }

    return null as any;
  }

  performSpecial(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    const dmg = Math.floor(40 * bs.getDamageMultiplier(transformLevel));

    // Notice we omit the log and audio since BattleScene's performSpecial handles it.
    // Wait, the original method `specialKamehameha` in `BattleScene` does NOT do the log. Let's add them or assume caller handles it.
    // Actually, caller handles the initial log. I will just do the animation.

    const hand = bs.getHandPosition(isPlayer);
    const aura = bs.add
      .circle(hand.x, hand.y, 5, 0x00ffff)
      .setDepth(15)
      .setBlendMode(Phaser.BlendModes.ADD);
      
    bs.tweens.add({
      targets: aura,
      scale: 10,
      duration: 300,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        aura.destroy();
        if (!bs.scene.isActive()) return;

        attacker.play(bs.getAnimKey("goku", transformLevel, "attack"));
        const newHand = bs.getHandPosition(isPlayer);

        const beam = bs.add
          .rectangle(newHand.x, newHand.y + 10, 0, 40, 0x00ffff)
          .setOrigin(isPlayer ? 0 : 1, 0.5)
          .setDepth(16)
          .setBlendMode(Phaser.BlendModes.ADD);

        const core = bs.add
          .rectangle(newHand.x, newHand.y + 10, 0, 20, 0xffffff)
          .setOrigin(isPlayer ? 0 : 1, 0.5)
          .setDepth(17);

        const dist = Math.abs(target.x - newHand.x) + 200;

        bs.tweens.add({
          targets: [beam, core],
          width: dist,
          duration: 300,
          ease: "Power2",
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            bs.cameras.main.shake(300, 0.02);
            bs.createImpactEffect(target.x, target.y + 120, 0x00ffff);
            bs.takeDamage(!isPlayer, dmg);

            bs.tweens.add({
              targets: [beam, core],
              alpha: 0,
              duration: 200,
              delay: 300,
              onComplete: () => {
                beam.destroy();
                core.destroy();
                if (bs.scene.isActive()) {
                  attacker.play(
                    bs.getAnimKey("goku", transformLevel, "idle"),
                  );
                }
              },
            });
          },
        });
      },
    });

    return null as any;
  }

  performSuper(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    const dmg = Math.floor(120 * bs.getDamageMultiplier(transformLevel));

    // Raise hands
    attacker.play(`${attacker.getData('charKey')}_charge`);

    // Create giant spirit bomb
    const bomb = bs.add
      .circle(attacker.x, attacker.y - 150, 10, 0x00ffff)
      .setDepth(15)
      .setAlpha(0.9);
    const bombGlow = bs.add
      .circle(attacker.x, attacker.y - 150, 15, 0xffffff)
      .setDepth(14)
      .setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Energy gathering particles
    const gatherEvent = bs.time.addEvent({
      delay: 30,
      callback: () => {
        if (!bs.scene.isActive()) return;
        for (let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 300 + Math.random() * 150;
          const px = bomb.x + Math.cos(angle) * dist;
          const py = bomb.y + Math.sin(angle) * dist;
          const p = bs.add
            .circle(px, py, 6, 0x00ffff)
            .setDepth(16)
            .setBlendMode(Phaser.BlendModes.ADD);
          bs.tweens.add({
            targets: p,
            x: bomb.x,
            y: bomb.y,
            duration: 400,
            ease: "Cubic.easeIn",
            onComplete: () => p.destroy(),
          });
        }
      },
      repeat: 40,
    });

    // Grow
    bs.tweens.add({
      targets: [bomb, bombGlow],
      scale: 35,
      duration: 1500,
      ease: "Sine.easeInOut",
      onComplete: () => {
        if (!bs.scene.isActive()) return;
        attacker.play(`${attacker.getData('charKey')}_attack`); // Throw forward

        bs.cameras.main.shake(300, 0.02);

        // Throw
        bs.tweens.add({
          targets: [bomb, bombGlow],
          x: target.x,
          y: target.y + 120,
          duration: 700,
          ease: "Cubic.easeIn",
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            bs.cameras.main.shake(500, 0.04);
            bs.createImpactEffect(target.x, target.y + 120, 0x00ffff);
            bs.takeDamage(!isPlayer, dmg);

            bs.tweens.add({
              targets: [bomb, bombGlow],
              alpha: 0,
              duration: 300,
              onComplete: () => {
                bomb.destroy();
                bombGlow.destroy();
                if (bs.scene.isActive()) {
                  attacker.play(bs.getAnimKey("goku", transformLevel, "idle"));
                }
              },
            });
          },
        });
      },
    });

    return null as any;
  }

  performTransform(scene: Phaser.Scene, isPlayer: boolean, level: number): void {
      // transform handling logic specifically for Goku would go here if needed.
  }
}
