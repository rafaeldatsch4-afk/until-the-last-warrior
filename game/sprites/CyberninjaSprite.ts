import Phaser from "phaser";

export function generateCyberninjaSprite(scene: Phaser.Scene) {
  const generateForm = (form: number) => {
    const key = "cyberninja";

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
        let SUIT_MAIN = 0x2a3036;
        let SUIT_DARK = 0x1a1d21;
        let SUIT_LIGHT = 0x4a555e;
        let NEON = 0x00eaff;
        let SCARF = 0x00d2d3;
        let METAL = 0x8a9ba8;
        let METAL_DARK = 0x4e5a63;

        if (isTransformed && !isUI) {
          SUIT_MAIN = 0x1a1a24;
          SUIT_DARK = 0x0d0d12;
          SUIT_LIGHT = 0x3a3a4d;
          NEON = 0xff0055;
          SCARF = 0xff0055;
          METAL = 0x747488;
          METAL_DARK = 0x333344;
        } else if (isUI) {
          SUIT_MAIN = 0x222222;
          SUIT_DARK = 0x000000;
          SUIT_LIGHT = 0x666666;
          NEON = 0xffffff;
          SCARF = 0xffffff;
          METAL = 0xdddddd;
          METAL_DARK = 0x777777;
        }

        // Cybernetic Legs
        box(10, 23, 4, 4, SUIT_DARK); // Thighs
        box(18, 23, 4, 4, SUIT_DARK);
        box(11, 23, 1, 3, NEON); // Neon thigh strip
        box(19, 23, 1, 3, NEON);

        box(9, 27, 5, 4, SUIT_MAIN); // Greaves
        box(17, 27, 5, 4, SUIT_MAIN);
        box(9, 27, 1, 4, SUIT_LIGHT); // Greave highlight
        box(17, 27, 1, 4, SUIT_LIGHT);

        box(10, 31, 4, 1, METAL_DARK); // Ankles
        box(18, 31, 4, 1, METAL_DARK);

        box(9, 32, 5, 2, SUIT_DARK); // Foot
        box(17, 32, 5, 2, SUIT_DARK);
        box(9, 32, 2, 1, METAL); // Toe cap
        box(17, 32, 2, 1, METAL);

        // Pelvis
        box(11, 21, 10, 3, SUIT_DARK);
        box(14, 21, 4, 4, METAL_DARK); // Codpiece
        box(15, 22, 2, 2, SUIT_DARK);

        // Torso Core
        box(12, 14, 8, 7, SUIT_DARK);

        // Chest Plate Armor
        box(11, 12, 10, 5, SUIT_MAIN);
        box(11, 12, 2, 5, SUIT_LIGHT); // Chest highlight
        box(18, 12, 2, 5, SUIT_LIGHT);

        // Glowing Chest Core reactor
        box(14, 14, 4, 3, NEON);
        box(15, 14, 2, 2, 0xffffff); // core bright

        // Scarf/Cape flow
        let scarfWave = f % 2 === 0 ? 0 : 1;
        if (isWalk) scarfWave = (f % 2) * 2;
        let scarfLen = 12 + scarfWave;
        let scarfX = Math.max(0, 11 - scarfLen);

        headBox(scarfX, 13, scarfLen, 2, SCARF);
        headBox(scarfX + 2, 15, scarfLen - 3, 1, SCARF);
        headBox(scarfX + 4, 16, scarfLen - 6, 1, SCARF);

        // Scarf Collar
        headBox(10, 11, 12, 3, SCARF);
        headBox(11, 12, 10, 1, 0xffffff); // bright inner wrap

        // Arms and Weapons
        if (isAttack) {
          box(20, 12, 4, 4, SUIT_MAIN); // Right shoulder
          box(21, 13, 2, 2, NEON); // shoulder glowing bit

          // Dynamic Energy Blade Slash
          box(24, 14, 6, 2, SUIT_DARK); // Right arm out
          box(30, 13, 3, 4, METAL); // Metal hand

          // The Energy Sword
          box(33, 14, 20, 2, NEON); // Blade core
          alphaBox(31, 12, 24, 6, NEON, 0.4); // Blade glow aura
          box(51, 14, 2, 1, 0xffffff); // Tip bright spark
          box(33, 14, 10, 1, 0xffffff); // Core bright

          box(6, 12, 4, 4, SUIT_MAIN); // Left shoulder back
          box(8, 16, 2, 5, SUIT_DARK); // Left arm pulled
          box(7, 21, 3, 3, METAL); // Left metal hand
        } else {
          box(8, 12, 4, 4, SUIT_MAIN); // Shoulders
          box(20, 12, 4, 4, SUIT_MAIN);
          box(8, 12, 1, 4, SUIT_LIGHT); // Shoulder detail
          box(20, 12, 1, 4, SUIT_LIGHT);

          box(9, 13, 2, 2, NEON); // Neon shoulder pads
          box(21, 13, 2, 2, NEON);

          box(9, 16, 2, 4, SUIT_DARK); // Upper arms
          box(21, 16, 2, 4, SUIT_DARK);

          // Glowing neon lines on upper arms
          box(9, 17, 1, 2, NEON);
          box(21, 17, 1, 2, NEON);

          // Cybernetic Gauntlets
          box(8, 20, 4, 4, METAL);
          box(20, 20, 4, 4, METAL);
          box(8, 20, 1, 4, 0xffffff); // gauntlet edge shine
          box(20, 20, 1, 4, 0xffffff);

          // Katana Hilt on back (sheathed)
          headBox(8, 3, 2, 9, METAL_DARK);
          headBox(8, 2, 2, 1, NEON); // glowing pommel
        }

        // Cyber Helm
        headBox(12, 5, 8, 7, SUIT_MAIN);
        headBox(12, 5, 2, 7, SUIT_LIGHT); // Helm highlight

        // Visor Faceplate
        headBox(13, 7, 7, 3, SUIT_DARK);
        headBox(13, 7, 6, 1, NEON); // Glowing slit
        headBox(14, 8, 2, 1, NEON); // T-shape slit
        headBox(18, 7, 1, 1, 0xffffff); // Bright lens flare

        // Earpieces/Sensors
        headBox(10, 6, 2, 4, METAL);
        headBox(20, 6, 2, 4, METAL);
        headBox(10, 7, 1, 2, NEON); // Neon ear tips
        headBox(21, 7, 1, 2, NEON);

        if (isTransformed) {
          // Overdrive/UI: Energy Hair / Plume emissions
          headBox(14, 1, 2, 4, NEON);
          headBox(13, 2, 4, 3, NEON);
          headBox(15, -1, 2, 5, 0xffffff); // core spike

          alphaBox(11, -2, 8, 7, NEON, 0.4); // plume aura
        } else {
          // Standard base fin
          headBox(15, 3, 2, 2, METAL);
          headBox(16, 4, 2, 1, METAL_DARK);
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

  if (!scene.textures.exists("cyberninja")) {
    generateForm(0);
  }
  if (!scene.textures.exists("cyberninja_ssj")) {
    generateForm(1);
  }
  if (!scene.textures.exists("cyberninja_ui")) {
    generateForm(2);
  }
}
