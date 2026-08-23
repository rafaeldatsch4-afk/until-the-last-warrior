import Phaser from "phaser";

export function generateVegetaSprite(scene: Phaser.Scene) {
  const generateForm = (form: number) => {
    const key = "vegeta";
    const isTransformed = form > 0;
    const isUltra = form === 2; // Ultra Ego / Form 2
    const SCALE = 2;
    const FRAME_WIDTH = 96;
    const FRAME_HEIGHT = 64; 
    const DRAW_OFFSET_Y = 32; 
    const FRAMES = 12;

    const sheetWidth = FRAME_WIDTH * SCALE * FRAMES;
    const sheetHeight = FRAME_HEIGHT * SCALE;

    const canvas = scene.make.graphics({ x: 0, y: 0 });
    const shiftX = 32;

    for (let f = 0; f < FRAMES; f++) {
      const offsetX = f * FRAME_WIDTH;

      const isWalk = f >= 4 && f <= 7;
      const isAttack = f === 8 || f === 9;
      const isDefend = f === 10;
      const isCharge = f === 11;

      const breatheOffset =
        !isAttack && !isDefend && !isCharge && !isWalk && (f === 1 || f === 3)
          ? 1
          : 0;

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
        const isLeftLeg = x < 16;
        const wIndex = f - 4;
        let ox = 0,
          oy = 0;
        if (isLeftLeg) {
          if (wIndex === 0) {
            ox = 1;
            oy = -1;
          } else if (wIndex === 1) {
            ox = 2;
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
            ox = -3;
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
        const { ox, oy } = getWalkOffsets(x, y);
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) +
          shiftX +
          ox;
        const finalYPose =
          (isAttack || isDefend || isCharge
            ? finalY + poseOffsetY / 2
            : finalY) + oy;

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
        const { ox, oy } = getWalkOffsets(x, y);
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) +
          shiftX +
          ox;
        const finalYPose =
          (isAttack || isDefend || isCharge
            ? finalY + poseOffsetY / 2
            : finalY) + oy;

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
        const { ox, oy } = getWalkOffsets(x, y);
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) +
          shiftX +
          ox;
        const finalYPose =
          (isAttack || isDefend || isCharge
            ? finalY + poseOffsetY / 2
            : finalY) + oy;

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
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX;
        const finalYPose =
          (isAttack || isDefend || isCharge ? y + poseOffsetY / 2 : y) +
          breatheOffset;

        canvas.fillStyle(color, 1);
        canvas.fillRect(
          (offsetX + finalX) * SCALE,
          (finalYPose + DRAW_OFFSET_Y) * SCALE,
          w * SCALE,
          h * SCALE,
        );
      };

      const headDot = (x: number, y: number, color: number) => {
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX;
        const finalYPose =
          (isAttack || isDefend || isCharge ? y + poseOffsetY / 2 : y) +
          breatheOffset;

        canvas.fillStyle(color, 1);
        canvas.fillRect(
          (offsetX + finalX) * SCALE,
          (finalYPose + DRAW_OFFSET_Y) * SCALE,
          SCALE,
          SCALE,
        );
      };

      // --- COLOR PALETTE (2D Fighting game / Power Warriors standard) ---
      const SUIT_MAIN = 0x1d3570;     // Royal Navy Saiyan suit
      const SUIT_SHADOW = 0x0f1c3d;   // Deep navy shadow
      const SUIT_LIGHT = 0x2e4ea0;    // Highlight on muscle folds

      const ARMOR_WHITE = 0xf5f7fb;   // Chestplate white
      const ARMOR_SHADOW = 0xb0bdd1;  // Plate shadow
      const ARMOR_DARK = 0x7788a3;    // Dark grooves / segments
      const STRAP_BROWN = 0x5a3d28;   // Shoulder joint under-armor

      const GOLD_MAIN = 0xf59e0b;     // Armor shoulder & chest gold straps
      const GOLD_LIGHT = 0xfde047;    // Gold highlights
      const GOLD_SHADOW = 0xb45309;   // Gold shading

      const GLOVE_WHITE = 0xffffff;
      const GLOVE_SHADOW = 0x94a3b8;
      const GLOVE_DARK = 0x64748b;

      const SKIN_MAIN = 0xf7be94;     // Anime Saiyan skin tone
      const SKIN_SHADOW = 0xd98e66;   // Warm shadow
      const SKIN_DARK = 0xb06542;     // Deep contour shadow

      const HAIR_BASE_BLACK = 0x111317;  // Jet Black Base Hair
      const HAIR_BASE_SHINE = 0x2c3340;  // Blue-slate hair shine / spike highlights
      const HAIR_BASE_MID = 0x1e232d;

      // SSJ Palette (Golden flame)
      const HAIR_SSJ_MAIN = 0xfacc15;
      const HAIR_SSJ_LIGHT = 0xfef08a;
      const HAIR_SSJ_SHADOW = 0xca8a04;
      const EYE_SSJ_TEAL = 0x22d3ee;

      // Ultra Ego Palette (Fierce Magenta / Purple)
      const HAIR_UE_MAIN = 0xa855f7;
      const HAIR_UE_LIGHT = 0xe879f9;
      const HAIR_UE_SHADOW = 0x7e22ce;
      const EYE_UE_PURPLE = 0xf43f5e;

      let hairColor = HAIR_BASE_BLACK;
      let hairLight = HAIR_BASE_SHINE;
      let hairShadow = HAIR_BASE_MID;
      let eyeColor = 0x0f172a;
      let eyebrowColor = HAIR_BASE_BLACK;

      if (isUltra) {
        hairColor = HAIR_UE_MAIN;
        hairLight = HAIR_UE_LIGHT;
        hairShadow = HAIR_UE_SHADOW;
        eyeColor = EYE_UE_PURPLE;
        eyebrowColor = HAIR_UE_SHADOW;
      } else if (isTransformed) {
        hairColor = HAIR_SSJ_MAIN;
        hairLight = HAIR_SSJ_LIGHT;
        hairShadow = HAIR_SSJ_SHADOW;
        eyeColor = EYE_SSJ_TEAL;
        eyebrowColor = HAIR_SSJ_SHADOW;
      }

      // ==========================================
      // 1. LEGS & BOOTS (Saiyan Spandex & Combat Boots)
      // ==========================================
      // Pelvis / Crotch
      box(12, 22, 8, 2, SUIT_MAIN);
      box(14, 22, 4, 2, SUIT_SHADOW);

      // Left Leg (x: 10 to 14)
      box(10, 23, 5, 6, SUIT_MAIN);
      box(10, 23, 1, 6, SUIT_SHADOW); // Outer edge shadow
      box(14, 23, 1, 6, SUIT_SHADOW); // Inner thigh shadow
      box(11, 24, 2, 2, SUIT_LIGHT);  // Thigh muscle highlight
      box(11, 27, 3, 1, SUIT_SHADOW); // Knee crease

      // Right Leg (x: 17 to 21)
      box(17, 23, 5, 6, SUIT_MAIN);
      box(17, 23, 1, 6, SUIT_SHADOW); // Inner thigh shadow
      box(21, 23, 1, 6, SUIT_SHADOW); // Outer edge shadow
      box(18, 24, 2, 2, SUIT_LIGHT);  // Thigh muscle highlight
      box(18, 27, 3, 1, SUIT_SHADOW); // Knee crease

      // Classic Saiyan Boots (White calf with ribbing, gold toe tips)
      // Left Boot
      box(10, 29, 5, 4, GLOVE_WHITE);
      box(10, 29, 1, 4, GLOVE_SHADOW);
      box(11, 30, 4, 1, GLOVE_SHADOW); // Horizontal segment rib
      box(11, 32, 4, 1, GLOVE_SHADOW); // Lower segment rib
      box(9, 33, 6, 2, GLOVE_WHITE);   // Boot sole / foot
      box(9, 33, 1, 2, GLOVE_SHADOW);
      // Gold toe tip
      box(9, 33, 2, 2, GOLD_MAIN);
      dot(9, 33, GOLD_LIGHT);
      dot(9, 34, GOLD_SHADOW);

      // Right Boot
      box(17, 29, 5, 4, GLOVE_WHITE);
      box(21, 29, 1, 4, GLOVE_SHADOW);
      box(17, 30, 4, 1, GLOVE_SHADOW); // Horizontal segment rib
      box(17, 32, 4, 1, GLOVE_SHADOW); // Lower segment rib
      box(17, 33, 6, 2, GLOVE_WHITE);  // Boot sole / foot
      box(22, 33, 1, 2, GLOVE_SHADOW);
      // Gold toe tip
      box(21, 33, 2, 2, GOLD_MAIN);
      dot(21, 33, GOLD_LIGHT);
      dot(22, 34, GOLD_SHADOW);

      // ==========================================
      // 2. TORSO & SAIYAN BATTLE ARMOR
      // ==========================================
      // Dark under-suit waistband
      box(11, 19, 10, 3, SUIT_MAIN);
      box(11, 20, 1, 2, SUIT_SHADOW);
      box(20, 20, 1, 2, SUIT_SHADOW);
      box(13, 20, 6, 1, SUIT_LIGHT);

      // Chestplate Base (White)
      box(11, 13, 10, 7, ARMOR_WHITE);
      box(11, 13, 1, 7, ARMOR_SHADOW); // Left side shadow
      box(20, 13, 1, 7, ARMOR_SHADOW); // Right side shadow
      box(11, 19, 10, 1, ARMOR_SHADOW); // Bottom edge shadow

      // Center Abdominal Ribbed Plates (Dark grooves)
      box(14, 16, 4, 3, ARMOR_SHADOW);
      dot(15, 17, ARMOR_DARK);
      dot(16, 17, ARMOR_DARK);
      dot(15, 18, ARMOR_DARK);
      dot(16, 18, ARMOR_DARK);

      // Pectoral Plates (Upper chest sculpt)
      box(12, 14, 3, 2, 0xffffff);
      box(17, 14, 3, 2, 0xffffff);
      dot(15, 14, ARMOR_DARK); // Cleavage line
      dot(16, 14, ARMOR_DARK);

      // Yellow/Gold Chest Straps
      box(11, 13, 2, 6, GOLD_MAIN);
      box(19, 13, 2, 6, GOLD_MAIN);
      dot(11, 13, GOLD_LIGHT);
      dot(19, 13, GOLD_LIGHT);
      box(11, 14, 1, 5, GOLD_SHADOW);
      box(20, 14, 1, 5, GOLD_SHADOW);

      // Neck & Saiyan collarbone
      box(14, 11, 4, 2, SKIN_MAIN);
      box(14, 12, 4, 1, SKIN_SHADOW);

      // ==========================================
      // 3. SHOULDER GUARDS (Signature Saiyan Armor)
      // ==========================================
      // Flared, sleek Saiyan shoulder pads with gold rims
      // Left Shoulder Guard (x: 5 to 10)
      box(6, 11, 5, 2, GOLD_MAIN);
      box(7, 11, 3, 1, GOLD_LIGHT);
      box(5, 12, 6, 2, ARMOR_WHITE);
      box(5, 12, 1, 2, GOLD_MAIN);     // Gold edge
      box(5, 13, 6, 1, ARMOR_SHADOW);
      dot(6, 14, STRAP_BROWN);

      // Right Shoulder Guard (x: 21 to 26)
      box(21, 11, 5, 2, GOLD_MAIN);
      box(22, 11, 3, 1, GOLD_LIGHT);
      box(21, 12, 6, 2, ARMOR_WHITE);
      box(26, 12, 1, 2, GOLD_MAIN);    // Gold edge
      box(21, 13, 6, 1, ARMOR_SHADOW);
      dot(25, 14, STRAP_BROWN);

      // ==========================================
      // 4. ARMS & WHITE GLOVES
      // ==========================================
      if (isAttack) {
        // Right punching arm extended forward
        box(21, 13, 5, 4, SUIT_MAIN);
        box(22, 13, 4, 1, SUIT_LIGHT);
        box(22, 16, 4, 1, SUIT_SHADOW);
        box(26, 14, 4, 3, SUIT_MAIN);

        // White Glove & Punching Fist
        box(29, 13, 3, 5, GLOVE_WHITE);
        box(29, 13, 1, 5, GLOVE_SHADOW);
        box(32, 13, 4, 4, GLOVE_WHITE);
        box(32, 13, 2, 2, 0xffffff);     // Highlight
        box(34, 14, 2, 3, GLOVE_SHADOW);  // Knuckles shadow
        alphaBox(35, 13, 4, 4, GLOVE_WHITE, 0.4); // Speed trail

        // Left arm pulled back in guard
        box(6, 14, 4, 4, SUIT_MAIN);
        box(6, 14, 1, 4, SUIT_SHADOW);
        box(5, 17, 5, 3, GLOVE_WHITE);
        box(5, 19, 5, 1, GLOVE_SHADOW);
      } else if (isCharge) {
        // Final Flash / Galick Gun Charge Pose (arms raised / charging)
        // Left arm raised
        box(7, 4, 4, 8, SUIT_MAIN);
        box(7, 4, 1, 8, SUIT_SHADOW);
        box(7, 4, 4, 3, GLOVE_WHITE);
        box(7, 2, 4, 3, GLOVE_WHITE);
        dot(8, 2, GLOVE_SHADOW);

        // Right arm raised
        box(21, 4, 4, 8, SUIT_MAIN);
        box(24, 4, 1, 8, SUIT_SHADOW);
        box(21, 4, 4, 3, GLOVE_WHITE);
        box(21, 2, 4, 3, GLOVE_WHITE);
        dot(23, 2, GLOVE_SHADOW);

        // Energy spark between palms
        if (f % 2 === 0) {
          alphaBox(13, 0, 6, 6, isTransformed ? 0xfef08a : 0xa855f7, 0.7);
          dot(15, 2, 0xffffff);
          dot(16, 3, 0xffffff);
        }
      } else if (isDefend) {
        // Crossed arms block
        box(9, 13, 14, 6, SUIT_MAIN);
        box(10, 14, 6, 4, GLOVE_WHITE);
        box(16, 14, 6, 4, GLOVE_WHITE);
        box(10, 17, 12, 1, GLOVE_SHADOW);
      } else {
        // Idle / Walking natural combat stance (hands slightly balled, white gloves)
        // Left Arm
        box(7, 14, 4, 5, SUIT_MAIN);
        box(7, 14, 1, 5, SUIT_SHADOW);
        box(8, 15, 2, 2, SUIT_LIGHT);

        // Left Glove
        box(7, 19, 4, 2, GLOVE_WHITE);   // Glove wrist flare
        box(7, 20, 4, 1, GLOVE_SHADOW);
        box(7, 21, 4, 3, GLOVE_WHITE);   // Fist
        box(7, 23, 4, 1, GLOVE_SHADOW);
        dot(8, 22, GLOVE_SHADOW);        // Finger line

        // Right Arm
        box(21, 14, 4, 5, SUIT_MAIN);
        box(24, 14, 1, 5, SUIT_SHADOW);
        box(22, 15, 2, 2, SUIT_LIGHT);

        // Right Glove
        box(21, 19, 4, 2, GLOVE_WHITE);  // Glove wrist flare
        box(21, 20, 4, 1, GLOVE_SHADOW);
        box(21, 21, 4, 3, GLOVE_WHITE);  // Fist
        box(21, 23, 4, 1, GLOVE_SHADOW);
        dot(23, 22, GLOVE_SHADOW);       // Finger line
      }

      // ==========================================
      // 5. HEAD & FACIAL FEATURES (Vegeta iconic scowl)
      // ==========================================
      // Head base (Jawline & Cheeks)
      headBox(12, 4, 8, 7, SKIN_MAIN);
      headBox(13, 10, 6, 2, SKIN_MAIN); // Chin / Jaw taper
      headBox(14, 11, 4, 1, SKIN_SHADOW); // Under-chin shadow

      // Saiyan Ears
      headDot(11, 7, SKIN_MAIN);
      headDot(11, 8, SKIN_SHADOW);
      headDot(20, 7, SKIN_MAIN);
      headDot(20, 8, SKIN_SHADOW);

      // Vegeta Sharp Eyes & Serious Intense Eyebrows
      // Eyebrows (Angular Saiyan arch)
      headDot(13, 6, eyebrowColor);
      headDot(14, 6, eyebrowColor);
      headDot(17, 6, eyebrowColor);
      headDot(18, 6, eyebrowColor);
      headDot(15, 7, SKIN_SHADOW); // Center brow furrow wrinkle
      headDot(16, 7, SKIN_SHADOW);

      // Eye Whites & Sharp Pupils
      headDot(13, 7, 0xffffff);
      headDot(14, 7, eyeColor);
      headDot(17, 7, 0xffffff);
      headDot(18, 7, eyeColor);

      // Saiyan Nose & Mouth
      headDot(15, 9, SKIN_DARK); // Defined nose
      if (isAttack) {
        headBox(15, 10, 2, 1, 0x450a0a); // Open shouting mouth
      } else {
        headDot(15, 10, 0x331a1a);       // Stern smirking mouth
        headDot(16, 10, 0x331a1a);
      }

      // Cheek / Jaw shading
      headDot(12, 9, SKIN_SHADOW);
      headDot(19, 9, SKIN_SHADOW);

      // ==========================================
      // 6. VEGETA'S ICONIC FLAME HAIR & WIDOW'S PEAK
      // ==========================================
      // The hair is flame-shaped, standing upright with sharp side-wings
      
      // Base / Main central flame pillar
      headBox(11, -2, 10, 6, hairColor);
      headBox(12, -7, 8, 6, hairColor);
      headBox(13, -12, 6, 6, hairColor);
      headBox(14, -17, 4, 6, hairColor);
      headBox(15, -20, 2, 4, hairColor); // Top crown peak

      // Left Spikes / Wing Spikes
      headBox(9, 0, 3, 5, hairColor);
      headBox(8, -4, 3, 5, hairColor);
      headBox(7, -8, 3, 5, hairColor);
      headBox(9, -11, 3, 4, hairColor);
      headBox(11, -14, 2, 4, hairColor);

      // Right Spikes / Wing Spikes
      headBox(20, 0, 3, 5, hairColor);
      headBox(21, -4, 3, 5, hairColor);
      headBox(22, -8, 3, 5, hairColor);
      headBox(20, -11, 3, 4, hairColor);
      headBox(19, -14, 2, 4, hairColor);

      // Hair Shading & Highlight Lines (Crisp 2D Fighting Game Strands)
      // Dark depth core
      headBox(11, -6, 2, 8, hairShadow);
      headBox(19, -6, 2, 8, hairShadow);
      headBox(14, -14, 1, 8, hairShadow);

      // Highlights / Gloss Strands
      headBox(13, -16, 1, 7, hairLight);
      headBox(17, -10, 1, 8, hairLight);
      headBox(10, -5, 1, 5, hairLight);
      headBox(21, -5, 1, 5, hairLight);
      headDot(15, -19, hairLight);

      // === PROPER WIDOW'S PEAK (Pele desenhada sobre a testa) ===
      // Creates the iconic "V" hairline without leaving a huge gap
      headBox(12, 3, 8, 2, SKIN_MAIN);
      headBox(13, 2, 6, 2, SKIN_MAIN);
      headBox(14, 1, 4, 2, SKIN_MAIN);
      headBox(15, 0, 2, 2, SKIN_MAIN);
      
      // Soft hairline border
      headDot(13, 3, SKIN_SHADOW);
      headDot(18, 3, SKIN_SHADOW);
      headDot(14, 2, SKIN_SHADOW);
      headDot(17, 2, SKIN_SHADOW);
      headDot(15, 1, SKIN_SHADOW);
      headDot(16, 1, SKIN_SHADOW);
    }

    let textureName = key;
    if (isUltra) textureName = `${key}_ui`;
    else if (isTransformed) textureName = `${key}_ssj`;

    canvas.generateTexture(textureName, sheetWidth, sheetHeight);
    canvas.destroy();

    if (scene.textures.exists(textureName)) {
      const tex = scene.textures.get(textureName);
      tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
      const fw = FRAME_WIDTH * SCALE;
      const fh = FRAME_HEIGHT * SCALE;
      for (let i = 0; i < FRAMES; i++) {
        tex.add(i.toString(), 0, i * fw, 0, fw, fh);
      }
    }
  };

  if (scene.textures.exists("vegeta")) {
    scene.textures.remove("vegeta");
  }
  if (scene.textures.exists("vegeta_ssj")) {
    scene.textures.remove("vegeta_ssj");
  }
  if (scene.textures.exists("vegeta_ui")) {
    scene.textures.remove("vegeta_ui");
  }

  generateForm(0);
  generateForm(1);
  generateForm(2);
}
