import fs from 'fs';

const chars = ["obito", "itachi", "jotaro", "spiderman", "batman", "cyberninja", "minipekka", "optimus", "leonardo", "saitama", "static", "frieren", "chapolim", "gojo", "naruto"];

let bscene = fs.readFileSync('game/scenes/BattleScene.ts', 'utf-8');

for (const c of chars) {
  let capitalized = c.charAt(0).toUpperCase() + c.slice(1);
  let classDef = `import Phaser from 'phaser';
import { Fighter } from './base/Fighter';
import { AttackParams, AttackResult } from './base/FighterTypes';

export class ${capitalized}Fighter extends Fighter {
  readonly key = '${c}';
  readonly specialName = 'SPECIAL';
  readonly superName = 'SUPER';
  readonly specialColor = 0xffffff;

  performAttack(params: AttackParams): AttackResult {
    const { scene, attacker, defender: target, isPlayer, attackType, isComboFinisher, transformLevel } = params;
    const bs = scene as any;
    bs.perform${capitalized}Attack(isPlayer, attackType, 0, isComboFinisher);
    return null as any;
  }
  performSpecial(params: AttackParams): AttackResult {
    // will be implemented manually or via bs call
    return null as any;
  }
  performSuper(params: AttackParams): AttackResult {
    // will be implemented manually or via bs call
    return null as any;
  }
  performTransform(scene: Phaser.Scene, isPlayer: boolean, level: number): void {}
}
`;
  if (!fs.existsSync(`game/characters/${c}.ts`)) {
    fs.writeFileSync(`game/characters/${c}.ts`, classDef);
  }
}