import Phaser from "phaser";
import { Fighter } from "./base/Fighter";
import { AttackParams, AttackResult } from "./base/FighterTypes";

export class CyberNinjaFighter extends Fighter {
  readonly key = "cyberninja";
  readonly specialName = "PLASMA DASH";
  readonly superName = "CYBER OVERDRIVE";
  readonly specialColor = 0x00eaff;

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
          if (bs.soundManager) bs.soundManager.playPunchImpact(true);
          bs.createImpactEffect(target.x, target.y + 120, 0x00ffff);
          bs.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 22 : 12) * bs.getDamageMultiplier(transLevel),
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
                attacker.play(bs.getAnimKey("cyberninja", transLevel, "idle"));
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
        if (bs.soundManager) bs.soundManager.playBeamFire();

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
    const {
      scene,
      attacker,
      defender: target,
      isPlayer,
      transformLevel,
    } = params;
    const bs = scene as any;
    const startX = attacker.x;
    const startY = attacker.y;
    const transLevel = transformLevel;

    // specialPlasmaDash
    const isS = false;
    const baseDmg = isS ? 60 : 35;
    const dmg = Math.floor(baseDmg * bs.getDamageMultiplier(transLevel));
    const dashColor = transLevel > 0 ? 0xff0055 : 0x00eaff;

    bs.log("PLASMA DASH!");
    if (bs.soundManager) bs.soundManager.playPunchImpact(true);

    // Vanish
    attacker.setVisible(false);

    // Dash Line Visual
    const dashLineGlow = bs.add
      .rectangle(
        (startX + target.x) / 2,
        startY + 50,
        Math.abs(target.x - startX) + 200,
        30,
        dashColor,
      )
      .setDepth(14)
      .setAlpha(0.6)
      .setBlendMode(Phaser.BlendModes.ADD);

    const dashLine = bs.add
      .rectangle(
        (startX + target.x) / 2,
        startY + 50,
        Math.abs(target.x - startX) + 100,
        10,
        0xffffff,
      )
      .setDepth(15)
      .setAlpha(0.9)
      .setBlendMode(Phaser.BlendModes.ADD);

    bs.cameras.main.shake(300, 0.02);

    bs.tweens.add({
      targets: [dashLine, dashLineGlow],
      scaleY: 0,
      alpha: 0,
      duration: 300,
    });

    // Teleport behind enemy
    const behindX = isPlayer ? target.x + 80 : target.x - 80;
    attacker.setPosition(behindX, startY);
    attacker.setVisible(true);
    attacker.setFlipX(isPlayer ? true : false); // Face back towards enemy

    // Impact Delay (The "Omae wa mou shindeiru" effect)
    bs.time.delayedCall(400, () => {
      if (!bs.scene.isActive()) return;

      bs.createScreenFlash(dashColor, 300, 0.7);
      bs.cameras.main.shake(400, 0.04);

      // Slash Effect on Target
      const slashGlow = bs.add
        .graphics()
        .setDepth(14)
        .setBlendMode(Phaser.BlendModes.ADD);
      slashGlow.lineStyle(12, dashColor, 0.6);
      slashGlow.lineBetween(
        target.x - 100,
        target.y + 120 - 100,
        target.x + 100,
        target.y + 120 + 100,
      );

      const slash = bs.add
        .graphics()
        .setDepth(15)
        .setBlendMode(Phaser.BlendModes.ADD);
      slash.lineStyle(4, 0xffffff);
      slash.lineBetween(
        target.x - 100,
        target.y + 120 - 100,
        target.x + 100,
        target.y + 120 + 100,
      );

      bs.tweens.add({
        targets: [slash, slashGlow],
        alpha: 0,
        duration: 200,
        onComplete: () => {
          slash.destroy();
          slashGlow.destroy();
        },
      });

      // Shockwave rings
      for (let i = 0; i < 3; i++) {
        const ring = bs.add
          .circle(target.x, target.y + 120, 20, dashColor)
          .setStrokeStyle(6, dashColor)
          .setDepth(20)
          .setAlpha(0)
          .setBlendMode(Phaser.BlendModes.ADD);
        ring.isFilled = false;
        bs.tweens.add({
          targets: ring,
          scale: 6 + i * 3,
          alpha: { start: 1, end: 0 },
          duration: 200 + i * 100,
          ease: "Cubic.easeOut",
          onComplete: () => ring.destroy(),
        });
      }

      bs.createImpactEffect(target.x, target.y + 120, dashColor, "beam");
      bs.takeDamage(!isPlayer, dmg);

      // Return to start
      bs.time.delayedCall(300, () => {
        if (!bs.scene.isActive()) return;
        attacker.setVisible(false); // Vanish

        // Teleport back start
        attacker.setPosition(startX, startY);
        attacker.setFlipX(isPlayer ? false : true); // Reset flip
        attacker.setVisible(true);

        bs.onSpecialComplete(isPlayer);
      });
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
    const startX = attacker.x;
    const startY = attacker.y;
    const transLevel = transformLevel;

    // specialCyberOverdrive
    const dmg = Math.floor(120 * bs.getDamageMultiplier(transLevel));
    const dashColor = 0xff0055; // Always red for overdrive

    bs.log("CYBER OVERDRIVE!");
    if (bs.soundManager) bs.soundManager.playPunchImpact(true);

    attacker.setVisible(false);

    // Screen darkens slightly for contrast
    const dark = bs.add
      .rectangle(0, 0, 1000, 600, 0x000000, 0.8)
      .setOrigin(0)
      .setDepth(14);

    // Multiple high speed dashes
    for (let i = 0; i < 15; i++) {
      bs.time.delayedCall(i * 50, () => {
        if (!bs.scene.isActive()) return;
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const len = 500;

        const dashLineGlow = bs.add
          .rectangle(
            target.x + Math.cos(angle) * 50,
            target.y - 30 + Math.sin(angle) * 50,
            len,
            40,
            dashColor,
          )
          .setDepth(14)
          .setAlpha(0.6)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setRotation(angle);

        const dashLine = bs.add
          .rectangle(
            target.x + Math.cos(angle) * 50,
            target.y - 30 + Math.sin(angle) * 50,
            len,
            20,
            dashColor,
          )
          .setDepth(15)
          .setAlpha(0.9)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setRotation(angle);

        const dashCore = bs.add
          .rectangle(dashLine.x, dashLine.y, len, 5, 0xffffff)
          .setDepth(16)
          .setRotation(angle);

        bs.tweens.add({
          targets: [dashLineGlow, dashLine, dashCore],
          scaleY: 0,
          alpha: 0,
          duration: 150,
          onComplete: () => {
            dashLineGlow.destroy();
            dashLine.destroy();
            dashCore.destroy();
          },
        });
        bs.createImpactEffect(
          target.x + Phaser.Math.Between(-60, 60),
          target.y + 120 + Phaser.Math.Between(-60, 60),
          dashColor,
        );

        if (i % 2 === 0) bs.cameras.main.shake(80, 0.02);
      });
    }

    bs.time.delayedCall(850, () => {
      if (!bs.scene.isActive()) return;

      bs.createScreenFlash(dashColor, 600, 1);
      bs.cameras.main.shake(1000, 0.1);
      if (bs.soundManager) bs.soundManager.playExplosion(true);

      // Final massive slash
      const slashGlow = bs.add
        .rectangle(target.x, target.y + 120, 700, 80, dashColor)
        .setDepth(14)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.8)
        .setRotation(Math.PI / 4);
      const slash = bs.add
        .rectangle(target.x, target.y + 120, 700, 30, dashColor)
        .setDepth(15)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setRotation(Math.PI / 4);
      const slashCore = bs.add
        .rectangle(target.x, target.y + 120, 700, 15, 0xffffff)
        .setDepth(16)
        .setRotation(Math.PI / 4);

      // Shockwave rings
      for (let i = 0; i < 6; i++) {
        const ring = bs.add
          .circle(target.x, target.y + 120, 50, dashColor)
          .setStrokeStyle(12, dashColor)
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

      bs.tweens.add({
        targets: [slashGlow, slash, slashCore],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          slashGlow.destroy();
          slash.destroy();
          slashCore.destroy();
        },
      });

      bs.createImpactEffect(target.x, target.y + 120, dashColor, "beam");
      bs.takeDamage(!isPlayer, dmg);

      bs.tweens.add({
        targets: dark,
        alpha: 0,
        duration: 400,
        onComplete: () => dark.destroy(),
      });
      attacker.setPosition(startX, startY);
      attacker.setVisible(true);
      bs.onSpecialComplete(isPlayer);
    });

    return null as any;
  }
}
