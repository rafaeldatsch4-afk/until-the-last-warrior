import Phaser from "phaser";

export function generateStaticSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "static";

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
          const COAT_BLUE = isTransformed ? 0xf0f0f0 : 0x1f3c88;
          const COAT_DARK = isTransformed ? 0xcccccc : 0x0f1e44;
          const COAT_LIGHT = isTransformed ? 0xffffff : 0x3d64d9;
          const YELLOW = isTransformed ? 0x00ffff : 0xffd900; 
          const YELLOW_DARK = isTransformed ? 0x0088cc : 0xb59a00;
          const WHITE = 0xffffff;
          const SHIRT_DARK = isTransformed ? 0x050505 : 0x111111; 
          const SHIRT_SHINE = isTransformed ? 0x1a1a1a : 0x333333;
          const PANTS = isTransformed ? 0x151515 : 0x2c3e50;
          const PANTS_DARK = isTransformed ? 0x050505 : 0x1a252f;
          const PANTS_LIGHT = isTransformed ? 0x2a2a2a : 0x34495e;
          const GLOVE = isTransformed ? 0x111111 : 0xf0f0f0;
          const GLOVE_DARK = isTransformed ? 0x000000 : 0xbababa;
          const ELECTRIC = isTransformed ? 0xffffff : 0x00ffff;
          const ELECTRIC_GLOW = isTransformed ? 0x00ffff : 0x00ffff;
          const SKIN = 0x6e4a2e;
          const SKIN_SHADOW = 0x4a321f;
          const HAIR = isTransformed ? 0xe0ffff : 0x151515;
          const HAIR_SHINE = isTransformed ? 0xffffff : 0x242424;
          const MASK_BLUE = isTransformed ? 0x00e5ff : 0x3498db;

          // --- Static Saucer (Disc Base) ---
          if (!isAttack && !isDefend) {
            const discBounce = Math.sin(f * 0.5) * 2;
            
            // Electric Aura Base & Ground Sparks
            alphaBox(4, 30 + discBounce, 24, 6, ELECTRIC_GLOW, 0.2);
            if (f % 3 === 0) {
                alphaBox(6, 31 + discBounce, 20, 2, WHITE, 0.5);
                dot(Math.floor(Math.random()*24+4), 33 + discBounce, ELECTRIC);
                dot(Math.floor(Math.random()*24+4), 34 + discBounce, ELECTRIC);
            }
            
            // Disc structural layers
            box(10, 31 + discBounce, 12, 1, 0xbdc3c7); // top rim
            box(8, 32 + discBounce, 16, 1, 0x95a5a6);  // wide center
            box(9, 33 + discBounce, 14, 1, 0x7f8c8d);  // underbelly
            box(11, 34 + discBounce, 10, 1, 0x2c3e50); // core shadow
            
            // Glowing energy rings on the disc
            if (f % 4 < 2 || isTransformed) {
               box(11, 31 + discBounce, 10, 1, ELECTRIC);
               box(13, 31 + discBounce, 6, 1, WHITE); // Core bright spot
            }
          }

          // --- LEGS (Baggy Cargo Pants) ---
          box(11, 23, 5, 7, PANTS);
          box(16, 23, 5, 7, PANTS);
          
          // Pants folds & shading
          box(11, 25, 5, 1, PANTS_DARK);
          box(16, 27, 5, 1, PANTS_DARK);
          box(15, 23, 2, 6, PANTS_DARK); // inner leg shadow
          box(11, 23, 10, 2, PANTS_DARK); // Crotch depth
          box(12, 24, 2, 4, PANTS_LIGHT); // Thigh highlights
          box(17, 24, 2, 4, PANTS_LIGHT); // Thigh highlights

          // Shoes/Boots
          box(10, 30, 5, 2, SHIRT_DARK);
          box(17, 30, 5, 2, SHIRT_DARK);
          box(11, 30, 2, 2, SHIRT_SHINE);
          box(18, 30, 2, 2, SHIRT_SHINE);
          box(10, 32, 5, 1, YELLOW); // sole edge
          box(17, 32, 5, 1, YELLOW);

          // --- TORSO (Shirt & Trench Coat) ---
          // Black shirt base
          box(12, 14, 8, 8, SHIRT_DARK);
          box(13, 14, 2, 8, SHIRT_SHINE); // rib highlight
          
          // Huge, Sharp Lightning Bolt Symbol on Chest
          box(15, 15, 3, 1, YELLOW); 
          box(14, 16, 3, 1, YELLOW);
          box(15, 17, 3, 1, YELLOW); 
          box(14, 18, 3, 1, YELLOW);
          box(16, 19, 1, 2, YELLOW); 
          // Core bright white streak inside lightning
          box(15, 16, 1, 1, WHITE);
          box(16, 17, 1, 1, WHITE);
          box(15, 18, 1, 1, WHITE);
          box(16, 19, 1, 1, WHITE);
          
          // Utility Belt
          box(11, 22, 10, 1, YELLOW_DARK);
          box(15, 21, 2, 3, 0x8898a6); // Buckle
          dot(15, 22, 0xffffff); // Buckle shine
          
          // Trench Coat (Overlapping, huge, dynamic sweeping tails)
          if (isAttack) {
             // Coat aggressively whipping backward
             box(0, 16, 10, 8, COAT_DARK); 
             box(-2, 19, 8, 10, COAT_BLUE); 
             box(-2, 28, 8, 2, YELLOW); // heavy trim whipping up
             box(-3, 19, 1, 10, COAT_LIGHT); // wind highlight
             
             // Extra whipping tail fragment
             box(-5, 23, 4, 3, COAT_BLUE);
             box(-5, 26, 4, 1, YELLOW);
          } else {
             // Dynamic wind flapping, massive billowing tails hanging low
             const coatSway = Math.round(Math.sin(f * 0.3) * 4);
             
             // Left sweeping tail (bigger and lower)
             box(4 - coatSway, 23, 8, 9, COAT_DARK); // Back shadow
             box(3 - coatSway, 24, 8, 8, COAT_BLUE); // Main coat body
             box(2 - coatSway, 25, 2, 7, COAT_LIGHT); // Volume highlight
             box(3 - coatSway, 31, 8, 2, YELLOW); // Thick yellow trim at bottom
             
             // Right sweeping tail
             box(20 + coatSway, 23, 8, 9, COAT_DARK);
             box(21 + coatSway, 24, 8, 8, COAT_BLUE);
             box(28 + coatSway, 25, 2, 7, COAT_LIGHT);
             box(21 + coatSway, 31, 8, 2, YELLOW);
          }

          // Coat Front Panels & Shoulders
          box(9, 13, 3, 10, COAT_BLUE);
          box(20, 13, 3, 10, COAT_BLUE);
          box(8, 13, 1, 10, COAT_LIGHT); // shoulder to lapel highlights
          box(22, 13, 1, 10, COAT_LIGHT);
          
          // High collar
          box(10, 11, 2, 3, COAT_DARK);
          box(20, 11, 2, 3, COAT_DARK);

          // Yellow borders around coat opening
          box(12, 13, 1, 10, YELLOW);
          box(19, 13, 1, 10, YELLOW);

          // --- ARMS ---
          if (isAttack) {
             // Brutal Electric Punch Extended
             box(22, 13, 8, 5, COAT_BLUE); // Thicker sleeve
             box(22, 13, 8, 1, COAT_LIGHT); 
             box(30, 14, 5, 3, SKIN); // Arm
             
             // Hand/Glove
             box(35, 13, 6, 5, GLOVE);
             box(35, 13, 2, 5, GLOVE_DARK); // glove detailing

             // Giant Electric Burst on Fist (Cone shape)
             alphaBox(30, 9, 15, 15, ELECTRIC_GLOW, 0.4);
             alphaBox(34, 11, 10, 10, ELECTRIC, 0.7);
             box(37, 13, 5, 5, WHITE); // intense core
             
             // Huge Errant sparks out of the punch
             box(31, 7, 2, 3, ELECTRIC);
             box(45, 10, 4, 1, WHITE);
             box(43, 8, 3, 2, ELECTRIC);
             box(28, 19, 2, 2, ELECTRIC);
             box(46, 18, 1, 3, ELECTRIC);
             box(50, 15, 2, 2, WHITE);

             // Left arm bracing
             box(7, 15, 4, 5, COAT_BLUE);
             box(6, 16, 3, 4, GLOVE);
          } else {
             // Arms idle - crackling with power
             const armBreathe = Math.round(Math.sin(f * 0.2) * 1);
             box(7, 14 + armBreathe, 4, 6, COAT_BLUE);
             box(21, 14 - armBreathe, 4, 6, COAT_BLUE);
             
             box(7, 20 + armBreathe, 3, 3, GLOVE);
             box(22, 20 - armBreathe, 3, 3, GLOVE);
             
             // Idle arm sparks
             if (f % 2 === 0) {
                 dot(23, 22 - armBreathe, WHITE);
                 dot(6, 21 + armBreathe, ELECTRIC);
             } else {
                 dot(25, 20 - armBreathe, ELECTRIC);
                 dot(4, 22 + armBreathe, WHITE);
             }
          }

          // --- HEAD ---
          headBox(13, 5, 6, 8, SKIN);
          headBox(13, 5, 2, 8, SKIN_SHADOW); // heavy cheek shadow
          headBox(16, 9, 3, 1, SKIN_SHADOW); // nose bridge shadow
          
          // Mouth
          if (isAttack) {
             headBox(15, 11, 3, 2, 0x330000); // Shouting
             headBox(15, 11, 3, 1, WHITE); // teeth
          } else {
             headBox(15, 11, 2, 2, SHIRT_DARK); // smirking/focused
             headBox(16, 11, 1, 1, WHITE); // little teeth gleam
          }
          
          // Goggles/Mask (Sleek, aerodynamic, angled)
          // Mask base framing
          headBox(10, 8, 12, 4, YELLOW); 
          headBox(10, 9, 12, 3, YELLOW_DARK);
          
          // Outer sharp edges (aerodynamic points)
          headBox(9, 6, 2, 3, YELLOW);
          headBox(21, 6, 2, 3, YELLOW);

          // Visor lens (angled)
          headBox(11, 8, 10, 3, MASK_BLUE); 
          headBox(15, 10, 2, 2, MASK_BLUE); // Center dip over nose
          headBox(12, 7, 3, 1, MASK_BLUE); // Angled top left
          headBox(17, 7, 3, 1, MASK_BLUE); // Angled top right
          
          // Bright glowing eyes inside Visor
          headBox(13, 8, 2, 2, WHITE); 
          headBox(17, 8, 2, 2, WHITE);
          if (isTransformed) {
              headBox(12, 8, 4, 3, WHITE); 
              headBox(17, 8, 4, 3, WHITE);
              headBox(13, 7, 2, 1, WHITE);
              headBox(17, 7, 2, 1, WHITE);
          }
          
          // --- HAIR (Dynamic, defying gravity dreads/locs) ---
          const hairBounce = Math.round(Math.sin(f * 0.4) * 1);
          // Heavy dread mass
          headBox(12, 1 + hairBounce, 8, 4, HAIR);
          headBox(13, 0 + hairBounce, 6, 2, HAIR);
          headBox(14, -1 + hairBounce, 4, 2, HAIR); // peak volume
          
          // Loc strands twisting outwards & flying up (static electricity)
          headBox(10, 2 + hairBounce, 2, 6, HAIR);
          headBox(8, 4 + hairBounce, 2, 4, HAIR); // side stray
          headBox(20, 2 + hairBounce, 2, 6, HAIR);
          headBox(22, 4 + hairBounce, 2, 4, HAIR); 
          
          // Flying locks
          headBox(11, -3 + hairBounce, 2, 4, HAIR);
          headBox(19, -3 + hairBounce, 2, 4, HAIR);
          
          if (isTransformed || isAttack) {
             headBox(15, -4 + hairBounce, 2, 3, HAIR);
             headBox(9, -1 + hairBounce, 2, 3, HAIR);
             headBox(21, -1 + hairBounce, 2, 3, HAIR);
          }
          
          // Hair highlights for depth
          headBox(13, 2 + hairBounce, 1, 4, HAIR_SHINE);
          headBox(17, 2 + hairBounce, 1, 4, HAIR_SHINE);
          headBox(11, 5 + hairBounce, 1, 2, HAIR_SHINE);
          headBox(15, 0 + hairBounce, 2, 1, HAIR_SHINE);

          // --- AURA & PARTICLES (Constantly charging) ---
          const sparkOffset = Math.round(Math.sin(f) * 3);
          dot(9 - sparkOffset, 10 + sparkOffset, ELECTRIC);
          dot(25 + sparkOffset, 15 - sparkOffset, WHITE);
          dot(14, 1 + sparkOffset, ELECTRIC);
          
          if (f % 3 === 0) {
              box(5, 18, 2, 4, ELECTRIC);
              box(24, 11, 2, 3, WHITE);
              box(18, 4, 3, 1, WHITE);
          } else if (f % 2 === 0) {
              box(4, 9, 3, 2, WHITE);
              box(26, 17, 2, 3, ELECTRIC);
              box(12, 3, 1, 3, ELECTRIC);
          }
          
          if (isTransformed) {
              // Super Form God-Level Lightning Aura
              alphaBox(-5, -10, 42, 50, ELECTRIC_GLOW, 0.15); // Massive outer field
              alphaBox(2, -5, 28, 40, ELECTRIC_GLOW, 0.3); // Inner dense field
              
              const flash = f % 2 === 0;
              if (flash) {
                 // Huge lightning strikes branching out
                 
                 // Left giant bolt
                 box(0, Math.floor(Math.random()*30), 4, 10, WHITE);
                 box(2, Math.floor(Math.random()*30), 2, 8, ELECTRIC);
                 
                 // Right giant bolt
                 box(28, Math.floor(Math.random()*30), 4, 10, WHITE);
                 box(26, Math.floor(Math.random()*30), 2, 8, ELECTRIC);
                 
                 // Upward surge
                 box(Math.floor(Math.random()*28+2), -10, 3, 18, WHITE);
              } else {
                 // Alternating streaks
                 box(4, Math.floor(Math.random()*20+10), 2, 12, ELECTRIC);
                 box(26, Math.floor(Math.random()*20+10), 2, 12, ELECTRIC);
                 box(Math.floor(Math.random()*20+6), -8, 2, 12, WHITE);
              }
              
              // Radiating eye trails (anime style pure energy)
              const eyeTrailLength = Math.floor(Math.random() * 6) + 4;
              alphaBox(12 - eyeTrailLength, 8, eyeTrailLength, 2, WHITE, 0.8);
              alphaBox(10 - eyeTrailLength, 7, eyeTrailLength, 4, ELECTRIC_GLOW, 0.4);
              
              alphaBox(20, 8, eyeTrailLength, 2, WHITE, 0.8);
              alphaBox(20, 7, eyeTrailLength, 4, ELECTRIC_GLOW, 0.4);
          }

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

    if (!scene.textures.exists("static")) { generateForm(0); }
    if (!scene.textures.exists("static_ssj")) { generateForm(1); }
    if (!scene.textures.exists("static_ui")) { generateForm(2); }
}
