const fs = require('fs');
let file = fs.readFileSync('game/scenes/PreloadScene.ts', 'utf8');

// Update createAllForTex to use 12 frames
let repl = `    const createAllForTex = (baseKey: string, texKey: string) => {
      createAnim(\`\${baseKey}_idle\`, texKey, 0, 3, 10);
      createAnim(\`\${baseKey}_walk\`, texKey, 4, 7, 12);
      createAnim(\`\${baseKey}_attack\`, texKey, 8, 9, 16, 0);
      createAnim(\`\${baseKey}_special\`, texKey, 8, 9, 12, -1);
      createAnim(\`\${baseKey}_defend\`, texKey, 10, 10, 10, -1);
      createAnim(\`\${baseKey}_transform\`, texKey, 0, 3, 24, -1);
    };`;
file = file.replace(/const createAllForTex = \(baseKey: string, texKey: string\) => \{[\s\S]*?createAnim\(`\$\{baseKey\}_transform`[^\n]*\n\s*\};/, repl);

// Update generateLSWSprite FRAMES
file = file.replace(/const FRAMES = 8;/g, "const FRAMES = 12;");

// Update loop conditions inside generateLSWSprite
file = file.replace(/const isAttack = f === 4 \|\| f === 5;/g, 
`const isWalk = f >= 4 && f <= 7;
      const isAttack = f === 8 || f === 9;`);
file = file.replace(/const isDefend = f === 6;/g, "const isDefend = f === 10;");
file = file.replace(/const isCharge = f === 7;/g, "const isCharge = f === 11;");

file = file.replace(/const breatheOffset =[\s\S]*?\? 1 : 0;/g, 
`const breatheOffset = (!isAttack && !isDefend && !isCharge && !isWalk && (f === 1 || f === 3)) ? 1 : 0;`);

file = file.replace(/const poseOffsetX = f === 4 \? 2 : f === 5 \? 4 : f === 6 \? -2 : 0;/g,
`const poseOffsetX = f === 8 ? 2 : f === 9 ? 4 : f === 10 ? -2 : 0;`);

file = file.replace(/const poseOffsetY = f === 4 \? -1 : f === 5 \? -2 : f === 6 \? 2 : f === 7 \? -1 : 0;/g,
`const poseOffsetY = f === 8 ? -1 : f === 9 ? -2 : f === 10 ? 2 : f === 11 ? -1 : (isWalk && (f===5 || f===7)) ? -1 : 0;`);

// Insert walking leg displacement function right after poseOffsetY
const legDisplacement = `
      const getWalkOffsets = (x: number, y: number) => {
        if (!isWalk || y < 22) return { ox: 0, oy: 0 };
        const isLeftLeg = x < 15;
        const wIndex = f - 4;
        let ox = 0, oy = 0;
        if (isLeftLeg) {
           if (wIndex === 0) { ox = 1; oy = -1; }
           else if (wIndex === 1) { ox = 3; oy = -2; }
           else if (wIndex === 2) { ox = 0; oy = 0; }
           else if (wIndex === 3) { ox = -2; oy = 0; }
        } else {
           if (wIndex === 0) { ox = -2; oy = 0; }
           else if (wIndex === 1) { ox = -4; oy = 0; }
           else if (wIndex === 2) { ox = -1; oy = -1; }
           else if (wIndex === 3) { ox = 2; oy = -2; }
        }
        return { ox, oy };
      };
`;

if (!file.includes('getWalkOffsets(')) {
    file = file.replace('const dot = (x: number, y: number, color: number) => {', legDisplacement + '\n      const dot = (x: number, y: number, color: number) => {');
}

// Update dot, box, alphaBox x and y coordinates
file = file.replace(/const finalX =[\s\S]*?\+ shiftX;/g, 
`const { ox, oy } = typeof getWalkOffsets === 'function' ? getWalkOffsets(x, y) : { ox:0, oy:0 };
        const finalX = (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX + ox;`);

// Y for finalYPose
file = file.replace(/const finalYPose =[\s\S]*?\+ poseOffsetY \/ 2 : finalY;\s*canvas\.fillStyle/g, 
`const finalYPose = (isAttack || isDefend || isCharge ? finalY + poseOffsetY / 2 : finalY) + (typeof oy !== 'undefined' ? oy : 0);
        canvas.fillStyle`);

fs.writeFileSync('game/scenes/PreloadScene.ts', file);
console.log("Updated PreloadScene animations!");
