import re

with open('game/scenes/BattleScene.ts', 'r') as f:
    content = f.read()

# Replace + 80 with dynamic offset
old_update_p1 = """      if (this.p1Aura) {
        this.p1Aura.setX(this.player.x);
        this.p1Aura.setY(this.player.y + 80);"""

new_update_p1 = """      if (this.p1Aura) {
        const offsetY = this.player.displayHeight * 0.2;
        this.p1Aura.setX(this.player.x);
        this.p1Aura.setY(this.player.y + offsetY);"""

old_update_p2 = """      if (this.p2Aura) {
        this.p2Aura.setX(this.enemy.x);
        this.p2Aura.setY(this.enemy.y + 80);"""

new_update_p2 = """      if (this.p2Aura) {
        const offsetY = this.enemy.displayHeight * 0.2;
        this.p2Aura.setX(this.enemy.x);
        this.p2Aura.setY(this.enemy.y + offsetY);"""

old_shield_p1 = """      if (this.p1Shield) {
        this.p1Shield.setX(this.player.x);
        this.p1Shield.setY(this.player.y + 80);"""

new_shield_p1 = """      if (this.p1Shield) {
        const offsetY = this.player.displayHeight * 0.2;
        this.p1Shield.setX(this.player.x);
        this.p1Shield.setY(this.player.y + offsetY);"""

old_shield_p2 = """      if (this.p2Shield) {
        this.p2Shield.setX(this.enemy.x);
        this.p2Shield.setY(this.enemy.y + 80);"""

new_shield_p2 = """      if (this.p2Shield) {
        const offsetY = this.enemy.displayHeight * 0.2;
        this.p2Shield.setX(this.enemy.x);
        this.p2Shield.setY(this.enemy.y + offsetY);"""

content = content.replace(old_update_p1, new_update_p1)
content = content.replace(old_update_p2, new_update_p2)
content = content.replace(old_shield_p1, new_shield_p1)
content = content.replace(old_shield_p2, new_shield_p2)

# Also fix initializations
old_init_p1 = """    this.p1DebugCircle = this.add
      .circle(this.p1StartPos.x, this.p1StartPos.y + 80, 50, 0x3498db, 0.5)
      .setVisible(false);
    this.p1Aura = this.add
      .circle(this.p1StartPos.x, this.p1StartPos.y + 80, 51, 0x3498db, 0.5)
      .setVisible(false)
      .setDepth(0);
    this.p1Shield = this.add
      .arc(
        this.p1StartPos.x,
        this.p1StartPos.y + 80,"""

new_init_p1 = """    const p1OffsetY = this.player.displayHeight * 0.2;
    this.p1DebugCircle = this.add
      .circle(this.p1StartPos.x, this.p1StartPos.y + p1OffsetY, 50, 0x3498db, 0.5)
      .setVisible(false);
    this.p1Aura = this.add
      .circle(this.p1StartPos.x, this.p1StartPos.y + p1OffsetY, 51, 0x3498db, 0.5)
      .setVisible(false)
      .setDepth(0);
    this.p1Shield = this.add
      .arc(
        this.p1StartPos.x,
        this.p1StartPos.y + p1OffsetY,"""

old_init_p2 = """    this.p2DebugCircle = this.add
      .circle(this.p2StartPos.x, this.p2StartPos.y + 80, 50, 0xe74c3c, 0.5)
      .setVisible(false);
    this.p2Aura = this.add
      .circle(this.p2StartPos.x, this.p2StartPos.y + 80, 51, 0xe74c3c, 0.5)
      .setVisible(false)
      .setDepth(0);
    this.p2Shield = this.add
      .arc(
        this.p2StartPos.x,
        this.p2StartPos.y + 80,"""

new_init_p2 = """    const p2OffsetY = this.enemy.displayHeight * 0.2;
    this.p2DebugCircle = this.add
      .circle(this.p2StartPos.x, this.p2StartPos.y + p2OffsetY, 50, 0xe74c3c, 0.5)
      .setVisible(false);
    this.p2Aura = this.add
      .circle(this.p2StartPos.x, this.p2StartPos.y + p2OffsetY, 51, 0xe74c3c, 0.5)
      .setVisible(false)
      .setDepth(0);
    this.p2Shield = this.add
      .arc(
        this.p2StartPos.x,
        this.p2StartPos.y + p2OffsetY,"""

content = content.replace(old_init_p1, new_init_p1)
content = content.replace(old_init_p2, new_init_p2)

with open('game/scenes/BattleScene.ts', 'w') as f:
    f.write(content)
print("Updated BattleScene.ts")
