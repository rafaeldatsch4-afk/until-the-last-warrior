import re

with open('game/battle/BattleInput.ts', 'r') as f:
    content = f.read()

old_joystick = """    // --- Virtual Joystick ---
    const defaultJoyX = dpadPos.x;
    const defaultJoyY = dpadPos.y;
    let joyRootX = defaultJoyX;
    let joyRootY = defaultJoyY;

    const joyContainer = this.scene.add
      .container(joyRootX, joyRootY)
      .setScrollFactor(0)
      .setDepth(100);
    const joyBase = this.scene.add
      .circle(0, 0, 75, 0x000000, 0.4)
      .setStrokeStyle(3, 0xffffff, 0.3);
    const joyThumb = this.scene.add
      .circle(0, 0, 35, 0xffffff, 0.6)
      .setStrokeStyle(2, 0x000000, 0.5);

    joyContainer.add([joyBase, joyThumb]);
    joyContainer.setScale(dpadScale);
    joyBase.setAlpha(opacity);
    this.mobileControls.push(joyContainer);"""

new_joystick = """    // --- Virtual Joystick ---
    let defaultJoyX = dpadPos.x;
    let defaultJoyY = dpadPos.y;
    
    // Check localStorage for saved joystick position
    const savedJoy = localStorage.getItem(`hudPos_JOYSTICK`);
    if (savedJoy) {
      try {
        const parsed = JSON.parse(savedJoy);
        defaultJoyX = parsed.x;
        defaultJoyY = parsed.y;
      } catch (e) {}
    }

    let joyRootX = defaultJoyX;
    let joyRootY = defaultJoyY;

    const joyContainer = this.scene.add
      .container(joyRootX, joyRootY)
      .setScrollFactor(0)
      .setDepth(100);
    const joyBase = this.scene.add
      .circle(0, 0, 75, 0x000000, 0.4)
      .setStrokeStyle(3, 0xffffff, 0.3);
    const joyThumb = this.scene.add
      .circle(0, 0, 35, 0xffffff, 0.6)
      .setStrokeStyle(2, 0x000000, 0.5);

    joyContainer.add([joyBase, joyThumb]);
    joyContainer.setScale(dpadScale);
    joyBase.setAlpha(opacity);
    this.mobileControls.push(joyContainer);

    // Make joystick draggable in HUD edit mode
    joyContainer.setInteractive(new Phaser.Geom.Circle(0, 0, 75), Phaser.Geom.Circle.Contains);
    this.scene.input.setDraggable(joyContainer);
    
    joyContainer.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (!this.isEditingHUD) return;
      joyContainer.x = dragX;
      joyContainer.y = dragY;
    });
    
    joyContainer.on('dragend', () => {
      if (!this.isEditingHUD) return;
      defaultJoyX = joyContainer.x;
      defaultJoyY = joyContainer.y;
      localStorage.setItem(`hudPos_JOYSTICK`, JSON.stringify({ x: joyContainer.x, y: joyContainer.y }));
    });"""

if old_joystick in content:
    content = content.replace(old_joystick, new_joystick)
    with open('game/battle/BattleInput.ts', 'w') as f:
        f.write(content)
    print("Fixed joystick")
else:
    print("Warning: old_joystick not found")

