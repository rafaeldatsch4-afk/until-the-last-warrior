with open('game/scenes/StoryHubScene.ts', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'this.add.text(240, 250, "IMAGEM' in line:
        lines[i] = '          this.add.text(240, 250, "IMAGEM\\nINDISPONÍVEL", { color: "#fff" }).setOrigin(0.5);\n'
        lines[i+1] = '' # Clear the next line

with open('game/scenes/StoryHubScene.ts', 'w') as f:
    f.writelines(lines)

