import Phaser from "phaser";

export function generateGojoSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "gojo";

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
          const isTransformed = form === 1;
          const SKIN = 0xffeebb;
          const SKIN_SHADOW = 0xccbb99;
          const HAIR = 0xffffff;
          const HAIR_SHADOW = 0xdddddd;
          const JACKET = 0x1a1a24;
          const JACKET_SHADOW = 0x0f0f15;
          const PANTS = 0x1a1a24;
          const PANTS_SHADOW = 0x0f0f15;
          const SHOES = 0x111111;
          const BLINDFOLD = 0x111111;
          const EYE_BLUE = 0x00ffff;
          const EYE_WHITE = 0xffffff;

          // Legs
          box(11, 24, 4, 6, PANTS);
          box(17, 24, 4, 6, PANTS);
          box(11, 24, 1, 6, PANTS_SHADOW);
          box(20, 24, 1, 6, PANTS_SHADOW); // Pants shadow

          // Shoes
          box(10, 30, 5, 2, SHOES);
          box(17, 30, 5, 2, SHOES);

          // Torso (Jacket)
          box(10, 14, 12, 10, JACKET);
          box(10, 14, 2, 10, JACKET_SHADOW);
          box(20, 14, 2, 10, JACKET_SHADOW); // Jacket shadow
          box(15, 14, 2, 10, JACKET_SHADOW); // Zipper line

          // Arms
          if (isAttack) {
            box(21, 14, 10, 3, JACKET); // Right arm out
            box(21, 14, 10, 1, JACKET_SHADOW);
            box(31, 14, 3, 3, SKIN); // Hand points
            box(6, 15, 3, 5, JACKET); // Left arm back
          } else {
            box(7, 14, 3, 8, JACKET);
            box(22, 14, 3, 8, JACKET);
            box(7, 14, 1, 8, JACKET_SHADOW);
            box(24, 14, 1, 8, JACKET_SHADOW); // Arm shadow

            // Hands
            box(7, 22, 3, 2, SKIN);
            box(22, 22, 3, 2, SKIN);
            box(7, 22, 1, 2, SKIN_SHADOW);
            box(24, 22, 1, 2, SKIN_SHADOW); // Hand shadow
          }

          // Head
          headBox(12, 6, 8, 8, SKIN);
          headBox(12, 6, 1, 8, SKIN_SHADOW);
          headBox(19, 6, 1, 8, SKIN_SHADOW); // Face shadow

          // Subtle Expressions
          if (!isTransformed) {
            // Blindfold on, so mouth is key expression
            if (isAttack) {
              headBox(15, 12, 2, 1, 0x440000); // Small open mouth
            } else if (isDefend) {
              headBox(15, 12, 2, 1, EYE_WHITE); // Clenched teeth
            } else {
              headDot(16, 12, 0x222222); // Smirk corner
            }
          }

          if (isTransformed) {
            // LIMITLESS / SIX EYES (Blindfold off, floating hair)

            // Hair (Spiky, floating up)
            headBox(10, 0, 12, 6, HAIR);
            headBox(11, -2, 10, 2, HAIR);
            headBox(12, -4, 8, 2, HAIR);
            headBox(14, -6, 4, 2, HAIR);

            // Hair shadow
            headBox(10, 0, 2, 6, HAIR_SHADOW);
            headBox(20, 0, 2, 6, HAIR_SHADOW);

            // Eyes (Six Eyes) - Better proportions
            headBox(13, 8, 2, 1, EYE_WHITE);
            headBox(17, 8, 2, 1, EYE_WHITE); // Sclera
            headBox(14, 8, 1, 1, EYE_BLUE);
            headBox(18, 8, 1, 1, EYE_BLUE); // Bright blue iris

            // Eyebrows
            headBox(13, 7, 2, 1, HAIR);
            headBox(17, 7, 2, 1, HAIR);

            // Smile
            headBox(15, 11, 2, 1, 0x000000); // Smile
          } else {
            // BASE FORM (Blindfold on, hair down)

            // Hair (Swept down)
            headBox(10, 2, 12, 5, HAIR);
            headBox(11, 0, 10, 2, HAIR);
            headBox(13, -2, 6, 2, HAIR);
            // Bangs over blindfold
            headBox(11, 7, 2, 3, HAIR);
            headBox(14, 7, 4, 2, HAIR);
            headBox(19, 7, 2, 3, HAIR);

            // Hair shadow
            headBox(10, 2, 2, 5, HAIR_SHADOW);
            headBox(20, 2, 2, 5, HAIR_SHADOW);

            // Blindfold
            headBox(11, 8, 10, 3, BLINDFOLD);
            headBox(11, 8, 10, 1, 0x222222); // Blindfold highlight

            // Smile
            headBox(15, 12, 2, 1, SKIN_SHADOW);
          }
        }
    } // End Switch Equivalent


    let textureName = key;
    if (isUI) textureName = `${key}_ui`;
    else if (isTransformed) textureName = `${key}_ssj`;

    canvas.generateTexture(textureName, sheetWidth, sheetHeight);
    canvas.destroy();

    // Manually add frame data to the new texture so Phaser knows it's a spritesheet
    if (scene.textures.exists(textureName)) {
      const tex = scene.textures.get(textureName);
      const fw = FRAME_WIDTH * SCALE;
      const fh = FRAME_HEIGHT * SCALE;
      for (let i = 0; i < FRAMES; i++) {
        tex.add(i.toString(), 0, i * fw, 0, fw, fh);
      }
    }
    };

    if (!scene.textures.exists("gojo")) { generateForm(0); }
    if (!scene.textures.exists("gojo_ssj")) { generateForm(1); }
    if (!scene.textures.exists("gojo_ui")) { generateForm(2); }
}
