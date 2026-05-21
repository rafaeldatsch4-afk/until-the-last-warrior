import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class SaitamaFighter extends Fighter {
  readonly key = 'saitama';
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
                    lines.forEach(l => l.destroy());
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
