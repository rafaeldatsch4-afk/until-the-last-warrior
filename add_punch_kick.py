import re

with open('game/scenes/PreloadScene.ts', 'r') as f:
    content = f.read()

old_block = """      createAnim(`${baseKey}_idle`, texKey, 0, 3, 10);
      createAnim(`${baseKey}_walk`, texKey, 4, 7, 12);
      createAnim(`${baseKey}_attack`, texKey, 8, 9, 16, 0);
      createAnim(`${baseKey}_special`, texKey, 8, 9, 12, -1);
      createAnim(`${baseKey}_defend`, texKey, 10, 10, 10, -1);
      createAnim(`${baseKey}_transform`, texKey, 0, 3, 24, -1);
      createAnim(`${baseKey}_charge`, texKey, 11, 11, 10, -1);"""

new_block = """      createAnim(`${baseKey}_idle`, texKey, 0, 3, 10);
      createAnim(`${baseKey}_walk`, texKey, 4, 7, 12);
      createAnim(`${baseKey}_attack`, texKey, 8, 9, 16, 0);
      createAnim(`${baseKey}_punch`, texKey, 8, 8, 12, 0);
      createAnim(`${baseKey}_kick`, texKey, 9, 9, 12, 0);
      createAnim(`${baseKey}_special`, texKey, 8, 9, 12, -1);
      createAnim(`${baseKey}_defend`, texKey, 10, 10, 10, -1);
      createAnim(`${baseKey}_transform`, texKey, 0, 3, 24, -1);
      createAnim(`${baseKey}_charge`, texKey, 11, 11, 10, -1);"""

content = content.replace(old_block, new_block)

with open('game/scenes/PreloadScene.ts', 'w') as f:
    f.write(content)

print("Updated PreloadScene.ts")
