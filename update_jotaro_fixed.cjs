const fs = require('fs');

const path = './game/scenes/PreloadScene.ts';
let code = fs.readFileSync(path, 'utf-8');

const jotaroReplacement = `
        case "jotaro": {
                const isTransformed = form > 0;
                
                // Color Palette
                const COAT = 0x111118; // Very dark bluish black
                const COAT_MID = 0x222233;
                const COAT_LT = 0x333344;
                const SHIRT = 0x7b2cbf;
                const SHIRT_SH = 0x5a189a;
                const SKIN = 0xffe4c4;
                const SKIN_SH = 0xcdba96;
                const HAIR = 0x0f0f15;
                const GOLD = 0xffd700;
                const BELT1 = 0x1e5631; // Green
                const BELT2 = 0x900c3f; // Red
                const SILVER = 0xced4da;
                const SILVER_SH = 0x6c757d;

                const SP_SKIN = 0xa4508b;
                const SP_SHD = 0x5f0a87;
                const SP_HAIR = 0x1a1a24;
                const SP_GOLD = 0xf9a826;
                const SP_SCARF = 0x9e0059;
                const SP_GLOVE = 0x264653;

                const jX = isTransformed ? 10 : 0; 
                
                // ==========================================
                // === STAR PLATINUM ===
                // ==========================================
                if (isTransformed) {
                    const spX = -8;
                    const spY = (f % 2 === 0) ? -2 : 0; 
                    
                    // Aura
                    alphaBox(spX - 6, spY - 4, 40, 40, SP_SKIN, 0.3);
                    alphaBox(spX - 2, spY, 32, 32, SP_SKIN, 0.4);

                    // Wilder SP Hair
                    headBox(spX - 2, spY - 12, 24, 14, SP_HAIR); 
                    headBox(spX + 4, spY - 16, 12, 6, SP_HAIR); 
                    
                    // Face
                    headBox(spX + 12, spY, 8, 8, SP_SKIN); 
                    headBox(spX + 11, spY, 10, 2, SP_GOLD); // Headband
                    headDot(spX + 15, spY, 0x00ffff); // Gem
                    
                    // Eyes
                    headBox(spX + 13, spY + 3, 2, 1, 0x00ffff);
                    headBox(spX + 17, spY + 3, 2, 1, 0x00ffff);
                    headBox(spX + 14, spY + 6, 4, 1, SP_SHD); // Mouth
                    
                    // Chest & Torso
                    box(spX + 8, spY + 8, 16, 12, SP_SKIN); 
                    box(spX + 10, spY + 10, 12, 4, 0xd473d4); // Pec highlights
                    
                    // Shoulders Gold
                    box(spX + 4, spY + 8, 6, 6, SP_GOLD);
                    box(spX + 22, spY + 8, 6, 6, SP_GOLD);
                    
                    // Scarf/Loincloth
                    box(spX + 8, spY + 10, 16, 3, SP_SCARF); // Neck scarf
                    box(spX + 10, spY + 20, 12, 2, 0xffffff); // White belt
                    box(spX + 13, spY + 22, 6, 6, SP_SCARF); // Loincloth
                    
                    // Legs / Boots
                    box(spX + 11, spY + 22, 4, 5, 0x222233);
                    box(spX + 17, spY + 22, 4, 5, 0x222233);
                    box(spX + 10, spY + 27, 6, 3, SP_GOLD); // Boots
                    box(spX + 16, spY + 27, 6, 3, SP_GOLD);
                    
                    // Arms (ORA ORA mode)
                    if (isAttack) {
                        headBox(spX + 14, spY + 6, 4, 3, 0x000000); // Shouting ORA
                        
                        // Rush Blur
                        alphaBox(spX + 10, spY + 6, 32, 16, SP_SKIN, 0.4); 
                        
                        const r1 = (f * 5 % 8);
                        const r2 = (f * 7 % 8);
                        
                        box(spX + 18 + r1, spY + 8 + (r2 % 4), 8, 4, SP_GLOVE);
                        box(spX + 22 + r2, spY + 14 - (r1 % 3), 8, 4, SP_GLOVE);
                        
                        box(spX + 24, spY + 11, 6, 5, SP_SKIN); // Solid arm
                        box(spX + 28, spY + 10, 8, 6, SP_GLOVE); // Solid fist
                    } else {
                        box(spX + 5, spY + 14, 5, 8, SP_SKIN);
                        box(spX + 22, spY + 14, 5, 8, SP_SKIN);
                        box(spX + 4, spY + 21, 7, 4, SP_GLOVE); 
                        box(spX + 21, spY + 21, 7, 4, SP_GLOVE); 
                    }
                }

                // ==========================================
                // === JOTARO KUJO ===
                // ==========================================
                
                // --- CALÇAS E SAPATOS ---
                box(jX + 11, 25, 4, 7, COAT); // Perna Esq
                box(jX + 17, 25, 4, 7, COAT); // Perna Dir
                box(jX + 10, 32, 5, 2, COAT_MID); // Sapato Esq
                box(jX + 17, 32, 5, 2, COAT_MID); // Sapato Dir

                // --- TRONCO, GAKURAN & CORRENTE ---
                // Gola alta
                box(jX + 9, 11, 14, 4, COAT); 
                box(jX + 13, 12, 6, 3, SKIN_SH); // Neck shadow
                
                // Corrente Metálica Pesada
                box(jX + 19, 12, 2, 5, SILVER); 
                box(jX + 19, 13, 1, 1, SILVER_SH); 
                box(jX + 19, 15, 1, 1, SILVER_SH); 

                // Casaco longo (Corpo)
                box(jX + 10, 15, 12, 10, COAT); 
                
                // Camisa Interna de Tecido Roxo (triângulo amostra)
                box(jX + 13, 15, 6, 8, SHIRT);  
                box(jX + 14, 16, 4, 7, SHIRT_SH); 
                
                // Cintos 
                box(jX + 11, 23, 10, 1, BELT1); // Cinto Verde
                box(jX + 11, 24, 10, 1, BELT2); // Cinto Vermelho
                box(jX + 14, 23, 2, 2, GOLD); // Fivela
                box(jX + 17, 24, 2, 1, SILVER); // Fivela prateada
                
                // Abas do Casaco (Movimento dinâmico)
                const fMove = isAttack ? 3 : (f % 2 === 0 ? 0 : 2);
                box(jX + 7 - Math.floor(fMove/2), 19, 4, 11, COAT); // Aba Traseira
                box(jX + 21 + Math.floor(fMove/2), 19, 3, 11, COAT); // Aba Frontal

                // --- CABELO E CHAPÉU (A TRANSFORMAÇÃO PERFEITA) ---
                // O Chapéu Gakuran inclinado
                headBox(jX + 10, -1, 9, 4, COAT); // Copa do boné bem definida
                
                // O cabelo fundido
                headBox(jX + 7, 1, 4, 9, HAIR); 
                headBox(jX + 6, 6, 2, 5, HAIR); // Back spikes
                
                // Aba do chapéu distinta e angulosa com destaque claro de separação
                headBox(jX + 10, 3, 12, 2, COAT_MID); // Highlight forte da aba
                headBox(jX + 10, 4, 12, 1, COAT);    // Sombra grossa da aba
                
                // Emblemas de ouro detalhados
                headBox(jX + 12, 1, 3, 2, GOLD); // A Mão dourada
                headBox(jX + 17, 1, 2, 2, GOLD); // A Ancora dourada

                // --- ROSTO ---
                headBox(jX + 12, 5, 8, 7, SKIN); 
                headBox(jX + 12, 5, 8, 2, SKIN_SH); // Sombra da aba
                
                // Olhos Estilo Anime (Nítidos)
                headBox(jX + 13, 7, 2, 1, 0xffffff); // Sclera forte esq
                headBox(jX + 17, 7, 2, 1, 0xffffff); // Sclera forte dir
                headDot(jX + 14, 7, 0x000000); // Íris esq
                headDot(jX + 17, 7, 0x000000); // Íris dir
                headBox(jX + 13, 6, 2, 1, HAIR); // Sobrancelha expressiva esq
                headBox(jX + 17, 6, 2, 1, HAIR); // Sobrancelha expressiva dir
                
                // Boca 
                headBox(jX + 15, 10, 3, 1, 0x8a5a44); 

                // --- ANIMAÇÃO DE BRAÇOS ---
                if (isTransformed) {
                    // Yare Yare point (Apontada Famosa)
                    box(jX + 18, 14, 10, 3, COAT); 
                    box(jX + 28, 14, 3, 3, SKIN); // Mão
                    box(jX + 31, 14, 3, 1, SKIN); // O Dedo com ponta fina
                    
                    box(jX + 8,  15, 3, 7, COAT);  // Mão relaxada firmemente no bolso
                } else if (isAttack) {
                    // Punho clássico
                    box(jX + 18, 14, 8, 4, COAT);
                    box(jX + 26, 14, 5, 4, SKIN); // Punho musculoso 
                    box(jX + 8,  15, 4, 5, COAT);  
                } else {
                    // Idle com mão na aba do chapéu 
                    if (f % 2 === 0 && !isDefend) {
                        box(jX + 14, 10, 4, 5, COAT); // Manga erguida 
                        headBox(jX + 13, 6, 3, 3, SKIN); // Dedos segurando com força
                    } else {
                        box(jX + 16, 16, 4, 6, COAT); // Mão no bolso frente
                    }
                    box(jX + 8, 16, 3, 6, COAT); // Mão no bolso traseiro
                }
                
                break;
            }
`;

const startIndex = code.indexOf('case "jotaro": {');
const nextCaseIndex = code.indexOf('case "obito": {');

if (startIndex !== -1 && nextCaseIndex !== -1) {
    const newCode = code.substring(0, startIndex) + jotaroReplacement.trim() + "\n        " + code.substring(nextCaseIndex);
    fs.writeFileSync(path, newCode);
    console.log('Jotaro fixed flawlessly.');
} else {
    console.error('Could not find boundaries.');
}
