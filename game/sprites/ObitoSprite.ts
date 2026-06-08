import Phaser from "phaser";

export function generateObitoSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "obito";

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
          const SKIN = 0xffeebb;
          const SKIN_SHADOW = 0xccbb99;
          const HAIR = 0x111111;
          const HAIR_SHADOW = 0x000000;
          const CLOAK = 0x1a1a1a;
          const CLOAK_SHADOW = 0x0a0a0a;
          const CLOAK_RED = 0xcc0000;
          const MASK = 0xffa500; // Orange mask
          const MASK_SHADOW = 0xcc8400;
          const EYE_SHARINGAN = 0xff0000;
          const EYE_RINNEGAN = 0x9b59b6;
          const TEN_TAILS_SKIN = 0xe0e0e0; // Pale white/grey
          const TEN_TAILS_SHADOW = 0xb0b0b0;
          const MAGATAMA = 0x111111;
          if (isTransformed) {
            // TEN-TAILS JINCHURIKI MODE (Remastered & Animated)

            // Truth-Seeking Orbs (Halo behind him)
            const ORB = 0x111111;
            const ORB_GLOW = 0x444444;

            // Dynamic floating animation for orbs
            const float1 = f === 0 || f === 2 ? 0 : f === 1 ? -1 : 1;
            const float2 = f === 0 || f === 2 ? 0 : f === 1 ? 1 : -1;

            const drawOrb = (ox: number, oy: number, floatOffset: number) => {
              box(ox, oy + floatOffset, 4, 4, ORB);
              box(ox + 1, oy + 1 + floatOffset, 2, 2, ORB_GLOW);
            };

            drawOrb(3, 8, float1);
            drawOrb(25, 8, float2);
            drawOrb(1, 15, float2);
            drawOrb(27, 15, float1);
            drawOrb(3, 22, float1);
            drawOrb(25, 22, float2);
            drawOrb(8, 26, float2);
            drawOrb(20, 26, float1);

            // Lower Body (White Robe/Skirt)
            box(9, 22, 14, 10, 0xffffff); // Wide skirt
            box(9, 22, 2, 10, 0xdddddd);
            box(21, 22, 2, 10, 0xdddddd); // Skirt folds
            box(13, 22, 1, 10, 0xdddddd);
            box(18, 22, 1, 10, 0xdddddd);
            // Belt / Sash
            box(10, 21, 12, 2, 0x111111);

            // Feet (Bare, pale)
            box(10, 32, 4, 2, TEN_TAILS_SKIN);
            box(18, 32, 4, 2, TEN_TAILS_SKIN);

            // Torso (White robe top, open chest)
            box(10, 14, 12, 8, 0xffffff); // Robe base
            box(12, 14, 8, 7, TEN_TAILS_SKIN); // Exposed pale chest

            // Scale pattern on right side of chest (Obito's right = left side of sprite)
            box(12, 14, 4, 7, 0xcccccc);
            box(13, 15, 1, 1, 0x999999);
            box(15, 16, 1, 1, 0x999999);
            box(12, 18, 1, 1, 0x999999);
            box(14, 19, 1, 1, 0x999999);

            // 6 Magatamas on chest
            box(13, 15, 1, 1, MAGATAMA);
            box(15, 15, 1, 1, MAGATAMA);
            box(17, 15, 1, 1, MAGATAMA);
            box(14, 17, 1, 1, MAGATAMA);
            box(16, 17, 1, 1, MAGATAMA);
            box(18, 17, 1, 1, MAGATAMA);

            // Collar with Magatama
            box(10, 12, 12, 2, 0xffffff); // High collar
            box(11, 12, 1, 1, MAGATAMA);
            box(15, 12, 1, 1, MAGATAMA);
            box(19, 12, 1, 1, MAGATAMA); // Magatama on collar

            // Arms
            if (isAttack) {
              box(21, 14, 10, 3, TEN_TAILS_SKIN);
              box(21, 14, 10, 1, TEN_TAILS_SHADOW);
              box(31, 14, 4, 4, TEN_TAILS_SKIN); // Fist
              box(31, 14, 2, 2, 0xffffff); // Knuckles

              box(6, 15, 3, 5, TEN_TAILS_SKIN); // Left arm back
              box(6, 15, 1, 5, TEN_TAILS_SHADOW);

              // Horizontal staff
              box(15, 14, 22, 2, ORB); // Staff pole
              box(15, 14, 22, 1, ORB_GLOW);
              // Ring
              box(36, 11, 2, 8, ORB); // Ring base
              box(38, 9, 4, 2, ORB);
              box(38, 19, 4, 2, ORB); // Ring sides
              box(40, 11, 2, 8, ORB); // Ring front
            } else {
              box(8, 14, 3, 8, TEN_TAILS_SKIN);
              box(21, 14, 3, 8, TEN_TAILS_SKIN);
              box(8, 14, 1, 8, TEN_TAILS_SHADOW);
              box(24, 14, 1, 8, TEN_TAILS_SHADOW);
              box(8, 14, 2, 8, 0xcccccc);
              box(9, 15, 1, 1, 0x999999);
              box(8, 18, 1, 1, 0x999999);
              box(8, 22, 3, 3, TEN_TAILS_SKIN);
              box(21, 22, 3, 3, TEN_TAILS_SKIN);
              // Upright
              const staffY = 0;
              box(23, 2 + staffY, 2, 28, ORB); // Staff pole
              box(24, 2 + staffY, 1, 28, ORB_GLOW); // Staff highlight
              // Top ring
              box(21, 0 + staffY, 6, 2, ORB); // Top ring base
              box(19, -4 + staffY, 2, 6, ORB);
              box(27, -4 + staffY, 2, 6, ORB); // Ring sides
              box(21, -6 + staffY, 6, 2, ORB); // Ring top
              // Inner rings (animated floating)
              const ringFloat = f % 2 === 0 ? 0 : 1;
              box(20, -2 + staffY + ringFloat, 1, 2, ORB);
              box(27, -2 + staffY - ringFloat, 1, 2, ORB);
            }

            // Head (Pale skin)
            headBox(12, 4, 8, 8, TEN_TAILS_SKIN);
            headBox(12, 4, 1, 8, TEN_TAILS_SHADOW);
            headBox(19, 4, 1, 8, TEN_TAILS_SHADOW);

            // Right side face scales
            headBox(12, 4, 3, 8, 0xcccccc);
            headBox(13, 5, 1, 1, 0x999999);
            headBox(12, 8, 1, 1, 0x999999);

            // Hair (White, spiky, swept back)
            // Animate hair slightly
            const hairFloat = f === 1 || f === 3 ? -1 : 0;
            // Base hair
            headBox(9, -1 + hairFloat, 14, 6, 0xffffff);
            // Side spikes
            headBox(7, 1 + hairFloat, 2, 3, 0xffffff);
            headBox(23, 1 + hairFloat, 2, 3, 0xffffff);
            headBox(8, 3 + hairFloat, 2, 2, 0xffffff);
            headBox(22, 3 + hairFloat, 2, 2, 0xffffff);

            // Top spikes (swept back/up)
            headBox(9, -3 + hairFloat, 3, 3, 0xffffff);
            headBox(12, -4 + hairFloat, 3, 4, 0xffffff);
            headBox(15, -5 + hairFloat, 4, 5, 0xffffff); // Central large spike
            headBox(19, -4 + hairFloat, 3, 4, 0xffffff);
            headBox(22, -3 + hairFloat, 2, 3, 0xffffff);

            // Hair shadow
            headBox(9, -1 + hairFloat, 14, 2, 0xdddddd);

            // Eyes (Rinnegan and Sharingan)
            headBox(13, 7, 2, 2, 0xffffff);
            headBox(17, 7, 2, 2, 0xffffff); // Sclera
            headBox(13, 7, 2, 1, EYE_RINNEGAN); // Left eye Rinnegan (purple)
            headBox(17, 7, 2, 1, EYE_SHARINGAN); // Right eye Sharingan (red)

            // Horns (Asymmetrical)
            headBox(11, 2, 2, 3, TEN_TAILS_SKIN); // Left horn (small)
            headBox(18, -1, 3, 6, TEN_TAILS_SKIN); // Right horn (large, covers part of head)
            headBox(19, -3, 2, 2, TEN_TAILS_SKIN); // Right horn tip

            // Chakra Aura (Flames around feet)
            const AURA = 0xffffff;
            if (f % 2 === 0) {
              box(6, 30, 2, 4, AURA);
              box(24, 30, 2, 4, AURA);
              box(8, 28, 2, 6, AURA);
              box(22, 28, 2, 6, AURA);
            } else {
              box(5, 29, 2, 5, AURA);
              box(25, 29, 2, 5, AURA);
              box(7, 27, 2, 7, AURA);
              box(23, 27, 2, 7, AURA);
            }
          } else {
            // BASE FORM (Akatsuki Cloak + Orange Mask - Remastered)

            // Legs (Pants)
            box(11, 24, 4, 6, CLOAK);
            box(17, 24, 4, 6, CLOAK);
            box(11, 24, 1, 6, CLOAK_SHADOW);
            box(20, 24, 1, 6, CLOAK_SHADOW);

            // Shoes
            box(10, 30, 5, 2, 0x111111);
            box(17, 30, 5, 2, 0x111111);

            // Torso (Akatsuki Cloak)
            // Add slight cloak flutter animation
            const flutter = f % 2 === 0 ? 0 : 1;
            box(9 - flutter, 14, 14 + flutter * 2, 12, CLOAK); // Wider cloak
            box(9 - flutter, 14, 2, 12, CLOAK_SHADOW);
            box(21 + flutter, 14, 2, 12, CLOAK_SHADOW);

            // High Collar
            box(10, 11, 12, 4, CLOAK);
            box(10, 11, 2, 4, CLOAK_SHADOW);
            box(20, 11, 2, 4, CLOAK_SHADOW);
            box(10, 11, 12, 1, 0xcc0000); // Red inner lining of collar

            // Red Clouds (More detailed)
            box(11 - flutter, 17, 5, 3, CLOAK_RED);
            box(12 - flutter, 16, 3, 5, CLOAK_RED);
            box(16 + flutter, 21, 5, 3, CLOAK_RED);
            box(17 + flutter, 20, 3, 5, CLOAK_RED);
            box(11 - flutter, 17, 5, 1, 0xffffff); // White outline top
            box(16 + flutter, 21, 5, 1, 0xffffff); // White outline top

            // Arms (Cloak sleeves, wide)
            if (isAttack) {
              box(21, 14, 10, 4, CLOAK);
              box(21, 14, 10, 1, CLOAK_SHADOW);
              box(31, 14, 4, 4, 0x111111); // Glove Fist
              box(31, 14, 2, 2, 0x444444); // Knuckles

              box(6 - flutter, 15, 4, 6, CLOAK);
              box(6 - flutter, 21, 3, 3, 0x111111);
            } else {
              box(5 - flutter, 14, 4, 10, CLOAK);
              box(22 + flutter, 14, 4, 10, CLOAK);
              box(5 - flutter, 14, 1, 10, CLOAK_SHADOW);
              box(25 + flutter, 14, 1, 10, CLOAK_SHADOW);
              box(6 - flutter, 24, 3, 3, 0x111111);
              box(23 + flutter, 24, 3, 3, 0x111111);
            }

            // Head
            headBox(12, 6, 8, 8, SKIN);

            // Orange Spiral Mask (Tobi)
            headBox(11, 4, 10, 10, MASK);
            headBox(11, 4, 2, 10, MASK_SHADOW);
            headBox(19, 4, 2, 10, MASK_SHADOW);

            // Spiral pattern (Radiating from right eye)
            headBox(15, 7, 4, 1, MASK_SHADOW);
            headBox(14, 9, 5, 1, MASK_SHADOW);
            headBox(13, 11, 6, 1, MASK_SHADOW);
            headBox(13, 6, 1, 4, MASK_SHADOW);
            headBox(18, 6, 1, 4, MASK_SHADOW);

            // Eye hole (Right eye only)
            headBox(16, 7, 2, 2, 0x000000); // Hole
            headBox(16, 7, 2, 1, EYE_SHARINGAN); // Sharingan visible

            // Hair (Spiky, black, short, messy)
            const hairFloat = f === 1 || f === 3 ? -1 : 0;
            // Base hair behind mask
            headBox(10, 0 + hairFloat, 12, 5, HAIR);
            // Side spikes pointing outwards and upwards
            headBox(9, 2 + hairFloat, 2, 3, HAIR);
            headBox(21, 2 + hairFloat, 2, 3, HAIR);
            headBox(8, 4 + hairFloat, 2, 2, HAIR);
            headBox(22, 4 + hairFloat, 2, 2, HAIR);

            // Top spikes (messy)
            headBox(10, -2 + hairFloat, 2, 3, HAIR);
            headBox(12, -3 + hairFloat, 3, 4, HAIR);
            headBox(15, -4 + hairFloat, 2, 5, HAIR);
            headBox(17, -3 + hairFloat, 3, 4, HAIR);
            headBox(20, -2 + hairFloat, 2, 3, HAIR);

            // Hair shadow
            headBox(10, 0 + hairFloat, 2, 5, HAIR_SHADOW);
            headBox(20, 0 + hairFloat, 2, 5, HAIR_SHADOW);
          }
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

    if (!scene.textures.exists("obito")) { generateForm(0); }
    if (!scene.textures.exists("obito_ssj")) { generateForm(1); }
    if (!scene.textures.exists("obito_ui")) { generateForm(2); }
}
