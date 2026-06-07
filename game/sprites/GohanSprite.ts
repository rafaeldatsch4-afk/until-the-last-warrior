import Phaser from "phaser";

export function generateGohanSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "gohan";

        const isSSJ = form === 1;
        const isBeast = form === 2;
        const isTransformed = form > 0;
        
        const SCALE = 2;
        const FRAME_WIDTH = 96;
        const FRAME_HEIGHT = 64; 
        const DRAW_OFFSET_Y = 32; 
        const FRAMES = 12;

        const sheetWidth = FRAME_WIDTH * SCALE * FRAMES;
        const sheetHeight = FRAME_HEIGHT * SCALE;

        const canvas = scene.make.graphics({ x: 0, y: 0 });
        const shiftX = 32;

        for (let f = 0; f < FRAMES; f++) {
            const offsetX = f * FRAME_WIDTH;
            const isWalk = f >= 4 && f <= 7;
            const isAttack = f === 8 || f === 9;
            const isDefend = f === 10;
            const isCharge = f === 11;

            const breatheOffset = (!isAttack && !isDefend && !isCharge && !isWalk && (f === 1 || f === 3)) ? 1 : 0;
            const poseOffsetX = f === 8 ? 2 : f === 9 ? 4 : f === 10 ? -2 : 0;
            const poseOffsetY = f === 8 ? 2 : f === 9 ? 0 : f === 10 ? 2 : f === 11 ? 4 : (isWalk && (f===5 || f===7)) ? -1 : 0;

            const getWalkOffsets = (x: number, y: number, isRightArm: boolean = false, isRightLeg: boolean = false, isLeftArm: boolean = false, isLeftLeg: boolean = false) => {
                if (!isWalk) return { ox: 0, oy: 0 };
                const wIndex = f - 4;
                let ox = 0, oy = 0;
                
                if (isLeftLeg) {
                    if (wIndex === 0) { ox = 1; oy = -1; }
                    else if (wIndex === 1) { ox = 3; oy = -2; }
                    else if (wIndex === 2) { ox = 0; oy = 0; }
                    else if (wIndex === 3) { ox = -3; oy = 0; }
                } else if (isRightLeg) {
                    if (wIndex === 0) { ox = -2; oy = 0; }
                    else if (wIndex === 1) { ox = -4; oy = 0; }
                    else if (wIndex === 2) { ox = -1; oy = -1; }
                    else if (wIndex === 3) { ox = 2; oy = -2; }
                } else if (isLeftArm) {
                    if (wIndex === 0) { ox = -2; oy = 0; }
                    else if (wIndex === 1) { ox = -4; oy = -1; }
                    else if (wIndex === 2) { ox = 0; oy = 0; }
                    else if (wIndex === 3) { ox = 2; oy = 0; }
                } else if (isRightArm) {
                    if (wIndex === 0) { ox = 2; oy = 0; }
                    else if (wIndex === 1) { ox = 4; oy = -1; }
                    else if (wIndex === 2) { ox = 0; oy = 0; }
                    else if (wIndex === 3) { ox = -2; oy = 0; }
                }
                return { ox, oy };
            };

            const drawRect = (x: number, y: number, w: number, h: number, color: number, alpha: number = 1, partType: string = 'body') => {
                let py = y;
                // apply breathing to upper body
                if (breatheOffset !== 0 && (partType === 'body' || partType === 'head' || partType === 'leftArm' || partType === 'rightArm')) {
                    py += breatheOffset;
                }
                
                let px = x;
                // apply pose offset
                if ((isAttack || isDefend || isCharge) && partType !== 'aura') {
                    px += Math.floor(poseOffsetX / 2);
                    py += Math.floor(poseOffsetY / 2);
                }

                // walk offsets
                let ox = 0, oy = 0;
                if (partType === 'leftLeg') {
                    const off = getWalkOffsets(x, y, false, false, false, true);
                    ox = off.ox; oy = off.oy;
                } else if (partType === 'rightLeg') {
                    const off = getWalkOffsets(x, y, false, true, false, false);
                    ox = off.ox; oy = off.oy;
                } else if (partType === 'leftArm') {
                    const off = getWalkOffsets(x, y, false, false, true, false);
                    ox = off.ox; oy = off.oy;
                } else if (partType === 'rightArm') {
                    const off = getWalkOffsets(x, y, true, false, false, false);
                    ox = off.ox; oy = off.oy;
                }

                const finalX = Math.floor(px + shiftX + ox);
                const finalY = Math.floor(py + DRAW_OFFSET_Y + oy);

                canvas.fillStyle(color, alpha);
                canvas.fillRect(Math.floor((offsetX + finalX) * SCALE), Math.floor(finalY * SCALE), Math.floor(w * SCALE), Math.floor(h * SCALE));
            };

            const SKIN = 0xffd1a3;
            const SKIN_SHADOW = 0xd9a073;
            const SKIN_DARK = 0xb3764d;
            const WHITE = 0xffffff;
            const BLACK = 0x181818;

            const GI_PURPLE = 0x56236b; 
            const GI_SHADOW = 0x3d174d;
            const GI_DARK = 0x270d30;
            const SASH_RED = 0xc42e23;
            const SASH_SHADOW = 0x8a1b12;
            const SHOE_BROWN = 0x8f4d26;
            const SHOE_LIGHT = 0xbd7142;
            const SHOE_DARK = 0x54260d;
            const WRISTBAND_RED = 0xc42e23;
            const WRISTBAND_SHADOW = 0x8a1b12;

            const HAIR_BASE = BLACK;
            const HAIR_SSJ = 0xffe600; 
            const HAIR_BEAST = 0xf0f4f8; 

            const EYE_BASE = BLACK;
            const EYE_SSJ = 0x33ffcc; 
            const EYE_BEAST = 0xff1a1a; 

            const hairColor = isBeast ? HAIR_BEAST : isSSJ ? HAIR_SSJ : HAIR_BASE;
            const eyeColor = isBeast ? EYE_BEAST : isSSJ ? EYE_SSJ : EYE_BASE;
            const hairShadow = isBeast ? 0xc2cbd4 : isSSJ ? 0xc7aa00 : 0x303030;

            const drawAura = (x: number, y: number, w: number, h: number, color: number, alpha: number) => {
                drawRect(x, y, w, h, color, alpha, 'aura');
            };

            // 1. BACK AURA
            if (isTransformed && !isWalk) {
                // Shared aura logic
                let a1, a2, a3, c1, c2, c3;
                if (isBeast) { // Beast aura: red/purple/silver
                    c1 = 0x8a2be2; a1 = 0.4;
                    c2 = 0xdc143c; a2 = 0.5;
                    c3 = 0xcce0ff; a3 = 0.6;
                } else { // SSJ aura: golden
                    c1 = 0xffa500; a1 = 0.3;
                    c2 = 0xffd700; a2 = 0.5;
                    c3 = 0xffffe0; a3 = 0.6;
                }
                
                let bob = (f%4) * 2 - 2;
                
                // Base thick aura
                drawAura(-2, -18 + bob, 36, 52 - bob, c1, a1);
                drawAura(2, -26 - bob, 28, 60 + bob, c1, a1);
                
                drawAura(4, -14 - bob, 24, 46 + bob, c2, a2);
                drawAura(6, -20 + bob, 20, 52 - bob, c2, a2);
                
                drawAura(8, -10 + bob, 16, 40 - bob, c3, a3);
                
                // Particles / lightning
                if (isBeast) {
                    canvas.fillStyle(0x00bfff, 0.9);
                    if (f%3===0) { drawAura(-5, 0, 4, 18, 0x00bfff, 0.8); drawAura(28, 15, 6, 2, 0x00bfff, 0.8); }
                    if (f%3===1) { drawAura(-2, -20, 20, 4, 0x00bfff, 0.8); drawAura(30, 0, 4, 20, 0x00bfff, 0.8); }
                    if (f%3===2) { drawAura(10, 20, 20, 4, 0x00bfff, 0.8); drawAura(2, 5, 2, 8, 0x00bfff, 0.8); }
                } else if (isSSJ) {
                    if (f%2===0) { drawAura(-2, 10, 4, 4, 0xffffff, 0.8); drawAura(28, -5, 4, 4, 0xffffff, 0.8); }
                    else { drawAura(0, -10, 4, 4, 0xffffff, 0.8); drawAura(26, 20, 4, 4, 0xffffff, 0.8); }
                }
            }

            // 2. BACK LEG / ARM (LEFT)
            if (isAttack) {
                if (f === 8) { // Kamehameha charge back
                    drawRect(4, 15, 6, 5, GI_PURPLE, 1, 'leftArm');
                    drawRect(4, 15, 6, 2, GI_SHADOW, 1, 'leftArm');
                    drawRect(2, 19, 5, 4, SKIN, 1, 'leftArm');
                    drawRect(-1, 21, 4, 3, SKIN, 1, 'leftArm'); // hand cupped
                } else if (f === 9) { // Kamehameha fire
                    drawRect(4, 15, 10, 4, GI_PURPLE, 1, 'leftArm');
                    drawRect(14, 15, 5, 3, SKIN, 1, 'leftArm');
                    drawRect(18, 14, 4, 4, SKIN, 1, 'leftArm'); // palm open
                }
            } else if (isDefend) {
                // Block left arm
                drawRect(6, 17, 6, 4, GI_PURPLE, 1, 'leftArm');
                drawRect(12, 17, 8, 4, SKIN, 1, 'leftArm');
                drawRect(20, 16, 4, 5, SKIN, 1, 'leftArm'); // fist tight
            } else if (isCharge) {
                drawRect(2, 17, 5, 6, GI_PURPLE, 1, 'leftArm');
                drawRect(0, 22, 4, 5, SKIN, 1, 'leftArm');
                drawRect(-1, 26, 4, 4, SKIN, 1, 'leftArm'); // fist clenched
            } else {
                // Idle / Walk Left Arm
                drawRect(10, 14, 4, 6, GI_PURPLE, 1, 'leftArm');
                drawRect(10, 15, 2, 4, GI_SHADOW, 1, 'leftArm'); // shading
                drawRect(10, 19, 4, 4, SKIN, 1, 'leftArm');
                drawRect(10, 19, 2, 4, SKIN_SHADOW, 1, 'leftArm');
                drawRect(10, 22, 4, 2, WRISTBAND_RED, 1, 'leftArm');
                drawRect(10, 24, 4, 3, SKIN, 1, 'leftArm'); // fist
            }

            // Left Leg
            let lLx = 12;
            let lLy = isCharge ? 25 : 22;
            let lShadow = GI_SHADOW;
            if (isDefend) { lLx = 10; lLy = 23; }
            if (isAttack && f === 8) { lLx = 10; lLy = 23; }
            if (isAttack && f === 9) { lLx = 8; lLy = 22; }

            drawRect(lLx, lLy, 6, 8, GI_DARK, 1, 'leftLeg'); // deep shadow for back leg
            drawRect(lLx+1, lLy+1, 4, 7, GI_PURPLE, 1, 'leftLeg');
            drawRect(lLx+2, lLy, 2, 8, GI_SHADOW, 1, 'leftLeg'); // fold
            // Shoe L
            drawRect(lLx-1, lLy+8, 6, 4, SHOE_BROWN, 1, 'leftLeg');
            drawRect(lLx, lLy+8, 4, 1, SHOE_LIGHT, 1, 'leftLeg');
            drawRect(lLx-1, lLy+11, 6, 1, SHOE_DARK, 1, 'leftLeg');

            // 3. BODY
            // Chest
            let bx = 12, by = 13, bw = 10, bh = 10;
            if (isCharge) by = 15;
            if (isDefend) { bx = 14; by = 14; bw = 8; bh = 10; }
            
            drawRect(bx, by, bw, bh, GI_PURPLE, 1, 'body');
            drawRect(bx+1, by+1, bw-2, bh-2, GI_SHADOW, 1, 'body');
            drawRect(bx+bw-3, by+2, 2, bh-4, GI_DARK, 1, 'body'); // side shading

            // Neck / Chest exposed
            drawRect(bx+1, by, 5, 3, SKIN_SHADOW, 1, 'body');
            drawRect(bx+2, by, 3, 2, SKIN, 1, 'body');

            // Sash
            drawRect(bx-1, by+bh-1, bw+2, 3, SASH_SHADOW, 1, 'body');
            drawRect(bx-1, by+bh-1, bw+2, 2, SASH_RED, 1, 'body');
            // Knot
            drawRect(bx-1, by+bh, 3, 4, SASH_RED, 1, 'body');
            drawRect(bx-2, by+bh+1, 2, 4, SASH_RED, 1, 'body');
            drawRect(bx-1, by+bh+1, 2, 3, SASH_SHADOW, 1, 'body'); // Knot shade

            // 4. HEAD
            let hx = 11, hy = 4;
            if (isCharge) hy = 8;
            if (isDefend) { hx = 12; hy = 6; }
            if (isAttack && f===8) { hx=10; hy=5; }
            if (isAttack && f===9) { hx=13; hy=6; }
            
            // Base Face
            drawRect(hx, hy+2, 10, 8, SKIN_SHADOW, 1, 'head');
            drawRect(hx+1, hy+2, 8, 7, SKIN, 1, 'head');
            drawRect(hx+2, hy+6, 1, 1, SKIN_DARK, 1, 'head'); // cheek line
            drawRect(hx+8, hy+6, 1, 1, SKIN_DARK, 1, 'head'); // cheek line
            if (isCharge || isAttack) drawRect(hx+4, hy+7, 2, 1, 0x440000, 1, 'head'); // mouth open
            else drawRect(hx+4, hy+7, 2, 1, SKIN_DARK, 1, 'head'); // smirk
            
            drawRect(hx+4, hy+5, 1, 1, SKIN_DARK, 1, 'head'); // nose
            
            // Ears
            drawRect(hx-1, hy+4, 2, 3, SKIN, 1, 'head');
            drawRect(hx-1, hy+5, 1, 1, SKIN_DARK, 1, 'head');
            drawRect(hx+9, hy+4, 2, 3, SKIN, 1, 'head');
            
            // Eyes
            drawRect(hx+2, hy+4, 2, 1, WHITE, 1, 'head');
            drawRect(hx+6, hy+4, 2, 1, WHITE, 1, 'head');
            drawRect(hx+3, hy+4, 1, 1, eyeColor, 1, 'head');
            drawRect(hx+6, hy+4, 1, 1, eyeColor, 1, 'head');
            // Furrow
            drawRect(hx+2, hy+3, 2, 1, SKIN_DARK, 1, 'head');
            drawRect(hx+6, hy+3, 2, 1, SKIN_DARK, 1, 'head');
            drawRect(hx+4, hy+3, 2, 1, SKIN_DARK, 1, 'head'); 

            // Hair
            if (isSSJ) {
                // Golden Spiky SSJ
                drawRect(hx, hy-4, 11, 6, hairColor, 1, 'head');
                drawRect(hx-2, hy-2, 2, 5, hairColor, 1, 'head');
                drawRect(hx+11, hy-2, 2, 4, hairColor, 1, 'head');
                // Spikes
                drawRect(hx+1, hy-7, 3, 5, hairColor, 1, 'head');
                drawRect(hx+5, hy-8, 3, 6, hairColor, 1, 'head'); // Middle spike
                drawRect(hx+9, hy-6, 3, 4, hairColor, 1, 'head');
                // Bangs (less bang for SSJ adult/teen usually, but 1 bang)
                drawRect(hx+4, hy, 2, 3, hairColor, 1, 'head');
                drawRect(hx+5, hy+3, 1, 2, hairColor, 1, 'head');
                // Hair shadow
                drawRect(hx+1, hy-4, 9, 1, hairShadow, 1, 'head');
                drawRect(hx+1, hy-7, 1, 5, hairShadow, 1, 'head');
                drawRect(hx+5, hy-8, 1, 6, hairShadow, 1, 'head');
                drawRect(hx+9, hy-6, 1, 4, hairShadow, 1, 'head');
            } else if (isBeast) {
                // Wild, tall silver Beast hair
                drawRect(hx-1, hy-6, 13, 8, hairColor, 1, 'head');
                drawRect(hx-3, hy-4, 3, 6, hairColor, 1, 'head');
                drawRect(hx+12, hy-4, 3, 5, hairColor, 1, 'head');
                // Massive Spikes
                drawRect(hx, hy-10, 3, 7, hairColor, 1, 'head');
                drawRect(hx+4, hy-14, 4, 10, hairColor, 1, 'head'); // Huge middle
                drawRect(hx+9, hy-12, 3, 8, hairColor, 1, 'head');
                // The iconic large Beast bang
                drawRect(hx+3, hy, 3, 4, hairColor, 1, 'head');
                drawRect(hx+4, hy+4, 2, 3, hairColor, 1, 'head');
                drawRect(hx+5, hy+7, 1, 1, hairColor, 1, 'head'); // tip over eye
                // Hair shadow
                drawRect(hx+1, hy-6, 11, 2, hairShadow, 1, 'head');
                drawRect(hx, hy-10, 1, 7, hairShadow, 1, 'head');
                drawRect(hx+4, hy-14, 1, 10, hairShadow, 1, 'head');
                drawRect(hx+9, hy-12, 1, 8, hairShadow, 1, 'head');
                drawRect(hx+4, hy, 1, 4, hairShadow, 1, 'head'); // bang line
            } else {
                // Ultimate Gohan black hair (closer to skull, 1 central bang)
                drawRect(hx, hy-3, 11, 5, hairColor, 1, 'head');
                drawRect(hx-1, hy-1, 2, 4, hairColor, 1, 'head');
                drawRect(hx+11, hy-1, 2, 3, hairColor, 1, 'head');
                drawRect(hx+1, hy-5, 3, 4, hairColor, 1, 'head');
                drawRect(hx+5, hy-6, 4, 5, hairColor, 1, 'head');
                drawRect(hx+9, hy-4, 3, 3, hairColor, 1, 'head');
                // Sharp bang
                drawRect(hx+4, hy, 2, 4, hairColor, 1, 'head');
                drawRect(hx+5, hy+4, 1, 2, hairColor, 1, 'head');
                // Shadow / highlights (Ultimate Gohan uses subtle dark grey for specular)
                drawRect(hx+2, hy-4, 2, 1, hairShadow, 1, 'head');
                drawRect(hx+6, hy-5, 2, 2, hairShadow, 1, 'head');
                drawRect(hx+5, hy, 1, 4, 0x333333, 1, 'head');
            }

            // 5. FRONT LEG / ARM (RIGHT)
            // Right Leg
            let rLx = 18;
            let rLy = isCharge ? 25 : 22;
            if (isDefend) { rLx = 20; rLy = 23; }
            if (isAttack && f === 8) { rLx = 20; rLy = 23; }
            if (isAttack && f === 9) { rLx = 22; rLy = 22; }
            
            drawRect(rLx, rLy, 6, 8, GI_PURPLE, 1, 'rightLeg');
            drawRect(rLx+1, rLy+1, 3, 7, GI_SHADOW, 1, 'rightLeg'); // fold
            drawRect(rLx+4, rLy, 2, 8, GI_DARK, 1, 'rightLeg'); // shade fold
            // Shoe R
            drawRect(rLx-1, rLy+8, 6, 4, SHOE_BROWN, 1, 'rightLeg');
            drawRect(rLx, rLy+8, 4, 1, SHOE_LIGHT, 1, 'rightLeg');
            drawRect(rLx-1, rLy+11, 6, 1, SHOE_DARK, 1, 'rightLeg');

            // Right Arm
            if (isAttack) {
                if (f === 8) { // Kama charge back
                    drawRect(18, 14, 5, 4, GI_PURPLE, 1, 'rightArm');
                    drawRect(19, 15, 3, 2, GI_SHADOW, 1, 'rightArm');
                    drawRect(23, 15, 5, 3, SKIN, 1, 'rightArm');
                    drawRect(27, 16, 4, 4, SKIN, 1, 'rightArm'); // right hand cupped
                } else if (f === 9) { // Kama fire
                    drawRect(16, 15, 10, 4, GI_PURPLE, 1, 'rightArm');
                    drawRect(26, 15, 6, 3, SKIN, 1, 'rightArm');
                    drawRect(31, 14, 4, 4, SKIN, 1, 'rightArm'); // open palm fire
                    
                    // Add kamehameha ball in hand!
                    drawRect(34, 12, 10, 10, 0x00ffff, 0.4, 'aura');
                    drawRect(36, 14, 6, 6, 0xffffff, 0.8, 'aura');
                }
            } else if (isDefend) {
                // Block Right arm (crossed)
                drawRect(18, 16, 6, 4, GI_PURPLE, 1, 'rightArm');
                drawRect(12, 17, 7, 4, SKIN, 1, 'rightArm');
                drawRect(8, 17, 5, 5, SKIN, 1, 'rightArm'); // fist tight
            } else if (isCharge) {
                drawRect(24, 17, 5, 6, GI_PURPLE, 1, 'rightArm');
                drawRect(25, 23, 4, 5, SKIN, 1, 'rightArm');
                drawRect(26, 27, 4, 4, SKIN, 1, 'rightArm'); // fist clenched
            } else {
                // Idle / Walk Right Arm
                drawRect(21, 14, 4, 6, GI_PURPLE, 1, 'rightArm');
                drawRect(21, 15, 2, 4, GI_SHADOW, 1, 'rightArm');
                drawRect(21, 19, 4, 4, SKIN, 1, 'rightArm');
                drawRect(21, 19, 2, 4, SKIN_SHADOW, 1, 'rightArm');
                drawRect(21, 22, 4, 2, WRISTBAND_RED, 1, 'rightArm');
                drawRect(21, 24, 4, 3, SKIN, 1, 'rightArm'); // fist
            }

            // 6. FRONT AURA
            if (isTransformed && !isWalk) {
                let a1, a2, a3, c1, c2, c3;
                if (isBeast) { 
                    c1 = 0x8a2be2; a1 = 0.2;
                    c2 = 0xdc143c; a2 = 0.3;
                    c3 = 0xcce0ff; a3 = 0.5;
                } else { 
                    c1 = 0xffa500; a1 = 0.1;
                    c2 = 0xffd700; a2 = 0.2;
                    c3 = 0xffffe0; a3 = 0.4;
                }
                
                let bob = ((f+1)%4) * 2 - 2;
                
                // Overlay aura
                drawAura(2, -10 + bob, 26, 46, c1, a1);
                drawAura(6, 0 + bob, 18, 30, c3, a2);
                
                if (isCharge) {
                    // Wind / energy burst effect at base
                    drawAura(-10, 32, 50, 4, c3, a3);
                    drawAura(-6, 30, 42, 4, c2, a2);
                }
            }
        }

        let textureName = key;
        if (isBeast) textureName = `${key}_ui`;
        else if (isSSJ) textureName = `${key}_ssj`;

        canvas.generateTexture(textureName, sheetWidth, sheetHeight);

        if (scene.textures.exists(textureName)) {
            const tex = scene.textures.get(textureName);
            const fw = FRAME_WIDTH * SCALE;
            const fh = FRAME_HEIGHT * SCALE;
            for (let i = 0; i < FRAMES; i++) {
                tex.add(i.toString(), 0, i * fw, 0, fw, fh);
            }
        }

        canvas.destroy();    
    };

    if (!scene.textures.exists("gohan")) { generateForm(0); }
    if (!scene.textures.exists("gohan_ssj")) { generateForm(1); }
    if (!scene.textures.exists("gohan_ui")) { generateForm(2); }
}

