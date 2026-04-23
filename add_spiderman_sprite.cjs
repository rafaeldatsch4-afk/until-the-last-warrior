const fs = require('fs');

const path = './game/scenes/PreloadScene.ts';
let code = fs.readFileSync(path, 'utf-8');

const spiderManCode = `
        case "spiderman": {
          const isTransformed = form > 0;
          
          // Spiderman Palette (Classic Red & Blue / Black Suit for transformed)
          const BASE_RED = isTransformed ? 0x1a1a1a : 0xd32f2f;
          const SHADOW_RED = isTransformed ? 0x000000 : 0xb71c1c;
          const BASE_BLUE = isTransformed ? 0x212121 : 0x1976d2;
          const SHADOW_BLUE = isTransformed ? 0x0a0a0a : 0x0d47a1;
          const WEB_COLOR = isTransformed ? 0xaaaaaa : 0x550000; // Webs/Lines
          const EYE_COLOR = isTransformed ? 0xffffff : 0xffffff;
          const EYE_BORDER = 0x000000;
          
          // Legs (Blue with Red Boots)
          box(11, 23, 4, 3, BASE_BLUE); 
          box(17, 23, 4, 3, BASE_BLUE);
          box(11, 23, 1, 3, SHADOW_BLUE);
          box(20, 23, 1, 3, SHADOW_BLUE);
          
          // Boots (Red with webbing)
          box(11, 26, 4, 6, BASE_RED);
          box(17, 26, 4, 6, BASE_RED);
          box(11, 26, 1, 6, SHADOW_RED);
          box(20, 26, 1, 6, SHADOW_RED);
          // Boots/Feet
          box(10, 31, 5, 1, BASE_RED);
          box(17, 31, 5, 1, BASE_RED);
          
          // Torso (Red middle, Blue sides)
          box(11, 14, 10, 9, BASE_RED);
          box(10, 15, 2, 8, BASE_BLUE); // Left side
          box(20, 15, 2, 8, BASE_BLUE); // Right side
          // Web lines on waist
          box(12, 22, 8, 1, WEB_COLOR);
          // Spider logo on chest
          box(14, 16, 4, 4, 0x000000); 
          box(13, 17, 6, 2, 0x000000); // spider legs

          // Arms 
          if (isAttack) {
             // Web shoot pose!
             box(21, 13, 7, 4, BASE_RED); // Arm extended
             box(21, 13, 1, 4, SHADOW_RED);
             box(28, 14, 4, 3, BASE_RED); // Forearm
             box(24, 14, 1, 3, WEB_COLOR); // Web pattern
             box(32, 13, 3, 3, BASE_RED); // Fist shooting web
             
             // Two fingers down, middle fingers hidden
             headBox(35, 13, 1, 3, BASE_RED);
             
             // Back arm
             box(6, 15, 4, 4, BASE_RED);
          } else if (isCharge) {
             // Wall crawling / agile crouch prep
             box(8, 10, 4, 4, BASE_RED);
             box(20, 10, 4, 4, BASE_RED);
          } else {
             // Idle arms
             box(8, 14, 4, 4, BASE_RED);
             box(20, 14, 4, 4, BASE_RED);
             // Web patterns on upper arms
             box(8, 16, 4, 1, WEB_COLOR);
             box(20, 16, 4, 1, WEB_COLOR);
             // Blue forearms / or red gloves
             box(8, 18, 4, 5, BASE_RED);
             box(20, 18, 4, 5, BASE_RED);
          }

          // Head (Red with big white eyes and black borders)
          headBox(11, 5, 10, 9, BASE_RED);
          headBox(11, 5, 2, 9, SHADOW_RED);
          
          // Spider-Man Eyes 
          // Left Eye
          headBox(11, 7, 4, 5, EYE_BORDER);
          headBox(12, 8, 2, 3, EYE_COLOR);
          // Right Eye
          headBox(17, 7, 4, 5, EYE_BORDER);
          headBox(18, 8, 2, 3, EYE_COLOR);
          
          // Head webbing
          headDot(15, 5, WEB_COLOR);
          headDot(15, 6, WEB_COLOR);
          headBox(12, 10, 8, 1, WEB_COLOR); // horizontal web
          headBox(13, 12, 6, 1, WEB_COLOR); 
          break;
        }
`;

const insertPointStr = '          } // End of cases';
code = code.replace(
    '          }\n          break;\n        }\n      }\n    } // End Loop',
    '          }\n          break;\n        }\n' + spiderManCode + '\n      }\n    } // End Loop'
);

fs.writeFileSync(path, code);
