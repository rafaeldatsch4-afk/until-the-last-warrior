import Phaser from "phaser";

export function generateSaitamaSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "saitama";

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
          const isSerious = form > 0;
          const SUIT_YELLOW = 0xffd700; // More golden yellow
          const SUIT_SHADOW = 0xb8860b; // Darker gold for shadows
          const GLOVE_RED = 0x8b0000; // Deep red
          const GLOVE_LIGHT = 0xcc0000;
          const CAPE_WHITE = 0xfafafa;
          const CAPE_SHADOW = 0xd3d3d3;
          const BELT_BLACK = 0x222222;
          const BELT_BUCKLE = 0xffd700;
          const SKIN_TONE = 0xffdbac;
          const SKIN_SHADOW = 0xe0ac7d;
          const ZIPPER_SILVER = 0xcccccc;

          // Cape (Behind body - larger and more dynamic)
          if (!isAttack) {
            const capeDrift = Math.sin(f * 0.4 + scene.time.now * 0.005) * 3;
            // Main cape block
            box(9 + capeDrift, 14, 14, 12, CAPE_WHITE);
            // Cape shading
            box(9 + capeDrift, 14, 1, 12, CAPE_SHADOW);
            box(22 + capeDrift, 14, 1, 12, CAPE_SHADOW);
            // Flared bottom
            box(7 + capeDrift, 24, 18, 5, CAPE_WHITE);
            box(7 + capeDrift, 24, 1, 5, CAPE_SHADOW);
            box(24 + capeDrift, 24, 1, 5, CAPE_SHADOW);
          }

          // Legs
          box(11, 23, 4, 7, SUIT_YELLOW);
          box(17, 23, 4, 7, SUIT_YELLOW);
          box(14, 23, 4, 2, SUIT_YELLOW); // Crotch
          // Leg Shading
          box(11, 23, 1, 7, SUIT_SHADOW);
          box(20, 23, 1, 7, SUIT_SHADOW);

          // Boots (Classic red)
          box(10, 30, 5, 2, GLOVE_RED);
          box(17, 30, 5, 2, GLOVE_RED);
          dot(10, 29, GLOVE_RED);
          dot(21, 29, GLOVE_RED);

          // Torso
          box(11, 14, 10, 9, SUIT_YELLOW);
          // Torso Shading (Muscles)
          box(11, 14, 1, 9, SUIT_SHADOW);
          box(20, 14, 1, 9, SUIT_SHADOW);
          box(14, 17, 1, 4, SUIT_SHADOW); // Abs line
          box(17, 17, 1, 4, SUIT_SHADOW);

          // Neck / Zipper
          box(15, 14, 2, 2, ZIPPER_SILVER);
          dot(15, 16, 0x000000); // Zipper pull

          // Cape buttons (at neck) - Red discs
          dot(12, 15, GLOVE_RED);
          dot(19, 15, GLOVE_RED);

          // Belt
          box(11, 22, 10, 2, BELT_BLACK);
          box(14, 22, 4, 2, BELT_BUCKLE);
          dot(15, 22, 0xffffff); // Buckle shine

          // Arms
          if (isAttack) {
            // Left arm (pulled back for momentum)
            box(9, 14, 3, 4, SUIT_YELLOW);
            box(8, 18, 4, 4, GLOVE_RED);
            
            // Right arm (Serious Punch/Attack stretching forward)
            box(21, 14, 10, 4, SUIT_YELLOW); // Extends further
            box(21, 16, 10, 2, SUIT_SHADOW); // Under-arm shadow
            
            // Massive red fist
            box(31, 13, 7, 6, GLOVE_RED); 
            box(31, 13, 7, 1, GLOVE_LIGHT); // Fist shine
            
            // Wind pressure/impact trail coming off the fist
            alphaBox(38, 13, 8, 6, 0xffffff, 0.6);
            alphaBox(46, 14, 6, 4, 0xffffff, 0.3);
          } else {
            // Guard/Idle arms
            box(8, 14, 3, 5, SUIT_YELLOW);
            box(21, 14, 3, 5, SUIT_YELLOW);
            box(8, 14, 1, 5, SUIT_SHADOW);
            box(23, 14, 1, 5, SUIT_SHADOW);

            // Gloves
            box(7, 19, 4, 5, GLOVE_RED);
            box(21, 19, 4, 5, GLOVE_RED);
            box(7, 19, 4, 1, GLOVE_LIGHT);
            box(21, 19, 4, 1, GLOVE_LIGHT);
          }

          // Head (Remastered Baldness)
          headBox(12, 6, 8, 8, SKIN_TONE);
          headBox(13, 13, 6, 1, SKIN_SHADOW); // Jawline
          
          // Face Details
          if (isSerious) {
            // Serious Look (Dashed/Shaded eyes)
            headBox(13, 9, 2, 1, 0xffffff);
            headBox(17, 9, 2, 1, 0xffffff);
            headDot(14, 9, 0x000000);
            headDot(18, 9, 0x000000);
            // Intense brows
            headBox(13, 8, 2, 1, 0x000000);
            headBox(17, 8, 2, 1, 0x000000);
            // Mouth (Serious line)
            headBox(15, 12, 2, 1, 0x000000);
            // Cheek lines for intensity
            headDot(13, 11, SKIN_SHADOW);
            headDot(19, 11, SKIN_SHADOW);
          } else {
            // Goofy/Default Look
            headDot(14, 9, 0x000000);
            headDot(18, 9, 0x000000);
            // Small mouth
            headBox(15, 12, 2, 1, 0x000000);
          }

          // Head shine (The iconic bald głow)
          headDot(14, 7, 0xffffff);
          headDot(15, 7, 0xffffff);
          headDot(13, 8, 0xffffff);

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

    if (!scene.textures.exists("saitama")) { generateForm(0); }
    if (!scene.textures.exists("saitama_ssj")) { generateForm(1); }
    if (!scene.textures.exists("saitama_ui")) { generateForm(2); }
}
