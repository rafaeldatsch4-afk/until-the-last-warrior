import re

with open('game/scenes/CharacterSelectScene.ts', 'r') as f:
    content = f.read()

# Replace createTooltip
old_create_tooltip = """  createTooltip() {
    this.tooltipContainer = this.add.container(0, 0).setDepth(100).setVisible(false);
    const bg = this.add.rectangle(0, 0, 140, 60, 0x000000, 0.85).setStrokeStyle(1, 0xffffff);
    this.tooltipName = this.add.text(-60, -20, "", {
      fontSize: "14px",
      fontStyle: "bold",
      color: "#ffd54a",
      fontFamily: "system-ui, -apple-system, sans-serif"
    });
    this.tooltipStats = this.add.text(-60, 0, "", {
      fontSize: "12px",
      color: "#ffffff",
      fontFamily: "system-ui, -apple-system, sans-serif"
    });
    this.tooltipContainer.add([bg, this.tooltipName, this.tooltipStats]);
  }"""

new_create_tooltip = """  private infoDesc!: Phaser.GameObjects.Text;

  createTooltip() {
    const { width, height } = this.cameras.main;
    this.tooltipContainer = this.add.container(width / 2, height - 150).setDepth(100).setVisible(false);
    const bg = this.add.rectangle(0, 0, 600, 120, 0x000000, 0.85).setStrokeStyle(2, 0x3498db);
    this.tooltipName = this.add.text(-280, -45, "", {
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffd54a",
      fontFamily: "system-ui, -apple-system, sans-serif"
    });
    this.tooltipStats = this.add.text(280, -45, "", {
      fontSize: "14px",
      color: "#ffffff",
      fontStyle: "bold",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }).setOrigin(1, 0);
    this.infoDesc = this.add.text(-280, -10, "", {
      fontSize: "16px",
      color: "#cccccc",
      fontFamily: "system-ui, -apple-system, sans-serif",
      wordWrap: { width: 560 }
    });
    this.tooltipContainer.add([bg, this.tooltipName, this.tooltipStats, this.infoDesc]);
  }"""
content = content.replace(old_create_tooltip, new_create_tooltip)

# Replace showTooltip
old_show_tooltip = """  showTooltip(char: any, x: number, y: number) {
    this.tooltipContainer.setVisible(true);
    
    // Position tooltip near cursor
    let finalX = x;
    let finalY = y - 60; // offset above the pointer
    
    // Keep within screen bounds
    const { width } = this.cameras.main;
    if (finalX + 70 > width) finalX = width - 70;
    if (finalX - 70 < 0) finalX = 70;
    if (finalY - 30 < 0) finalY = y + 60; // show below if at top
    
    this.tooltipContainer.setPosition(finalX, finalY);
    this.tooltipName.setText(char.name);
    
    const hp = char.maxHp || 200;
    // Generate pseudo-random deterministic stats if not defined
    const str = char.strength ?? Math.floor(hp / 2.5);
    const spd = char.speed ?? Math.floor(300 - hp);
    this.tooltipStats.setText(`HP: ${hp} | STR: ${str}\nSPD: ${spd}`);
  }"""

new_show_tooltip = """  showTooltip(char: any, x: number, y: number) {
    this.tooltipContainer.setVisible(true);
    
    this.tooltipName.setText(char.name);
    
    const hp = char.maxHp || 200;
    // Generate pseudo-random deterministic stats if not defined
    const str = char.strength ?? Math.floor(hp / 2.5);
    const spd = char.speed ?? Math.floor(300 - hp);
    this.tooltipStats.setText(`HP: ${hp} | STR: ${str} | SPD: ${spd}`);
    this.infoDesc.setText(char.description || "Um lutador formidável.");
  }"""
content = content.replace(old_show_tooltip, new_show_tooltip)

with open('game/scenes/CharacterSelectScene.ts', 'w') as f:
    f.write(content)
print("Updated CharacterSelectScene.ts")
