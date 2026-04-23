const fs = require('fs');

const p = 'game/scenes/PreloadScene.ts';
let code = fs.readFileSync(p, 'utf8');

function replaceBlock(oldContent, newContent) {
    const idx = code.indexOf(oldContent);
    if (idx === -1) {
        console.error("Could not find block:\n" + oldContent.substring(0, 100) + "...\n");
        return;
    }
    code = code.replace(oldContent, newContent);
    console.log("Replaced block successfully.");
}

// Scripts start here

// 2. VEGETA
replaceBlock(
`                if (isAttack) {
                    box(21, 15, 12, 3, SUIT_BLUE); // Extended arm right
                    box(21, 16, 12, 1, SUIT_SHADOW); 
                    box(30, 14, 4, 5, ARMOR_WHITE); // extended glove
                    box(34, 15, 2, 3, ARMOR_WHITE); // hand palm
                    box(6, 16, 4, 3, SUIT_BLUE); // Left arm pulled back
                    box(4, 16, 4, 4, ARMOR_WHITE); // Left glove
                } else {`,
`                if (isAttack) {
                    box(21, 14, 12, 3, SUIT_BLUE); // Extended arm right
                    box(21, 14, 12, 1, SUIT_SHADOW); 
                    box(30, 14, 3, 3, ARMOR_WHITE); // extended glove
                    box(33, 14, 3, 3, ARMOR_WHITE); // fist
                    box(6, 15, 3, 5, SUIT_BLUE); // Left arm pulled back
                    box(6, 18, 3, 3, ARMOR_WHITE); // Left glove
                } else {`
);

// 3. PICCOLO
replaceBlock(
`                if (isAttack) {
                    const armCol = skin;
                    const patchCol = isTransformed ? skin : MUSCLE_PINK;
                    box(21, 15, 16, 4, armCol); // Stretchy arm right
                    box(21, 16, 16, 2, patchCol);
                    box(37, 14, 4, 6, 0xbb3333); // Wristband stretched arm
                    box(41, 15, 4, 4, armCol); // Fist
                    box(5, 15, 4, 8, armCol); // Left arm back
                    box(5, 21, 3, 2, 0xbb3333);
                } else {`,
`                if (isAttack) {
                    const armCol = skin;
                    const patchCol = isTransformed ? skin : MUSCLE_PINK;
                    box(21, 14, 16, 3, armCol); // Stretchy arm right
                    box(21, 14, 16, 1, patchCol);
                    box(35, 14, 2, 3, 0xbb3333); // Wristband stretched arm
                    box(37, 14, 3, 3, armCol); // Fist
                    box(6, 15, 3, 6, armCol); // Left arm back
                    box(6, 19, 3, 2, 0xbb3333); // Wristband left
                } else {`
);

// 4. GOHAN
replaceBlock(
`                if (isAttack) {
                    // Masenko/Kamehameha hands together forward
                    box(11, 16, 14, 4, GI_PURPLE); // Left/Right arm pulled
                    box(11, 16, 14, 1, GI_SHADOW);
                    box(25, 15, 3, 6, WRISTBAND_RED); // wristbands together
                    box(28, 16, 4, 4, SKIN); // Hands together firing
                } else {`,
`                if (isAttack) {
                    // Kamehameha hands together forward
                    box(21, 14, 10, 3, GI_PURPLE); // arms stretched
                    box(21, 14, 10, 1, GI_SHADOW);
                    box(29, 14, 2, 3, WRISTBAND_RED); // wristbands
                    box(31, 14, 3, 3, SKIN); // Hands together firing
                    box(6, 14, 3, 5, GI_PURPLE); // left arm back
                    box(6, 18, 3, 2, WRISTBAND_RED);
                } else {`
);

