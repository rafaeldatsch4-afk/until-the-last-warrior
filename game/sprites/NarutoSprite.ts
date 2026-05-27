import Phaser from "phaser";

export function generateNarutoSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "naruto";

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
          const SKIN = 0xffccaa;
          const ORANGE = 0xff8800;
          const BLACK = 0x111111;
          const BLUE = 0x2244aa;
          const YELLOW_HAIR = 0xffdd00;
          const RED_COAT = 0xcc0000;

          const K_ORANGE = 0xffaa00; // Kurama mode base
          const K_YELLOW = 0xffff00; // Kurama mode glow
          const K_BLACK = 0x000000; // Markings

          const isSageMode = form === 1;
          const isKuramaMode = form === 2;

          if (isKuramaMode) {
            // Truth-Seeking Orbs (floating behind)
            const orbY = breatheOffset - 4 + Math.sin(f * Math.PI) * 2;
            box(4, orbY, 4, 4, K_BLACK);
            box(24, orbY + 4, 4, 4, K_BLACK);
            box(6, orbY + 12, 4, 4, K_BLACK);
            box(22, orbY + 16, 4, 4, K_BLACK);
          }

          const suitColor = isKuramaMode ? K_ORANGE : ORANGE;
          const detailColor = isKuramaMode ? K_BLACK : BLACK;
          const skinColor = isKuramaMode ? K_YELLOW : SKIN;
          const hairColor = isKuramaMode ? K_YELLOW : YELLOW_HAIR;
          const suitShadow = isKuramaMode ? 0xcc8800 : 0xcc6600;
          const SAGE_ORANGE = 0xff4400;

          // Scroll on back (drawn before torso so it's behind)
          if (isSageMode) {
            box(8, 15, 16, 8, 0xdddddd); // Scroll base
            box(7, 16, 18, 6, 0x880000); // Scroll ends
            box(10, 15, 12, 8, 0xeeeeee); // Scroll inner
            box(8, 23, 16, 1, 0xaaaaaa); // Scroll shadow
          }

          // Legs
          box(10, 24, 4, 6, suitColor);
          box(18, 24, 4, 6, suitColor);
          box(10, 24, 1, 6, suitShadow);
          box(21, 24, 1, 6, suitShadow); // Leg shadow
          // Shoes/Sandals
          box(10, 30, 4, 2, detailColor);
          box(18, 30, 4, 2, detailColor);
          box(10, 31, 4, 1, 0x000000);
          box(18, 31, 4, 1, 0x000000); // Shoe shadow
          if (!isKuramaMode) {
            // Bandages on right leg
            box(10, 26, 4, 2, 0xeeeeee);
            box(10, 27, 4, 1, 0xcccccc); // Bandage shadow
            // Holster on right leg
            box(13, 25, 2, 3, BLACK);
          }

          // Torso
          box(11, 14, 10, 10, suitColor);
          box(11, 14, 1, 10, suitShadow);
          box(20, 14, 1, 10, suitShadow); // Torso shadow
          if (isKuramaMode) {
            // Magatama markings on chest
            box(13, 16, 2, 2, K_BLACK);
            box(17, 16, 2, 2, K_BLACK);
            box(15, 18, 2, 2, K_BLACK);
            // Center line
            box(15, 20, 2, 4, K_BLACK);
          } else {
            // Jacket zipper/black details
            box(15, 14, 2, 10, BLACK);
            box(11, 14, 10, 3, BLACK); // Shoulders
            box(11, 16, 10, 1, 0x000000); // Shoulder shadow
            // Orange collar
            box(11, 13, 10, 2, ORANGE);
            box(11, 14, 10, 1, 0xcc6600); // Collar shadow
            // White swirl on left arm
            box(21, 16, 2, 2, 0xeeeeee);

            if (isSageMode) {
              // Red Coat (Open in the front)
              // Left side
              box(9, 14, 4, 12, RED_COAT);
              box(9, 14, 1, 12, 0x880000); // Coat shadow
              box(9, 24, 4, 2, BLACK); // Flames
              // Right side
              box(19, 14, 4, 12, RED_COAT);
              box(22, 14, 1, 12, 0x880000); // Coat shadow
              box(19, 24, 4, 2, BLACK); // Flames
            }
          }

          // Arms
          if (isAttack) {
            if (isSageMode) {
              box(21, 13, 6, 5, RED_COAT); // thick coat upper arm
              box(21, 13, 1, 5, 0x880000);
              box(27, 14, 5, 3, RED_COAT); // coat lower arm
              box(31, 14, 2, 3, suitColor); // undershirt
              box(32, 14, 4, 4, skinColor); // fist
              box(32, 14, 2, 2, 0xffeebb); // Knuckles
              alphaBox(34, 14, 4, 3, skinColor, 0.4); // blur
              box(5, 15, 4, 5, RED_COAT);
            } else {
              box(21, 13, 6, 4, suitColor); // Right upper arm
              box(21, 13, 1, 4, suitShadow);
              box(27, 14, 5, 3, suitColor); // Right lower arm
              box(31, 14, 4, 4, skinColor); // Hand out
              box(31, 14, 2, 2, 0xffeebb); // Knuckles
              alphaBox(33, 14, 4, 3, skinColor, 0.4); // blur
              box(5, 15, 4, 5, suitColor); // Left held back
            }
          } else {
            if (isSageMode) {
              box(6, 14, 4, 6, RED_COAT);
              box(22, 14, 4, 6, RED_COAT); // Coat sleeves
              box(6, 14, 1, 6, 0x880000);
              box(25, 14, 1, 6, 0x880000); // Sleeve shadow
              box(7, 20, 3, 3, skinColor);
              box(22, 20, 3, 3, skinColor); // Hands
              box(7, 22, 3, 1, 0xcc9977);
              box(22, 22, 3, 1, 0xcc9977); // Hand shadow
            } else {
              box(8, 14, 3, 6, suitColor);
              box(21, 14, 3, 6, suitColor);
              box(8, 14, 1, 6, suitShadow);
              box(23, 14, 1, 6, suitShadow); // Arm shadow
              box(8, 20, 3, 3, skinColor);
              box(21, 20, 3, 3, skinColor); // Hands
              box(8, 22, 3, 1, 0xcc9977);
              box(21, 22, 3, 1, 0xcc9977); // Hand shadow
            }
          }

          // Head
          headBox(12, 6, 8, 7, skinColor);
          headBox(12, 6, 1, 7, 0xcc9977);
          headBox(19, 6, 1, 7, 0xcc9977); // Face shadow

          // Headband
          if (isKuramaMode) {
            headBox(11, 5, 10, 2, suitColor);
            headBox(13, 5, 6, 2, K_BLACK); // Plate
          } else {
            headBox(11, 5, 10, 2, BLUE); // Blue headband
            headBox(13, 5, 6, 2, 0xaaaaaa); // Metal plate
          }

          // Eyes
          if (isKuramaMode) {
            headBox(13, 8, 2, 2, K_ORANGE);
            headBox(17, 8, 2, 2, K_ORANGE);
            headDot(13, 8, K_BLACK);
            headDot(17, 8, K_BLACK); // Cross/slit pupils
          } else if (isSageMode) {
            // Orange pigmentation around eyes (subtle border)
            headBox(12, 7, 4, 3, SAGE_ORANGE);
            headBox(16, 7, 4, 3, SAGE_ORANGE);
            // Yellow eyes
            headBox(13, 8, 2, 2, K_YELLOW);
            headBox(17, 8, 2, 2, K_YELLOW);
            // Horizontal slit pupils
            headBox(13, 8, 2, 1, BLACK);
            headBox(17, 8, 2, 1, BLACK);
          } else {
            headBox(13, 8, 2, 2, WHITE);
            headBox(17, 8, 2, 2, WHITE);
            headDot(14, 8, BLUE);
            headDot(17, 8, BLUE);
          }

          // Whisker marks
          const whiskerColor = isKuramaMode ? K_BLACK : 0x884422;
          // Thicker whiskers for Kurama mode
          if (isKuramaMode) {
            headBox(11, 10, 3, 1, whiskerColor);
            headBox(11, 12, 3, 1, whiskerColor);
            headBox(18, 10, 3, 1, whiskerColor);
            headBox(18, 12, 3, 1, whiskerColor);
          } else {
            headBox(12, 10, 2, 1, whiskerColor);
            headBox(12, 12, 2, 1, whiskerColor);
            headBox(18, 10, 2, 1, whiskerColor);
            headBox(18, 12, 2, 1, whiskerColor);
          }

          // Subtle Expressions
          if (isAttack) {
            headBox(15, 11, 2, 1, 0x440000); // Small open mouth
          } else if (isDefend) {
            headBox(15, 11, 2, 1, WHITE); // Clenched teeth
          } else {
            headDot(16, 11, 0x222222); // Smirk corner
          }

          // Spiky Hair
          if (isKuramaMode) {
            // Even more massive spiky hair
            headBox(10, 0, 12, 5, hairColor);
            headBox(12, -4, 3, 4, hairColor);
            headBox(17, -4, 3, 4, hairColor);
            headBox(14, -6, 4, 6, hairColor);
            headBox(8, 2, 3, 4, hairColor);
            headBox(21, 2, 3, 4, hairColor);
            // Horn-like chakra spikes
            headBox(10, -8, 2, 6, hairColor);
            headBox(20, -8, 2, 6, hairColor);
          } else {
            headBox(11, 2, 10, 3, hairColor);
            headBox(12, -1, 3, 3, hairColor);
            headBox(17, -1, 3, 3, hairColor);
            headBox(14, -3, 4, 5, hairColor);
            headBox(9, 3, 3, 3, hairColor);
            headBox(20, 3, 3, 3, hairColor);
            // Sideburns
            headBox(11, 5, 1, 3, hairColor);
            headBox(20, 5, 1, 3, hairColor);
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

    if (!scene.textures.exists("naruto")) { generateForm(0); }
    if (!scene.textures.exists("naruto_ssj")) { generateForm(1); }
    if (!scene.textures.exists("naruto_ui")) { generateForm(2); }
}
