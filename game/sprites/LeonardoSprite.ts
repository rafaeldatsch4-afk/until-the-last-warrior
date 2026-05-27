import Phaser from "phaser";

export function generateLeonardoSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "leonardo";

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
          const GREEN = 0x2ecc71;
          const GREEN_SHADOW = 0x27ae60;
          const SHELL_FRONT = 0xf1c40f;
          const SHELL_BACK = 0x1e8449;
          const BANDANA = 0x3498db;
          const BELT = 0x5c4033;
          const PAD = 0x5c4033;
          const STEEL = 0xbdc3c7;

          // Katanas on back (drawn first to be behind)
          if (isAttack) {
            box(9, 12, 2, 10, STEEL); // Only one katana on back
            box(9, 12, 1, 10, 0x7f8c8d);
          } else {
            box(9, 12, 2, 10, STEEL);
            box(21, 12, 2, 10, STEEL); // Blades crossing
            box(9, 12, 1, 10, 0x7f8c8d);
            box(22, 12, 1, 10, 0x7f8c8d); // Blade shadow
          }

          // Legs
          box(10, 24, 4, 6, GREEN);
          box(18, 24, 4, 6, GREEN);
          box(10, 24, 1, 6, GREEN_SHADOW);
          box(21, 24, 1, 6, GREEN_SHADOW); // Leg shadow
          box(10, 27, 4, 2, PAD);
          box(18, 27, 4, 2, PAD); // Knee pads
          box(10, 28, 4, 1, 0x3e2723);
          box(18, 28, 4, 1, 0x3e2723); // Pad shadow

          // Torso
          box(11, 14, 10, 10, GREEN);
          box(11, 14, 1, 10, GREEN_SHADOW);
          box(20, 14, 1, 10, GREEN_SHADOW); // Torso shadow
          box(12, 15, 8, 8, SHELL_FRONT); // Front shell
          box(14, 15, 4, 8, 0xe6b800); // Shell detail
          box(12, 15, 8, 1, 0xffeb3b); // Shell highlight
          box(11, 21, 10, 2, BELT); // Belt
          box(11, 22, 10, 1, 0x3e2723); // Belt shadow
          dot(15, 21, 0xaaaaaa);
          dot(16, 21, 0xaaaaaa); // Belt buckle

          // Arms
          if (isAttack) {
            box(21, 14, 10, 3, GREEN); // Right arm striking
            box(28, 14, 3, 3, PAD); // Wrist wraps stretched
            // Katana extended in hand!
            box(31, 14, 14, 2, STEEL); // Blade out
            box(31, 15, 14, 1, 0x7f8c8d); // Blade shading
            box(31, 14, 4, 4, GREEN); // Fist holding sword
            box(31, 14, 2, 2, 0xaaffaa); // Knuckles
            box(6, 15, 3, 5, GREEN); // left arm back
          } else {
            box(8, 14, 3, 8, GREEN);
            box(21, 14, 3, 8, GREEN);
            box(8, 14, 1, 8, GREEN_SHADOW);
            box(23, 14, 1, 8, GREEN_SHADOW); // Arm shadow
            box(8, 18, 3, 2, PAD);
            box(21, 18, 3, 2, PAD); // Elbow pads
            box(8, 19, 3, 1, 0x3e2723);
            box(21, 19, 3, 1, 0x3e2723); // Pad shadow
            box(8, 21, 3, 2, PAD);
            box(21, 21, 3, 2, PAD); // Wrist wraps
            box(8, 22, 3, 1, 0x3e2723);
            box(21, 22, 3, 1, 0x3e2723); // Wrap shadow
          }

          // Head
          headBox(12, 6, 8, 8, GREEN);
          headBox(12, 6, 1, 8, GREEN_SHADOW);
          headBox(19, 6, 1, 8, GREEN_SHADOW); // Head shadow
          headBox(11, 9, 10, 2, BANDANA); // Bandana
          headBox(11, 10, 10, 1, 0x2980b9); // Bandana shadow
          headBox(10, 10, 2, 4, BANDANA); // Bandana knot tail
          headBox(10, 10, 1, 4, 0x2980b9); // Knot tail shadow
          headDot(13, 9, WHITE);
          headDot(17, 9, WHITE); // Eyes
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

    if (!scene.textures.exists("leonardo")) { generateForm(0); }
    if (!scene.textures.exists("leonardo_ssj")) { generateForm(1); }
    if (!scene.textures.exists("leonardo_ui")) { generateForm(2); }
}
