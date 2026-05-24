import Phaser from "phaser";

export function generateJotaroSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "jotaro";

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
          
          // --- ULTRA-DETAILED PALETTE ---
          const COAT_DK = 0x0a0a12;
          const COAT_MD = 0x1d1e2c;
          const COAT_LT = 0x2f3042;
          const COAT_HL = 0x4a4b5e;
          
          const SHIRT_DK = 0x240046;
          const SHIRT_MD = 0x5a189a;
          const SHIRT_LT = 0x7b2cbf;
          
          // SKIN: Changed from tan/dark to pale/fair anime skin!
          const SKIN_DK = 0xcdad96;
          const SKIN_MD = 0xffe4c4; 
          const SKIN_LT = 0xfff0e4;
          
          const HAIR_DK = 0x0a0a0f;
          const HAIR_MD = 0x1c1c24;
          const HAIR_LT = 0x333344;
          
          const GOLD_DK = 0xb08d57;
          const GOLD_MD = 0xffd700;
          const GOLD_LT = 0xfffae3;
          const SILVER_DK = 0x6c757d;
          const SILVER_MD = 0xced4da;
          const SILVER_LT = 0xf8f9fa;
          const BELT_GREEN = 0x2d6a4f;
          const BELT_RED = 0x9d0208;

          // SP Palette
          const SP_SKIN_DK = 0x4a0e4e;
          const SP_SKIN_MD = 0x800080;
          const SP_SKIN_LT = 0xb14aed;
          const SP_HAIR = 0x0b090a;
          const SP_ARMOR_DK = 0xb07d00;
          const SP_ARMOR_MD = 0xffb700;
          const SP_ARMOR_LT = 0xffea00;
          const SP_SCARF_DK = 0x660000;
          const SP_SCARF_MD = 0xc1121f;

          const jX = isTransformed ? 10 : 0; 

          // ==========================================
          // === STAR PLATINUM (ANIME ACCURATE REMASTER) ===
          // ==========================================
          if (isTransformed) {
              const spX = isAttack ? 4 : -2; // Stand slightly behind Jotaro
              const spY = (f % 4 < 2) ? -1 : 0; // Floating gently
              
              // True Anime Palette for Star Platinum
              const SP_SKIN_DK = 0x3d2b56; // Deep purple shadows
              const SP_SKIN_MD = 0x614894; // Classic Part 3 purple/blue skin
              const SP_SKIN_LT = 0xa37cf0; // Vivid cyan-purple highlights
              const SP_HAIR = 0x110b1a; // Almost black
              const SP_HAIR_HL = 0x2e1a4a; // Purple hue to the hair
              const SP_ARMOR_DK = 0x997500;
              const SP_ARMOR_MD = 0xd4a017;
              const SP_ARMOR_LT = 0xffe259;
              const SP_SCARF_DK = 0x7a0010;
              const SP_SCARF_MD = 0xcf1b34;
              const SP_SCARF_LT = 0xff3b54;

              // 1. AURA (Subtle purple/blue spiritual fire)
              alphaBox(spX - 4, spY - 6, 36, 42, SP_SKIN_LT, 0.15);
              alphaBox(spX - 2, spY - 2, 32, 36, SP_SKIN_MD, 0.2);

              // 2. WILD GOHAN-STYLE SPIKY HAIR
              // Thick base with tall, rigid, upward-pointing spikes
              headBox(spX - 2, spY - 9, 20, 10, SP_HAIR); // Hair base
              headBox(spX + 8, spY - 14, 4, 8, SP_HAIR);  // Front spike
              headBox(spX + 2, spY - 18, 6, 12, SP_HAIR); // Main tall spike (Gohan style)
              headBox(spX - 4, spY - 16, 6, 10, SP_HAIR); // Middle-back spike
              headBox(spX - 8, spY - 13, 6, 8, SP_HAIR);  // Far-back spike
              // Purple volume highlights
              headBox(spX + 3, spY - 14, 2, 6, SP_HAIR_HL);
              headBox(spX - 3, spY - 13, 2, 5, SP_HAIR_HL);
              
              // 3. STRONG PROPORTIONED HEAD & JAWLINE
              headBox(spX + 7, spY - 1, 9, 8, SP_SKIN_DK); // Jaw/Head outline
              headBox(spX + 8, spY, 8, 7, SP_SKIN_MD);     // Face base
              
              // Cheekbones and Facial Structure
              headBox(spX + 8, spY + 3, 2, 2, SP_SKIN_LT); // Left cheek highlight
              headBox(spX + 13, spY + 3, 2, 2, SP_SKIN_LT); // Right cheek highlight
              headBox(spX + 8, spY + 5, 2, 2, SP_SKIN_DK); // Left cheek shadow
              headBox(spX + 13, spY + 5, 2, 2, SP_SKIN_DK); // Right cheek shadow
              
              // Headband (Classic Golden Tiara)
              headBox(spX + 7, spY - 2, 9, 2, SP_ARMOR_MD);
              headBox(spX + 8, spY - 2, 7, 1, SP_ARMOR_LT); // Tiara highlight
              headDot(spX + 11, spY - 2, 0x00ffff); // Flawless Cyan Center Gem
              
              // Fierce Eyes, Brow & Nose
              headBox(spX + 8, spY + 1, 3, 1, SP_SKIN_DK); // Heavy brow shadow
              headBox(spX + 13, spY + 1, 3, 1, SP_SKIN_DK); 
              headBox(spX + 9, spY + 2, 2, 1, 0xffffff); // Left eye
              headBox(spX + 13, spY + 2, 2, 1, 0xffffff); // Right eye
              headDot(spX + 10, spY + 2, 0xff00ff); // Iris
              headDot(spX + 14, spY + 2, 0xff00ff);
              
              headBox(spX + 11, spY + 4, 3, 2, SP_SKIN_DK); // Nose bridge
              headBox(spX + 11, spY + 6, 3, 1, 0x221133); // Strong mouth line
              
              // 4. ICONIC RED SCARF
              // Wraps thick around the neck
              box(spX + 5, spY + 7, 12, 5, SP_SCARF_DK); 
              box(spX + 6, spY + 8, 10, 2, SP_SCARF_LT); 
              // Flowing trailing scarf behind him
              const flutter = (f % 2 === 0) ? 1 : 0;
              box(spX + 15, spY + 10, 8 + flutter, 10 + flutter, SP_SCARF_DK);
              box(spX + 16, spY + 11, 5 + flutter, 7 + flutter, SP_SCARF_MD);
              
              // 5. MASSIVE TORSO & SHADING
              box(spX + 5, spY + 11, 12, 12, SP_SKIN_DK); 
              box(spX + 6, spY + 11, 10, 11, SP_SKIN_MD); 
              // Pecs (Vivid cyan-purple highlight)
              box(spX + 7, spY + 12, 3, 4, SP_SKIN_LT); 
              box(spX + 11, spY + 12, 3, 4, SP_SKIN_LT); 
              // Abs (The 8-pack lines)
              box(spX + 8, spY + 17, 6, 5, SP_SKIN_LT);
              box(spX + 10, spY + 17, 2, 5, SP_SKIN_DK); // Mid line
              box(spX + 8, spY + 19, 6, 1, SP_SKIN_DK); // Horiz break
              
              // 6. SPHERICAL GOLDEN SHOULDER PADS
              // Left Pad
              box(spX - 2, spY + 7, 7, 7, SP_ARMOR_DK);
              box(spX - 1, spY + 8, 5, 5, SP_ARMOR_MD);
              box(spX, spY + 8, 2, 2, SP_ARMOR_LT); // Specular highlight
              // Right Pad
              box(spX + 17, spY + 7, 7, 7, SP_ARMOR_DK);
              box(spX + 18, spY + 8, 5, 5, SP_ARMOR_MD);
              box(spX + 19, spY + 8, 2, 2, SP_ARMOR_LT);

              // 7. LOINCLOTH AND GOLD BELT (DETAILED WAIST)
              box(spX + 6, spY + 22, 10, 2, SP_SKIN_DK);  // Obliques/Waist tapering
              box(spX + 4, spY + 24, 14, 3, SP_ARMOR_DK); // Thick Belt base
              box(spX + 5, spY + 25, 12, 2, SP_ARMOR_MD); // Gold belt
              box(spX + 6, spY + 25, 4, 1, SP_ARMOR_LT);  // Belt highlight
              box(spX + 12, spY + 25, 4, 1, SP_ARMOR_LT);
              box(spX + 6, spY + 27, 10, 7, 0x111115); // Dark shading undercloth
              box(spX + 7, spY + 27, 8, 6, 0xdcdcdc); // Core white loincloth shadow
              box(spX + 8, spY + 27, 6, 5, 0xffffff); // Core white loincloth highlight
              
              // 8. TALLER LEGS & KNEE GUARDS (DETAILED MUSCLES)
              // Thighs
              box(spX + 5, spY + 26, 4, 6, SP_SKIN_DK); // Left thigh shadow
              box(spX + 6, spY + 26, 3, 5, SP_SKIN_MD); // Left thigh core
              box(spX + 7, spY + 26, 1, 4, SP_SKIN_LT); // Left quad highlight
              
              box(spX + 13, spY + 26, 4, 6, SP_SKIN_DK); // Right thigh shadow
              box(spX + 13, spY + 26, 3, 5, SP_SKIN_MD); // Right thigh core
              box(spX + 14, spY + 26, 1, 4, SP_SKIN_LT); // Right quad highlight
              
              // Boots
              box(spX + 5, spY + 31, 6, 5, 0x0a0a0a); // Left Boot Dk
              box(spX + 6, spY + 31, 4, 5, 0x1a1a1a); // Left Boot Mid
              box(spX + 11, spY + 31, 6, 5, 0x0a0a0a); // Right Boot Dk
              box(spX + 12, spY + 31, 4, 5, 0x1a1a1a); // Right Boot Mid
              
              // Gold Knee Pads over boots (More spherical)
              box(spX + 5, spY + 30, 6, 4, SP_ARMOR_DK); 
              box(spX + 6, spY + 31, 4, 2, SP_ARMOR_MD); 
              box(spX + 6, spY + 31, 1, 1, SP_ARMOR_LT); 
              
              box(spX + 11, spY + 30, 6, 4, SP_ARMOR_DK); 
              box(spX + 12, spY + 31, 4, 2, SP_ARMOR_MD); 
              box(spX + 12, spY + 31, 1, 1, SP_ARMOR_LT); 

              // 9. ARMS AND ATTACK LOGIC (CLOSED FISTS)
              if (isAttack) {
                  // THE ORA ORA RUSH!
                  // Afterimages covering the flurry area
                  alphaBox(spX + 12, spY + 7, 28, 14, SP_SKIN_LT, 0.4); 
                  alphaBox(spX + 16, spY + 9, 24, 10, 0xffffff, 0.2); // Core speed line
                  
                  const shiftY1 = (f % 2) * 4;
                  const shiftY2 = (f % 2 === 0) ? 0 : 4;
                  
                  // Top Punching Arm
                  box(spX + 16, spY + 9 + shiftY1, 14, 5, SP_SKIN_MD); // Arm stretch
                  box(spX + 30, spY + 9 + shiftY1, 6, 5, 0x111111); // Black glove base
                  // Closed fist detail
                  box(spX + 32, spY + 10 + shiftY1, 4, 4, 0x111111); // Fist forward
                  box(spX + 33, spY + 11 + shiftY1, 2, 2, 0x333333); // Knuckle definition
                  box(spX + 33, spY + 10 + shiftY1, 1, 1, SP_ARMOR_LT); // Central gold stud
                  
                  // Bottom Punching Arm
                  box(spX + 18, spY + 15 - shiftY2, 14, 5, SP_SKIN_MD); 
                  box(spX + 32, spY + 15 - shiftY2, 6, 5, 0x111111); 
                  box(spX + 34, spY + 16 - shiftY2, 4, 4, 0x111111); 
                  box(spX + 35, spY + 17 - shiftY2, 2, 2, 0x333333); 
                  box(spX + 35, spY + 16 - shiftY2, 1, 1, SP_ARMOR_LT);
                  
                  // Impact flashes!
                  alphaBox(spX + 36, spY + 10 + shiftY1, 3, 3, SP_ARMOR_LT, 0.8);
                  alphaBox(spX + 38, spY + 16 - shiftY2, 3, 3, SP_ARMOR_LT, 0.8);
                  
                  // Shouting mouth
                  headBox(spX + 10, spY + 6, 3, 2, 0x220000);
                  headBox(spX + 11, spY + 6, 1, 1, 0xffffff);

              } else {
                  // Ready Combat Stance (Bent arms, closed fists)
                  box(spX + 3, spY + 12, 4, 7, SP_SKIN_DK); // L Bicep
                  box(spX + 4, spY + 12, 2, 6, SP_SKIN_MD); 
                  
                  box(spX + 15, spY + 12, 4, 7, SP_SKIN_DK); // R Bicep
                  box(spX + 16, spY + 12, 2, 6, SP_SKIN_MD); 
                  
                  // Black Padded Gloves (Compact closed fists)
                  box(spX + 2, spY + 18, 6, 6, 0x111111); // L Glove
                  box(spX + 3, spY + 19, 4, 4, 0x222222); // L Fist structure
                  box(spX + 4, spY + 20, 2, 2, SP_ARMOR_MD); // Golden knuckle stud
                  
                  box(spX + 14, spY + 18, 6, 6, 0x111111); // R Glove
                  box(spX + 15, spY + 19, 4, 4, 0x222222); // R Fist structure
                  box(spX + 16, spY + 20, 2, 2, SP_ARMOR_MD); // Golden knuckle stud
              }
          }

          // ==========================================
          // === JOTARO KUJO (FIXED SKIN & PANTS) ===
          // ==========================================
          
          // --- PANT & SHOE PROPORTIONS ---
          // Calças finas e elegantes, nunca grossas
          box(jX + 11, 24, 4, 8, COAT_DK); // Perna Esq Escura
          box(jX + 11, 24, 3, 7, COAT_MD); // Perna Esq Interior
          box(jX + 12, 25, 1, 6, COAT_LT); // Highlight Esq
          
          box(jX + 17, 24, 4, 8, COAT_DK); // Perna Dir Escura
          box(jX + 17, 24, 3, 7, COAT_MD); // Perna Dir Interior
          box(jX + 18, 25, 1, 6, COAT_LT); // Highlight Dir

          // Shoes/Loafers curtos e brilhantes
          box(jX + 10, 31, 5, 3, COAT_DK); // Sola Esq
          box(jX + 16, 31, 5, 3, COAT_DK); // Sola Dir
          box(jX + 10, 31, 4, 2, COAT_MD); // Couro Esq
          box(jX + 16, 31, 4, 2, COAT_MD); // Couro Dir
          headDot(jX + 11, 31, COAT_LT); // Brilho Esq
          headDot(jX + 17, 31, COAT_LT); // Brilho Dir

          // --- TRONCO & GAKURAN ---
          // Corpo forte mas na proporção certa
          box(jX + 9, 14, 14, 10, COAT_DK); 
          
          // Camisa Interna 
          box(jX + 12, 14, 8, 9, SHIRT_DK); 
          box(jX + 13, 14, 6, 8, SHIRT_MD); 
          box(jX + 14, 15, 2, 5, SHIRT_LT); // Highlights (Abs/Pecs esq)
          box(jX + 17, 15, 2, 5, SHIRT_LT); // Highlights (Abs/Pecs dir)
          
          // Lapelas Obertas (Gakuran flaps)
          box(jX + 9, 14, 3, 10, COAT_MD); 
          box(jX + 11, 14, 1, 10, COAT_LT); // Borda luz esq
          box(jX + 20, 14, 3, 10, COAT_MD); 
          box(jX + 20, 14, 1, 10, COAT_LT); // Borda luz dir

          // Gola Alta Rigida
          box(jX + 10, 10, 12, 4, COAT_DK); 
          box(jX + 11, 11, 10, 3, COAT_MD); 
          box(jX + 11, 11, 3, 2, COAT_LT); // Brilho gola esq
          box(jX + 18, 11, 3, 2, COAT_LT); // Brilho gola dir
          
          // Pescoço (Pele clara, não morena!)
          box(jX + 14, 12, 4, 2, SKIN_DK); // Sombra do pescoço
          box(jX + 15, 12, 2, 1, SKIN_MD); // Pescoço em si

          // Corrente Metálica em argolas
          box(jX + 19, 12, 2, 5, SILVER_DK); 
          headDot(jX + 19, 12, SILVER_LT); 
          headDot(jX + 20, 13, SILVER_MD); 
          headDot(jX + 19, 14, SILVER_LT); 
          headDot(jX + 20, 15, SILVER_MD); 

          // Botões Dourados do Lado Direito
          headDot(jX + 21, 15, GOLD_MD);
          headDot(jX + 21, 17, GOLD_MD);

          // Cintos Ultra Detalhados
          box(jX + 11, 22, 10, 3, COAT_DK); // Fundo sombreado
          box(jX + 12, 22, 8, 1, BELT_GREEN); // Cinto Cima
          box(jX + 12, 24, 8, 1, BELT_RED); // Cinto Baixo
          
          // Dupla Fivelagem
          box(jX + 13, 22, 3, 3, GOLD_DK); // Fivela Maior Base
          box(jX + 14, 22, 1, 2, GOLD_LT); // Fivela Maior Brilho
          box(jX + 17, 23, 2, 2, SILVER_MD); // Segunda Fivela
          headDot(jX + 17, 23, SILVER_LT); 

          // Abas do Casaco (Movimento das costas)
          const cWave = (f % 4 === 1) ? 1 : (f % 4 === 3) ? -1 : 0;
          box(jX + 6 + cWave, 20, 4, 10, COAT_DK); // Aba Traseira escura
          box(jX + 7 + cWave, 21, 2, 8, COAT_MD); 
          box(jX + 21 + (cWave * -1), 20, 3, 9, COAT_MD); // Aba Frontal
          box(jX + 22 + (cWave * -1), 20, 1, 8, COAT_LT); 

          // --- CHAPÉU & CABELO REFEITOS ---
          // Copa superior do chapéu
          headBox(jX + 10, -2, 9, 5, COAT_MD); 
          headBox(jX + 11, -2, 7, 1, COAT_HL); // Brilho no topo
          
          // Hair removed user request. Only hat remains.
          
          // Aba do Chapéu (Plana e destacada)
          headBox(jX + 9, 3, 14, 2, COAT_DK); // Sombra da aba grossa
          headBox(jX + 10, 3, 13, 1, COAT_LT); // Edge highlight 
          headDot(jX + 22, 3, COAT_HL); // Ponta extrema da aba brilhando
          
          // Emblemas de Ouro (Mão e Âncora isoladas)
          headBox(jX + 12, 1, 2, 2, GOLD_MD); // Mão menor
          headBox(jX + 16, 1, 2, 2, GOLD_MD); // Âncora menor

          // --- ROSTO SUPER CLEAN ANIME ---
          headBox(jX + 11, 5, 8, 7, SKIN_MD); // Rosto base
          
          // Sombra da Aba mais leve e limpa, menos intrusiva
          headBox(jX + 11, 5, 8, 1, SKIN_DK); 
          
          // Olhos limpos (Estilo Jotaro original bem nítido)
          headBox(jX + 12, 7, 2, 1, 0xffffff); // Sclera L
          headBox(jX + 16, 7, 2, 1, 0xffffff); // Sclera R
          headDot(jX + 13, 7, 0x000000); // Íris L olhando frente
          headDot(jX + 16, 7, 0x000000); // Íris R olhando frente
          
          // Sobrancelhas retas e grossas mas sem se unirem bizarramente
          headBox(jX + 12, 6, 2, 1, HAIR_DK); 
          headBox(jX + 16, 6, 2, 1, HAIR_DK); 
          
          // Boca linha reta sutil
          headBox(jX + 13, 10, 4, 1, 0x000000); // Boca super discreta preta ou marrom escuro

          // --- BRAÇOS CROSS/POCKET ---
          box(jX + 8, 14, 3, 3, COAT_MD); // Ombro Trás
          box(jX + 21, 14, 3, 3, COAT_MD); // Ombro Frente
          
          box(jX + 8, 16, 3, 7, COAT_DK); // Braço trás Base
          box(jX + 9, 17, 1, 5, COAT_MD); // Braço trás Volume
          
          box(jX + 21, 16, 3, 7, COAT_DK); // Braço frente Base
          box(jX + 22, 17, 1, 5, COAT_MD); // Braço frente Volume
          
          // Braço de ataque dele
          if (isAttack && !isTransformed) {
              box(jX + 18, 13, 10, 5, COAT_MD); 
              box(jX + 18, 13, 10, 1, COAT_LT); 
              box(jX + 28, 13, 4, 4, SKIN_MD); 
              box(jX + 28, 13, 2, 2, SKIN_LT); 
              box(jX + 8,  14, 4, 8, COAT_DK); 
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

    if (!scene.textures.exists("jotaro")) { generateForm(0); }
    if (!scene.textures.exists("jotaro_ssj")) { generateForm(1); }
    if (!scene.textures.exists("jotaro_ui")) { generateForm(2); }
}
