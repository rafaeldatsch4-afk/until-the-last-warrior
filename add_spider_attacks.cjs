const fs = require('fs');
const path = './game/scenes/BattleScene.ts';
let code = fs.readFileSync(path, 'utf-8');

const spiderManRouteOld = \`      case "naruto":\`;
const spiderManRouteNew = \`      case "spiderman":
        this.performSpidermanAttack(isPlayer, attackType, comboCount, isComboFinisher);
        return true;
      case "naruto":\`;
code = code.replace(spiderManRouteOld, spiderManRouteNew);

const spiderManAttackBlock = \`
  performSpidermanAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = isPlayer ? this.p1StartPos.x : this.p2StartPos.x;
    const startY = isPlayer ? this.p1StartPos.y : this.p2StartPos.y;
    const transLevel = isPlayer ? this.playerTransformLevel : this.enemyTransformLevel;

    if (attackType === "melee") {
        // Swift kick/punch combo
        attacker.play(this.getAnimKey("spiderman", transLevel, "attack"));

        this.tweens.add({
            targets: attacker,
            x: target.x + (isPlayer ? -40 : 40),
            duration: 100,
            onComplete: () => {
                if (!this.scene.isActive()) return;
                if (this.cache.audio.exists("sfx_attack")) this.sound.play("sfx_attack", { volume: 1.0 });

                // Multi hit for finisher
                const hits = isComboFinisher ? 3 : 1;
                for (let i = 0; i < hits; i++) {
                    this.time.delayedCall(i * 100, () => {
                        this.createImpactEffect(target.x, target.y - 10, 0xffffff);
                        this.takeDamage(!isPlayer, Math.floor((isComboFinisher ? 8 : 12) * this.getDamageMultiplier(transLevel)));
                        target.x += isPlayer ? 5 : -5;
                        this.cameras.main.shake(100, 0.01);
                    });
                }

                this.time.delayedCall(hits * 100 + 100, () => {
                    if (!this.scene.isActive()) return;
                    this.tweens.add({
                        targets: attacker,
                        x: startX,
                        duration: 150,
                        onComplete: () => {
                            attacker.play(this.getAnimKey("spiderman", transLevel, "idle"));
                            this.setActionState(isPlayer, false);
                        }
                    });
                });
            }
        });
    } else {
        // Ki Blast: Web Ball
        attacker.play(this.getAnimKey("spiderman", transLevel, "attack"));
        this.time.delayedCall(50, () => {
            if (!this.scene.isActive()) return;
            if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam", { volume: 0.6 });
            
            const hand = this.getHandPosition(isPlayer);
            const isIron = transLevel > 0;
            const webColor = isIron ? 0xcc2222 : 0xdddddd;
            
            const webBall = this.add.circle(hand.x, hand.y, 8, webColor).setDepth(5);
            
            this.tweens.add({
                targets: webBall,
                x: target.x,
                duration: 200,
                onComplete: () => {
                    webBall.destroy();
                    if (!this.scene.isActive()) return;
                    this.createImpactEffect(target.x, target.y - 20, webColor);
                    this.takeDamage(!isPlayer, Math.floor((isComboFinisher ? 15 : 10) * this.getDamageMultiplier(transLevel)));
                    
                    if (isComboFinisher) {
                        // Web pull!
                        this.tweens.add({
                           targets: target,
                           x: target.x + (isPlayer ? -20 : 20),
                           duration: 100 
                        });
                    }
                }
            });

            this.time.delayedCall(250, () => {
                if (!this.scene.isActive()) return;
                attacker.play(this.getAnimKey("spiderman", transLevel, "idle"));
                this.setActionState(isPlayer, false);
            });
        });
    }
  }

  performNarutoAttack`;
code = code.replace(`  performNarutoAttack`, spiderManAttackBlock);

const spidermanSpecialsOld = `            case "spiderman":
              if (isSuper) this.specialBeam(isPlayer, true, 0x1a1a1a, true, false, 'maximum_spider');
              else this.specialBeam(isPlayer, false, 0xffffff, false, false, 'web_shoot');
              break;`;

const spidermanSpecialsNew = `            case "spiderman":
              if (isSuper) this.specialMaximumSpider(isPlayer);
              else this.specialWebPullPunch(isPlayer);
              break;`;
code = code.replace(spidermanSpecialsOld, spidermanSpecialsNew);

