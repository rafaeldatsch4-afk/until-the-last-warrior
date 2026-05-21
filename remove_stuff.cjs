const fs = require('fs');
let content = fs.readFileSync('game/scenes/BattleScene.ts', 'utf-8');
content = content.replace(/  performLeonardoAttack\([\s\S]*?^  \}\n\n/m, '');
content = content.replace(/  performCyberNinjaAttack\([\s\S]*?^  \}\n\n/m, '');
content = content.replace(/  performMiniPekkaAttack\([\s\S]*?^  \}\n\n/m, '');
fs.writeFileSync('game/scenes/BattleScene.ts', content);
