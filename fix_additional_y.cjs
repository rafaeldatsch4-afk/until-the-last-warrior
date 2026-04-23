const fs = require('fs');

const path = './game/scenes/BattleScene.ts';
let code = fs.readFileSync(path, 'utf-8');

const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Piccolo reach grab
    if (line.includes('const arm = this.add.rectangle(attacker.x + (isPlayer ? 10 : -10), attacker.y - 10,')) {
        lines[i] = `                    const hand = this.getHandPosition(isPlayer);\n` +
                   `                    const arm = this.add.rectangle(hand.x, hand.y, 0, 8, 0x228b22).setOrigin(isPlayer ? 0 : 1, 0.5).setDepth(4);`;
    }

    // Cyber overdrive
    if (line.includes('const matrix = this.add.circle(attacker.x, attacker.y - 20')) {
        lines[i] = `      const hand = this.getHandPosition(isP);\n` +
                   `      const matrix = this.add.circle(hand.x, hand.y, 10, 0x00eaff).setDepth(15).setBlendMode(Phaser.BlendModes.ADD);`;
    }
    if (line.includes('const matrixCore = this.add.circle(attacker.x, attacker.y - 20')) {
        lines[i] = `      const matrixCore = this.add.circle(hand.x, hand.y, 5, 0xffffff).setDepth(16);`;
    }
    if (line.includes('x: attacker.x, y: attacker.y - 20,')) {
        lines[i] = `          x: hand.x, y: hand.y,`;
    }
    if (line.includes('const beamOuter = this.add.rectangle(attacker.x, attacker.y - 20')) {
         lines[i] = `          const beamOuter = this.add.rectangle(hand.x, hand.y, 0, 240, 0x00eaff).setOrigin(0, 0.5).setDepth(4).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);`;
    }
    if (line.includes('const beam = this.add.rectangle(attacker.x, attacker.y - 20, 0, 180, 0x00eaff)')) {
         lines[i] = `          const beam = this.add.rectangle(hand.x, hand.y, 0, 180, 0x00eaff).setOrigin(0, 0.5).setDepth(5).setAlpha(0.9).setBlendMode(Phaser.BlendModes.ADD);`;
    }
    if (line.includes('const beamCore = this.add.rectangle(attacker.x, attacker.y - 20, 0, 90')) {
         lines[i] = `          const beamCore = this.add.rectangle(hand.x, hand.y, 0, 90, 0xffffff).setOrigin(0, 0.5).setDepth(6);`;
    }
    if (line.includes('const beamHeadGlow = this.add.ellipse(attacker.x, attacker.y - 20, 140, 280')) {
         lines[i] = `          const beamHeadGlow = this.add.ellipse(hand.x, hand.y, 140, 280, 0x00eaff).setDepth(5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.8);`;
    }
    if (line.includes('const beamHead = this.add.ellipse(attacker.x, attacker.y - 20, 70, 140')) {
         lines[i] = `          const beamHead = this.add.ellipse(hand.x, hand.y, 70, 140, 0xffffff).setDepth(6);`;
    }
    if (line.includes('beamHeadGlow.setPosition(tipX, attacker.y - 20);')) {
         lines[i] = `                  beamHeadGlow.setPosition(tipX, hand.y);`;
    }
    if (line.includes('beamHead.setPosition(tipX, attacker.y - 20);')) {
         lines[i] = `                  beamHead.setPosition(tipX, hand.y);`;
    }

    // Fire Particles
    if (line.includes('const fireParticles = this.add.particles(attacker.x + (isP ? 40 : -40), attacker.y - 20')) {
         lines[i] = `          const hand = this.getHandPosition(isP);\n` +
                    `          const fireParticles = this.add.particles(hand.x, hand.y, 'particle', {`;
    }
}

fs.writeFileSync(path, lines.join('\n'));
console.log('Fixed additional remaining y offsets');
