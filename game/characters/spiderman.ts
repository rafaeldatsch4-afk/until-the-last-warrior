import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class SpidermanFighter extends Fighter {
  readonly key = 'spiderman';
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
