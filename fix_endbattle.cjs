const fs = require('fs');

let file = fs.readFileSync('game/scenes/BattleScene.ts', 'utf8');

file = file.replace(/const bg = this\.add\.rectangle\(480, 270, 2000, 1500, 0x000000, 0\.8\)\.setDepth\(20\);\n\s*if \(this\.uiContainer\) this\.uiContainer\.add\(bg\);/g, 
`const bg = this.add.rectangle(480, 270, 20000, 20000, 0x000000, 0.8).setDepth(20).setScrollFactor(0);`);

file = file.replace(/\.setDepth\(21\);\n\s*if \(this\.uiContainer\) this\.uiContainer\.add\(titleText\);/g, 
`.setDepth(21).setScrollFactor(0);`);

file = file.replace(/\.setScale\(0\.5\);\n\s*if \(this\.uiContainer\) this\.uiContainer\.add\(subText\);/g, 
`.setScale(0.5).setScrollFactor(0);`);

file = file.replace(/\.setAlpha\(0\);\n\s*if \(this\.uiContainer\) this\.uiContainer\.add\(coinText\);/g, 
`.setAlpha(0).setScrollFactor(0);`);

file = file.replace(/\.setAlpha\(0\);\n\s*if \(this\.uiContainer\) this\.uiContainer\.add\(btn\);/g, 
`.setAlpha(0).setScrollFactor(0);`);

fs.writeFileSync('game/scenes/BattleScene.ts', file);
console.log("Replaced uiContainer additions with setScrollFactor(0).");
