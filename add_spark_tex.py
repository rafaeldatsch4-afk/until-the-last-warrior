import re

with open('game/scenes/PreloadScene.ts', 'r') as f:
    content = f.read()

new_tex = """    graphics.generateTexture('hit_spark', 16, 16);
    
    // Directional spark
    const graphicsStreak = this.make.graphics({ x: 0, y: 0 });
    graphicsStreak.fillStyle(0xffffff, 1);
    graphicsStreak.fillRect(0, 7, 24, 2);
    graphicsStreak.generateTexture('hit_spark_streak', 24, 16);"""

content = content.replace("    graphics.generateTexture('hit_spark', 16, 16);", new_tex)

with open('game/scenes/PreloadScene.ts', 'w') as f:
    f.write(content)
print("Updated PreloadScene")