// 5. CELL
replaceBlock(
`                if (isAttack) {
                    // Kamehameha ready / outstretched arm
                    box(7, 14, 4, 3, GREEN); box(21, 14, 4, 3, GREEN); 
                    box(18, 16, 12, 4, GREEN); // Right arm extended
                    box(28, 15, 3, 6, BLACK_S); // Lower arm extended
                    box(31, 16, 4, 4, PALE); // Hand
                    box(4, 16, 4, 4, GREEN); // Left arm pulled
                } else {`,
`                if (isAttack) {
                    box(21, 14, 12, 3, GREEN); // Right arm extended
                    box(31, 14, 2, 3, BLACK_S); // Lower arm band
                    box(33, 14, 3, 3, PALE); // Hand
                    box(6, 15, 3, 5, GREEN); // Left arm pulled
                } else {`
);

// 6. CYBERNINJA (and Minnipekka if needed, but only checking Cyberninja now)
replaceBlock(
`                if (isAttack) {
                    box(8, 14, 3, 5, SUIT_MAIN); // Left arm
                    box(21, 14, 10, 3, SUIT_MAIN); // Right arm out
                    box(31, 14, 3, 3, SKIN_PALE); // Right lower arm out
                    box(34, 14, 3, 2, SUIT_DARK); // Right glove
                    box(8, 19, 3, 4, SKIN_PALE); box(8, 21, 3, 2, SUIT_DARK); // Left normal
                } else {`,
`                if (isAttack) {
                    box(21, 14, 10, 3, SUIT_MAIN); // Right arm out
                    box(30, 14, 2, 3, SKIN_PALE); // bare lower arm
                    box(32, 14, 3, 3, SUIT_DARK); // Right glove/fist
                    box(6, 15, 3, 5, SUIT_MAIN); // Left arm pulled
                    box(6, 19, 3, 3, SUIT_DARK); // Left glove
                } else {`
);

// 7. LEONARDO
replaceBlock(
`                if (isAttack) {
                    box(8, 14, 3, 8, GREEN); box(21, 14, 10, 3, GREEN); // Right arm striking
                    box(26, 14, 2, 3, PAD); box(29, 14, 2, 3, PAD); // Wrist wraps stretched
                    // Katana extended in hand!
                    box(30, 15, 14, 2, STEEL); // Blade out
                    box(30, 16, 14, 1, 0x7f8c8d); // Blade shading
                    box(21, 14, 1, 3, GREEN_SHADOW); 
                } else {`,
`                if (isAttack) {
                    box(21, 14, 10, 3, GREEN); // Right arm striking
                    box(28, 14, 3, 3, PAD); // Wrist wraps stretched
                    // Katana extended in hand!
                    box(31, 14, 14, 2, STEEL); // Blade out
                    box(31, 15, 14, 1, 0x7f8c8d); // Blade shading
                    box(31, 14, 3, 3, GREEN); // Fist holding sword
                    box(6, 15, 3, 5, GREEN); // left arm back
                } else {`
);

// 8. FRIEREN
replaceBlock(
`                if (isAttack) {
                    box(8, 14, 3, 8, COAT); box(21, 14, 10, 3, COAT); // extend arm
                    box(21, 14, 10, 1, COAT_SHADOW);
                    box(29, 14, 2, 3, TIGHTS); // glove extended
                    // Make her hold her staff out in front
                    box(30, 2, 2, 20, 0x8b4513); // Staff pole front
                    box(29, 0, 4, 3, GOLD); // Staff top
                    dot(30, -1, 0xe74c3c); // Red gem
                } else {`,
`                if (isAttack) {
                    box(21, 14, 10, 3, COAT); // Right arm
                    box(21, 14, 10, 1, COAT_SHADOW);
                    box(29, 14, 2, 3, TIGHTS); // Cuff
                    box(31, 14, 3, 3, SKIN); // Hand
                    
                    // Staff in front
                    box(32, 2, 2, 20, 0x8b4513); // Staff pole front
                    box(31, 0, 4, 3, GOLD); // Staff top
                    dot(32, -1, 0xe74c3c); // Red gem
                    
                    box(6, 15, 3, 6, COAT); // Left arm back
                } else {`
);

