import Phaser from "phaser";

export function generateVegetaSprite(scene: Phaser.Scene) {
  const generateForm = (form: number) => {
    const key = "vegeta";
    const isTransformed = form > 0;
    const isUI = form === 2;
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
      const OUTLINE = 0x1a0a00;

      {
        const SUIT_BLUE = 0x1f3c88; 
        const SUIT_SHADOW = 0x0f1e44;
        const SUIT_LIGHT = 0x2e57c6;
        const ARMOR_WHITE = 0xfafafa;
        const ARMOR_SHADOW = 0xbac3d6; 
        const ARMOR_DARK = 0x7b879c;
        const GOLD = 0xffc800; 
        const GOLD_SHADOW = 0xcc9900;
        const SKIN_TONE = 0xffce9e;
        const SKIN_SHADOW = 0xe0ac7d;
        const HAIR_BLACK = 0x1a1a1a;

        const HAIR_SSJ_GOLD = 0xffea00; 
        const HAIR_SSJ_SHADOW = 0xd4a000;
        const HAIR_SSJ_LIGHT = 0xfff599;
        const EYE_SSJ_TEAL = 0x00f2ff;

        const HAIR_UI_SILVER = 0x9b59b6; // UE
        const HAIR_UI_SHADOW = 0x6e2c8a;
        const HAIR_UI_LIGHT = 0xcd85e8;
        const EYE_UI_SILVER = 0xff00ff;

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
        // OUTLINES
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
        headBox(11, 5, 10, 9, OUTLINE); 
        headDot(10, 9, OUTLINE);
        headDot(21, 9, OUTLINE); 
        
        // Outlines básicos do cabelo
        if (isTransformed && !isUI) {
          headBox(9, -8, 14, 15, OUTLINE);
          headBox(12, -15, 8, 10, OUTLINE);
        } else if (isUI) {
          headBox(10, 0, 12, 8, OUTLINE);
          headBox(8, 1, 3, 6, OUTLINE);
          headBox(20, 1, 3, 6, OUTLINE);
        } else {
          headBox(9, -6, 14, 13, OUTLINE);
          headBox(11, -11, 10, 10, OUTLINE);
        }

        // --- LEGS & BOOTS ---
        // Bodysuit base
        box(11, 23, 4, 6, SUIT_BLUE);
        box(17, 23, 4, 6, SUIT_BLUE); 

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

        // --- TORSO ---
        box(12, 19, 8, 4, SUIT_BLUE);
        box(14, 23, 4, 2, SUIT_BLUE); // Crotch connection gap

        for (let ty = 19; ty < 23; ty += 2) {
          box(12, ty, 8, 1, SUIT_SHADOW);
          box(12, ty + 1, 8, 1, SUIT_LIGHT);
        }

        box(12, 19, 1, 5, 0x0a142c);
        box(19, 19, 1, 5, 0x0a142c); 

        // --- ANGULAR ARMOR ---
        box(11, 14, 10, 6, ARMOR_WHITE);
        
        box(11, 14, 2, 6, GOLD);
        box(19, 14, 2, 6, GOLD); 
        box(11, 14, 1, 6, GOLD_SHADOW);
        box(20, 14, 1, 6, GOLD_SHADOW); 
        
        box(11, 16, 4, 1, ARMOR_SHADOW);
        box(17, 16, 4, 1, ARMOR_SHADOW);
        box(15, 14, 2, 3, ARMOR_DARK); 
        
        for (let rx = 13; rx <= 18; rx += 1) {
          if (rx % 2 !== 0) {
            box(rx, 17, 1, 3, ARMOR_DARK);
          } else {
            box(rx, 17, 1, 3, ARMOR_SHADOW);
          }
        }
        
        box(13, 14, 2, 1, 0xffffff);
        box(17, 14, 2, 1, 0xffffff); 

        // --- SHOULDERS ---
        box(5, 12, 7, 2, GOLD); 
        box(6, 13, 5, 2, ARMOR_WHITE); 
        dot(5, 11, GOLD); 
        dot(6, 12, ARMOR_WHITE); 
        box(7, 14, 4, 1, ARMOR_SHADOW); 
        box(7, 13, 2, 1, 0xffffff); 
        
        box(20, 12, 7, 2, GOLD);
        box(21, 13, 5, 2, ARMOR_WHITE);
        dot(26, 11, GOLD);
        dot(25, 12, ARMOR_WHITE);
        box(21, 14, 4, 1, ARMOR_SHADOW);
        box(23, 13, 2, 1, 0xffffff);

        // --- ARMS ---
        if (isAttack) {
          box(21, 13, 6, 4, SUIT_BLUE); 
          box(22, 13, 5, 1, SUIT_SHADOW); 
          box(22, 15, 5, 1, SUIT_SHADOW);
          box(27, 14, 6, 3, SUIT_BLUE); 
          
          box(30, 12, 2, 7, ARMOR_WHITE); 
          box(30, 13, 1, 5, ARMOR_SHADOW);
          box(32, 13, 4, 5, ARMOR_WHITE);
          box(32, 14, 2, 2, ARMOR_SHADOW); 
          box(34, 13, 3, 4, ARMOR_WHITE); 
          
          alphaBox(36, 13, 4, 4, ARMOR_WHITE, 0.5); 
          
          box(6, 15, 4, 5, SUIT_BLUE); 
          box(5, 17, 6, 2, ARMOR_WHITE); 
          box(6, 19, 4, 3, ARMOR_WHITE); 
        } else {
          box(8, 16, 3, 4, SUIT_BLUE);
          box(21, 16, 3, 4, SUIT_BLUE);
          
          box(8, 16, 3, 1, SUIT_SHADOW);
          box(8, 17, 3, 1, SUIT_LIGHT);
          box(8, 18, 3, 1, SUIT_SHADOW);
          box(8, 19, 3, 1, SUIT_LIGHT);
          
          box(21, 16, 3, 1, SUIT_SHADOW);
          box(21, 17, 3, 1, SUIT_LIGHT);
          box(21, 18, 3, 1, SUIT_SHADOW);
          box(21, 19, 3, 1, SUIT_LIGHT);
          
          box(6, 19, 7, 2, ARMOR_WHITE);
          box(19, 19, 7, 2, ARMOR_WHITE);
          box(6, 20, 7, 1, ARMOR_SHADOW);
          box(19, 20, 7, 1, ARMOR_SHADOW);
          
          // Dedos detalhados
          box(8, 21, 1, 1, ARMOR_WHITE);
          box(9, 21, 1, 1, ARMOR_SHADOW);
          box(10, 21, 1, 1, ARMOR_WHITE);
                    
          box(21, 21, 1, 1, ARMOR_WHITE);
          box(22, 21, 1, 1, ARMOR_SHADOW);
          box(23, 21, 1, 1, ARMOR_WHITE);
        }

        // --- HEAD & FACE --- (Usando Goku como base + Widow's Peak)
        headBox(12, 6, 8, 1, SKIN_SHADOW);
        headBox(12, 7, 8, 6, SKIN_TONE);
        
        headDot(11, 9, SKIN_TONE);
        headDot(20, 9, SKIN_TONE); 
        headDot(11, 10, SKIN_SHADOW);
        headDot(20, 10, SKIN_SHADOW); 
        headBox(13, 12, 6, 1, SKIN_SHADOW); 

        // Face
        headDot(13, 9, WHITE);
        headDot(17, 9, WHITE);
        headDot(14, 9, eyeColor);
        headDot(18, 9, eyeColor);
        
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

        // Cheek lines
        headDot(13, 11, SKIN_SHADOW);
        headDot(18, 11, SKIN_SHADOW);

        // Expressions
        if (isAttack) {
          headBox(15, 12, 2, 1, 0x440000); 
        } else if (isDefend) {
          headBox(15, 12, 2, 1, WHITE); 
        } else {
          headDot(16, 12, 0x222222); 
        }

        // --- HAIR ---
        canvas.fillStyle(hairColor, 1);
        if (isTransformed && !isUI) {
          // SSJ Hair (Vegeta: mais ereto e sem franja)
          headBox(10, -3, 12, 10, hairColor); 
          headBox(11, -9, 10, 6, hairColor);
          headBox(12, -14, 8, 5, hairColor);
          headBox(13, -18, 6, 4, hairColor);
          
          // Pontas laterais
          headBox(8, -5, 2, 8, hairColor);
          headBox(7, -2, 1, 5, hairColor);
          headBox(22, -5, 2, 8, hairColor);
          headBox(24, -2, 1, 5, hairColor);
          
          headBox(13, -20, 2, 4, hairColor);
          headBox(17, -20, 2, 4, hairColor);

          // Hair shading
          headBox(11, -5, 1, 10, HAIR_SSJ_SHADOW);
          headBox(20, -5, 1, 10, HAIR_SSJ_SHADOW);
          headBox(12, -11, 1, 6, HAIR_SSJ_SHADOW);
          headBox(19, -11, 1, 6, HAIR_SSJ_SHADOW);
          headBox(15, -14, 1, 10, HAIR_SSJ_SHADOW);
          
          // Highlights
          headBox(13, -7, 1, 6, HAIR_SSJ_LIGHT);
          headBox(18, -7, 1, 6, HAIR_SSJ_LIGHT);
          headBox(16, -11, 1, 5, HAIR_SSJ_LIGHT);
          
        } else if (isUI) {
          // UI Hair
          headBox(10, 1, 12, 6, hairColor);
          headBox(12, -3, 8, 4, hairColor); 
          headBox(14, -6, 4, 3, hairColor); 
          
          headBox(8, 2, 2, 5, hairColor);
          headBox(7, 3, 1, 4, hairColor);
          headBox(22, 2, 2, 5, hairColor);
          headBox(24, 3, 1, 4, hairColor);

          headBox(11, 2, 1, 5, HAIR_UI_SHADOW);
          headBox(20, 2, 1, 5, HAIR_UI_SHADOW);
          headBox(14, -1, 1, 4, HAIR_UI_SHADOW);
          
          headBox(13, 0, 1, 4, HAIR_UI_LIGHT);
          headBox(18, 0, 1, 4, HAIR_UI_LIGHT);
          
        } else {
          // Base Hair (Vegeta: Flame shape)
          headBox(10, -1, 12, 8, hairColor); 
          headBox(11, -5, 10, 4, hairColor);
          headBox(12, -9, 8, 4, hairColor);
          headBox(13, -13, 6, 4, hairColor);
          
          headBox(8, 0, 2, 7, hairColor);
          headBox(7, 2, 1, 4, hairColor);
          headBox(22, 0, 2, 7, hairColor);
          headBox(24, 2, 1, 4, hairColor);

          headBox(13, -11, 1, 10, 0x333333);
          headBox(17, -9, 1, 8, 0x333333);
          headBox(11, -4, 1, 8, 0x333333);
          headBox(20, -4, 1, 8, 0x333333);
        }

        // Widow's Peak (Desenha a pele por cima do cabelo na testa)
        headBox(13, 5, 6, 2, SKIN_TONE);
        headBox(14, 4, 4, 1, SKIN_TONE);
        headDot(15, 3, SKIN_TONE);
        headDot(16, 3, SKIN_TONE);
      }
    } 

    let textureName = key;
    if (isUI) textureName = `${key}_ui`;
    else if (isTransformed) textureName = `${key}_ssj`;

    canvas.generateTexture(textureName, sheetWidth, sheetHeight);
    canvas.destroy();

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
