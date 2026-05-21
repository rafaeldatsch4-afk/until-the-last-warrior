import fs from 'fs';

let characters = [
  { key: 'cyberninja', func: 'CyberNinja', className: 'Cyberninja' },
  { key: 'minipekka', func: 'MiniPekka', className: 'Minipekka' },
  { key: 'thukuna', func: 'Thukuna', className: 'Thukuna' },
];

let battleScene = fs.readFileSync('game/scenes/BattleScene.ts', 'utf-8');
let registry = fs.readFileSync('game/characters/FighterRegistry.ts', 'utf-8');

for (const char of characters) {
  const camelName = char.className;
  const funcName = char.func;
  const regex = new RegExp(`  perform${funcName}Attack\\([\\s\\S]*?^  \\}\\n\\n`, 'm');
  const match = battleScene.match(regex);
  if (match) {
    const rawBody = match[0];
    const firstBrace = rawBody.indexOf('{') + 1;
    let bodyStr = rawBody.substring(firstBrace, rawBody.lastIndexOf('}')).trim().replace(/\n    /g, '\n      ');
    bodyStr = bodyStr.replace(/this\./g, 'bs.');
    bodyStr = bodyStr.replace(/const attacker =[^;]+;/g, '');
    bodyStr = bodyStr.replace(/const target =[^;]+;/g, '');
    bodyStr = bodyStr.replace(/const startX =[^;]+;/g, '');
    bodyStr = bodyStr.replace(/const startY =[^;]+;/g, '');
    bodyStr = bodyStr.replace(/const transLevel =[^;]+;/g, '');

    const fileContent = `import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class ${camelName}Fighter extends Fighter {
  readonly key = '${char.key}';
  readonly specialName = 'SPECIAL';
  readonly superName = 'SUPER';
  readonly specialColor = 0xffffff;

  performAttack(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, attackType, isComboFinisher, transformLevel } = params;
    const bs = scene as any;
    const startX = attacker.x;
    const startY = attacker.y;
    const transLevel = transformLevel;

    ${bodyStr}

    return null as any;
  }

  performSpecial(params: AttackParams): AttackResult {
    return null as any;
  }

  performSuper(params: AttackParams): AttackResult {
    return null as any;
  }

  performTransform(scene: Phaser.Scene, isPlayer: boolean, level: number): void {}
}
`;

    fs.writeFileSync(`game/characters/${char.key}.ts`, fileContent);

    battleScene = battleScene.replace(match[0], '');
    const oldCaseRegex = new RegExp(`      case "${char.key}":\\s+this\\.perform${funcName}Attack\\([\\s\\S]*?\\);\\s+return true;`, 'm');
    const newCase = `      case "${char.key}": {
        const fighter = getFighter("${char.key}");
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
      }`;
    battleScene = battleScene.replace(oldCaseRegex, newCase);

    if (!registry.includes(`${camelName}Fighter`)) {
      registry = `import { ${camelName}Fighter } from './${char.key}';\n` + registry;
      registry = registry.replace(/\]\);/, `  ['${char.key}', new ${camelName}Fighter()],\n]);`);
    }
  } else {
    console.log('NOT FOUND: ' + camelName);
  }
}

fs.writeFileSync('game/scenes/BattleScene.ts', battleScene);
fs.writeFileSync('game/characters/FighterRegistry.ts', registry);