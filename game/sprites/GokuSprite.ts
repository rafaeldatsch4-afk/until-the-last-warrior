import Phaser from "phaser";

export function generateGokuSprite(scene: Phaser.Scene) {
  const generateForm = (form: number) => {
    const key = "goku";

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
        const finalYPose =
          isAttack || isDefend || isCharge ? y + poseOffsetY / 2 : y;
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
        const finalYPose =
          isAttack || isDefend || isCharge ? y + poseOffsetY / 2 : y;
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
      const OUTLINE = 0x1a0a00; // Contorno escuro

      {
        // DBZ PALETTE
        const GI_ORANGE = 0xff5a00; // Vibrant orange
        const GI_SHADOW = 0xcc3300;
        const GI_BLUE = 0x003399; // Vibrant blue
        const SASH_BLUE = 0x003399;
        const SKIN_TONE = 0xffce9e;
        const SKIN_SHADOW = 0xe0ac7d;
        const BOOT_RED = 0xd92525;
        const BOOT_ROPE = 0xeaddcf;
        const HAIR_BLACK = 0x1a1a1a;

        // SSJ PALETTE
        const HAIR_SSJ_GOLD = 0xffea00; // Vibrant gold
        const HAIR_SSJ_SHADOW = 0xd4a000;
        const HAIR_SSJ_LIGHT = 0xfff599;
        const EYE_SSJ_TEAL = 0x00f2ff;

        // ULTRA INSTINCT PALETTE
        const HAIR_UI_SILVER = 0xe0e0e0;
        const HAIR_UI_SHADOW = 0x9e9e9e;
        const HAIR_UI_LIGHT = 0xffffff;
        const EYE_UI_SILVER = 0xcccccc;

        let hairColor = HAIR_BLACK;
        let eyeColor = 0x111111;
        let eyebrowColor = HAIR_BLACK;

        if (isUI) {
          hairColor = HAIR_UI_SILVER;
          eyeColor = EYE_UI_SILVER;
          eyebrowColor = HAIR_UI_SHADOW;
        } else if (isTransformed) {
          hairColor = HAIR_SSJ_GOLD;
          eyeColor = EYE_SSJ_TEAL;
          eyebrowColor = HAIR_SSJ_SHADOW;
        }

        // ==========================================
        // OUTLINES (Desenhados primeiro, atrás de tudo)
        // ==========================================
        
        // Outlines das pernas e botas
        box(9, 22, 6, 8, OUTLINE);
        box(17, 22, 6, 8, OUTLINE);
        box(9, 28, 6, 5, OUTLINE);
        box(17, 28, 6, 5, OUTLINE);
        
        // Outline do Torso
        box(10, 13, 12, 11, OUTLINE);
        
        // Outlines dos braços
        if (isCharge) {
          box(19, 1, 5, 17, OUTLINE);
          box(8, 1, 5, 17, OUTLINE);
        } else if (isAttack) {
          box(20, 12, 16, 6, OUTLINE);
          box(5, 13, 7, 8, OUTLINE);
        } else {
          box(7, 13, 5, 13, OUTLINE);
          box(20, 13, 5, 13, OUTLINE);
        }

        // Outline da cabeça
        headBox(11, 5, 10, 9, OUTLINE); // base head
        headDot(10, 9, OUTLINE);
        headDot(21, 9, OUTLINE); // ears
        
        // Outlines básicos do cabelo
        if (isTransformed && !isUI) {
          headBox(10, -1, 12, 7, OUTLINE);
          headBox(13, -9, 5, 9, OUTLINE);
        } else if (isUI) {
          headBox(10, 0, 12, 8, OUTLINE);
          headBox(8, 1, 3, 6, OUTLINE);
          headBox(20, 1, 3, 6, OUTLINE);
        } else {
          headBox(10, 0, 12, 6, OUTLINE);
          headBox(8, -1, 4, 6, OUTLINE);
          headBox(20, 0, 4, 6, OUTLINE);
        }

        // ==========================================
        // CORPO PRINCIPAL
        // ==========================================

        // --- BODY ---
        // Legs
        box(10, 23, 4, 6, GI_ORANGE);
        box(18, 23, 4, 6, GI_ORANGE);
        box(14, 23, 4, 2, GI_ORANGE); // Crotch connection gap
        // Gi folds on legs
        box(10, 23, 1, 6, GI_SHADOW);
        box(21, 23, 1, 6, GI_SHADOW);
        box(12, 24, 1, 4, GI_SHADOW);
        box(19, 24, 1, 4, GI_SHADOW);
        // Dobras diagonais extras (Upgrade)
        box(11, 25, 2, 1, GI_SHADOW);
        box(13, 26, 1, 2, GI_SHADOW);
        box(18, 25, 2, 1, GI_SHADOW);
        box(20, 26, 1, 2, GI_SHADOW);
        
        // Boots (Classic Z style)
        box(10, 29, 4, 3, GI_BLUE);
        box(18, 29, 4, 3, GI_BLUE);
        box(10, 29, 4, 1, BOOT_ROPE);
        box(18, 29, 4, 1, BOOT_ROPE);
        box(12, 29, 1, 3, BOOT_RED);
        box(20, 29, 1, 3, BOOT_RED); // Vertical stripe
        box(10, 31, 4, 1, GI_BLUE);
        box(18, 31, 4, 1, GI_BLUE);
        // Boot shadows
        box(10, 30, 1, 2, 0x001133);
        box(18, 30, 1, 2, 0x001133);

        // Torso
        box(11, 14, 10, 9, GI_ORANGE);
        box(13, 14, 6, 4, GI_BLUE); // Undershirt
        // Undershirt shadow
        box(13, 14, 1, 4, 0x001133);
        box(18, 14, 1, 4, 0x001133);
        box(14, 14, 4, 2, SKIN_TONE); // Neck
        // Neck shadow
        box(14, 15, 4, 1, SKIN_SHADOW);
        dot(15, 16, SKIN_TONE); // V-neck dip
        // Gi folds on torso
        box(19, 17, 2, 6, GI_SHADOW); // Shading right
        box(11, 17, 1, 5, GI_SHADOW); // Shading left
        box(14, 18, 1, 4, GI_SHADOW);
        box(17, 18, 1, 4, GI_SHADOW); // Inner folds
        box(12, 19, 8, 1, GI_SHADOW); // Horizontal fold
        // Dobras diagonais extras no Torso (Upgrade)
        box(12, 16, 2, 1, GI_SHADOW);
        box(14, 17, 1, 1, GI_SHADOW);
        box(17, 16, 2, 1, GI_SHADOW);

        // Sash with knot
        box(11, 22, 10, 2, SASH_BLUE);
        // Sash shadow
        box(11, 23, 10, 1, 0x001133);
        const knotY = f % 2 === 0 ? 23 : 24;
        box(11, 23, 2, 4, SASH_BLUE);
        dot(12, 27, SASH_BLUE);
        box(11, 24, 1, 3, 0x001133); // Knot shadow

        if (!isUI) {
          // Kanji Symbol (Turtle/Kai)
          box(17, 16, 3, 3, 0xffffff);
          dot(18, 17, 0x111111);
        }

        // Arms (Wristbands)
        if (isCharge) {
          // Genki Dama charge: both arms raised straight up, spaced out to not overlap head
          // Right arm
          box(20, 4, 3, 10, SKIN_TONE);
          box(21, 8, 1, 3, SKIN_SHADOW); // Tricep shadow
          box(20, 14, 3, 3, GI_ORANGE); // shoulder
          box(20, 4, 3, 3, GI_BLUE); // wristband
          box(20, 2, 3, 3, SKIN_TONE); // fist
          // Left arm
          box(9, 4, 3, 10, SKIN_TONE);
          box(10, 8, 1, 3, SKIN_SHADOW); // Tricep shadow
          box(9, 14, 3, 3, GI_ORANGE); // shoulder
          box(9, 4, 3, 3, GI_BLUE); // wristband
          box(9, 2, 3, 3, SKIN_TONE); // fist
        } else if (isAttack) {
          // Right arm punch straight out (muscular)
          box(21, 13, 5, 4, SKIN_TONE); // bicep
          box(22, 14, 2, 1, SKIN_SHADOW); // Bicep definition (Upgrade)
          box(21, 13, 3, 4, GI_ORANGE); // shoulder/sleeve
          box(21, 13, 1, 4, GI_SHADOW);
          box(26, 14, 5, 3, SKIN_TONE); // forearm
          box(30, 14, 2, 3, GI_BLUE); // wristband
          box(31, 13, 4, 4, SKIN_TONE); // fist (larger)
          box(31, 13, 2, 2, 0xffffff); // fist highlight
          box(34, 14, 1, 2, SKIN_SHADOW); // knuckles detail
          // Motion blur for punch
          alphaBox(33, 13, 6, 4, SKIN_TONE, 0.4);
          // Left arm pulled back
          box(6, 15, 4, 5, SKIN_TONE);
          box(7, 14, 4, 3, GI_ORANGE);
          box(6, 18, 4, 2, GI_BLUE);
        } else {
          box(8, 14, 3, 4, GI_ORANGE);
          box(21, 14, 3, 4, GI_ORANGE);
          // Shoulder gi folds
          box(8, 15, 1, 3, GI_SHADOW);
          box(23, 15, 1, 3, GI_SHADOW);

          box(8, 18, 3, 3, SKIN_TONE);
          box(21, 18, 3, 3, SKIN_TONE);
          // Arm muscle shading
          box(8, 18, 1, 3, SKIN_SHADOW);
          box(23, 18, 1, 3, SKIN_SHADOW);
          box(9, 19, 1, 2, SKIN_SHADOW);
          box(22, 19, 1, 2, SKIN_SHADOW); // Bicep definition

          box(8, 20, 3, 3, GI_BLUE);
          box(21, 20, 3, 3, GI_BLUE); // Wristband
          // Wristband shadow
          box(8, 20, 1, 3, 0x001133);
          box(23, 20, 1, 3, 0x001133);

          box(8, 23, 3, 2, SKIN_TONE);
          box(21, 23, 3, 2, SKIN_TONE); // Hands
          
          // Dedos separados e detalhados nas mãos (Upgrade)
          box(8, 24, 1, 1, SKIN_TONE);
          box(9, 24, 1, 1, SKIN_SHADOW);
          box(10, 24, 1, 1, SKIN_TONE);
          
          box(21, 24, 1, 1, SKIN_TONE);
          box(22, 24, 1, 1, SKIN_SHADOW);
          box(23, 24, 1, 1, SKIN_TONE);
        }

        // Head
        // Sombra sob a franja (Upgrade)
        headBox(12, 6, 8, 1, SKIN_SHADOW);
        headBox(12, 7, 8, 6, SKIN_TONE);
        
        headDot(11, 9, SKIN_TONE);
        headDot(20, 9, SKIN_TONE); // Ears
        headDot(11, 10, SKIN_SHADOW);
        headDot(20, 10, SKIN_SHADOW); // Ear shadows
        headBox(13, 12, 6, 1, SKIN_SHADOW); // Jaw shadow

        // Face
        headDot(13, 9, WHITE);
        headDot(17, 9, WHITE);
        headDot(14, 9, eyeColor);
        headDot(18, 9, eyeColor);
        
        // Separação entre sobrancelha e cabelo para melhor legibilidade (Upgrade)
        headDot(13, 7, SKIN_TONE);
        headDot(14, 7, SKIN_TONE);
        headDot(17, 7, SKIN_TONE);
        headDot(18, 7, SKIN_TONE);
        
        headDot(13, 8, eyebrowColor);
        headDot(14, 8, eyebrowColor);
        headDot(17, 8, eyebrowColor);
        headDot(18, 8, eyebrowColor);
        
        // Angry brow furrow
        headDot(15, 8, SKIN_SHADOW);
        headDot(16, 8, SKIN_SHADOW);
        headDot(15, 11, 0xdca880); // Nose
        // Cheek lines (iconic DBZ style)
        headDot(13, 11, SKIN_SHADOW);
        headDot(18, 11, SKIN_SHADOW);

        // Subtle Expressions
        if (isAttack) {
          headBox(15, 12, 2, 1, 0x440000); // Small open mouth
        } else if (isDefend) {
          headBox(15, 12, 2, 1, WHITE); // Clenched teeth
        } else {
          headDot(16, 12, 0x222222); // Smirk corner
        }

        canvas.fillStyle(hairColor, 1);

        if (isTransformed && !isUI) {
          // SSJ Hair - Standing straight up, dynamic flame-like
          headBox(11, 0, 10, 6, hairColor); // Main block
          // Left side spikes
          headBox(9, -2, 2, 6, hairColor);
          headBox(7, 0, 2, 4, hairColor);
          // Right side spikes
          headBox(21, -2, 2, 6, hairColor);
          headBox(23, 0, 2, 4, hairColor);
          // Top spikes (tall and sharp)
          headBox(11, -6, 2, 6, hairColor); // Far left top
          headBox(14, -8, 3, 8, hairColor); // Center top (tallest)
          headBox(18, -5, 2, 5, hairColor); // Far right top

          // Hair shading
          headBox(11, -2, 1, 6, HAIR_SSJ_SHADOW);
          headBox(20, -2, 1, 6, HAIR_SSJ_SHADOW);
          headBox(12, -6, 1, 6, HAIR_SSJ_SHADOW);
          headBox(18, -5, 1, 5, HAIR_SSJ_SHADOW);
          headBox(15, -8, 1, 8, HAIR_SSJ_SHADOW); // Middle spike shadow
          // Hair highlights
          headBox(13, -4, 1, 4, HAIR_SSJ_LIGHT);
          headBox(19, -3, 1, 4, HAIR_SSJ_LIGHT);
          headBox(16, -6, 1, 4, HAIR_SSJ_LIGHT);
          // Bangs (SSJ has fewer bangs, mostly one or two sharp ones, lifted)
          headBox(14, 6, 2, 2, hairColor);
          headBox(17, 6, 1, 1, hairColor);
          headBox(14, 7, 1, 1, HAIR_SSJ_SHADOW); // Bang shadow
        } else if (isUI) {
          // UI Hair - Similar to base but more raised/flowing
          headBox(11, 1, 10, 7, hairColor);
          headBox(14, -1, 4, 3, hairColor); // Top bump
          headBox(9, 2, 2, 5, hairColor);
          headDot(8, 4, hairColor);
          headBox(7, 3, 2, 4, hairColor);
          headBox(21, 2, 2, 4, hairColor);
          headDot(23, 4, hairColor);
          // Hair shading
          headBox(11, 3, 1, 5, HAIR_UI_SHADOW);
          headBox(20, 3, 1, 5, HAIR_UI_SHADOW);
          headBox(14, 1, 1, 3, HAIR_UI_SHADOW);
          // Hair highlights
          headBox(12, 2, 1, 4, HAIR_UI_LIGHT);
          headBox(19, 2, 1, 4, HAIR_UI_LIGHT);
          headBox(15, 0, 1, 3, HAIR_UI_LIGHT);
          // Bangs
          headBox(13, 6, 2, 3, hairColor);
          headBox(16, 6, 3, 3, hairColor);
          headBox(11, 6, 1, 2, hairColor);
          headBox(20, 6, 1, 2, hairColor);
          headBox(13, 7, 1, 2, HAIR_UI_SHADOW);
          headBox(17, 7, 1, 2, HAIR_UI_SHADOW); // Bang shadows
        } else {
          // Base Hair - Classic Goku (Palm tree look)
          headBox(11, 1, 10, 5, hairColor); // Main base
          // Top spikes
          headBox(13, -2, 3, 3, hairColor);
          headBox(16, -1, 3, 2, hairColor);
          // Left spikes (curving up and out)
          headBox(9, 0, 2, 4, hairColor);
          headBox(7, 1, 2, 3, hairColor);
          headBox(5, 3, 2, 2, hairColor);
          // Right spikes (curving up and out)
          headBox(21, 1, 2, 4, hairColor);
          headBox(23, 2, 2, 3, hairColor);
          headBox(25, 4, 2, 2, hairColor);
          // Hair shading (greyish for black hair)
          headBox(12, 2, 1, 4, 0x333333);
          headBox(19, 2, 1, 4, 0x333333);
          headBox(14, 0, 1, 2, 0x333333);
          // Bangs (Base) - Lifted
          headBox(13, 6, 2, 2, hairColor); // Left bang
          headBox(16, 6, 2, 2, hairColor); // Right bang
          headBox(18, 6, 1, 1, hairColor); // Small side bang
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

  if (!scene.textures.exists("goku")) {
    generateForm(0);
  }
  if (!scene.textures.exists("goku_ssj")) {
    generateForm(1);
  }
  if (!scene.textures.exists("goku_ui")) {
    generateForm(2);
  }
}
