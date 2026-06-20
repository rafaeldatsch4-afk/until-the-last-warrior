import Phaser from "phaser";
import { Fighter } from "./base/Fighter";
import { AttackParams, AttackResult } from "./base/FighterTypes";

export class ThukunaFighter extends Fighter {
  readonly key = "thukuna";
  readonly specialName = "CLEAVE";
  readonly superName = "MALEVOLENT SHRINE";
  readonly specialColor = 0xc20000;

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
    const transLevel = transformLevel;

    if (attackType === "melee") {
      // Thukuna Melee: Cleave (invisible slashes)
      attacker.play(bs.getAnimKey("thukuna", transLevel, "attack"));

      const slashCount = isComboFinisher ? 5 : 2;
      for (let i = 0; i < slashCount; i++) {
        bs.time.delayedCall(i * 100, () => {
          if (!bs.scene.isActive()) return;
          if (bs.cache.audio.exists("sfx_attack"))
            bs.sound.play("sfx_attack", { volume: 1.0 });

          // Draw slash lines on target
          const slash = bs.add.graphics().setDepth(10);
          slash.lineStyle(4, 0xffffff, 1);
          const ox = target.x + (Math.random() * 40 - 20);
          const oy = target.y + 120 + (Math.random() * 40 - 20);
          slash.lineBetween(ox - 20, oy - 20, ox + 20, oy + 20);

          bs.tweens.add({
            targets: slash,
            alpha: 0,
            duration: 150,
            onComplete: () => slash.destroy(),
          });
          bs.createImpactEffect(ox, oy, 0xff0000);
          bs.takeDamage(
            !isPlayer,
            Math.floor(6 * bs.getDamageMultiplier(transLevel)),
          );
        });
      }

      bs.time.delayedCall(slashCount * 100 + 200, () => {
        if (!bs.scene.isActive()) return;
        attacker.play(bs.getAnimKey("thukuna", transLevel, "idle"));
        bs.setActionState(isPlayer, false);
      });
    } else {
      // Thukuna Ki: Fire Arrow
      attacker.play(bs.getAnimKey("thukuna", transLevel, "attack"));
      bs.time.delayedCall(150, () => {
        if (!bs.scene.isActive()) return;
        if (bs.cache.audio.exists("sfx_beam"))
          bs.sound.play("sfx_beam", { volume: 1.2 });

        const hand = bs.getHandPosition(isPlayer);
        const arrow = bs.add
          .triangle(
            hand.x,
            hand.y,
            0,
            -10,
            0,
            10,
            attacker.x < target.x ? 30 : -30,
            0,
            0xff4500,
          )
          .setDepth(5);

        bs.tweens.add({
          targets: arrow,
          x: target.x,
          duration: 150,
          onComplete: () => {
            arrow.destroy();
            if (!bs.scene.isActive()) return;
            bs.createImpactEffect(target.x, target.y + 120, 0xff4500);
            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 25 : 15) *
                  bs.getDamageMultiplier(transLevel),
              ),
            );
            bs.cameras.main.shake(150, 0.02);
          },
        });

        bs.time.delayedCall(300, () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("thukuna", transLevel, "idle"));
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
    const transLevel = transformLevel;

    // specialCleave
    const dmg = Math.floor(45 * bs.getDamageMultiplier(transLevel));

    bs.log("CLEAVE!");
    if (bs.cache.audio.exists("sfx_attack")) bs.sound.play("sfx_attack");

    // Create invisible slash effect
    const slashGlow1 = bs.add
      .graphics()
      .setDepth(14)
      .setBlendMode(Phaser.BlendModes.ADD);
    slashGlow1.lineStyle(20, 0xff0000, 0.6);
    slashGlow1.beginPath();
    slashGlow1.moveTo(target.x - 60, target.y - 60);
    slashGlow1.lineTo(target.x + 60, target.y + 120);
    slashGlow1.strokePath();

    const slash1 = bs.add.graphics().setDepth(15);
    slash1.lineStyle(6, 0xffffff, 1);
    slash1.beginPath();
    slash1.moveTo(target.x - 60, target.y - 60);
    slash1.lineTo(target.x + 60, target.y + 120);
    slash1.strokePath();

    const slashGlow2 = bs.add
      .graphics()
      .setDepth(14)
      .setBlendMode(Phaser.BlendModes.ADD);
    slashGlow2.lineStyle(20, 0xff0000, 0.6);
    slashGlow2.beginPath();
    slashGlow2.moveTo(target.x + 60, target.y - 60);
    slashGlow2.lineTo(target.x - 60, target.y + 120);
    slashGlow2.strokePath();

