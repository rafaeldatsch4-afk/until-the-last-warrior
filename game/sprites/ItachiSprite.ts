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

      const isTransformed = form > 0;
      const isUI = form === 2;

      if (isTransformed) {
        // =========================================================================
        // ARMORED TENGU SUSANOO (ITACHI UCHIHA) - HIGH DETAIL PIXEL ART
        // =========================================================================
        const animY = !isAttack && f % 2 === 0 ? 1 : 0;
        const chargeGlow = isCharge ? 0.2 : 0;

        // Susanoo Fiery Chakra & Ethereal Armor Palette
        const S_VOID = 0x2e0600;      // Deepest background shadow
        const S_DEEP = 0x701400;      // Deep crimson shadow armor
        const S_DARK = 0xaa2800;      // Dark amber-orange armor plate
        const S_MID = 0xdd4800;       // Vibrant glowing orange-amber armor
        const S_BRIGHT = 0xf87309;    // Bright orange flame armor highlight
        const S_GOLD = 0xffa92a;      // Gold/flame edge highlight
        const S_HOT = 0xffdc42;       // Incandescent hot yellow flame core
        const S_WHITE = 0xffffff;     // Pure glowing white-hot core
        const S_EYE = 0xffe600;       // Fierce glowing golden Tengu eyes
        const S_EYE_CORE = 0xffffff;  // White hot eye center
        
        // Sacred Weapons Palette
        const GOURD_SHADOW = 0x5a2305;// Sake Gourd deep shadow
        const GOURD_BODY = 0x944410;  // Sacred Sake Gourd body
        const GOURD_LIGHT = 0xd36e22; // Gourd light surface
        const GOURD_GOLD = 0xffc83b;  // Gourd golden neck ring & sealing rope
        const YATA_FIRE = 0xd63010;   // Yata Mirror outer flame
        const YATA_DARK = 0x6e1000;   // Yata Mirror dark armor rim
        const YATA_GOLD = 0xf59f00;   // Yata Mirror golden border
        const YATA_SWIRL = 0xffd43b;  // Yata Mirror swirling sacred spiral
        const YATA_CORE = 0xffffff;   // Yata Mirror sacred core

        // Mini-Itachi Palette (Crystal-Clear Chibi Shinobi)
        const I_SKIN = 0xffddbb;
        const I_SKIN_SHADOW = 0xcfa588;
        const I_HAIR = 0x111111;
        const I_HAIR_HL = 0x3a3a3a;
        const I_CLOAK = 0x141414;
        const I_CLOAK_DARK = 0x080808;
        const I_COLLAR_RED = 0x990000;
        const I_CLOUD_RED = 0xd63031;
        const I_CLOUD_WHITE = 0xffffff;
        const I_SHARINGAN = 0xff0000;
        const I_HEADBAND = 0x2d3436;
        const I_METAL = 0xd2dae2;
        const I_TEAR = 0x3d3d3d;
        const I_PANTS = 0x1e272e;
        const I_WRAP = 0xd2dae2;
        const I_RING = 0x8e44ad;

        // -------------------------------------------------------------------------
        // 1. BACK CHAKRA FLAMES & WINGS (ETHREAL FIRE PLUMES)
        // -------------------------------------------------------------------------
        const wingFlare = isCharge ? 6 : 0;
        // Ambient outer glow
        alphaBox(-4 - wingFlare, -14 - wingFlare + animY, 40 + wingFlare * 2, 48 + wingFlare, S_MID, 0.15 + chargeGlow);
        alphaBox(-1 - wingFlare, -10 - wingFlare + animY, 34 + wingFlare * 2, 42 + wingFlare, S_BRIGHT, 0.18 + chargeGlow);

        // Left Flame Wing Plume
        alphaBox(-5 - wingFlare, -14 - wingFlare + animY, 7, 24 + wingFlare, S_DEEP, 0.45);
        alphaBox(-3 - wingFlare, -18 - wingFlare + animY, 5, 22 + wingFlare, S_DARK, 0.6);
        alphaBox(-2 - wingFlare, -21 - wingFlare + animY, 4, 18 + wingFlare, S_MID, 0.7);
        alphaBox(-1 - wingFlare, -23 - wingFlare + animY, 3, 12 + wingFlare, S_BRIGHT, 0.85);
        alphaBox(0 - wingFlare, -22 - wingFlare + animY, 1, 6 + wingFlare, S_HOT, 0.95);

        // Right Flame Wing Plume
        alphaBox(30 + wingFlare, -14 - wingFlare + animY, 7, 24 + wingFlare, S_DEEP, 0.45);
        alphaBox(30 + wingFlare, -18 - wingFlare + animY, 5, 22 + wingFlare, S_DARK, 0.6);
        alphaBox(30 + wingFlare, -21 - wingFlare + animY, 4, 18 + wingFlare, S_MID, 0.7);
        alphaBox(30 + wingFlare, -23 - wingFlare + animY, 3, 12 + wingFlare, S_BRIGHT, 0.85);
        alphaBox(31 + wingFlare, -22 - wingFlare + animY, 1, 6 + wingFlare, S_HOT, 0.95);

        // -------------------------------------------------------------------------
        // 2. MAIN SUSANOO ANATOMY (TORSO, SHOULDERS, CHEST)
        // -------------------------------------------------------------------------
        // Luminous Interior Chamber of Susanoo (Enclosing Itachi with warm chakra aura)
        alphaBox(7, 4 + animY, 18, 24, S_DEEP, 0.8);
        alphaBox(8, 6 + animY, 16, 20, S_DARK, 0.55);
        alphaBox(9, 8 + animY, 14, 16, S_MID, 0.35);

        // Left Armored Pauldron / Shoulder
        alphaBox(1, 2 + animY, 7, 13, S_DARK, 0.9);
        alphaBox(0, 4 + animY, 8, 4, S_MID, 0.95);
        alphaBox(-1, 5 + animY, 9, 2, S_GOLD, 0.9);
        alphaBox(1, 8 + animY, 7, 4, S_MID, 0.95);
        alphaBox(0, 9 + animY, 8, 2, S_GOLD, 0.9);

        // Right Armored Pauldron / Shoulder
        alphaBox(24, 2 + animY, 7, 13, S_DARK, 0.9);
        alphaBox(24, 4 + animY, 8, 4, S_MID, 0.95);
        alphaBox(24, 5 + animY, 9, 2, S_GOLD, 0.9);
        alphaBox(24, 8 + animY, 7, 4, S_MID, 0.95);
        alphaBox(24, 9 + animY, 8, 2, S_GOLD, 0.9);

        // Upper Chest & Pectoral Muscle Plates
        alphaBox(7, 4 + animY, 18, 6, S_DARK, 0.95);
        alphaBox(8, 5 + animY, 16, 4, S_MID, 0.95);
        alphaBox(9, 6 + animY, 14, 2, S_BRIGHT, 0.95);
        alphaBox(14, 5 + animY, 4, 4, S_DEEP, 0.9);

        // -------------------------------------------------------------------------
        // 3. TENGU SAMURAI HELMET & HEAD (CONNECTED DIRECTLY TO CHEST)
        // -------------------------------------------------------------------------
        const hY = -4 + animY;

        // Helmet Dome & Horn Base
        alphaBox(9, hY - 7, 14, 12, S_DARK, 0.95);
        alphaBox(10, hY - 8, 12, 10, S_MID, 0.95);
        alphaBox(12, hY - 9, 8, 8, S_BRIGHT, 1);

        // Prominent Long Tengu Horn / Beak
        alphaBox(14, hY - 15, 4, 7, S_MID, 1);
        alphaBox(15, hY - 18, 2, 8, S_BRIGHT, 1);
        alphaBox(15, hY - 20, 2, 4, S_HOT, 1);
        alphaBox(15, hY - 21, 2, 2, S_WHITE, 1);

        // Lateral Curved Horns
        // Left Curved Horn
        alphaBox(7, hY - 11, 3, 6, S_DARK, 0.95);
        alphaBox(6, hY - 14, 3, 5, S_MID, 1);
        alphaBox(5, hY - 17, 2, 4, S_BRIGHT, 1);
        alphaBox(5, hY - 18, 1, 2, S_HOT, 1);
        // Right Curved Horn
        alphaBox(22, hY - 11, 3, 6, S_DARK, 0.95);
        alphaBox(23, hY - 14, 3, 5, S_MID, 1);
        alphaBox(25, hY - 17, 2, 4, S_BRIGHT, 1);
        alphaBox(26, hY - 18, 1, 2, S_HOT, 1);

        // Forehead Chakra Diamond Gem
        alphaBox(14, hY - 5, 4, 3, S_HOT, 1);
        alphaBox(15, hY - 5, 2, 2, S_WHITE, 1);

        // Brow Ridge & Shadow Sockets
        alphaBox(9, hY - 2, 14, 3, S_VOID, 1);
        alphaBox(10, hY - 1, 12, 2, S_DEEP, 1);

        // Fierce Glowing Golden Eyes
        alphaBox(11, hY, 3, 2, S_EYE, 1);
        alphaBox(12, hY, 1, 1, S_EYE_CORE, 1);
        alphaBox(18, hY, 3, 2, S_EYE, 1);
        alphaBox(19, hY, 1, 1, S_EYE_CORE, 1);

        // Tengu Samurai Fanged Faceplate & Jaw
        alphaBox(10, hY + 3, 12, 5, S_DARK, 0.95);
        alphaBox(11, hY + 4, 10, 3, S_VOID, 1);
        // Fanged grill
        alphaBox(12, hY + 4, 1, 2, S_HOT, 1);
        alphaBox(14, hY + 4, 1, 2, S_HOT, 1);
        alphaBox(17, hY + 4, 1, 2, S_HOT, 1);
        alphaBox(19, hY + 4, 1, 2, S_HOT, 1);

        // Samurai Neck Flanges
        alphaBox(8, hY + 3, 2, 5, S_MID, 0.9);
        alphaBox(22, hY + 3, 2, 5, S_MID, 0.9);
        alphaBox(10, hY + 7, 12, 3, S_DARK, 0.95);

        // -------------------------------------------------------------------------
        // 4. MINI-ITACHI (HIGH-PRECISION SHINOBI IN SUSANOO CORE)
        // -------------------------------------------------------------------------
        const itY = 8 + animY;

        // Glowing Chakra Pedestal beneath Itachi
        alphaBox(11, itY + 22, 10, 2, S_DARK, 0.9);
        alphaBox(12, itY + 22, 8, 1, S_GOLD, 1);

        // Low Ponytail behind
        box(15, itY + 6, 2, 7, I_HAIR);
        box(15, itY + 6, 2, 1, I_HEADBAND); // Hair tie

        // Hair - Top Volume & Texture
        box(13, itY - 1, 6, 2, I_HAIR);
        dot(14, itY - 1, I_HAIR_HL);
        dot(17, itY - 1, I_HAIR_HL);

        // Signature Long Bangs framing face softly
        dot(13, itY, I_HAIR);
        box(12, itY + 1, 1, 6, I_HAIR); // Left tapered long bang
        dot(13, itY + 3, I_HAIR);
        dot(18, itY, I_HAIR);
        box(19, itY + 1, 1, 6, I_HAIR); // Right tapered long bang
        dot(18, itY + 3, I_HAIR);

        // Konoha Headband (Rogue Shinobi Protector)
        box(13, itY + 1, 6, 2, I_HEADBAND);
        box(14, itY + 1, 4, 1, 0xdfe6e9); // Polished metal top shine
        box(14, itY + 2, 4, 1, I_METAL);   // Metal plate base
        dot(15, itY + 2, 0x111111);        // Rogue horizontal scratch
        dot(16, itY + 1, 0x111111);

        // Refined Anime Face (Pale Porcelain Skin)
        box(13, itY + 3, 6, 3, I_SKIN);
        box(14, itY + 6, 4, 1, I_SKIN);    // Tapered jawline
        dot(15, itY + 7, 0xefcaa8);        // Subtle chin point
        dot(16, itY + 7, 0xefcaa8);
        dot(13, itY + 5, I_SKIN_SHADOW);   // Left cheek shadow
        dot(18, itY + 5, I_SKIN_SHADOW);   // Right cheek shadow

        // Eyebrows & Upper Eyelashes
        dot(14, itY + 3, 0x111111);
        dot(17, itY + 3, 0x111111);

        // Mangekyo Sharingan (Glowing Crimson Eyes)
        dot(14, itY + 4, I_SHARINGAN);
        dot(17, itY + 4, I_SHARINGAN);
        // Nose bridge (clean skin center at x:15, 16)

        // Signature Tear Troughs (Delicate, authentic anime facial lines)
        dot(14, itY + 5, 0xc28d70);
        dot(15, itY + 6, 0xd49f82);
        dot(17, itY + 5, 0xc28d70);
        dot(16, itY + 6, 0xd49f82);

        // Calm, Stoic Mouth
        dot(15, itY + 6, 0xd49f82);

        // High Flared Akatsuki Collar (Framing the neck with crimson lining)
        box(11, itY + 6, 2, 3, I_CLOAK);
        dot(12, itY + 7, I_COLLAR_RED);
        box(19, itY + 6, 2, 3, I_CLOAK);
        dot(19, itY + 7, I_COLLAR_RED);
        // Exposed Throat & Collarbone in V-opening
        dot(15, itY + 8, I_SKIN);
        dot(16, itY + 8, I_SKIN);

        // Akatsuki Cloak Body
        box(12, itY + 9, 8, 8, I_CLOAK);
        box(12, itY + 9, 1, 8, I_CLOAK_DARK);
        box(19, itY + 9, 1, 8, I_CLOAK_DARK);
        box(15, itY + 9, 1, 8, 0x0a0a0a); // Cloak center crease

        // Akatsuki Red Cloud (Curled crimson cloud with white accent crests)
        box(14, itY + 11, 4, 3, I_CLOUD_RED);
        box(13, itY + 12, 2, 2, I_CLOUD_RED);
        dot(14, itY + 10, I_CLOUD_RED);
        dot(14, itY + 10, I_CLOUD_WHITE);
        dot(13, itY + 12, I_CLOUD_WHITE);
        dot(17, itY + 13, I_CLOUD_WHITE);
        // Lower cloud
        box(16, itY + 15, 3, 2, I_CLOUD_RED);
        dot(16, itY + 15, I_CLOUD_WHITE);

        // Left & Right Arms & Sleeves
        box(10, itY + 9, 2, 6, I_CLOAK);
        dot(10, itY + 14, I_CLOAK_DARK);
        dot(11, itY + 15, I_SKIN);
        dot(11, itY + 15, I_RING);        // Purple ring / polish

        box(20, itY + 9, 2, 6, I_CLOAK);
        dot(21, itY + 14, I_CLOAK_DARK);
        dot(20, itY + 15, I_SKIN);
        dot(20, itY + 15, I_RING);        // Purple ring / polish

        // Shinobi Pants, Bandage Wraps, and Sandals
        box(13, itY + 17, 2, 2, I_PANTS);
        box(17, itY + 17, 2, 2, I_PANTS);
        box(13, itY + 19, 2, 2, I_WRAP);
        box(17, itY + 19, 2, 2, I_WRAP);
        box(13, itY + 21, 3, 1, I_CLOAK);
        box(17, itY + 21, 3, 1, I_CLOAK);
        dot(14, itY + 21, I_SKIN);
        dot(18, itY + 21, I_SKIN);

        // -------------------------------------------------------------------------
        // 5. SACRED WEAPONS: TOTSUKA BLADE & YATA MIRROR (CLEAN SWORD COMBAT)
        // -------------------------------------------------------------------------
        if (isDefend) {
          // =======================================================================
          // DEFEND POSE: YATA MIRROR POSITIONED DIRECTLY IN FRONT OF SUSANOO
          // =======================================================================
          // Left Arm brought forward gripping the giant divine shield
          alphaBox(1, 6 + animY, 7, 12, S_MID, 0.95);
          alphaBox(4, 9 + animY, 6, 8, S_BRIGHT, 1);

          // Right Arm in guard stance holding Totsuka behind shield
          alphaBox(22, 6 + animY, 7, 12, S_MID, 0.9);
          alphaBox(24, 10 + animY, 5, 8, S_BRIGHT, 0.95);
          
          // Sake Gourd behind defense
          const gX = 25;
          const gY = 16 + animY;
          alphaBox(gX + 1, gY - 3, 4, 3, GOURD_GOLD, 1);
          alphaBox(gX, gY, 6, 4, GOURD_BODY, 1);
          alphaBox(gX - 1, gY + 4, 8, 6, GOURD_BODY, 1);

          // Totsuka blade held upright behind defense
          alphaBox(28, -6 + animY, 3, 20, S_HOT, 0.9);
          alphaBox(29, -4 + animY, 1, 16, S_WHITE, 1);

          // GIANT YATA MIRROR DEFENSIVE SHIELD (CENTER FRONT)
          const ymX = 5;
          const ymY = 5 + animY;

          // Divine outward radiating holy flame aura
          alphaBox(ymX - 4, ymY - 3, 30, 28, YATA_FIRE, 0.4);
          alphaBox(ymX - 2, ymY - 1, 26, 24, S_GOLD, 0.6);

          // Octagonal Heavy Armor Outer Border
          alphaBox(ymX + 3, ymY, 16, 22, YATA_DARK, 0.98);
          alphaBox(ymX, ymY + 3, 22, 16, YATA_DARK, 0.98);
          alphaBox(ymX + 2, ymY + 2, 18, 18, YATA_DARK, 0.98);

          // Golden Sacred Frame
          alphaBox(ymX + 4, ymY + 2, 14, 18, YATA_GOLD, 1);
          alphaBox(ymX + 2, ymY + 4, 18, 14, YATA_GOLD, 1);
          alphaBox(ymX + 3, ymY + 3, 16, 16, YATA_GOLD, 1);

          // Sacred Inner Carmine Face
          alphaBox(ymX + 4, ymY + 4, 14, 14, S_MID, 1);
          alphaBox(ymX + 5, ymY + 5, 12, 12, YATA_FIRE, 1);

          // Sacred Swirling Mandala Spiral
          alphaBox(ymX + 6, ymY + 6, 10, 10, YATA_SWIRL, 1);
          alphaBox(ymX + 7, ymY + 7, 8, 8, S_HOT, 1);

          // Sacred White Core
          alphaBox(ymX + 9, ymY + 9, 4, 4, YATA_CORE, 1);
          alphaBox(ymX + 10, ymY + 10, 2, 2, 0xffffff, 1);

        } else if (isAttack) {
          // =======================================================================
          // ATTACK POSE: STANDARD FORWARD ONE-HANDED TOTSUKA SWORD SLASH
          // (Matching the clean sword animation style of Leonardo and Cyberninja)
          // =======================================================================
          // Left arm held back guarding with Yata Mirror
          alphaBox(1, 10 + animY, 5, 8, S_MID, 0.9);
          alphaBox(0, 13 + animY, 4, 6, S_DARK, 0.95);

          // Yata Mirror on left flank
          const ymX = -4;
          const ymY = 8 + animY;
          alphaBox(ymX, ymY, 10, 14, YATA_DARK, 0.95);
          alphaBox(ymX + 1, ymY + 1, 8, 12, S_MID, 0.95);
          alphaBox(ymX + 2, ymY + 2, 6, 10, YATA_GOLD, 1);
          alphaBox(ymX + 3, ymY + 4, 4, 6, YATA_SWIRL, 1);

          // Sake Gourd attached cleanly at waist/hip
          const gX = 20;
          const gY = 17 + animY;
          alphaBox(gX + 1, gY - 2, 3, 2, GOURD_GOLD, 1);
          alphaBox(gX, gY, 5, 4, GOURD_BODY, 1);
          alphaBox(gX + 1, gY + 1, 3, 2, GOURD_LIGHT, 1);

          if (f === 8) {
            // ---------------------------------------------------------------------
            // FRAME 8: FORWARD SWORD SLASH (WINDUP / STRIKE STEP 1)
            // ---------------------------------------------------------------------
            // Right arm stretching forward with sword
            alphaBox(20, 13, 5, 4, S_DARK, 0.95); // Shoulder
            alphaBox(23, 14, 4, 3, S_MID, 0.95);   // Upper arm
            alphaBox(26, 14, 3, 3, S_BRIGHT, 1);  // Forearm/wrist
            alphaBox(28, 14, 3, 3, S_GOLD, 1);    // Giant fist holding sword

            // Totsuka Katana (One-Handed Forward Slash)
            alphaBox(27, 15, 2, 1, GOURD_BODY, 1); // Hilt pommel
            alphaBox(30, 11, 2, 8, S_DARK, 1);     // Crossguard (Tsuba)
            alphaBox(30, 12, 2, 6, S_GOLD, 1);     // Guard golden core

            // Ethereal Flame Katana Blade (Horizontal Forward Strike)
            alphaBox(32, 13, 16, 4, S_MID, 0.35);  // Subtle flame aura
            alphaBox(32, 14, 16, 2, S_HOT, 1);     // Blazing blade body
            alphaBox(32, 14, 16, 1, 0xffffff, 1);  // Razor top shine edge
            alphaBox(32, 15, 16, 1, S_BRIGHT, 1);  // Bottom flame edge
            alphaBox(48, 14, 2, 1, 0xffffff, 1);   // Sharp blade tip
            dot(48, 15, S_HOT);

          } else {
            // ---------------------------------------------------------------------
            // FRAME 9: FULL EXTENDED FORWARD SWORD SLASH (STRIKE STEP 2)
            // ---------------------------------------------------------------------
            // Right arm fully extended forward
            alphaBox(21, 13, 5, 4, S_DARK, 0.95); // Shoulder
            alphaBox(25, 14, 4, 3, S_MID, 1);      // Upper arm
            alphaBox(28, 14, 3, 3, S_BRIGHT, 1);  // Forearm
            alphaBox(30, 14, 3, 3, S_GOLD, 1);    // Fist holding sword

            // Totsuka Katana (Extended Reach Slash)
            alphaBox(29, 15, 2, 1, GOURD_BODY, 1); // Hilt
            alphaBox(32, 11, 2, 8, S_DARK, 1);     // Guard
            alphaBox(32, 12, 2, 6, S_GOLD, 1);     // Guard core

            // Extended Ethereal Flame Katana Blade
            alphaBox(34, 13, 19, 4, S_MID, 0.35);  // Flame aura
            alphaBox(34, 14, 19, 2, S_HOT, 1);     // Blazing blade body
            alphaBox(34, 14, 19, 1, 0xffffff, 1);  // Razor top shine edge
            alphaBox(34, 15, 19, 1, S_BRIGHT, 1);  // Bottom edge
            alphaBox(53, 14, 2, 1, 0xffffff, 1);   // Extended sharp tip
            dot(53, 15, S_HOT);
          }

        } else {
          // =======================================================================
          // IDLE / WALK / CHARGE: UPRIGHT COMBAT SWORD STANCE & YATA MIRROR
          // =======================================================================
          // Left Arm (Bearing Yata Mirror)
          alphaBox(1, 7 + animY, 6, 12, S_MID, 0.9);
          alphaBox(0, 11 + animY, 5, 8, S_BRIGHT, 0.95);

          // YATA MIRROR (Divine Shield at Left Flank)
          const ymX = -4;
          const ymY = 8 + animY;
          alphaBox(ymX - 2, ymY - 2, 15, 19, YATA_FIRE, 0.7);
          alphaBox(ymX - 1, ymY - 1, 13, 17, S_GOLD, 0.85);
          alphaBox(ymX, ymY, 11, 15, YATA_DARK, 0.95);
          alphaBox(ymX + 1, ymY + 1, 9, 13, S_MID, 0.95);
          alphaBox(ymX + 2, ymY + 2, 7, 11, YATA_GOLD, 1);
          alphaBox(ymX + 3, ymY + 4, 5, 7, YATA_SWIRL, 1);
          alphaBox(ymX + 4, ymY + 5, 3, 5, YATA_CORE, 1);
          alphaBox(ymX - 3, ymY + 4, 2, 5, S_HOT, 0.9);
          alphaBox(ymX + 10, ymY + 2, 2, 5, S_HOT, 0.9);

          // Right Arm (Arm at rest holding Totsuka katana)
          alphaBox(23, 7 + animY, 5, 8, S_MID, 0.95);
          alphaBox(25, 12 + animY, 4, 5, S_BRIGHT, 1);
          alphaBox(26, 14 + animY, 3, 3, S_GOLD, 1); // Hand holding hilt

          // Sake Gourd attached beside hip
          const gX = 25;
          const gY = 17 + animY;
          alphaBox(gX + 1, gY - 3, 4, 3, GOURD_GOLD, 1);
          alphaBox(gX, gY, 6, 4, GOURD_BODY, 1);
          alphaBox(gX + 1, gY + 1, 4, 2, GOURD_LIGHT, 1);
          alphaBox(gX, gY + 3, 6, 2, GOURD_GOLD, 1);
          alphaBox(gX - 1, gY + 5, 8, 6, GOURD_BODY, 1);
          alphaBox(gX, gY + 6, 6, 4, GOURD_LIGHT, 1);

          // TOTSUKA BLADE (Held Upright in Right Hand)
          const swX = 26;
          const swY = -12 + animY;
          // Guard
          alphaBox(swX - 1, swY + 24, 6, 2, S_GOLD, 1);
          alphaBox(swX, swY + 24, 4, 2, S_DARK, 1);
          // Blade aura
          alphaBox(swX - 2, swY - 2, 7, 26, S_MID, 0.4);
          // Blade body
          alphaBox(swX, swY, 3, 24, S_HOT, 0.98);
          alphaBox(swX, swY, 1, 24, 0xffffff, 1); // Center spine shine
          alphaBox(swX + 2, swY, 1, 24, S_BRIGHT, 0.95);
          // Upright Sharp Tip
          alphaBox(swX, swY - 2, 2, 2, 0xffffff, 1);
          dot(swX + 1, swY - 3, 0xffffff);
        }

        // -------------------------------------------------------------------------
        // 6. FRONT LAYER: SAMURAI WAIST ARMOR & ACCENTS
        // -------------------------------------------------------------------------
        // Heavy Armored Samurai Waist & Chakra Swirl Skirt (Base Foundation)
        alphaBox(5, 25 + animY, 22, 7, S_DARK, 0.9);
        alphaBox(6, 26 + animY, 20, 5, S_MID, 0.95);
        alphaBox(7, 27 + animY, 18, 3, S_BRIGHT, 0.95);
        alphaBox(10, 28 + animY, 12, 1, S_HOT, 1);

      } else {
        // =========================================================================
        // BASE ITACHI UCHIHA (AKATSUKI CLOAK & SHARINGAN) - HIGH DETAIL
        // =========================================================================
        const SKIN = 0xffddbb;
        const SKIN_SHADOW = 0xcc9977;
        const HAIR = 0x111111;
        const HAIR_HL = 0x2d3436;
        const CLOAK = 0x141414;
        const CLOAK_SHADOW = 0x080808;
        const RED_COLLAR = 0x850000;
        const RED_CLOUD = 0xd63031;
        const CLOUD_WHITE = 0xffffff;
        const SHARINGAN = 0xff0000;
        const NAIL_PURPLE = 0x8e44ad;
        const TEAR_LINE = 0x3d3d3d;
        const HEADBAND = 0x2d3436;
        const METAL = 0xb2bec3;

        // Ponytail (Behind body)
        box(14, 8, 4, 10, HAIR);
        box(14, 8, 4, 1, HEADBAND); // Hair tie

        // Legs (Shinobi pants)
        box(12, 22, 3, 6, 0x1e272e);
        box(17, 22, 3, 6, 0x1e272e);
        // Leg wraps
        box(12, 25, 3, 3, 0xd2dae2);
        box(17, 25, 3, 3, 0xd2dae2);
        // Sandals
        box(11, 28, 4, 4, 0x111111);
        box(17, 28, 4, 4, 0x111111);
        box(11, 28, 2, 2, SKIN);
        box(17, 28, 2, 2, SKIN); // Toes

        // Torso (Akatsuki Cloak)
        box(9, 14, 14, 11, CLOAK);
        box(9, 14, 2, 11, CLOAK_SHADOW);
        box(21, 14, 2, 11, CLOAK_SHADOW);

        // Akatsuki Red Clouds (with white accent)
        box(11, 17, 5, 3, RED_CLOUD);
        box(12, 16, 3, 1, RED_CLOUD);
        dot(11, 17, CLOUD_WHITE);
        dot(15, 19, CLOUD_WHITE);

        box(17, 21, 4, 2, RED_CLOUD);
        box(18, 20, 2, 1, RED_CLOUD);
        dot(17, 21, CLOUD_WHITE);

        // Arms & Weapon Slash
        if (isAttack) {
          // Left arm held back for balance
          box(6, 14, 3, 5, CLOAK);
          box(5, 18, 3, 3, CLOAK_SHADOW);

          // Right arm - one-handed katana / tanto slash
          box(20, 13, 4, 4, CLOAK);
          box(23, 14, 4, 3, CLOAK);
          box(26, 14, 3, 3, SKIN);
          box(28, 14, 1, 1, NAIL_PURPLE);

          // Shinobi Katana / Tanto Sword
          box(27, 15, 2, 1, 0x2d3436); // Hilt
          box(29, 12, 1, 7, 0x111111); // Tsuba (Guard)
          box(30, 14, 16, 2, METAL);   // Katana Blade
          box(30, 14, 16, 1, 0xffffff); // Top shine edge
          box(30, 15, 16, 1, 0x7f8c8d); // Blade bottom shadow
          box(46, 14, 2, 1, 0xffffff); // Sharp tip
        } else {
          const armY = f % 2 === 0 ? 14 : 15;
          box(6, armY, 4, 9, CLOAK);
          box(22, armY, 4, 9, CLOAK);
          // Hands with purple polish
          box(7, armY + 9, 2, 2, SKIN);
          box(23, armY + 9, 2, 2, SKIN);
          box(7, armY + 10, 1, 1, NAIL_PURPLE);
          box(23, armY + 10, 1, 1, NAIL_PURPLE);
        }

        // High Flared Collar & Neckline
        box(9, 10, 14, 5, CLOAK);
        box(10, 10, 12, 2, RED_COLLAR); // Crimson inside lining
        box(14, 11, 4, 3, SKIN);        // Exposed V-neck / throat
        dot(15, 12, SKIN_SHADOW);

        // Head
        headBox(12, 4, 8, 7, SKIN);
        headBox(12, 4, 1, 7, SKIN_SHADOW);
        headBox(19, 4, 1, 7, SKIN_SHADOW);
        headBox(14, 10, 4, 1, SKIN); // Chin

        // Hair (Center-parted raven hair)
        box(11, 2, 10, 3, HAIR);
        box(10, 4, 2, 8, HAIR); // Left tapered bang
        box(20, 4, 2, 8, HAIR); // Right tapered bang
        dot(15, 2, HAIR_HL);
        dot(16, 2, HAIR_HL);

        // Headband (Scratched Rogue Leaf)
        box(12, 5, 8, 2, HEADBAND);
        box(14, 5, 4, 1, 0xecf0f1); // Silver top shine
        box(14, 6, 4, 1, METAL);    // Metal plate base
        box(15, 5, 2, 2, 0x111111); // Rogue Leaf Scratch

        // Eyes (Sharingan)
        dot(13, 7, 0x111111); // Lash
        dot(17, 7, 0x111111);
        box(13, 8, 2, 1, SHARINGAN);
        box(17, 8, 2, 1, SHARINGAN);
        dot(13, 8, 0x111111); // Pupil
        dot(17, 8, 0x111111);

        // Tear troughs (Signature soft lines under eyes)
        dot(13, 9, 0xb8896a);
        dot(14, 10, 0xcfa386);
        dot(18, 9, 0xb8896a);
        dot(17, 10, 0xcfa386);

        // Stoic subtle mouth
        dot(15, 9, 0xcfa386);
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
