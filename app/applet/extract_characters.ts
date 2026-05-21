import fs from 'fs';

const characters = ["obito", "itachi", "jotaro", "spiderman", "batman", "cyberninja", "minipekka", "optimus", "saitama", "static", "frieren", "chapolim", "gojo", "naruto"];

let battleScene = fs.readFileSync('game/scenes/BattleScene.ts', 'utf-8');
const registryFile = 'game/characters/FighterRegistry.ts';
let registry = fs.readFileSync(registryFile, 'utf-8');

for (const char of characters) {
  const camelName = char.charAt(0).toUpperCase() + char.slice(1);
  const regex = new RegExp(`  perform${camelName}Attack\\([\\s\\S]*?^  \\}\\n\\n`, 'm');
  const match = battleScene.match(regex);
  
  if (match) {
    const rawBody = match[0];
    
    // Extract the body inside the function
    //  performXAttack(isPlayer..., attackType...) { \n <BODY> \n }
    const firstBrace = rawBody.indexOf('{') + 1;
    const bodyStr = rawBody.substring(firstBrace, rawBody.lastIndexOf('}')).trim().replace(/\n    /g, '\n      ');
    
    // Convert 'this.' to 'bs.'
    let customBody = bodyStr.replace(/this\./g, 'bs.');
    // The extracted function uses 'attacker', 'target', 'transLevel', 'startX', 'startY'.
    // In our new class we'll inject them properly.
    
    if (!fs.existsSync(`game/characters/${char}.ts`)) {
        const fileContent = `import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class ${camelName}Fighter extends Fighter {
  readonly key = '${char}';
  readonly specialName = 'SPECIAL'; // Modify manually later if needed
  readonly superName = 'SUPER';
  readonly specialColor = 0xffffff;

  performAttack(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, attackType, isComboFinisher, transformLevel } = params;
    const bs = scene as any;
    const startX = attacker.x;
    const startY = attacker.y;
    const transLevel = transformLevel;

    ${customBody}

    return null as any;
  }

  performSpecial(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    // Proxy for now, we'll implement fully later if needed
    // You can call bs.specialName...
    return null as any;
  }

  performSuper(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, transformLevel } = params;
    const bs = scene as any;
    return null as any;
  }

  performTransform(scene: Phaser.Scene, isPlayer: boolean, level: number): void {}
}
`;
        fs.writeFileSync(`game/characters/${char}.ts`, fileContent);
        
        // Remove from BattleScene
        battleScene = battleScene.replace(match[0], '');
        
        // Update BattleScene switch case
        const caseRegex = new RegExp(`      case "${char}":\\s+bs\\.perform${camelName}Attack[\\s\\S]*?return true;`, 'm');
        // Wait, BattleScene has:
        //       case "obito":
        //         this.performObitoAttack(
        //           isPlayer,
        //           attackType,
        //           comboCount,
        //           isComboFinisher,
        //         );
        //         return true;
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

        // Update Registry
        const importStatement = `import { ${camelName}Fighter } from './${char}';\n`;
        const mapEntry = `,
  ['${char}', new ${camelName}Fighter()]`;
        registry = registry.replace(/import { CellFighter } from '\.\/cell';/, `import { CellFighter } from './cell';\n${importStatement.trim()}`);
        registry = registry.replace(/\],\n/, `${mapEntry}\n],\n`); // Error prone, wait.
        
        // Let's do it safer:
        if (!registry.includes(`${camelName}Fighter`)) {
             registry = importStatement + registry;
             registry = registry.replace(/\]\);\n$/, `  ['${char}', new ${camelName}Fighter()],\n]);\n`);
        }
    }
  } else {
    console.log("NOT FOUND: " + camelName);
  }
}

fs.writeFileSync('game/scenes/BattleScene.ts', battleScene);
fs.writeFileSync(registryFile, registry);
