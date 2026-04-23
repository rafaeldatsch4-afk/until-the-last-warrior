const fs = require('fs');

const path = './game/scenes/PreloadScene.ts';
let code = fs.readFileSync(path, 'utf-8');

// Update FRAMES to 8
code = code.replace('const FRAMES = 7;', 'const FRAMES = 8;');

// Update isAttack and add isCharge
if (!code.includes('const isCharge = f === 7;')) {
    code = code.replace(
        'const isAttack = f === 4 || f === 5;',
        'const isAttack = f === 4 || f === 5;\\n      const isCharge = f === 7;'
    );
}
// Actually, earlier I used \\n and it broke BattleScene, I should just use literal newline
code = code.replace(/const isAttack = f === 4 \|\| f === 5;\s+const isDefend = f === 6;/g, 
\`const isAttack = f === 4 || f === 5;
      const isDefend = f === 6;
      const isCharge = f === 7;\`
);

code = code.replace(/const breatheOffset =[^;]+;|const breatheOffset =\s+!isAttack && !isDefend && \(f === 1 \|\| f === 3\) \? 1 : 0;/g,
\`const breatheOffset = !isAttack && !isDefend && !isCharge && (f === 1 || f === 3) ? 1 : 0;\`);

code = code.replace(/const poseOffsetX = f === 4 \? 2 : f === 5 \? 4 : f === 6 \? -2 : 0;/g, 
\`const poseOffsetX = f === 4 ? 2 : f === 5 ? 4 : f === 6 ? -2 : 0;\`);

code = code.replace(/const poseOffsetY = f === 4 \? -1 : f === 5 \? -2 : f === 6 \? 2 : 0;/g,
\`const poseOffsetY = f === 4 ? -1 : f === 5 ? -2 : f === 6 ? 2 : f === 7 ? -1 : 0;\`);

// The createAnimsFor charge addition might also have failed.
// Let's manually check if "_charge" is added inside createAllForTex
if (!code.includes('createAnim(\`\${baseKey}_charge\`')) {
    code = code.replace(
        /createAnim\(\`\\\${baseKey}_transform\`, texKey, 0, 3, 24, -1\); \/\/ Fast idle/,
        \`createAnim(\\\`\\\\\${baseKey}_transform\\\`, texKey, 0, 3, 24, -1); // Fast idle
      createAnim(\\\`\\\\\${baseKey}_charge\\\`, texKey, 7, 7, 10, -1); // Charge pose\`
    );
}

fs.writeFileSync(path, code);
console.log("Frames and definitions updated.");
