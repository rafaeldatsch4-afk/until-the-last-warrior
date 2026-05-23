import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class SpidermanFighter extends Fighter {
  readonly key = 'spiderman';
  readonly specialName = 'WEB PULL PUNCH';
  readonly superName = 'MAXIMUM SPIDER';
  readonly specialColor = 0xcc2222;

  performTransform(scene: any, isPlayer: boolean): void {}

  performAttack(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, attackType, isComboFinisher, transformLevel } = params;
    const bs = scene as any;
    const startX = attacker ? attacker.x : (isPlayer ? bs.player.x : bs.enemy.x);
    const transLevel = transformLevel;

    if (attackType === "melee") {
        // Swift kick/punch combo
        attacker.play(bs.getAnimKey("spiderman", transLevel, "attack"));

        bs.tweens.add({
            targets: attacker,
            x: target.x + (attacker.x < target.x ? -40 : 40),
            duration: 100,
            onComplete: () => {
                if (!bs.scene.isActive()) return;
                if (bs.cache.audio.exists("sfx_attack")) bs.sound.play("sfx_attack", { volume: 1.0 });

                const hits = isComboFinisher ? 3 : 1;
                for (let i = 0; i < hits; i++) {
                    bs.time.delayedCall(i * 100, () => {
                        bs.createImpactEffect(target.x, target.y + 120, 0xffffff);
                        bs.takeDamage(!isPlayer, Math.floor((isComboFinisher ? 8 : 12) * bs.getDamageMultiplier(transLevel)));
                        target.x += attacker.x < target.x ? 5 : -5;
                        bs.cameras.main.shake(100, 0.01);
                    });
                }

                bs.time.delayedCall(hits * 100 + 100, () => {
                    if (!bs.scene.isActive()) return;
                    bs.tweens.add({
                        targets: attacker,
                        x: startX,
                        duration: 150,
                        onComplete: () => {
                            attacker.play(bs.getAnimKey("spiderman", transLevel, "idle"));
                            bs.setActionState(isPlayer, false);
                        }
                    });
                });
            }
        });
    } else {
        // Ki Blast: Web Ball
        attacker.play(bs.getAnimKey("spiderman", transLevel, "attack"));
        bs.time.delayedCall(50, () => {
            if (!bs.scene.isActive()) return;
            if (bs.cache.audio.exists("sfx_beam")) bs.sound.play("sfx_beam", { volume: 0.6 });
            
            const hand = bs.getHandPosition(isPlayer);
            const isIron = transLevel > 0;
            const webColor = isIron ? 0xcc2222 : 0xdddddd;
            
            const webBall = bs.add.circle(hand.x, hand.y, 8, webColor).setDepth(5);
            
            bs.tweens.add({
                targets: webBall,
                x: target.x,
                duration: 200,
                onComplete: () => {
                    webBall.destroy();
                    if (!bs.scene.isActive()) return;
                    bs.createImpactEffect(target.x, target.y + 120, webColor);
                    bs.takeDamage(!isPlayer, Math.floor((isComboFinisher ? 15 : 10) * bs.getDamageMultiplier(transLevel)));
                    
                    if (isComboFinisher) {
                        bs.tweens.add({
                           targets: target,
                           x: target.x + (attacker.x < target.x ? -20 : 20),
                           duration: 100,
                           yoyo: true
                        });
                    }
                }
            });

            bs.time.delayedCall(250, () => {
                if (!bs.scene.isActive()) return;
                attacker.play(bs.getAnimKey("spiderman", transLevel, "idle"));
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
      const isIron = transLevel > 0;
      
      const webColor = isIron ? 0xcc2222 : 0xdddddd;
      
      // Throw Web Line
      const hand = bs.getHandPosition(isPlayer);
      const webLine = bs.add.rectangle(hand.x, hand.y, 0, 4, webColor).setOrigin(isPlayer ? 0 : 1, 0.5).setDepth(4);
      
      bs.tweens.add({
          targets: webLine,
          width: Math.abs(target.x - attacker.x),
          duration: 150,
          onComplete: () => {
             if (!bs.scene.isActive()) return;
             // Hit! the opponent is pulled towards spiderman
             bs.createImpactEffect(target.x, target.y + 120, webColor);
             
             bs.tweens.add({
                 targets: [target, webLine],
                 x: attacker.x + (attacker.x < target.x ? 50 : -50),
                 width: 50,
                 duration: 200,
                 ease: "Back.easeIn",
                 onComplete: () => {
                     webLine.destroy();
                     // BAM! Uppercut or heavy punch
                     attacker.play(bs.getAnimKey("spiderman", transLevel, "attack"));
                     bs.cameras.main.shake(200, 0.03);
                     if (bs.cache.audio.exists("sfx_attack")) bs.sound.play("sfx_attack", { volume: 1.5 });
                     
                     bs.createImpactEffect(target.x, target.y + 120, 0xff0000);
                     bs.takeDamage(!isPlayer, Math.floor(40 * bs.getDamageMultiplier(transLevel)));
                     
                     // Send them flying back
                     bs.tweens.add({
                         targets: target,
                         x: isPlayer ? bs.p2StartPos.x : bs.p1StartPos.x,
                         duration: 200,
                         ease: "Quad.easeOut"
                     });
                     bs.tweens.add({
                         targets: target,
                         y: target.y - 40,
                         duration: 100,
                         yoyo: true,
                         ease: "Sine.easeOut"
                     });
                     
                     bs.time.delayedCall(400, () => {
                         if (!bs.scene.isActive()) return;
                         attacker.play(bs.getAnimKey("spiderman", transLevel, "idle"));
                         bs.onSpecialComplete(isPlayer);
                     });
                 }
             });
          }
      });

      return null as any;
  }

  performSuper(params: AttackParams): AttackResult {
      const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
      const bs = scene as any;
      const startX = attacker ? attacker.x : (isPlayer ? bs.player.x : bs.enemy.x);
      const startY = attacker ? attacker.y : (isPlayer ? bs.player.y : bs.enemy.y);
      const transLevel = transformLevel;
      const isIron = transLevel > 0;
      
      const beamColor = isIron ? 0xffd700 : 0xaa0000;
      bs.cameras.main.flash(500, 255, 255, 255);

      // Dash through screen multiple times! INSTANT KILL MODE
      attacker.play(bs.getAnimKey("spiderman", transLevel, "attack"));
      
      let strikes = 0;
      const maxStrikes = isIron ? 8 : 5;
      
      const performStrike = () => {
          if (!bs.scene.isActive()) return;
          if (strikes >= maxStrikes) {
              // Final return
              attacker.setAlpha(0);
              attacker.x = startX;
              attacker.y = startY;
              bs.time.delayedCall(150, () => {
                 if (!bs.scene.isActive()) return;
                 attacker.setAlpha(1);
                 attacker.play(bs.getAnimKey("spiderman", transLevel, "idle"));
                 bs.onSpecialComplete(isPlayer);
              });
              return;
          }
          
          strikes++;
          
          // Random attack vector
          const fromX = target.x + (Math.random() * 400 - 200);
          const fromY = target.y + 120 + (Math.random() * 300 - 200);
          
          attacker.x = fromX;
          attacker.y = fromY;
          attacker.setAlpha(0);
          
          // Show quick line
          const slash = bs.add.graphics();
          slash.lineStyle(6, beamColor, 0.8);
          slash.beginPath();
          slash.moveTo(fromX, fromY);
          slash.lineTo(target.x, target.y + 120);
          slash.strokePath();
          slash.setDepth(4);
          
          bs.tweens.add({
              targets: slash,
              alpha: 0,
              duration: 100,
              onComplete: () => slash.destroy()
          });

          bs.tweens.add({
              targets: attacker,
              x: target.x,
              y: target.y,
              alpha: 1,
              duration: 80,
              onComplete: () => {
                  if (!bs.scene.isActive()) return;
                  if (bs.cache.audio.exists("sfx_attack")) bs.sound.play("sfx_attack", { volume: 0.8 });
                  bs.createImpactEffect(target.x + (Math.random()*40-20), target.y + 120 + (Math.random()*40-20), 0xffffff);
                  bs.takeDamage(!isPlayer, Math.floor((isIron ? 15 : 20) * bs.getDamageMultiplier(transLevel)));
                  bs.cameras.main.shake(50, 0.02);
                  performStrike();
              }
          });
      };
      
      performStrike();

      return null as any;
  }
}
