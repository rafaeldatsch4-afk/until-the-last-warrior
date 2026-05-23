import Phaser from "phaser";

export function generateOptimusSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "optimus";

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
          const RED = 0xe74c3c;
          const RED_SHADOW = 0xc0392b;
          const BLUE = 0x2980b9;
          const BLUE_SHADOW = 0x1f618d;
          const SILVER = 0xbdc3c7;
          const DARK_METAL = 0x7f8c8d;
          const YELLOW = 0xf1c40f;
          const WINDOW = 0x87ceeb;
          const TIRE = 0x111111;

          if (isTransformed) {
            // TRUCK MODE REMASTER
            // Tires (more rounded)
            box(6, 24, 4, 8, TIRE);
            box(22, 24, 4, 8, TIRE); // Front
            box(6, 16, 4, 8, TIRE);
            box(22, 16, 4, 8, TIRE); // Back
            box(7, 25, 2, 6, DARK_METAL);
            box(23, 25, 2, 6, DARK_METAL); // Hubcaps
            box(7, 17, 2, 6, DARK_METAL);
            box(23, 17, 2, 6, DARK_METAL); // Hubcaps

            // Trailer connection / back legs area (Blue)
            box(10, 18, 12, 10, BLUE);
            box(11, 19, 10, 8, BLUE_SHADOW);

            // Main Cab (Red)
            box(8, 8, 16, 14, RED);
            box(9, 9, 14, 12, RED_SHADOW);
            box(10, 10, 12, 10, RED);

            // Windshield (split and angled)
            box(9, 10, 6, 5, WINDOW);
            box(17, 10, 6, 5, WINDOW);
            box(10, 11, 4, 3, 0xffffff);
            box(18, 11, 4, 3, 0xffffff); // Glint

            // Grill (detailed)
            box(13, 15, 6, 10, SILVER);
            box(14, 16, 1, 8, DARK_METAL);
            box(17, 16, 1, 8, DARK_METAL);

            // Bumper
            box(7, 25, 18, 4, SILVER);
            box(8, 26, 16, 2, DARK_METAL);

            // Headlights
            box(8, 25, 3, 3, YELLOW);
            box(21, 25, 3, 3, YELLOW);
            dot(9, 26, 0xffffff);
            dot(22, 26, 0xffffff);

            // Smokestacks
            box(5, 2, 2, 12, SILVER);
            box(25, 2, 2, 12, SILVER);
            box(6, 2, 1, 12, 0xffffff);
            box(26, 2, 1, 12, 0xffffff); // Highlight

            // Top lights
            box(10, 7, 12, 2, SILVER);
            dot(11, 7, YELLOW);
            dot(15, 7, YELLOW);
            dot(16, 7, YELLOW);
            dot(20, 7, YELLOW);
          } else {
            // ROBOT MODE REMASTER
            // Legs (Blue with silver thighs)
            box(10, 24, 5, 8, BLUE);
            box(17, 24, 5, 8, BLUE);
            box(10, 24, 1, 8, BLUE_SHADOW);
            box(21, 24, 1, 8, BLUE_SHADOW); // Leg shading
            box(11, 22, 3, 3, SILVER);
            box(18, 22, 3, 3, SILVER); // Thighs
            box(11, 22, 1, 3, DARK_METAL);
            box(18, 22, 1, 3, DARK_METAL); // Thigh shading
            box(10, 30, 5, 2, BLUE_SHADOW);
            box(17, 30, 5, 2, BLUE_SHADOW); // Feet
            box(10, 31, 5, 1, 0x111111);
            box(17, 31, 5, 1, 0x111111); // Foot shadow

            // Torso (Red cab)
            box(9, 12, 14, 10, RED);
            box(9, 12, 1, 10, RED_SHADOW);
            box(22, 12, 1, 10, RED_SHADOW); // Torso shadow
            box(10, 13, 12, 8, RED_SHADOW);
            box(11, 14, 10, 6, RED);

            // Windshield Windows (Chest)
            box(10, 13, 5, 5, WINDOW);
            box(17, 13, 5, 5, WINDOW);
            box(11, 14, 3, 2, 0xffffff);
            box(18, 14, 3, 2, 0xffffff); // Glint

            // Center grill (Abdomen)
            box(13, 18, 6, 4, SILVER);
            box(14, 18, 1, 4, DARK_METAL);
            box(17, 18, 1, 4, DARK_METAL);

            // Waist/Bumper
            box(10, 21, 12, 3, SILVER);
            box(10, 23, 12, 1, DARK_METAL); // Bumper shadow
            box(11, 21, 2, 2, YELLOW);
            box(19, 21, 2, 2, YELLOW); // Headlights

            // Arms
            if (isAttack) {
              // Right arm blasting / punching
              box(21, 12, 12, 4, RED); // Arm extended
              box(21, 12, 12, 1, RED_SHADOW);
              box(33, 12, 4, 4, BLUE); // Fist/cannon
              box(33, 12, 2, 2, 0x88ccff); // Glow detail

              box(6, 13, 4, 6, RED); // Left arm back
              box(6, 18, 3, 3, BLUE);
            } else {
              box(5, 12, 4, 8, RED);
              box(23, 12, 4, 8, RED);
              box(4, 11, 6, 4, RED_SHADOW);
              box(22, 11, 6, 4, RED_SHADOW); // Shoulders
              box(4, 14, 6, 1, 0x880000);
              box(22, 14, 6, 1, 0x880000); // Shoulder shadow
              box(5, 18, 4, 5, BLUE);
              box(23, 18, 4, 5, BLUE); // Forearms
              box(5, 18, 1, 5, BLUE_SHADOW);
              box(26, 18, 1, 5, BLUE_SHADOW); // Forearm shading
              box(5, 22, 4, 2, BLUE_SHADOW);
              box(23, 22, 4, 2, BLUE_SHADOW); // Hands
              box(5, 23, 4, 1, 0x111111);
              box(23, 23, 4, 1, 0x111111); // Hand shadow
            }

            // Smokestacks (Shoulders)
            box(4, 5, 2, 7, SILVER);
            box(26, 5, 2, 7, SILVER);
            box(5, 5, 1, 7, DARK_METAL);
            box(27, 5, 1, 7, DARK_METAL); // Stack shadow

            // Head
            headBox(13, 5, 6, 7, BLUE);
            headBox(13, 5, 1, 7, BLUE_SHADOW);
            headBox(18, 5, 1, 7, BLUE_SHADOW); // Head shadow
            headBox(14, 5, 4, 2, SILVER); // Crest
            headBox(14, 5, 4, 1, 0xffffff); // Crest highlight
            headBox(12, 6, 1, 4, BLUE);
            headBox(19, 6, 1, 4, BLUE); // Antennae
            headBox(14, 8, 4, 4, SILVER); // Faceplate
            headBox(14, 11, 4, 1, DARK_METAL); // Faceplate shadow
            headBox(15, 9, 2, 3, DARK_METAL); // Mouthplate detail
            headDot(14, 7, 0x00ffff);
            headDot(17, 7, 0x00ffff); // Eyes
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

    if (scene.textures.exists("optimus")) { scene.textures.remove("optimus"); }
    generateForm(0);
    
    if (scene.textures.exists("optimus_ssj")) { scene.textures.remove("optimus_ssj"); }
    generateForm(1);
    
    if (scene.textures.exists("optimus_ui")) { scene.textures.remove("optimus_ui"); }
    generateForm(2);
}
