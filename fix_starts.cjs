const fs = require('fs');
let file = fs.readFileSync('game/scenes/BattleScene.ts', 'utf8');

file = file.replace(/const startX = isPlayer \? this\.p1StartPos\.x : this\.p2StartPos\.x;/g, "const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);");
file = file.replace(/const startY = isPlayer \? this\.p1StartPos\.y : this\.p2StartPos\.y;/g, "const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);");

file = file.replace(/const startX = isP \? this\.p1StartPos\.x : this\.p2StartPos\.x;/g, "const startX = isP ? this.player.x : this.enemy.x;");
file = file.replace(/const startY = isP \? this\.p1StartPos\.y : this\.p2StartPos\.y;/g, "const startY = isP ? this.player.y : this.enemy.y;");

file = file.replace(/const targetStartX = isP \? this\.p2StartPos\.x : this\.p1StartPos\.x;/g, "const targetStartX = isP ? this.enemy.x : this.player.x;");

fs.writeFileSync('game/scenes/BattleScene.ts', file);
console.log("Replaced start positions!");
