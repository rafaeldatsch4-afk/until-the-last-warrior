import Phaser from "phaser";

export function generateItachiSprite(scene: Phaser.Scene) {
  const generateForm = (form: number) => {
    const key = "itachi";

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
      const breatheOffset =
        !isAttack && !isDefend && !isCharge && !isWalk && (f === 1 || f === 3)
          ? 1
          : 0;

      // Pose offsets
      const poseOffsetX = f === 8 ? 2 : f === 9 ? 4 : f === 10 ? -2 : 0;
      const poseOffsetY =
        f === 8
          ? -1
          : f === 9
            ? -2
            : f === 10
              ? 2
              : f === 11
                ? -1
                : isWalk && (f === 5 || f === 7)
                  ? -1
                  : 0;

      const getWalkOffsets = (x: number, y: number) => {
        if (!isWalk || y < 22) return { ox: 0, oy: 0 };
        const isLeftLeg = x < 15;
        const wIndex = f - 4;
        let ox = 0,
          oy = 0;
        if (isLeftLeg) {
          if (wIndex === 0) {
            ox = 1;
            oy = -1;
          } else if (wIndex === 1) {
            ox = 3;
            oy = -2;
          } else if (wIndex === 2) {
            ox = 0;
            oy = 0;
          } else if (wIndex === 3) {
            ox = -2;
            oy = 0;
          }
        } else {
          if (wIndex === 0) {
            ox = -2;
            oy = 0;
          } else if (wIndex === 1) {
            ox = -4;
            oy = 0;
          } else if (wIndex === 2) {
            ox = -1;
            oy = -1;
          } else if (wIndex === 3) {
            ox = 2;
            oy = -2;
          }
        }
        return { ox, oy };
      };

      const dot = (x: number, y: number, color: number) => {
        const finalY = y < 24 ? y + breatheOffset : y;
        const { ox, oy } =
          typeof getWalkOffsets === "function"
            ? getWalkOffsets(x, y)
            : { ox: 0, oy: 0 };
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) +
          shiftX +
          ox;
        const finalYPose =
          (isAttack || isDefend || isCharge
            ? finalY + poseOffsetY / 2
            : finalY) + (typeof oy !== "undefined" ? oy : 0);
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
        const { ox, oy } =
          typeof getWalkOffsets === "function"
            ? getWalkOffsets(x, y)
            : { ox: 0, oy: 0 };
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) +
          shiftX +
          ox;
        const finalYPose =
          (isAttack || isDefend || isCharge
            ? finalY + poseOffsetY / 2
            : finalY) + (typeof oy !== "undefined" ? oy : 0);
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
        const { ox, oy } =
          typeof getWalkOffsets === "function"
            ? getWalkOffsets(x, y)
            : { ox: 0, oy: 0 };
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) +
          shiftX +
          ox;
        const finalYPose =
          (isAttack || isDefend || isCharge
            ? finalY + poseOffsetY / 2
            : finalY) + (typeof oy !== "undefined" ? oy : 0);
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
        const { ox, oy } =
          typeof getWalkOffsets === "function"
            ? getWalkOffsets(x, y)
            : { ox: 0, oy: 0 };
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) +
          shiftX +
          ox;
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
        const { ox, oy } =
          typeof getWalkOffsets === "function"
            ? getWalkOffsets(x, y)
            : { ox: 0, oy: 0 };
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) +
          shiftX +
          ox;
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
        const isTransformed = form === 1; // Susanoo
        const SKIN = 0xffeebb;
        const SKIN_SHADOW = 0xccbb99;
        const HAIR = 0x111111;
        const HAIR_SHADOW = 0x000000;
        const CLOAK = 0x1a1a1a; // Akatsuki cloak
        const CLOAK_SHADOW = 0x0a0a0a;
        const RED_CLOUD = 0xcc0000;
        const SHARINGAN = 0xff0000;

        if (isTransformed) {
          // PERFECT SUSANOO - Minimalist Block-Style (Itachi)

          const S_DARK = 0x990000; // Deep crimson
          const S_MID = 0xcc0000; // Vibrant red
          const S_NEON = 0xff3333; // Neon red/orange glow
          const S_EYE = 0xffaa00; // Glowing yellow/orange eyes
          const FIRE = 0xff6600; // Totsuka flame
          const YATA = 0xffcc00; // Yata mirror gold

          const animY = !isAttack && f % 2 === 0 ? 1 : 0;

          // SUSANOO BACK WINGS / AURA
          alphaBox(2, -10 + animY, 28, 42, S_MID, 0.2);
          alphaBox(0, -5 + animY, 32, 30, S_NEON, 0.15);

          // Wings / Back Armor
          alphaBox(1, -12 + animY, 8, 24, S_DARK, 0.5);
          alphaBox(23, -12 + animY, 8, 24, S_DARK, 0.5);
          alphaBox(0, -8 + animY, 6, 18, S_NEON, 0.4);
          alphaBox(26, -8 + animY, 6, 18, S_NEON, 0.4);

          // MINI ITACHI (Core)
          const mX = 13;
          const mY = 16 + animY;

          // Hair back
          box(mX - 2, mY - 2, 10, 10, HAIR);
          // Cloak
          box(mX - 1, mY + 4, 8, 9, CLOAK);
          // Red Cloud
          box(mX + 1, mY + 6, 3, 2, RED_CLOUD);
          // Legs
          box(mX + 1, mY + 13, 4, 3, 0x333333);
          // Face
          box(mX + 1, mY, 4, 4, SKIN);
          // Hair front
          box(mX, mY - 1, 6, 2, HAIR);
          box(mX - 1, mY + 1, 2, 4, HAIR); // Left bang
          box(mX + 5, mY + 1, 2, 4, HAIR); // Right bang
          // Headband
          box(mX + 1, mY, 4, 1, 0x333333);

          // Arms & Weapons
          if (isAttack) {
            // Left Arm (Yata Mirror)
            alphaBox(2, 6 + animY, 6, 14, S_MID, 0.7);
            // Yata Mirror (Shield)
            alphaBox(-4, 8, 12, 18, YATA, 0.6);
            alphaBox(-2, 10, 8, 14, 0xffffff, 0.8);

            // Right Arm (Totsuka Blade)
            alphaBox(24, -4 + animY, 6, 14, S_MID, 0.7);
            // Totsuka Blade (Liquid Fire Sword)
            alphaBox(28, -18, 4, 30, FIRE, 0.8);
            alphaBox(29, -16, 2, 26, 0xffffff, 0.9);
            // Gourd (where sword comes from)
            alphaBox(26, 10 + animY, 8, 10, S_DARK, 0.8);
          } else {
            // Left Arm (Yata Mirror)
            alphaBox(4, 10 + animY, 6, 14, S_MID, 0.7);
            // Yata Mirror (Shield)
            alphaBox(0, 12, 10, 16, YATA, 0.5);
            alphaBox(2, 14, 6, 12, 0xffffff, 0.7);

            // Right Arm (Totsuka Blade)
            alphaBox(22, 10 + animY, 6, 14, S_MID, 0.7);
            // Totsuka Blade resting
            alphaBox(26, -4, 4, 24, FIRE, 0.6);
            // Gourd
            alphaBox(24, 18 + animY, 8, 10, S_DARK, 0.8);
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

          // Head (Armored Humanoid)
          alphaBox(10, -10 + animY, 12, 14, S_DARK, 0.85);
          alphaBox(11, -4 + animY, 10, 6, S_MID, 0.9); // Face Mask

          // Glowing Yellow Eyes
          alphaBox(12, -3 + animY, 3, 2, S_EYE, 1);
          alphaBox(17, -3 + animY, 3, 2, S_EYE, 1);

          // Helmet Crest / Details
          alphaBox(14, -12 + animY, 4, 6, S_NEON, 0.9); // Center crest
          alphaBox(9, -8 + animY, 2, 6, S_NEON, 0.9); // Side guards
          alphaBox(21, -8 + animY, 2, 6, S_NEON, 0.9);
        } else {
          // BASE ITACHI
          // Ponytail (Draw behind body/head)
          box(14, 10, 4, 8, HAIR);

          // Legs (Mesh armor and pants)
          box(12, 22, 3, 6, 0x333333);
          box(17, 22, 3, 6, 0x333333);
          // Feet (Sandals)
          box(11, 28, 4, 4, 0x222222);
          box(17, 28, 4, 4, 0x222222);
          box(11, 28, 2, 2, SKIN);
          box(17, 28, 2, 2, SKIN); // Toes

          // Torso (Akatsuki Cloak)
          box(9, 14, 14, 11, CLOAK);
          box(9, 14, 2, 11, CLOAK_SHADOW);
          box(21, 14, 2, 11, CLOAK_SHADOW);

          // Red Clouds
          box(11, 17, 4, 2, RED_CLOUD);
          box(12, 16, 2, 1, RED_CLOUD);

          box(17, 21, 4, 2, RED_CLOUD);
          box(18, 20, 2, 1, RED_CLOUD);

          // Arms (Wide cloak sleeves)
          if (isAttack) {
            // Right arm extended
            box(21, 14, 10, 3, CLOAK);
            box(31, 14, 4, 4, SKIN); // Hand fist
            box(31, 14, 2, 2, 0xffeebb); // Knuckles
            box(33, 15, 1, 1, 0x4b0082); // Nails
            box(34, 15, 4, 1, 0xcccccc); // Kunai

            // Left arm close
            box(6, 15, 3, 5, CLOAK);
          } else {
            const armY = f % 2 === 0 ? 14 : 15;
            box(6, armY, 4, 9, CLOAK);
            box(22, armY, 4, 9, CLOAK);
            // Hands (with nail polish)
            box(7, armY + 9, 2, 2, SKIN);
            box(23, armY + 9, 2, 2, SKIN);
            box(7, armY + 10, 1, 1, 0x4b0082);
            box(23, armY + 10, 1, 1, 0x4b0082); // Purple nails
          }

          // High Collar
          box(10, 10, 12, 5, CLOAK);
          box(11, 10, 10, 2, 0x880000); // Red inside collar

          // Head
          headBox(12, 4, 8, 8, SKIN);
          headBox(12, 4, 1, 8, SKIN_SHADOW);
          headBox(19, 4, 1, 8, SKIN_SHADOW);

          // Hair (Long, parted down the middle)
          box(11, 2, 10, 3, HAIR);
          box(10, 4, 2, 8, HAIR);
          box(20, 4, 2, 8, HAIR); // Side bangs

          // Headband
          box(12, 5, 8, 2, 0x333333);
          box(14, 5, 4, 2, 0xaaaaaa); // Plate
          box(15, 6, 2, 1, 0x000000); // Scratch

          // Eyes (Sharingan)
          box(13, 8, 2, 1, SHARINGAN);
          box(17, 8, 2, 1, SHARINGAN);
          // Tear troughs (Lines under eyes)
          box(13, 9, 1, 2, 0x444444);
          box(18, 9, 1, 2, 0x444444);
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

  if (!scene.textures.exists("itachi")) {
    generateForm(0);
  }
  if (!scene.textures.exists("itachi_ssj")) {
    generateForm(1);
  }
  if (!scene.textures.exists("itachi_ui")) {
    generateForm(2);
  }
}