    const slash2 = bs.add.graphics().setDepth(15);
    slash2.lineStyle(6, 0xffffff, 1);
    slash2.beginPath();
    slash2.moveTo(target.x + 60, target.y - 60);
    slash2.lineTo(target.x - 60, target.y + 120);
    slash2.strokePath();

    bs.cameras.main.shake(200, 0.02);

    bs.tweens.add({
      targets: [slash1, slash2, slashGlow1, slashGlow2],
      alpha: 0,
      scale: 2,
      duration: 300,
      ease: "Cubic.easeOut",
      onComplete: () => {
        slash1.destroy();
        slash2.destroy();
        slashGlow1.destroy();
        slashGlow2.destroy();

        // Shockwave ring
        for (let i = 0; i < 4; i++) {
          const ring = bs.add
            .circle(target.x, target.y + 120, 40, 0xff0000)
            .setStrokeStyle(10, 0xff0000)
            .setDepth(20)
            .setAlpha(0)
            .setBlendMode(Phaser.BlendModes.ADD);
          ring.isFilled = false;
          bs.tweens.add({
            targets: ring,
            scale: 10 + i * 5,
            alpha: { start: 1, end: 0 },
            duration: 400 + i * 100,
            ease: "Cubic.easeOut",
            onComplete: () => ring.destroy(),
          });
        }

        // Small explosion
        const exp = bs.add
          .circle(target.x, target.y + 120, 30, 0xff0000)
          .setDepth(16)
          .setBlendMode(Phaser.BlendModes.ADD);
        bs.tweens.add({
          targets: exp,
          scale: 4,
          alpha: 0,
          duration: 250,
          onComplete: () => exp.destroy(),
        });

        bs.createImpactEffect(target.x, target.y + 120, 0xff0000, "beam");
        bs.takeDamage(!isPlayer, dmg);
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

    // specialMalevolentShrine
    const dmg = Math.floor(140 * bs.getDamageMultiplier(transLevel));

    bs.log("CASTELO MANIVOLENTE!");
    if (bs.cache.audio.exists("sfx_attack"))
      bs.sound.play("sfx_attack", { rate: 0.5 });

    // Screen goes dark red
    const darkOverlay = bs.add
      .rectangle(
        bs.cameras.main.width / 2,
        bs.cameras.main.height / 2,
        bs.cameras.main.width,
        bs.cameras.main.height,
        0x5a0000,
        0,
      )
      .setDepth(8);

    bs.tweens.add({
      targets: darkOverlay,
      fillAlpha: 0.8,
      duration: 500,
      onComplete: () => {
        if (!bs.scene.isActive()) return;

        // Shrine visual (Demonic Temple)
        const shrine = bs.add.graphics().setDepth(9);
        const sx = attacker.x;
        const sy = attacker.y - 40;

        // Base/Platform
        shrine.fillStyle(0x1a1a1a, 1);
        shrine.fillRect(sx - 100, sy, 200, 40);
        shrine.fillRect(sx - 80, sy - 20, 160, 20);

        // Pillars
        shrine.fillStyle(0x2a0000, 1);
        shrine.fillRect(sx - 60, sy - 120, 20, 100);
        shrine.fillRect(sx + 40, sy - 120, 20, 100);

        // Roof tiers (Pagoda style)
        shrine.fillStyle(0x0f0f0f, 1);
        shrine.beginPath();
        shrine.moveTo(sx - 90, sy - 120);
        shrine.lineTo(sx + 90, sy - 120);
        shrine.lineTo(sx + 70, sy - 150);
        shrine.lineTo(sx - 70, sy - 150);
        shrine.closePath();
        shrine.fillPath();

        shrine.beginPath();
        shrine.moveTo(sx - 60, sy - 150);
        shrine.lineTo(sx + 60, sy - 150);
        shrine.lineTo(sx + 40, sy - 190);
        shrine.lineTo(sx - 40, sy - 190);
        shrine.closePath();
        shrine.fillPath();

        // Center Core / Mouth
        shrine.fillStyle(0x000000, 1);
        shrine.fillRect(sx - 30, sy - 100, 60, 80);
        shrine.fillStyle(0x8b0000, 1);
        shrine.fillCircle(sx, sy - 60, 15); // Glowing eye/core

        // Skulls/Bones scattered
        shrine.fillStyle(0xdddddd, 1);
        for (let k = 0; k < 8; k++) {
          shrine.fillCircle(
            sx + Phaser.Math.Between(-80, 80),
            sy + Phaser.Math.Between(0, 30),
            Phaser.Math.Between(3, 6),
          );
        }

        // Shrine entrance animation
        shrine.setAlpha(0);
        shrine.y += 50;
        bs.tweens.add({
          targets: shrine,
          alpha: 1,
          y: "-=50",
          duration: 400,
          ease: "Back.easeOut",
        });

        bs.cameras.main.shake(1500, 0.02);

        // Relentless slashes (Cleave/Dismantle storm)
        const slashGraphics = bs.add.graphics().setDepth(15);
        for (let i = 0; i < 25; i++) {
          bs.time.delayedCall(i * 60, () => {
            if (!bs.scene.isActive()) return;
            const cx = target.x + Phaser.Math.Between(-60, 60);
            const cy = target.y + 120 + Phaser.Math.Between(-80, 80);
            const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
            const length = Phaser.Math.Between(80, 200);

            // Black core
            slashGraphics.lineStyle(8, 0x000000, 1);
            slashGraphics.beginPath();
            slashGraphics.moveTo(
              cx - (Math.cos(angle) * length) / 2,
              cy - (Math.sin(angle) * length) / 2,
            );
            slashGraphics.lineTo(
              cx + (Math.cos(angle) * length) / 2,
              cy + (Math.sin(angle) * length) / 2,
            );
            slashGraphics.strokePath();

            // Red outline
            slashGraphics.lineStyle(4, 0xff0000, 1);
            slashGraphics.beginPath();
            slashGraphics.moveTo(
              cx - (Math.cos(angle) * length) / 2,
              cy - (Math.sin(angle) * length) / 2,
            );
            slashGraphics.lineTo(
              cx + (Math.cos(angle) * length) / 2,
              cy + (Math.sin(angle) * length) / 2,
            );
            slashGraphics.strokePath();

            // Fade out effect using a tween on the graphics object would clear everything,
            // so we'll just clear it after a short delay or use individual rectangles for better control
            // Actually, for 25 slashes, individual rectangles are better if we want them to fade independently.
            // Let's use rectangles instead of graphics for slashes.
            const slashRect = bs.add
              .rectangle(cx, cy, length, 8, 0x000000)
              .setDepth(15)
              .setRotation(angle);
            const slashCore = bs.add
              .rectangle(cx, cy, length, 3, 0xff0000)
              .setDepth(16)
              .setRotation(angle);

            bs.tweens.add({
              targets: [slashRect, slashCore],
              alpha: 0,
              scaleX: 1.5,
              duration: 150,
              onComplete: () => {
                slashRect.destroy();
                slashCore.destroy();
              },
            });

            bs.createImpactEffect(cx, cy, 0x8b0000);
            if (bs.cache.audio.exists("sfx_hit"))
              bs.sound.play("sfx_hit", { volume: 0.5 });
            bs.cameras.main.shake(30, 0.015);
          });
        }

        bs.time.delayedCall(1600, () => {
          if (!bs.scene.isActive()) return;
          slashGraphics.destroy();

          // Final massive slash
          bs.createScreenFlash(0xff0000, 400, 0.9);
          bs.cameras.main.shake(600, 0.06);
          if (bs.cache.audio.exists("sfx_explosion"))
            bs.sound.play("sfx_explosion");

          const finalSlash = bs.add
            .rectangle(target.x, target.y + 120, 400, 20, 0xff0000)
            .setDepth(16)
            .setRotation(Math.PI / 4);
          const finalSlashCore = bs.add
            .rectangle(target.x, target.y + 120, 400, 8, 0xffffff)
            .setDepth(17)
            .setRotation(Math.PI / 4);
          bs.tweens.add({
            targets: [finalSlash, finalSlashCore],
            scaleY: 5,
            alpha: 0,
            duration: 400,
            onComplete: () => {
              finalSlash.destroy();
              finalSlashCore.destroy();
            },
          });

          bs.createImpactEffect(target.x, target.y + 120, 0xff0000, "beam");
          bs.takeDamage(!isPlayer, dmg);

          // Shockwave rings
          for (let i = 0; i < 6; i++) {
            const ring = bs.add
              .circle(target.x, target.y + 120, 50, 0xff0000)
              .setStrokeStyle(12, 0xff0000)
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

          // Fade out domain
          bs.tweens.add({
            targets: [darkOverlay, shrine],
            alpha: 0,
            duration: 500,
            onComplete: () => {
              darkOverlay.destroy();
              shrine.destroy();
              bs.onSpecialComplete(isPlayer);
            },
          });
        });
      },
    });

    return null as any;
  }
}
