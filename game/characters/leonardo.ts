import Phaser from "phaser";
import { Fighter } from "./base/Fighter";
import { AttackParams, AttackResult } from "./base/FighterTypes";

export class LeonardoFighter extends Fighter {
  readonly key = "leonardo";
  readonly specialName = "NINJA SLASH";
  readonly superName = "NINJA BARRAGE";
  readonly specialColor = 0x00ff00;

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
          if (bs.soundManager) bs.soundManager.playPunchImpact(true);

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
          bs.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 20 : 12) * bs.getDamageMultiplier(transLevel),
            ),
          );

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
        if (bs.soundManager) bs.soundManager.playBeamFire();

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
            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 15 : 8) * bs.getDamageMultiplier(transLevel),
              ),
            );
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
    const {
      scene,
      attacker,
      defender: target,
      isPlayer,
      transformLevel,
    } = params;
    const bs = scene as any;

    bs.log("NINJA SLASH!");
    if (bs.soundManager) bs.soundManager.playPunchImpact(true);

    const dmg = Math.floor(40 * bs.getDamageMultiplier(transformLevel));

    attacker.play(bs.getAnimKey("leonardo", transformLevel, "attack"));

    // Quick dash past enemy
    bs.tweens.add({
      targets: attacker,
      x: target.x + (isPlayer ? 100 : -100),
      duration: 300,
      ease: "Power2",
      onComplete: () => {
        // Slash effect
        const slash = bs.add.graphics().setDepth(15);
        slash.lineStyle(8, 0x00ff00, 1);
        slash.lineBetween(
          target.x - 50,
          target.y - 50,
          target.x + 50,
          target.y + 120,
        );
        bs.tweens.add({
          targets: slash,
          alpha: 0,
          duration: 200,
          onComplete: () => slash.destroy(),
        });

        if (bs.cache.audio.exists("sfx_hit")) if (bs.soundManager) bs.soundManager.playPunchImpact(false);
        bs.createImpactEffect(target.x, target.y + 50, 0x00ff00);
        bs.takeDamage(!isPlayer, dmg);

        bs.time.delayedCall(400, () => {
          if (!bs.scene.isActive()) return;
          attacker.x = isPlayer
            ? Math.min(target.x - 150, target.x)
            : Math.max(target.x + 150, target.x);
          attacker.play(bs.getAnimKey("leonardo", transformLevel, "idle"));
          bs.onSpecialComplete(isPlayer);
        });
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

    bs.log("NINJA BARRAGE!");
    bs.events.emit("super_activated", isPlayer);

    const dmg = Math.floor(80 * bs.getDamageMultiplier(transformLevel));

    // Dark background
    const overlay = bs.add
      .rectangle(0, 0, 960, 540, 0x000000, 0)
      .setOrigin(0)
      .setDepth(18);
    bs.tweens.add({ targets: overlay, fillAlpha: 0.8, duration: 500 });

    attacker.play(bs.getAnimKey("leonardo", transformLevel, "attack"));

    let hits = 0;
    const slashInterval = bs.time.addEvent({
      delay: 100,
      repeat: 9,
      callback: () => {
        if (!bs.scene.isActive()) return;
        hits++;
        attacker.x = target.x + (Math.random() - 0.5) * 200;
        attacker.y = target.y - 50 + (Math.random() - 0.5) * 100;

        const slash = bs.add.graphics().setDepth(15);
        slash.lineStyle(6, 0x00ff00, 1);
        slash.lineBetween(
          target.x + (Math.random() - 0.5) * 150,
          target.y - 50 + (Math.random() - 0.5) * 150,
          target.x + (Math.random() - 0.5) * 150,
          target.y + 120 + (Math.random() - 0.5) * 50,
        );
        bs.tweens.add({
          targets: slash,
          alpha: 0,
          duration: 150,
          onComplete: () => slash.destroy(),
        });

        if (hits % 2 === 0) bs.cameras.main.shake(50, 0.01);
        if (bs.soundManager) bs.soundManager.playPunchImpact(true);
      },
    });

    bs.time.delayedCall(1200, () => {
      if (!bs.scene.isActive()) return;
      bs.cameras.main.shake(500, 0.05);
      bs.createScreenFlash(0x00ff00, 500, 1);
      if (bs.soundManager) bs.soundManager.playExplosion(true);
      bs.takeDamage(!isPlayer, dmg);

      bs.tweens.add({
        targets: overlay,
        fillAlpha: 0,
        duration: 500,
        onComplete: () => {
          overlay.destroy();
          const startPos = isPlayer ? bs.p1StartPos : bs.p2StartPos;
          attacker.x = startPos.x;
          attacker.y = startPos.y;
          attacker.play(bs.getAnimKey("leonardo", transformLevel, "idle"));
          bs.onSpecialComplete(isPlayer);
        },
      });
    });

    return null as any;
  }

  performTransform(
    scene: Phaser.Scene,
    isPlayer: boolean,
    level: number,
  ): void {}
}
