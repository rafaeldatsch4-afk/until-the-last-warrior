import Phaser from "phaser";

export function generateCellSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "cell";

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
          const GREEN = 0x66bb66;
          const DARK_GREEN = 0x448844;
          const BLACK_S = 0x112211;
          const SPOT = 0x002200; // Darker green/black for bio-armor spots
          const PALE = 0xeeeeee;
          const ORANGE = 0xffaa00;
          const PURPLE = 0xaa44cc;
          const PINK_EYE = 0xff00cc;

          // Wings (Beetle-like, drawn first so they are behind)
          const wingSpread = isAttack || isDefend ? 2 : f % 2 === 0 ? 0 : 1;

          // Left wing (tapered insectoid shape)
          box(3 - wingSpread, 10, 8, 12, BLACK_S);
          box(4 - wingSpread, 22, 6, 6, BLACK_S);
          box(5 - wingSpread, 28, 4, 4, BLACK_S);
          // Left wing highlight/texture
          box(4 - wingSpread, 11, 6, 10, 0x223322);
          box(5 - wingSpread, 21, 4, 6, 0x223322);

          // Right wing (tapered insectoid shape)
          box(21 + wingSpread, 10, 8, 12, BLACK_S);
          box(22 + wingSpread, 22, 6, 6, BLACK_S);
          box(23 + wingSpread, 28, 4, 4, BLACK_S);
          // Right wing highlight/texture
          box(22 + wingSpread, 11, 6, 10, 0x223322);
          box(23 + wingSpread, 21, 4, 6, 0x223322);

          // Legs (Thighs and Calves)
          box(10, 23, 4, 6, GREEN);
          box(18, 23, 4, 6, GREEN);
          box(10, 23, 1, 6, DARK_GREEN);
          box(21, 23, 1, 6, DARK_GREEN); // Leg shadow
          box(11, 23, 1, 6, 0x88dd88);
          box(19, 23, 1, 6, 0x88dd88); // Leg highlight
          // Accurate spots on legs
          dot(11, 24, SPOT);
          dot(13, 26, SPOT);
          dot(10, 27, SPOT);
          dot(12, 28, SPOT);
          dot(19, 25, SPOT);
          dot(21, 24, SPOT);
          dot(18, 27, SPOT);
          dot(20, 28, SPOT);

          // Boots
          box(10, 29, 4, 3, BLACK_S);
          box(18, 29, 4, 3, BLACK_S);
          box(10, 31, 4, 2, ORANGE);
          box(18, 31, 4, 2, ORANGE);
          box(10, 32, 4, 1, 0xcc8800);
          box(18, 32, 4, 1, 0xcc8800); // Boot shadow

          // Torso (Chest and Abdomen)
          // Black upper chest/neck area
          box(11, 14, 10, 4, BLACK_S);
          box(12, 14, 8, 3, 0x223322); // Chest highlight
          // Green center chest plate
          box(14, 15, 4, 3, GREEN);
          dot(15, 16, SPOT);
          dot(16, 17, SPOT);

          // Green abdomen
          box(12, 18, 8, 4, GREEN);
          box(12, 18, 1, 4, DARK_GREEN);
          box(19, 18, 1, 4, DARK_GREEN); // Abdomen shadow
          // Ribbed texture on abdomen
          box(12, 19, 8, 1, DARK_GREEN);
          box(12, 21, 8, 1, DARK_GREEN);
          // Black pelvis area
          box(11, 22, 10, 2, BLACK_S);
          box(12, 22, 8, 1, 0x223322); // Pelvis highlight

          // Arms
          if (isAttack) {
            box(21, 14, 12, 3, GREEN); // Right arm extended
            box(31, 14, 2, 3, BLACK_S); // Lower arm band
            box(33, 14, 4, 4, PALE); // Hand fist
            box(33, 14, 2, 2, 0xffffff); // Knuckle
            box(6, 15, 3, 5, GREEN); // Left arm pulled
          } else {
            // Shoulders
            box(7, 14, 4, 3, GREEN);
            box(21, 14, 4, 3, GREEN);
            box(7, 14, 1, 3, DARK_GREEN);
            box(24, 14, 1, 3, DARK_GREEN); // Shoulder shadow
            box(8, 14, 1, 3, 0x88dd88);
            box(22, 14, 1, 3, 0x88dd88); // Shoulder highlight
            // Spots on shoulders
            dot(8, 15, SPOT);
            dot(10, 14, SPOT);
            dot(9, 16, SPOT);
            dot(22, 15, SPOT);
            dot(21, 14, SPOT);
            dot(23, 16, SPOT);

            // Upper arms
            box(8, 17, 3, 5, GREEN);
            box(21, 17, 3, 5, GREEN);
            box(8, 17, 1, 5, DARK_GREEN);
            box(23, 17, 1, 5, DARK_GREEN); // Arm shadow
            // Spots on arms
            dot(9, 18, SPOT);
            dot(8, 20, SPOT);
            dot(10, 21, SPOT);
            dot(22, 19, SPOT);
            dot(23, 17, SPOT);
            dot(21, 21, SPOT);

            // Lower arms/Hands
            box(8, 21, 3, 2, BLACK_S);
            box(21, 21, 3, 2, BLACK_S);
            box(8, 23, 3, 2, PALE);
            box(21, 23, 3, 2, PALE);
            box(8, 24, 3, 1, 0xcccccc);
            box(21, 24, 3, 1, 0xcccccc); // Hand shadow
          }

          // Head
          // Base face
          headBox(12, 6, 8, 7, GREEN);
          headBox(12, 6, 1, 7, DARK_GREEN);
          headBox(19, 6, 1, 7, DARK_GREEN); // Face side shadow

          // Crown (Refined shape)
          headBox(11, 0, 2, 8, GREEN); // Left tall prong
          headBox(19, 0, 2, 8, GREEN); // Right tall prong
          headBox(11, 0, 1, 8, DARK_GREEN);
          headBox(20, 0, 1, 8, DARK_GREEN); // Prong shadow
          headBox(13, 2, 6, 4, GREEN); // Center crown base
          headBox(14, 1, 4, 2, GREEN); // Center crown peak
          headBox(13, 2, 6, 1, 0x88dd88); // Crown highlight

          // Crown spots
          headDot(11, 2, SPOT);
          headDot(12, 5, SPOT);
          headDot(11, 7, SPOT);
          headDot(20, 3, SPOT);
          headDot(19, 6, SPOT);
          headDot(20, 7, SPOT);
          headDot(15, 3, SPOT);
          headDot(16, 4, SPOT);
          headDot(14, 5, SPOT);

          // Pale face plate
          headBox(13, 8, 6, 5, PALE);
          headBox(13, 12, 6, 1, 0xcccccc); // Jaw shadow

          // Purple cheek lines
          headBox(12, 9, 1, 3, PURPLE);
          headBox(19, 9, 1, 3, PURPLE);

          // Eyes
          headBox(13, 9, 2, 1, WHITE);
          headBox(17, 9, 2, 1, WHITE);
          headDot(14, 9, PINK_EYE);
          headDot(17, 9, PINK_EYE);

          // Eyeliner / Brow ridge
          headBox(13, 8, 2, 1, BLACK_S);
          headBox(17, 8, 2, 1, BLACK_S);

          // Mouth
          headBox(15, 12, 2, 1, BLACK_S);

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

    if (scene.textures.exists("cell")) { scene.textures.remove("cell"); }
    generateForm(0);
    
    if (scene.textures.exists("cell_ssj")) { scene.textures.remove("cell_ssj"); }
    generateForm(1);
    
    if (scene.textures.exists("cell_ui")) { scene.textures.remove("cell_ui"); }
    generateForm(2);
}
