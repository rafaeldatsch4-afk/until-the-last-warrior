import re

with open('game/scenes/StoryHubScene.ts', 'r') as f:
    content = f.read()

old_code = """    // Character Level & EXP Below Character
    const expNeeded = (storyState.level + 1) * 100;
    
    // Level Badge (Centered above EXP bar)
    const lvlBadge = this.add.graphics();
    lvlBadge.fillStyle(0xe74c3c, 1);
    lvlBadge.fillCircle(240, 370, 18);
    lvlBadge.lineStyle(2, 0xffffff, 1);
    lvlBadge.strokeCircle(240, 370, 18);
    this.add.text(240, 370, `${storyState.level}`, { fontSize: "16px", color: "#fff", fontStyle: "900" }).setOrigin(0.5);

    // EXP Text
    this.add.text(240, 400, `EXP: ${storyState.exp} / ${expNeeded}`, { fontSize: "14px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    
    // Exp bar bg
    const barWidth = 280;
    this.add.rectangle(240, 420, barWidth, 16, 0x222222).setOrigin(0.5).setStrokeStyle(2, 0x555555);
    
    // Exp bar fill
    const expRatio = Math.min(1, storyState.exp / expNeeded);
    const expFillWidth = barWidth * expRatio;
    
    const expFill = this.add.graphics();
    expFill.fillGradientStyle(0x2ecc71, 0x27ae60, 0x2ecc71, 0x27ae60, 1);
    expFill.fillRect(240 - barWidth/2, 412, expFillWidth, 16);"""

new_code = """    // Character Level & EXP Below Character (Just below feet)
    const expNeeded = (storyState.level + 1) * 100;
    
    const uiY = 360; // Just below the character's feet

    // Level Badge (Left of the EXP bar)
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

if old_code in content:
    content = content.replace(old_code, new_code)
    print("Replaced exp bar block")
else:
    print("Not found")

with open('game/scenes/StoryHubScene.ts', 'w') as f:
    f.write(content)
