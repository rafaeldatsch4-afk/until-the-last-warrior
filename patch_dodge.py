import re

with open('game/scenes/BattleScene.ts', 'r') as f:
    content = f.read()

# 1. Add DashingUntil flags
old_flags = """  public p1InvulnerableUntil: number = 0;
  public p2InvulnerableUntil: number = 0;"""
new_flags = """  public p1InvulnerableUntil: number = 0;
  public p2InvulnerableUntil: number = 0;
  public p1DashingUntil: number = 0;
  public p2DashingUntil: number = 0;"""
content = content.replace(old_flags, new_flags)

# 2. Add triggerSuccessfulDodge method
dodge_method = """  triggerSuccessfulDodge(isPlayer: boolean) {
    const target = isPlayer ? this.player : this.enemy;
    
    // Floating text
    this.createFloatingDamage(target.x, target.y + 20, 0, false, true);
    const floatText = this.add.text(target.x, target.y - 40, "ESQUIVA!", { 
      fontSize: "36px", color: "#ffffff", fontStyle: "900", stroke: "#2ecc71", strokeThickness: 6 
    }).setOrigin(0.5);
    this.tweens.add({ targets: floatText, y: target.y - 80, alpha: 0, duration: 1000, onComplete: () => floatText.destroy() });
    
    // Smoke effect
    for(let i=0; i<5; i++) {
        const smoke = this.add.circle(target.x + Phaser.Math.Between(-30, 30), target.y + Phaser.Math.Between(-20, 60), Phaser.Math.Between(15, 30), 0xdddddd, 0.8);
        this.tweens.add({
            targets: smoke,
            y: smoke.y - Phaser.Math.Between(40, 80),
            scale: 2,
            alpha: 0,
            duration: Phaser.Math.Between(400, 700),
            onComplete: () => smoke.destroy()
        });
    }

    // Afterimage flash
    const ghost = this.add.sprite(target.x, target.y, target.texture.key, target.frame.name)
      .setFlipX(target.flipX)
      .setTintFill(0x2ecc71)
      .setAlpha(0.8)
      .setDepth(target.depth - 1);
    this.tweens.add({
      targets: ghost,
      alpha: 0,
      scale: 1.5,
      duration: 400,
      onComplete: () => ghost.destroy(),
    });

    if (this.soundManager) this.soundManager.playStep();
    triggerVibration("light");
  }

  takeDamage"""

content = content.replace("  takeDamage", dodge_method)

# 3. Add to takeDamage
old_takeDamage = """  takeDamage(isP: boolean, baseDmg: number, fromNetwork = false) {
    if (this.isBattleOver || !this.scene.isActive()) return;
    if (this.time.now < (isP ? this.p1InvulnerableUntil : this.p2InvulnerableUntil)) return; // Wake-up I-frames"""

new_takeDamage = """  takeDamage(isP: boolean, baseDmg: number, fromNetwork = false) {
    if (this.isBattleOver || !this.scene.isActive()) return;
    
    // Check for successful dodge (dashing i-frames)
    if (this.time.now < (isP ? this.p1DashingUntil : this.p2DashingUntil)) {
      this.triggerSuccessfulDodge(isP);
      return;
    }

    if (this.time.now < (isP ? this.p1InvulnerableUntil : this.p2InvulnerableUntil)) return; // Wake-up I-frames"""
content = content.replace(old_takeDamage, new_takeDamage)

# 4. Set DashingUntil in performDash
old_performDash = """    this.setActionState(isPlayer, true);
    if (isPlayer) this.p1DashCooldown = true;
    else this.p2DashCooldown = true;"""

new_performDash = """    this.setActionState(isPlayer, true);
    if (isPlayer) {
      this.p1DashCooldown = true;
      this.p1DashingUntil = this.time.now + 400;
    } else {
      this.p2DashCooldown = true;
      this.p2DashingUntil = this.time.now + 400;
    }"""
content = content.replace(old_performDash, new_performDash)

with open('game/scenes/BattleScene.ts', 'w') as f:
    f.write(content)
print("Updated BattleScene.ts")