// 9. OPTIMUS
replaceBlock(
`                    if (isAttack) {
                        // Right arm blasting / punching, Left arm back
                        box(23, 12, 4, 8, RED); box(22, 11, 6, 4, RED_SHADOW);
                        box(23, 15, 12, 4, BLUE); // Extending arm right
                        box(35, 14, 2, 6, BLUE_SHADOW); // Hand
                        
                        box(4, 14, 6, 6, RED); // Left shoulder pulled back
                        box(4, 18, 4, 5, BLUE); // Left forearm
                    } else {`,
`                    if (isAttack) {
                        // Right arm blasting / punching
                        box(21, 12, 12, 4, RED); // Arm extended
                        box(21, 12, 12, 1, RED_SHADOW);
                        box(33, 12, 4, 4, BLUE); // Fist/cannon
                        
                        box(6, 13, 4, 6, RED); // Left arm back
                        box(6, 18, 3, 3, BLUE);
                    } else {`
);

// 10. NARUTO
replaceBlock(
`                if (isAttack) {
                    // Right hand striking forward, Left arm drawn back
                    if (isSageMode) {
                        box(22, 14, 10, 4, RED_COAT); // Right sleeve out
                        box(32, 14, 4, 4, skinColor); // Hand out
                        box(4, 14, 4, 6, RED_COAT); // Left held back
                    } else {
                        box(21, 14, 10, 3, suitColor); // Right arm out
                        box(31, 14, 4, 3, skinColor); // Hand out
                        box(6, 14, 3, 6, suitColor); // Left held back
                    }
                } else {`,
`                if (isAttack) {
                    if (isSageMode) {
                        box(21, 14, 10, 3, RED_COAT);
                        box(30, 14, 2, 3, suitColor);
                        box(32, 14, 3, 3, skinColor);
                        box(5, 15, 3, 5, RED_COAT);
                    } else {
                        box(21, 14, 10, 3, suitColor); // Right arm out
                        box(31, 14, 3, 3, skinColor); // Hand out
                        box(6, 15, 3, 5, suitColor); // Left held back
                    }
                } else {`
);

// 11. CHAPOLIM (Hammer swinging)
replaceBlock(
`                if (isAttack) {
                    box(21, 14, 12, 3, RED); // Right arm swinging mallet
                    box(21, 14, 1, 3, RED_SHADOW); 
                    box(33, 14, 3, 2, SKIN); // Hand holding mallet horizontally
                    
                    box(8, 14, 3, 7, RED); // Left arm
                    box(8, 21, 3, 2, SKIN); 
                } else {`,
`                if (isAttack) {
                    box(21, 14, 10, 3, RED); // Right arm out
                    box(21, 14, 10, 1, RED_SHADOW); 
                    box(31, 14, 3, 3, SKIN); // Hand
                    
                    box(6, 15, 3, 5, RED); // Left arm back
                    box(6, 20, 3, 2, SKIN); 
                } else {`
);
replaceBlock(
`                if (isAttack) {
                    const malletX = 35; 
                    const malletY = 15;
                    box(malletX, malletY - 6, 2, 12, YELLOW); // Handle horizontal
                    box(malletX+2, malletY - 2, 8, 5, RED); // Head
                    box(malletX+3, malletY - 1, 6, 3, YELLOW); // yellow side
                } else {`,
`                if (isAttack) {
                    const malletX = 33; 
                    const malletY = 14;
                    box(malletX, malletY - 6, 2, 12, YELLOW); // Handle
                    box(malletX+2, malletY - 2, 8, 5, RED); // Head
                    box(malletX+3, malletY - 1, 6, 3, YELLOW); // Side
                } else {`
);


