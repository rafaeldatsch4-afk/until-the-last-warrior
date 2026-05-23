const fs = require('fs');
let content = fs.readFileSync('game/scenes/BattleScene.ts', 'utf8');

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

const special = extractAndRemoveMethod('private specialBatarang(isP: boolean) {');
const superAtt = extractAndRemoveMethod('private specialTheDarkKnight(isP: boolean) {');

fs.writeFileSync('batman_methods_2.txt', [special, superAtt].join('\\n\\n=====\\n\\n'));
fs.writeFileSync('game/scenes/BattleScene.ts', content);
console.log('BattleScene.ts updated successfully.');
