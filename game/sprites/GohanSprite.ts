import Phaser from "phaser";

export function generateGohanSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "gohan";

    const isTransformed = form > 0;
    const isUI = form === 2;
    const SCALE = 2;
    // Increased frame width to prevent extended limbs/weapons from bleeding into adjacent frames
    const FRAME_WIDTH = 96;
    const FRAME_HEIGHT = 64; // Taller frame to support big hair
    const DRAW_OFFSET_Y = 32; // Shift body down so feet are at bottom of 64px frame
    const FRAMES = 12;

    // Calculate total dimensions
    const sheetWidth = FRAME_WIDTH * SCALE * FRAMES;
    const sheetHeight = FRAME_HEIGHT * SCALE;

    const canvas = scene.make.graphics({ x: 0, y: 0 });

    // Shift sprites horizontally to center them in the new wider frame
    // Standard frame is 96px wide. Local center is 16. Shift by 32 gets to 48 (center).
    const shiftX = 32;

    // Loop to draw 8 frames side by side
    for (let f = 0; f < FRAMES; f++) {
      const offsetX = f * FRAME_WIDTH;
      const isWalk = f >= 4 && f <= 7;
      const isAttack = f === 8 || f === 9;
      const isDefend = f === 10;
      const isCharge = f === 11;

      // ANIMATION LOGIC: Breathing / Bobbing
      // Note: y coordinates below 22 are bobbed. DRAW_OFFSET_Y is added to final position.
      const breatheOffset = (!isAttack && !isDefend && !isCharge && !isWalk && (f === 1 || f === 3)) ? 1 : 0;

      // Pose offsets
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
        const { ox, oy } = typeof getWalkOffsets === 'function' ? getWalkOffsets(x, y) : { ox:0, oy:0 };
        const finalX = (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX + ox;
        const finalYPose = (isAttack || isDefend || isCharge ? finalY + poseOffsetY / 2 : finalY) + (typeof oy !== 'undefined' ? oy : 0);
        canvas.fillStyle(color, 1);
        canvas.fillRect(
          (offsetX + finalX) * SCALE,
          (finalYPose + DRAW_OFFSET_Y) * SCALE,
          SCALE,
          SCALE,
        );
      };

      const alphaBox = (
        x: number,
        y: number,
        w: number,
        h: number,
        color: number,
        alpha: number,
      ) => {
        const finalY = y < 24 ? y + breatheOffset : y;
        const { ox, oy } = typeof getWalkOffsets === 'function' ? getWalkOffsets(x, y) : { ox:0, oy:0 };
        const finalX = (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX + ox;
        const finalYPose = (isAttack || isDefend || isCharge ? finalY + poseOffsetY / 2 : finalY) + (typeof oy !== 'undefined' ? oy : 0);
        canvas.fillStyle(color, alpha);
        canvas.fillRect(
          (offsetX + finalX) * SCALE,
          (finalYPose + DRAW_OFFSET_Y) * SCALE,
          w * SCALE,
          h * SCALE,
        );
      };

      const box = (
        x: number,
        y: number,
        w: number,
        h: number,
        color: number,
      ) => {
        const finalY = y < 24 ? y + breatheOffset : y;
        const { ox, oy } = typeof getWalkOffsets === 'function' ? getWalkOffsets(x, y) : { ox:0, oy:0 };
        const finalX = (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX + ox;
        const finalYPose = (isAttack || isDefend || isCharge ? finalY + poseOffsetY / 2 : finalY) + (typeof oy !== 'undefined' ? oy : 0);
        canvas.fillStyle(color, 1);
        canvas.fillRect(
          (offsetX + finalX) * SCALE,
          (finalYPose + DRAW_OFFSET_Y) * SCALE,
          w * SCALE,
          h * SCALE,
        );
      };

      const headBox = (
        x: number,
        y: number,
        w: number,
        h: number,
        color: number,
      ) => {
        const { ox, oy } = typeof getWalkOffsets === 'function' ? getWalkOffsets(x, y) : { ox:0, oy:0 };
        const finalX = (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX + ox;
        const finalYPose = isAttack || isDefend ? y + poseOffsetY / 2 : y;
        canvas.fillStyle(color, 1);
        canvas.fillRect(
          (offsetX + finalX) * SCALE,
          (finalYPose + breatheOffset + DRAW_OFFSET_Y) * SCALE,
          w * SCALE,
          h * SCALE,
        );
      };
      const headDot = (x: number, y: number, color: number) => {
        const { ox, oy } = typeof getWalkOffsets === 'function' ? getWalkOffsets(x, y) : { ox:0, oy:0 };
        const finalX = (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX + ox;
        const finalYPose = isAttack || isDefend ? y + poseOffsetY / 2 : y;
        canvas.fillStyle(color, 1);
        canvas.fillRect(
          (offsetX + finalX) * SCALE,
          (finalYPose + breatheOffset + DRAW_OFFSET_Y) * SCALE,
          SCALE,
          SCALE,
        );
      };

      const SKIN = 0xffcc99;
      const WHITE = 0xffffff;
      const BLACK = 0x111111;

      {
          const GI_PURPLE = 0x5b2c6f; // Deep violet/purple (Piccolo's Gi)
          const GI_SHADOW = 0x4a235a;
          const SASH_RED = 0xc0392b; // Red sash
          const SASH_SHADOW = 0x922b21;
          const SHOE_BROWN = 0xa0522d; // Tan/brown shoes
          const WRISTBAND_RED = 0xc0392b; // Super Hero wristbands are red
          const WRISTBAND_SHADOW = 0x922b21;

          const HAIR_BASE = BLACK;
          const HAIR_BEAST = 0xf8f9fa; // Bright silver/white
          const HAIR_SHADOW = 0xced4da;
          const EYE_BEAST = 0xff0000; // Red eyes

          const hairColor = isTransformed ? HAIR_BEAST : HAIR_BASE;
          const eyeColor = isTransformed ? EYE_BEAST : BLACK;

          if (isTransformed) {
            // Layered Violet/Magenta/Red/Blue Aura (Beast aura is wild)
            const AURA_VIOLET = 0x8a2be2;
            const AURA_MAGENTA = 0xff00ff;
            const AURA_RED = 0xff3333;
            const AURA_LIGHT = 0xddaaff;

            const drawAura = (x: number, y: number, w: number, h: number) => {
              canvas.fillRect(
                (offsetX + x) * SCALE,
                (breatheOffset + y + DRAW_OFFSET_Y) * SCALE,
                w * SCALE,
                h * SCALE,
              );
            };

            // Outer violet aura (jagged)
            canvas.fillStyle(AURA_VIOLET, 0.3);
            drawAura(0, -30, 32, 62);
            drawAura(2, -36, 28, 68);
            drawAura(6, -42, 20, 74);

            // Inner magenta aura
            canvas.fillStyle(AURA_MAGENTA, 0.5);
            drawAura(3, -20, 26, 52);
            drawAura(5, -26, 22, 58);
            drawAura(8, -32, 16, 64);

            // Reddish inner core
            canvas.fillStyle(AURA_RED, 0.4);
            drawAura(6, -10, 20, 42);
            drawAura(10, -18, 12, 50);

            // Core light aura
            canvas.fillStyle(AURA_LIGHT, 0.6);
            drawAura(8, -4, 16, 36);
            drawAura(12, -12, 8, 44);

            // Aura lightning / energy sparks (Blue/Purple lightning)
            canvas.fillStyle(0x00ffff, 0.8);
            if (f % 3 === 0) {
              drawAura(4, 10, 2, 12);
              drawAura(6, 16, 6, 2);
              drawAura(10, 18, 2, 8);
              drawAura(26, -10, 2, 10);
              drawAura(22, 0, 6, 2);
            } else if (f % 3 === 1) {
              drawAura(28, 15, 2, 10);
              drawAura(22, 21, 8, 2);
              drawAura(20, 23, 2, 8);
              drawAura(4, -15, 2, 12);
              drawAura(6, -5, 6, 2);
            } else {
              drawAura(2, -5, 2, 10);
              drawAura(4, 2, 6, 2);
              drawAura(26, 25, 2, 12);
              drawAura(20, 31, 8, 2);
            }

            // Subtle purple/white aura particles
            canvas.fillStyle(0xffffff, 0.9);
            if (f % 4 === 0) {
              drawAura(-5, 5, 3, 3);
              drawAura(35, -15, 3, 3);
              drawAura(15, -50, 3, 3);
            } else if (f % 4 === 2) {
              drawAura(-8, -25, 3, 3);
              drawAura(40, 15, 3, 3);
              drawAura(10, -45, 3, 3);
            }
            canvas.fillStyle(0xddaaff, 0.9);
            if (f % 5 === 0) {
              drawAura(8, -10, 3, 3);
              drawAura(30, -30, 3, 3);
              drawAura(25, -55, 3, 3);
            } else if (f % 5 === 2) {
              drawAura(-10, -15, 3, 3);
              drawAura(35, 5, 3, 3);
              drawAura(12, -52, 3, 3);
            }
          }

          // --- BODY ---
          // Legs
          box(10, 23, 4, 6, GI_PURPLE);
          box(18, 23, 4, 6, GI_PURPLE);
          // Gi folds on legs
          box(10, 23, 1, 6, GI_SHADOW);
          box(21, 23, 1, 6, GI_SHADOW);
          box(12, 24, 1, 4, GI_SHADOW);
          box(19, 24, 1, 4, GI_SHADOW);
          // Shoes (Brown)
          box(10, 29, 4, 3, SHOE_BROWN);
          box(18, 29, 4, 3, SHOE_BROWN);
          box(10, 29, 4, 1, 0xcd853f);
          box(18, 29, 4, 1, 0xcd853f); // Shoe highlight
          box(10, 31, 4, 1, 0x5c4033);
          box(18, 31, 4, 1, 0x5c4033); // Sole
          // Shoe shadows
          box(10, 30, 1, 2, 0x8b4513);
          box(18, 30, 1, 2, 0x8b4513);

          // Torso
          box(11, 14, 10, 9, GI_PURPLE);
          box(14, 14, 4, 2, SKIN); // Neck/Chest opening
          // Neck shadow
          box(14, 15, 4, 1, 0xe0ac7d);
          dot(15, 16, SKIN); // V-neck dip
          // Gi folds on torso
          box(19, 17, 2, 6, GI_SHADOW); // Shading right
          box(11, 17, 1, 5, GI_SHADOW); // Shading left
          box(14, 18, 1, 4, GI_SHADOW);
          box(17, 18, 1, 4, GI_SHADOW); // Inner folds
          box(12, 19, 8, 1, GI_SHADOW); // Horizontal fold

          // Sash with knot (Red)
          box(11, 22, 10, 2, SASH_RED);
          // Sash shadow
          box(11, 23, 10, 1, SASH_SHADOW);
          const knotY = f % 2 === 0 ? 23 : 24;
          box(11, 23, 2, 4, SASH_RED);
          dot(12, 27, SASH_RED);
          box(11, 24, 1, 3, SASH_SHADOW); // Knot shadow

          // Arms (Wristbands)
          if (isAttack) {
            // Kamehameha hands together forward
            box(21, 13, 5, 4, GI_PURPLE); // Bicep
            box(21, 13, 1, 4, GI_SHADOW);
            box(26, 14, 5, 3, GI_PURPLE); // Forearm
            box(30, 14, 2, 3, WRISTBAND_RED); // wristbands
            box(32, 13, 4, 4, SKIN); // Hands together firing
            box(32, 13, 2, 4, 0xffeebb); // Hands highlight
            alphaBox(34, 13, 4, 4, SKIN, 0.4); // blur
            box(6, 15, 4, 5, GI_PURPLE); // left arm back
            box(6, 19, 4, 2, WRISTBAND_RED);
          } else {
            box(8, 14, 3, 4, GI_PURPLE);
            box(21, 14, 3, 4, GI_PURPLE);
            // Shoulder gi folds
            box(8, 15, 1, 3, GI_SHADOW);
            box(23, 15, 1, 3, GI_SHADOW);

            box(8, 18, 3, 3, SKIN);
            box(21, 18, 3, 3, SKIN);
            // Arm muscle shading
            box(8, 18, 1, 3, 0xe0ac7d);
            box(23, 18, 1, 3, 0xe0ac7d);
            box(9, 19, 1, 2, 0xe0ac7d);
            box(22, 19, 1, 2, 0xe0ac7d); // Bicep definition

            box(8, 20, 3, 3, WRISTBAND_RED);
            box(21, 20, 3, 3, WRISTBAND_RED); // Wristband
            // Wristband shadow
            box(8, 20, 1, 3, WRISTBAND_SHADOW);
            box(23, 20, 1, 3, WRISTBAND_SHADOW);

            box(8, 23, 3, 2, SKIN);
            box(21, 23, 3, 2, SKIN); // Hands
            // Knuckles
            box(8, 24, 3, 1, 0xe0ac7d);
            box(21, 24, 3, 1, 0xe0ac7d);
          }

          // Head
          headBox(12, 6, 8, 7, SKIN);
          headDot(11, 9, SKIN);
          headDot(20, 9, SKIN); // Ears
          headDot(11, 10, 0xe0ac7d);
          headDot(20, 10, 0xe0ac7d); // Ear shadows
          headBox(13, 12, 6, 1, 0xe0ac7d); // Jaw shadow

          // Face
          headDot(13, 9, WHITE);
          headDot(17, 9, WHITE); // Sclera
          headDot(14, 9, eyeColor);
          headDot(18, 9, eyeColor); // Pupils
          headDot(13, 8, hairColor);
          headDot(14, 8, hairColor);
          headDot(17, 8, hairColor);
          headDot(18, 8, hairColor);
          // Angry brow furrow
          headDot(15, 8, 0xe0ac7d);
          headDot(16, 8, 0xe0ac7d);
          headDot(15, 11, 0xcc8866); // Nose
          // Cheek lines (iconic DBZ style)
          headDot(13, 11, 0xe0ac7d);
          headDot(18, 11, 0xe0ac7d);

          // Subtle Expressions
          if (isAttack) {
            headBox(15, 12, 2, 1, 0x440000); // Small open mouth
          } else if (isDefend) {
            headBox(15, 12, 2, 1, WHITE); // Clenched teeth
          } else {
            headDot(16, 12, 0x222222); // Smirk corner
          }

          if (isTransformed) {
            // Beast Hair (Spiky, tall, but within bounds)
            headBox(11, 0, 10, 6, hairColor); // Base
            headBox(10, -2, 2, 6, hairColor); // Left side
            headBox(20, -2, 2, 6, hairColor); // Right side
            headBox(12, -4, 2, 6, hairColor); // Top spike left
            headBox(15, -6, 3, 8, hairColor); // Top spike middle (tallest)
            headBox(18, -3, 2, 5, hairColor); // Top spike right
            headBox(8, 2, 2, 4, hairColor); // Far left spike
            headBox(22, 2, 2, 4, hairColor); // Far right spike

            // The iconic Beast bang
            headBox(14, 6, 2, 3, hairColor);
            headBox(15, 9, 1, 2, hairColor);

            // Hair shading
            headBox(11, -2, 1, 6, HAIR_SHADOW);
            headBox(20, -2, 1, 6, HAIR_SHADOW);
            headBox(12, -4, 1, 6, HAIR_SHADOW);
            headBox(18, -3, 1, 5, HAIR_SHADOW);
            headBox(15, -6, 1, 8, HAIR_SHADOW); // Middle spike shadow
            headBox(14, 6, 1, 3, HAIR_SHADOW); // Bang shadow
          } else {
            // Ultimate Gohan hair (spiky but normal length, one bang)
            headBox(11, 1, 10, 5, hairColor);
            headBox(10, -1, 2, 4, hairColor); // Left side
            headBox(20, -1, 2, 4, hairColor); // Right side
            headBox(12, -3, 2, 4, hairColor); // Top spike left
            headBox(15, -4, 2, 5, hairColor); // Top spike middle
            headBox(18, -2, 2, 3, hairColor); // Top spike right

            // Bang
            headBox(14, 6, 2, 3, hairColor);
            headBox(15, 9, 1, 2, hairColor);

            // Hair shading
            const hairShadow = 0x333333;
            headBox(11, -1, 1, 4, hairShadow);
            headBox(20, -1, 1, 4, hairShadow);
            headBox(12, -3, 1, 4, hairShadow);
            headBox(18, -2, 1, 3, hairShadow);
            headBox(15, -4, 1, 5, hairShadow); // Middle spike shadow
            headBox(14, 6, 1, 3, hairShadow); // Bang shadow
          }
        }
    } // End Switch Equivalent


    let textureName = key;
    if (isUI) textureName = `${key}_ui`;
    else if (isTransformed) textureName = `${key}_ssj`;

    canvas.generateTexture(textureName, sheetWidth, sheetHeight);

    // Manually add frame data to the new texture so Phaser knows it's a spritesheet
    if (scene.textures.exists(textureName)) {
      const tex = scene.textures.get(textureName);
      const fw = FRAME_WIDTH * SCALE;
      const fh = FRAME_HEIGHT * SCALE;
      for (let i = 0; i < FRAMES; i++) {
        tex.add(i.toString(), 0, i * fw, 0, fw, fh);
      }
    }

    canvas.destroy();    };

    if (!scene.textures.exists("gohan")) { generateForm(0); }
    if (!scene.textures.exists("gohan_ssj")) { generateForm(1); }
    if (!scene.textures.exists("gohan_ui")) { generateForm(2); }
}
