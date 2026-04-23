const fs = require('fs');

const path = './game/scenes/PreloadScene.ts';
let code = fs.readFileSync(path, 'utf-8');

const jotaroHairBad = `          // Fusão de Cabelo Traseiro (Agora é preto e espetado de verdade, sem bolinhas isoladas)
          headBox(jX + 6, 2, 4, 10, HAIR_DK); // Fundo escuro do cabelo
          headBox(jX + 5, 5, 2, 6, HAIR_MD); // Espeta pra fora
          headBox(jX + 4, 6, 1, 3, HAIR_LT); // Ponta cinza/brilho do cabelo
          headBox(jX + 7, 10, 2, 3, HAIR_MD); // Final desfiado na nuca
          headBox(jX + 21, 2, 2, 4, HAIR_DK); // Espeto sutil lado direito`;

code = code.replace(jotaroHairBad, '          // Hair removed user request. Only hat remains.');

// Clean up face shading if needed: "corija o rosto do jotaro" 
// the user might find the face weird. Let's make the face even cleaner.
const faceBad = `          // --- ROSTO E PELE (PELE CLARA DE ANIME) ---
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
          headBox(jX + 14, 10, 3, 1, 0x936652); // Lábios/boca fina séria`;

const faceNew = `          // --- ROSTO SUPER CLEAN ANIME ---
          headBox(jX + 11, 5, 8, 7, SKIN_MD); // Rosto base
          
          // Sombra da Aba mais leve e limpa, menos intrusiva
          headBox(jX + 11, 5, 8, 1, SKIN_DK); 
          
          // Olhos limpos (Estilo Jotaro original bem nítido)
          headBox(jX + 12, 7, 2, 1, 0xffffff); // Sclera L
          headBox(jX + 16, 7, 2, 1, 0xffffff); // Sclera R
          headDot(jX + 13, 7, 0x000000); // Íris L olhando frente
          headDot(jX + 16, 7, 0x000000); // Íris R olhando frente
          
          // Sobrancelhas retas e grossas mas sem se unirem bizarramente
          headBox(jX + 12, 6, 2, 1, HAIR_DK); 
          headBox(jX + 16, 6, 2, 1, HAIR_DK); 
          
          // Boca linha reta sutil
          headBox(jX + 13, 10, 4, 1, 0x000000); // Boca super discreta preta ou marrom escuro`;

code = code.replace(faceBad, faceNew);

fs.writeFileSync(path, code);
