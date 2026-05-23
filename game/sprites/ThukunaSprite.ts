import Phaser from "phaser";

export function generateThukunaSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "thukuna";

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
          const SKIN = 0xffd3b6;
          const SKIN_SHADOW = 0xe0ac88;
          const HAIR = 0xffa6c9; // Salmon pink
          const HAIR_SHADOW = 0x1a1a1a; // Dark undercut
          const TATTOO = 0x111111;
          const PANTS = 0x1e272e;
          const SHOES = 0x8b0000;

          const ROBE_NORMAL = 0x1e272e;
          const ROBE_NORMAL_SHADOW = 0x0f1417;
          const HOOD = 0xc0392b;

          const ROBE_TRANS = 0xf5f6fa;
          const ROBE_TRANS_SHADOW = 0xdcdde1;
          const SASH = 0x2f3640;

          // Legs
          box(11, 24, 4, 5, PANTS);
          box(17, 24, 4, 5, PANTS);
          box(11, 24, 1, 5, 0x0f1417);
          box(20, 24, 1, 5, 0x0f1417); // Pants shadow

          // Shoes
          box(10, 29, 5, 3, SHOES);
          box(17, 29, 5, 3, SHOES);
          box(10, 31, 5, 1, 0x590000);
          box(17, 31, 5, 1, 0x590000); // Shoe soles

          if (isTransformed) {
            // TRUE FORM (Heian Era)

            // Extra Arms (Lower/Back) - thinner and positioned better
            box(8, 16, 2, 6, SKIN);
            box(22, 16, 2, 6, SKIN); // Extra arms
            box(8, 16, 1, 6, SKIN_SHADOW);
            box(23, 16, 1, 6, SKIN_SHADOW); // Extra arm shadow
            box(8, 20, 2, 2, TATTOO);
            box(22, 20, 2, 2, TATTOO); // Wrist tattoos

            // Main Arms - proportionate
            if (isAttack) {
              box(21, 14, 10, 3, SKIN); // Right main arm extending
              box(21, 14, 10, 1, SKIN_SHADOW);
              box(25, 14, 1, 3, TATTOO);
              box(28, 14, 1, 3, TATTOO);
              box(31, 14, 4, 4, SKIN); // Fist
              box(31, 14, 2, 2, 0xffeebb); // Knuckles
              box(6, 15, 3, 6, SKIN); // Left main arm back
            } else {
              box(9, 14, 3, 7, SKIN);
              box(20, 14, 3, 7, SKIN);
              box(9, 14, 1, 7, SKIN_SHADOW);
              box(22, 14, 1, 7, SKIN_SHADOW); // Main arm shadow
              box(9, 18, 3, 3, SKIN_SHADOW);
              box(20, 18, 3, 3, SKIN_SHADOW); // Forearm shading
              box(9, 16, 3, 1, TATTOO);
              box(20, 16, 3, 1, TATTOO); // Arm bands
              box(9, 19, 3, 1, TATTOO);
              box(20, 19, 3, 1, TATTOO);
            }

            // Torso (Exposed chest) - slimmer
            box(12, 14, 8, 5, SKIN); // Exposed chest
            box(12, 14, 1, 5, SKIN_SHADOW);
            box(19, 14, 1, 5, SKIN_SHADOW); // Chest shadow
            box(14, 17, 4, 1, SKIN_SHADOW); // Abs shading

            // Chest Tattoos
            box(13, 15, 6, 1, TATTOO); // Collarbone line
            box(15, 16, 2, 3, TATTOO); // Center chest

            // Sash (Obi)
            box(11, 18, 10, 3, SASH);
            box(11, 20, 10, 1, 0x1a1a1a); // Sash bottom shadow

            // Sash Knot & Dangle
            box(14, 18, 4, 3, 0x1a1a1a); // Knot
            box(14, 21, 3, 5, SASH); // Dangling fabric
            box(16, 21, 1, 5, 0x1a1a1a); // Dangle shadow

            // White Hakama (Baggy Pants)
            // Left Leg
            box(9, 21, 6, 8, ROBE_TRANS); // Main left leg
            box(8, 25, 2, 4, ROBE_TRANS); // Left flare
            box(9, 21, 1, 8, ROBE_TRANS_SHADOW); // Left outer shadow
            box(11, 22, 1, 7, ROBE_TRANS_SHADOW); // Left fold 1
            box(13, 21, 1, 8, ROBE_TRANS_SHADOW); // Left fold 2
            box(14, 21, 1, 8, 0xc8c9ce); // Left inner deep shadow

            // Right Leg
            box(17, 21, 6, 8, ROBE_TRANS); // Main right leg
            box(22, 25, 2, 4, ROBE_TRANS); // Right flare
            box(22, 21, 1, 8, ROBE_TRANS_SHADOW); // Right outer shadow
            box(20, 22, 1, 7, ROBE_TRANS_SHADOW); // Right fold 1
            box(18, 21, 1, 8, ROBE_TRANS_SHADOW); // Right fold 2
            box(17, 21, 1, 8, 0xc8c9ce); // Right inner deep shadow

            // Crotch connection
            box(15, 21, 2, 4, ROBE_TRANS_SHADOW);
            box(15, 21, 2, 2, ROBE_TRANS);

            // Head - standard size
            headBox(12, 6, 8, 8, SKIN);
            // Right side face deformity (Heian mask)
            headBox(16, 5, 5, 9, SKIN_SHADOW); // Mask base
            headBox(17, 6, 3, 7, 0xcc9977); // Mask detail

            // Hair (Spikier, wilder)
            headBox(11, 2, 10, 4, HAIR);
            headBox(10, 4, 2, 4, HAIR);
            headBox(20, 4, 2, 4, HAIR);
            headBox(12, 0, 2, 3, HAIR);
            headBox(15, -1, 2, 3, HAIR);
            headBox(18, 0, 2, 3, HAIR);

            // Eyebrows
            headBox(13, 8, 2, 1, HAIR);
            headBox(17, 8, 2, 1, HAIR);

            // Eyes (4 eyes)
            headBox(13, 9, 2, 1, 0xffffff);
            headBox(17, 9, 2, 1, 0xffffff); // Main Sclera
            headBox(14, 9, 1, 1, 0xff0000);
            headBox(17, 9, 1, 1, 0xff0000); // Main Pupils

            headBox(17, 11, 2, 1, 0xffffff); // Extra right eye lower
            headBox(17, 11, 1, 1, 0xff0000);
            headBox(17, 7, 2, 1, 0xffffff); // Extra right eye upper
            headBox(17, 7, 1, 1, 0xff0000);

            // Nose
            headBox(15, 11, 2, 1, SKIN_SHADOW);

            // Face Tattoos (Removed under-eye and forehead lines to clean up face)
          } else {
            // YUJI FORM

            // Arms (Uniform sleeves)
            if (isAttack) {
              box(21, 14, 10, 3, ROBE_NORMAL); // Right arm slash
              box(21, 14, 10, 1, ROBE_NORMAL_SHADOW);
              box(31, 14, 4, 4, SKIN); // Fist
              box(31, 14, 2, 2, 0xffeebb); // Knuckles
              box(31, 14, 3, 1, TATTOO); // Fist tattoo

              box(6, 15, 3, 5, ROBE_NORMAL); // Left arm
              box(6, 20, 3, 3, SKIN);
            } else {
              box(7, 14, 3, 7, ROBE_NORMAL);
              box(22, 14, 3, 7, ROBE_NORMAL);
              box(7, 14, 1, 7, ROBE_NORMAL_SHADOW);
              box(24, 14, 1, 7, ROBE_NORMAL_SHADOW);

              // Hands
              box(7, 21, 3, 2, SKIN);
              box(22, 21, 3, 2, SKIN);
              box(7, 21, 3, 1, TATTOO);
              box(22, 21, 3, 1, TATTOO); // Hand tattoos
              box(7, 22, 3, 1, SKIN_SHADOW);
              box(22, 22, 3, 1, SKIN_SHADOW); // Hand shadow
            }

            // Torso (Uniform)
            box(10, 14, 12, 10, ROBE_NORMAL);
            box(10, 14, 2, 10, ROBE_NORMAL_SHADOW);
            box(20, 14, 2, 10, ROBE_NORMAL_SHADOW);

            // Red Hood
            box(11, 13, 10, 3, HOOD);
            box(11, 15, 10, 1, 0x8b0000); // Hood shadow

            // Head
            headBox(11, 5, 10, 9, SKIN);
            headBox(11, 5, 1, 9, SKIN_SHADOW);
            headBox(20, 5, 1, 9, SKIN_SHADOW); // Face shadow

            // Hair (Undercut + Spiky top)
            headBox(10, 5, 1, 4, HAIR_SHADOW);
            headBox(21, 5, 1, 4, HAIR_SHADOW); // Undercut
            headBox(10, 2, 12, 3, HAIR);
            headBox(11, 1, 3, 2, HAIR);
            headBox(15, 0, 2, 2, HAIR);
            headBox(18, 1, 3, 2, HAIR);

            // Face Tattoos (Removed under-eye and forehead lines to clean up face)
            headBox(15, 11, 2, 1, TATTOO); // Chin
            headBox(11, 9, 1, 1, TATTOO);
            headBox(20, 9, 1, 1, TATTOO); // Cheeks

            // Eyes
            headBox(12, 8, 2, 1, 0xffffff);
            headBox(18, 8, 2, 1, 0xffffff); // Sclera
            headBox(13, 8, 1, 1, 0xff0000);
            headBox(18, 8, 1, 1, 0xff0000); // Red pupils
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

    if (scene.textures.exists("thukuna")) { scene.textures.remove("thukuna"); }
    generateForm(0);
    
    if (scene.textures.exists("thukuna_ssj")) { scene.textures.remove("thukuna_ssj"); }
    generateForm(1);
    
    if (scene.textures.exists("thukuna_ui")) { scene.textures.remove("thukuna_ui"); }
    generateForm(2);
}
