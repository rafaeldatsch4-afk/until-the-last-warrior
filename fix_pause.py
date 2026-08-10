import re

with open('game/battle/BattleInput.ts', 'r') as f:
    content = f.read()

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
    with open('game/battle/BattleInput.ts', 'w') as f:
        f.write(content)
    print("Fixed pause button")
else:
    print("Warning: old_pause_btn STILL not found")

