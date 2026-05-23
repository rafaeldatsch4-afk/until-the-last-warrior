import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class SaitamaFighter extends Fighter {
  readonly key = 'saitama';
  readonly specialName = 'SERIOUS PUNCH';
  readonly superName = 'SUPREME HEADBUTT';
  readonly specialColor = 0xffffff;

  performTransform(scene: any, isPlayer: boolean): void {}

  performAttack(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, attackType, isComboFinisher, transformLevel } = params;
    const bs = scene as any;
    const startX = attacker ? attacker.x : (isPlayer ? bs.player.x : bs.enemy.x);
    const transLevel = transformLevel;

    if (attackType === "melee") {
      // Saitama Melee: Fast strikes that create shockwaves
      attacker.play(bs.getAnimKey("saitama", transLevel, "attack"));
      
      // Dash effect
      const dashGlow = bs.add.rectangle(attacker.x - (attacker.x < target.x ? -20 : 20), attacker.y + 100, 80, 10, 0xffffff, 0.5).setDepth(2);
      bs.tweens.add({ targets: dashGlow, scaleX: 3, alpha: 0, duration: 200, onComplete: () => dashGlow.destroy() });

      bs.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -45 : 45),
        duration: 50, // SUPER FAST
        ease: "Expo.easeOut",
        onComplete: () => {
          if (!bs.scene.isActive()) return;
          if (bs.cache.audio.exists("sfx_attack"))
            bs.sound.play("sfx_attack", { volume: 2.0 });

          bs.createImpactEffect(target.x, target.y + 120, 0xffffff);
          bs.cameras.main.shake(150, 0.02);

          // Intense Impact shockwave
          const wave = bs.add.circle(target.x, target.y + 120, 15, 0xffffff, 0.7).setDepth(6);
          bs.tweens.add({
            targets: wave,
            scale: isComboFinisher ? 12 : 8,
            alpha: 0,
            duration: 250,
            ease: "Quad.easeOut",
            onComplete: () => wave.destroy(),
          });
          
          if (isComboFinisher) {
             const wave2 = bs.add.circle(target.x, target.y + 120, 5, 0xffffff, 1).setDepth(6);
             bs.tweens.add({
               targets: wave2, scale: 20, alpha: 0, duration: 400, onComplete: () => wave2.destroy()
             });
             bs.cameras.main.shake(250, 0.04);
          }

          bs.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 35 : 18) *
                bs.getDamageMultiplier(transLevel),
            ),
          );

          bs.time.delayedCall(150, () => {
            if (!bs.scene.isActive()) return;
            bs.tweens.add({
              targets: attacker,
              x: startX,
              duration: 100,
              ease: "Expo.easeOut",
              onComplete: () => {
                attacker.play(bs.getAnimKey("saitama", transLevel, "idle"));
                bs.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // Saitama Ki: He doesn't have "ki", so he just does a "Normal Punch" that creates a wind pressure blast
      attacker.play(bs.getAnimKey("saitama", transLevel, "attack"));

      // Small dash forward
      bs.tweens.add({ targets: attacker, x: attacker.x + (attacker.x < target.x ? 20 : -20), duration: 50, yoyo: true });
      
      bs.time.delayedCall(50, () => {
        if (!bs.scene.isActive()) return;
        if (bs.cache.audio.exists("sfx_beam"))
          bs.sound.play("sfx_beam", { volume: 1.0, rate: 0.8 }); // deeper sound for air pressure

        const hand = bs.getHandPosition(isPlayer);
        
        const blastsCount = isComboFinisher ? 5 : 1;
        
        // Huge screen flash for the punch force
        bs.createScreenFlash(0xffffff, 200, 0.5);
        bs.cameras.main.shake(150, 0.02);

        for (let i = 0; i < blastsCount; i++) {
           bs.time.delayedCall(i * 80, () => {
              if (!bs.scene.isActive()) return;

              if (i > 0 && bs.cache.audio.exists("sfx_attack")) {
                 bs.sound.play("sfx_attack", { volume: 1.0, rate: 1.5 });
              }
              
              // Wind pressure (Giant expanding ellipse)
              const waveY = hand.y + Phaser.Math.Between(-20, 20);
              const blast = bs.add.ellipse(hand.x, waveY, 40, 60, 0xffffff, 0.7).setDepth(5);
              const core = bs.add.ellipse(hand.x, waveY, 20, 30, 0xffffff, 1).setDepth(6);
              
              // Wind lines
              const lines: Phaser.GameObjects.Rectangle[] = [];
              for(let j=0; j<3; j++) {
                  const line = bs.add.rectangle(hand.x, waveY + Phaser.Math.Between(-30, 30), Phaser.Math.Between(40, 80), Phaser.Math.Between(2, 6), 0xffffff, 0.5).setDepth(5);
                  lines.push(line);
              }

              bs.tweens.add({
                targets: [blast, core, ...lines],
                x: target.x + (attacker.x < target.x ? 200 : -200),
                scale: i === blastsCount - 1 ? 6 : 3, // Last one is HUGE
                alpha: 0,
                duration: 200,
                ease: "Power2",
                onComplete: () => {
                  blast.destroy();
                  core.destroy();
                  lines.forEach((l: any) => l.destroy());
                  if (!bs.scene.isActive()) return;
                  
                  bs.createImpactEffect(target.x, target.y + 120, 0xffffff);
                  bs.cameras.main.shake(100, 0.03);
                  
                  bs.takeDamage(
                    !isPlayer,
                    Math.floor(
                      (isComboFinisher ? 15 : 20) *
                        bs.getDamageMultiplier(transLevel),
                    ),
                  );
                },
              });
           });
        }

        bs.time.delayedCall(200 + (blastsCount * 80), () => {
          if (!bs.scene.isActive()) return;
          attacker.play(bs.getAnimKey("saitama", transLevel, "idle"));
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
    const startX = attacker.x;
    
    // specialSeriousPunch
    const dmg = Math.floor(110 * bs.getDamageMultiplier(transLevel));
    const targetStartX = target.x;

    bs.log("SERIOUS PUNCH!");
    
    // Slow dramatic walk
    attacker.play(bs.getAnimKey("saitama", transLevel, "idle"));
    
    // Manga-style speed lines in the background
    const speedLines = bs.add.graphics();
    const cx = 480;
    const cy = 270;
    speedLines.lineStyle(2, 0xffffff, 0.4);
    for(let i=0; i<60; i++) {
        const angle = Phaser.Math.Between(0, 360) * Math.PI / 180;
        const r1 = Phaser.Math.Between(150, 400);
        const r2 = 600;
        speedLines.beginPath();
        speedLines.moveTo(cx + Math.cos(angle)*r1, cy + Math.sin(angle)*r1);
        speedLines.lineTo(cx + Math.cos(angle)*r2, cy + Math.sin(angle)*r2);
        speedLines.strokePath();
    }
    speedLines.setDepth(0);
    bs.tweens.add({ targets: speedLines, angle: 10, duration: 1200, alpha: 0.8 });

    bs.tweens.add({
      targets: attacker,
      x: target.x + (attacker.x < target.x ? -120 : 120),
      duration: 1200,
      ease: "Power1.easeInOut",
      onComplete: () => {
        if (!bs.scene.isActive()) return;
        
        // Everything goes quiet for a second...
        bs.time.delayedCall(300, () => {
          if (!bs.scene.isActive()) return;

          attacker.play(bs.getAnimKey("saitama", transLevel, "attack"));
          
          bs.time.delayedCall(100, () => {
            if (!bs.scene.isActive()) return;
            
            if (bs.cache.audio.exists("sfx_explosion")) bs.sound.play("sfx_explosion", { volume: 3.0 });
            bs.createScreenFlash(0xffffff, 800, 1);
            bs.cameras.main.shake(1000, 0.1);

            // ATMOSPHERIC SPLIT (Iconic)
            const splitLine = bs.add.rectangle(480, target.y + 120, 960, 10, 0xffffff).setDepth(30).setAlpha(1);
            bs.tweens.add({
               targets: splitLine,
               scaleY: 200,
               alpha: 0,
               duration: 800,
               onComplete: () => {
                 splitLine.destroy();
                 speedLines.destroy();
               }
            });

            // Particles flying away from impact
            for(let i=0; i<40; i++) {
               const p = bs.add.rectangle(target.x, target.y + 120, Phaser.Math.Between(4, 10), Phaser.Math.Between(4, 10), Math.random() > 0.5 ? 0xffffff : 0xffaa00).setDepth(20);
               bs.tweens.add({
                  targets: p,
                  x: p.x + (attacker.x < target.x ? 600 : -600) + Phaser.Math.Between(-150, 150),
                  y: p.y + Phaser.Math.Between(-400, 400),
                  angle: Phaser.Math.Between(0, 360),
                  alpha: 0,
                  duration: 1200,
                  onComplete: () => p.destroy()
               });
            }

            bs.takeDamage(!isPlayer, dmg);
            bs.createImpactEffect(target.x, target.y + 120, 0xffffff, "beam");

            // Horizontal knockback that flies off screen briefly, then bounces back
            bs.tweens.add({
              targets: target,
              x: target.x + (attacker.x < target.x ? 600 : -600),
              angle: isPlayer ? 45 : -45,
              alpha: 0,
              duration: 300,
              ease: "Expo.easeOut",
              onComplete: () => {
                 bs.time.delayedCall(200, () => {
                    if (!bs.scene.isActive() || !target.active) return;
                    target.setX(isPlayer ? 900 : 60);
                    bs.tweens.add({ 
                      targets: target, 
                      x: targetStartX, 
                      angle: 0,
                      alpha: 1, 
                      duration: 400,
                      ease: "Bounce.easeOut"
                    });
                 });
              }
            });

            bs.time.delayedCall(800, () => {
               if (!bs.scene.isActive()) return;
               bs.tweens.add({
                 targets: attacker,
                 x: startX,
                 duration: 300,
                 onComplete: () => bs.onSpecialComplete(isPlayer)
               });
            });
          });
        });
      }
    });

    return null as any;
  }

  performSuper(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    const startX = attacker.x;
    const startY = attacker.y;
    const transLevel = transformLevel;
    const targetStartX = target.x;
    
    // specialSupremeHeadbutt
    const dmg = Math.floor(130 * bs.getDamageMultiplier(transLevel));

    bs.log("SUPREME HEADBUTT!");
    
    // Preparation: Wind gathering effect
    for(let i=0; i<15; i++) {
       const p = bs.add.circle(attacker.x + Phaser.Math.Between(-60, 60), attacker.y + Phaser.Math.Between(-60, 60), Phaser.Math.Between(2, 4), 0xffffff, 0.8).setDepth(15);
       bs.tweens.add({
         targets: p,
         x: attacker.x,
         y: attacker.y - 45,
         alpha: 0,
         scale: 0.2,
         duration: 600,
         onComplete: () => p.destroy()
       });
    }

    bs.tweens.add({
      targets: attacker,
      x: attacker.x + (isPlayer ? -60 : 60),
      duration: 500,
      ease: "Cubic.easeOut",
      onComplete: () => {
        if (!bs.scene.isActive()) return;

        // Head glint
        const glow = bs.add.circle(attacker.x, attacker.y - 45, 12, 0xffffff, 1).setDepth(20);
        bs.tweens.add({ targets: glow, scale: 6, alpha: 0, duration: 200 });

        if (bs.cache.audio.exists("sfx_attack")) bs.sound.play("sfx_attack", { volume: 2.5 });
        bs.cameras.main.shake(150, 0.04);

        // DASH! (Almost instantaneous)
        bs.tweens.add({
          targets: attacker,
          x: target.x + (attacker.x < target.x ? 30 : -30),
          duration: 60,
          ease: "Linear",
          onComplete: () => {
            if (!bs.scene.isActive()) return;

            glow.destroy();
            bs.createScreenFlash(0xffffff, 500, 1);
            bs.cameras.main.shake(800, 0.08);

            // Relativistic impact - White screen for a frame
            const flash = bs.add.rectangle(480, 270, 960, 540, 0xffffff).setDepth(100).setAlpha(0);
            bs.tweens.add({ targets: flash, alpha: 1, duration: 30, yoyo: true });

            bs.createImpactEffect(target.x, target.y + 120, 0xffffff, "beam");
            bs.takeDamage(!isPlayer, dmg);

            // PHYSICS-BASED KNOCKBACK (Intense)
            bs.tweens.add({
              targets: target,
              x: target.x + (attacker.x < target.x ? 400 : -400),
              y: target.y - 100,
              angle: isPlayer ? 20 : -20,
              duration: 500,
              ease: "Expo.easeOut",
              onComplete: () => {
                if (!bs.scene.isActive() || !target.active) return;
                bs.tweens.add({
                  targets: target,
                  x: targetStartX,
                  y: startY,
                  angle: 0,
                  duration: 400,
                  ease: "Bounce.easeOut"
                });
              }
            });

            // Afterimage return
            bs.time.delayedCall(500, () => {
              if (!bs.scene.isActive()) return;
              bs.tweens.add({
                targets: attacker,
                x: startX,
                duration: 200,
                ease: "Power2",
                onComplete: () => bs.onSpecialComplete(isPlayer)
              });
            });
          }
        });
      }
    });

    return null as any;
  }
}
