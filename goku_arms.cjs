const fs = require('fs');

const path = './game/scenes/PreloadScene.ts';
let code = fs.readFileSync(path, 'utf-8');

const armsReplacement = `          // Arms (Wristbands)
          if (isCharge) {
              // Genki Dama charge: both arms raised straight up
              // Right arm
              box(18, 4, 3, 10, SKIN_TONE); 
              box(18, 14, 3, 3, GI_ORANGE); // shoulder
              box(18, 4, 3, 3, GI_BLUE); // wristband
              box(18, 2, 3, 3, SKIN_TONE); // fist
              // Left arm
              box(11, 4, 3, 10, SKIN_TONE); 
              box(11, 14, 3, 3, GI_ORANGE); // shoulder
              box(11, 4, 3, 3, GI_BLUE); // wristband
              box(11, 2, 3, 3, SKIN_TONE); // fist
          } else if (isAttack) {
            // Right arm punch straight out (muscular)`;

// Find the line starting with "\/\/ Arms (Wristbands)" for Goku
if (code.includes('// Arms (Wristbands)')) {
    code = code.replace(
        '          // Arms (Wristbands)\n          if (isAttack) {\n            // Right arm punch straight out (muscular)',
        armsReplacement
    );
    fs.writeFileSync(path, code);
    console.log('Goku charge arms generated.');
}
