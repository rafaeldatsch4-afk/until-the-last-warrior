import Phaser from "phaser";

export function generateMinipekkaSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "minipekka";

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
          const METAL_LIGHT = isTransformed ? 0x333333 : 0xd5dbdb;
          const METAL_DARK = isTransformed ? 0x111111 : 0x7f8c8d;
          const METAL_JOINT = isTransformed ? 0x1a1a1a : 0x2c3e50;
          const ACCENT = isTransformed ? 0x9b59b6 : 0x3498db; // Blue vs Purple
          const EYE = isTransformed ? 0xff33cc : 0x00ffff; // Cyan vs Pinkish-Purple

          // Legs
          box(10, 29, 5, 3, METAL_DARK);
          box(17, 29, 5, 3, METAL_DARK); // Feet
          box(10, 27, 5, 2, METAL_LIGHT);
          box(17, 27, 5, 2, METAL_LIGHT); // Lower leg
          box(11, 25, 3, 2, METAL_JOINT);
          box(18, 25, 3, 2, METAL_JOINT); // Joint
          // Leg shading
          box(10, 29, 1, 3, 0x111111);
          box(17, 29, 1, 3, 0x111111);
          box(10, 27, 1, 2, METAL_DARK);
          box(17, 27, 1, 2, METAL_DARK);

          const offY = 6;
          // Torso
          box(11, 19 + offY, 10, 3, METAL_JOINT); // Waist
          box(9, 13 + offY, 14, 7, METAL_LIGHT); // Chest
          box(9, 18 + offY, 14, 2, METAL_DARK); // Lower chest
          box(13, 14 + offY, 6, 5, METAL_DARK); // Chest plate
          box(14, 15 + offY, 4, 3, ACCENT); // Chest core
          // Torso shading
          box(9, 13 + offY, 1, 7, METAL_DARK);
          box(22, 13 + offY, 1, 7, METAL_DARK);
          box(13, 14 + offY, 1, 5, 0x111111);
          box(18, 14 + offY, 1, 5, 0x111111);

          // Arms
          box(7, 15 + offY, 2, 6, METAL_LIGHT);
          box(23, 15 + offY, 2, 6, METAL_LIGHT); // Upper arm
          box(7, 21 + offY, 2, 2, METAL_DARK);
          box(23, 21 + offY, 2, 2, METAL_DARK); // Hand
          // Arm shading
          box(7, 15 + offY, 1, 6, METAL_DARK);
          box(24, 15 + offY, 1, 6, METAL_DARK);

          // Sword
          const swordY = f % 2 === 0 ? 14 + offY : 15 + offY;
          headBox(6, swordY + 6, 2, 4, 0x555555); // Hilt
          headBox(5, swordY + 5, 4, 1, METAL_DARK); // Guard
          headBox(5, swordY - 2, 4, 7, 0xecf0f1); // Blade
          headBox(6, swordY - 3, 2, 1, 0xecf0f1); // Tip
          // Sword shading
          headBox(7, swordY - 2, 2, 7, 0xbdc3c7);
          headBox(7, swordY - 3, 1, 1, 0xbdc3c7);

          // Head
          headBox(11, 10 + offY, 10, 3, METAL_LIGHT); // Lower head
          headBox(11, 6 + offY, 10, 4, METAL_LIGHT); // Upper head
          headBox(11, 9 + offY, 10, 2, 0x000000); // Visor slit
          headBox(14, 9 + offY, 4, 2, EYE); // Eye
          headBox(9, 5 + offY, 2, 4, ACCENT);
          headBox(21, 5 + offY, 2, 4, ACCENT); // Horns
          headDot(9, 4 + offY, ACCENT);
          headDot(21, 4 + offY, ACCENT); // Horn tips
          // Head shading
          headBox(11, 6 + offY, 1, 7, METAL_DARK);
          headBox(20, 6 + offY, 1, 7, METAL_DARK);
          headBox(9, 5 + offY, 1, 4, 0x111111);
          headBox(22, 5 + offY, 1, 4, 0x111111);
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

    if (!scene.textures.exists("minipekka")) { generateForm(0); }
    if (!scene.textures.exists("minipekka_ssj")) { generateForm(1); }
    if (!scene.textures.exists("minipekka_ui")) { generateForm(2); }
}
