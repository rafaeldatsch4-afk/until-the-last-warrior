import Phaser from "phaser";

export function generateSpidermanSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "spiderman";

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
          const isTransformed = form > 0;

          // CLASSIC SPIDER-MAN PALETTES
          const BASE_RED = 0xcc0000;
          const SHADOW_RED = 0x880000;
          const BASE_BLUE = 0x0033cc;
          const SHADOW_BLUE = 0x001188;
          
          const WEB_COLOR = 0x000000; 

          // MCU NANO IRON SPIDER COLORS
          const IRON_RED = 0xab1414; // High-tech metallic red
          const IRON_BLUE = 0x0c1b33; // Very dark navy/indigo (looks almost black-blue)
          const IRON_GOLD = 0xffd700; // Brilliant gold for nano accents
          const IRON_EYE = 0xccffff; // Cyan glow for nano suit eyes
          
          const RED = isTransformed ? IRON_RED : BASE_RED;
          const S_RED = isTransformed ? 0x730d0d : SHADOW_RED;
          const BLUE = isTransformed ? IRON_BLUE : BASE_BLUE; 
          const S_BLUE = isTransformed ? 0x060d1c : SHADOW_BLUE; 
          const LOGO = isTransformed ? IRON_GOLD : 0x000000;

          const EYE_GLOW = 0xffffff; // Always white, cyan looks green due to yellow contrast
          const EYE_RIM = 0x000000; // Always black border, gold borders look like "yellow glasses"

          const bob = (f === 1 || f === 3) ? 1 : 0;
          const armSway = (f === 1 || f === 3) ? 1 : 0;
          
          // === IRON SPIDER WALDOES (BACK) ===
          if (isTransformed) {
             const isAtk = isAttack ? 1 : 0;
             // High-Tech MCU Nano Waldoes
             // Shifted outwards and downwards to AVOID overlapping the head (no horns/cifres!)
             
             // Top Left Waldo
             box(11, 13 + armSway, 2, 2, IRON_GOLD); // Anchor lower on shoulder blade
             box(5, 12 + armSway, 6, 2, IRON_GOLD);  // Long arm sweeping OUT to the left
             box(3, 13 + armSway, 2, 4, IRON_GOLD);  // Diagonal joint
             box(1, 15 + armSway, 2, 5, IRON_GOLD);  // Blade dropping down
             box(1, 19 + armSway, 2, 2, IRON_EYE);   // Glowing tip

             // Top Right Waldo
             box(19, 13 - armSway, 2, 2, IRON_GOLD); // Anchor
             box(21, 12 - armSway, 6, 2, IRON_GOLD); // Sweeping OUT to the right
             box(27, 13 - armSway, 2, 4, IRON_GOLD); // Diagonal joint
             box(29, 15 - armSway, 2, 5, IRON_GOLD); // Blade dropping down
             box(29, 19 - armSway, 2, 2, IRON_EYE);  // Glowing tip

             // Bottom Left Waldo
             box(12, 17 - armSway, 2, 2, IRON_GOLD); // Anchor lower back
             box(6, 18 - armSway, 6, 2, IRON_GOLD);  // Sweeping OUT and down
             box(4, 20 - armSway, 2, 4, IRON_GOLD);  // Joint
             box(2, 22 - armSway, 2, 5, IRON_GOLD);  // Blade dropping down
             box(2, 26 - armSway, 2, 2, IRON_EYE);   // Glow

             // Bottom Right Waldo
             box(18, 17 + armSway, 2, 2, IRON_GOLD); // Anchor lower back
             box(20, 18 + armSway, 6, 2, IRON_GOLD); // Sweeping OUT and down
             box(26, 20 + armSway, 2, 4, IRON_GOLD); // Joint
             box(28, 22 + armSway, 2, 5, IRON_GOLD); // Blade dropping down
             box(28, 26 + armSway, 2, 2, IRON_EYE);  // Glow
          }

          // === LEGS (Starts at Y=23, same as Goku) ===
          box(10, 23 + bob, 4, 6, BLUE); // Left Thigh
          box(18, 23 + bob, 4, 6, BLUE); // Right Thigh
          // Shading
          box(10, 23 + bob, 1, 6, S_BLUE); 
          box(21, 23 + bob, 1, 6, S_BLUE);

          // Boots (Y=29)
          box(10, 29 + bob, 4, 5, RED);
          box(18, 29 + bob, 4, 5, RED);
          // Boots Details & Shadows
          box(10, 29 + bob, 1, 5, S_RED);
          box(18, 29 + bob, 1, 5, S_RED);
          
          if (isTransformed) {
            // MCU Gold Boot Accents
            box(10, 29 + bob, 4, 1, IRON_GOLD); 
            box(18, 29 + bob, 4, 1, IRON_GOLD);
          } else {
            // Classic Web bands
            box(10, 30 + bob, 4, 1, WEB_COLOR); 
            box(18, 30 + bob, 4, 1, WEB_COLOR);
          }

          // === TORSO (Y=14 to 22) ===
          // Core Red
          box(13, 14 + bob, 6, 9, RED);
          // Blue Sides
          box(11, 14 + bob, 2, 9, BLUE);
          box(19, 14 + bob, 2, 9, BLUE);
          
          // Torso Shadow
          box(13, 14 + bob, 1, 9, S_RED); // red shadow
          if (isTransformed) {
              box(18, 14 + bob, 1, 9, S_RED); // Inner right shadow for MCU armor depth
          }
          box(11, 14 + bob, 1, 9, S_BLUE); // blue left shadow
          box(20, 14 + bob, 1, 9, S_BLUE); // blue right shadow
          
          // Belt
          box(11, 22 + bob, 10, 2, RED);
          if (isTransformed) {
             // MCU Iron Spider Gold Trim around torso
             box(12, 14 + bob, 1, 9, IRON_GOLD); // Separating line left
             box(19, 14 + bob, 1, 9, IRON_GOLD); // Separating line right
             box(11, 21 + bob, 10, 1, IRON_GOLD); // Gold belt rim
          } else {
             box(11, 23 + bob, 10, 1, WEB_COLOR); // Only draw belt web line on classic
             box(13, 17 + bob, 6, 1, WEB_COLOR); // Horizontal web curve
          }

          // MCU Giant Gold Spider Emblem vs Classic Small Black Spider
          if (isTransformed) {
             // Intricate Nano Tech Gold Spider
             // Core Body (Diamond/Tapered shape)
             box(15, 14 + bob, 2, 1, LOGO); // Spider head/neck
             box(14, 15 + bob, 4, 3, LOGO); // Bulbous thorax (chest center)
             box(15, 18 + bob, 2, 4, LOGO); // Tapering abdomen down to the belt
             
             // Four upper legs (wrapping diagonally up the upper pecs/shoulders)
             box(13, 15 + bob, 1, 2, LOGO); // Inner upper L
             box(12, 14 + bob, 1, 2, LOGO); // Outer upper L
             
             box(18, 15 + bob, 1, 2, LOGO); // Inner upper R
             box(19, 14 + bob, 1, 2, LOGO); // Outer upper R
             
             // Four lower legs (wrapping aggressively down the ribs/waist)
             box(13, 18 + bob, 1, 2, LOGO); // Inner lower L
             box(12, 19 + bob, 1, 3, LOGO); // Outer lower L wrap
             
             box(18, 18 + bob, 1, 2, LOGO); // Inner lower R
             box(19, 19 + bob, 1, 3, LOGO); // Outer lower R wrap
          } else {
             box(15, 16 + bob, 2, 3, LOGO); // Classic Body
             box(14, 16 + bob, 4, 1, LOGO); // Classic Upper legs
             box(14, 18 + bob, 4, 1, LOGO); // Classic Lower legs
          }

          // === ARMS ===
          if (isAttack) {
              // Web Shooter Pose (Left arm forward, right arm back)
              // Right Arm
              box(8, 14 + bob, 3, 4, RED);
              box(7, 18 + bob, 4, 4, RED); // fist closed
              box(7, 18 + bob, 2, 2, 0xff8888); // Knuckles
              // Left Arm (Forward / Thrusting)
              box(21, 14 + bob, 6, 3, RED); // shoulder
              box(27, 14 + bob, 5, 3, RED); // forearm
              box(32, 13 + bob, 4, 4, RED); // HAND (FIRES BEAM FROM HERE)
              box(32, 13 + bob, 2, 2, 0xff8888); // Knuckles
              
              if (isTransformed) {
                  box(20, 14 + bob, 1, 3, IRON_GOLD); // Shoulder gold band
                  box(26, 14 + bob, 1, 3, IRON_GOLD); // Forearm gold band
                  box(32, 14 + bob, 4, 1, IRON_GOLD); // Nano tech brace on hand
              } else {
                  box(32, 14 + bob, 4, 1, WEB_COLOR); // hand detail
              }
              box(36, 15 + bob, 2, 1, EYE_GLOW); // web spark
          } else if (isCharge) {
              // Crouch / Prep Pose
              box(8, 15 + bob, 3, 4, BLUE); 
              box(8, 19 + bob, 4, 4, RED); // Glove
              if (isTransformed) box(8, 19 + bob, 4, 1, IRON_GOLD); // Gold bracelet
              else box(8, 19 + bob, 4, 1, WEB_COLOR);
              
              box(21, 15 + bob, 3, 4, BLUE); 
              box(20, 19 + bob, 4, 4, RED); // Glove
              if (isTransformed) box(20, 19 + bob, 4, 1, IRON_GOLD); // Gold bracelet
              else box(20, 19 + bob, 4, 1, WEB_COLOR);
          } else {
              // Idle
              box(8, 15 + bob, 3, 4, BLUE);
              box(8, 19 + bob, 3, 5, RED); // Glove
              if (isTransformed) box(8, 19 + bob, 3, 1, IRON_GOLD); // Gold bracelet
              else box(8, 20 + bob, 3, 1, WEB_COLOR); // Web line
              
              box(21, 15 - bob, 3, 4, BLUE);
              box(21, 19 - bob, 3, 5, RED); // Glove
              if (isTransformed) box(21, 19 - bob, 3, 1, IRON_GOLD); // Gold bracelet
              else box(21, 20 - bob, 3, 1, WEB_COLOR); // Web line
          }

          // === HEAD (Y=6) ===
          // Simple, clean oval
          headBox(12, 6 + bob, 8, 8, RED);
          headBox(12, 6 + bob, 1, 8, S_RED); // shadow left
          
          if (!isTransformed) {
              // Classic Head Webbing (Only on classic)
              // NOTE: User explicitly complained about the vertical line on the face. So I'll remove it 
              // and only leave subtle subtle horizontal curves if anything, or just nothing.
              // Actually they said "risco preto no rosto", I'll just remove both so the face is purely clean.
              // NO WEBBING on face for a perfectly clean mask.
          }

          // Classic / MCU Eyes
          // Left
          headBox(12, 8 + bob, 3, 4, EYE_RIM); 
          headBox(13, 9 + bob, 2, 2, EYE_GLOW); 
          // Right
          headBox(17, 8 + bob, 3, 4, EYE_RIM);
          headBox(17, 9 + bob, 2, 2, EYE_GLOW);

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

    if (!scene.textures.exists("spiderman")) { generateForm(0); }
    if (!scene.textures.exists("spiderman_ssj")) { generateForm(1); }
    if (!scene.textures.exists("spiderman_ui")) { generateForm(2); }
}
