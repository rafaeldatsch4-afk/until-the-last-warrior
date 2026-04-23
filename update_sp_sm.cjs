const fs = require('fs');
const path = './game/scenes/PreloadScene.ts';
let code = fs.readFileSync(path, 'utf-8');

const spiderManOld = `        case "spiderman": {
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
        }`;

const spiderManNew = `        case "spiderman": {
          const isTransformed = form > 0;
          
          // Spiderman Palette (Classic Remastered / Iron Spider for transformed)
          const BASE_RED = isTransformed ? 0xa11515 : 0xdd1111;
          const SHADOW_RED = isTransformed ? 0x6e0000 : 0x9b0000;
          const LIGHT_RED = isTransformed ? 0xcc2222 : 0xff3333;
          
          const BASE_BLUE = isTransformed ? 0x11111a : 0x0044aa;
          const SHADOW_BLUE = isTransformed ? 0x050508 : 0x002266;
          const LIGHT_BLUE = isTransformed ? 0x222233 : 0x1166dd;
          
          const WEB_COLOR = isTransformed ? 0x222222 : 0x4a0000;
          const LOGO_COLOR = isTransformed ? 0xffd700 : 0x0a0a0a; // Gold logo for Iron Spider
          const EYE_COLOR = isTransformed ? 0x00ffff : 0xffffff;  // Glowing blue eyes for Iron Spider
          const EYE_BORDER = isTransformed ? 0xffd700 : 0x000000; // Gold rim for Iron spider
          
          // Iron spider legs
          if (isTransformed) {
              const legSpc = f === 1 || f === 3 ? 1 : 0;
              // Upper Legs
              box(2, 8 + legSpc, 10, 2, LOGO_COLOR); // Left top
              box(0, 10 + legSpc, 2, 8, LOGO_COLOR); // Left drop
              
              box(20, 8 - legSpc, 10, 2, LOGO_COLOR); // Right top
              box(30, 10 - legSpc, 2, 8, LOGO_COLOR); // Right drop
              
              // Lower Legs
              box(6, 14 - legSpc, 6, 2, LOGO_COLOR); // Left bot
              box(4, 16 - legSpc, 2, 8, LOGO_COLOR); 
              
              box(20, 14 + legSpc, 6, 2, LOGO_COLOR); // Right bot
              box(26, 16 + legSpc, 2, 8, LOGO_COLOR);
          }

          // Legs
          box(11, 23, 4, 4, BASE_BLUE); 
          box(12, 23, 2, 4, LIGHT_BLUE); 
          box(17, 23, 4, 4, BASE_BLUE);
          box(18, 23, 2, 4, LIGHT_BLUE);
          
          // Boots
          box(11, 27, 4, 5, BASE_RED);
          box(12, 27, 2, 5, LIGHT_RED);
          box(17, 27, 4, 5, BASE_RED);
          box(18, 27, 2, 5, LIGHT_RED);
          // Feet
          box(9, 31, 6, 2, BASE_RED);
          box(17, 31, 6, 2, BASE_RED);
          
          // Torso Core
          box(11, 14, 10, 9, BASE_RED);
          box(12, 14, 8, 9, LIGHT_RED); // Shiny core
          box(10, 15, 2, 8, BASE_BLUE); // Left side
          box(20, 15, 2, 8, BASE_BLUE); // Right side
          box(10, 16, 1, 6, LIGHT_BLUE); // Left side highlight
          box(21, 16, 1, 6, LIGHT_BLUE); 
          
          // Spider logo on chest / Iron spider gold logo
          box(14, 16, 4, 5, LOGO_COLOR); 
          box(13, 17, 6, 1, LOGO_COLOR); // upper legs
          box(13, 19, 6, 1, LOGO_COLOR); // lower legs

          // Arms 
          if (isAttack) {
             // Web shoot pose!
             box(21, 13, 8, 4, BASE_RED); // Arm extended
             box(21, 13, 8, 2, LIGHT_RED); // Upper highlight
             box(29, 14, 4, 3, BASE_RED); // Forearm
             box(33, 13, 3, 3, BASE_RED); // Fist 
             
             // Two fingers
             headBox(36, 13, 1, 3, LIGHT_RED);
             
             // Back arm
             box(6, 15, 4, 4, SHADOW_RED);
          } else if (isCharge) {
             box(8, 10, 4, 4, BASE_RED);
             box(20, 10, 4, 4, BASE_RED);
          } else {
             // Idle arms
             box(8, 14, 4, 4, BASE_BLUE);
             box(20, 14, 4, 4, BASE_BLUE);
             // Gloves
             box(8, 18, 4, 6, BASE_RED);
             box(9, 18, 2, 6, LIGHT_RED);
             box(20, 18, 4, 6, BASE_RED);
             box(21, 18, 2, 6, LIGHT_RED);
          }

          // Head (Perfect Shape)
          headBox(11, 5, 10, 9, BASE_RED);
          headBox(12, 5, 8, 9, LIGHT_RED);
          headBox(11, 5, 1, 9, SHADOW_RED); // Edge shading
          
          // Spider-Man Eyes (More angular and sharp)
          // Left Eye Rim
          headBox(11, 7, 4, 4, EYE_BORDER);
          headBox(12, 6, 4, 2, EYE_BORDER); // Top angle
          // Left Eye Core
          headBox(12, 7, 3, 3, EYE_COLOR);
          headBox(13, 8, 2, 2, 0xffffff); // Pure white gleam
          
          // Right Eye Rim
          headBox(17, 7, 4, 4, EYE_BORDER);
          headBox(16, 6, 4, 2, EYE_BORDER);
          // Right Eye Core
          headBox(17, 7, 3, 3, EYE_COLOR);
          headBox(17, 8, 2, 2, 0xffffff); // Pure white gleam
          
          break;
        }`;

