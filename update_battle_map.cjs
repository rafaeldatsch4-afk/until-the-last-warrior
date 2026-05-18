const fs = require('fs');
let file = fs.readFileSync('game/scenes/BattleScene.ts', 'utf8');

file = file.replace(
    'const arenas = ["arena", "arena_namek", "arena_city", "arena_tournament"];',
    'const arenas = ["arena", "arena_namek", "arena_city", "arena_tournament", "arena_ice", "arena_lava", "arena_desert", "arena_dark"];'
);

file = file.replace('const mapWidth = 3000;', 'const mapWidth = 5000;');

file = file.replace('this.cameras.main.setBounds(0, -500, mapWidth, 1500);', 'this.cameras.main.setBounds(-500, -500, mapWidth + 1000, 1500);');

fs.writeFileSync('game/scenes/BattleScene.ts', file);
console.log("Updated arenas list and mapWidth!");
