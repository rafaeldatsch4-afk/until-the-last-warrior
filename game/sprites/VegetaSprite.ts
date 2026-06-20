import Phaser from "phaser";

export function generateVegetaSprite(scene: Phaser.Scene) {
  const generateForm = (form: number) => {
    const key = "vegeta";

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
        const SUIT_BLUE = 0x1f3c88; // Deeper, more vibrant blue
        const SUIT_SHADOW = 0x0f1e44;
        const SUIT_LIGHT = 0x2e57c6;
        const ARMOR_WHITE = 0xfafafa;
        const ARMOR_SHADOW = 0xbac3d6; // Slight blueish tint to armor shadows
        const ARMOR_DARK = 0x7b879c;
        const GOLD = 0xffc800; // Richer yellow/gold
        const GOLD_SHADOW = 0xcc9900;
        const SKIN = 0xffce9e;
        const SKIN_SHADOW = 0xe0ac7d;

        let HAIR = BLACK;
        let EYE = BLACK;
        let BROW = BLACK;
        if (isUI) {
          // Ultra Ego
          HAIR = 0x9b59b6; // Purple
          EYE = 0xff00ff; // Magenta
          BROW = 0x9b59b6;
        } else if (isTransformed) {
          // SSJ
          HAIR = 0xffe600; // Golden
          EYE = 0x00f2ff;
          BROW = 0xffe600;
        }

        // --- LEGS & BOOTS ---
        // Bodysuit base
        box(11, 23, 4, 6, SUIT_BLUE);
        box(17, 23, 4, 6, SUIT_BLUE); // Thighs base

        // Enhanced Ribbed bodysuit texture on legs
        for (let ly = 23; ly < 28; ly += 2) {
          box(11, ly, 4, 1, SUIT_SHADOW);
          box(17, ly, 4, 1, SUIT_SHADOW);
          box(11, ly + 1, 4, 1, SUIT_LIGHT);
          box(17, ly + 1, 4, 1, SUIT_LIGHT);
        }
        // Inner leg shadow
        box(14, 23, 1, 5, 0x0a142c);
        box(17, 23, 1, 5, 0x0a142c);

        // Segmented Boots
        box(11, 28, 4, 4, ARMOR_WHITE);
        box(17, 28, 4, 4, ARMOR_WHITE);

        // Horizontal boot segments
        box(11, 29, 4, 1, ARMOR_SHADOW);
        box(17, 29, 4, 1, ARMOR_SHADOW);
        box(11, 31, 4, 1, ARMOR_SHADOW);
        box(17, 31, 4, 1, ARMOR_SHADOW);

        box(10, 32, 5, 2, ARMOR_WHITE);
        box(17, 32, 5, 2, ARMOR_WHITE);

        // Distinct Gold Tips
        box(9, 33, 5, 1, GOLD);
        box(18, 33, 5, 1, GOLD);
        dot(9, 32, GOLD);
        dot(13, 32, GOLD);
        dot(18, 32, GOLD);
        dot(22, 32, GOLD);
        // Highlight on gold tip
        dot(9, 33, 0xffeb73);
        dot(18, 33, 0xffeb73);

        box(10, 34, 5, 1, 0x000000);
        box(17, 34, 5, 1, 0x000000); // Sole shadow

        // --- TORSO ---
        // Bodysuit underneath
        box(12, 19, 8, 4, SUIT_BLUE);
        box(14, 23, 4, 2, SUIT_BLUE); // Crotch connection gap

        // Enhanced Bodysuit ribbing on abdomen
        for (let ty = 19; ty < 23; ty += 2) {
          box(12, ty, 8, 1, SUIT_SHADOW);
          box(12, ty + 1, 8, 1, SUIT_LIGHT);
        }
        box(12, 19, 1, 5, 0x0a142c);
        box(19, 19, 1, 5, 0x0a142c); // Side shadow

        // --- ANGULAR ARMOR ---
        // Main armor block
        box(11, 14, 10, 6, ARMOR_WHITE);

        // Armor Abdomen extension (yellow straps wrap)
        box(11, 14, 2, 6, GOLD);
        box(19, 14, 2, 6, GOLD); // Side gold straps
        box(11, 14, 1, 6, GOLD_SHADOW);
        box(20, 14, 1, 6, GOLD_SHADOW); // Gold strap shadow

        // Chest segments (Angular Pectorals)
        box(11, 16, 4, 1, ARMOR_SHADOW);
        box(17, 16, 4, 1, ARMOR_SHADOW);
        box(15, 14, 2, 3, ARMOR_DARK); // Center division

        // Abdomen armor segments (vertical ribbed plates)
        for (let rx = 13; rx <= 18; rx += 1) {
          if (rx % 2 !== 0) {
            box(rx, 17, 1, 3, ARMOR_DARK);
          } else {
            box(rx, 17, 1, 3, ARMOR_SHADOW);
          }
        }

        // Armor bright highlights
        box(13, 14, 2, 1, 0xffffff);
        box(17, 14, 2, 1, 0xffffff); // Top chest

        // --- SHOULDERS (Classic angular gold pads) ---
        // Left Pad (overlapping arm and chest)
        box(5, 12, 7, 2, GOLD); // Extended Gold Shoulder
        box(6, 13, 5, 2, ARMOR_WHITE); // White pad overlapping
        dot(5, 11, GOLD); // Peak point gold
        dot(6, 12, ARMOR_WHITE); // Peak point white
        box(7, 14, 4, 1, ARMOR_SHADOW); // Underside shadow
        box(7, 13, 2, 1, 0xffffff); // Glint

        // Right Pad
        box(20, 12, 7, 2, GOLD);
        box(21, 13, 5, 2, ARMOR_WHITE);
        dot(26, 11, GOLD);
        dot(25, 12, ARMOR_WHITE);
        box(21, 14, 4, 1, ARMOR_SHADOW);
        box(23, 13, 2, 1, 0xffffff);

        // --- ARMS ---
        if (isAttack) {
          box(21, 13, 6, 4, SUIT_BLUE); // Bicep extended
          box(22, 13, 5, 1, SUIT_SHADOW); // Ribbing
          box(22, 15, 5, 1, SUIT_SHADOW);
          box(27, 14, 6, 3, SUIT_BLUE); // Forearm
          // Segmented Glove
          box(30, 12, 2, 7, ARMOR_WHITE); // Flare
          box(30, 13, 1, 5, ARMOR_SHADOW);
          box(32, 13, 4, 5, ARMOR_WHITE);
          box(32, 14, 2, 2, ARMOR_SHADOW); // Knuckles
          box(34, 13, 3, 4, ARMOR_WHITE); // Extended fist
          alphaBox(36, 13, 4, 4, ARMOR_WHITE, 0.5); // Blur
          box(6, 15, 4, 5, SUIT_BLUE); // Left arm back
          box(5, 17, 6, 2, ARMOR_WHITE); // Left glove flare
          box(6, 19, 4, 3, ARMOR_WHITE); // Left glove
        } else {
          // Resting arms with Suit Ribbing
          box(8, 16, 3, 4, SUIT_BLUE);
          box(21, 16, 3, 4, SUIT_BLUE);
          // Arm ribbed shading
          box(8, 16, 3, 1, SUIT_SHADOW);
          box(8, 17, 3, 1, SUIT_LIGHT);
          box(8, 18, 3, 1, SUIT_SHADOW);
          box(8, 19, 3, 1, SUIT_LIGHT);

          box(21, 16, 3, 1, SUIT_SHADOW);
          box(21, 17, 3, 1, SUIT_LIGHT);
          box(21, 18, 3, 1, SUIT_SHADOW);
          box(21, 19, 3, 1, SUIT_LIGHT);

          // Gloves (White, flared top, segmented)
          box(6, 19, 7, 2, ARMOR_WHITE);
          box(19, 19, 7, 2, ARMOR_WHITE);
          box(6, 20, 7, 1, ARMOR_SHADOW);
          box(19, 20, 7, 1, ARMOR_SHADOW);

          // Hands
          box(8, 21, 3, 3, ARMOR_WHITE);
          box(21, 21, 3, 3, ARMOR_WHITE);
          box(8, 22, 3, 1, ARMOR_SHADOW);
          box(21, 22, 3, 1, ARMOR_SHADOW);
        }

        // --- HEAD & FACE ---
        headBox(11, 6, 10, 6, SKIN); // Face base (a bit wider)
        headBox(13, 12, 6, 1, SKIN); // Pointed chin

        // Angular cheek shading (Vegeta's gaunt look)
        headBox(11, 6, 1, 6, SKIN_SHADOW);
        headBox(20, 6, 1, 6, SKIN_SHADOW);
        headBox(13, 10, 1, 2, SKIN_SHADOW);
        headBox(18, 10, 1, 2, SKIN_SHADOW); // Cheekbone hollows
        headBox(13, 12, 6, 1, SKIN_SHADOW); // Chin shadow

        // Eyes & Angry Brow (Heavy furrow)
        headBox(12, 8, 3, 1, WHITE);
        headBox(17, 8, 3, 1, WHITE);

        // Sharp, angled eyebrows for a deeper aggressive slant
        headBox(12, 7, 3, 1, BROW);
        headBox(17, 7, 3, 1, BROW);
        headDot(14, 8, BROW); // Deep furrow
        headDot(17, 8, BROW);
        headBox(15, 8, 2, 1, SKIN_SHADOW); // bridge crease

        // Pupils focused and intense
        headDot(13, 8, EYE);
        headDot(18, 8, EYE);

        // Angle cutoff to make them slant aggressively
        headDot(12, 8, SKIN);
        headDot(19, 8, SKIN);

        // Expressions (Fierce and Angry)
        if (isAttack) {
          headBox(14, 11, 4, 3, 0x440000); // Shouting wide open
          headBox(14, 11, 4, 1, WHITE); // Upper teeth
          headBox(15, 13, 2, 1, 0xff7777); // Tongue
        } else if (isDefend) {
          headBox(14, 11, 4, 2, WHITE); // Grit teeth
          headBox(13, 11, 1, 2, SKIN_SHADOW);
          headBox(18, 11, 1, 2, SKIN_SHADOW); // Tension lines
        } else {
          // Angry scowl (not just a smirk)
          headBox(14, 11, 4, 1, SKIN_SHADOW); // Scowl line
          headDot(15, 11, 0x222222);
          headDot(16, 11, 0x222222);
          headDot(13, 12, SKIN_SHADOW); // Downward turned corners
          headDot(18, 12, SKIN_SHADOW);
        }

        // --- HAIR (Iconic Flame & Widow's Peak) ---
        // Deep Widow's Peak
        headBox(13, 4, 6, 2, SKIN);
        headBox(14, 3, 4, 1, SKIN);
        headDot(15, 2, SKIN); // Point
        headDot(16, 2, SKIN);

        // Sideburns
        headBox(10, 5, 1, 3, HAIR);
        headBox(21, 5, 1, 3, HAIR);

        if (isTransformed) {
          // SUPER SAIYAN DYNAMIC HAIR
          headBox(9, -4, 14, 9, HAIR); // Base volume
          headBox(10, -8, 12, 4, HAIR);
          headBox(11, -12, 10, 4, HAIR);

          // Large dynamic spikes separating outwards
          headBox(14, -18, 4, 6, HAIR); // Central tall spike
          headBox(10, -15, 3, 6, HAIR); // Left angled spike
          headBox(19, -15, 3, 6, HAIR); // Right angled spike
          headBox(7, -10, 3, 6, HAIR); // Far left flare
          headBox(22, -10, 3, 6, HAIR); // Far right flare

          // Tapered tips
          headBox(15, -20, 2, 2, HAIR);
          headBox(10, -17, 2, 2, HAIR);
          headBox(20, -17, 2, 2, HAIR);
          headDot(7, -12, HAIR);
          headDot(24, -12, HAIR);

          // Hair highlights and shading for golden volume
          const LIGHT = isUI ? 0xd2b4de : 0xffcf40;
          const SHADE = isUI ? 0x732d91 : 0xcfa000;

          // Inner highlights
          headBox(15, -17, 2, 8, LIGHT);
          headBox(11, -14, 2, 6, LIGHT);
          headBox(19, -14, 2, 6, LIGHT);

          // Shadows along the edges of the spikes
          headBox(14, -18, 1, 10, SHADE);
          headBox(18, -15, 1, 8, SHADE);
          headBox(13, -15, 1, 8, SHADE);
          headBox(21, -10, 1, 6, SHADE);
          headBox(10, -10, 1, 6, SHADE);
        } else {
          // BASE FORM FLAME HAIR
          headBox(9, -2, 14, 7, HAIR); // base volume at top of head
          headBox(10, -6, 12, 4, HAIR);
          headBox(11, -9, 10, 3, HAIR);
          headBox(13, -12, 6, 3, HAIR);

          // Individual tall spikes (tips of the flames)
          headBox(14, -16, 2, 4, HAIR);
          headBox(16, -14, 2, 2, HAIR);
          headBox(11, -13, 2, 4, HAIR);
          headBox(19, -12, 2, 3, HAIR);

          // Side flares / flame-like barbs
          headBox(8, -5, 2, 4, HAIR);
          headBox(7, -8, 2, 3, HAIR);
          headBox(6, -4, 1, 2, HAIR); // extra jagged

          headBox(22, -5, 2, 4, HAIR);
          headBox(23, -8, 2, 3, HAIR);
          headBox(25, -4, 1, 2, HAIR);

          headBox(10, -10, 2, 2, HAIR);
          headBox(20, -9, 2, 2, HAIR);

          // Hair Texture & Shading (Striated upwards flame lines)
          const hairShadowC = 0x222222;

          // Flame contouring
          headBox(11, -8, 1, 10, hairShadowC);
          headBox(20, -7, 1, 9, hairShadowC);
          headBox(14, -14, 1, 16, hairShadowC);
          headBox(17, -12, 1, 14, hairShadowC);
          headBox(9, -6, 1, 8, hairShadowC);
          headBox(22, -6, 1, 8, hairShadowC);
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

  if (!scene.textures.exists("vegeta")) {
    generateForm(0);
  }
  if (!scene.textures.exists("vegeta_ssj")) {
    generateForm(1);
  }
  if (!scene.textures.exists("vegeta_ui")) {
    generateForm(2);
  }
}
