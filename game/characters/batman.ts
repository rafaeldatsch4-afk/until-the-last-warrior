import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class BatmanFighter extends Fighter {
  readonly key = 'batman';
  readonly specialName = 'BATARANG';
  readonly superName = 'THE DARK KNIGHT';
  readonly specialColor = 0xf1c40f;

  performTransform(scene: any, isPlayer: boolean): void {}

  performAttack(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, attackType, isComboFinisher, transformLevel } = params;
    const bs = scene as any;
    const startX = attacker ? attacker.x : (isPlayer ? bs.player.x : bs.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? bs.player.y : bs.enemy.y);
    const transLevel = transformLevel;

    if (attackType === "melee") {
      // Batman Melee: Slide kick
      attacker.play(bs.getAnimKey("batman", transLevel, "attack"));
      bs.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        y: target.y + 20,
        rotation: isPlayer ? 0.5 : -0.5,
        duration: 150,
        onComplete: () => {
          if (!bs.scene.isActive()) return;
          if (bs.cache.audio.exists("sfx_attack"))
            bs.sound.play("sfx_attack", { volume: 1.0 });
          bs.createImpactEffect(target.x, target.y + 120, 0xffffff);
          bs.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 18 : 10) *
                bs.getDamageMultiplier(transLevel),
            ),
          );
          target.y -= 20; // Knock up slightly
          bs.tweens.add({
            targets: target,
            y: target.y + 20,
            duration: 100,
            ease: "Bounce.easeOut",
          });

          bs.time.delayedCall(200, () => {
            if (!bs.scene.isActive()) return;
            bs.tweens.add({
              targets: attacker,
              x: startX,
              y: startY,
              rotation: 0,
              duration: 150,
              onComplete: () => {
                attacker.play(bs.getAnimKey("batman", transLevel, "idle"));
                bs.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // Batman Ki: Batarang throw
      attacker.play(bs.getAnimKey("batman", transLevel, "attack"));
      bs.time.delayedCall(100, () => {
        if (!bs.scene.isActive()) return;
        if (bs.cache.audio.exists("sfx_beam"))
          bs.sound.play("sfx_beam", { volume: 0.8 });

        const hand = bs.getHandPosition(isPlayer);
        const batarang = bs.add
          .triangle(
            hand.x,
            hand.y,
            0,
            -5,
            0,
            5,
            attacker.x < target.x ? 15 : -15,
            0,
            0x333333,
          )
          .setDepth(5);
        bs.tweens.add({
          targets: batarang,
          rotation: isPlayer ? Math.PI * 4 : -Math.PI * 4,
          duration: 200,
        });

        bs.tweens.add({
          targets: batarang,
          x: target.x,
          duration: 200,
          onComplete: () => {
            batarang.destroy();
            if (!bs.scene.isActive()) return;
            bs.createImpactEffect(target.x, target.y + 120, 0x333333);
            bs.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 15 : 8) *
                  bs.getDamageMultiplier(transLevel),
              ),
            );
          },
        });

        bs.time.delayedCall(300, () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("batman", transLevel, "idle"));
          bs.setActionState(isPlayer, false);
        });
      });
    }

    return null as any;
  }

  performSpecial(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    const transLevel = transformLevel;
    
    // specialBatarang
    const dmg = Math.floor(35 * bs.getDamageMultiplier(transLevel));

    bs.log("BATARANG!");
    if (bs.cache.audio.exists("sfx_attack")) bs.sound.play("sfx_attack");

    const hand = bs.getHandPosition(isPlayer);

    // Throw 5 batarangs
    for (let i = 0; i < 5; i++) {
        // batarang logic uses game resources if "batarang" key exists. Let's use it.
      bs.time.delayedCall(i * 100, () => {
        if (!bs.scene.isActive()) return;

        let hasTexture = bs.textures.exists("batarang");

        const batarangGlow = hasTexture ? bs.add
          .sprite(hand.x, hand.y, "batarang")
          .setOrigin(0.5, 0.5)
          .setDepth(14)
          .setTint(0x00eaff)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.6)
          .setScale(1.5) : bs.add.circle(hand.x, hand.y, 10, 0x00eaff).setDepth(14);

        const batarang = hasTexture ? bs.add
          .sprite(hand.x, hand.y, "batarang")
          .setOrigin(0.5, 0.5)
          .setDepth(15) : bs.add.circle(hand.x, hand.y, 5, 0x333333).setDepth(15);

        // Trail - fallback if no particle texture
        let trailConfig: any = {
            scale: { start: 1, end: 0 },
            lifespan: 200,
            tint: 0x00eaff,
            blendMode: "ADD",
        };
        // wait, I should just use "particle" as the author did.
        let trailKey = "particle";
        // if follow property is an object, particle goes to it
        trailConfig.follow = batarang;

        try {
            const trail = bs.add
                .particles(0, 0, trailKey, trailConfig)
                .setDepth(13);
            
            bs.time.delayedCall(200, () => trail.destroy());
        } catch(e) {}

        // Spin animation
        bs.tweens.add({
          targets: [batarang, batarangGlow],
          angle: 360 * 6,
          duration: 300,
          ease: "Linear",
        });

        // Move to target
        bs.tweens.add({
          targets: [batarang, batarangGlow],
          x: target.x,
          y: target.y + 120 + Phaser.Math.Between(-40, 40),
          duration: 300,
          ease: "Power1",
          onComplete: () => {
            if (!bs.scene.isActive()) return;

            bs.createImpactEffect(batarang.x, batarang.y, 0x00eaff);
            if (bs.cache.audio.exists("sfx_hit")) bs.sound.play("sfx_hit");

            // Shockwave ring
            const ring = bs.add
              .circle(batarang.x, batarang.y, 10, 0x00eaff)
              .setStrokeStyle(3, 0x00eaff)
              .setDepth(20)
              .setAlpha(0)
              .setBlendMode(Phaser.BlendModes.ADD);
            ring.isFilled = false;
            bs.tweens.add({
              targets: ring,
              scale: 4,
              alpha: { start: 1, end: 0 },
              duration: 200,
              ease: "Cubic.easeOut",
              onComplete: () => ring.destroy(),
            });

            // Small explosion
            const exp = bs.add
              .circle(batarang.x, batarang.y, 10, 0x00eaff)
              .setDepth(16)
              .setBlendMode(Phaser.BlendModes.ADD);
            bs.tweens.add({
              targets: exp,
              scale: 3,
              alpha: 0,
              duration: 200,
              onComplete: () => exp.destroy(),
            });

            batarang.destroy();
            batarangGlow.destroy();

            if (i === 4) {
              bs.cameras.main.shake(300, 0.02);
              bs.takeDamage(!isPlayer, dmg);
              bs.onSpecialComplete(isPlayer);
            }
          },
        });
      });
    }

    return null as any;
  }

  performSuper(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    const startX = attacker.x;
    const transLevel = transformLevel;
    
    // specialTheDarkKnight
    const dmg = Math.floor(100 * bs.getDamageMultiplier(transLevel));

    bs.log("THE DARK KNIGHT!");
    if (bs.cache.audio.exists("sfx_attack")) bs.sound.play("sfx_attack");

    // Screen goes dark
    const darkOverlay = bs.add
      .rectangle(
        bs.cameras.main.width / 2,
        bs.cameras.main.height / 2,
        bs.cameras.main.width,
        bs.cameras.main.height,
        0x000000,
        0,
      )
      .setDepth(10);

    bs.tweens.add({
      targets: darkOverlay,
      fillAlpha: 0.9,
      duration: 300,
      onComplete: () => {
        if (!bs.scene.isActive()) return;

        // Teleport behind target
        attacker.x = target.x + (isPlayer ? 60 : -60);

        // Multiple strikes in the dark
        for (let i = 0; i < 12; i++) {
          bs.time.delayedCall(i * 80, () => {
            if (!bs.scene.isActive()) return;
            const cx = target.x + Phaser.Math.Between(-40, 40);
            const cy = target.y + 120 + Phaser.Math.Between(-40, 40);

            // Slash effect
            const slash = bs.add
              .graphics()
              .setDepth(15)
              .setBlendMode(Phaser.BlendModes.ADD);
            slash.lineStyle(4, 0xffffff);
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const len = 60;
            slash.lineBetween(
              cx - Math.cos(angle) * len,
              cy - Math.sin(angle) * len,
              cx + Math.cos(angle) * len,
              cy + Math.sin(angle) * len,
            );
            bs.tweens.add({
              targets: slash,
              alpha: 0,
              duration: 100,
              onComplete: () => slash.destroy(),
            });

            bs.createImpactEffect(cx, cy, 0xffffff);
            if (i % 3 === 0) bs.cameras.main.shake(50, 0.01);
            if (bs.cache.audio.exists("sfx_hit")) bs.sound.play("sfx_hit");
          });
        }

        bs.time.delayedCall(1000, () => {
          if (!bs.scene.isActive()) return;

          // Final explosive strike
          bs.createScreenFlash(0xf1c40f, 500, 1);
          bs.cameras.main.shake(1000, 0.1);

          // Shockwave rings
          for (let i = 0; i < 5; i++) {
            const ring = bs.add
              .circle(target.x, target.y + 120, 40, 0xf1c40f)
              .setStrokeStyle(12, 0xf1c40f)
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

          bs.createImpactEffect(target.x, target.y + 120, 0xf1c40f, "beam");
          bs.takeDamage(!isPlayer, dmg);

          // Fade out darkness and return
          bs.tweens.add({
            targets: darkOverlay,
            fillAlpha: 0,
            duration: 400,
            onComplete: () => {
              darkOverlay.destroy();
              attacker.x = startX;
              bs.onSpecialComplete(isPlayer);
            },
          });
        });
      },
    });

    return null as any;
  }
}
