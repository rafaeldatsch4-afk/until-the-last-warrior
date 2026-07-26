import re

with open('game/scenes/StoryHubScene.ts', 'r') as f:
    content = f.read()

old_code = """    // Level Badge (Left of the EXP bar)
    const lvlBadge = this.add.graphics();
    lvlBadge.fillStyle(0xe74c3c, 1);
    lvlBadge.fillCircle(110, uiY, 22);
    lvlBadge.lineStyle(2, 0xffffff, 1);
    lvlBadge.strokeCircle(110, uiY, 22);
    this.add.text(110, uiY - 12, "LVL", { fontSize: "10px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(110, uiY + 4, `${storyState.level}`, { fontSize: "18px", color: "#fff", fontStyle: "900" }).setOrigin(0.5);

    // Exp bar bg
    const barWidth = 260;
    const barX = 270;
    this.add.rectangle(barX, uiY, barWidth, 24, 0x222222).setOrigin(0.5).setStrokeStyle(2, 0x555555);
    
    // Exp bar fill
    const expRatio = Math.min(1, storyState.exp / expNeeded);
    const expFillWidth = barWidth * expRatio;
    
    const expFill = this.add.graphics();
    expFill.fillGradientStyle(0x2ecc71, 0x27ae60, 0x2ecc71, 0x27ae60, 1);
    expFill.fillRect(barX - barWidth/2, uiY - 12, expFillWidth, 24);
    
    // EXP Text (Centered on the bar)
    this.add.text(barX, uiY, `EXP: ${storyState.exp} / ${expNeeded}`, { 
        fontSize: "14px", 
        color: "#fff", 
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 3 
    }).setOrigin(0.5);"""

new_code = """    // Exp bar bg
    const barWidth = 260;
    const barX = 240; // Centered exactly under character
    
    // Level Badge (Centered above the EXP bar)
    const badgeY = uiY - 28;
    const lvlBadge = this.add.graphics();
    lvlBadge.fillStyle(0x3498db, 1); // Blue to match the theme instead of red
    lvlBadge.fillCircle(barX, badgeY, 18);
    lvlBadge.lineStyle(2, 0xffffff, 1);
    lvlBadge.strokeCircle(barX, badgeY, 18);
    this.add.text(barX, badgeY - 8, "LVL", { fontSize: "10px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(barX, badgeY + 6, `${storyState.level}`, { fontSize: "16px", color: "#fff", fontStyle: "900" }).setOrigin(0.5);

    this.add.rectangle(barX, uiY, barWidth, 20, 0x222222).setOrigin(0.5).setStrokeStyle(2, 0x555555);
    
    // Exp bar fill
    const expRatio = Math.min(1, storyState.exp / expNeeded);
    const expFillWidth = barWidth * expRatio;
    
    const expFill = this.add.graphics();
    expFill.fillGradientStyle(0x2ecc71, 0x27ae60, 0x2ecc71, 0x27ae60, 1);
    expFill.fillRect(barX - barWidth/2, uiY - 10, expFillWidth, 20);
    
    // EXP Text (Centered on the bar)
    this.add.text(barX, uiY, `EXP: ${storyState.exp} / ${expNeeded}`, { 
        fontSize: "12px", 
        color: "#fff", 
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 3 
    }).setOrigin(0.5);"""

if old_code in content:
    content = content.replace(old_code, new_code)
    print("Replaced UI")
else:
    print("Not found")

with open('game/scenes/StoryHubScene.ts', 'w') as f:
    f.write(content)
