import re

with open('game/battle/BattleInput.ts', 'r') as f:
    content = f.read()

# Add isEditingHUD property
if 'isEditingHUD = false;' not in content:
    content = content.replace('  mobileP1SpecialJustUp = false;', '  mobileP1SpecialJustUp = false;\n  isEditingHUD = false;\n  editHudTextObj: Phaser.GameObjects.Text | null = null;')

# Update createBtn signature and logic
old_create_btn = """    const createBtn = (
      x: number,
      y: number,
      text: string,
      color: number,
      radius: number,
      onDown: () => void,
      onUp?: () => void,
    ) => {"""

new_create_btn = """    const createBtn = (
      defaultX: number,
      defaultY: number,
      text: string,
      color: number,
      radius: number,
      onDown: () => void,
      onUp?: () => void,
    ) => {
      // Check localStorage for saved position
      const saved = localStorage.getItem(`hudPos_${text}`);
      let x = defaultX;
      let y = defaultY;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          x = parsed.x;
          y = parsed.y;
        } catch (e) {}
      }"""

if old_create_btn in content:
    content = content.replace(old_create_btn, new_create_btn)
else:
    print("Warning: old_create_btn not found")

# Add drag logic to buttons
old_btn_interact = """      const hitArea = new Phaser.Geom.Circle(0, 0, radius * 1.5);
      btnGroup.setInteractive(hitArea, Phaser.Geom.Circle.Contains);

      btnGroup.on("pointerdown", () => {
        press();
      });"""

new_btn_interact = """      const hitArea = new Phaser.Geom.Circle(0, 0, radius * 1.5);
      btnGroup.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
      this.scene.input.setDraggable(btnGroup);

      btnGroup.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        if (!this.isEditingHUD) return;
        btnGroup.x = dragX;
        btnGroup.y = dragY;
      });
      
      btnGroup.on('dragend', () => {
        if (!this.isEditingHUD) return;
        localStorage.setItem(`hudPos_${text}`, JSON.stringify({ x: btnGroup.x, y: btnGroup.y }));
      });

      btnGroup.on("pointerdown", () => {
        if (this.isEditingHUD) return;
        press();
      });"""

if old_btn_interact in content:
    content = content.replace(old_btn_interact, new_btn_interact)
else:
    print("Warning: old_btn_interact not found")

# Add Edit HUD button
old_pause_btn = """    // Pause Button (Top Center)
    const pauseBtn = this.scene.add
      .circle(480, 40, 30, 0x333333, 0.6)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(100);

    const pauseTxt = this.scene.add
      .text(480, 40, "||", { fontSize: "24px", fontStyle: "bold" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);

    this.mobileControls.push(pauseBtn, pauseTxt);"""

new_pause_btn = """    // Pause Button (Top Center)
    const pauseBtn = this.scene.add
      .circle(480, 40, 30, 0x333333, 0.6)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(100);

    const pauseTxt = this.scene.add
      .text(480, 40, "||", { fontSize: "24px", fontStyle: "bold" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);

    // Edit HUD Button
    const editBtn = this.scene.add
      .circle(550, 40, 30, 0x4a69bd, 0.6)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(100);
      
    const editTxt = this.scene.add
      .text(550, 40, "HUD", { fontSize: "16px", fontStyle: "bold", color: "#fff" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);
      
    this.editHudTextObj = this.scene.add.text(this.scene.cameras.main.width / 2, 100, "HUD EDIT MODE\\nDrag buttons to move\\nClick HUD button to save", {
        fontSize: "24px",
        color: "#fffc00",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 4,
        align: "center"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(105).setVisible(false);

    editBtn.on("pointerdown", () => {
      this.isEditingHUD = !this.isEditingHUD;
      editBtn.setAlpha(this.isEditingHUD ? 1 : 0.6);
      if (this.editHudTextObj) this.editHudTextObj.setVisible(this.isEditingHUD);
    });

    this.mobileControls.push(pauseBtn, pauseTxt, editBtn, editTxt, this.editHudTextObj);"""

if old_pause_btn in content:
    content = content.replace(old_pause_btn, new_pause_btn)
else:
    print("Warning: old_pause_btn not found")

with open('game/battle/BattleInput.ts', 'w') as f:
    f.write(content)
print("Updated BattleInput")
