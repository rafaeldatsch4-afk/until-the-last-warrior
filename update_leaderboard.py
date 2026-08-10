import re

with open('game/scenes/LeaderboardScene.ts', 'r') as f:
    content = f.read()

old_sort = """    // Ordenar: Elo (Desc) -> Wins (Desc)
    this.players.sort((a, b) => {
       const eloA = a.elo || 1000;
       const eloB = b.elo || 1000;
       if (eloB !== eloA) return eloB - eloA;
       const winsA = a.wins || 0;
       const winsB = b.wins || 0;
       return winsB - winsA;
    });"""
new_sort = """    // Ordenar: Wins (Desc) -> Matches como desempate reverso (menos partidas = melhor aproveitamento)
    this.players.sort((a, b) => {
       const winsA = a.wins || 0;
       const winsB = b.wins || 0;
       if (winsB !== winsA) return winsB - winsA;
       const matchesA = a.matches || 0;
       const matchesB = b.matches || 0;
       return matchesA - matchesB;
    });"""
content = content.replace(old_sort, new_sort)

with open('game/scenes/LeaderboardScene.ts', 'w') as f:
    f.write(content)

print("Updated LeaderboardScene.ts sorting")
