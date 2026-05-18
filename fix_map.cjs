const fs = require('fs');
let file = fs.readFileSync('game/scenes/BattleScene.ts', 'utf8');

file = file.replace(/const mapWidth = 2000;/g, 'const mapWidth = 3000;');
file = file.replace(/targetZoom = Phaser\.Math\.Clamp\(targetZoom, 0\.4, 1\.0\);/g, 'targetZoom = Phaser.Math.Clamp(targetZoom, 0.6, 1.0);');

fs.writeFileSync('game/scenes/BattleScene.ts', file);
console.log("Updated map bounds and zoom!");
