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

        const jX = isTransformed ? (isAttack ? 0 : 4) : 0;

        // ==========================================
        // === STAR PLATINUM (OFFICIAL ANIME MASTERPIECE) ===
        // ==========================================
        if (isTransformed) {
          // Posicionamento do Stand:
          // Em idle/walk/defend: Flutuando majestosamente atrás do ombro de Jotaro (spX = -8, spY = -3)
          // Em attack: Stand avançando e desferindo rajada ORA ORA (spX = 6, spY = -3)
          const spX = isAttack ? 6 : -8;
          const spY = f % 4 < 2 ? -3 : -2;

          // --- PALETA FIEL AO ANIME / ARTE OFICIAL ---
          // Pele: Azul cerúleo / pervinca com sombras profundas em lilás/violeta
          const SP_SKIN_SHADOW = 0x38235c; // Sombra violeta profunda
          const SP_SKIN_DK = 0x4864ab;     // Azul índigo base
          const SP_SKIN_MD = 0x618ee3;     // Azul celeste icônico
          const SP_SKIN_LT = 0x8cb4f8;     // Realce de luz azul
          const SP_SKIN_HL = 0xc2d9ff;     // Brilho especular dos músculos

          // Linhas de Energia Douradas (Faixas anatômicas icônicas no peito/abdômen/pernas)
          const SP_LINE_DK = 0xb45309;
          const SP_LINE_MD = 0xf59e0b;
          const SP_LINE_LT = 0xfde047;

          // Cabelo: Juba negra imponente e volumosa com reflexos violeta
          const SP_HAIR_BLACK = 0x0c0614;
          const SP_HAIR_DK = 0x1b0e2d;
          const SP_HAIR_MD = 0x30184f;
          const SP_HAIR_HL = 0x4d287c;

          // Armadura Dourada (Tiara, Ombreiras, Medalhões, Joelheiras)
          const SP_GOLD_DK = 0x854d0e;
          const SP_GOLD_MD = 0xd97706;
          const SP_GOLD_LT = 0xfacc15;
          const SP_GOLD_HL = 0xfef08a;

          // Echarpe: Vermelho-alaranjado / Escarlate vivo
          const SP_SCARF_DK = 0x991b1b;
          const SP_SCARF_MD = 0xd94214;
          const SP_SCARF_LT = 0xf97316;
          const SP_SCARF_HL = 0xfdba74;

          // Luvas: Verde-oliva escuro / Couro com anéis de ouro
          const SP_GLOVE_DK = 0x052e16;
          const SP_GLOVE_MD = 0x14532d;
          const SP_GLOVE_LT = 0x166534;

          // Tanga de Seda: Branco com sombras azul-celeste suaves
          const SP_SILK_DK = 0x94a3b8;
          const SP_SILK_MD = 0xcbd5e1;
          const SP_SILK_LT = 0xf8fafc;

          // 1. AURA ESPIRITUAL (Chama divina azul-violeta translúcida)
          alphaBox(spX - 2, spY - 5, 24, 40, SP_SKIN_MD, 0.12);
          alphaBox(spX, spY - 2, 20, 34, SP_SKIN_LT, 0.18);

          // 2. JUBA DE CABELO SELVAGEM (WILD FLOWING MANE - ONDULADA E VOLUMOSA)
          // Massa posterior descendo suavemente atrás dos ombros
          headBox(spX + 2, spY - 3, 14, 11, SP_HAIR_BLACK);
          headBox(spX + 3, spY - 2, 12, 9, SP_HAIR_DK);

          // Plumas de cabelo ondulando para cima e para trás (como na arte oficial)
          headBox(spX + 4, spY - 7, 12, 5, SP_HAIR_BLACK);
          headBox(spX + 5, spY - 6, 10, 4, SP_HAIR_DK);
          headBox(spX + 6, spY - 6, 8, 2, SP_HAIR_MD);

          // Crista central e pontas dinâmicas curvadas ao vento
          headBox(spX + 7, spY - 11, 7, 5, SP_HAIR_BLACK);
          headBox(spX + 8, spY - 10, 5, 4, SP_HAIR_DK);
          headBox(spX + 9, spY - 10, 3, 2, SP_HAIR_HL);

          headBox(spX + 3, spY - 10, 4, 4, SP_HAIR_BLACK);
          headBox(spX + 4, spY - 9, 2, 3, SP_HAIR_MD);
          headDot(spX + 4, spY - 9, SP_HAIR_HL);

          headBox(spX + 13, spY - 9, 4, 3, SP_HAIR_BLACK);
          headDot(spX + 14, spY - 8, SP_HAIR_MD);

          // Mechas pontiagudas laterais emoldurando o rosto
          headBox(spX + 2, spY + 1, 2, 5, SP_HAIR_BLACK);
          headBox(spX + 14, spY + 1, 2, 5, SP_HAIR_BLACK);

          // 3. TIARA DOURADA & JOIA FRONTAL (CURVA COM GEMA TURQUESA)
          headBox(spX + 3, spY - 1, 12, 2, SP_GOLD_DK);
          headBox(spX + 4, spY - 1, 10, 1, SP_GOLD_MD);
          headDot(spX + 4, spY - 1, SP_GOLD_HL);
          headDot(spX + 13, spY - 1, SP_GOLD_HL);
          // Medalhão frontal da tiara com gema turquesa/ciano
          headBox(spX + 8, spY - 2, 2, 2, SP_GOLD_MD);
          headDot(spX + 8, spY - 1, 0x06b6d4); // Ciano brilhante
          headDot(spX + 9, spY - 1, 0x22d3ee); // Brilho facetado

          // 4. ROSTO GUERREIRO & OLHAR ARRASADOR
          headBox(spX + 4, spY + 1, 10, 6, SP_SKIN_DK);
          headBox(spX + 5, spY + 1, 8, 6, SP_SKIN_MD);
          headBox(spX + 4, spY + 1, 10, 1, SP_SKIN_SHADOW); // Sombra sob a tiara

          // Olhos Ferozes (Delineador preto marcante + Esclera branca + Pupila ciano-esmeralda)
          headBox(spX + 5, spY + 2, 3, 1, 0x000000); // Contorno olho L
          headBox(spX + 10, spY + 2, 3, 1, 0x000000); // Contorno olho R
          headBox(spX + 5, spY + 2, 2, 1, 0xffffff); // Esclera L
          headBox(spX + 11, spY + 2, 2, 1, 0xffffff); // Esclera R
          headDot(spX + 6, spY + 2, 0x06b6d4); // Íris turquesa L
          headDot(spX + 11, spY + 2, 0x06b6d4); // Íris turquesa R

          // Nariz delineado e maçãs do rosto
          headDot(spX + 8, spY + 3, SP_SKIN_SHADOW); // Ponte do nariz
          headDot(spX + 9, spY + 3, SP_SKIN_LT);     // Brilho nasal
          headDot(spX + 4, spY + 4, SP_SKIN_SHADOW); // Marcação facial guerreiro L
          headDot(spX + 13, spY + 4, SP_SKIN_SHADOW); // Marcação facial guerreiro R

          // Mandíbula e Expressão de Boca
          if (isAttack) {
            headBox(spX + 7, spY + 5, 4, 3, 0x240810); // Boca aberta em rugido ORA
            headBox(spX + 8, spY + 5, 2, 1, 0xffffff); // Dentes
            headBox(spX + 6, spY + 7, 6, 1, SP_SKIN_DK); // Queixo
          } else {
            headBox(spX + 7, spY + 5, 4, 1, 0x1e1533); // Boca cerrada estóica
            headBox(spX + 6, spY + 6, 6, 1, SP_SKIN_DK); // Queixo modelado
            headDot(spX + 8, spY + 6, SP_SKIN_LT);
          }

          // 5. ECHARPE ESCARLATE (SCARLET SCARF - DOBRAS NATURAIS)
          box(spX + 5, spY + 7, 8, 3, SP_SCARF_DK);
          box(spX + 6, spY + 7, 6, 2, SP_SCARF_MD);
          box(spX + 7, spY + 8, 4, 1, SP_SCARF_LT);
          headDot(spX + 8, spY + 7, SP_SCARF_HL);

          // 6. OMBREIRAS DOURADAS ESCULPIDAS (CURVED PAULDRONS)
          // Ombreira Esquerda com detalhes em camadas
          box(spX, spY + 8, 5, 5, SP_GOLD_DK);
          box(spX + 1, spY + 8, 3, 4, SP_GOLD_MD);
          box(spX + 1, spY + 8, 2, 1, SP_GOLD_LT);
          headDot(spX + 1, spY + 8, SP_GOLD_HL);

          // Ombreira Direita com detalhes em camadas
          box(spX + 13, spY + 8, 5, 5, SP_GOLD_DK);
          box(spX + 14, spY + 8, 3, 4, SP_GOLD_MD);
          box(spX + 14, spY + 8, 2, 1, SP_GOLD_LT);
          headDot(spX + 15, spY + 8, SP_GOLD_HL);

          // 7. PEITORAL E ABDÔMEN ESCULPIDO COM FAIXAS DOURADAS
          box(spX + 4, spY + 10, 10, 11, SP_SKIN_SHADOW); // Base sombreada violeta
          box(spX + 5, spY + 10, 8, 11, SP_SKIN_MD);       // Pele azul índigo

          // Peitoral Maior (Broad Blue Pecs)
          box(spX + 5, spY + 10, 3, 4, SP_SKIN_LT);
          box(spX + 10, spY + 10, 3, 4, SP_SKIN_LT);
          headDot(spX + 6, spY + 11, SP_SKIN_HL);
          headDot(spX + 11, spY + 11, SP_SKIN_HL);
          box(spX + 8, spY + 10, 2, 5, SP_SKIN_SHADOW); // Linha esternal

          // Linhas de Energia Douradas nos Músculos (Golden Body Ribbons)
          headDot(spX + 4, spY + 11, SP_LINE_MD);
          headDot(spX + 5, spY + 13, SP_LINE_LT);
          headDot(spX + 13, spY + 11, SP_LINE_MD);
          headDot(spX + 12, spY + 13, SP_LINE_LT);

          // Abdômen de 6 gomos (6-Pack Abs)
          box(spX + 6, spY + 15, 6, 6, SP_SKIN_MD);
          box(spX + 8, spY + 15, 2, 6, SP_SKIN_SHADOW); // Linea alba
          box(spX + 6, spY + 17, 6, 1, SP_SKIN_SHADOW); // Divisória horizontal
          box(spX + 6, spY + 19, 6, 1, SP_SKIN_SHADOW);
          headDot(spX + 6, spY + 15, SP_SKIN_LT);
          headDot(spX + 11, spY + 15, SP_SKIN_LT);
          headDot(spX + 6, spY + 18, SP_SKIN_LT);
          headDot(spX + 11, spY + 18, SP_SKIN_LT);

          // Linhas douradas nas laterais dos oblíquos
          headDot(spX + 5, spY + 16, SP_LINE_MD);
          headDot(spX + 12, spY + 16, SP_LINE_MD);
          headDot(spX + 5, spY + 19, SP_LINE_MD);
          headDot(spX + 12, spY + 19, SP_LINE_MD);

          // 8. CINTO DOURADO, MEDALHÕES DE QUADRIL E TANGA BRANCA
          box(spX + 4, spY + 21, 10, 2, SP_GOLD_DK);
          box(spX + 5, spY + 21, 8, 2, SP_GOLD_MD);
          headDot(spX + 8, spY + 21, SP_GOLD_HL);
          headDot(spX + 9, spY + 21, SP_GOLD_HL);

          // Medalhões dourados circulares nos quadris (como na arte oficial)
          box(spX + 3, spY + 20, 2, 3, SP_GOLD_MD);
          headDot(spX + 3, spY + 21, 0x06b6d4); // Gema ciano no medalhão L
          box(spX + 13, spY + 20, 2, 3, SP_GOLD_MD);
          headDot(spX + 14, spY + 21, 0x06b6d4); // Gema ciano no medalhão R

          // Tanga de Seda Branca com dobras fluidas (White Silk Loincloth)
          box(spX + 6, spY + 23, 6, 6, SP_SILK_DK);
          box(spX + 7, spY + 23, 4, 5, SP_SILK_MD);
          box(spX + 8, spY + 23, 2, 4, SP_SILK_LT);

          // 9. COXAS MUSCULOSAS AZUIS, JOELHEIRAS DOURADAS & BOTAS
          // Coxa Esquerda com linha dourada
          box(spX + 4, spY + 23, 3, 5, SP_SKIN_SHADOW);
          box(spX + 4, spY + 23, 2, 5, SP_SKIN_MD);
          headDot(spX + 5, spY + 24, SP_SKIN_LT);
          headDot(spX + 4, spY + 25, SP_LINE_MD); // Linha dourada na coxa L

          // Coxa Direita com linha dourada
          box(spX + 11, spY + 23, 3, 5, SP_SKIN_SHADOW);
          box(spX + 12, spY + 23, 2, 5, SP_SKIN_MD);
          headDot(spX + 12, spY + 24, SP_SKIN_LT);
          headDot(spX + 13, spY + 25, SP_LINE_MD); // Linha dourada na coxa R

          // Joelheiras Douradas (Golden Kneeguards)
          box(spX + 3, spY + 28, 4, 3, SP_GOLD_DK);
          box(spX + 4, spY + 28, 2, 2, SP_GOLD_MD);
          headDot(spX + 4, spY + 28, SP_GOLD_HL);

          box(spX + 11, spY + 28, 4, 3, SP_GOLD_DK);
          box(spX + 12, spY + 28, 2, 2, SP_GOLD_MD);
          headDot(spX + 12, spY + 28, SP_GOLD_HL);

          // Botas / Faixas Douradas nos Pés
          box(spX + 3, spY + 31, 4, 3, 0x12101e);
          box(spX + 3, spY + 32, 4, 1, SP_GOLD_MD);
          box(spX + 11, spY + 31, 4, 3, 0x12101e);
          box(spX + 11, spY + 32, 4, 1, SP_GOLD_MD);

          // 10. BRAÇOS, LUVAS VERDES COM REBITES DOURADOS & ATAQUE (ORA ORA)
          if (isAttack) {
            // Efeito visual de múltiplos socos (flurry speedlines)
            alphaBox(spX + 14, spY + 6, 26, 18, SP_SKIN_LT, 0.35);
            alphaBox(spX + 18, spY + 8, 22, 14, 0xffffff, 0.3);

            const shiftY1 = (f % 2) * 5;
            const shiftY2 = f % 2 === 0 ? 0 : 5;

            // Braço 1 (Superior) socando para frente (Azul + Faixa Dourada + Luva Verde)
            box(spX + 10, spY + 8 + shiftY1, 14, 4, SP_SKIN_MD);
            box(spX + 11, spY + 8 + shiftY1, 12, 1, SP_SKIN_LT);
            headDot(spX + 16, spY + 8 + shiftY1, SP_LINE_MD); // Faixa dourada no braço
            box(spX + 22, spY + 8 + shiftY1, 2, 4, SP_GOLD_MD); // Borda dourada da luva
            box(spX + 24, spY + 8 + shiftY1, 6, 5, SP_GLOVE_DK); // Luva verde-oliva
            box(spX + 26, spY + 8 + shiftY1, 4, 5, SP_GLOVE_MD); // Punho
            headDot(spX + 27, spY + 9 + shiftY1, SP_GOLD_LT); // Rebite dourado nos nós dos dedos

            // Braço 2 (Inferior) socando para frente
            box(spX + 12, spY + 14 - shiftY2, 14, 4, SP_SKIN_MD);
            box(spX + 13, spY + 14 - shiftY2, 12, 1, SP_SKIN_LT);
            headDot(spX + 18, spY + 14 - shiftY2, SP_LINE_MD);
            box(spX + 24, spY + 14 - shiftY2, 2, 4, SP_GOLD_MD);
            box(spX + 26, spY + 14 - shiftY2, 6, 5, SP_GLOVE_DK);
            box(spX + 28, spY + 14 - shiftY2, 4, 5, SP_GLOVE_MD);
            headDot(spX + 29, spY + 15 - shiftY2, SP_GOLD_LT);

            // Flashes de Impacto
            alphaBox(spX + 30, spY + 8 + shiftY1, 5, 5, SP_GOLD_LT, 0.85);
            alphaBox(spX + 32, spY + 14 - shiftY2, 5, 5, SP_GOLD_LT, 0.85);
          } else {
            // Braços em repouso (Bíceps azul com linhas douradas + Luvas verdes com rebite de ouro)
            box(spX + 1, spY + 11, 3, 6, SP_SKIN_SHADOW);
            box(spX + 2, spY + 11, 2, 5, SP_SKIN_MD);
            box(spX + 2, spY + 12, 1, 4, SP_SKIN_LT);
            headDot(spX + 2, spY + 13, SP_LINE_MD); // Faixa dourada no bíceps L

            box(spX + 14, spY + 11, 3, 6, SP_SKIN_SHADOW);
            box(spX + 14, spY + 11, 2, 5, SP_SKIN_MD);
            box(spX + 15, spY + 12, 1, 4, SP_SKIN_LT);
            headDot(spX + 15, spY + 13, SP_LINE_MD); // Faixa dourada no bíceps R

            // Luvas Verdes com acabamento dourado (como na arte oficial)
            box(spX, spY + 17, 4, 1, SP_GOLD_MD); // Borda dourada do punho L
            box(spX, spY + 18, 4, 4, SP_GLOVE_DK);
            box(spX, spY + 18, 4, 2, SP_GLOVE_MD);
            headDot(spX + 1, spY + 20, SP_GOLD_LT); // Anel/Rebite dourado nos dedos L

            box(spX + 14, spY + 17, 4, 1, SP_GOLD_MD); // Borda dourada do punho R
            box(spX + 14, spY + 18, 4, 4, SP_GLOVE_DK);
            box(spX + 14, spY + 18, 4, 2, SP_GLOVE_MD);
            headDot(spX + 15, spY + 20, SP_GOLD_LT); // Anel/Rebite dourado nos dedos R
          }
        }

        // ==========================================
        // === JOTARO KUJO (ANIME ACCURATE REMASTER) ===
        // ==========================================

        // --- PANT & SHOE PROPORTIONS ---
        // Pelve / Sombra entre as pernas (impede buracos e riscos flutuantes)
        box(jX + 14, 23, 4, 2, 0x06060c);

        // Calças pretas de estudante delinquent (Gakuran Slacks)
        box(jX + 11, 23, 4, 8, COAT_DK); // Perna Esq Escura
        box(jX + 12, 23, 3, 8, COAT_MD); // Perna Esq Interior
        box(jX + 12, 24, 1, 6, COAT_LT); // Vincado / Luz da calça esq

        box(jX + 17, 23, 4, 8, COAT_DK); // Perna Dir Escura
        box(jX + 17, 23, 3, 8, COAT_MD); // Perna Dir Interior
        box(jX + 18, 24, 1, 6, COAT_LT); // Vincado / Luz da calça dir

        // Sapatos Sociais Pretos com Brilho de Couro
        box(jX + 10, 31, 5, 3, 0x050508); // Sola Esq
        box(jX + 17, 31, 5, 3, 0x050508); // Sola Dir
        box(jX + 11, 31, 4, 2, COAT_MD); // Couro Esq
        box(jX + 17, 31, 4, 2, COAT_MD); // Couro Dir
        headDot(jX + 12, 31, COAT_HL); // Brilho couro esq
        headDot(jX + 18, 31, COAT_HL); // Brilho couro dir

        // --- TRONCO & GAKURAN (Longcoat) ---
        // Casaco preto imponente (Ombros largos, corte atlético)
        box(jX + 8, 13, 16, 8, COAT_DK);

        // Camisa Interna (Magenta / Roxo profundo com sombreado muscular)
        box(jX + 12, 13, 8, 8, SHIRT_DK);
        box(jX + 13, 14, 6, 6, SHIRT_MD);
        box(jX + 14, 14, 2, 4, SHIRT_LT); // Pectoral Esq
        box(jX + 17, 14, 2, 4, SHIRT_LT); // Pectoral Dir
        box(jX + 15, 17, 2, 3, SHIRT_DK); // Divisória abdominal

        // Lapelas Abertas do Casaco (Gakuran Flaps)
        box(jX + 8, 13, 4, 8, COAT_MD);
        box(jX + 11, 13, 1, 8, COAT_LT); // Borda luz interna esq
        box(jX + 20, 13, 4, 8, COAT_MD);
        box(jX + 20, 13, 1, 8, COAT_LT); // Borda luz interna dir

        // Gola Alta Rígida (Gakuran Collar)
        box(jX + 10, 10, 12, 3, COAT_DK);
        box(jX + 11, 10, 10, 2, COAT_MD);
        box(jX + 11, 10, 2, 2, COAT_HL); // Luz da gola esq
        box(jX + 19, 10, 2, 2, COAT_HL); // Luz da gola dir

        // Pescoço & Sombra sob o Queixo
        box(jX + 13, 11, 6, 2, SKIN_DK); // Sombra do queixo no pescoço
        box(jX + 14, 12, 4, 1, SKIN_MD); // Pescoço

        // --- CORRENTE DOURADA ICÔNICA (Left Lapel Chain) ---
        headDot(jX + 12, 10, GOLD_LT); // Broche de fixação na gola
        headDot(jX + 12, 11, GOLD_MD);
        headDot(jX + 13, 12, GOLD_LT); // Elos da corrente descendo
        headDot(jX + 13, 13, GOLD_MD);
        headDot(jX + 14, 14, GOLD_LT);
        headDot(jX + 14, 15, GOLD_MD);
        headDot(jX + 14, 16, GOLD_DK); // Ponta da corrente

        // Botões Dourados da Lapela Direita
        headDot(jX + 21, 15, GOLD_MD);
        headDot(jX + 21, 17, GOLD_MD);

        // --- CINTURA & CINTOS (PERFEITAMENTE CONTIDOS, SEM RISCOS VOANDO) ---
        box(jX + 10, 21, 12, 2, COAT_DK); // Base escura da cintura
        box(jX + 11, 21, 10, 1, BELT_GREEN); // Cinto superior verde
        box(jX + 11, 22, 10, 1, BELT_RED); // Cinto inferior vermelho
        headDot(jX + 12, 21, 0xfacc15); // Detalhe amarelo cinto verde
        headDot(jX + 19, 21, 0xfacc15);
        headDot(jX + 13, 22, 0xf97316); // Detalhe laranja cinto vermelho
        headDot(jX + 18, 22, 0xf97316);

        // Fivela Dourada Central
        box(jX + 14, 21, 4, 2, GOLD_DK);
        box(jX + 15, 21, 2, 2, GOLD_LT);

        // --- ABAS LATERAIS DO SOBRETUDO (Gakuran Coat Flaps) ---
        // Casaco descendo naturalmente pelas laterais das pernas
        box(jX + 7, 21, 4, 8, COAT_DK); // Aba lateral esquerda
        box(jX + 8, 21, 3, 8, COAT_MD);
        box(jX + 8, 22, 1, 6, COAT_LT);

        box(jX + 21, 21, 4, 8, COAT_DK); // Aba lateral direita
        box(jX + 21, 21, 3, 8, COAT_MD);
        box(jX + 23, 22, 1, 6, COAT_LT);

        // Movimento sutil na ponta traseira do casaco
        const cWave = f % 4 === 1 ? 1 : f % 4 === 3 ? -1 : 0;
        box(jX + 6 + cWave, 26, 2, 4, COAT_DK);

        // --- CHAPÉU & CABELO DO JOTARO (LIMPO, SEM DEGRAUS OU ESPINHOS) ---
        // Copa do Chapéu
        headBox(jX + 11, -1, 10, 1, COAT_DK); // Topo suave
        headBox(jX + 12, -1, 8, 1, COAT_MD);
        headBox(jX + 13, -1, 6, 1, COAT_HL); // Brilho superior
        headBox(jX + 11, 0, 10, 3, COAT_DK); // Corpo principal do chapéu
        headBox(jX + 12, 0, 8, 3, COAT_MD);

        // Cabelo fundido suavemente atrás do chapéu na nuca (Sem pontos ou espinhos laterais)
        headBox(jX + 10, 1, 1, 5, HAIR_DK);
        headBox(jX + 10, 6, 2, 2, HAIR_DK);

        // Aba frontal do Chapéu
        headBox(jX + 10, 3, 12, 2, COAT_DK); // Aba base
        headBox(jX + 11, 3, 11, 1, COAT_LT); // Borda iluminada
        headDot(jX + 21, 3, COAT_HL); // Brilho no canto direito da aba

        // Emblemas de Ouro Proporcionais no Chapéu
        // 1. Mão Dourada (Palma)
        headBox(jX + 13, 0, 3, 3, GOLD_DK);
        headBox(jX + 13, 0, 3, 2, GOLD_MD);
        headDot(jX + 13, 0, GOLD_LT); // Polegar
        headDot(jX + 14, 0, GOLD_LT); // Dedos
        headDot(jX + 14, 1, GOLD_DK); // Centro da palma

        // 2. Broche Dourado Redondo
        headBox(jX + 18, 1, 2, 2, GOLD_DK);
        headDot(jX + 18, 1, GOLD_LT);
        headDot(jX + 19, 1, GOLD_MD);

        // --- ROSTO ESTILIZADO ARAKI (Modelado, Expressivo e Sombreado) ---
        // Estrutura facial modelada (Têmporas -> Bochechas -> Mandíbula -> Queixo)
        headBox(jX + 11, 5, 10, 3, SKIN_MD); // Têmporas e olhos (y=5..7)
        headBox(jX + 11, 8, 10, 1, SKIN_MD); // Bochechas (y=8)
        headDot(jX + 11, 8, SKIN_DK); // Sombra maçã do rosto esq
        headDot(jX + 20, 8, SKIN_DK); // Sombra maçã do rosto dir
        headBox(jX + 12, 9, 8, 1, SKIN_MD);  // Mandíbula afinando (y=9)
        headBox(jX + 13, 10, 6, 1, SKIN_MD); // Queixo definido (y=10)

        // Sombra profunda sob a aba do chapéu (Olhar misterioso)
        headBox(jX + 11, 5, 10, 1, SKIN_DK);

        // Costeletas pontiagudas conectadas ao cabelo
        headBox(jX + 10, 5, 1, 4, HAIR_DK);
        headBox(jX + 21, 5, 1, 4, HAIR_DK);

        // Sobrancelhas Marcadas e Anguladas
        headBox(jX + 12, 6, 3, 1, HAIR_DK);
        headBox(jX + 17, 6, 3, 1, HAIR_DK);

        // Olhos Penetrantes (Esclera branca + Íris Verde-Azulada nítida + Pupila)
        headBox(jX + 12, 7, 3, 1, 0xffffff); // Esclera Esq
        headBox(jX + 17, 7, 3, 1, 0xffffff); // Esclera Dir
        headDot(jX + 13, 7, 0x0d9488); // Íris Teal/Verde Esq
        headDot(jX + 18, 7, 0x0d9488); // Íris Teal/Verde Dir
        headDot(jX + 14, 7, 0x111827); // Canto/Pupila Esq
        headDot(jX + 19, 7, 0x111827); // Canto/Pupila Dir

        // Nariz & Sombra da Ponte Nasal
        headDot(jX + 15, 8, SKIN_DK);
        headDot(jX + 15, 9, SKIN_DK);

        // Boca Estóica Delinquente
        headBox(jX + 14, 10, 4, 1, 0x3b1c1c);
        headDot(jX + 15, 10, 0x241010);

        // --- BRAÇOS E MÃOS (POSTURA EQUILIBRADA COM AS DUAS MÃOS VISÍVEIS) ---
        if (isAttack && !isTransformed) {
          // POSTURA DE SOCO DO JOTARO (FORMA BASE)
          // Braço Esquerdo (Puxado em guarda firme)
          box(jX + 4, 13, 4, 5, COAT_DK);
          box(jX + 5, 14, 2, 4, COAT_MD);
          box(jX + 5, 17, 3, 3, SKIN_MD);
          headDot(jX + 6, 17, SKIN_LT);

          // Braço Direito (Esticado em potente soco direto)
          box(jX + 18, 13, 10, 4, COAT_MD);
          box(jX + 18, 13, 10, 1, COAT_HL);
          box(jX + 28, 12, 6, 6, SKIN_MD); // Punho fechado frontal
          box(jX + 29, 13, 4, 4, SKIN_LT);
          headDot(jX + 31, 14, SKIN_DK); // Divisória dos dedos

          // Efeito de impacto do soco direto
          alphaBox(jX + 34, 12, 4, 6, 0xffffff, 0.6);
        } else if (isAttack && isTransformed) {
          // POSTURA ICÔNICA DO JOTARO APONTANDO ENQUANTO O STAND SOCA ("YARE YARE DAZE")
          // Braço Esquerdo (Mão no bolso)
          box(jX + 6, 13, 3, 5, COAT_DK);
          box(jX + 7, 14, 2, 4, COAT_MD);
          box(jX + 6, 18, 3, 4, COAT_DK);
          box(jX + 6, 22, 3, 2, SKIN_MD);

          // Braço Direito (Estendido para frente apontando o dedo com firmeza)
          box(jX + 20, 13, 8, 4, COAT_MD);
          box(jX + 20, 13, 8, 1, COAT_HL);
          box(jX + 28, 13, 4, 3, SKIN_MD); // Mão
          box(jX + 32, 14, 3, 1, SKIN_LT); // Dedo apontando para frente!
          headDot(jX + 29, 13, SKIN_LT);
        } else {
          // Braço Esquerdo (Idle / Andar / Defender)
          box(jX + 6, 13, 3, 5, COAT_DK); // Ombro Esq
          box(jX + 7, 14, 2, 4, COAT_MD);
          box(jX + 6, 18, 3, 4, COAT_DK); // Antebraço
          box(jX + 6, 22, 3, 2, SKIN_MD); // Mão Esquerda
          headDot(jX + 7, 22, SKIN_LT); // Nózinho dos dedos esq

          // Braço Direito (Idle / Andar / Defender)
          box(jX + 23, 13, 3, 5, COAT_DK); // Ombro Dir
          box(jX + 23, 14, 2, 4, COAT_MD);
          box(jX + 23, 18, 3, 4, COAT_DK); // Antebraço
          box(jX + 23, 22, 3, 2, SKIN_MD); // Mão Direita
          headDot(jX + 24, 22, SKIN_LT); // Nózinho dos dedos dir
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
      tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
      const fw = FRAME_WIDTH * SCALE;
      const fh = FRAME_HEIGHT * SCALE;
      for (let i = 0; i < FRAMES; i++) {
        tex.add(i.toString(), 0, i * fw, 0, fw, fh);
      }
    }
  };

  if (!scene.textures.exists("jotaro")) {
    generateForm(0);
  }
  if (!scene.textures.exists("jotaro_ssj")) {
    generateForm(1);
  }
  if (!scene.textures.exists("jotaro_ui")) {
    generateForm(2);
  }
}
