import Phaser from "phaser";

export function generateBatmanSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "batman";

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
          const isArmored = form === 1;
          const SUIT_GREY = isArmored ? 0x2c3e50 : 0x34495e;
          const SUIT_SHADOW = isArmored ? 0x1a252f : 0x2c3e50;
          const BLACK = 0x111111;
          const YELLOW = 0xf1c40f;
          const SKIN = 0xffce9e;
          const ARMOR_GLOW = 0x00ffff; // Cyan glow for armored eyes

          // Cape (Drawn first to be behind)
          const capeColor = isArmored ? 0x1a1a1a : 0x000000;
          box(6, 14, 20, 18, capeColor);
          box(5, 16, 22, 14, capeColor);
          // Scalloped edges
          dot(7, 32, capeColor);
          dot(11, 32, capeColor);
          dot(15, 32, capeColor);
          dot(19, 32, capeColor);
          dot(23, 32, capeColor);

          // Legs
          box(11, 24, 4, 6, SUIT_GREY);
          box(17, 24, 4, 6, SUIT_GREY);
          box(11, 24, 1, 6, SUIT_SHADOW);
          box(20, 24, 1, 6, SUIT_SHADOW); // Leg shadow
          // Boots
          box(10, 28, 5, 4, BLACK);
          box(17, 28, 5, 4, BLACK);
          box(10, 31, 5, 1, 0x000000);
          box(17, 31, 5, 1, 0x000000); // Boot shadow
          if (isArmored) {
            // Armor plates on legs
            box(11, 25, 4, 2, 0x7f8c8d);
            box(17, 25, 4, 2, 0x7f8c8d);
            box(11, 26, 4, 1, 0x556666);
            box(17, 26, 4, 1, 0x556666); // Plate shadow
          }

          // Torso
          box(10, 14, 12, 10, SUIT_GREY);
          box(10, 14, 1, 10, SUIT_SHADOW);
          box(21, 14, 1, 10, SUIT_SHADOW); // Torso shadow
          // Bat Symbol
          box(13, 16, 6, 3, BLACK);
          dot(12, 16, BLACK);
          dot(19, 16, BLACK); // Wings
          dot(15, 15, BLACK);
          dot(16, 15, BLACK); // Ears of the bat

          // Utility Belt
          box(10, 22, 12, 2, YELLOW);
          box(10, 23, 12, 1, 0xccaa00); // Belt shadow
          box(11, 22, 2, 2, 0xd4ac0d); // Pouches
          box(15, 22, 2, 2, 0xd4ac0d);
          box(19, 22, 2, 2, 0xd4ac0d);

          // Arms
          if (isAttack) {
            box(21, 14, 10, 3, SUIT_GREY); // Right arm throwing
            box(21, 14, 10, 1, SUIT_SHADOW);
            box(28, 14, 3, 3, BLACK); // Gauntlet
            box(31, 14, 4, 4, BLACK); // Glove Fist
            box(31, 14, 2, 2, 0x444444); // Knuckles
            box(34, 15, 4, 1, 0x555555); // Batarang

            box(6, 15, 3, 5, SUIT_GREY); // Left arm pulled
            box(6, 20, 3, 3, BLACK); // Left glove
          } else {
            box(7, 14, 3, 7, SUIT_GREY);
            box(22, 14, 3, 7, SUIT_GREY);
            box(7, 14, 1, 7, SUIT_SHADOW);
            box(24, 14, 1, 7, SUIT_SHADOW); // Arm shadow
            // Gauntlets
            box(6, 18, 4, 5, BLACK);
            box(22, 18, 4, 5, BLACK);
            box(6, 22, 4, 1, 0x000000);
            box(22, 22, 4, 1, 0x000000); // Gauntlet shadow
            // Fins on gauntlets
            dot(5, 19, BLACK);
            dot(5, 21, BLACK);
            dot(26, 19, BLACK);
            dot(26, 21, BLACK);
          }

          // Head (Cowl)
          headBox(11, 5, 10, 9, BLACK);
          headBox(11, 5, 1, 9, 0x000000);
          headBox(20, 5, 1, 9, 0x000000); // Cowl shadow
          if (isArmored) {
            headBox(12, 7, 8, 6, 0x34495e); // Metal faceplate
            headBox(12, 7, 1, 6, 0x1a252f);
            headBox(19, 7, 1, 6, 0x1a252f); // Faceplate shadow
            headBox(13, 9, 2, 1, ARMOR_GLOW);
            headBox(17, 9, 2, 1, ARMOR_GLOW); // Glowing eyes
          } else {
            headBox(12, 8, 8, 5, SKIN); // Face opening
            headBox(12, 8, 1, 5, 0xccaa88);
            headBox(19, 8, 1, 5, 0xccaa88); // Face shadow
            headBox(13, 9, 2, 1, 0xffffff);
            headBox(17, 9, 2, 1, 0xffffff); // White eyes
            headBox(12, 11, 8, 2, SKIN); // Chin
          }

          // Bat Ears
          headBox(11, 2, 2, 4, BLACK);
          headBox(19, 2, 2, 4, BLACK);
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

    if (scene.textures.exists("batman")) { scene.textures.remove("batman"); }
    generateForm(0);
    
    if (scene.textures.exists("batman_ssj")) { scene.textures.remove("batman_ssj"); }
    generateForm(1);
    
    if (scene.textures.exists("batman_ui")) { scene.textures.remove("batman_ui"); }
    generateForm(2);
}
