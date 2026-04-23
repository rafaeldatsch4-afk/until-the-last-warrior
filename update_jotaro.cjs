const fs = require('fs');

const path = './game/scenes/PreloadScene.ts';
let code = fs.readFileSync(path, 'utf-8');

const jotaroReplacement = `
            case 'jotaro': {
                const isTransformed = form > 0;
                
                // --- PALETA DEFINITIVA (Anime Stardust Crusaders) ---
                const COAT = 0x111118;      // Preto profundo (lã)
                const COAT_MID = 0x242436;  // Sombreamento/textura do casaco
                const COAT_LT = 0x3d3d5c;   // Reflexos dinâmicos
                const SHIRT = 0x8a2be2;     // Camisa roxa
                const SHIRT_SH = 0x5a189a;  // Sombra camisa
                const SKIN = 0xffe4c4;      // Pele anime salmão claro
                const SKIN_SH = 0xcdba96;   // Sombra da pele
                const HAIR = 0x0f0f15;      // Cabelo preto com volume
                const VOL_HAIR = 0x252530;  // Destaques de cabelo espetado
                const GOLD = 0xffd700;      // Ouro emblemático
                const BELT1 = 0x2e8b57;     // Cinto verde/amarelo marinho
                const BELT2 = 0xb22222;     // Cinto vermelho vivo
                const SILVER = 0xdddddf;    // Corrente clara
                const SILVER_SH = 0x888899; // Sombra corrente
                
                const SP_SKIN = 0xba55d3;   // Star Platinum purpura claro
                const SP_SHD = 0x800080;    // SP sombra
                const SP_HAIR = 0x181825;   // Cabelo do stand
                const SP_GOLD = 0xffd700;   // Armadura SP
                const SP_SCARF = 0xdc143c;  // Tanga SP
                const SP_GLOVE = 0x2f4f4f;  // Luvas SP escuro

                const jX = isTransformed ? 10 : 0; // Move Jotaro para a direita para caber o Stand
                
                // ==========================================
                // === STAR PLATINUM ===
                // ==========================================
                if (isTransformed) {
                    const spX = -6;
                    const spY = (f % 2 === 0) ? -2 : 0; // Float animation

                    // Aura
                    alphaBox(spX - 8, spY - 2, 44, 44, SP_SKIN, 0.25);
                    alphaBox(spX - 4, spY + 2, 36, 36, SP_SKIN, 0.35);

                    // Wild Hair
                    headBox(spX + 2, spY - 10, 24, 18, SP_HAIR); // Base volume
                    headBox(spX + 5, spY - 14, 18, 8, SP_HAIR);  // Top spikes
                    headBox(spX, spY - 6, 8, 10, SP_HAIR);       // Left spikes
                    headBox(spX + 24, spY - 4, 6, 12, SP_HAIR);  // Right spikes
                    
                    // Face
                    headBox(spX + 12, spY, 10, 10, SP_SKIN); 
                    headBox(spX + 11, spY, 12, 3, SP_GOLD); // Headband
                    headDot(spX + 16, spY, 0x00ffff); // Gem
                    
                    headBox(spX + 13, spY + 4, 3, 1, 0x00ffff); // Left eye
                    headBox(spX + 18, spY + 4, 3, 1, 0x00ffff); // Right eye
                    headBox(spX + 15, spY + 7, 5, 2, SP_SHD);   // Mouth

                    // Torso & Muscle Definition
                    box(spX + 8, spY + 10, 18, 14, SP_SKIN);
                    box(spX + 9, spY + 12, 16, 4, 0xdf73ff); // Pec highlights
                    box(spX + 16, spY + 16, 2, 8, SP_SHD);   // Abs line

                    // Giant Round Shoulder Pads
                    box(spX + 2, spY + 8, 8, 8, SP_GOLD);
                    box(spX + 24, spY + 8, 8, 8, SP_GOLD);
                    
                    // Scarf/Loincloth
                    box(spX + 8, spY + 11, 18, 4, SP_SCARF);
                    box(spX + 10, spY + 24, 14, 3, 0xffffff); // White belt
                    box(spX + 14, spY + 27, 6, 8, SP_SCARF);  // Loincloth flag

                    // Legs / Boots
                    box(spX + 11, spY + 27, 5, 5, 0x222233); // Thighs
                    box(spX + 18, spY + 27, 5, 5, 0x222233);
                    box(spX + 10, spY + 32, 6, 4, SP_GOLD); // Boots
                    box(spX + 18, spY + 32, 6, 4, SP_GOLD);

                    // Stand Attack Arms
                    if (isAttack) {
                        headBox(spX + 15, spY + 6, 4, 4, 0x000000); // Shouting mouth ORA
                        
                        // Rush Blur
                        alphaBox(spX + 10, spY + 8, 30, 20, SP_SKIN, 0.4); 
                        
                        const r1 = (f * 5 % 8);
                        const r2 = (f * 7 % 8);
                        
                        box(spX + 18 + r1, spY + 10 + (r2 % 4), 10, 6, SP_GLOVE);
                        box(spX + 24 + r2, spY + 16 - (r1 % 3), 10, 6, SP_GLOVE);
                        
                        box(spX + 26, spY + 13, 8, 6, SP_SKIN); 
                        box(spX + 28, spY + 13, 10, 6, SP_GLOVE); // Solid mega fist
                    } else {
                        // Rest Arms
                        box(spX + 3, spY + 16, 7, 10, SP_SKIN);
                        box(spX + 24, spY + 16, 7, 10, SP_SKIN);
                        box(spX + 2, spY + 24, 9, 6, SP_GLOVE); 
                        box(spX + 23, spY + 24, 9, 6, SP_GLOVE); 
                    }
                }

                // ==========================================
                // === JOTARO KUJO ===
                // ==========================================

                // --- CABELO E CHAPÉU (A TRANSFORMAÇÃO PERFEITA) ---
                // O cabelo traseiro volumoso fundindo com chapéu
                headBox(jX + 7, -2, 7, 14, HAIR); 
                headBox(jX + 4, 2, 4, 8, VOL_HAIR); // Destaques espetados traseiros
                
                // O Chapéu Gakuran inclinado
                headBox(jX + 9, -2, 9, 6, COAT); // Copa do boné bem definida
                headBox(jX + 10, -2, 7, 1, COAT_LT); // Brilho de forma no topo
                
                // Aba do chapéu distinta e angulosa com destaque claro de separação
                headBox(jX + 11, 2, 9, 1, COAT_LT); // Highlight forte da aba
                headBox(jX + 11, 3, 9, 1, COAT);    // Sombra grossa da aba
                
                // Emblemas de ouro detalhados
                headBox(jX + 12, 0, 3, 2, GOLD); // A Mão dourada
                // headDot(jX + 13, 0, 0xffffff);   // Ponto branco de brilho
                headBox(jX + 16, 0, 2, 2, GOLD); // A Ancora dourada

                // --- ROSTO ---
                headBox(jX + 12, 4, 7, 7, SKIN); // Rosto limpo cor de salmão
                headBox(jX + 11, 4, 8, 2, SKIN_SH); // Sombra icônica da aba cortando os olhos
                
                // Blush sutil / Vida
                headBox(jX + 16, 8, 2, 1, 0xfcae91); // Blush bochecha

                // Olhos Estilo Anime (Nítidos e brabos)
                headBox(jX + 13, 6, 2, 2, 0xffffff); // Sclera forte esq
                headBox(jX + 16, 6, 2, 2, 0xffffff); // Sclera forte dir
                headDot(jX + 14, 6, 0x000000); // Íris esq
                headDot(jX + 17, 6, 0x000000); // Íris dir
                headBox(jX + 12, 5, 3, 1, HAIR); // Sobrancelha expressiva esq
                headBox(jX + 16, 5, 3, 1, HAIR); // Sobrancelha expressiva dir
                
                // Boca definida sutil
                headBox(jX + 14, 9, 3, 1, 0x8a5a44); // Lábios superiores expressivos

                // --- TRONCO, GAKURAN & CORRENTE ---
                // Gola alta detalhada e pontuda
                box(jX + 10, 11, 4, 4, COAT); // Traseira
                box(jX + 15, 11, 4, 5, COAT_LT); // Frente iluminada projetada
                
                // Corrente Metálica Pesada com Elo Visível
                box(jX + 16, 12, 2, 6, SILVER); // Base clara
                box(jX + 15, 13, 1, 1, SILVER_SH); // Sombras dos elos
                box(jX + 15, 15, 1, 1, SILVER_SH); 
                box(jX + 17, 14, 1, 1, SILVER_SH); 

                // Casaco longo (Lã Texturizada e Músculos)
                box(jX + 9,  15, 12, 8, COAT); // Base peitoral largo
                box(jX + 10, 16, 3, 6, COAT_MID); // Textura grossa
                box(jX + 14, 15, 2, 8, COAT_LT); // Destaque dobra de lã descendo
                
                // Camisa Interna de Tecido Roxo (triângulo amostra)
                box(jX + 12, 15, 5, 7, SHIRT);  // Cor base
                box(jX + 13, 16, 2, 6, SHIRT_SH); // Sombra do peito
                
                // Cintos e Fivelas Visíveis
                box(jX + 11, 22, 8, 2, BELT1); // Cinto Verde
                box(jX + 11, 24, 8, 2, BELT2); // Cinto Vermelho
                box(jX + 13, 22, 2, 2, GOLD); // Fivela Maior Cinto Verde
                box(jX + 16, 24, 2, 2, SILVER); // Detalhe prateado Cinto Vermelho
                // Costuras dos cintos
                box(jX + 12, 22, 1, 4, 0x111111); 
                box(jX + 15, 22, 1, 4, 0x111111);

                // Abas do Casaco longo (Movimento dinâmico tremulante)
                const capSwing = isAttack ? 5 : (Math.sin(f)*2.5);
                box(jX + 3 - capSwing, 20, 6, 14, COAT); // Aba Traseira tremulando extensamente
                box(jX + 4 - capSwing, 22, 2, 10, COAT_MID); // Shading interior capa
                
                box(jX + 17, 20, 3, 13, COAT); // Aba Frontal sólida caindo reto
                box(jX + 18, 22, 1, 10, COAT_LT); // Brilho da barra

                // --- CALÇAS E SAPATOS ---
                box(jX + 11, 26, 4, 7, COAT); // Perna Esq mais definida
                box(jX + 16, 26, 4, 7, COAT); // Perna Dir
                box(jX + 12, 27, 2, 5, COAT_LT); // Brilho costura perna Esq
                box(jX + 17, 27, 2, 5, COAT_LT); // Brilho costura perna Dir
                
                // Sapatos sociais longos (Loafers elegantes)
                box(jX + 10, 33, 6, 2, COAT_MID); // Sapato Esq
                box(jX + 15, 33, 6, 2, COAT_MID); // Sapato Dir
                box(jX + 11, 33, 2, 1, 0xffffff); // Brilho polido esq
                box(jX + 16, 33, 2, 1, 0xffffff); // Brilho polido dir

                // --- ANIMAÇÃO DE BRAÇOS ---
                if (isTransformed) {
                    // Yare Yare point (Apontada Famosa mais detalhada)
                    box(jX + 17, 15, 10, 4, COAT); // Braço estendido retilíneo
                    box(jX + 18, 16, 8, 2, COAT_LT); // Brilho da manga
                    box(jX + 27, 15, 3, 3, SKIN); // Mão
                    box(jX + 29, 15, 4, 1, SKIN); // O Dedo com ponta fina
                    
                    box(jX + 8,  15, 4, 6, COAT);  // Mão relaxada firmemente no bolso
                } else if (isAttack) {
                    // Punho clássico cerrado
                    box(jX + 16, 14, 9, 5, COAT);
                    box(jX + 25, 14, 6, 5, SKIN); // Punho musculoso exposto
                    box(jX + 8,  15, 4, 7, COAT);  
                } else {
                    // Idle com mão na aba do chapéu 
                    if (f % 2 === 0 && !isDefend) {
                        box(jX + 13, 10, 4, 6, COAT); // Manga erguida 
                        headBox(jX + 12, 6, 3, 3, SKIN); // Dedos segurando com força
                    } else {
                        box(jX + 15, 16, 4, 7, COAT); // Mão no bolso frente
                    }
                    box(jX + 8, 16, 4, 7, COAT); // Mão no bolso traseiro sempre no estilo Badass
                }
                
                break;
            }
`;

const startIndex = code.indexOf("case 'jotaro': {");
const nextCaseIndex = code.indexOf("case 'obito': {");

if (startIndex !== -1 && nextCaseIndex !== -1) {
    const newCode = code.substring(0, startIndex) + jotaroReplacement.trim() + "\n            " + code.substring(nextCaseIndex);
    fs.writeFileSync(path, newCode);
    console.log('Jotaro updated perfectly.');
} else {
    console.error('Could not find boundaries.');
}