// 12. BATMAN
replaceBlock(
`                if (isAttack) {
                    box(22, 14, 10, 3, SUIT_GREY); // Right arm throwing
                    box(22, 14, 1, 3, SUIT_SHADOW); 
                    box(28, 13, 5, 4, BLACK); // Gauntlet
                    box(28, 14, 5, 2, 0x000000); // Gauntlet shadow
                    box(33, 14, 2, 2, SKIN); // Hand
                    box(35, 14, 4, 1, 0x555555); box(35, 15, 3, 1, 0x555555); // Batarang
                    
                    box(7, 14, 3, 7, SUIT_GREY); // Left arm pulled
                    box(6, 18, 4, 5, BLACK);
                } else {`,
`                if (isAttack) {
                    box(21, 14, 10, 3, SUIT_GREY); // Right arm throwing
                    box(21, 14, 10, 1, SUIT_SHADOW); 
                    box(28, 14, 3, 3, BLACK); // Gauntlet
                    box(31, 14, 3, 3, SKIN); // Hand
                    box(34, 15, 4, 1, 0x555555); // Batarang
                    
                    box(6, 15, 3, 5, SUIT_GREY); // Left arm pulled
                    box(6, 20, 3, 3, BLACK); // Left glove
                } else {`
);

// 13. THUKUNA
replaceBlock(
`                    if (isAttack) {
                        box(20, 14, 12, 3, SKIN); // Right main arm extending
                        box(20, 14, 1, 3, SKIN_SHADOW);
                        box(25, 14, 1, 3, TATTOO); box(28, 14, 1, 3, TATTOO);
                        box(9, 14, 3, 7, SKIN); // Left main arm
                    } else {`,
`                    if (isAttack) {
                        box(21, 14, 10, 3, SKIN); // Right main arm extending
                        box(21, 14, 10, 1, SKIN_SHADOW);
                        box(25, 14, 1, 3, TATTOO); box(28, 14, 1, 3, TATTOO);
                        box(31, 14, 3, 3, SKIN); // Fist
                        box(6, 15, 3, 6, SKIN); // Left main arm back
                    } else {`
);
replaceBlock(
`                    if (isAttack) {
                        box(22, 13, 10, 3, ROBE_NORMAL); // Right arm slash
                        box(22, 13, 1, 3, ROBE_NORMAL_SHADOW);
                        box(32, 13, 4, 2, SKIN); // Hand
                        box(32, 13, 4, 1, TATTOO); // Hand tattoo
                        
                        box(7, 14, 3, 7, ROBE_NORMAL); // Left arm
                        box(7, 21, 3, 2, SKIN); 
                    } else {`,
`                    if (isAttack) {
                        box(21, 14, 10, 3, ROBE_NORMAL); // Right arm slash
                        box(21, 14, 10, 1, ROBE_NORMAL_SHADOW);
                        box(31, 14, 3, 3, SKIN); // Fist
                        box(31, 14, 3, 1, TATTOO); // Fist tattoo
                        
                        box(6, 15, 3, 5, ROBE_NORMAL); // Left arm
                        box(6, 20, 3, 3, SKIN); 
                    } else {`
);

// 14. GOJO
replaceBlock(
`                if (isAttack) {
                    box(22, 14, 12, 3, JACKET); // Right hand points fingers
                    box(22, 14, 12, 1, JACKET_SHADOW);
                    box(34, 14, 3, 2, SKIN); // Hand
                    box(7, 14, 3, 8, JACKET); // Left arm resting
                    box(7, 22, 3, 2, SKIN);
                } else {`,
`                if (isAttack) {
                    box(21, 14, 10, 3, JACKET); // Right arm out
                    box(21, 14, 10, 1, JACKET_SHADOW);
                    box(31, 14, 3, 3, SKIN); // Hand points
                    box(6, 15, 3, 5, JACKET); // Left arm back
                } else {`
);

