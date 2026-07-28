import re

with open('game/scenes/SettingsScene.ts', 'r') as f:
    content = f.read()

old_p1_controls = """        "Move: W, A, S, D\\n" +
          "Dash: Double A or D\\n\\n" +
          "Attack: E\\n" +
          "Ki Blast: C\\n" +
          "Defend/Ki: Q\\n" +
          "Special: V\\n" +
          "Transform: X","""

new_p1_controls = """        "Move: W, A, S, D\\n" +
          "Dash: Double A or D\\n\\n" +
          "Attack: E\\n" +
          "Ki Blast: C\\n" +
          "Defend: Q\\n" +
          "Charge Ki: R\\n" +
          "Special: V\\n" +
          "Transform: X","""
          
content = content.replace(old_p1_controls, new_p1_controls)

old_p2_controls = """        "Move: Arrows\\n" +
          "Dash: Double Left/Right\\n\\n" +
          "Attack: I\\n" +
          "Ki Blast: L\\n" +
          "Defend/Ki: O\\n" +
          "Special: K\\n" +
          "Transform: P","""

new_p2_controls = """        "Move: Arrows\\n" +
          "Dash: Double Left/Right\\n\\n" +
          "Attack: I\\n" +
          "Ki Blast: L\\n" +
          "Defend: O\\n" +
          "Charge Ki: U\\n" +
          "Special: K\\n" +
          "Transform: P","""

content = content.replace(old_p2_controls, new_p2_controls)

with open('game/scenes/SettingsScene.ts', 'w') as f:
    f.write(content)
print("Updated SettingsScene.ts controls list")
