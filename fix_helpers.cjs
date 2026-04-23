const fs = require('fs');
const path = './game/scenes/PreloadScene.ts';
let code = fs.readFileSync(path, 'utf-8');

code = code.replace(/\(isAttack \|\| isDefend \? x/g, '(isAttack || isDefend || isCharge ? x');
code = code.replace(/isAttack \|\| isDefend \? finalY/g, 'isAttack || isDefend || isCharge ? finalY');

fs.writeFileSync(path, code);
console.log('Helpers fixed');
