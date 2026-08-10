import re

with open('game/scenes/BattleScene.ts', 'r') as f:
    content = f.read()

# Replace the switch statement in performAttack with a direct call to performGenericAttack
old_switch = re.search(r'switch \(attackerBaseKey\) \{.*?return false;\n    \}', content, re.DOTALL)
if old_switch:
    print("Found switch statement")
    content = content.replace(old_switch.group(0), 'this.performGenericAttack(isPlayer, attackType, comboCount, isComboFinisher);\n    return;')
    with open('game/scenes/BattleScene.ts', 'w') as f:
        f.write(content)
else:
    print("Not found")

