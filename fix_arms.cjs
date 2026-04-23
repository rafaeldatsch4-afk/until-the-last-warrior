const fs = require('fs');
const content = fs.readFileSync('game/scenes/PreloadScene.ts', 'utf8');

const lines = content.split('\n');
for (let i=0; i<lines.length; i++) {
   if (lines[i].includes('case \'') || lines[i].includes('case "')) {
       console.log("---- " + lines[i].trim() + " ----");
   }
   if (lines[i].includes('if (isAttack) {')) {
       let block = "";
       for (let j=i; j<Math.min(i+12, lines.length); j++) {
           if(lines[j]) block += lines[j].trim() + "\n";
       }
       console.log(block);
   }
}
