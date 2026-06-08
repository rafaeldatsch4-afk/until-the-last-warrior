import Phaser from "phaser";

export function generateChapolimSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "chapolim";

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
          // ==========================================
          // === EL CHAPULIN COLORADO (CLASSIC REMASTER 2) ===
          // ==========================================
          const RED_DK = 0x8a0000;
          const RED_MD = 0xcc0000;
          const RED_LT = 0xff1a1a;
          
          const YELLOW_DK = 0xc29900;
          const YELLOW_MD = 0xffcc00;
          const YELLOW_LT = 0xffeb66;
          
          const SKIN_DK = 0xc48f6c;
          const SKIN_MD = 0xeabb96;
          const SKIN_LT = 0xffdbb8;
          
          const BLACK = 0x111111;
          const WHITE = 0xffffff;

          // 1. CHIPOTE CHILLÓN (Mallet) - Back Layer
          const malletY = isAttack ? 12 : (f % 2 === 0 ? 14 : 15);
          if (isAttack) {
            // Huge Swinging Mallet - Forward smash position
            box(22, 13, 14, 3, YELLOW_DK); // Handle shadow
            box(22, 14, 14, 2, YELLOW_MD); // Handle swinging horizontally
            box(24, 14, 12, 1, YELLOW_LT); // Handle highlight
            
            // Hammer head smashing forward
            box(34, 8, 10, 14, RED_DK); // Hammer body shadow
            box(35, 9, 8, 12, RED_MD); // Hammer body
            box(35, 9, 8, 2, RED_LT); // Upper Highlight
            box(35, 11, 2, 8, RED_LT); // Side highlight
            
            box(34, 12, 2, 6, YELLOW_DK); // Left cap shadow
            box(35, 12, 1, 6, YELLOW_MD); // Left cap
            box(42, 12, 3, 6, YELLOW_DK); // Right cap (Smash point) shadow
            box(43, 12, 2, 6, YELLOW_MD); // Right cap (Smash point)
          } else {
            // Resting Mallet on his back (Fixed position)
            box(23, 6, 3, 15, YELLOW_DK); // Handle shadow
            box(24, 6, 2, 15, YELLOW_MD); // Handle
            box(25, 6, 1, 15, YELLOW_LT); // Handle highlight
            
            box(18, 1, 12, 10, RED_DK); // Base Hammer shadow
            box(19, 2, 10, 8, RED_MD); // Hammer Core
            box(19, 2, 10, 2, RED_LT); // Highlight top
            box(19, 4, 2, 4, RED_LT); // Highlight side
            
            box(16, 4, 3, 4, YELLOW_DK); // Left cap shadow
            box(17, 4, 2, 4, YELLOW_MD); // Left cap
            box(29, 4, 3, 4, YELLOW_DK); // Right cap shadow
            box(29, 4, 2, 4, YELLOW_MD); // Right cap
          }

          // 2. LEGS & SHORTS
          // Shorts (Yellow shorts)
          box(10, 21, 12, 5, YELLOW_MD);
          box(11, 25, 10, 1, YELLOW_DK); // Short edge shadow
          
          // Legs (Red Tights)
          box(11, 26, 3, 4, RED_MD); // Left leg
          box(10, 26, 1, 4, RED_DK); 
          
          box(18, 26, 3, 4, RED_MD); // Right leg
          box(20, 26, 1, 4, RED_DK); 
          
          // 3. ICONIC YELLOW CONVERSE SHOES
          // Left Shoe
          box(8, 30, 6, 4, YELLOW_MD); // High-top canvas
          box(9, 31, 5, 3, YELLOW_LT); // Canvas highlight
          box(8, 34, 7, 2, WHITE); // White Sole thick
          box(8, 35, 7, 1, 0xdddddd); // Sole shadow
          box(13, 32, 2, 2, WHITE); // White Toe Cap
          box(10, 31, 1, 3, WHITE); // Laces
          box(12, 31, 1, 3, WHITE); // Laces
          dot(11, 32, RED_DK); // Red Star
          // Right Shoe
          box(17, 30, 6, 4, YELLOW_MD); // High-top canvas
          box(18, 31, 5, 3, YELLOW_LT); // Canvas highlight
          box(17, 34, 7, 2, WHITE); // White Sole thick
          box(17, 35, 7, 1, 0xdddddd); // Sole shadow
          box(17, 32, 2, 2, WHITE); // White Toe Cap
          box(19, 31, 1, 3, WHITE); // Laces
          box(21, 31, 1, 3, WHITE); // Laces
          dot(20, 32, RED_DK); // Red Star

          // 4. TORSO (Red Suit)
          box(9, 13, 14, 8, RED_DK); // Base shadow
          box(10, 13, 12, 8, RED_MD); // Core uniform
          box(10, 14, 3, 6, RED_LT); // Chest highlight left
          
          // 5. HEART BADGE (Simbolo do Coração - Updated Proportion)
          box(12, 15, 8, 5, YELLOW_MD); // Top width (wider for centering)
          box(13, 20, 6, 1, YELLOW_MD); // Lower taper
          box(15, 21, 2, 1, YELLOW_MD); // Bottom point
          
          // The "CH" (Classic Red Letters - perfectly centered)
          // C
          box(13, 16, 2, 1, RED_DK);
          box(13, 17, 1, 2, RED_DK);
          box(13, 19, 2, 1, RED_DK);
          // H
          box(16, 16, 1, 4, RED_DK);
          box(18, 16, 1, 4, RED_DK);
          box(17, 17, 1, 2, RED_DK);

          // 6. ARMS
          if (isAttack) {
            box(21, 14, 10, 4, RED_MD); // Right arm forward
            box(21, 17, 10, 1, RED_DK); // Bottom arm shadow
            box(30, 13, 4, 4, SKIN_MD); // Hand holding mallet
            box(30, 14, 2, 2, SKIN_LT); // Knuckles
            
            box(5, 15, 4, 5, RED_DK);   // Left arm back
            box(6, 15, 3, 5, RED_MD); 
            box(5, 20, 4, 3, SKIN_MD); 
          } else {
            // Resting arms
            box(7, 14, 4, 7, RED_DK); // L Arm Shadow
            box(8, 14, 3, 7, RED_MD); // L Arm
            box(8, 15, 1, 5, RED_LT); // L Arm highlight
            
            box(21, 14, 4, 7, RED_DK); // R Arm Shadow
            box(21, 14, 3, 7, RED_MD); 
            
            // Hands
            box(6, 21, 5, 3, SKIN_DK); 
            box(7, 21, 3, 2, SKIN_MD); // L Hand
            
            box(21, 21, 5, 3, SKIN_DK); 
            box(22, 21, 3, 2, SKIN_MD); // R Hand
          }

          // 7. CABESTRO / CAPUZ (The Red Hood)
          headBox(10, 4, 12, 10, RED_DK); // Hood shadow
          headBox(11, 3, 10, 10, RED_MD); // Hood base
          headBox(11, 4, 3, 4, RED_LT);  // Hood highlight

          // 8. FACE (Rosto Serio/Nobre - Menos Engraçado)
          headBox(12, 6, 8, 6, SKIN_MD); // Face core
          headBox(12, 11, 8, 1, SKIN_DK); // Chin shadow
          headBox(13, 6, 6, 2, SKIN_LT); // Forehead light
          
          // Eyes (Normal, strong look)
          headBox(13, 8, 2, 1, WHITE);
          headBox(17, 8, 2, 1, WHITE);
          headDot(14, 8, BLACK); // Pupil L
          headDot(17, 8, BLACK); // Pupil R
          
          // Nose
          headBox(15, 9, 2, 1, SKIN_DK);
          
          // Mouth (Determined, smaller)
          headBox(15, 11, 2, 1, 0x8a0000); // 2px wide, determined smirk

          // 9. ANTENINHAS DE VINIL (The Antennas!)
          const jiggle = (f % 4 < 2) ? 1 : 0;
          // Stems
          headBox(12, 0, 1, 3, RED_DK); // Left Stem
          headBox(19, 0, 1, 3, RED_DK); // Right Stem
          
          // Pompoms (Yellow fuzzy balls)
          headBox(11 - jiggle, -2, 3, 3, YELLOW_MD); // L Pompom
          headDot(12 - jiggle, -2, YELLOW_LT); // L highlight
          
          headBox(18 + jiggle, -2, 3, 3, YELLOW_MD); // R Pompom
          headDot(19 + jiggle, -2, YELLOW_LT); // R highlight
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

    if (!scene.textures.exists("chapolim")) { generateForm(0); }
    if (!scene.textures.exists("chapolim_ssj")) { generateForm(1); }
    if (!scene.textures.exists("chapolim_ui")) { generateForm(2); }
}
