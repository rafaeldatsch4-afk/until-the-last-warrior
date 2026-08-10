import re

with open('game/scenes/ModeSelectScene.ts', 'r') as f:
    content = f.read()

# Replace PARTIDA RÁPIDA and RANQUEADA
old_block_1 = """      {
        text: "⚡ PARTIDA RÁPIDA",
        mode: "online_pvp",
        color: 0x27ae60,
        desc: "Jogue online por diversão",
      },"""
old_block_2 = """      {
        text: "🏆 RANQUEADA",
        mode: "ranked_pvp",
        color: 0xd35400,
        desc: "Suba nas ligas lutando a sério",
      },"""
content = content.replace(old_block_1, "")
content = content.replace(old_block_2, "")

with open('game/scenes/ModeSelectScene.ts', 'w') as f:
    f.write(content)

print("Updated ModeSelectScene.ts")
