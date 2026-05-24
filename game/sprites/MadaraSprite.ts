import Phaser from "phaser";

export function generateMadaraSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "madara";

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
          if (isTransformed) {
            // PERFECT SUSANOO - Minimalist Block-Style

            const S_DARK = 0x1e40af; // Deep blue
            const S_MID = 0x3b82f6; // Vibrant blue
            const S_NEON = 0x60a5fa; // Neon blue glow
            const S_EYE = 0xff0000; // Glowing red eyes

            const animY = !isAttack && f % 2 === 0 ? 1 : 0;

            // SUSANOO BACK WINGS / AURA
            alphaBox(2, -10 + animY, 28, 42, S_MID, 0.2);
            alphaBox(0, -5 + animY, 32, 30, S_NEON, 0.15);

            // Wings
            alphaBox(1, -12 + animY, 8, 24, S_DARK, 0.5);
            alphaBox(23, -12 + animY, 8, 24, S_DARK, 0.5);
            alphaBox(0, -8 + animY, 6, 18, S_NEON, 0.4);
            alphaBox(26, -8 + animY, 6, 18, S_NEON, 0.4);

            // MINI MADARA (Core)
            const mX = 13;
            const mY = 16 + animY;

            // Hair back
            box(mX - 3, mY - 2, 12, 12, 0x111111);
            // Body (Red armor)
            box(mX, mY + 4, 6, 7, 0xc53030);
            // Armor plates
            box(mX - 1, mY + 8, 8, 3, 0x742a2a);
            // Legs
            box(mX + 1, mY + 11, 4, 5, 0x1a202c);
            // Arms
            box(mX - 2, mY + 4, 2, 6, 0xc53030);
            box(mX + 6, mY + 4, 2, 6, 0xc53030);
            // Face
            box(mX + 1, mY, 4, 4, 0xffebcb);
            // Hair front
            box(mX, mY - 1, 6, 2, 0x111111);
            box(mX - 1, mY + 1, 2, 3, 0x111111); // Left bang
            box(mX + 5, mY + 1, 2, 3, 0x111111); // Right bang

            // Four Arms
            if (isAttack) {
              // Upper Left (Striking)
              alphaBox(4, -2 + animY, 5, 14, S_MID, 0.7);
              // Giant Sword Left
              alphaBox(1, -16, 4, 30, S_NEON, 0.8);
              alphaBox(2, -14, 2, 26, 0xffffff, 0.9);

              // Lower Left
              alphaBox(3, 10 + animY, 5, 12, S_DARK, 0.7);
              // Sword Lower Left
              alphaBox(0, 4, 3, 20, S_NEON, 0.8);

              // Upper Right (Raised)
              alphaBox(23, -6 + animY, 5, 14, S_MID, 0.7);
              // Giant Sword Right
              alphaBox(27, -20, 4, 32, S_NEON, 0.8);
              alphaBox(28, -18, 2, 28, 0xffffff, 0.9);

              // Lower Right
              alphaBox(24, 10 + animY, 5, 12, S_DARK, 0.7);
              // Sword Lower Right
              alphaBox(29, 4, 3, 20, S_NEON, 0.8);
            } else {
              // Upper Left
              alphaBox(4, 2 + animY, 5, 14, S_MID, 0.7);
              // Sword Left
              alphaBox(2, -8, 3, 24, S_NEON, 0.6);

              // Lower Left
              alphaBox(3, 12 + animY, 5, 12, S_DARK, 0.7);
              // Sword Lower Left
              alphaBox(0, 8, 3, 20, S_NEON, 0.5);

              // Upper Right
              alphaBox(23, 2 + animY, 5, 14, S_MID, 0.7);
              // Sword Right
              alphaBox(27, -8, 3, 24, S_NEON, 0.6);

              // Lower Right
              alphaBox(24, 12 + animY, 5, 12, S_DARK, 0.7);
              // Sword Lower Right
              alphaBox(29, 8, 3, 20, S_NEON, 0.5);
            }

            // SUSANOO FRONT (Semi-transparent blocks)
            // Torso/Ribcage
            alphaBox(8, 4 + animY, 16, 18, S_MID, 0.6);
            alphaBox(9, 6 + animY, 14, 3, S_NEON, 0.8); // Rib 1
            alphaBox(10, 11 + animY, 12, 3, S_NEON, 0.8); // Rib 2
            alphaBox(11, 16 + animY, 10, 3, S_NEON, 0.8); // Rib 3

            // Skirt/Lower armor
            alphaBox(6, 22 + animY, 20, 10, S_DARK, 0.7);
            alphaBox(8, 24 + animY, 16, 8, S_MID, 0.7);

            // Head (Samurai Helmet)
            alphaBox(10, -10 + animY, 12, 14, S_DARK, 0.85);
            alphaBox(11, -4 + animY, 10, 6, 0x0f172a, 0.9); // Face Mask

            // Glowing Red Eyes
            alphaBox(12, -3 + animY, 3, 2, S_EYE, 1);
            alphaBox(17, -3 + animY, 3, 2, S_EYE, 1);

            // Helmet Horns / Crest
            alphaBox(8, -14 + animY, 3, 8, S_NEON, 0.9);
            alphaBox(21, -14 + animY, 3, 8, S_NEON, 0.9);
            alphaBox(13, -16 + animY, 6, 6, S_NEON, 0.9); // Center crest
          } else {
            // BASE MADARA - 16-bit Vibrant, Menacing Pose
            const ARMOR_RED = 0xc53030; // Vibrant crimson red
            const ARMOR_DARK = 0x742a2a; // Deep red shadow
            const ARMOR_TRIM = 0x1a202c; // Dark trim
            const CLOTHES = 0x2d3748; // Dark grey/blue suit
            const CLOTHES_DARK = 0x1a202c;
            const SKIN = 0xffebcb; // Pale skin
            const SKIN_SHADE = 0xd6bc98;
            const HAIR = 0x111111; // Almost black
            const HAIR_SHADE = 0x2d3748; // Dark grey highlights
            const SHARINGAN = 0xff0000; // Bright red eyes
            const GUNBAI_BROWN = 0x7b341e;
            const GUNBAI_CREAM = 0xfbd38d;

            // 1. MASSIVE SPIKY BACK HAIR
            // Base volume
            headBox(8, 2, 16, 18, HAIR);

            // Left side spikes (flowing out and down)
            headBox(6, 4, 2, 14, HAIR);
            headBox(4, 6, 2, 10, HAIR);
            headBox(2, 8, 2, 6, HAIR);
            // Left lower spikes
            headBox(7, 18, 2, 4, HAIR);
            headBox(5, 16, 2, 4, HAIR);

            // Right side spikes
            headBox(24, 4, 2, 14, HAIR);
            headBox(26, 6, 2, 10, HAIR);
            headBox(28, 8, 2, 6, HAIR);
            // Right lower spikes
            headBox(23, 18, 2, 4, HAIR);
            headBox(25, 16, 2, 4, HAIR);

            // Top spikes (wild and voluminous)
            headBox(10, -1, 3, 3, HAIR);
            headBox(14, -2, 4, 4, HAIR);
            headBox(19, -1, 3, 3, HAIR);

            // Hair highlights/shading for texture
            headBox(10, 4, 1, 12, HAIR_SHADE);
            headBox(14, 2, 1, 14, HAIR_SHADE);
            headBox(21, 4, 1, 12, HAIR_SHADE);
            headBox(7, 8, 1, 6, HAIR_SHADE);
            headBox(25, 8, 1, 6, HAIR_SHADE);

            // Gunbai (Fan) on back
            if (isAttack) {
              box(23, 6, 8, 14, GUNBAI_CREAM); // Fan body
              box(23, 6, 2, 14, ARMOR_TRIM); // Fan edge
              box(25, 10, 4, 4, ARMOR_RED); // Tomoe
              box(22, 20, 2, 8, GUNBAI_BROWN); // Handle
            } else {
              box(5, 8, 7, 18, GUNBAI_CREAM); // Fan body
              box(10, 8, 2, 18, ARMOR_TRIM); // Fan edge
              box(6, 13, 3, 3, ARMOR_RED); // Tomoe
            }

            // 2. LEGS (Ninja pants and sandals)
            box(11, 24, 4, 6, CLOTHES);
            box(17, 24, 4, 6, CLOTHES);
            box(11, 24, 1, 6, CLOTHES_DARK);
            box(20, 24, 1, 6, CLOTHES_DARK); // Shading
            // Bandages
            box(11, 30, 4, 2, 0xe2e8f0);
            box(17, 30, 4, 2, 0xe2e8f0);
            // Sandals (Open toe)
            box(11, 32, 4, 1, ARMOR_TRIM);
            box(17, 32, 4, 1, ARMOR_TRIM);
            dot(11, 31, ARMOR_TRIM);
            dot(17, 31, ARMOR_TRIM); // Straps

            // 3. TORSO & SAMURAI ARMOR
            // Black suit base
            box(12, 14, 8, 10, CLOTHES);

            // Chest Plate (Do)
            box(11, 14, 10, 7, ARMOR_RED);
            box(11, 14, 10, 1, ARMOR_TRIM); // Top trim
            box(11, 17, 10, 1, ARMOR_DARK); // Plate line
            box(11, 20, 10, 1, ARMOR_TRIM); // Bottom trim
            box(15, 14, 2, 7, ARMOR_DARK); // Center split

            // Armor Skirts (Kusazuri) - Flared out slightly for menacing stance
            // Left skirt
            box(9, 21, 4, 6, ARMOR_RED);
            box(9, 21, 4, 1, ARMOR_TRIM);
            box(9, 23, 4, 1, ARMOR_DARK);
            box(9, 25, 4, 1, ARMOR_DARK);
            box(9, 26, 4, 1, ARMOR_TRIM);
            // Right skirt
            box(19, 21, 4, 6, ARMOR_RED);
            box(19, 21, 4, 1, ARMOR_TRIM);
            box(19, 23, 4, 1, ARMOR_DARK);
            box(19, 25, 4, 1, ARMOR_DARK);
            box(19, 26, 4, 1, ARMOR_TRIM);
            // Center skirt
            box(14, 21, 4, 5, ARMOR_RED);
            box(14, 21, 4, 1, ARMOR_TRIM);
            box(14, 23, 4, 1, ARMOR_DARK);
            box(14, 25, 4, 1, ARMOR_TRIM);

            // 4. ARMS & SHOULDERS (Crossed or ready stance)
            const armY = isAttack ? -4 : 0;

            // Massive Shoulder Guards (Sode)
            box(7, 13 + armY, 4, 6, ARMOR_RED);
            box(21, 13 + armY, 4, 6, ARMOR_RED);
            box(7, 13 + armY, 4, 1, ARMOR_TRIM);
            box(21, 13 + armY, 4, 1, ARMOR_TRIM);
            box(7, 15 + armY, 4, 1, ARMOR_DARK);
            box(21, 15 + armY, 4, 1, ARMOR_DARK);
            box(7, 17 + armY, 4, 1, ARMOR_DARK);
            box(21, 17 + armY, 4, 1, ARMOR_DARK);
            box(7, 18 + armY, 4, 1, ARMOR_TRIM);
            box(21, 18 + armY, 4, 1, ARMOR_TRIM);

            // Sleeves
            box(9, 19 + armY, 3, 4, CLOTHES);
            box(20, 19 + armY, 3, 4, CLOTHES);
            // Gloves/Hands
            box(9, 23 + armY, 3, 2, ARMOR_TRIM);
            box(20, 23 + armY, 3, 2, ARMOR_TRIM);

            // 5. HEAD & FACE
            headBox(12, 6, 8, 7, SKIN);
            headBox(12, 6, 1, 7, SKIN_SHADE); // Face shading
            headBox(13, 12, 6, 1, SKIN_SHADE); // Jaw shading

            // Eyes (Sharingan) - Piercing and menacing
            headBox(13, 9, 2, 1, 0xffffff); // Sclera left
            headDot(14, 9, SHARINGAN); // Red pupil left
            headBox(17, 9, 2, 1, 0xffffff); // Sclera right
            headDot(17, 9, SHARINGAN); // Red pupil right

            // Angry Eyebrows
            headBox(13, 8, 2, 1, HAIR); // Left
            headBox(17, 8, 2, 1, HAIR); // Right
            headDot(15, 8, SKIN_SHADE);
            headDot(16, 8, SKIN_SHADE); // Furrowed brow

            // Mouth (Slight smirk or grimace)
            headBox(14, 11, 3, 1, ARMOR_TRIM);

            // 6. FRONT HAIR (Bangs covering right eye partially)
            // Right bang (viewer's right, Madara's left)
            headBox(18, 5, 3, 8, HAIR);
            headBox(19, 5, 1, 6, HAIR_SHADE); // Highlight
            headBox(17, 5, 1, 4, HAIR);

            // Left bang (viewer's left, Madara's right)
            headBox(11, 5, 2, 6, HAIR);
            headBox(12, 5, 1, 4, HAIR_SHADE);
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

    if (!scene.textures.exists("madara")) { generateForm(0); }
    if (!scene.textures.exists("madara_ssj")) { generateForm(1); }
    if (!scene.textures.exists("madara_ui")) { generateForm(2); }
}
