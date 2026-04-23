const fs = require('fs');
const lines = fs.readFileSync('./game/scenes/BattleScene.ts', 'utf-8').split('\n');
lines.forEach((line, i) => {
    if (line.match(/attacker\.y - (?!120|150|60|100|40|60|25)\d{1,2}/) && !line.includes('eyeBleed') && !line.includes('hand =') && !line.includes('getHandPosition')) {
        console.log(`Line ${i+1}: ${line.trim()}`);
    }
});
