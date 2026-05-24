import Phaser from "phaser";

export function generateCyberninjaSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "cyberninja";

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
          const SUIT_MAIN = isTransformed ? 0x222222 : 0x2d3436; // Darker when transformed
          const SUIT_DARK = 0x111111;
          const SCARF = isTransformed ? 0xff0055 : 0x00d2d3; // Red vs Cyan
          const VISOR = isTransformed ? 0xff0000 : 0x00eaff;
          const SKIN_PALE = 0xffeebb;

          // Legs (Baggy ninja pants)
          box(10, 24, 4, 6, SUIT_MAIN);
          box(18, 24, 4, 6, SUIT_MAIN);
          box(10, 24, 1, 6, SUIT_DARK);
          box(21, 24, 1, 6, SUIT_DARK); // Leg shadow
          box(10, 30, 4, 2, SUIT_DARK);
          box(18, 30, 4, 2, SUIT_DARK); // Boots
          box(10, 31, 4, 1, 0x000000);
          box(18, 31, 4, 1, 0x000000); // Boot shadow

          // Torso (Armor vest)
          box(11, 14, 10, 10, SUIT_MAIN);
          box(11, 14, 1, 10, SUIT_DARK);
          box(20, 14, 1, 10, SUIT_DARK); // Torso shadow
          box(12, 15, 8, 5, SUIT_DARK); // Chest plate
          box(12, 15, 8, 1, 0x333333); // Chest highlight

          // Arms
          if (isAttack) {
            box(21, 14, 10, 3, SUIT_MAIN); // Right arm out
            box(30, 14, 2, 3, SKIN_PALE); // bare lower arm
            box(32, 14, 4, 4, SUIT_DARK); // Right glove/fist
            box(32, 14, 2, 2, 0xaaaaaa); // Knuckle
            box(6, 15, 3, 5, SUIT_MAIN); // Left arm pulled
            box(6, 19, 3, 3, SUIT_DARK); // Left glove
          } else {
            box(8, 14, 3, 5, SUIT_MAIN);
            box(21, 14, 3, 5, SUIT_MAIN);
            box(8, 14, 1, 5, SUIT_DARK);
            box(23, 14, 1, 5, SUIT_DARK); // Arm shadow
            box(8, 19, 3, 4, SKIN_PALE);
            box(21, 19, 3, 4, SKIN_PALE); // Bare arms/gloves
            box(8, 19, 1, 4, 0xccbb99);
            box(23, 19, 1, 4, 0xccbb99); // Skin shadow
            box(8, 21, 3, 2, SUIT_DARK);
            box(21, 21, 3, 2, SUIT_DARK); // Gloves
            box(8, 22, 3, 1, 0x000000);
            box(21, 22, 3, 1, 0x000000); // Glove shadow
          }

          // Head
          headBox(12, 6, 8, 8, SUIT_MAIN); // Hood
          headBox(12, 6, 1, 8, SUIT_DARK);
          headBox(19, 6, 1, 8, SUIT_DARK); // Hood shadow
          headBox(13, 8, 6, 3, SKIN_PALE); // Face opening
          headBox(13, 10, 6, 1, 0xccbb99); // Face shadow
          headBox(13, 8, 6, 1, VISOR); // Visor eye
          headBox(13, 8, 2, 1, 0xffffff); // Visor highlight

          // Scarf Animation (Flowing in wind)
          // Base position neck
          headBox(11, 13, 10, 2, SCARF);
          headBox(11, 14, 10, 1, 0x880022); // Scarf shadow

          // Tail of scarf
          let scarfLen = 0;
          let scarfY = 0;

          if (f === 0) {
            scarfLen = 8;
            scarfY = 13;
          } else if (f === 1) {
            scarfLen = 10;
            scarfY = 12;
          } else if (f === 2) {
            scarfLen = 12;
            scarfY = 14;
          } else if (f === 3) {
            scarfLen = 10;
            scarfY = 13;
          }

          // Draw scarf tail to the left (wind blowing right to left conceptually, or just flow)
          // Let's draw it flowing behind (left side of sprite)
          // Ensure it doesn't go below x=0 to avoid bleeding into previous frame
          const scarfStartX = Math.max(0, 11 - scarfLen);
          const actualScarfLen = 11 - scarfStartX;
          if (actualScarfLen > 0) {
            headBox(scarfStartX, scarfY, actualScarfLen, 3, SCARF);
          }

          // Katana Handle on back (left side since facing right)
          headBox(9, 4, 2, 6, 0x555555);
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

    if (!scene.textures.exists("cyberninja")) { generateForm(0); }
    if (!scene.textures.exists("cyberninja_ssj")) { generateForm(1); }
    if (!scene.textures.exists("cyberninja_ui")) { generateForm(2); }
}