// 15. ITACHI
replaceBlock(
`                    if (isAttack) {
                        // Right arm extended (throwing kunai / jutsu sign)
                        box(20, 14, 10, 4, CLOAK);
                        box(30, 14, 3, 2, SKIN); // Hand
                        box(31, 14, 1, 1, 0x4b0082); // Purple nails
                        box(33, 14, 4, 1, 0xcccccc); // Kunai/shuriken
                        
                        // Left arm close to chest (one-handed sign)
                        box(9, 15, 6, 4, CLOAK);
                        box(12, 16, 2, 2, SKIN);
                        box(12, 16, 1, 1, 0x4b0082); // Purple nails
                    } else {`,
`                    if (isAttack) {
                        // Right arm extended
                        box(21, 14, 10, 3, CLOAK);
                        box(31, 14, 3, 3, SKIN); // Hand
                        box(33, 15, 1, 1, 0x4b0082); // Nails
                        box(34, 15, 4, 1, 0xcccccc); // Kunai
                        
                        // Left arm close
                        box(6, 15, 3, 5, CLOAK);
                    } else {`
);

// 16. OBITO
replaceBlock(
`                    // Arms (Pale skin)
                    // Animate arms during attack
                    const armY = isAttack ? -2 : 0;
                    box(7, 14 + armY, 3, 8, TEN_TAILS_SKIN); box(22, 14 + armY, 3, 8, TEN_TAILS_SKIN);
                    box(7, 14 + armY, 1, 8, TEN_TAILS_SHADOW); box(24, 14 + armY, 1, 8, TEN_TAILS_SHADOW);
                    // Right arm scales (left side of sprite)
                    box(7, 14 + armY, 2, 8, 0xcccccc);
                    box(8, 15 + armY, 1, 1, 0x999999); box(7, 18 + armY, 1, 1, 0x999999);
                    
                    // Hands
                    box(7, 22 + armY, 3, 2, TEN_TAILS_SKIN); box(22, 22 + armY, 3, 2, TEN_TAILS_SKIN);
                    
                    // Shakujo (Staff made of Truth-Seeking Orbs) in right hand
                    if (isAttack) {
                        // Horizontal strike (Paulada)
                        box(2, 22, 22, 2, ORB); // Staff pole
                        box(2, 22, 22, 1, ORB_GLOW); // Staff highlight
                        // Ring at the front (right side)
                        box(24, 19, 2, 8, ORB); // Ring base
                        box(26, 17, 4, 2, ORB); box(26, 27, 4, 2, ORB); // Ring sides
                        box(28, 19, 2, 8, ORB); // Ring front
                    } else {`,
`                    // Arms
                    if (isAttack) {
                        box(21, 14, 10, 3, TEN_TAILS_SKIN);
                        box(21, 14, 10, 1, TEN_TAILS_SHADOW);
                        box(31, 14, 3, 3, TEN_TAILS_SKIN); // Fist
                        
                        box(6, 15, 3, 5, TEN_TAILS_SKIN); // Left arm back
                        box(6, 15, 1, 5, TEN_TAILS_SHADOW);
                        
                        // Horizontal staff
                        box(15, 14, 22, 2, ORB); // Staff pole
                        box(15, 14, 22, 1, ORB_GLOW);
                        // Ring
                        box(36, 11, 2, 8, ORB); // Ring base
                        box(38, 9, 4, 2, ORB); box(38, 19, 4, 2, ORB); // Ring sides
                        box(40, 11, 2, 8, ORB); // Ring front
                    } else {
                        box(8, 14, 3, 8, TEN_TAILS_SKIN); box(21, 14, 3, 8, TEN_TAILS_SKIN);
                        box(8, 14, 1, 8, TEN_TAILS_SHADOW); box(24, 14, 1, 8, TEN_TAILS_SHADOW);
                        box(8, 14, 2, 8, 0xcccccc);
                        box(9, 15, 1, 1, 0x999999); box(8, 18, 1, 1, 0x999999);
                        box(8, 22, 3, 3, TEN_TAILS_SKIN); box(21, 22, 3, 3, TEN_TAILS_SKIN);`
);

