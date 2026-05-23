export class BattleAI {
  scene: any;

  constructor(scene: any) {
    this.scene = scene;
  }

  startAILoop() {
    const s = this.scene;
    const diff = s.gameState.difficulty; // 0: Easy, 1: Normal, 2: Hard
    let delay = 1500;
    if (diff === 0) delay = 2000;
    else if (diff === 1) delay = 1200;
    else if (diff === 2) delay = 700; // Much faster on Hard

    s.turnTimer = s.time.addEvent({
      delay: delay,
      loop: true,
      callback: () => this.enemyDecide(),
    });

    // AI Movement Loop
    s.time.addEvent({
      delay: 300,
      loop: true,
      callback: () => {
        if (s.isBattleOver || !s.scene.isActive()) return;
        if (s.p2ActionActive || s.enemyDefending) {
           s.aiMoveDir = 0;
           return;
        }
        
        const dist = Math.abs(s.enemy.x - s.player.x);
        const isLeftOfPlayer = s.enemy.x < s.player.x;
        
        let targetDir = 0; // -1 for Left, 1 for Right, 0 for stop
        
        // Dynamic behavior based on state
        if (s.enemyKi < 30) {
            // Needs Ki. If too close, retreat! If far enough, stay and charge.
            if (dist < 400) {
                targetDir = isLeftOfPlayer ? -1 : 1; // back away
            } else {
                targetDir = 0; // stop and charge
            }
        } else {
            // Has Ki, ready to attack. If far, approach!
            if (dist > 300) {
                targetDir = isLeftOfPlayer ? 1 : -1; // approach
            } else if (dist < 150) {
                // very close, jitter a bit
                targetDir = Math.random() < 0.3 ? (isLeftOfPlayer ? -1 : 1) : 0;
            } else {
                // sweet spot for attack, stay still or approach
                targetDir = Math.random() < 0.6 ? (isLeftOfPlayer ? 1 : -1) : 0;
            }
        }
        
        // Prevent corner trapping
        if (s.enemy.x <= 150) targetDir = 1;
        if (s.enemy.x >= 1850) targetDir = -1;
        
        s.aiMoveDir = targetDir;
      }
    });
  }

  enemyDecide() {
    const s = this.scene;
    if (s.isBattleOver || s.p2ActionActive || !s.scene.isActive())
      return;

    const r = Math.random();
    const playerHpPct = s.playerHp / s.playerData.maxHp;
    const enemyHpPct = s.enemyHp / s.enemyData.maxHp;
    const dist = Math.abs(s.player.x - s.enemy.x);

    // SMARTER AI: Check player state
    const playerIsAttacking = s.p1ActionActive;

    // 1. Reactive Guard: If player is attacking and close, HIGH chance to block
    if (playerIsAttacking && dist < 300 && r < 0.7) {
      s.enemyDefending = true;
      s.p2Aura.setVisible(true).setAlpha(0.4).setScale(1.1);
      s.time.delayedCall(800, () => {
        if (s.scene.isActive()) {
          s.enemyDefending = false;
          s.p2Aura.setVisible(false);
        }
      });
      return;
    }

    // 2. Transform if available and have enough Ki
    let maxLevel = 1;
    if (
      s.enemyData.key === "goku" ||
      s.enemyData.key === "vegeta" ||
      s.enemyData.key === "naruto"
    )
      maxLevel = 2;

    if (
      s.enemyKi >= 100 &&
      s.enemyTransformLevel < maxLevel &&
      s.enemyData.transformAvailable
    ) {
      s.performTransform(false);
      return;
    }

    // 2. If player is low on HP, prioritize finishing them off
    if (playerHpPct <= 0.3) {
      if (s.enemyKi >= 80 && r < 0.8) {
        s.performSpecial(false, true);
      } else if (s.enemyKi >= 40 && r < 0.7) {
        s.performSpecial(false, false);
      } else if (r < 0.6) {
        s.performAttack(false, Math.random() > 0.5 ? "melee" : "ki");
      } else {
        s.performCharge(false);
      }
      return;
    }

    // 3. If enemy is low on HP, play aggressively with specials or charge to get them
    if (enemyHpPct <= 0.4) {
      if (s.enemyKi >= 80) {
        s.performSpecial(false, true);
      } else if (s.enemyKi >= 40 && r < 0.6) {
        s.performSpecial(false, false);
      } else if (s.enemyKi < 40 && r < 0.8) {
        s.performCharge(false);
      } else {
        s.performAttack(false, Math.random() > 0.5 ? "melee" : "ki");
      }
      return;
    }

    // 4. If player has high Ki, try to interrupt them or defend
    if (s.playerKi >= 80) {
      if (r < 0.4) {
        // Defend for 1.2 seconds against potential super
        s.enemyDefending = true;
        s.p2Aura.setVisible(true).setAlpha(0.6).setScale(1.2);
        s.time.delayedCall(1200, () => {
          if (s.scene.isActive()) {
            s.enemyDefending = false;
            s.p2Aura.setVisible(false);
          }
        });
        return;
      } else if (s.enemyKi >= 40 && r < 0.6) {
        s.performSpecial(false, false);
        return;
      } else if (r < 0.8) {
        s.performAttack(false, dist < 200 ? "melee" : "ki");
        return;
      } else {
        s.performCharge(false);
        return;
      }
    }

    // 5. Standard tactical decisions based on Ki and Distance
    if (s.enemyKi >= 80) {
      // High Ki: Favor Super or Strategic Attack
      if (r < 0.5) {
        if (dist < 400 || r < 0.3) s.performSpecial(false, true);
        else s.performCharge(false);
      }
      else if (r < 0.8) s.performSpecial(false, false);
      else s.performAttack(false, dist < 150 ? "melee" : "ki");
    } else if (s.enemyKi >= 40) {
      // Medium Ki: Mix of Special, Attack, and Charge
      if (r < 0.4) s.performSpecial(false, false);
      else if (r < 0.7)
        s.performAttack(false, dist < 150 ? "melee" : "ki");
      else s.performCharge(false);
    } else {
      // Low Ki: Favor Charging or distancing
      if (r < 0.7) s.performCharge(false);
      else s.performAttack(false, dist < 150 ? "melee" : "ki");
    }
  }
}
