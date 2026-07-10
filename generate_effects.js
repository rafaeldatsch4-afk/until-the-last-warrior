const fs = require('fs');
let battleScene = fs.readFileSync('game/scenes/BattleScene.ts', 'utf8');
let specialBeamStart = battleScene.indexOf('  public specialBeam(');
let specialBeamEnd = battleScene.indexOf('  // 2. MAKANKOSAPPO');

let specialBeamStr = battleScene.substring(specialBeamStart, specialBeamEnd);

// Replace `this.` with `this.scene.`
// But careful with `this.scene.isActive()`, `this.effects.createScreenFlash()`
let newSpecialBeam = specialBeamStr
  .replace(/this\./g, 'this.scene.')
  .replace(/this\.scene\.scene\.isActive/g, 'this.scene.scene.isActive') // Fix double replacements if any
  .replace(/this\.scene\.isActive/g, 'this.scene.scene.isActive')
  .replace(/this\.scene\.effects\.createScreenFlash/g, 'this.createScreenFlash')
  .replace(/this\.scene\.createScreenFlash/g, 'this.createScreenFlash');

let effectsFile = fs.readFileSync('game/battle/BattleEffects.ts', 'utf8');
effectsFile = effectsFile.replace('}', newSpecialBeam + '\n}\n');

fs.writeFileSync('game/battle/BattleEffects.ts', effectsFile);
