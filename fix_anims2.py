import re

with open('game/scenes/BattleScene.ts', 'r') as f:
    content = f.read()

# Replace the "delayedCall" in performWhiffMelee with animationcomplete
old_whiff = """    this.tweens.add({
      targets: attacker,
      x: attacker.x + (attacker.flipX ? -30 : 30),
      duration: 150,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => {
        if (!this.scene.isActive()) return;
        attacker.play(this.getAnimKey(attackerData.key, transLevel, "punch"));
        this.setActionState(isPlayer, false);
      },
    });"""
new_whiff = """    this.tweens.add({
      targets: attacker,
      x: attacker.x + (attacker.flipX ? -30 : 30),
      duration: 150,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => {
        if (!this.scene.isActive()) return;
        attacker.play(this.getAnimKey(attackerData.key, transLevel, "punch"));
        attacker.once('animationcomplete', () => {
            if (this.scene.isActive()) {
                attacker.play(this.getAnimKey(attackerData.key, transLevel, "idle"));
                this.setActionState(isPlayer, false);
            }
        });
      },
    });"""
content = content.replace(old_whiff, new_whiff)

with open('game/scenes/BattleScene.ts', 'w') as f:
    f.write(content)

print("Replaced whiff")
