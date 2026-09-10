import Phaser from "phaser";
import { Fighter } from "./base/Fighter";
import { AttackParams, AttackResult } from "./base/FighterTypes";

export class ItachiFighter extends Fighter {
  readonly key = "itachi";
  readonly specialName = "AMATERASU";
  readonly superName = "TSUKUYOMI";
  readonly specialColor = 0xff0000;

  performTransform(scene: any, isPlayer: boolean): void {
    // Basic transform is handled by the overall BattleScene sequence
  }

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

    if (attackType === "melee") {
      // Itachi Melee: Totsuka slash (Susanoo) or Kunai slash (Base)
      attacker.play(bs.getAnimKey("itachi", transformLevel, "attack"));

      // Dash forward
      bs.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 100,
        ease: "Power2",
        onComplete: () => {
          if (!bs.scene.isActive()) return;

          if (bs.soundManager) bs.soundManager.playSwordSlash(isComboFinisher);

          const hitColor = transformLevel === 1 ? 0xff4500 : 0xcccccc; // Susanoo sword or kunai
          
          // Minecraft Java Style Sword/Kunai Sweep Trail
          if (bs.createSwordSweepSlash) {
            bs.createSwordSweepSlash(target.x, target.y + 60, isPlayer, hitColor, transformLevel === 1 ? 1.4 : 1.15);
          } else if (bs.effects?.createSwordSweepSlash) {
            bs.effects.createSwordSweepSlash(target.x, target.y + 60, isPlayer, hitColor, transformLevel === 1 ? 1.4 : 1.15);
          }

          bs.createImpactEffect(target.x, target.y + 60, hitColor, "melee");
          bs.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 22 : 12) *
                bs.getDamageMultiplier(transformLevel),
            ),
          );
          bs.cameras.main.shake(100, 0.01);

          bs.time.delayedCall(200, () => {
            if (!bs.scene.isActive()) return;

            // Dash back
            bs.tweens.add({
              targets: attacker,
              x: startX,
              duration: 150,
              ease: "Power2",
              onComplete: () => {
                attacker.play(bs.getAnimKey("itachi", transformLevel, "idle"));
                bs.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // Itachi Ki: Fireball (Katon)
      attacker.play(bs.getAnimKey("itachi", transformLevel, "punch"));

      bs.time.delayedCall(100, () => {
        if (!bs.scene.isActive()) return;
        if (bs.soundManager) bs.soundManager.playBeamFire();

        const fireballColor = transformLevel === 1 ? 0xff4500 : 0xff8c00; // Susanoo fire or normal fire
        const hand = bs.getHandPosition(isPlayer);
        const fireball = bs.add
          .circle(hand.x, hand.y, 15, fireballColor)
          .setDepth(5);

        // Add some fire particles/glow
        const glow = bs.add
          .circle(fireball.x, fireball.y, 25, 0xff0000, 0.5)
          .setDepth(4);

        bs.tweens.add({
          targets: [fireball, glow],
          x: target.x,
          duration: 300,
          ease: "Power1",
          onComplete: () => {
            if (!bs.scene.isActive()) return;
            fireball.destroy();
            glow.destroy();

            if (bs.soundManager) bs.soundManager.playExplosion(true);
            bs.createImpactEffect(target.x, target.y + 120, fireballColor);
            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 20 : 10) *
                  bs.getDamageMultiplier(transformLevel),
              ),
            );

            // Fire explosion effect
            const explosion = bs.add
              .circle(target.x, target.y + 120, 10, 0xff0000)
              .setDepth(6);
            bs.tweens.add({
              targets: explosion,
              scale: 4,
              alpha: 0,
              duration: 200,
              onComplete: () => explosion.destroy(),
            });
          },
        });

        bs.time.delayedCall(400, () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("itachi", transformLevel, "idle"));
          bs.setActionState(isPlayer, false);
        });
      });
    }

    return null as any;
  }

  performSpecial(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    const dmg = Math.floor(40 * bs.getDamageMultiplier(transformLevel));
    bs.log("AMATERASU!");
    attacker.play(bs.getAnimKey("itachi", transformLevel, "charge"));
    if (bs.soundManager) bs.soundManager.playBeamFire();
    bs.effects.specials.play("amaterasu", target, 0x8b2454, attacker.flipX ? -1 : 1);
    // Visual preparation/release only; original damage and completion times remain.
    bs.time.delayedCall(250, () => {
      if (bs.scene.isActive() && attacker.active)
        attacker.play(bs.getAnimKey("itachi", transformLevel, "attack"));
    });
    bs.time.delayedCall(1000, () => {
      if (!bs.scene.isActive()) return;
      if (bs.soundManager) bs.soundManager.playExplosion(true);
      bs.takeDamage(!isPlayer, dmg);
      bs.cameras.main.shake(160, 0.006);
      bs.time.delayedCall(300, () => {
        if (bs.scene.isActive()) bs.onSpecialComplete(isPlayer);
      });
    });
    return null as any;
  }

  performSuper(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    const dmg = Math.floor(100 * bs.getDamageMultiplier(transformLevel));
    bs.log("TSUKUYOMI!");
    attacker.play(bs.getAnimKey("itachi", transformLevel, "charge"));
    if (bs.soundManager) bs.soundManager.playBeamFire();
    bs.effects.specials.play("tsukuyomi", target, 0xc32448, attacker.flipX ? -1 : 1);
    // The previous nested tween chain hit at 250 + 400 + 900 + 650 = 2200ms.
    // Keep combat on the scene clock, independent of visual quality and tweens.
    bs.time.delayedCall(1550, () => {
      if (!bs.scene.isActive()) return;
      if (attacker.active) attacker.play(bs.getAnimKey("itachi", transformLevel, "attack"));
      if (bs.soundManager) bs.soundManager.playExplosion(true);
    });
    bs.time.delayedCall(2200, () => {
      if (!bs.scene.isActive()) return;
      bs.takeDamage(!isPlayer, dmg);
      bs.cameras.main.shake(200, 0.008);
      bs.onSpecialComplete(isPlayer);
    });
    return null as any;
  }
}
