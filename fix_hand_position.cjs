const fs = require('fs');
let file = fs.readFileSync('game/scenes/BattleScene.ts', 'utf8');

file = file.replace(
    /private getHandPosition\(isPlayer: boolean\): \{ x: number; y: number \} \{\n\s*const sprite = isPlayer \? this\.player : this\.enemy;\n\s*\/\/ Default for all characters\n\s*const xOffset = isPlayer \? 45 : -45;/g,
    `private getHandPosition(isPlayer: boolean): { x: number; y: number } {
    const sprite = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    // Default for all characters
    const xOffset = sprite.x < target.x ? 45 : -45;`
);

fs.writeFileSync('game/scenes/BattleScene.ts', file);
console.log("Fixed getHandPosition to be rotation-aware!");