replaceBlock(
`                    const armY = isAttack ? -2 : 0;
                    box(5 - flutter, 14 + armY, 5, 10, CLOAK); box(22 + flutter, 14 + armY, 5, 10, CLOAK);
                    box(5 - flutter, 14 + armY, 1, 10, CLOAK_SHADOW); box(26 + flutter, 14 + armY, 1, 10, CLOAK_SHADOW);
                    
                    // Hands (Gloves)
                    box(6 - flutter, 24 + armY, 3, 2, 0x111111); box(23 + flutter, 24 + armY, 3, 2, 0x111111);`,
`                    if (isAttack) {
                        box(21, 14, 10, 4, CLOAK);
                        box(21, 14, 10, 1, CLOAK_SHADOW);
                        box(31, 14, 3, 4, 0x111111); // Glove
                        
                        box(6 - flutter, 15, 4, 6, CLOAK);
                        box(6 - flutter, 21, 3, 3, 0x111111);
                    } else {
                        box(5 - flutter, 14, 4, 10, CLOAK); box(22 + flutter, 14, 4, 10, CLOAK);
                        box(5 - flutter, 14, 1, 10, CLOAK_SHADOW); box(25 + flutter, 14, 1, 10, CLOAK_SHADOW);
                        box(6 - flutter, 24, 3, 3, 0x111111); box(23 + flutter, 24, 3, 3, 0x111111);
                    }`
);


// 17. JOTARO
replaceBlock(
`                if (isAttack && !isTransformed) {
                    // Jotaro pointing/punching
                    box(jX + 20, 14, 12, 4, COAT);
                    box(jX + 20, 14, 12, 1, COAT_HIGHLIGHT);
                    box(jX + 32, 14, 4, 3, SKIN); // Fist
                    box(jX + 32, 16, 4, 1, SKIN_SHADOW);
                    box(jX + 6, 14, 4, 10, COAT); // Left arm resting
                } else {
                    // Left arm in pocket
                    box(jX + 6, 14, 5, 8, COAT);
                    box(jX + 6, 14, 1, 8, COAT_HIGHLIGHT);
                    
                    if (isTransformed) {
                        // Right arm pointing
                        box(jX + 20, 14, 12, 4, COAT);
                        box(jX + 20, 14, 12, 1, COAT_HIGHLIGHT);
                        box(jX + 32, 14, 4, 3, SKIN); // Fist points
                        box(jX + 32, 16, 4, 1, SKIN_SHADOW);
                        box(jX + 36, 14, 4, 1, SKIN); // Finger
                    } else {
                        // Right arm resting
                        box(jX + 20, 14, 5, 8, COAT);
                        box(jX + 20, 14, 1, 8, COAT_HIGHLIGHT); // highlight
                    }
                }`,
`                if (isAttack && !isTransformed) {
                    // Jotaro pointing/punching
                    box(jX + 20, 14, 10, 3, COAT);
                    box(jX + 20, 14, 10, 1, COAT_HIGHLIGHT);
                    box(jX + 30, 14, 3, 3, SKIN); // Fist
                    box(jX + 6, 14, 4, 10, COAT); // Left arm resting
                } else {
                    // Left arm in pocket
                    box(jX + 6, 14, 4, 8, COAT);
                    box(jX + 6, 14, 1, 8, COAT_HIGHLIGHT);
                    
                    if (isTransformed) {
                        // Right arm pointing
                        box(jX + 20, 14, 10, 3, COAT);
                        box(jX + 20, 14, 10, 1, COAT_HIGHLIGHT);
                        box(jX + 30, 14, 3, 3, SKIN); // Fist points
                        box(jX + 33, 14, 3, 1, SKIN); // Finger
                    } else {
                        // Right arm resting
                        box(jX + 21, 14, 4, 8, COAT);
                        box(jX + 21, 14, 1, 8, COAT_HIGHLIGHT); // highlight
                    }
                }`
);

fs.writeFileSync(p, code, 'utf8');
