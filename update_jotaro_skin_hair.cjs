const fs = require('fs');
const path = './game/scenes/PreloadScene.ts';
let code = fs.readFileSync(path, 'utf-8');

const replacement = `
        case "jotaro": {
          const isTransformed = form > 0;
          
          // --- ULTRA-DETAILED PALETTE ---
          const COAT_DK = 0x0a0a12;
          const COAT_MD = 0x1d1e2c;
          const COAT_LT = 0x2f3042;
          const COAT_HL = 0x4a4b5e;
          
          const SHIRT_DK = 0x240046;
          const SHIRT_MD = 0x5a189a;
          const SHIRT_LT = 0x7b2cbf;
          
          // SKIN: Changed from tan/dark to pale/fair anime skin!
          const SKIN_DK = 0xcdad96;
          const SKIN_MD = 0xffe4c4; 
          const SKIN_LT = 0xfff0e4;
          
          const HAIR_DK = 0x0a0a0f;
          const HAIR_MD = 0x1c1c24;
          const HAIR_LT = 0x333344;
          
          const GOLD_DK = 0xb08d57;
          const GOLD_MD = 0xffd700;
          const GOLD_LT = 0xfffae3;
          const SILVER_DK = 0x6c757d;
          const SILVER_MD = 0xced4da;
          const SILVER_LT = 0xf8f9fa;
          const BELT_GREEN = 0x2d6a4f;
          const BELT_RED = 0x9d0208;

          // SP Palette
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
          }

          // ==========================================
          // === JOTARO KUJO (FIXED SKIN & PANTS) ===
          // ==========================================
          
          // --- PANT & SHOE PROPORTIONS ---
          // Calças finas e elegantes, nunca grossas
          box(jX + 11, 24, 4, 8, COAT_DK); // Perna Esq Escura
          box(jX + 11, 24, 3, 7, COAT_MD); // Perna Esq Interior
          box(jX + 12, 25, 1, 6, COAT_LT); // Highlight Esq
          
          box(jX + 17, 24, 4, 8, COAT_DK); // Perna Dir Escura
          box(jX + 17, 24, 3, 7, COAT_MD); // Perna Dir Interior
          box(jX + 18, 25, 1, 6, COAT_LT); // Highlight Dir

          // Shoes/Loafers curtos e brilhantes
          box(jX + 10, 31, 5, 3, COAT_DK); // Sola Esq
          box(jX + 16, 31, 5, 3, COAT_DK); // Sola Dir
          box(jX + 10, 31, 4, 2, COAT_MD); // Couro Esq
          box(jX + 16, 31, 4, 2, COAT_MD); // Couro Dir
          headDot(jX + 11, 31, COAT_LT); // Brilho Esq
          headDot(jX + 17, 31, COAT_LT); // Brilho Dir

          // --- TRONCO & GAKURAN ---
          // Corpo forte mas na proporção certa
          box(jX + 9, 14, 14, 10, COAT_DK); 
          
          // Camisa Interna 
          box(jX + 12, 14, 8, 9, SHIRT_DK); 
          box(jX + 13, 14, 6, 8, SHIRT_MD); 
          box(jX + 14, 15, 2, 5, SHIRT_LT); // Highlights (Abs/Pecs esq)
          box(jX + 17, 15, 2, 5, SHIRT_LT); // Highlights (Abs/Pecs dir)
          
          // Lapelas Obertas (Gakuran flaps)
          box(jX + 9, 14, 3, 10, COAT_MD); 
          box(jX + 11, 14, 1, 10, COAT_LT); // Borda luz esq
          box(jX + 20, 14, 3, 10, COAT_MD); 
          box(jX + 20, 14, 1, 10, COAT_LT); // Borda luz dir

          // Gola Alta Rigida
          box(jX + 10, 10, 12, 4, COAT_DK); 
          box(jX + 11, 11, 10, 3, COAT_MD); 
          box(jX + 11, 11, 3, 2, COAT_LT); // Brilho gola esq
          box(jX + 18, 11, 3, 2, COAT_LT); // Brilho gola dir
          
          // Pescoço (Pele clara, não morena!)
          box(jX + 14, 12, 4, 2, SKIN_DK); // Sombra do pescoço
          box(jX + 15, 12, 2, 1, SKIN_MD); // Pescoço em si

          // Corrente Metálica em argolas
          box(jX + 19, 12, 2, 5, SILVER_DK); 
          headDot(jX + 19, 12, SILVER_LT); 
          headDot(jX + 20, 13, SILVER_MD); 
          headDot(jX + 19, 14, SILVER_LT); 
          headDot(jX + 20, 15, SILVER_MD); 

          // Botões Dourados do Lado Direito
          headDot(jX + 21, 15, GOLD_MD);
          headDot(jX + 21, 17, GOLD_MD);

          // Cintos Ultra Detalhados
          box(jX + 11, 22, 10, 3, COAT_DK); // Fundo sombreado
          box(jX + 12, 22, 8, 1, BELT_GREEN); // Cinto Cima
          box(jX + 12, 24, 8, 1, BELT_RED); // Cinto Baixo
          
          // Dupla Fivelagem
          box(jX + 13, 22, 3, 3, GOLD_DK); // Fivela Maior Base
          box(jX + 14, 22, 1, 2, GOLD_LT); // Fivela Maior Brilho
          box(jX + 17, 23, 2, 2, SILVER_MD); // Segunda Fivela
          headDot(jX + 17, 23, SILVER_LT); 

          // Abas do Casaco (Movimento das costas)
          const cWave = (f % 4 === 1) ? 1 : (f % 4 === 3) ? -1 : 0;
          box(jX + 6 + cWave, 20, 4, 10, COAT_DK); // Aba Traseira escura
          box(jX + 7 + cWave, 21, 2, 8, COAT_MD); 
          box(jX + 21 + (cWave * -1), 20, 3, 9, COAT_MD); // Aba Frontal
          box(jX + 22 + (cWave * -1), 20, 1, 8, COAT_LT); 

          // --- CHAPÉU & CABELO REFEITOS ---
          // Copa superior do chapéu
          headBox(jX + 10, -2, 9, 5, COAT_MD); 
          headBox(jX + 11, -2, 7, 1, COAT_HL); // Brilho no topo
          
          // Fusão de Cabelo Traseiro (Agora é preto e espetado de verdade, sem bolinhas isoladas)
          headBox(jX + 6, 2, 4, 10, HAIR_DK); // Fundo escuro do cabelo
          headBox(jX + 5, 5, 2, 6, HAIR_MD); // Espeta pra fora
          headBox(jX + 4, 6, 1, 3, HAIR_LT); // Ponta cinza/brilho do cabelo
          headBox(jX + 7, 10, 2, 3, HAIR_MD); // Final desfiado na nuca
          headBox(jX + 21, 2, 2, 4, HAIR_DK); // Espeto sutil lado direito
          
          // Aba do Chapéu (Plana e destacada)
          headBox(jX + 9, 3, 14, 2, COAT_DK); // Sombra da aba grossa
          headBox(jX + 10, 3, 13, 1, COAT_LT); // Edge highlight 
          headDot(jX + 22, 3, COAT_HL); // Ponta extrema da aba brilhando
          
          // Emblemas de Ouro (Mão e Âncora isoladas)
          headBox(jX + 12, 1, 2, 2, GOLD_MD); // Mão menor
          headBox(jX + 16, 1, 2, 2, GOLD_MD); // Âncora menor

          // --- ROSTO E PELE (PELE CLARA DE ANIME) ---
          headBox(jX + 11, 5, 8, 7, SKIN_MD); // Rosto base claro! (Pálido/salmão padrão anime)
          
          // Sombra da Aba cortando os olhos
          headBox(jX + 11, 5, 8, 2, SKIN_DK); 
          
          // Detalhes da face (livrando o excesso de blush)
          headBox(jX + 13, 7, 2, 1, 0xffffff); // Sclera L
          headBox(jX + 16, 7, 2, 1, 0xffffff); // Sclera R
          headDot(jX + 14, 7, 0x010101); // Íris L
          headDot(jX + 17, 7, 0x010101); // Íris R
          
          // Sobrancelhas Unidas
          headBox(jX + 13, 6, 5, 1, HAIR_DK); 
          
          // Boca
          headBox(jX + 14, 10, 3, 1, 0x936652); // Lábios/boca fina séria

          // --- BRAÇOS CROSS/POCKET ---
          box(jX + 8, 14, 3, 3, COAT_MD); // Ombro Trás
          box(jX + 21, 14, 3, 3, COAT_MD); // Ombro Frente
          
          box(jX + 8, 16, 3, 7, COAT_DK); // Braço trás Base
          box(jX + 9, 17, 1, 5, COAT_MD); // Braço trás Volume
          
          box(jX + 21, 16, 3, 7, COAT_DK); // Braço frente Base
          box(jX + 22, 17, 1, 5, COAT_MD); // Braço frente Volume
          
          // Braço de ataque dele
          if (isAttack && !isTransformed) {
              box(jX + 18, 13, 10, 5, COAT_MD); 
              box(jX + 18, 13, 10, 1, COAT_LT); 
              box(jX + 28, 13, 4, 4, SKIN_MD); 
              box(jX + 28, 13, 2, 2, SKIN_LT); 
              box(jX + 8,  14, 4, 8, COAT_DK); 
          }
          
          break;
        }
`;

const startIndex = code.indexOf('case "jotaro": {');
const nextCaseIndex = code.indexOf('case "obito": {');

if (startIndex !== -1 && nextCaseIndex !== -1) {
    const newCode = code.substring(0, startIndex) + replacement.trim() + "\n        " + code.substring(nextCaseIndex);
    fs.writeFileSync(path, newCode);
    console.log('Jotaro skin, hair, and pants fixed.');
} else {
    console.error('Could not find boundaries.');
}
