import re

with open('game/scenes/BattleScene.ts', 'r') as f:
    content = f.read()

old_block = """          // Lunge Forward
          attacker.play(
            this.getAnimKey(attackerData.key, transLevel, "attack"),
          );"""
new_block = """          // Lunge Forward
          const animType = isComboFinisher ? "attack" : (comboCount % 2 === 0 ? "kick" : "punch");
          attacker.play(
            this.getAnimKey(attackerData.key, transLevel, animType),
          );"""

content = content.replace(old_block, new_block)

old_whiff = """    this.setActionState(isPlayer, true);
    attacker.play(this.getAnimKey(attackerData.key, transLevel, "attack"));"""
new_whiff = """    this.setActionState(isPlayer, true);
    attacker.play(this.getAnimKey(attackerData.key, transLevel, "punch"));"""

content = content.replace(old_whiff, new_whiff)

with open('game/scenes/BattleScene.ts', 'w') as f:
    f.write(content)

print("Updated anims in BattleScene.ts")
