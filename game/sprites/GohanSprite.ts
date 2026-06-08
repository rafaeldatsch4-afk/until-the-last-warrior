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

            const SKIN = 0xffdfc4;
            const SKIN_SHADOW = 0xe0a982;
            const SKIN_DARK = 0xb57850;
            const WHITE = 0xffffff;
            const BLACK = 0x181818;

            const GI_PURPLE = 0x5b2c6f; 
            const GI_SHADOW = 0x3d174d;
            const GI_LIGHT = 0x76448a;
            const GI_DARK = 0x270d30;
            const SASH_RED = 0xcc2a2a;
            const SASH_SHADOW = 0x8a1b12;
            const SASH_LIGHT = 0xff5252;
            const SHOE_BROWN = 0x8f4d26;
            const SHOE_LIGHT = 0xbd7142;
            const SHOE_DARK = 0x54260d;
            const SHOE_TRIM = 0xeebb44; // Yellow/orange trim for Piccolo boots
            const WRISTBAND_RED = 0xd63031;
            const WRISTBAND_SHADOW = 0x8a1b12;

            const HAIR_BASE = BLACK;
            const HAIR_SSJ = 0xffea00;
            const HAIR_SSJ_SHADOW = 0xc7a800;
            const HAIR_BEAST = 0xf0f4f8;
            const HAIR_BEAST_SHADOW = 0xb6c2cd;

            const EYE_BASE = BLACK;
            const EYE_SSJ = 0x00ffcc; 
            const EYE_BEAST = 0xff1a1a; 

            const hairColor = isBeast ? HAIR_BEAST : isSSJ ? HAIR_SSJ : HAIR_BASE;
            const eyeColor = isBeast ? EYE_BEAST : isSSJ ? EYE_SSJ : EYE_BASE;
            const hairShadow = isBeast ? HAIR_BEAST_SHADOW : isSSJ ? HAIR_SSJ_SHADOW : 0x303030;

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
                } else { // SSJ aura: golden/flame
                    c1 = 0xffa500; a1 = 0.3;
                    c2 = 0xffd700; a2 = 0.5;
                    c3 = 0xffffe0; a3 = 0.6;
                }
                
                let bob = (f%4) * 2 - 2;
                
                // Base thick aura, spiked shape
                drawAura(-4, -18 + bob, 40, 52 - bob, c1, a1);
                drawAura(0, -28 - bob, 32, 60 + bob, c1, a1);
                
                drawAura(2, -14 - bob, 28, 46 + bob, c2, a2);
                drawAura(4, -22 + bob, 24, 52 - bob, c2, a2);
                
                drawAura(6, -10 + bob, 20, 40 - bob, c3, a3);
                
                // Jagged aura edges
                if (f%2===0) {
                    drawAura(-8, 5, 8, 15, c1, a1);
                    drawAura(32, -5, 8, 20, c1, a1);
                    drawAura(5, -34, 10, 10, c2, a2);
                } else {
                    drawAura(-6, -5, 8, 20, c1, a1);
                    drawAura(30, 5, 8, 15, c1, a1);
                    drawAura(15, -32, 10, 10, c2, a2);
                }
                
                // Particles / lightning
                if (isBeast) {
                    if (f%3===0) { drawAura(-5, 0, 4, 18, 0x00ffff, 0.8); drawAura(28, 15, 6, 2, 0x00ffff, 0.8); }
                    if (f%3===1) { drawAura(-2, -20, 20, 4, 0x00ffff, 0.8); drawAura(30, 0, 4, 20, 0x00ffff, 0.8); }
                    if (f%3===2) { drawAura(10, 20, 20, 4, 0x00ffff, 0.8); drawAura(2, 5, 2, 8, 0x00ffff, 0.8); }
                } else if (isSSJ) {
                    if (f%2===0) { drawAura(-2, 10, 4, 4, 0xffffff, 0.8); drawAura(28, -5, 4, 4, 0xffffff, 0.8); }
                    else { drawAura(0, -10, 4, 4, 0xffffff, 0.8); drawAura(26, 20, 4, 4, 0xffffff, 0.8); }
                }
            }

            // 2. BACK LEG / ARM (LEFT)
            if (isAttack) {
                if (f === 8) { // Kamehameha charge back
                    drawRect(2, 14, 7, 6, GI_DARK, 1, 'leftArm');
                    drawRect(3, 14, 5, 5, GI_SHADOW, 1, 'leftArm');
                    drawRect(4, 15, 3, 3, GI_PURPLE, 1, 'leftArm');
                    drawRect(0, 18, 6, 5, SKIN_SHADOW, 1, 'leftArm');
                    drawRect(1, 19, 4, 4, SKIN, 1, 'leftArm');
                    drawRect(-2, 21, 4, 4, SKIN, 1, 'leftArm'); // hand cupped
                } else if (f === 9) { // Kamehameha fire
                    drawRect(3, 14, 11, 5, GI_DARK, 1, 'leftArm');
                    drawRect(4, 15, 9, 3, GI_SHADOW, 1, 'leftArm');
                    drawRect(14, 15, 6, 4, SKIN_SHADOW, 1, 'leftArm');
                    drawRect(15, 16, 4, 2, SKIN, 1, 'leftArm');
                    drawRect(20, 14, 4, 5, SKIN, 1, 'leftArm'); // palm open
                }
            } else if (isDefend) {
                // Block left arm
                drawRect(5, 16, 7, 5, GI_DARK, 1, 'leftArm');
                drawRect(6, 17, 5, 3, GI_SHADOW, 1, 'leftArm');
                drawRect(12, 17, 9, 5, SKIN_SHADOW, 1, 'leftArm');
                drawRect(13, 18, 7, 3, SKIN, 1, 'leftArm');
                drawRect(21, 16, 5, 6, SKIN, 1, 'leftArm'); // fist tight
            } else if (isCharge) {
                drawRect(1, 16, 6, 7, GI_DARK, 1, 'leftArm');
                drawRect(2, 16, 4, 6, GI_SHADOW, 1, 'leftArm');
                drawRect(-1, 22, 5, 6, SKIN_SHADOW, 1, 'leftArm');
                drawRect(0, 23, 3, 5, SKIN, 1, 'leftArm');
                drawRect(-2, 27, 5, 5, SKIN, 1, 'leftArm'); // fist clenched
            } else {
                // Idle / Walk Left Arm
                // Shoulder sleeve
                drawRect(9, 13, 5, 7, GI_DARK, 1, 'leftArm');
                drawRect(10, 13, 4, 6, GI_SHADOW, 1, 'leftArm');
                drawRect(11, 14, 2, 4, GI_PURPLE, 1, 'leftArm');
                // Bicep/Forearm
                drawRect(9, 19, 5, 5, SKIN_SHADOW, 1, 'leftArm');
                drawRect(10, 19, 3, 5, SKIN, 1, 'leftArm');
                drawRect(11, 20, 1, 3, SKIN_DARK, 1, 'leftArm'); // muscle line
                // Wristband
                drawRect(9, 23, 5, 3, WRISTBAND_SHADOW, 1, 'leftArm');
                drawRect(10, 23, 3, 3, WRISTBAND_RED, 1, 'leftArm');
                // Fist
                drawRect(9, 26, 5, 4, SKIN, 1, 'leftArm'); 
            }

            // Left Leg - Baggy pants leading into Piccolo boots
            let lLx = 11;
            let lLy = isCharge ? 25 : 23;
            if (isDefend) { lLx = 10; lLy = 23; }
            if (isAttack && f === 8) { lLx = 8; lLy = 24; }
            if (isAttack && f === 9) { lLx = 7; lLy = 23; }

            // Thigh (baggy)
            drawRect(lLx-1, lLy, 7, 5, GI_DARK, 1, 'leftLeg');
            drawRect(lLx, lLy, 5, 5, GI_PURPLE, 1, 'leftLeg');
            drawRect(lLx, lLy, 2, 4, GI_LIGHT, 1, 'leftLeg');
            // Knee/Calf (tapering down)
            drawRect(lLx, lLy+5, 6, 4, GI_DARK, 1, 'leftLeg');
            drawRect(lLx+1, lLy+5, 4, 3, GI_PURPLE, 1, 'leftLeg');
            // Ankle (tight)
            drawRect(lLx+2, lLy+8, 3, 2, GI_DARK, 1, 'leftLeg');
            drawRect(lLx+2, lLy+8, 2, 1, GI_SHADOW, 1, 'leftLeg');

            // Shoe L
            let sLx = lLx + 1;
            let sLy = lLy+10;
            drawRect(sLx-2, sLy, 7, 4, SHOE_DARK, 1, 'leftLeg');
            drawRect(sLx-1, sLy, 5, 3, SHOE_BROWN, 1, 'leftLeg');
            drawRect(sLx-1, sLy, 3, 1, SHOE_LIGHT, 1, 'leftLeg'); // Shoe highlight
            drawRect(sLx-2, sLy+3, 7, 1, SHOE_TRIM, 1, 'leftLeg'); // Trim outline

            // 3. BODY
            let bx = 11, by = 12, bw = 10;
            if (isCharge) by = 14;
            if (isDefend) { bx = 13; by = 13; }

            // Gi Base / Shadow
            // Shoulders and Upper Chest (Broad)
            drawRect(bx-2, by, bw+4, 5, GI_DARK, 1, 'body');
            drawRect(bx-1, by, bw+2, 4, GI_PURPLE, 1, 'body');
            drawRect(bx, by, bw, 3, GI_LIGHT, 1, 'body'); // highlight shoulder
            
            // Mid Torso (Tapering in)
            drawRect(bx, by+4, bw, 5, GI_DARK, 1, 'body');
            drawRect(bx+1, by+4, bw-2, 4, GI_PURPLE, 1, 'body');
            drawRect(bx+2, by+4, bw-4, 3, GI_LIGHT, 1, 'body'); // subtle mid highlight

            // Lower Torso / Waist (Narrow)
            drawRect(bx+1, by+8, bw-2, 4, GI_DARK, 1, 'body');
            drawRect(bx+2, by+8, bw-4, 4, GI_PURPLE, 1, 'body');
            
            // Neck / Exposed Muscular Chest (V-neck)
            // Neck
            drawRect(bx+2, by-2, 6, 3, SKIN_SHADOW, 1, 'body');
            drawRect(bx+3, by-2, 4, 3, SKIN, 1, 'body');
            // Pecs
            drawRect(bx+2, by+1, 6, 4, SKIN, 1, 'body');
            drawRect(bx+2, by+1, 6, 1, SKIN_SHADOW, 1, 'body'); // Collar bone shadow
            // Cleavage/Pec line
            drawRect(bx+4, by+2, 2, 3, SKIN_SHADOW, 1, 'body');
            drawRect(bx+4, by+2, 1, 3, SKIN_DARK, 1, 'body');
            // Abs line
            drawRect(bx+4, by+5, 2, 1, GI_DARK, 1, 'body'); // Gi fold under pecs
            drawRect(bx+5, by+5, 1, 1, SKIN_DARK, 1, 'body'); // little ab line showing

            // Sash (Red belt)
            let sashY = by + 11;
            drawRect(bx, sashY, bw, 3, SASH_SHADOW, 1, 'body');
            drawRect(bx+1, sashY, bw-2, 2, SASH_RED, 1, 'body');
            drawRect(bx+1, sashY, bw-4, 1, SASH_LIGHT, 1, 'body');
            // Knot
            drawRect(bx-1, sashY+1, 3, 5, SASH_SHADOW, 1, 'body');
            drawRect(bx, sashY+2, 2, 4, SASH_RED, 1, 'body');
            drawRect(bx, sashY+2, 1, 3, SASH_LIGHT, 1, 'body'); // Knot highlight

            // 4. HEAD
            let hx = 10, hy = 2; // slightly higher
            if (isCharge) hy = 4;
            if (isDefend) { hx = 11; hy = 3; }
            if (isAttack && f===8) { hx=9; hy=3; }
            if (isAttack && f===9) { hx=12; hy=3; }
            
            // Base Face (anime jawline)
            drawRect(hx, hy+2, 10, 6, SKIN_SHADOW, 1, 'head');
            drawRect(hx+1, hy+2, 8, 6, SKIN, 1, 'head');
            // Jawline pointing down
            drawRect(hx+2, hy+8, 6, 1, SKIN_SHADOW, 1, 'head');
            drawRect(hx+3, hy+9, 4, 1, SKIN_SHADOW, 1, 'head'); // Chin
            drawRect(hx+2, hy+7, 6, 1, SKIN, 1, 'head');
            drawRect(hx+3, hy+8, 4, 1, SKIN, 1, 'head');
            
            // cheek lines
            drawRect(hx+2, hy+6, 1, 1, SKIN_DARK, 1, 'head'); 
            drawRect(hx+7, hy+6, 1, 1, SKIN_DARK, 1, 'head'); 
            
            if (isCharge || isAttack) {
                drawRect(hx+4, hy+7, 2, 2, 0x440000, 1, 'head'); // mouth open
                drawRect(hx+4, hy+7, 2, 1, WHITE, 1, 'head'); // teeth
            }
            else drawRect(hx+4, hy+7, 2, 1, SKIN_DARK, 1, 'head'); // smirk
            
            drawRect(hx+4, hy+5, 1, 1, SKIN_DARK, 1, 'head'); // nose
            drawRect(hx+5, hy+6, 1, 1, SKIN_DARK, 1, 'head'); // nostril
            
            // Ears
            drawRect(hx-1, hy+4, 2, 3, SKIN, 1, 'head');
            drawRect(hx-1, hy+5, 1, 1, SKIN_DARK, 1, 'head');
            drawRect(hx+9, hy+4, 2, 3, SKIN, 1, 'head');
            drawRect(hx+10, hy+5, 1, 1, SKIN_DARK, 1, 'head');
            
            // Eyes (sharp DBZ eyes)
            drawRect(hx+1, hy+4, 3, 1, WHITE, 1, 'head');
            drawRect(hx+6, hy+4, 3, 1, WHITE, 1, 'head');
            drawRect(hx+2, hy+4, 1, 1, eyeColor, 1, 'head');
            drawRect(hx+7, hy+4, 1, 1, eyeColor, 1, 'head');
            // Heavy furrow covering top of eyes
            drawRect(hx+1, hy+3, 3, 1, SKIN_DARK, 1, 'head');
            drawRect(hx+6, hy+3, 3, 1, SKIN_DARK, 1, 'head');
            drawRect(hx+4, hy+3, 2, 2, SKIN_DARK, 1, 'head'); // Unibrow angry connection 

            // Hair
            if (isSSJ) {
                // Golden Spiky SSJ
                drawRect(hx-1, hy-4, 12, 6, hairColor, 1, 'head');
                drawRect(hx-2, hy-2, 2, 5, hairColor, 1, 'head');
                drawRect(hx+10, hy-2, 2, 5, hairColor, 1, 'head');
                // Spikes
                drawRect(hx, hy-7, 3, 5, hairColor, 1, 'head');
                drawRect(hx+4, hy-8, 3, 6, hairColor, 1, 'head'); // Middle spike
                drawRect(hx+8, hy-6, 3, 4, hairColor, 1, 'head');
                // Bangs
                drawRect(hx+3, hy-1, 2, 3, hairColor, 1, 'head');
                drawRect(hx+4, hy+2, 1, 3, hairColor, 1, 'head'); // Sharp point
                
                // Hair shadow highlights
                drawRect(hx, hy-4, 10, 1, hairShadow, 1, 'head');
                drawRect(hx, hy-7, 1, 5, hairShadow, 1, 'head');
                drawRect(hx+4, hy-8, 1, 6, hairShadow, 1, 'head');
                drawRect(hx+8, hy-6, 1, 4, hairShadow, 1, 'head');
                drawRect(hx+3, hy, 1, 3, hairShadow, 1, 'head'); // bang shadow
            } else if (isBeast) {
                // Wild, tall silver Beast hair
                drawRect(hx-2, hy-6, 14, 8, hairColor, 1, 'head');
                drawRect(hx-3, hy-4, 3, 7, hairColor, 1, 'head');
                drawRect(hx+11, hy-4, 3, 6, hairColor, 1, 'head');
                // Massive Spikes
                drawRect(hx-1, hy-10, 3, 7, hairColor, 1, 'head');
                drawRect(hx+3, hy-14, 4, 10, hairColor, 1, 'head'); // Huge middle
                drawRect(hx+8, hy-12, 3, 8, hairColor, 1, 'head');
                // The iconic large Beast bang
                drawRect(hx+3, hy-1, 3, 3, hairColor, 1, 'head');
                drawRect(hx+4, hy+2, 2, 3, hairColor, 1, 'head');
                drawRect(hx+5, hy+5, 1, 2, hairColor, 1, 'head'); // tip over eye
                // Hair shadow
                drawRect(hx, hy-6, 10, 2, hairShadow, 1, 'head');
                drawRect(hx-1, hy-10, 1, 7, hairShadow, 1, 'head');
                drawRect(hx+3, hy-14, 1, 10, hairShadow, 1, 'head');
                drawRect(hx+8, hy-12, 1, 8, hairShadow, 1, 'head');
                drawRect(hx+3, hy, 1, 4, hairShadow, 1, 'head'); // bang line
            } else {
                // Ultimate Gohan black hair
                drawRect(hx, hy-3, 10, 5, hairColor, 1, 'head');
                drawRect(hx-1, hy-1, 2, 4, hairColor, 1, 'head');
                drawRect(hx+9, hy-1, 2, 3, hairColor, 1, 'head');
                drawRect(hx+1, hy-5, 3, 4, hairColor, 1, 'head');
                drawRect(hx+4, hy-6, 4, 5, hairColor, 1, 'head');
                drawRect(hx+8, hy-4, 3, 3, hairColor, 1, 'head');
                // Sharp bang
                drawRect(hx+3, hy-1, 2, 4, hairColor, 1, 'head');
                drawRect(hx+4, hy+3, 1, 2, hairColor, 1, 'head');
                
                // Shadow / highlights
                drawRect(hx+2, hy-4, 2, 1, hairShadow, 1, 'head');
                drawRect(hx+5, hy-5, 2, 2, hairShadow, 1, 'head');
                drawRect(hx+4, hy-1, 1, 4, 0x3d3d3d, 1, 'head'); // specular on bang
            }

            // 5. FRONT LEG / ARM (RIGHT)
            // Right Leg
            let rLx = 16;
            let rLy = isCharge ? 25 : 23;
            if (isDefend) { rLx = 18; rLy = 24; }
            if (isAttack && f === 8) { rLx = 18; rLy = 24; }
            if (isAttack && f === 9) { rLx = 20; rLy = 23; }
            
            // Thigh (baggy)
            drawRect(rLx-1, rLy, 7, 5, GI_DARK, 1, 'rightLeg');
            drawRect(rLx, rLy, 5, 5, GI_PURPLE, 1, 'rightLeg');
            drawRect(rLx, rLy, 2, 4, GI_LIGHT, 1, 'rightLeg');
            // Knee/Calf (tapering down)
            drawRect(rLx, rLy+5, 6, 4, GI_DARK, 1, 'rightLeg');
            drawRect(rLx+1, rLy+5, 4, 3, GI_PURPLE, 1, 'rightLeg');
            // Ankle (tight)
            drawRect(rLx+2, rLy+8, 3, 2, GI_DARK, 1, 'rightLeg');
            drawRect(rLx+2, rLy+8, 2, 1, GI_SHADOW, 1, 'rightLeg');

            // Shoe R
            let sRx = rLx + 1;
            let sRy = rLy+10;
            drawRect(sRx-2, sRy, 7, 4, SHOE_DARK, 1, 'rightLeg');
            drawRect(sRx-1, sRy, 5, 3, SHOE_BROWN, 1, 'rightLeg');
            drawRect(sRx-1, sRy, 3, 1, SHOE_LIGHT, 1, 'rightLeg'); // Shoe highlight
            drawRect(sRx-2, sRy+3, 7, 1, SHOE_TRIM, 1, 'rightLeg'); // Trim outline

            // Right Arm
            if (isAttack) {
                if (f === 8) { // Kama charge back
                    drawRect(18, 13, 6, 5, GI_DARK, 1, 'rightArm');
                    drawRect(18, 13, 5, 4, GI_PURPLE, 1, 'rightArm');
                    drawRect(23, 14, 6, 5, SKIN_SHADOW, 1, 'rightArm');
                    drawRect(24, 15, 4, 3, SKIN, 1, 'rightArm');
                    drawRect(29, 16, 5, 5, SKIN, 1, 'rightArm'); // right hand cupped
                } else if (f === 9) { // Kama fire
                    drawRect(16, 14, 11, 5, GI_DARK, 1, 'rightArm');
                    drawRect(16, 14, 10, 4, GI_PURPLE, 1, 'rightArm');
                    drawRect(27, 14, 7, 4, SKIN_SHADOW, 1, 'rightArm');
                    drawRect(28, 15, 5, 2, SKIN, 1, 'rightArm');
                    drawRect(34, 13, 5, 5, SKIN, 1, 'rightArm'); // open palm fire
                    
                    // Add kamehameha ball in hand!
                    drawRect(35, 11, 12, 12, 0x00ffff, 0.4, 'aura');
                    drawRect(37, 13, 8, 8, 0xffffff, 0.8, 'aura');
                }
            } else if (isDefend) {
                // Block Right arm (crossed)
                drawRect(18, 15, 7, 5, GI_DARK, 1, 'rightArm');
                drawRect(18, 15, 6, 4, GI_PURPLE, 1, 'rightArm');
                drawRect(11, 16, 8, 5, SKIN_SHADOW, 1, 'rightArm');
                drawRect(12, 17, 6, 3, SKIN, 1, 'rightArm');
                drawRect(7, 16, 6, 6, SKIN, 1, 'rightArm'); // fist tight
            } else if (isCharge) {
                drawRect(24, 16, 6, 7, GI_DARK, 1, 'rightArm');
                drawRect(24, 16, 5, 6, GI_PURPLE, 1, 'rightArm');
                drawRect(25, 22, 5, 6, SKIN_SHADOW, 1, 'rightArm');
                drawRect(26, 23, 3, 5, SKIN, 1, 'rightArm');
                drawRect(27, 27, 5, 5, SKIN, 1, 'rightArm'); // fist clenched
            } else {
                // Idle / Walk Right Arm
                drawRect(20, 13, 5, 7, GI_DARK, 1, 'rightArm');
                drawRect(20, 13, 4, 6, GI_PURPLE, 1, 'rightArm');
                drawRect(21, 13, 2, 5, GI_LIGHT, 1, 'rightArm');
                // Bicep/Forearm
                drawRect(20, 19, 5, 5, SKIN_SHADOW, 1, 'rightArm');
                drawRect(20, 19, 3, 5, SKIN, 1, 'rightArm');
                drawRect(21, 20, 1, 3, SKIN_DARK, 1, 'rightArm');
                // Wristband
                drawRect(20, 23, 5, 3, WRISTBAND_SHADOW, 1, 'rightArm');
                drawRect(20, 23, 3, 3, WRISTBAND_RED, 1, 'rightArm');
                // Fist
                drawRect(20, 26, 5, 4, SKIN, 1, 'rightArm'); 
            }

            // 6. FRONT AURA
            if (isTransformed && !isWalk) {
                let a1, a2, a3, c1, c2, c3;
                if (isBeast) { 
                    c1 = 0x8a2be2; a1 = 0.2; // Purple
                    c2 = 0xdc143c; a2 = 0.3; // Red
                    c3 = 0xffffff; a3 = 0.5; // White
                } else { 
                    c1 = 0xffa500; a1 = 0.1;
                    c2 = 0xffd700; a2 = 0.2;
                    c3 = 0xffffe0; a3 = 0.4;
                }
                
                let bob = ((f+1)%4) * 2 - 2;
                
                // Overlay aura
                drawAura(2, -10 + bob, 26, 46, c1, a1);
                drawAura(6, 0 + bob, 18, 30, c3, a2);
                
                // Extra Lightning for Beast mode
                if (isBeast && f % 2 === 0) {
                    drawAura(0, -5 + bob, 4, 12, 0x00ffff, 0.6); // Cyan lighting
                    drawAura(26, 15 + bob, 5, 8, 0x00ffff, 0.6);
                    drawAura(10, -18 + bob, 3, 10, 0x00ffff, 0.6);
                    drawAura(5, 25, 4, 6, 0x00ffff, 0.6);
                } else if (isBeast && f % 2 !== 0) {
                    drawAura(24, 0 + bob, 4, 15, 0x00ffff, 0.6);
                    drawAura(-2, 10 + bob, 6, 6, 0x00ffff, 0.6);
                    drawAura(15, -20 + bob, 2, 12, 0x00ffff, 0.6);
                }
                
                // Ground energy burst
                if (isCharge) {
                    // Wind / energy burst effect at base
                    drawAura(-15, 30, 60, 6, c1, a2);
                    drawAura(-10, 32, 50, 4, c3, a3);
                    drawAura(-6, 31, 42, 2, c2, a3);
                }
            }
        }

        let textureName = key;
        if (isBeast) textureName = `${key}_ui`;
        else if (isSSJ) textureName = `${key}_ssj`;

        canvas.generateTexture(textureName, sheetWidth, sheetHeight);
        canvas.destroy();

        if (scene.textures.exists(textureName)) {
            const tex = scene.textures.get(textureName);
            const fw = FRAME_WIDTH * SCALE;
            const fh = FRAME_HEIGHT * SCALE;
            for (let i = 0; i < FRAMES; i++) {
                tex.add(i.toString(), 0, i * fw, 0, fw, fh);
            }
        }


    };

    if (!scene.textures.exists("gohan")) { generateForm(0); }
    if (!scene.textures.exists("gohan_ssj")) { generateForm(1); }
    if (!scene.textures.exists("gohan_ui")) { generateForm(2); }
}

