import re

with open('game/scenes/StoryHubScene.ts', 'r') as f:
    content = f.read()

# Let's adjust the left panel elements

old_left = """    // Level Badge
    const lvlBadge = this.add.graphics();
    lvlBadge.fillStyle(0xe74c3c, 1);
    lvlBadge.fillCircle(110, 140, 25);
    lvlBadge.lineStyle(3, 0xffffff, 1);
    lvlBadge.strokeCircle(110, 140, 25);
    this.add.text(110, 128, "LVL", { fontSize: "12px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(110, 145, `${storyState.level}`, { fontSize: "22px", color: "#fff", fontStyle: "900" }).setOrigin(0.5);

    // EXP Bar
    const expNeeded = (storyState.level + 1) * 100;
    this.add.text(240, 375, "EXPERIÊNCIA", { fontSize: "14px", color: "#aaa", fontStyle: "bold" }).setOrigin(0.5);
    
    // Exp bar bg
    const barWidth = 300;
    this.add.rectangle(240, 400, barWidth, 20, 0x222222).setOrigin(0.5).setStrokeStyle(2, 0x555555);
    
    // Exp bar fill
    const expRatio = Math.min(1, storyState.exp / expNeeded);
    const expFillWidth = barWidth * expRatio;
    
    // We create a graphics for the fill so we can do a gradient
    const expFill = this.add.graphics();
    expFill.fillGradientStyle(0x2ecc71, 0x27ae60, 0x2ecc71, 0x27ae60, 1);
    expFill.fillRect(240 - barWidth/2, 390, expFillWidth, 20);
    
    this.add.text(240, 400, `${storyState.exp} / ${expNeeded}`, { fontSize: "12px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);"""

new_left = """    // Character Level & EXP Below Character
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

if old_left in content:
    content = content.replace(old_left, new_left)
    print("Replaced left panel")
else:
    print("Not found")

with open('game/scenes/StoryHubScene.ts', 'w') as f:
    f.write(content)
