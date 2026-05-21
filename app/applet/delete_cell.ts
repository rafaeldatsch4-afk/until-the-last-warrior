import fs from 'fs';

let content = fs.readFileSync('game/scenes/BattleScene.ts', 'utf-8');

content = content.replace(/  performCellAttack\([\s\S]*?^  \}\n\n  \/\//m, '  //');

fs.writeFileSync('game/scenes/BattleScene.ts', content);