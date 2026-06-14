import Phaser from "phaser";

export function generateGohanSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "gohan";

        const isTransformed = form > 0;
        const isBeast = form === 2; // Beast corresponds to form 2 (_ui)
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
          const poseOffsetY = f === 8 ? -1 : f === 9 ? -2 : f === 10 ? 2 : f === 11 ? -1 : (isWalk && (f===5 || f===7)) ? -1 : 0;

          const getWalkOffsets = (x: number, y: number) => {
            if (!isWalk || y < 22) return { ox: 0, oy: 0 };
            const isLeftLeg = x < 15;
            const wIndex = f - 4;
            let ox = 0, oy = 0;
            if (isLeftLeg) {
               if (wIndex === 0) { ox = 1; oy = -1; }
               else if (wIndex === 1) { ox = 3; oy = -2; }
               else if (wIndex === 2) { ox = 0; oy = 0; }
               else if (wIndex === 3) { ox = -2; oy = 0; }
            } else {
               if (wIndex === 0) { ox = -2; oy = 0; }
               else if (wIndex === 1) { ox = -4; oy = 0; }
               else if (wIndex === 2) { ox = -1; oy = -1; }
               else if (wIndex === 3) { ox = 2; oy = -2; }
            }
            return { ox, oy };
          };

          const dot = (x: number, y: number, color: number) => {
            const finalY = y < 24 ? y + breatheOffset : y;
            const { ox, oy } = getWalkOffsets(x, y);
            const finalX = (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX + ox;
            const finalYPose = (isAttack || isDefend || isCharge ? finalY + poseOffsetY / 2 : finalY) + oy;
            canvas.fillStyle(color, 1);
            canvas.fillRect((offsetX + finalX) * SCALE, (finalYPose + DRAW_OFFSET_Y) * SCALE, SCALE, SCALE);
          };

          const alphaBox = (x: number, y: number, w: number, h: number, color: number, alpha: number) => {
            const finalY = y < 24 ? y + breatheOffset : y;
            const { ox, oy } = getWalkOffsets(x, y);
            const finalX = (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX + ox;
            const finalYPose = (isAttack || isDefend || isCharge ? finalY + poseOffsetY / 2 : finalY) + oy;
            canvas.fillStyle(color, alpha);
            canvas.fillRect((offsetX + finalX) * SCALE, (finalYPose + DRAW_OFFSET_Y) * SCALE, w * SCALE, h * SCALE);
          };

          const box = (x: number, y: number, w: number, h: number, color: number) => {
            const finalY = y < 24 ? y + breatheOffset : y;
            const { ox, oy } = getWalkOffsets(x, y);
            const finalX = (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX + ox;
            const finalYPose = (isAttack || isDefend || isCharge ? finalY + poseOffsetY / 2 : finalY) + oy;
            canvas.fillStyle(color, 1);
            canvas.fillRect((offsetX + finalX) * SCALE, (finalYPose + DRAW_OFFSET_Y) * SCALE, w * SCALE, h * SCALE);
          };

          const headBox = (x: number, y: number, w: number, h: number, color: number) => {
            const { ox, oy } = getWalkOffsets(x, y);
            const finalX = (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX + ox;
            const finalYPose = isAttack || isDefend ? y + poseOffsetY / 2 : y;
            canvas.fillStyle(color, 1);
            canvas.fillRect((offsetX + finalX) * SCALE, (finalYPose + breatheOffset + DRAW_OFFSET_Y) * SCALE, w * SCALE, h * SCALE);
          };

          const headDot = (x: number, y: number, color: number) => {
            const { ox, oy } = getWalkOffsets(x, y);
            const finalX = (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX + ox;
            const finalYPose = isAttack || isDefend ? y + poseOffsetY / 2 : y;
            canvas.fillStyle(color, 1);
            canvas.fillRect((offsetX + finalX) * SCALE, (finalYPose + breatheOffset + DRAW_OFFSET_Y) * SCALE, SCALE, SCALE);
          };

          const SKIN_TONE = 0xffce9e;
          const SKIN_SHADOW = 0xe0ac7d;
          const GI_PURPLE = 0x3d1766;
          const GI_SHADOW = 0x240d3d;
          const GI_HIGHLIGHT = 0x542985;
          const BELT_RED = 0xcc2222;
          const BELT_SHADOW = 0x881111;
          const BOOT_BROWN = 0x8b5a2b;
          const BOOT_SHADOW = 0x5c3a18;
          const BOOT_TIP = 0xd2a679;
          const BOOT_TIP_SHADOW = 0xa67c52;
          const WHITE = 0xffffff;
          const BLACK = 0x111111;

          const HAIR_BLACK = 0x1a1a1a;
          const HAIR_BLACK_HIGHLIGHT = 0x333333;
          const HAIR_SSJ = 0xffdf00;
          const HAIR_SSJ_HIGHLIGHT = 0xfffa8a;
          const EYE_SSJ = 0x00e5ff;
          
          const HAIR_BEAST = 0xe8eaf6;
          const HAIR_BEAST_HIGHLIGHT = 0xffffff;
          const EYE_BEAST = 0xff2222;

          let hairColor = HAIR_BLACK;
          let eyeColor = 0x111111;
          let eyebrowColor = HAIR_BLACK;

          if (isBeast) { // Beast/UI form map
            hairColor = HAIR_BEAST;
            eyeColor = EYE_BEAST;
            eyebrowColor = 0x9e9e9e;
          } else if (isTransformed) {
            hairColor = HAIR_SSJ;
            eyeColor = EYE_SSJ;
            eyebrowColor = 0xd4a000;
          }

          // --- BODY ---
          // Legs
          box(10, 23, 4, 7, GI_PURPLE);
          box(18, 23, 4, 7, GI_PURPLE);
          box(14, 23, 4, 2, GI_PURPLE); // Crotch connection gap
          box(10, 23, 1, 7, GI_SHADOW);
          box(21, 23, 1, 7, GI_SHADOW);
          box(12, 23, 1, 7, GI_SHADOW);
          box(19, 23, 1, 7, GI_SHADOW);
          box(11, 24, 1, 5, GI_HIGHLIGHT); 
          box(20, 24, 1, 5, GI_HIGHLIGHT);

          // Boots (Gohan Piccolo style boots)
          box(10, 30, 4, 2, BOOT_BROWN);
          box(18, 30, 4, 2, BOOT_BROWN);
          box(9, 32, 5, 2, BOOT_TIP);
          box(18, 32, 5, 2, BOOT_TIP);
          // Boot shadows
          box(10, 30, 1, 2, BOOT_SHADOW);
          box(18, 30, 1, 2, BOOT_SHADOW);
          box(9, 33, 5, 1, BOOT_TIP_SHADOW);
          box(18, 33, 5, 1, BOOT_TIP_SHADOW);

          // Torso
          box(11, 14, 10, 9, GI_PURPLE);
          // Highlight
          box(12, 15, 3, 4, GI_HIGHLIGHT);
          box(17, 15, 3, 4, GI_HIGHLIGHT);

          // Exposed Chest & Neck (V-neck)
          box(13, 13, 6, 3, SKIN_TONE);
          box(13, 13, 1, 3, SKIN_SHADOW);
          box(18, 13, 1, 3, SKIN_SHADOW);
          box(15, 14, 2, 2, SKIN_SHADOW); // Cleavage line

          // Chest definition
          box(15, 18, 2, 2, GI_SHADOW); // center line
          box(11, 17, 2, 5, GI_SHADOW); // left fold
          box(19, 17, 2, 5, GI_SHADOW); // right fold

          // Red Sash
          box(11, 22, 10, 2, BELT_RED);
          box(11, 23, 3, 4, BELT_RED); // Knot
          box(11, 24, 2, 3, BELT_SHADOW);
          
          // Arms (Wristbands)
          if (isCharge) {
              box(20, 4, 3, 10, SKIN_TONE); 
              box(20, 14, 3, 3, GI_PURPLE); 
              box(20, 4, 3, 3, BELT_RED); 
              box(20, 2, 3, 3, SKIN_TONE); 
              box(9, 4, 3, 10, SKIN_TONE); 
              box(9, 14, 3, 3, GI_PURPLE); 
              box(9, 4, 3, 3, BELT_RED); 
              box(9, 2, 3, 3, SKIN_TONE); 
          } else if (isAttack) {
            box(21, 13, 5, 4, SKIN_TONE); 
            box(21, 13, 3, 4, GI_PURPLE); 
            box(21, 13, 1, 4, GI_SHADOW);
            box(26, 14, 5, 3, SKIN_TONE); 
            box(29, 14, 2, 3, BELT_RED); // Wristband
            box(31, 13, 4, 4, SKIN_TONE); 
            box(31, 13, 2, 2, 0xffffff); 
            alphaBox(33, 13, 6, 4, SKIN_TONE, 0.4);
            
            box(6, 15, 4, 5, SKIN_TONE);
            box(7, 14, 4, 3, GI_PURPLE);
            box(6, 18, 4, 2, BELT_RED);
          } else {
            // Shoulders/Sleeves
            box(8, 14, 3, 4, GI_PURPLE);
            box(21, 14, 3, 4, GI_PURPLE);
            box(8, 15, 1, 3, GI_SHADOW);
            box(23, 15, 1, 3, GI_SHADOW);
            box(10, 15, 1, 2, GI_HIGHLIGHT);
            box(21, 15, 1, 2, GI_HIGHLIGHT);

            // Arms
            box(8, 17, 3, 6, SKIN_TONE);
            box(21, 17, 3, 6, SKIN_TONE);
            box(8, 17, 1, 6, SKIN_SHADOW);
            box(23, 17, 1, 6, SKIN_SHADOW);
            box(9, 19, 1, 2, SKIN_SHADOW);
            box(22, 19, 1, 2, SKIN_SHADOW);

            // Wristbands
            box(8, 20, 3, 3, BELT_RED);
            box(21, 20, 3, 3, BELT_RED); 
            box(8, 20, 1, 3, BELT_SHADOW);
            box(23, 20, 1, 3, BELT_SHADOW);

            // Hands
            box(8, 23, 3, 2, SKIN_TONE);
            box(21, 23, 3, 2, SKIN_TONE); 
            box(8, 24, 3, 1, SKIN_SHADOW);
            box(21, 24, 3, 1, SKIN_SHADOW);
          }

          // Head
          headBox(12, 6, 8, 7, SKIN_TONE);
          headDot(11, 9, SKIN_TONE);
          headDot(20, 9, SKIN_TONE); // Ears
          headDot(11, 10, SKIN_SHADOW);
          headDot(20, 10, SKIN_SHADOW);
          headBox(13, 12, 6, 1, SKIN_SHADOW);

          // Face
          headDot(13, 9, WHITE);
          headDot(17, 9, WHITE);
          headDot(14, 9, eyeColor);
          headDot(18, 9, eyeColor);
          headDot(13, 8, eyebrowColor);
          headDot(14, 8, eyebrowColor);
          headDot(17, 8, eyebrowColor);
          headDot(18, 8, eyebrowColor);
          headDot(15, 8, SKIN_SHADOW);
          headDot(16, 8, SKIN_SHADOW);
          headDot(15, 11, 0xdca880); // Nose
          headDot(13, 11, SKIN_SHADOW);
          headDot(18, 11, SKIN_SHADOW);

          if (isAttack) {
            headBox(15, 12, 2, 1, 0x440000); 
            headBox(13, 8, 2, 1, eyebrowColor);
            headBox(17, 8, 2, 1, eyebrowColor);
          } else if (isDefend) {
            headBox(15, 12, 2, 1, WHITE); 
          } else {
            headDot(16, 12, 0x222222); 
          }

          canvas.fillStyle(hairColor, 1);

          if (isBeast) {
            // Beast Gohan Hair - Colossal silver swept-back spikes
            // Core head wrap
            headBox(10, -1, 12, 7, hairColor); 
            
            // Outer flares
            headBox(8, 2, 2, 5, hairColor);
            headBox(22, 2, 2, 5, hairColor);
            headBox(9, -4, 2, 6, hairColor);
            headBox(21, -4, 2, 6, hairColor);

            // Massive Spikes
            headBox(11, -12, 3, 11, hairColor); // Left large spike
            headBox(14, -18, 4, 17, hairColor); // Center MONUMENTAL spike
            headBox(18, -12, 3, 11, hairColor); // Right large spike

            // Connective volume for depth
            headBox(13, -8, 2, 8, hairColor);
            headBox(17, -8, 2, 8, hairColor);

            // Side burns
            headBox(10, 6, 2, 3, hairColor);
            headBox(20, 6, 2, 3, hairColor);

            // Classic Beast long bang (very thin, strictly between eyes)
            headBox(15, 6, 1, 4, hairColor);
            headBox(15, 10, 1, 3, hairColor);

            // Dense Shadows
            headBox(10, 3, 1, 3, 0x9e9e9e); 
            headBox(21, 3, 1, 3, 0x9e9e9e); 
            headBox(11, -9, 1, 9, 0x9e9e9e); 
            headBox(14, -15, 1, 15, 0x9e9e9e); 
            headBox(18, -9, 1, 9, 0x9e9e9e); 
            headBox(15, 6, 1, 7, 0x9e9e9e); // Bang shadow

            // Piercing bright silver highlights
            headBox(13, -11, 1, 6, HAIR_BEAST_HIGHLIGHT);
            headBox(17, -17, 1, 10, HAIR_BEAST_HIGHLIGHT);
            headBox(20, -11, 1, 6, HAIR_BEAST_HIGHLIGHT);

          } else if (isTransformed) {
            // SSJ2 Teen Gohan Hair - Straight, intense, highly vertical spikes
            headBox(11, 0, 10, 6, hairColor); // Base block
            headBox(10, 2, 1, 3, hairColor); // Small side ear fluff
            headBox(21, 2, 1, 3, hairColor); 

            // 5 iconic distinct vertical spikes (tightly kept above head)
            headBox(11, -5, 2, 5, hairColor); // Far left spike
            headBox(13, -9, 2, 9, hairColor); // Mid left spike (tall)
            headBox(15, -13, 2, 13, hairColor); // Center tallest spike
            headBox(17, -10, 2, 10, hairColor); // Mid right spike
            headBox(19, -6, 2, 6, hairColor); // Far right spike

            // Intermediate hair clusters smoothing the transition
            headBox(12, -4, 1, 4, hairColor); 
            headBox(14, -7, 1, 7, hairColor); 
            headBox(16, -9, 1, 9, hairColor); 
            headBox(18, -5, 1, 5, hairColor); 

            // Side burns
            headBox(11, 6, 1, 2, hairColor);
            headBox(20, 6, 1, 2, hairColor);

            // Signature thin SSJ bang down the middle
            headBox(15, 6, 1, 3, hairColor); 
            headBox(15, 9, 1, 2, hairColor); // Sharp tip

            // Detailed Shadows keeping depth
            headBox(11, 4, 1, 2, 0xd4a000); 
            headBox(20, 4, 1, 2, 0xd4a000);
            headBox(12, -4, 1, 4, 0xd4a000); 
            headBox(14, -8, 1, 8, 0xd4a000); 
            headBox(16, -12, 1, 12, 0xd4a000); 
            headBox(18, -9, 1, 9, 0xd4a000); 
            headBox(20, -5, 1, 5, 0xd4a000); 
            headBox(15, 6, 1, 5, 0xd4a000); // Bang shadow

            // Bright Golden Highlights
            headBox(11, -4, 1, 3, HAIR_SSJ_HIGHLIGHT);
            headBox(13, -8, 1, 6, HAIR_SSJ_HIGHLIGHT);
            headBox(15, -12, 1, 8, HAIR_SSJ_HIGHLIGHT);
            headBox(17, -9, 1, 5, HAIR_SSJ_HIGHLIGHT);
            headBox(19, -5, 1, 4, HAIR_SSJ_HIGHLIGHT);

          } else {
            // Base Gohan Hair - Upright spiky layers (Ultimate form style)
            headBox(11, 0, 10, 6, hairColor); // Base block
            headBox(10, 1, 1, 4, hairColor);
            headBox(21, 1, 1, 4, hairColor);
            
            // Upright Spikes
            headBox(11, -3, 2, 3, hairColor); // Far left
            headBox(13, -5, 2, 5, hairColor); // Mid left
            headBox(16, -6, 2, 6, hairColor); // Center tallest
            headBox(19, -4, 2, 4, hairColor); // Right spike
            
            // Fill gaps between spikes
            headBox(12, -1, 1, 1, hairColor); 
            headBox(15, -3, 1, 3, hairColor); 
            headBox(18, -2, 1, 2, hairColor); 
            
            // Side burns 
            headBox(11, 6, 1, 3, hairColor);
            headBox(20, 6, 1, 3, hairColor);
            
            // Bangs safely placed
            headBox(15, 6, 1, 3, hairColor); // Center bang
            headBox(13, 6, 1, 1, hairColor); // Subtle side piece
            
            // Depth Shadows
            headBox(11, 4, 1, 2, 0x333333); 
            headBox(20, 4, 1, 2, 0x333333);
            headBox(13, -2, 1, 2, 0x333333); // Between spikes
            headBox(18, -1, 1, 1, 0x333333); 
            headBox(15, 6, 1, 3, 0x333333); // Bang shadow
            
            // Highlights (subtle black sheen)
            headBox(13, -4, 1, 2, HAIR_BLACK_HIGHLIGHT);
            headBox(16, -5, 1, 3, HAIR_BLACK_HIGHLIGHT);
            headBox(19, -3, 1, 2, HAIR_BLACK_HIGHLIGHT);
          }

        }

        let textureName = key;
        if (isBeast) textureName = `${key}_ui`;
        else if (isTransformed) textureName = `${key}_ssj`;

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
