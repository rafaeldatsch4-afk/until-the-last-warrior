const fs = require('fs');
let file = fs.readFileSync('game/scenes/BattleScene.ts', 'utf8');

// Insert performWhiffMelee function
const whiffFunc = `
  performWhiffMelee(isPlayer: boolean) {
    const attacker = isPlayer ? this.player : this.enemy;
    const attackerData = isPlayer ? this.playerData : this.enemyData;
    const transLevel = isPlayer ? this.playerTransformLevel : this.enemyTransformLevel;
    
    this.setActionState(isPlayer, true);
    attacker.play(this.getAnimKey(attackerData.key, transLevel, "attack"));

    this.tweens.add({
      targets: attacker,
      x: attacker.x + (attacker.flipX ? -30 : 30),
      duration: 150,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => {
        if (!this.scene.isActive()) return;
        attacker.play(this.getAnimKey(attackerData.key, transLevel, "idle"));
        this.setActionState(isPlayer, false);
      }
    });
  }
`;

if (!file.includes('performWhiffMelee(')) {
    file = file.replace('performAttack(isPlayer: boolean, attackType: "melee" | "ki") {', whiffFunc + '\n  performAttack(isPlayer: boolean, attackType: "melee" | "ki") {');
}

// Modify performAttack
const checkLogic = `
    const dist = Math.abs(attacker.x - target.x);
    const yDist = Math.abs((attacker.y || 0) - (target.y || 0));
    if (attackType === "melee" && (dist > 250 || yDist > 100)) {
        this.performWhiffMelee(isPlayer);
        return;
    }
`;

if (!file.includes('const yDist = Math.abs((attacker.y || 0) -')) {
    file = file.replace('this.setActionState(isPlayer, true);', checkLogic + '\n    this.setActionState(isPlayer, true);');
}

fs.writeFileSync('game/scenes/BattleScene.ts', file);
console.log("Added whiff logic!");
