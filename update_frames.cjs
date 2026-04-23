const fs = require('fs');
const path = './game/scenes/PreloadScene.ts';
let code = fs.readFileSync(path, 'utf-8');

// Update FRAMES to 8
code = code.replace('const FRAMES = 7;', 'const FRAMES = 8;');

// Update isAttack, isDefend, isCharge
code = code.replace(
    'const isAttack = f === 4 || f === 5;',
    'const isAttack = f === 4 || f === 5;\n      const isCharge = f === 7;'
);

// Update anim poses
code = code.replace(
    'const poseOffsetX = f === 4 ? 2 : f === 5 ? 4 : f === 6 ? -2 : 0;',
    'const poseOffsetX = f === 4 ? 2 : f === 5 ? 4 : f === 6 ? -2 : 0;'
); // poseOffsetX can stay same for 7
code = code.replace(
    'const poseOffsetY = f === 4 ? -1 : f === 5 ? -2 : f === 6 ? 2 : 0;',
    'const poseOffsetY = f === 4 ? -1 : f === 5 ? -2 : f === 6 ? 2 : f === 7 ? -1 : 0;'
); // poseOffsetY for charge = -1

// Add generation for frame 7 (Charge) animation
const animsCode = `
    const isUI = c.key.includes("_ui");
    const k = c.key;`;
    
const replacementAnims = `
    const isUI = c.key.includes("_ui");
    const k = c.key;
    
    if (!this.anims.exists(k + "_charge")) {
      this.anims.create({
        key: k + "_charge",
        frames: [{ key: k, frame: 7 }],
        frameRate: 10,
        repeat: -1,
      });
    }
`;
code = code.replace(animsCode, replacementAnims);

fs.writeFileSync(path, code);
console.log('Frames updated successfully.');
