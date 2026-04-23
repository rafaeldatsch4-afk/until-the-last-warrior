const fs = require('fs');

const path = './game/scenes/PreloadScene.ts';
let code = fs.readFileSync(path, 'utf-8');

const jotaroReplacement = `
        case "jotaro": {
          const isTransformed = form > 0;
          
          const COAT = 0x111115;
          const COAT_MID = 0x22222a;
          const COAT_LT = 0x33333d;
          const SHIRT = 0x5a189a;
          const SHIRT_SH = 0x3c096c;
          const SKIN = 0xffdfc4;
          const SKIN_SH = 0xcdad96;
          const HAIR = 0x0a0a0f;
          const GOLD = 0xffcc00;
          const BELT1 = 0x008844;
          const BELT2 = 0xbb1133;
          const SILVER = 0xdddddd;
          const SILVER_SH = 0x888888;
          const BLACK = 0x010101;

          const SP_SKIN = 0x9b5de5;
          const SP_SHD = 0x5a189a;
          const SP_HAIR = 0x111118;
          const SP_GOLD = 0xf1c40f;
          const SP_SCARF = 0xe63946;
          const SP_GLOVE = 0x2a3d45;

          const jX = isTransformed ? 12 : 0; 
          
          // ==========================================
          // === STAR PLATINUM ===
          // ==========================================
          if (isTransformed) {
              const spX = -6;
              const spY = (f % 4 < 2) ? -2 : 0; // Smooth floating
              
              // Majestic Aura
              alphaBox(spX - 6, spY - 8, 44, 44, SP_SKIN, 0.2);
              alphaBox(spX - 2, spY - 4, 36, 36, SP_SHD, 0.3);

              // Flowing Hair
              headBox(spX - 6, spY - 6, 16, 18, SP_HAIR); 
              headBox(spX - 2, spY - 10, 18, 12, SP_HAIR); 
              headBox(spX + 4, spY - 14, 12, 6, SP_HAIR); 
              
              // Face & Headband
              headBox(spX + 10, spY - 2, 10, 10, SP_SKIN); 
              headBox(spX + 10, spY - 2, 10, 2, SP_GOLD); 
              headDot(spX + 14, spY - 2, 0x00ffff); // Gem
              
              // Face Details (Stronger anime eyes)
              headBox(spX + 12, spY + 2, 2, 1, 0xffffff);
              headBox(spX + 17, spY + 2, 2, 1, 0xffffff);
              headBox(spX + 12, spY + 2, 1, 1, 0x00ffff); // Cyan glowing pupils
              headBox(spX + 17, spY + 2, 1, 1, 0x00ffff);
              headBox(spX + 14, spY + 5, 4, 1, SP_SHD); // Mouth
              
              // Torso Muscle Definition
              box(spX + 8, spY + 8, 16, 12, SP_SKIN); 
              box(spX + 10, spY + 10, 12, 4, SP_SHD); // Abs shading
              
              // Golden Shoulder Pads
              box(spX + 4, spY + 8, 6, 6, SP_GOLD);
              box(spX + 22, spY + 8, 6, 6, SP_GOLD);
              
              // Scarf & Loincloth
              box(spX + 8, spY + 18, 16, 3, SP_SCARF); // Neck scarf
              box(spX + 13, spY + 20, 6, 8, SP_SCARF); // Loincloth
              
              // Legs & Boots
              box(spX + 11, spY + 20, 4, 7, 0x222233);
              box(spX + 17, spY + 20, 4, 7, 0x222233);
              box(spX + 9, spY + 26, 6, 4, SP_GOLD); // Heavy boots
              box(spX + 17, spY + 26, 6, 4, SP_GOLD);
              
              // Arms / Actions
              if (isAttack) {
                  // ORA ORA Face
                  headBox(spX + 14, spY + 5, 4, 3, 0x000000); 
                  
                  // Blur effect
                  alphaBox(spX + 12, spY + 6, 32, 16, SP_SKIN, 0.5); 
                  alphaBox(spX + 16, spY + 8, 28, 12, SP_GLOVE, 0.7); 
                  
                  const r1 = (f * 4 % 5) * 2;
                  const r2 = (f * 5 % 4) * 2;
                  
                  // Flying punches
                  box(spX + 20 + r1 * 2, spY + 10, 8, 4, SP_SKIN);
                  box(spX + 28 + r1 * 2, spY + 10, 6, 4, SP_GLOVE);
                  
                  box(spX + 18 + r2 * 2, spY + 16, 8, 4, SP_SKIN);
                  box(spX + 26 + r2 * 2, spY + 16, 6, 4, SP_GLOVE);
              } else {
                  // Guard / Flex pose
                  box(spX + 9, spY + 12, 14, 4, SP_SKIN); // Crossed massive arms
                  box(spX + 10, spY + 10, 4, 8, SP_GLOVE); // Gauntlets
                  box(spX + 18, spY + 10, 4, 8, SP_GLOVE); 
              }
          }

          // ==========================================
          // === JOTARO KUJO ===
          // ==========================================
          
          // --- CALÇAS E SAPATOS LSW ---
          box(jX + 9, 25, 6, 7, COAT); 
          box(jX + 17, 25, 6, 7, COAT); 
          box(jX + 8, 32, 6, 2, COAT_LT); // Shiny shoes
          box(jX + 18, 32, 6, 2, COAT_LT);

          // Cintos Perfeitos
          box(jX + 11, 23, 10, 1, BELT2); // Top belt red
          box(jX + 10, 24, 12, 1, BELT1); // Bottom belt green
          box(jX + 12, 23, 4, 2, GOLD); // Mega Buckle
          box(jX + 17, 23, 2, 2, SILVER); // Second buckle

          // --- TRONCO & GAKURAN ---
          // Ombros largos
          box(jX + 8, 15, 16, 10, COAT); 
          
          // Camisa
          box(jX + 12, 15, 8, 9, SHIRT); 
          box(jX + 14, 15, 6, 8, SHIRT_SH); 
          
          // Revestimento interno do casaco (lapelas soltas)
          box(jX + 9, 15, 3, 10, COAT_LT); 
          box(jX + 20, 15, 3, 10, COAT_LT); 

          // Gola & Corrente
          box(jX + 10, 11, 12, 4, COAT); // Stiff tall collar
          box(jX + 20, 13, 2, 6, SILVER); // Heavy Chain
          box(jX + 20, 14, 1, 2, SILVER_SH); // Chain shadow
          
          // Abas do Casaco (Movimento Suave, não quebra a sprint)
          const coatWave = (f % 4 < 2) ? 0 : -1;
          box(jX + 6, 22, 4, 10 + coatWave, COAT); // Aba Trás
          box(jX + 22, 22, 4, 9 - coatWave, COAT); // Aba Frente

          // --- CABELO E CHAPÉU ---
          // Cabeça base
          headBox(jX + 12, 5, 8, 6, SKIN); // Face 
          
          // Aba icônica chapada
          headBox(jX + 9, 4, 14, 2, COAT_MID); 
          headBox(jX + 10, 3, 12, 1, COAT_LT); // Edge highlight
          
          // Copa do chapéu
          headBox(jX + 10, -2, 10, 5, COAT); 
          
          // Fusão com Cabelo Espetado
          headBox(jX + 7, 0, 4, 8, HAIR); // Chunk traseiro
          headBox(jX + 6, 5, 3, 6, HAIR); // Nuca espetada
          headBox(jX + 20, 2, 3, 3, HAIR); // Ponto lateral
          
          // Detalhes Ouro Chapéu
          headBox(jX + 12, 1, 3, 2, GOLD); // A mão (palma)
          headBox(jX + 16, 2, 2, 2, GOLD); // A ancora

          // --- DETALHES DO ROSTO ---
          headBox(jX + 12, 5, 8, 1, SKIN_SH); // Sombra pesada da aba
          
          // Olhos (Sério e Focado)
          headBox(jX + 13, 7, 2, 1, 0xffffff); 
          headBox(jX + 17, 7, 2, 1, 0xffffff);
          headDot(jX + 14, 7, BLACK);
          headDot(jX + 17, 7, BLACK);
          
          // Sobrancelhas franzidas
          headBox(jX + 13, 6, 2, 1, HAIR); 
          headBox(jX + 17, 6, 2, 1, HAIR); 
          
          // Boca neutra/marrenta
          headBox(jX + 15, 9, 2, 1, 0x8a5a44); 

          // --- BRAÇOS SEM BUG ---
          // Independentemente de atacar ou transformar, os braços de Jotaro ficam na posição clássica "Hands in Pocket"
          // Isso resolve o bug "braso esticado da transformar" e o conflito da mão passando na cara
          
          box(jX + 8, 16, 3, 7, COAT); // Manga Mão trás
          box(jX + 21, 16, 3, 7, COAT); // Manga Mão frente
          
          // Quando Jotaro ataca pessoalmente (sem Stand):
          if (isAttack && !isTransformed) {
              box(jX + 18, 14, 10, 4, COAT); // Braço soco
              box(jX + 28, 14, 4, 4, SKIN); // Punho nu (Star Finger)
          }
          
          break;
        }
`;

const startIndex = code.indexOf('case "jotaro": {');
const nextCaseIndex = code.indexOf('case "obito": {');

if (startIndex !== -1 && nextCaseIndex !== -1) {
    const newCode = code.substring(0, startIndex) + jotaroReplacement.trim() + "\n        " + code.substring(nextCaseIndex);
    fs.writeFileSync(path, newCode);
    console.log('Jotaro bugs fixed thoroughly.');
} else {
    console.error('Could not find boundaries.');
}
