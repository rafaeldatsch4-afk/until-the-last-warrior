import os
import glob
import re

for filepath in glob.glob('game/characters/*.ts'):
    with open(filepath, 'r') as f:
        content = f.read()

    # We want to find melee attacks and change "punch" to dynamic if comboCount is available
    # usually they have attacker.play(bs.getAnimKey("...", transformLevel, "punch"))
    # Let's replace "punch" with (comboCount % 2 === 0 ? "kick" : "punch")
    
    # We only want to do this in performAttack where comboCount is defined.
    # Actually, the simplest is to just search for `bs.getAnimKey("...", transformLevel, "punch")` and if it's a melee attack, replace it.
    
    # Let's just do a blanket replacement in performAttack
    # Find performAttack block
    match = re.search(r'performAttack\(params.*?return null as any;\n  \}', content, re.DOTALL)
    if match:
        attack_block = match.group(0)
        # replace "punch" with a variable animType inside performAttack
        # First, ensure animType is defined
        if 'const animType =' not in attack_block and 'comboCount' in attack_block:
            # Insert const animType right after bs = scene as any;
            new_attack_block = attack_block.replace('const bs = scene as any;', 'const bs = scene as any;\n    const animType = isComboFinisher ? "kick" : (comboCount % 2 === 0 ? "kick" : "punch");')
            
            # Replace "punch" with animType in the melee section
            # For simplicity, we can just replace "punch" with animType everywhere in performAttack
            new_attack_block = re.sub(r'"punch"', 'animType', new_attack_block)
            
            content = content.replace(attack_block, new_attack_block)

    with open(filepath, 'w') as f:
        f.write(content)

print("Fixed char anims")
