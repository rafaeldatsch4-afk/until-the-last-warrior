import re

with open('game/scenes/StoryHubScene.ts', 'r') as f:
    content = f.read()

# Left panel height
content = content.replace("leftPanel.fillRoundedRect(50, 100, 380, 350, 12);", "leftPanel.fillRoundedRect(50, 95, 380, 380, 12);")
content = content.replace("leftPanel.strokeRoundedRect(50, 100, 380, 350, 12);", "leftPanel.strokeRoundedRect(50, 95, 380, 380, 12);")

# Right panel height
content = content.replace("rightPanel.fillRoundedRect(470, 100, 440, 350, 12);", "rightPanel.fillRoundedRect(470, 95, 440, 380, 12);")
content = content.replace("rightPanel.strokeRoundedRect(470, 100, 440, 350, 12);", "rightPanel.strokeRoundedRect(470, 95, 440, 380, 12);")

# Character sprite scale and position
# Old: const sprite = this.add.sprite(240, 250, previewKey).setScale(3.5);
content = content.replace("const sprite = this.add.sprite(240, 250, previewKey).setScale(3.5);", "const sprite = this.add.sprite(240, 260, previewKey).setScale(2);")

# Name text Y position
content = content.replace("this.add.text(240, 130, char.name.toUpperCase()", "this.add.text(240, 130, char.name.toUpperCase()")

# UI Y position for EXP
content = content.replace("const uiY = 425;", "const uiY = 430;")

with open('game/scenes/StoryHubScene.ts', 'w') as f:
    f.write(content)
print("Adjusted sizes")
