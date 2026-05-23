const fs = require('fs');

let content = fs.readFileSync('game/scenes/BattleScene.ts', 'utf8');

// Replace attack case
content = content.replace(
  /case "obito":\s*this\.performObitoAttack\([^)]+\);\s*return true;/m,
  `case "obito": {
        const fighter = getFighter("obito");
        fighter.performAttack({
          scene: this,
          attacker: isPlayer ? this.player : this.enemy,
          defender: isPlayer ? this.enemy : this.player,
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
          transformLevel: isPlayer ? this.playerTransformLevel : this.enemyTransformLevel
        });
        return true;
      }`
);

// Replace special case
content = content.replace(
  /case "obito":\s*if \(isSuper\) this\.specialTenTailsBeastBomb\(isPlayer\);\s*else this\.specialKamui\(isPlayer\);\s*break;/m,
  `case "obito": {
              const fighter = getFighter("obito");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }`
);

// Remove the performObitoAttack, specialKamui, specialTenTailsBeastBomb methods
// We will locate them by signature and slice them out block by block.
function removeMethod(methodStart) {
    const startIdx = content.indexOf(methodStart);
    if (startIdx === -1) return;
    let endIdx = startIdx;
    let braceCount = 0;
    let foundFirstBrace = false;
    for (let i = startIdx; i < content.length; i++) {
        if (content[i] === '{') {
            braceCount++;
            foundFirstBrace = true;
        } else if (content[i] === '}') {
            braceCount--;
        }
        if (foundFirstBrace && braceCount === 0) {
            endIdx = i + 1;
            break;
        }
    }
    content = content.substring(0, startIdx) + content.substring(endIdx);
}

removeMethod('performObitoAttack(\n    isPlayer: boolean,');
removeMethod('private specialKamui(isP: boolean) {');
removeMethod('private specialTenTailsBeastBomb(isP: boolean) {');

fs.writeFileSync('game/scenes/BattleScene.ts', content);
console.log('BattleScene.ts updated successfully.');
