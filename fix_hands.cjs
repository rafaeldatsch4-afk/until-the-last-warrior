const fs = require('fs');

const path = './game/scenes/BattleScene.ts';
let code = fs.readFileSync(path, 'utf-8');

// Replace 110 with 84 in getHandPosition
code = code.replace(/const yOffset = 110;/, 'const yOffset = 84;');

const lines = code.split('\n');
let inBasicAttack = false;

for (let i=0; i<lines.length; i++) {
    let line = lines[i];

    if (line.includes('const blast = this.add.circle(attacker.x + (isPlayer ? 40 : -40), attacker.y - 10 + (Math.random() * 20 - 10)') 
        || line.includes('const blast = this.add.ellipse(attacker.x + (isPlayer ? 40 : -40), attacker.y - 10 + (Math.random()')
        || line.includes('const fireball = this.add.circle(attacker.x + (isPlayer ? 30 : -30)')
        || line.includes('const projectile = this.add.rectangle(attacker.x + (isPlayer ? 20 : -20)')
        || line.includes('const orb = this.add.circle(attacker.x + (isPlayer ? 40 : -40)')
        || line.includes('const rasengan = this.add.circle(attacker.x + (isPlayer ? 20 : -20)')
        || line.includes('const arrow = this.add.triangle(attacker.x + (isPlayer ? 40 : -40)')
        || line.includes('const batarang = this.add.triangle(attacker.x + (isPlayer ? 20 : -20)')
        || line.includes('const shuriken = this.add.star(attacker.x + (isPlayer ? 20 : -20)')
        || line.includes('const pancake = this.add.ellipse(attacker.x + (isPlayer ? 20 : -20)')
        || line.includes('const blast = this.add.rectangle(attacker.x + (isPlayer ? 30 : -30)')
        || line.includes('const beam = this.add.rectangle(attacker.x + (isPlayer ? 20 : -20)')
        || line.includes('const beam1 = this.add.rectangle(attacker.x + (isPlayer ? 10 : -10)')
        || line.includes('const blast = this.add.circle(attacker.x + (isPlayer ? 30 : -30)')
        || line.includes('const heart = this.add.text(attacker.x + (isPlayer ? 20 : -20)')
        || line.includes('const orb = this.add.circle(attacker.x + (isPlayer ? 20 : -20)')
        || line.includes('const gatherSpark = this.add.circle(attacker.x + (isPlayer ? 40 : -40)')
        ) {
            
        let isVar = line.includes('isP ?') ? 'isP' : 'isPlayer';
        lines[i] = `                    const hand = this.getHandPosition(${isVar});\n` + lines[i].replace(/attacker\.x \+ \([^)]+\)/, 'hand.x').replace(/attacker\.y - \d+( \+ [^,]+)?/, 'hand.y');
    }

    if (line.includes('const fingerGlow = this.add.rectangle(attacker.x + (isP ? 40 : -40), attacker.y - 20')) {
        let isVar = 'isP';
        lines[i] = `      const hand = this.getHandPosition(${isVar});\n      ` + lines[i].replace(/attacker\.x \+ \([^)]+\)/, 'hand.x').replace(/attacker\.y - 20/, 'hand.y');
        lines[i+1] = lines[i+1].replace(/attacker\.x \+ \([^)]+\)/, 'hand.x').replace(/attacker\.y - 20/, 'hand.y');
        lines[i+2] = lines[i+2].replace(/attacker\.x \+ \([^)]+\)/, 'hand.x').replace(/attacker\.y - 20/, 'hand.y');
    }

    if (line.includes('const fist = this.add.circle(attacker.x + (isP ? 20 : -20), attacker.y - 20')) {
        lines[i] = `                      const hand = this.getHandPosition(isP);\n                      ` + lines[i].replace(/attacker\.x \+ \([^)]+\)/, 'hand.x').replace(/attacker\.y - 20/, 'hand.y');
    }

    if (line.includes("rasengan.x = attacker.x + (isPlayer ? 20 : -20);")) {
        lines[i] = "                    const hand = this.getHandPosition(isPlayer);\n                    rasengan.x = hand.x;";
        lines[i+1] = "                    rasengan.y = hand.y;";
    }

    if (line.includes("const beam2 = this.add.rectangle(attacker.x + (isPlayer ? 10 : -10), attacker.y - 20")) {
        lines[i] = lines[i].replace(/attacker\.x \+ \([^)]+\)/, 'hand.x').replace(/attacker\.y - 20/, 'hand.y');
    }

    if (line.includes("const originX = attacker.x + (isPlayer ? 50 : -50);") && lines[i+1].includes("const originY = attacker.y - 10;")) {
        lines[i] = "                         const hand = this.getHandPosition(isPlayer);\n                         const originX = hand.x;";
        lines[i+1] = "                         const originY = hand.y;";
    }
}

fs.writeFileSync(path, lines.join('\n'));
console.log('Fixed hand positions');
