import Phaser from "phaser";
import { Fighter } from "./base/Fighter";
import { AttackParams, AttackResult } from "./base/FighterTypes";

export class StaticFighter extends Fighter {
  readonly key = "static";
  readonly specialName = "ELECTRIC DISC";
  readonly superName = "STATIC BURST";
  readonly specialColor = 0x00ffff;

  performTransform(scene: any, isPlayer: boolean): void {}

  performAttack(params: AttackParams): AttackResult {
    const {
      scene,
      attacker,
      defender: target,
      isPlayer,
      attackType,
      isComboFinisher,
      transformLevel,
    } = params;
    const bs = scene as any;
    const startX = attacker ? attacker.x : isPlayer ? bs.player.x : bs.enemy.x;
    const transLevel = transformLevel;

    if (attackType === "melee") {
      attacker.play(bs.getAnimKey("static", transLevel, "attack"));

      bs.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 100,
        onComplete: () => {
          if (!bs.scene.isActive()) return;
          if (bs.cache.audio.exists("sfx_attack"))
            bs.sound.play("sfx_attack", { volume: 1.0 });

          const hits = isComboFinisher ? 3 : 1;
          for (let i = 0; i < hits; i++) {
            bs.time.delayedCall(i * 100, () => {
              bs.createImpactEffect(target.x, target.y + 120, 0x00ffff);
              bs.takeDamage(
                !isPlayer,
                Math.floor(
                  (isComboFinisher ? 15 : 10) *
                    bs.getDamageMultiplier(transLevel),
                ),
              );

              // Zap visual
              const zap = bs.add.graphics();
              zap.lineStyle(2, 0x00ffff, 1);
              zap.beginPath();
              zap.moveTo(attacker.x, attacker.y + 100);
              zap.lineTo(
                target.x + (Math.random() * 20 - 10),
                target.y + 120 + (Math.random() * 20 - 10),
              );
              zap.strokePath();
              bs.time.delayedCall(50, () => zap.destroy());
            });
          }

          bs.time.delayedCall(hits * 100 + 100, () => {
            if (!bs.scene.isActive()) return;
            bs.tweens.add({
              targets: attacker,
              x: startX,
              duration: 150,
              onComplete: () => {
                attacker.play(bs.getAnimKey("static", transLevel, "idle"));
                bs.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // Ki Blast: Electric Bolt
      attacker.play(bs.getAnimKey("static", transLevel, "attack"));
      bs.time.delayedCall(50, () => {
        if (!bs.scene.isActive()) return;
        if (bs.cache.audio.exists("sfx_beam"))
          bs.sound.play("sfx_beam", { volume: 0.4, rate: 1.5 });

        const hand = bs.getHandPosition(isPlayer);
        const bolt = bs.add.graphics().setDepth(5);
        bolt.lineStyle(3, 0x00ffff, 1);

        bs.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 200,
          onUpdate: (tween: any) => {
            const v = tween.getValue();
            bolt.clear();
            bolt.lineStyle(3, 0x00ffff, 1);
            bolt.beginPath();
            let curX = hand.x;
            let curY = hand.y;
            const targetX = hand.x + (target.x - hand.x) * v;
            const targetY = hand.y + (target.y + 100 - hand.y) * v;

            bolt.moveTo(curX, curY);
            for (let i = 1; i <= 4; i++) {
              const px = hand.x + (targetX - hand.x) * (i / 4);
              const py = hand.y + (targetY - hand.y) * (i / 4);
              bolt.lineTo(
                px + (Math.random() * 10 - 5),
                py + (Math.random() * 10 - 5),
              );
            }
            bolt.strokePath();
          },
          onComplete: () => {
            bolt.destroy();
            if (!bs.scene.isActive()) return;
            bs.createImpactEffect(target.x, target.y + 120, 0x00ffff);
            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 18 : 8) * bs.getDamageMultiplier(transLevel),
              ),
            );

            attacker.play(bs.getAnimKey("static", transLevel, "idle"));
            bs.setActionState(isPlayer, false);
          },
        });
      });
    }

    return null as any;
  }

  performSpecial(params: AttackParams): AttackResult {
    const {
      scene,
      attacker,
      defender: target,
      isPlayer,
      transformLevel,
    } = params;
    const bs = scene as any;
    const transLevel = transformLevel;

    // specialElectricDisc
    const dmg = Math.floor(40 * bs.getDamageMultiplier(transLevel));

    bs.log("ELECTRIC DISC!");
    if (bs.cache.audio.exists("sfx_beam"))
      bs.sound.play("sfx_beam", { volume: 0.8, rate: 0.7 });

    const hand = bs.getHandPosition(isPlayer);
    const disc = bs.add.ellipse(hand.x, hand.y, 40, 10, 0x00ffff).setDepth(5);
    const discGlow = bs.add
      .ellipse(hand.x, hand.y, 50, 15, 0x00ffff, 0.5)
      .setDepth(4);

    bs.tweens.add({
      targets: [disc, discGlow],
      x: target.x,
      y: target.y + 120,
      angle: 360,
      duration: 400,
      ease: "Quad.easeIn",
      onComplete: () => {
        disc.destroy();
        discGlow.destroy();
        if (!bs.scene.isActive()) return;

        bs.cameras.main.shake(150, 0.02);
        bs.createImpactEffect(target.x, target.y + 120, 0x00ffff, "beam");
        bs.takeDamage(!isPlayer, dmg);

        // Zaps
        for (let i = 0; i < 8; i++) {
          const zap = bs.add.graphics().lineStyle(2, 0x00ffff, 1);
          zap.beginPath();
          zap.moveTo(target.x, target.y + 120);
          zap.lineTo(
            target.x + Phaser.Math.Between(-80, 80),
            target.y + 120 + Phaser.Math.Between(-80, 80),
          );
          zap.strokePath();
          bs.time.delayedCall(100, () => zap.destroy());
        }

        bs.onSpecialComplete(isPlayer);
      },
    });

    return null as any;
  }

  performSuper(params: AttackParams): AttackResult {
    const {
      scene,
      attacker,
      defender: target,
      isPlayer,
      transformLevel,
    } = params;
    const bs = scene as any;
    const transLevel = transformLevel;

    // specialStaticBurst
    const dmg = Math.floor(85 * bs.getDamageMultiplier(transLevel));

    bs.log("STATIC BURST!!!");
    if (bs.cache.audio.exists("sfx_beam"))
      bs.sound.play("sfx_beam", { volume: 1.2, rate: 0.5 });

    // Zoom in
    bs.cameras.main.zoomTo(1.2, 500, "Cubic.easeInOut", true);

    // Charge effect
    const charge = bs.add
      .circle(attacker.x, attacker.y + 100, 10, 0x00ffff, 1)
      .setDepth(5);
    bs.tweens.add({
      targets: charge,
      scale: 6,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: 1,
    });

    bs.time.delayedCall(1200, () => {
      if (!bs.scene.isActive()) return;
      charge.destroy();

      bs.createScreenFlash(0x00ffff, 400, 0.6);
      bs.cameras.main.shake(500, 0.05);

      // Huge electric beams from sky
      for (let i = 0; i < 5; i++) {
        const rx = target.x + (i - 2) * 40;
        const beam = bs.add
          .rectangle(rx, target.y - 300, 10, 600, 0x00ffff)
          .setOrigin(0.5, 0)
          .setDepth(10)
          .setAlpha(0.8);
        bs.tweens.add({
          targets: beam,
          width: 40,
          alpha: 0,
          duration: 300,
          onComplete: () => beam.destroy(),
        });
      }

      bs.createImpactEffect(target.x, target.y + 120, 0xffffff, "beam");
      bs.takeDamage(!isPlayer, dmg);

      bs.time.delayedCall(500, () => {
        if (!bs.scene.isActive()) return;
        bs.cameras.main.zoomTo(1, 500, "Cubic.easeInOut", true);
        bs.onSpecialComplete(isPlayer);
      });
    });

    return null as any;
  }
}
