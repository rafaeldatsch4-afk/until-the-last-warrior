const fs = require('fs');
let file = fs.readFileSync('game/scenes/BattleScene.ts', 'utf8');

file = file.replace(/this\.enemy\.x - 60/g, "this.enemy.x - 40");
file = file.replace(/this\.enemy\.x \+ 60/g, "this.enemy.x + 40");
file = file.replace(/this\.player\.x \+ 60/g, "this.player.x + 40");
file = file.replace(/this\.player\.x - 60/g, "this.player.x - 40");

fs.writeFileSync('game/scenes/BattleScene.ts', file);
console.log("Updated collision box size!");
