const fs = require('fs');
const path = './game/scenes/PreloadScene.ts';

let code = fs.readFileSync(path, 'utf8');

const oldSpiderBlockStart = '        case "spiderman": {';
const nextCase = '      }\\n    } // End Loop';

let startIndex = code.indexOf(oldSpiderBlockStart);
let endIndex = code.indexOf(nextCase, startIndex);

console.log('startIndex:', startIndex);
console.log('endIndex:', endIndex);

if (startIndex > -1 && endIndex > -1) {
  const newSpider = \`        case "spiderman": {
          const isTransformed = form > 0;

          // ULTIMATE REMASTERED SPIDERMAN & IRON SPIDER PALETTES
          const BASE_RED = isTransformed ? 0xaa0f15 : 0xe60000;
          const SHADOW_RED = isTransformed ? 0x660000 : 0x990000;
          const LIGHT_RED = isTransformed ? 0xd01a1a : 0xff3333;
          const SUPER_LIGHT_RED = isTransformed ? 0xff4d4d : 0xff6666;

          const BASE_BLUE = isTransformed ? 0x15151b : 0x0a3d91;
          const SHADOW_BLUE = isTransformed ? 0x0c0c10 : 0x062259;
          const LIGHT_BLUE = isTransformed ? 0x272736 : 0x1a66cc;

          const WEB_COLOR = isTransformed ? 0x3d0a0a : 0x400000; // Web line pattern color
          const LOGO_MAIN = isTransformed ? 0xffea00 : 0x111111; // Gold logo for Iron Spider
          const LOGO_BG = isTransformed ? 0xb39600 : 0x000000; 

          const EYE_GLOW = isTransformed ? 0x00ffff : 0xffffff;
          const EYE_RIM = isTransformed ? 0xffc400 : 0x111111;

          // === ANIMATION OFFSETS ===
          const bob = (f === 1 || f === 3) ? 1 : 0;
          
          // IF IRON SPIDER - RENDER MECHANICAL LEGS (WALDOES) BEHIND HIM FIRST
          if (isTransformed) {
             const armSway = (f === 1 || f === 3) ? 2 : 0;
             const isAtk = isAttack ? 2 : 0;
             
             // Top Waldo Left
             box(1, 4 + armSway + isAtk, 10, 2, LOGO_MAIN);
             box(1, 4 + armSway + isAtk, 10, 1, LOGO_BG); // Rim
             box(0, 6 + armSway + isAtk, 2, 8, LOGO_MAIN);
             box(-1, 12 + armSway + isAtk, 3, 3, EYE_GLOW); // Blue glowing tip
             
             // Top Waldo Right
             box(21, 4 - armSway + isAtk, 10, 2, LOGO_MAIN);
             box(21, 4 - armSway + isAtk, 10, 1, LOGO_BG); 
             box(30, 6 - armSway + isAtk, 2, 8, LOGO_MAIN);
             box(30, 12 - armSway + isAtk, 3, 3, EYE_GLOW); // Blue glowing tip
             
             // Bottom Waldo Left
             box(4, 18 - armSway, 8, 2, LOGO_MAIN);
             box(4, 18 - armSway, 8, 1, LOGO_BG);
             box(2, 20 - armSway, 2, 8, LOGO_MAIN);
             box(1, 26 - armSway, 3, 3, EYE_GLOW);
             
             // Bottom Waldo Right
             box(20, 18 + armSway, 8, 2, LOGO_MAIN);
             box(20, 18 + armSway, 8, 1, LOGO_BG);
             box(28, 20 + armSway, 2, 8, LOGO_MAIN);
             box(28, 26 + armSway, 3, 3, EYE_GLOW);
          }
          
          // === LEGS ===
          // Left Thigh
          box(11, 22 + bob, 4, 6, BASE_BLUE);
          box(11, 22 + bob, 2, 6, LIGHT_BLUE);
          box(14, 22 + bob, 1, 6, SHADOW_BLUE);
          // Right Thigh
          box(17, 22 + bob, 4, 6, BASE_BLUE);
          box(17, 22 + bob, 2, 6, LIGHT_BLUE);
          box(20, 22 + bob, 1, 6, SHADOW_BLUE);

          // Left Boot
          box(11, 28 + bob, 4, 4, SHADOW_RED);
          box(12, 28 + bob, 2, 4, BASE_RED);
          box(10, 32 + bob, 5, 2, BASE_RED); // left foot
          // Left Boot Webbing
          box(11, 29 + bob, 4, 1, WEB_COLOR);
          box(11, 31 + bob, 4, 1, WEB_COLOR);
          
          // Right Boot
          box(17, 28 + bob, 4, 4, SHADOW_RED);
          box(18, 28 + bob, 2, 4, BASE_RED);
          box(17, 32 + bob, 5, 2, BASE_RED); // right foot
          // Right Boot Webbing
          box(17, 29 + bob, 4, 1, WEB_COLOR);
          box(17, 31 + bob, 4, 1, WEB_COLOR);

          // === TORSO ===
          // Blue Sides
          box(10, 14 + bob, 3, 8, BASE_BLUE);
          box(10, 14 + bob, 1, 8, LIGHT_BLUE);
          box(19, 14 + bob, 3, 8, BASE_BLUE);
          box(21, 14 + bob, 1, 8, LIGHT_BLUE);

          // Core Red Section
          box(13, 13 + bob, 6, 10, BASE_RED);
          box(14, 13 + bob, 4, 10, LIGHT_RED);
          
          // Torso Webbing Pattern
          // Vertical strips
          box(14, 13 + bob, 1, 10, WEB_COLOR); 
          box(17, 13 + bob, 1, 10, WEB_COLOR);
          // Horizontal curves
          box(13, 14 + bob, 6, 1, WEB_COLOR);
          box(13, 16 + bob, 6, 1, WEB_COLOR);
          box(13, 18 + bob, 6, 1, WEB_COLOR);
          box(13, 20 + bob, 6, 1, WEB_COLOR);
          box(13, 22 + bob, 6, 1, WEB_COLOR);

          // Spider Emblem
          box(15, 14 + bob, 2, 5, LOGO_MAIN);
          box(14, 15 + bob, 4, 1, LOGO_MAIN); // Up legs
          box(14, 18 + bob, 4, 1, LOGO_MAIN); // Down legs

          // Red Belt
          box(13, 23 + bob, 6, 2, BASE_RED);
          box(14, 23 + bob, 4, 2, LIGHT_RED);
          box(13, 24 + bob, 6, 1, WEB_COLOR);

          // === HANDS & ARMS ===
          if (isAttack) {
              // Web Shooter Pose
              // Right Arm (Back)
              box(7, 12 + bob, 4, 6, SHADOW_RED);
              box(7, 14 + bob, 4, 1, WEB_COLOR);
              box(7, 16 + bob, 4, 1, WEB_COLOR);
              
              // Left Arm (Forward / Shooting)
              box(18, 13 + bob, 8, 4, LIGHT_RED); // shoulder/bicep reaching forward
              box(26, 14 + bob, 6, 3, BASE_RED);  // forearm
              box(32, 13 + bob, 3, 3, SHADOW_RED); // fist/palm
              
              // Finger pose (thwip)
              box(35, 12 + bob, 2, 1, BASE_RED); // pointer
              box(35, 15 + bob, 2, 1, BASE_RED); // pinky
              
              // Arm Webbing
              box(20, 13 + bob, 1, 4, WEB_COLOR);
              box(23, 13 + bob, 1, 4, WEB_COLOR);
              box(28, 14 + bob, 1, 3, WEB_COLOR);
              
          } else if (isCharge) {
              // Crouch / Prep Pose - Arms pulled in
              box(8, 12 + bob, 4, 4, BASE_BLUE); // Shoulder
              box(7, 16 + bob, 4, 5, BASE_RED);  // Glove
              box(6, 17 + bob, 5, 1, WEB_COLOR);
              box(6, 19 + bob, 5, 1, WEB_COLOR);
              
              box(20, 12 + bob, 4, 4, BASE_BLUE); 
              box(21, 16 + bob, 4, 5, BASE_RED); 
              box(21, 17 + bob, 5, 1, WEB_COLOR);
              box(21, 19 + bob, 5, 1, WEB_COLOR);
          } else {
              // Idle Swaying Arms
              const lhY = bob;
              const rhY = -bob;
              
              // Left Arm (Blue top, Red Glove)
              box(9, 13 + lhY, 4, 5, BASE_BLUE);
              box(9, 13 + lhY, 2, 5, LIGHT_BLUE);
              box(8, 18 + lhY, 4, 6, BASE_RED); // Glove
              box(9, 18 + lhY, 2, 6, LIGHT_RED);
              box(8, 19 + lhY, 4, 1, WEB_COLOR);
              box(8, 21 + lhY, 4, 1, WEB_COLOR);
              box(8, 23 + lhY, 4, 1, WEB_COLOR);
              
              // Right Arm
              box(19, 13 + rhY, 4, 5, BASE_BLUE);
              box(21, 13 + rhY, 2, 5, LIGHT_BLUE);
              box(20, 18 + rhY, 4, 6, BASE_RED); // Glove
              box(21, 18 + rhY, 2, 6, LIGHT_RED);
              box(20, 19 + rhY, 4, 1, WEB_COLOR);
              box(20, 21 + rhY, 4, 1, WEB_COLOR);
              box(20, 23 + rhY, 4, 1, WEB_COLOR);
          }

          // === HEAD === 
          // Perfect shape mask
          headBox(11, 4, 10, 10, SHADOW_RED);
          headBox(12, 4, 8, 10, BASE_RED);
          headBox(13, 4, 6, 10, LIGHT_RED);
          headBox(14, 5, 4, 3, SUPER_LIGHT_RED); // Cranium highlight
          
          // Head Webbing
          headBox(15, 4, 2, 10, WEB_COLOR); // center line
          headBox(12, 6, 8, 1, WEB_COLOR); // horiz 1
          headBox(11, 9, 10, 1, WEB_COLOR); // horiz 2
          headBox(12, 12, 8, 1, WEB_COLOR); // horiz 3

          // Eyes
          // Left Eye
          headBox(10, 7, 5, 5, EYE_RIM); 
          headBox(11, 8, 3, 3, EYE_GLOW); 
          headBox(12, 9, 2, 2, 0xffffff); // Pure white intensity

          // Right Eye
          headBox(17, 7, 5, 5, EYE_RIM);
          headBox(18, 8, 3, 3, EYE_GLOW);
          headBox(18, 9, 2, 2, 0xffffff);
          
          break;
        }\n`;

  const finalCode = code.slice(0, startIndex) + newSpider + code.slice(endIndex);
  fs.writeFileSync(path, finalCode);
  console.log("Remastered Spiderman injected!");
} else {
  console.log("Could not find blocks.");
}
