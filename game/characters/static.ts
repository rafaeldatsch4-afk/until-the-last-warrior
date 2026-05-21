import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class StaticFighter extends Fighter {
  readonly key = 'static';
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
        attacker.play(bs.getAnimKey("static", transLevel, "attack"));
        
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
                bs.createImpactEffect(target.x, target.y + 120, 0x00ffff);
                bs.takeDamage(!isPlayer, Math.floor((isComboFinisher ? 15 : 10) * bs.getDamageMultiplier(transLevel)));
                
                // Zap visual
                const zap = bs.add.graphics();
                zap.lineStyle(2, 0x00ffff, 1);
                zap.beginPath();
                zap.moveTo(attacker.x, attacker.y + 100);
                zap.lineTo(target.x + (Math.random() * 20 - 10), target.y + 120 + (Math.random() * 20 - 10));
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
                }
              });
            });
          }
        });
      } else {
        // Ki Blast: Electric Bolt
        attacker.play(bs.getAnimKey("static", transLevel, "attack"));
        bs.time.delayedCall(50, () => {
          if (!bs.scene.isActive()) return;
          if (bs.cache.audio.exists("sfx_beam")) bs.sound.play("sfx_beam", { volume: 0.4, rate: 1.5 });
          
          const hand = bs.getHandPosition(isPlayer);
          const bolt = bs.add.graphics().setDepth(5);
          bolt.lineStyle(3, 0x00ffff, 1);
          
          bs.tweens.addCounter({
            from: 0,
            to: 1,
            duration: 200,
            onUpdate: (tween) => {
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
                  const px = hand.x + (targetX - hand.x) * (i/4);
                  const py = hand.y + (targetY - hand.y) * (i/4);
                  bolt.lineTo(px + (Math.random() * 10 - 5), py + (Math.random() * 10 - 5));
              }
              bolt.strokePath();
            },
            onComplete: () => {
              bolt.destroy();
              if (!bs.scene.isActive()) return;
              bs.createImpactEffect(target.x, target.y + 120, 0x00ffff);
              bs.takeDamage(!isPlayer, Math.floor((isComboFinisher ? 18 : 8) * bs.getDamageMultiplier(transLevel)));
              
              attacker.play(bs.getAnimKey("static", transLevel, "idle"));
              bs.setActionState(isPlayer, false);
            }
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
