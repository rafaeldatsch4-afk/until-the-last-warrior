const fs = require("fs");

let bs = fs.readFileSync("game/scenes/BattleScene.ts", "utf8");

const startSpecial = bs.indexOf("  // 1. BEAM ENGINE (KAMEHAMEHA, GALICK GUN, MASENKO)");
let specialMethod = "";
if (startSpecial !== -1) {
    const endSpecial = bs.indexOf("  // 2. KAMEHAMEHA (GOKU SPECIAL)");
    specialMethod = bs.substring(startSpecial, endSpecial);
    bs = bs.substring(0, startSpecial) + bs.substring(endSpecial);
}

// Write BattleEffects.ts
let be = `import Phaser from "phaser";
import type { BattleScene } from "../scenes/BattleScene";

export class BattleEffects {
  private scene: BattleScene;

  constructor(scene: BattleScene) {
    this.scene = scene;
  }
`;

be += specialMethod.replace(/this\./g, "this.scene.") + "\n}\n";

fs.writeFileSync("game/battle/BattleEffects.ts", be);
fs.writeFileSync("game/scenes/BattleScene.ts", bs);
