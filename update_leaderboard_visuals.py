import re

with open('game/scenes/LeaderboardScene.ts', 'r') as f:
    content = f.read()

# Replace Headers
old_headers = """    this.add.text(260, 100, "JOGADOR", { fontSize: "16px", color: "#aaa", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0, 0.5);
    this.add.text(550, 100, "ELO", { fontSize: "16px", color: "#aaa", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0.5, 0.5);
    this.add.text(680, 100, "VITÓRIAS", { fontSize: "16px", color: "#aaa", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0.5, 0.5);
    this.add.text(800, 100, "PARTIDAS", { fontSize: "16px", color: "#aaa", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0.5, 0.5);"""
new_headers = """    this.add.text(260, 100, "JOGADOR", { fontSize: "16px", color: "#aaa", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0, 0.5);
    this.add.text(600, 100, "VITÓRIAS", { fontSize: "16px", color: "#aaa", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0.5, 0.5);
    this.add.text(780, 100, "PARTIDAS", { fontSize: "16px", color: "#aaa", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0.5, 0.5);"""
content = content.replace(old_headers, new_headers)

# Replace Item rendering
old_items = """        const txtElo = this.add.text(550, yPos, `${elo}`, { fontSize: "18px", color: "#9b59b6", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0.5, 0.5);
        const txtWins = this.add.text(680, yPos, `${wins}`, { fontSize: "18px", color: "#2ecc71", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0.5, 0.5);
        const txtMatches = this.add.text(800, yPos, `${matches}`, { fontSize: "18px", color: "#3498db", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0.5, 0.5);
        this.listContainer.add([bg, txtRank, txtAvatar, txtName, txtElo, txtWins, txtMatches]);"""
new_items = """        const txtWins = this.add.text(600, yPos, `🏆 ${wins}`, { fontSize: "18px", color: "#2ecc71", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0.5, 0.5);
        const txtMatches = this.add.text(780, yPos, `${matches}`, { fontSize: "18px", color: "#3498db", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0.5, 0.5);
        this.listContainer.add([bg, txtRank, txtAvatar, txtName, txtWins, txtMatches]);"""
content = content.replace(old_items, new_items)

with open('game/scenes/LeaderboardScene.ts', 'w') as f:
    f.write(content)

print("Updated LeaderboardScene.ts visuals")
