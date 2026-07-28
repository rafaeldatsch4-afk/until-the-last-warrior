import re

with open('game/scenes/SettingsScene.ts', 'r') as f:
    content = f.read()

old_p1 = """    const p1Controls = this.add
      .text(
        260,
        260,
        "Move: W, A, S, D\\n\\n" +
          "Attack: E\\n" +
          "Ki Blast: C\\n" +
          "Defend/Ki: Q\\n" +
          "Special: V\\n" +
          "Transform: X","""

new_p1 = """    const p1Controls = this.add
      .text(
        260,
        260,
        "Move: W, A, S, D\\n" +
          "Dash: Double A or D\\n\\n" +
          "Attack: E\\n" +
          "Ki Blast: C\\n" +
          "Defend/Ki: Q\\n" +
          "Special: V\\n" +
          "Transform: X","""
content = content.replace(old_p1, new_p1)

old_p2 = """    const p2Controls = this.add
      .text(
        700,
        260,
        "Move: Arrows\\n\\n" +
          "Attack: I\\n" +
          "Ki Blast: L\\n" +
          "Defend/Ki: O\\n" +
          "Special: K\\n" +
          "Transform: P","""

new_p2 = """    const p2Controls = this.add
      .text(
        700,
        260,
        "Move: Arrows\\n" +
          "Dash: Double Left/Right\\n\\n" +
          "Attack: I\\n" +
          "Ki Blast: L\\n" +
          "Defend/Ki: O\\n" +
          "Special: K\\n" +
          "Transform: P","""
content = content.replace(old_p2, new_p2)

with open('game/scenes/SettingsScene.ts', 'w') as f:
    f.write(content)
print("Updated SettingsScene.ts")
