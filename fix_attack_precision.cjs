const fs = require('fs');
let file = fs.readFileSync('game/scenes/BattleScene.ts', 'utf8');

file = file.replace(/x: target\.x \+ \(isPlayer \? /g, "x: target.x + (attacker.x < target.x ? ");
file = file.replace(/x: target\.x \+ \(isP \? /g, "x: target.x + (attacker.x < target.x ? ");

fs.writeFileSync('game/scenes/BattleScene.ts', file);
console.log("Made attacks more precise based on relative position!");