// Add the Special routines at the end, before the "specialGenkidama" or somewhere inside the class
const spiderSkills = `
  specialWebPullPunch(isPlayer: boolean) {
      const attacker = isPlayer ? this.player : this.enemy;
      const target = isPlayer ? this.enemy : this.player;
      const startX = isPlayer ? this.p1StartPos.x : this.p2StartPos.x;
      const transLevel = isPlayer ? this.playerTransformLevel : this.enemyTransformLevel;
      const isIron = transLevel > 0;
      
      const webColor = isIron ? 0xcc2222 : 0xdddddd;
      
      // Throw Web Line
      const hand = this.getHandPosition(isPlayer);
      const webLine = this.add.rectangle(hand.x, hand.y, 0, 4, webColor).setOrigin(isPlayer ? 0 : 1, 0.5).setDepth(4);
      
      this.tweens.add({
          targets: webLine,
          width: Math.abs(target.x - attacker.x),
          duration: 150,
          onComplete: () => {
             if (!this.scene.isActive()) return;
             // Hit! the opponent is pulled towards spiderman
             this.createImpactEffect(target.x, target.y - 10, webColor);
             
             this.tweens.add({
                 targets: [target, webLine],
                 x: attacker.x + (isPlayer ? 50 : -50),
                 width: 50,
                 duration: 200,
                 ease: "Back.easeIn",
                 onComplete: () => {
                     webLine.destroy();
                     // BAM! Uppercut or heavy punch
                     attacker.play(this.getAnimKey("spiderman", transLevel, "attack"));
                     this.cameras.main.shake(200, 0.03);
                     if (this.cache.audio.exists("sfx_attack")) this.sound.play("sfx_attack", { volume: 1.5 });
                     
                     this.createImpactEffect(target.x, target.y - 20, 0xff0000);
                     this.takeDamage(!isPlayer, Math.floor(40 * this.getDamageMultiplier(transLevel)));
                     
                     // Send them flying back
                     this.tweens.add({
                         targets: target,
                         x: isPlayer ? this.p2StartPos.x : this.p1StartPos.x,
                         y: target.y - 40,
                         duration: 200,
                         yoyo: true,
                         ease: "Quad.easeOut"
                     });
                     
                     this.time.delayedCall(400, () => {
                         if (!this.scene.isActive()) return;
                         attacker.play(this.getAnimKey("spiderman", transLevel, "idle"));
                         this.onSpecialComplete(isPlayer);
                     });
                 }
             });
          }
      });
  }

  specialMaximumSpider(isPlayer: boolean) {
      const attacker = isPlayer ? this.player : this.enemy;
      const target = isPlayer ? this.enemy : this.player;
      const startX = isPlayer ? this.p1StartPos.x : this.p2StartPos.x;
      const startY = isPlayer ? this.p1StartPos.y : this.p2StartPos.y;
      const transLevel = isPlayer ? this.playerTransformLevel : this.enemyTransformLevel;
      const isIron = transLevel > 0;
      
      const beamColor = isIron ? 0xffd700 : 0xaa0000;
      this.cameras.main.flash(500, 255, 255, 255);

      // Dash through screen multiple times! INSTANT KILL MODE
      attacker.play(this.getAnimKey("spiderman", transLevel, "attack"));
      
      let strikes = 0;
      const maxStrikes = isIron ? 8 : 5;
      
      const performStrike = () => {
          if (strikes >= maxStrikes) {
              // Final return
              attacker.setAlpha(0);
              attacker.x = startX;
              attacker.y = startY;
              this.time.delayedCall(150, () => {
                 attacker.setAlpha(1);
                 attacker.play(this.getAnimKey("spiderman", transLevel, "idle"));
                 this.onSpecialComplete(isPlayer);
              });
              return;
          }
          
          strikes++;
          
          // Random attack vector
          const fromX = target.x + (Math.random() * 400 - 200);
          const fromY = target.y + (Math.random() * 300 - 200);
          
          attacker.x = fromX;
          attacker.y = fromY;
          attacker.setAlpha(0);
          
          // Show quick line
          const slash = this.add.graphics();
          slash.lineStyle(6, beamColor, 0.8);
          slash.beginPath();
          slash.moveTo(fromX, fromY);
          slash.lineTo(target.x, target.y);
          slash.strokePath();
          slash.setDepth(4);
          
          this.tweens.add({
              targets: slash,
              alpha: 0,
              duration: 100,
              onComplete: () => slash.destroy()
          });

          this.tweens.add({
              targets: attacker,
              x: target.x,
              y: target.y,
              alpha: 1,
              duration: 80,
              onComplete: () => {
                  if (this.cache.audio.exists("sfx_attack")) this.sound.play("sfx_attack", { volume: 0.8 });
                  this.createImpactEffect(target.x + (Math.random()*40-20), target.y + (Math.random()*40-20), 0xffffff);
                  this.takeDamage(!isPlayer, Math.floor((isIron ? 15 : 20) * this.getDamageMultiplier(transLevel)));
                  this.cameras.main.shake(50, 0.02);
                  performStrike();
              }
          });
      };
      
      performStrike();
  }

  specialGenkidama`;

code = code.replace(`  specialGenkidama`, spiderSkills);

fs.writeFileSync(path, code);
console.log("Spiderman attacks configured in BattleScene!");
