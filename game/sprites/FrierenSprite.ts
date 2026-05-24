import Phaser from "phaser";

export function generateFrierenSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "frieren";

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
          const HAIR = 0xecf0f1;
          const HAIR_SHADOW = 0xbdc3c7;
          const COAT = 0xffffff;
          const COAT_SHADOW = 0xe0e0e0;
          const SCARF = 0x2c3e50; // Dark blue/black collar
          const GOLD = 0xf1c40f;
          const SKIN = 0xffeebb;
          const TIGHTS = 0x111111;
          const BOOTS = 0x8b4513;

          // Staff (drawn first to be behind)
          if (!isAttack) {
            box(23, 10, 2, 20, 0x8b4513); // Staff pole
            box(22, 8, 4, 3, GOLD); // Staff top
            dot(23, 7, 0xe74c3c); // Red gem
            box(24, 10, 1, 20, 0x5d4037); // Staff shadow
          }

          // Legs
          box(12, 24, 3, 6, TIGHTS);
          box(17, 24, 3, 6, TIGHTS);
          box(12, 24, 1, 6, 0x000000);
          box(17, 24, 1, 6, 0x000000); // Tights shadow
          box(11, 28, 4, 3, BOOTS);
          box(17, 28, 4, 3, BOOTS);
          box(11, 28, 1, 3, 0x5d4037);
          box(17, 28, 1, 3, 0x5d4037); // Boots shadow

          // Torso
          box(11, 14, 10, 10, COAT);
          box(11, 14, 1, 10, COAT_SHADOW);
          box(20, 14, 1, 10, COAT_SHADOW); // Coat shadow
          box(11, 14, 10, 3, SCARF); // Collar
          box(11, 16, 10, 1, 0x1a252f); // Collar shadow
          box(15, 14, 2, 10, GOLD); // Center trim
          box(11, 22, 10, 2, 0x222222); // Belt
          box(11, 23, 10, 1, 0x000000); // Belt shadow

          // Arms
          if (isAttack) {
            box(21, 14, 10, 3, COAT); // Right arm
            box(21, 14, 10, 1, COAT_SHADOW);
            box(29, 14, 2, 3, TIGHTS); // Cuff
            box(31, 14, 4, 4, SKIN); // Hand fist
            box(31, 14, 2, 2, 0xffeebb); // Knuckles

            // Staff in front
            box(32, 2, 2, 20, 0x8b4513); // Staff pole front
            box(31, 0, 4, 3, GOLD); // Staff top
            dot(32, -1, 0xe74c3c); // Red gem

            box(6, 15, 3, 6, COAT); // Left arm back
          } else {
            box(8, 14, 3, 8, COAT);
            box(21, 14, 3, 8, COAT);
            box(8, 14, 1, 8, COAT_SHADOW);
            box(23, 14, 1, 8, COAT_SHADOW); // Arm shadow
            box(8, 20, 3, 2, TIGHTS);
            box(21, 20, 3, 2, TIGHTS); // Gloves/cuffs
            box(8, 21, 3, 1, 0x000000);
            box(21, 21, 3, 1, 0x000000); // Cuff shadow
          }

          // Head
          headBox(12, 6, 8, 8, SKIN);
          headBox(12, 6, 1, 8, 0xccbb99);
          headBox(19, 6, 1, 8, 0xccbb99); // Face shadow

          // Elf Ears
          headBox(8, 9, 4, 2, SKIN);
          headBox(20, 9, 4, 2, SKIN);
          headBox(8, 10, 4, 1, 0xccbb99);
          headBox(20, 10, 4, 1, 0xccbb99); // Ear shadow

          // Hair
          headBox(11, 4, 10, 4, HAIR); // Hair top
          headBox(13, 4, 6, 1, HAIR_SHADOW);
          // Twintails
          headBox(9, 6, 3, 12, HAIR);
          headBox(20, 6, 3, 12, HAIR);
          headBox(9, 6, 1, 12, HAIR_SHADOW);
          headBox(22, 6, 1, 12, HAIR_SHADOW); // Twintail shadow
          headBox(10, 18, 2, 2, 0xcc0000);
          headBox(20, 18, 2, 2, 0xcc0000); // Red hair ties

          // Face
          headDot(14, 9, 0x27ae60);
          headDot(17, 9, 0x27ae60); // Eyes
          headDot(13, 8, HAIR_SHADOW);
          headDot(18, 8, HAIR_SHADOW); // Eyebrows
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

    if (!scene.textures.exists("frieren")) { generateForm(0); }
    if (!scene.textures.exists("frieren_ssj")) { generateForm(1); }
    if (!scene.textures.exists("frieren_ui")) { generateForm(2); }
}