code = code.replace(spiderManOld, spiderManNew);

const spOld = `          // ==========================================
          // === STAR PLATINUM (ULTRA DETAIL) ===
          // ==========================================
          if (isTransformed) {
              const spX = -8;
              const spY = (f % 4 < 2) ? -1 : 0; 
              
              // Multi-layered Aura
              alphaBox(spX - 8, spY - 8, 48, 48, SP_SKIN_MD, 0.15);
              alphaBox(spX - 4, spY - 4, 40, 40, SP_SKIN_LT, 0.25);
              alphaBox(spX, spY, 32, 32, SP_SKIN_MD, 0.4);

              // Hair
              headBox(spX - 4, spY - 8, 20, 18, SP_HAIR); 
              headBox(spX, spY - 12, 12, 6, SP_HAIR);
              headBox(spX - 6, spY - 4, 4, 10, SP_HAIR); 
              headBox(spX + 16, spY - 4, 4, 10, SP_HAIR); 
              
              // Face Outline & Skin
              headBox(spX + 10, spY - 2, 12, 10, SP_SKIN_DK); 
              headBox(spX + 11, spY - 1, 10, 8, SP_SKIN_MD); 
              
              // Headband (3D effect)
              headBox(spX + 10, spY - 2, 12, 3, SP_ARMOR_DK); 
              headBox(spX + 11, spY - 2, 10, 1, SP_ARMOR_LT); 
              headBox(spX + 11, spY - 1, 10, 1, SP_ARMOR_MD); 
              headDot(spX + 15, spY - 2, 0x00ffff); 
              headDot(spX + 15, spY - 1, 0x008888); 
              
              // Eyes & Cheekbones
              headBox(spX + 13, spY + 2, 2, 1, 0xffffff);
              headBox(spX + 17, spY + 2, 2, 1, 0xffffff);
              headDot(spX + 13, spY + 2, 0x00ffff);
              headDot(spX + 17, spY + 2, 0x00ffff);
              headBox(spX + 12, spY + 4, 2, 1, SP_SKIN_DK);
              headBox(spX + 18, spY + 4, 2, 1, SP_SKIN_DK);
              headBox(spX + 14, spY + 5, 4, 1, SP_SKIN_DK); 
              
              // Torso
              box(spX + 8, spY + 8, 16, 12, SP_SKIN_MD); 
              box(spX + 10, spY + 9, 12, 4, SP_SKIN_LT); 
              box(spX + 15, spY + 9, 2, 10, SP_SKIN_DK); 
              box(spX + 11, spY + 14, 4, 2, SP_SKIN_LT); 
              box(spX + 17, spY + 14, 4, 2, SP_SKIN_LT); 
              box(spX + 11, spY + 17, 4, 2, SP_SKIN_LT); 
              box(spX + 17, spY + 17, 4, 2, SP_SKIN_LT); 
              
              // Golden Shoulder Pads
              box(spX + 3, spY + 7, 8, 8, SP_ARMOR_DK);
              box(spX + 4, spY + 8, 6, 6, SP_ARMOR_MD);
              box(spX + 5, spY + 8, 4, 2, SP_ARMOR_LT); 
              
              box(spX + 21, spY + 7, 8, 8, SP_ARMOR_DK);
              box(spX + 22, spY + 8, 6, 6, SP_ARMOR_MD);
              box(spX + 23, spY + 8, 4, 2, SP_ARMOR_LT); 
              
              // Scarf & Loincloth Flow
              box(spX + 7, spY + 18, 18, 4, SP_SCARF_DK); 
              box(spX + 8, spY + 18, 16, 2, SP_SCARF_MD);
              box(spX + 13, spY + 22, 6, 8, SP_SCARF_MD); 
              box(spX + 15, spY + 22, 2, 8, SP_SCARF_DK); 
              box(spX + 9, spY + 20, 14, 2, 0xffffff); 
              box(spX + 10, spY + 21, 12, 1, 0xaaaaaa); 
              
              // Thighs & Knee Guards
              box(spX + 11, spY + 22, 4, 5, 0x2b2b36); 
              box(spX + 17, spY + 22, 4, 5, 0x2b2b36); 
              box(spX + 10, spY + 26, 6, 4, SP_ARMOR_MD); 
              box(spX + 16, spY + 26, 6, 4, SP_ARMOR_MD); 
              box(spX + 11, spY + 26, 2, 4, SP_ARMOR_LT); 
              box(spX + 17, spY + 26, 2, 4, SP_ARMOR_LT); 
              
              // Action / Arms
              if (isAttack) {
                  headBox(spX + 14, spY + 5, 4, 3, 0x000000); 
                  
                  alphaBox(spX + 10, spY + 6, 36, 16, SP_SKIN_LT, 0.4); 
                  alphaBox(spX + 14, spY + 8, 30, 12, SP_SKIN_DK, 0.6); 
                  
                  const r1 = (f * 3 % 4) * 3;
                  const r2 = (f * 5 % 4) * 3;
                  const r3 = (f * 7 % 4) * 3;
                  
                  box(spX + 22 + r1, spY + 8 + (r2 % 4), 6, 4, 0x111118); 
                  box(spX + 24 + r1, spY + 8 + (r2 % 4), 4, 4, 0x2a3d45); 
                  
                  box(spX + 18 + r2, spY + 14 - (r1 % 3), 6, 4, 0x111118);
                  box(spX + 20 + r2, spY + 14 - (r1 % 3), 4, 4, 0x2a3d45);
                  
                  box(spX + 26 + r3, spY + 11, 8, 5, 0x111118);
                  box(spX + 29 + r3, spY + 11, 5, 5, 0x2a3d45);
                  
                  box(spX + 20, spY + 11, 6, 5, SP_SKIN_MD);
              } else {
                  box(spX + 7, spY + 12, 18, 5, SP_SKIN_DK); 
                  box(spX + 8, spY + 12, 7, 5, SP_SKIN_MD); 
                  box(spX + 17, spY + 12, 7, 5, SP_SKIN_MD); 
                  
                  box(spX + 8, spY + 10, 6, 8, 0x111118); 
                  box(spX + 10, spY + 10, 2, 8, 0x2a3d45); 
                  box(spX + 18, spY + 10, 6, 8, 0x111118); 
                  box(spX + 20, spY + 10, 2, 8, 0x2a3d45); 
              }
          }`;

