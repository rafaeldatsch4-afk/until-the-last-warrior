const fs = require('fs');

let content = fs.readFileSync('game/scenes/BattleScene.ts', 'utf-8');

// Use regex to remove methods
content = content.replace(/  performPiccoloAttack\([\s\S]*?^  \}\n\n  performLeonardoAttack\(/m, '  performLeonardoAttack(');
content = content.replace(/  \/\/ 2\. MAKANKOSAPPO \(DOUBLE HELIX REMASTER\)\n  private specialMakanko\([\s\S]*?^  \}\n\n  \/\/ 4\. KATANA SLASH \(DIMENSIONAL CUT REMASTER\)/m, '  // 4. KATANA SLASH (DIMENSIONAL CUT REMASTER)');
content = content.replace(/  private specialHellzoneGrenade\([\s\S]*?^  \}\n\n  private specialSolarKamehameha\(/m, '  private specialSolarKamehameha(');

fs.writeFileSync('game/scenes/BattleScene.ts', content);