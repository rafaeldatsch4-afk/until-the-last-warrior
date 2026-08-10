import re

with open('game/scenes/CharacterSelectScene.ts', 'r') as f:
    content = f.read()

# We will just rewrite the methods using regular expressions that capture everything between the method definitions.

new_methods = """  private infoDesc!: Phaser.GameObjects.Text;

  createTooltip() {
    const { width, height } = this.cameras.main;
    this.tooltipContainer = this.add.container(width / 2, height - 120).setDepth(100).setVisible(false);
    const bg = this.add.rectangle(0, 0, 500, 100, 0x111111, 0.95).setStrokeStyle(2, 0x3498db);
    this.tooltipName = this.add.text(-230, -35, "", {
      fontSize: "22px",
      fontStyle: "bold",
      color: "#ffd54a",
      fontFamily: "system-ui, -apple-system, sans-serif"
    });
    this.tooltipStats = this.add.text(230, -35, "", {
      fontSize: "14px",
      color: "#ffffff",
      fontStyle: "bold",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }).setOrigin(1, 0);
    this.infoDesc = this.add.text(-230, 0, "", {
      fontSize: "16px",
      color: "#cccccc",
      fontFamily: "system-ui, -apple-system, sans-serif",
      wordWrap: { width: 460 }
    });
    this.tooltipContainer.add([bg, this.tooltipName, this.tooltipStats, this.infoDesc]);
  }

  showTooltip(char: any, x: number, y: number) {
    this.tooltipContainer.setVisible(true);
    this.tooltipName.setText(char.name);
    
    const hp = char.maxHp || 200;
    const str = char.strength ?? Math.floor(hp / 2.5);
    const spd = char.speed ?? Math.floor(300 - hp);
    this.tooltipStats.setText(`HP: ${hp} | STR: ${str} | SPD: ${spd}`);
    this.infoDesc.setText(char.description || "Um formidável lutador.");
  }

  hideTooltip() {"""

# Replace createTooltip to hideTooltip (excluding hideTooltip body)
content = re.sub(r'  createTooltip\(\) \{.*?  hideTooltip\(\) \{', new_methods + " {", content, flags=re.DOTALL)

with open('game/scenes/CharacterSelectScene.ts', 'w') as f:
    f.write(content)
print("Fixed Tooltip")
