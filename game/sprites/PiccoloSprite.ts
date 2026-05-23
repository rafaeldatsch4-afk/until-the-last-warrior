import Phaser from "phaser";

export function generatePiccoloSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "piccolo";

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
          // Brighter green skin, darker purple gi for DBS look
          const GREEN_SKIN = 0x66e044;
          const GREEN_SHADOW = 0x3b9e23;
          const MUSCLE_PINK = 0xf08090;
          const MUSCLE_SHADOW = 0xc05060;
          const GI_PURPLE = 0x2a164d;
          const GI_SHADOW = 0x150b26;
          const SASH_BLUE = 0x2980b9;
          const SHOE_BROWN = 0x6b4a23;
          const WHITE_CAPE = 0xf8f8f8;
          const CAPE_SHADOW = 0xdcdcdc;
          const ORANGE_SKIN = 0xff9900;
          const ORANGE_SHADOW = 0xcc7700;
          const RED_EYES = 0xff0000;

          const skin = isTransformed ? ORANGE_SKIN : GREEN_SKIN;
          const skinShadow = isTransformed ? ORANGE_SHADOW : GREEN_SHADOW;
          const eyeColor = isTransformed ? RED_EYES : BLACK;

          // Legs
          box(10, 23, 4, 7, GI_PURPLE);
          box(18, 23, 4, 7, GI_PURPLE);
          // Gi folds/shadows on legs
          box(10, 23, 1, 7, GI_SHADOW);
          box(21, 23, 1, 7, GI_SHADOW);
          box(12, 24, 1, 5, GI_SHADOW);
          box(19, 24, 1, 5, GI_SHADOW); // Extra folds
          // Shoes
          box(10, 30, 4, 2, SHOE_BROWN);
          box(18, 30, 4, 2, SHOE_BROWN);
          dot(11, 30, 0x4a3010);
          dot(12, 30, 0x4a3010);

          // Torso
          if (isTransformed) {
            // Bulkier torso for Orange Piccolo
            box(10, 14, 12, 9, GI_PURPLE);
            // Gi folds
            box(11, 15, 1, 6, GI_SHADOW);
            box(20, 15, 1, 6, GI_SHADOW);
            box(13, 17, 1, 4, GI_SHADOW);
            box(18, 17, 1, 4, GI_SHADOW);

            box(10, 21, 12, 3, SASH_BLUE);
            box(14, 22, 4, 2, 0x1f618d);
            box(12, 13, 8, 3, skin); // Exposed chest
            // Chest muscle definition
            box(15, 14, 2, 2, skinShadow); // Cleavage
            box(13, 15, 2, 1, skinShadow);
            box(17, 15, 2, 1, skinShadow); // Pecs lower line
          } else {
            box(11, 14, 10, 9, GI_PURPLE);
            // Gi folds
            box(12, 15, 1, 6, GI_SHADOW);
            box(19, 15, 1, 6, GI_SHADOW);
            box(14, 17, 1, 4, GI_SHADOW);
            box(17, 17, 1, 4, GI_SHADOW);

            box(11, 21, 10, 3, SASH_BLUE);
            box(14, 22, 4, 2, 0x1f618d);
            box(13, 13, 6, 3, skin);
            // Chest muscle definition
            box(15, 14, 2, 2, skinShadow); // Cleavage
          }

          // Arms
          if (isAttack) {
            const armCol = skin;
            const patchCol = isTransformed ? skin : MUSCLE_PINK;
            box(21, 14, 16, 3, armCol); // Stretchy arm right
            box(21, 14, 16, 1, patchCol);
            box(35, 14, 2, 3, 0xbb3333); // Wristband stretched arm
            box(37, 14, 4, 4, armCol); // Fist
            box(37, 14, 2, 2, 0xffeebb); // Knuckles
            box(6, 15, 3, 6, armCol); // Left arm back
            box(6, 19, 3, 2, 0xbb3333); // Wristband left
          } else {
            if (isTransformed) {
              // Bulkier arms
              box(5, 15, 5, 9, skin);
              box(22, 15, 5, 9, skin);
              // Muscle lines (Orange Piccolo has distinct arm lines)
              box(6, 17, 3, 1, skinShadow);
              box(6, 20, 3, 1, skinShadow);
              box(23, 17, 3, 1, skinShadow);
              box(23, 20, 3, 1, skinShadow);
              // Bicep/Tricep definition
              box(5, 16, 1, 3, skinShadow);
              box(9, 16, 1, 3, skinShadow);
              box(22, 16, 1, 3, skinShadow);
              box(26, 16, 1, 3, skinShadow);
              // Wristbands
              box(5, 22, 4, 2, 0xbb3333);
              box(23, 22, 4, 2, 0xbb3333);
              // Hands
              box(5, 24, 4, 3, skin);
              box(23, 24, 4, 3, skin);
              // Knuckles
              box(5, 26, 4, 1, skinShadow);
              box(23, 26, 4, 1, skinShadow);
            } else {
              box(7, 15, 4, 8, skin);
              box(21, 15, 4, 8, skin);
              // Refined muscle patches
              const patchColor = MUSCLE_PINK;
              box(8, 16, 2, 3, patchColor);
              box(8, 16, 1, 3, MUSCLE_SHADOW);
              box(22, 16, 2, 3, patchColor);
              box(23, 16, 1, 3, MUSCLE_SHADOW);
              // Bicep/Tricep definition
              box(7, 16, 1, 3, skinShadow);
              box(10, 16, 1, 3, skinShadow);
              box(21, 16, 1, 3, skinShadow);
              box(24, 16, 1, 3, skinShadow);
              // Wristbands
              box(8, 21, 3, 2, 0xbb3333);
              box(21, 21, 3, 2, 0xbb3333);
              // Hands
              box(8, 23, 3, 2, skin);
              box(21, 23, 3, 2, skin);
              // Knuckles
              box(8, 24, 3, 1, skinShadow);
              box(21, 24, 3, 1, skinShadow);
            }
          }

          // Head
          if (isTransformed) {
            // Bulkier head, prominent jaw
            headBox(11, 5, 10, 8, skin);
            headBox(11, 8, 10, 2, skinShadow); // Brow shadow
            // Distinctive antennae (taller and thicker)
            headBox(12, 3, 2, 2, skin);
            headBox(13, 1, 1, 2, skin);
            headBox(18, 3, 2, 2, skin);
            headBox(18, 1, 1, 2, skin);
          } else {
            headBox(12, 6, 8, 7, skin);
            headBox(12, 8, 8, 1, skinShadow); // Brow shadow
          }

          // Facial features
          const hx = isTransformed ? 11 : 12;
          const hw = isTransformed ? 10 : 8;
          headDot(hx + 1, 12, skinShadow);
          headDot(hx + 2, 12, skinShadow); // Cheek lines
          headDot(hx + hw - 2, 12, skinShadow);
          headDot(hx + hw - 3, 12, skinShadow); // Cheek lines right
          headDot(hx - 1, 8, skin);
          headDot(hx - 1, 9, skin); // Left ear
          headDot(hx + hw, 8, skin);
          headDot(hx + hw, 9, skin); // Right ear

          // Eyes
          if (isTransformed) {
            headDot(12, 9, WHITE);
            headDot(13, 9, eyeColor);
            headDot(18, 9, WHITE);
            headDot(19, 9, eyeColor);
          } else {
            headDot(13, 9, WHITE);
            headDot(14, 9, eyeColor);
            headDot(17, 9, WHITE);
            headDot(18, 9, eyeColor);
          }

          // Mouth
          headDot(15, 11, 0xaa6655);

          // Cape and Turban (Base form only)
          if (!isTransformed) {
            // Turban
            headBox(11, 3, 10, 5, WHITE_CAPE);
            // Turban folds
            headBox(11, 5, 10, 1, CAPE_SHADOW);
            headBox(12, 4, 8, 1, CAPE_SHADOW);
            headBox(13, 6, 6, 1, CAPE_SHADOW);
            headBox(13, 2, 6, 2, GI_PURPLE);
            headBox(14, 2, 4, 1, GI_SHADOW); // Turban gem/knot shadow

            // Cape shoulders
            headBox(5, 13, 7, 4, WHITE_CAPE);
            headDot(5, 12, WHITE_CAPE);
            headBox(20, 13, 7, 4, WHITE_CAPE);
            headDot(26, 12, WHITE_CAPE);
            // Cape shoulder pads definition
            headBox(6, 14, 5, 1, CAPE_SHADOW);
            headBox(7, 16, 3, 1, CAPE_SHADOW);
            headBox(21, 14, 5, 1, CAPE_SHADOW);
            headBox(22, 16, 3, 1, CAPE_SHADOW);

            // Cape back
            box(11, 13, 10, 3, WHITE_CAPE);
            // Cape back folds
            box(12, 14, 1, 2, CAPE_SHADOW);
            box(15, 14, 2, 2, CAPE_SHADOW);
            box(19, 14, 1, 2, CAPE_SHADOW);
          }
          break;
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

    if (scene.textures.exists("piccolo")) { scene.textures.remove("piccolo"); }
    generateForm(0);
    
    if (scene.textures.exists("piccolo_ssj")) { scene.textures.remove("piccolo_ssj"); }
    generateForm(1);
    
    if (scene.textures.exists("piccolo_ui")) { scene.textures.remove("piccolo_ui"); }
    generateForm(2);
}
