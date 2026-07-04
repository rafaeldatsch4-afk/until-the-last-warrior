const fs = require("fs");
let bs = fs.readFileSync("game/scenes/BattleScene.ts", "utf8");

// Fix the corrupted `this.scene.` -> `this.` inside BattleScene.ts first
bs = bs.replace(/this\.scene\./g, "this.");
// Wait, is there any genuine `this.scene.` in BattleScene.ts? Yes, like `this.scene.isActive()`.
// I can just replace `this\.scene\.(player|enemy|battleUI|soundManager|tweens|add|createImpactEffect|takeDamage|onSpecialComplete|setActionState|getDamageMultiplier|getHandPosition|playerTransformLevel|enemyTransformLevel|battleCamera|getAnimKey|p1SuperActive|p2SuperActive|effects)`
const propsToFix = "player|enemy|battleUI|soundManager|tweens|add|createImpactEffect|takeDamage|onSpecialComplete|setActionState|getDamageMultiplier|getHandPosition|playerTransformLevel|enemyTransformLevel|battleCamera|getAnimKey|p1SuperActive|p2SuperActive|effects";
const regex = new RegExp(`this\\.scene\\.(${propsToFix})`, "g");
bs = bs.replace(regex, "this.$1");

// Extract specialBeam
const startSpecial = bs.indexOf("  // 1. BEAM ENGINE (KAMEHAMEHA, GALICK GUN, MASENKO)");
let endSpecial = bs.indexOf("  // 2. MAKANKOSAPPO (DOUBLE HELIX REMASTER)");
let specialMethod = bs.substring(startSpecial, endSpecial);
bs = bs.substring(0, startSpecial) + bs.substring(endSpecial);

// Extract createScreenFlash
const flashStart = bs.indexOf("  createScreenFlash(color: number, duration: number, alpha: number = 0.8) {");
const flashEnd = bs.indexOf("  createImpactEffect(", flashStart);
let flashMethod = bs.substring(flashStart, flashEnd);
bs = bs.substring(0, flashStart) + bs.substring(flashEnd);

fs.writeFileSync("game/scenes/BattleScene.ts", bs);

let be = `import Phaser from "phaser";
import BattleScene from "../scenes/BattleScene";

export class BattleEffects {
  private scene: BattleScene;

  constructor(scene: BattleScene) {
    this.scene = scene;
  }
`;

be += "\n" + specialMethod.replace(/this\./g, "this.scene.") + "\n";
be += "\n" + flashMethod.replace(/this\./g, "this.scene.") + "\n";
be += "}\n";

// But inside BattleEffects.ts, we need `this.scene.scene.isActive()` instead of `this.scene.isActive()`!
be = be.replace(/this\.scene\.isActive\(\)/g, "this.scene.scene.isActive()");
// And for `this.scene.tweens.add`, `this.scene.add` it's correct.

fs.writeFileSync("game/battle/BattleEffects.ts", be);
