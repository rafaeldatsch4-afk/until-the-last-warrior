import fs from 'fs';

let content = fs.readFileSync('game/scenes/BattleScene.ts', 'utf-8');

content = content.replace(/  private specialMajesticDestroyerFlame\([\s\S]*?^  \}\n\n  private specialTengaiShinsei\(/m, '  private specialTengaiShinsei(');

fs.writeFileSync('game/scenes/BattleScene.ts', content);