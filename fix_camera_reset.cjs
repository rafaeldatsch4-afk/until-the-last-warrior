const fs = require('fs');

let file = fs.readFileSync('game/scenes/BattleScene.ts', 'utf8');

file = file.replace(/this\.mobileControls\.forEach\(\(c\) => c\.destroy\(\)\);\n/g, 
`this.mobileControls.forEach((c) => c.destroy());\n    this.cameras.main.setZoom(1);\n    this.cameras.main.centerOn(480, 270);\n`);

fs.writeFileSync('game/scenes/BattleScene.ts', file);
console.log("Added camera reset.");