const spNew = `          // ==========================================
          // === STAR PLATINUM (REMASTERED POLISH) ===
          // ==========================================
          if (isTransformed) {
              const spX = isAttack ? 2 : -2; // Move forward when attacking
              const spY = (f % 4 < 2) ? -1 : 0; 
              
              // Clean Aura
              alphaBox(spX - 4, spY - 4, 40, 40, SP_SKIN_LT, 0.2);
              alphaBox(spX, spY, 32, 32, SP_SKIN_MD, 0.4);

              // Huge wild dark hair flowing!
              headBox(spX - 2, spY - 6, 18, 14, SP_HAIR); 
              headBox(spX + 1, spY - 10, 10, 6, SP_HAIR);
              headBox(spX - 5, spY - 2, 4, 12, SP_HAIR); 
              headBox(spX + 16, spY - 2, 6, 12, SP_HAIR); 
              
              // Face Outline & Skin (Strong masculine jaw)
              headBox(spX + 10, spY - 1, 12, 9, SP_SKIN_DK); 
              headBox(spX + 11, spY, 10, 8, SP_SKIN_MD); 
              
              // Classic Gold Headband
              headBox(spX + 10, spY - 1, 12, 2, SP_ARMOR_DK); 
              headBox(spX + 11, spY - 1, 10, 1, SP_ARMOR_MD); 
              headDot(spX + 15, spY - 1, 0x22ffff); // Center jewel
              
              // Star Platinum Eyes & Face features
              headBox(spX + 12, spY + 3, 3, 1, 0xffffff); // Fierce white eyes
              headBox(spX + 17, spY + 3, 3, 1, 0xffffff);
              headDot(spX + 13, spY + 3, 0xff00ff); // Pinkish glowing iris
              headDot(spX + 18, spY + 3, 0xff00ff);
              
              headBox(spX + 14, spY + 6, 4, 1, SP_SKIN_DK); // Nose/Mouth Shadow
              
              // Torso (Defined Musculature)
              box(spX + 8, spY + 8, 16, 14, SP_SKIN_DK); 
              box(spX + 10, spY + 9, 12, 12, SP_SKIN_MD); 
              // Pecs
              box(spX + 11, spY + 11, 4, 3, SP_SKIN_LT); 
              box(spX + 17, spY + 11, 4, 3, SP_SKIN_LT); 
              // Abs
              box(spX + 13, spY + 15, 6, 6, SP_SKIN_LT);
              box(spX + 15, spY + 15, 2, 6, SP_SKIN_DK); // Ab line
              
              // Giant Golden Shoulder Pads
              box(spX + 1, spY + 7, 10, 8, SP_ARMOR_DK);
              box(spX + 2, spY + 7, 8, 6, SP_ARMOR_MD);
              box(spX + 4, spY + 7, 4, 2, SP_ARMOR_LT); 
              
              box(spX + 21, spY + 7, 10, 8, SP_ARMOR_DK);
              box(spX + 22, spY + 7, 8, 6, SP_ARMOR_MD);
              box(spX + 24, spY + 7, 4, 2, SP_ARMOR_LT); 
              
              // Red Scarf Flowing
              box(spX + 6, spY + 16, 20, 6, SP_SCARF_DK); 
              box(spX + 8, spY + 18, 16, 4, SP_SCARF_MD);
              
              // Loincloth
              box(spX + 12, spY + 22, 8, 10, SP_SKIN_DK); // Undercloth
              box(spX + 13, spY + 22, 6, 10, 0xaaaaaa);
              box(spX + 14, spY + 22, 4, 8, 0xffffff);
              
              // Strong Legs & Boots
              box(spX + 11, spY + 22, 4, 6, SP_SKIN_DK); 
              box(spX + 17, spY + 22, 4, 6, SP_SKIN_DK); 
              
              box(spX + 10, spY + 28, 6, 4, SP_ARMOR_DK); 
              box(spX + 16, spY + 28, 6, 4, SP_ARMOR_DK); 
              box(spX + 11, spY + 28, 4, 3, SP_ARMOR_MD); 
              box(spX + 17, spY + 28, 4, 3, SP_ARMOR_MD); 
              
              // Action / ORA ORA Arms
              if (isAttack) {
                  // ORA ORA ORA Flurry! 
                  // Star platinum attacks extremely fast with purple afterimages
                  alphaBox(spX + 14, spY + 5, 6, 4, 0x000000, 0.5); // shout mouth
                  
                  // Blurry arms
                  alphaBox(spX + 12, spY + 8, 28, 16, SP_SKIN_LT, 0.5); 
                  
                  // Solid Punches scattered based on frame
                  const shiftY = (f % 2) * 4;
                  // Punch 1
                  box(spX + 20, spY + 8 + shiftY, 8, 4, SP_SKIN_DK); 
                  box(spX + 24, spY + 8 + shiftY, 4, 4, 0x000000); // glove
                  // Punch 2
                  box(spX + 24, spY + 14 - shiftY, 8, 4, SP_SKIN_DK); 
                  box(spX + 28, spY + 14 - shiftY, 4, 4, 0x000000); 
                  // Punch 3
                  box(spX + 18, spY + 12 + shiftY, 8, 4, SP_SKIN_DK); 
                  box(spX + 22, spY + 12 + shiftY, 4, 4, 0x000000); 
              } else {
                  // Muscular Idle Arms & Gloves
                  box(spX + 5, spY + 10, 6, 12, SP_SKIN_DK); 
                  box(spX + 6, spY + 11, 4, 8, SP_SKIN_MD); 
                  box(spX + 21, spY + 10, 6, 12, SP_SKIN_DK); 
                  box(spX + 22, spY + 11, 4, 8, SP_SKIN_MD); 
                  
                  // Black gloves over fists
                  box(spX + 5, spY + 18, 6, 4, 0x000000); 
                  box(spX + 21, spY + 18, 6, 4, 0x000000); 
              }
          }`;

code = code.replace(spOld, spNew);

fs.writeFileSync(path, code);
console.log("Remastered Spider-Man and Star Platinum!");
