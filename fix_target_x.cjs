const fs = require('fs');
let file = fs.readFileSync('game/scenes/BattleScene.ts', 'utf8');

file = file.replace(/target.x \+= isPlayer \? 5 : -5;/g, "target.x += attacker.x < target.x ? 5 : -5;");

fs.writeFileSync('game/scenes/BattleScene.ts', file);
console.log("Fixed more precision!");
