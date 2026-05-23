const fs = require('fs');

let content = fs.readFileSync('game/scenes/BattleScene.ts', 'utf8');

// Replace attack case
content = content.replace(
  /case "cyberninja":\s*this\.performCyberNinjaAttack\([^)]+\);\s*return true;/m,
  `case "cyberninja": {
        const fighter = getFighter("cyberninja");
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
  /case "cyberninja":\s*if \(isSuper\) this\.specialCyberOverdrive\(isPlayer\);\s*else this\.specialPlasmaDash\(isPlayer\, false\);\s*break;/m,
  `case "cyberninja": {
              const fighter = getFighter("cyberninja");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }`
);

function extractAndRemoveMethod(methodStart) {
    const startIdx = content.indexOf(methodStart);
    if (startIdx === -1) return null;
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
    const methodContent = content.substring(startIdx, endIdx);
    content = content.substring(0, startIdx) + content.substring(endIdx);
    return methodContent;
}

const perform = extractAndRemoveMethod('performCyberNinjaAttack(\n    isPlayer: boolean,');
// In this case we need to know the signature of specialPlasmaDash
const special = extractAndRemoveMethod('private specialPlasmaDash(isP: boolean, isS: boolean) {');
const superAtt = extractAndRemoveMethod('private specialCyberOverdrive(isP: boolean) {');

fs.writeFileSync('cyberninja_methods.txt', [perform, special, superAtt].join('\\n\\n=====\\n\\n'));
fs.writeFileSync('game/scenes/BattleScene.ts', content);
console.log('BattleScene.ts updated successfully.');
