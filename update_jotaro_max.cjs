const fs = require('fs');

const path = './game/scenes/PreloadScene.ts';
let code = fs.readFileSync(path, 'utf-8');

const jotaroReplacement = `
        case "jotaro": {
          const isTransformed = form > 0;
          
          // --- ULTRA-DETAILED PALETTE ---
          // Coat (Heavy Dark Blue/Black Wool)
          const COAT_DK = 0x0a0a0f;
          const COAT_MD = 0x181822;
          const COAT_LT = 0x242436;
          const COAT_HL = 0x3a3a52; // Highlights
          // Shirt (Purple)
          const SHIRT_DK = 0x240046;
          const SHIRT_MD = 0x5a189a;
          const SHIRT_LT = 0x7b2cbf;
          // Skin
          const SKIN_DK = 0xa47148;
          const SKIN_MD = 0xd4a373;
          const SKIN_LT = 0xfaedcd;
          // Hair
          const HAIR_DK = 0x000000;
          const HAIR_MD = 0x111111;
          const HAIR_LT = 0x222222;
          // Metals & Accessories
          const GOLD_DK = 0xb08d57;
          const GOLD_MD = 0xffd700;
          const GOLD_LT = 0xfffae3;
          const SILVER_DK = 0x6c757d;
          const SILVER_MD = 0xced4da;
          const SILVER_LT = 0xf8f9fa;
          const BELT_GREEN = 0x2d6a4f;
          const BELT_RED = 0x9d0208;

          // Star Platinum Palette
          const SP_SKIN_DK = 0x4a0e4e;
          const SP_SKIN_MD = 0x800080;
          const SP_SKIN_LT = 0xb14aed;
          const SP_HAIR = 0x0b090a;
          const SP_ARMOR_DK = 0xb07d00;
          const SP_ARMOR_MD = 0xffb700;
          const SP_ARMOR_LT = 0xffea00;
          const SP_SCARF_DK = 0x660000;
          const SP_SCARF_MD = 0xc1121f;

          const jX = isTransformed ? 10 : 0; 

          // ==========================================
          // === STAR PLATINUM (ULTRA DETAIL) ===
          // ==========================================
          if (isTransformed) {
              const spX = -8;
              const spY = (f % 4 < 2) ? -1 : 0; // Ultra smooth floating
              
              // Multi-layered Aura
              alphaBox(spX - 8, spY - 8, 48, 48, SP_SKIN_MD, 0.15);
              alphaBox(spX - 4, spY - 4, 40, 40, SP_SKIN_LT, 0.25);
              alphaBox(spX, spY, 32, 32, SP_SKIN_MD, 0.4);

              // Hair (Wild & Flowing with highlights)
              headBox(spX - 4, spY - 8, 20, 18, SP_HAIR); 
              headBox(spX, spY - 12, 12, 6, SP_HAIR);
              headBox(spX - 6, spY - 4, 4, 10, SP_HAIR); // Left spikes
              headBox(spX + 16, spY - 4, 4, 10, SP_HAIR); // Right spikes
              
              // Face Outline & Skin
              headBox(spX + 10, spY - 2, 12, 10, SP_SKIN_DK); 
              headBox(spX + 11, spY - 1, 10, 8, SP_SKIN_MD); 
              
              // Headband (3D effect)
              headBox(spX + 10, spY - 2, 12, 3, SP_ARMOR_DK); 
              headBox(spX + 11, spY - 2, 10, 1, SP_ARMOR_LT); 
              headBox(spX + 11, spY - 1, 10, 1, SP_ARMOR_MD); 
              headDot(spX + 15, spY - 2, 0x00ffff); // Gem
              headDot(spX + 15, spY - 1, 0x008888); // Gem shadow
              
              // Eyes & Cheekbones
              headBox(spX + 13, spY + 2, 2, 1, 0xffffff);
              headBox(spX + 17, spY + 2, 2, 1, 0xffffff);
              headDot(spX + 13, spY + 2, 0x00ffff); // Glowing pupil
              headDot(spX + 17, spY + 2, 0x00ffff);
              headBox(spX + 12, spY + 4, 2, 1, SP_SKIN_DK); // Cheek lines
              headBox(spX + 18, spY + 4, 2, 1, SP_SKIN_DK);
              headBox(spX + 14, spY + 5, 4, 1, SP_SKIN_DK); // Mouth
              
              // Torso Muscle Anatomy (8-pack & Pecs)
              box(spX + 8, spY + 8, 16, 12, SP_SKIN_MD); 
              box(spX + 10, spY + 9, 12, 4, SP_SKIN_LT); // Pecs
              box(spX + 15, spY + 9, 2, 10, SP_SKIN_DK); // Sternum / Abs center
              box(spX + 11, spY + 14, 4, 2, SP_SKIN_LT); // Upper abs
              box(spX + 17, spY + 14, 4, 2, SP_SKIN_LT); 
              box(spX + 11, spY + 17, 4, 2, SP_SKIN_LT); // Lower abs
              box(spX + 17, spY + 17, 4, 2, SP_SKIN_LT); 
              
              // Golden Shoulder Pads (Rounded)
              box(spX + 3, spY + 7, 8, 8, SP_ARMOR_DK);
              box(spX + 4, spY + 8, 6, 6, SP_ARMOR_MD);
              box(spX + 5, spY + 8, 4, 2, SP_ARMOR_LT); // Shine
              
              box(spX + 21, spY + 7, 8, 8, SP_ARMOR_DK);
              box(spX + 22, spY + 8, 6, 6, SP_ARMOR_MD);
              box(spX + 23, spY + 8, 4, 2, SP_ARMOR_LT); // Shine
              
              // Scarf & Loincloth Flow
              box(spX + 7, spY + 18, 18, 4, SP_SCARF_DK); 
              box(spX + 8, spY + 18, 16, 2, SP_SCARF_MD); // Scarf volume
              box(spX + 13, spY + 22, 6, 8, SP_SCARF_MD); // Cloth drop
              box(spX + 15, spY + 22, 2, 8, SP_SCARF_DK); // Cloth fold shadow
              box(spX + 9, spY + 20, 14, 2, 0xffffff); // White belt
              box(spX + 10, spY + 21, 12, 1, 0xaaaaaa); // Belt shading
              
              // Thighs & Knee Guards
              box(spX + 11, spY + 22, 4, 5, 0x2b2b36); // Thigh L
              box(spX + 17, spY + 22, 4, 5, 0x2b2b36); // Thigh R
              box(spX + 10, spY + 26, 6, 4, SP_ARMOR_MD); // Knee/Boot L
              box(spX + 16, spY + 26, 6, 4, SP_ARMOR_MD); // Knee/Boot R
              box(spX + 11, spY + 26, 2, 4, SP_ARMOR_LT); // Shine L
              box(spX + 17, spY + 26, 2, 4, SP_ARMOR_LT); // Shine R
              
              // Action / Arms
              if (isAttack) {
                  headBox(spX + 14, spY + 5, 4, 3, 0x000000); // Shouting ORA
                  
                  // Rush Blurs (Multiple layers for speed effect)
                  alphaBox(spX + 10, spY + 6, 36, 16, SP_SKIN_LT, 0.4); 
                  alphaBox(spX + 14, spY + 8, 30, 12, SP_SKIN_DK, 0.6); 
                  
                  // Procedural barrage of fists based on frame
                  const r1 = (f * 3 % 4) * 3;
                  const r2 = (f * 5 % 4) * 3;
                  const r3 = (f * 7 % 4) * 3;
                  
                  // Fist 1
                  box(spX + 22 + r1, spY + 8 + (r2 % 4), 6, 4, 0x111118); // Dark glove
                  box(spX + 24 + r1, spY + 8 + (r2 % 4), 4, 4, 0x2a3d45); // Glove highlight
                  // Fist 2
                  box(spX + 18 + r2, spY + 14 - (r1 % 3), 6, 4, 0x111118);
                  box(spX + 20 + r2, spY + 14 - (r1 % 3), 4, 4, 0x2a3d45);
                  // Fist 3 (Lead)
                  box(spX + 26 + r3, spY + 11, 8, 5, 0x111118);
                  box(spX + 29 + r3, spY + 11, 5, 5, 0x2a3d45);
                  
                  // Connection Arm
                  box(spX + 20, spY + 11, 6, 5, SP_SKIN_MD);
              } else {
                  // Mighty Guard Pose
                  box(spX + 7, spY + 12, 18, 5, SP_SKIN_DK); // Back arm wrap
                  box(spX + 8, spY + 12, 7, 5, SP_SKIN_MD); // Arm L
                  box(spX + 17, spY + 12, 7, 5, SP_SKIN_MD); // Arm R
                  
                  // Guard Gauntlets
                  box(spX + 8, spY + 10, 6, 8, 0x111118); 
                  box(spX + 10, spY + 10, 2, 8, 0x2a3d45); // Highlight L
                  box(spX + 18, spY + 10, 6, 8, 0x111118); 
                  box(spX + 20, spY + 10, 2, 8, 0x2a3d45); // Highlight R
              }
          }

          // ==========================================
          // === JOTARO KUJO (MAXIMUM DETAIL) ===
          // ==========================================
          
          // --- CALÇAS E SAPATOS ---
          box(jX + 9, 25, 6, 8, COAT_DK); // Calça Base Sombra
          box(jX + 10, 25, 4, 7, COAT_MD); // Calça Esq
          box(jX + 16, 25, 4, 7, COAT_MD); // Calça Dir
          box(jX + 11, 26, 1, 5, COAT_LT); // Dobra Esq
          box(jX + 17, 26, 1, 5, COAT_LT); // Dobra Dir

          // Sapatos (Loafers 3D)
          box(jX + 8, 32, 6, 2, COAT_DK); // Sola Esq
          box(jX + 17, 32, 6, 2, COAT_DK); // Sola Dir
          box(jX + 9, 31, 5, 2, COAT_MD); // Couro Esq
          box(jX + 18, 31, 5, 2, COAT_MD); // Couro Dir
          headDot(jX + 10, 31, COAT_HL); // Brilho Mão Esq
          headDot(jX + 19, 31, COAT_HL); // Brilho Mão Dir

          // --- TRONCO & GAKURAN ---
          // Base Traseira do Casaco (Cria profundidade)
          box(jX + 8, 14, 16, 10, COAT_DK); 
          
          // Camisa Interna Muscular
          box(jX + 12, 14, 8, 9, SHIRT_DK); 
          box(jX + 13, 14, 6, 8, SHIRT_MD); 
          box(jX + 14, 15, 2, 6, SHIRT_LT); // Highlights (Abs/Pecs esq)
          box(jX + 17, 15, 2, 6, SHIRT_LT); // Highlights (Abs/Pecs dir)
          
          // Lapelas Longas Obertas
          box(jX + 9, 14, 3, 10, COAT_MD); 
          box(jX + 11, 14, 1, 10, COAT_LT); // Borda luminosa da lapela esq
          box(jX + 20, 14, 3, 10, COAT_MD); 
          box(jX + 20, 14, 1, 10, COAT_LT); // Borda luminosa da lapela dir

          // Gola Alta (Iconic Stiff Collar)
          box(jX + 10, 10, 12, 4, COAT_DK); 
          box(jX + 11, 11, 10, 3, COAT_MD); 
          box(jX + 11, 11, 3, 3, COAT_LT); // Brilho gola esq
          box(jX + 18, 11, 3, 3, COAT_LT); // Brilho gola dir
          box(jX + 14, 12, 4, 3, SKIN_DK); // Sombra do pescoço
          box(jX + 15, 12, 2, 2, SKIN_MD); // Pescoço em si

          // Corrente Metálica Pesada (Detalhe de link por link)
          box(jX + 19, 12, 2, 5, SILVER_DK); 
          headDot(jX + 19, 12, SILVER_LT); 
          headDot(jX + 20, 13, SILVER_MD); 
          headDot(jX + 19, 14, SILVER_LT); 
          headDot(jX + 20, 15, SILVER_MD); 
          headDot(jX + 19, 16, SILVER_LT); 

          // Botões Dourados do Lado Direito do Gakuran
          headDot(jX + 21, 15, GOLD_MD);
          headDot(jX + 21, 17, GOLD_MD);
          headDot(jX + 21, 19, GOLD_MD);

          // Cintos Ultra Detalhados
          box(jX + 10, 22, 12, 3, COAT_DK); // Fundo sombreado
          box(jX + 11, 22, 10, 1, BELT_GREEN); // Cinto Cima
          box(jX + 10, 24, 12, 1, BELT_RED); // Cinto Baixo
          
          // Dupla Fivelagem
          box(jX + 12, 22, 4, 3, GOLD_DK); // Fivela Maior Base
          box(jX + 13, 22, 2, 2, GOLD_LT); // Fivela Maior Brilho
          box(jX + 17, 23, 2, 2, SILVER_MD); // Segunda Fivela
          headDot(jX + 17, 23, SILVER_LT); 

          // Abas do Casaco (Sistema de Onda Múltipla)
          const cWave = (f % 4 === 1) ? 1 : (f % 4 === 3) ? -1 : 0;
          
          // Aba Traseira (Escura)
          box(jX + 5 + cWave, 20, 4, 12, COAT_DK); 
          box(jX + 6 + cWave, 21, 2, 10, COAT_MD); 
          
          // Aba Frontal (Mais clara, sobrepõe a perna)
          box(jX + 21 + (cWave * -1), 20, 3, 11, COAT_MD); 
          box(jX + 22 + (cWave * -1), 20, 1, 10, COAT_LT); 

          // --- CABELO E CHAPÉU (FUSÃO PERFEITA) ---
          
          // Base total Traseira (Cabelo volumoso + sombra do chapéu)
          headBox(jX + 7, -2, 5, 12, HAIR_DK); 
          
          // Fios espetados na nuca (Pixel Art em zigue-zague)
          headDot(jX + 6, 4, HAIR_MD);
          headDot(jX + 5, 5, HAIR_MD);
          headDot(jX + 6, 6, HAIR_MD);
          headDot(jX + 5, 7, HAIR_MD);
          headDot(jX + 7, 8, HAIR_MD);
          headDot(jX + 19, 1, HAIR_MD); // Espeto solto do lado direito
          
          // Copa do Chapéu
          headBox(jX + 10, -2, 9, 5, COAT_MD); 
          headBox(jX + 11, -2, 7, 1, COAT_HL); // Borda de luz no topo
          
          // Transição gradual (Chapéu -> Cabelo)
          headBox(jX + 8, -1, 2, 5, COAT_DK);
          headBox(jX + 7, 0, 1, 4, HAIR_LT); // Mescla
          
          // Aba icônica chapada frontal
          headBox(jX + 9, 3, 14, 2, COAT_DK); // Sombra da aba grossa
          headBox(jX + 9, 3, 13, 1, COAT_LT); // Edge highlight 
          headDot(jX + 22, 3, COAT_HL); // Ponta extrema da aba brilhando
          
          // Emblemas de Ouro (Formato específico ⚓ e ✋)
          // A Mão (Blocky)
          headBox(jX + 11, 1, 3, 2, GOLD_MD); 
          headDot(jX + 11, 0, GOLD_MD); // Dedos
          headDot(jX + 12, 1, GOLD_LT); // Brilho
          // A Âncora (Cross-like)
          headBox(jX + 16, 1, 3, 2, GOLD_MD); 
          headDot(jX + 17, 0, GOLD_MD); // Haste
          headDot(jX + 17, 1, GOLD_LT); // Brilho

          // --- ROSTO E EXPRESSÃO ---
          headBox(jX + 12, 5, 8, 6, SKIN_MD); // Rosto base
          
          // Sombra Pesada Descente
          headBox(jX + 12, 5, 8, 2, SKIN_DK); 
          
          // Maçãs do Rosto
          headBox(jX + 16, 8, 2, 1, 0xe0a96d); // Leve blush/anatomia
          
          // Olhos Extremamente Afiados Tendo Sombra Sobreposta
          headBox(jX + 13, 7, 2, 1, 0xffffff); // Sclera L
          headBox(jX + 17, 7, 2, 1, 0xffffff); // Sclera R
          headDot(jX + 14, 7, 0x010101); // Íris L Focada
          headDot(jX + 17, 7, 0x010101); // Íris R Focada
          
          // Sobrancelhas Juntas Ferozmente
          headBox(jX + 13, 6, 2, 1, HAIR_DK); 
          headBox(jX + 17, 6, 2, 1, HAIR_DK); 
          headDot(jX + 15, 6, HAIR_DK); // Ponto de união (Carranca)
          
          // Nariz (Ponte)
          headDot(jX + 15, 8, SKIN_DK); 
          
          // Boca
          headBox(jX + 14, 9, 3, 1, 0x8a5a44); // Lábio
          headDot(jX + 14, 9, 0x5c3c2e); // Canto boca carrancuda

          // --- BRAÇOS CROSS/POCKET FIXOS ---
          // Ombros largos Gakuran
          box(jX + 8, 14, 3, 3, COAT_MD); 
          box(jX + 21, 14, 3, 3, COAT_MD); 
          
          // Braços no Bolso Clássicos (Não quebram na animação)
          box(jX + 8, 16, 3, 7, COAT_DK); // Braço trás Base
          box(jX + 9, 17, 1, 5, COAT_MD); // Braço trás Volume
          
          box(jX + 21, 16, 3, 7, COAT_DK); // Braço frente Base
          box(jX + 22, 17, 1, 5, COAT_MD); // Braço frente Volume
          
          // Se for ele atacando (sem ORA ORA ativo)
          if (isAttack && !isTransformed) {
              box(jX + 18, 13, 10, 5, COAT_MD); // Manga estendida
              box(jX + 18, 13, 10, 1, COAT_LT); // Brilho manga
              box(jX + 28, 13, 4, 4, SKIN_MD); // Punho base
              box(jX + 28, 13, 2, 2, SKIN_LT); // Nós do dedo
              box(jX + 8,  14, 4, 8, COAT_DK); // Resta um braço no repouso
          }
          
          break;
        }
`;

// Insert the code exactly where it needs to be
const startIndex = code.indexOf('case "jotaro": {');
const nextCaseIndex = code.indexOf('case "obito": {');

if (startIndex !== -1 && nextCaseIndex !== -1) {
    const newCode = code.substring(0, startIndex) + jotaroReplacement.trim() + "\n        " + code.substring(nextCaseIndex);
    fs.writeFileSync(path, newCode);
    console.log('Jotaro updated to MAXIMUM detail.');
} else {
    console.error('Could not find boundaries.');
}
