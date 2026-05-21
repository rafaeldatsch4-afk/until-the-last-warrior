import fs from 'fs';

const characters = ['obito', 'itachi', 'jotaro', 'spiderman', 'batman', 'cyberninja', 'minipekka', 'optimus', 'saitama', 'static', 'frieren', 'chapolim', 'gojo', 'naruto'];
let battleScene = fs.readFileSync('game/scenes/BattleScene.ts', 'utf-8');
let registry = fs.readFileSync('game/characters/FighterRegistry.ts', 'utf-8');

for (const char of characters) {
  const camelName = char.charAt(0).toUpperCase() + char.slice(1);
  const regex = new RegExp(`  perform${camelName}Attack\\([\\s\\S]*?^  \\}\\n\\n`, 'm');
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
    
    // Replace bs.performXYZAttack internally if it was recursive or something (unlikely)

    const fileContent = `import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class ${camelName}Fighter extends Fighter {
  readonly key = '${char}';
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
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    // Proxy call
    return null as any;
  }

  performSuper(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    // Proxy call
    return null as any;
  }

  performTransform(scene: Phaser.Scene, isPlayer: boolean, level: number): void {}
}
`;

    fs.writeFileSync(`game/characters/${char}.ts`, fileContent);

    battleScene = battleScene.replace(match[0], '');
    const oldCaseRegex = new RegExp(`      case "${char}":\\s+this\\.perform${camelName}Attack\\([\\s\\S]*?\\);\\s+return true;`, 'm');
    const newCase = `      case "${char}": {
        const fighter = getFighter("${char}");
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
      registry = `import { ${camelName}Fighter } from './${char}';\n` + registry;
      registry = registry.replace(/\]\);/, `  ['${char}', new ${camelName}Fighter()],\n]);`);
    }
  } else {
    // some might have Thukuna spelling
    console.log('NOT FOUND: ' + camelName);
  }
}

fs.writeFileSync('game/scenes/BattleScene.ts', battleScene);
fs.writeFileSync('game/characters/FighterRegistry.ts', registry);
