import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class MadaraFighter extends Fighter {
  readonly key = 'madara';
  readonly specialName = 'MAJESTIC DESTROYER FLAME';
  readonly superName = 'TENGAI SHINSEI';
  readonly specialColor = 0xff4500;

  performAttack(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, attackType, isComboFinisher, transformLevel } = params;
    const bs = scene as any;
    const startX = attacker.x;
    const startY = attacker.y;

    if (attackType === "melee") {
      bs.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 100,
        onComplete: () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("madara", transformLevel, "attack"));
          const hits = isComboFinisher ? 4 : 2;
          for (let i = 0; i < hits; i++) {
            bs.time.delayedCall(i * 100, () => {
              if (!bs.scene.isActive()) return;
              if (bs.cache.audio.exists("sfx_attack"))
                bs.sound.play("sfx_attack", { volume: 1.0 });
              bs.createImpactEffect(target.x, target.y + 120, 0xffffff);
              bs.takeDamage(!isPlayer, Math.floor(6 * bs.getDamageMultiplier(transformLevel)));
            });
          }
          bs.time.delayedCall(hits * 100 + 100, () => {
            if (!bs.scene.isActive()) return;
            bs.tweens.add({
              targets: attacker,
              x: startX,
              y: startY,
              duration: 200,
              ease: "Power2",
              onComplete: () => {
                attacker.play(bs.getAnimKey("madara", transformLevel, "idle"));
                bs.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      attacker.play(bs.getAnimKey("madara", transformLevel, "attack"));
      bs.time.delayedCall(100, () => {
        if (!bs.scene.isActive()) return;
        if (bs.cache.audio.exists("sfx_beam"))
          bs.sound.play("sfx_beam", { volume: 1.0 });

        const kiColor = transformLevel > 0 ? 0x3b82f6 : 0xff4500;
        const hand = bs.getHandPosition(isPlayer);
        const blast = bs.add
          .circle(hand.x, hand.y, 15, kiColor)
          .setDepth(5);
        const core = bs.add.circle(blast.x, blast.y, 8, 0xffffff).setDepth(6);

        bs.tweens.add({
          targets: [blast, core],
          x: target.x,
          duration: 200,
          onComplete: () => {
            blast.destroy();
            core.destroy();
            if (!bs.scene.isActive()) return;
            bs.createImpactEffect(target.x, target.y + 120, kiColor);
            bs.takeDamage(!isPlayer, Math.floor(12 * bs.getDamageMultiplier(transformLevel)));
            attacker.play(bs.getAnimKey("madara", transformLevel, "idle"));
            bs.setActionState(isPlayer, false);
          },
        });
      });
    }

    return null as any;
  }

  performSpecial(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    
    const dmg = Math.floor(45 * bs.getDamageMultiplier(transformLevel));

    bs.log("MAJESTIC DESTROYER FLAME!");
    if (bs.cache.audio.exists("sfx_charge")) bs.sound.play("sfx_charge");

    const inhale = bs.add
      .particles(0, 0, "particle", {
        x: attacker.x + (isPlayer ? 20 : -20),
        y: attacker.y - 20,
        color: [0xffa500, 0xff4500],
        colorEase: "quad.out",
        lifespan: 400,
        angle: { min: 0, max: 360 },
        scale: { start: 0, end: 1 },
        speed: { min: -150, max: -80 },
        blendMode: "ADD",
      })
      .setDepth(14);

    bs.time.delayedCall(500, () => {
      if (!bs.scene.isActive()) return;
      inhale.stop();
      bs.time.delayedCall(400, () => inhale.destroy());

      if (bs.cache.audio.exists("sfx_beam"))
        bs.sound.play("sfx_beam", { volume: 1.5 });

      const fireGroup = bs.add.group();

      const hand = bs.getHandPosition(isPlayer);
      const fireParticles = bs.add
        .particles(0, 0, "particle", {
          x: hand.x,
          y: hand.y,
          color: [0xffffff, 0xffa500, 0xff0000],
          colorEase: "quad.out",
          lifespan: 1000,
          angle: { min: isPlayer ? -45 : 135, max: isPlayer ? 45 : 225 },
          scale: { start: 2, end: 5 },
          speed: { min: 400, max: 800 },
          blendMode: "ADD",
        })
        .setDepth(12);

      bs.cameras.main.shake(800, 0.03);

      for (let i = 0; i < 30; i++) {
        const fireGlow = bs.add
          .circle(
            attacker.x + (attacker.x < target.x ? 40 : -40),
            attacker.y - 60 + i * 8,
            40,
            0xff4500,
          )
          .setDepth(9)
          .setAlpha(0.6)
          .setBlendMode(Phaser.BlendModes.ADD);
        const fire = bs.add
          .circle(
            attacker.x + (attacker.x < target.x ? 40 : -40),
            attacker.y - 60 + i * 8,
            25,
            0xff4500,
          )
          .setDepth(10);
        const core = bs.add.circle(fire.x, fire.y, 15, 0xffa500).setDepth(11);
        fireGroup.add(fire);
        fireGroup.add(core);
        fireGroup.add(fireGlow);

        bs.tweens.add({
          targets: [fire, core, fireGlow],
          x: target.x + (attacker.x < target.x ? 200 : -200),
          y: target.y - 80 + i * 12,
          scale: 4,
          duration: 800,
          ease: "Power1",
          onComplete: () => {
            fire.destroy();
            core.destroy();
            fireGlow.destroy();
          },
        });
      }

      bs.time.delayedCall(800, () => {
        if (!bs.scene.isActive()) return;
        fireParticles.stop();
        bs.time.delayedCall(1000, () => fireParticles.destroy());

        bs.takeDamage(!isPlayer, dmg);

        bs.createScreenFlash(0xff4500, 500, 1);
        bs.createImpactEffect(target.x, target.y + 120, 0xff4500, "beam");
        bs.cameras.main.shake(1000, 0.1);
        if (bs.cache.audio.exists("sfx_explosion"))
          bs.sound.play("sfx_explosion");

        for (let i = 0; i < 5; i++) {
          const ring = bs.add
            .circle(target.x, target.y + 120, 50, 0xff4500)
            .setStrokeStyle(12, 0xff4500)
            .setDepth(20)
            .setAlpha(0)
            .setBlendMode(Phaser.BlendModes.ADD);
          ring.isFilled = false;
          bs.tweens.add({
            targets: ring,
            scale: 12 + i * 6,
            alpha: { start: 1, end: 0 },
            duration: 500 + i * 150,
            ease: "Cubic.easeOut",
            onComplete: () => ring.destroy(),
          });
        }

        target.setTint(0xff4500);
        bs.time.delayedCall(500, () => target.clearTint());

        bs.onSpecialComplete(isPlayer);
      });
    });

    return null as any;
  }

  performSuper(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    
    // I could just call it locally to avoid massive text, or re-implement.
    // For safety, let's keep it calling bs.specialTengaiShinsei(isPlayer) right now!
    // Since I didn't delete it from BattleScene!
    bs.specialTengaiShinsei(isPlayer);

    return null as any;
  }

  performTransform(scene: Phaser.Scene, isPlayer: boolean, level: number): void {}
}