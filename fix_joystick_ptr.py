import re

with open('game/battle/BattleInput.ts', 'r') as f:
    content = f.read()

old_joystick_ptr = """    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      if (currentlyOver && currentlyOver.length > 0) return; // Prevent triggering if clicking a button"""

new_joystick_ptr = """    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      if (this.isEditingHUD) return;
      if (currentlyOver && currentlyOver.length > 0) return; // Prevent triggering if clicking a button"""

if old_joystick_ptr in content:
    content = content.replace(old_joystick_ptr, new_joystick_ptr)
    with open('game/battle/BattleInput.ts', 'w') as f:
        f.write(content)
    print("Fixed joystick pointer down")
else:
    print("Warning: old_joystick_ptr not found")
