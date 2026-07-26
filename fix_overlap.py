import re

with open('game/scenes/StoryHubScene.ts', 'r') as f:
    content = f.read()

# Left panel
content = content.replace("leftPanel.fillRoundedRect(50, 95, 380, 380, 12);", "leftPanel.fillRoundedRect(50, 95, 380, 360, 12);")
content = content.replace("leftPanel.strokeRoundedRect(50, 95, 380, 380, 12);", "leftPanel.strokeRoundedRect(50, 95, 380, 360, 12);")

# Right panel
content = content.replace("rightPanel.fillRoundedRect(470, 95, 440, 380, 12);", "rightPanel.fillRoundedRect(470, 95, 440, 360, 12);")
content = content.replace("rightPanel.strokeRoundedRect(470, 95, 440, 380, 12);", "rightPanel.strokeRoundedRect(470, 95, 440, 360, 12);")

# Sprite position and scale
# Wait, let's keep it at scale 2, but move it up slightly to y=250.
content = content.replace("const sprite = this.add.sprite(240, 260, previewKey).setScale(2);", "const sprite = this.add.sprite(240, 250, previewKey).setScale(2);")

# Move EXP bar up a bit to uiY = 415
content = content.replace("const uiY = 430;", "const uiY = 415;")

with open('game/scenes/StoryHubScene.ts', 'w') as f:
    f.write(content)
