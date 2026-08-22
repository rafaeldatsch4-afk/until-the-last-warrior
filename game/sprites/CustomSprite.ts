import { ColorPalette } from "../utils/ColorPalette";
import Phaser from "phaser";
import { CharacterData } from "../types";

export function generateCustomSprite(
  scene: Phaser.Scene,
  charData: CharacterData,
) {
  const key = charData.key;
  const colors: CharacterData["customData"] = charData.customData || {
    gi1: ColorPalette.gi[0],
    gi2: ColorPalette.gi[1],
    hair: ColorPalette.hair[0],
    skin: ColorPalette.skin[0],
  };

  const generateForm = (form: number) => {
    const pAcc = colors.part_accessory || "none";
    let isDrawingHat = false;
    let torsoMinX = 999;
    let torsoMaxX = -999;
    let torsoMinY = 999;
    let torsoMaxY = -999;
    let isDrawingTorso = false;
    let isDrawingLegs = false;

    const isTransformed = form > 0;
    const isUI = form === 2;
    const SCALE = 2;
    const FRAME_WIDTH = 96;
    const FRAME_HEIGHT = 64;
    const DRAW_OFFSET_Y = 28;
    const FRAMES = 12;

    const sheetWidth = FRAME_WIDTH * SCALE * FRAMES;
    const sheetHeight = FRAME_HEIGHT * SCALE;
    const shiftX = 32;

    let textureName = key;
    if (isUI) textureName = `${key}_ui`;
    else if (isTransformed) textureName = `${key}_ssj`;

    if (scene.textures.exists(textureName)) {
      scene.textures.remove(textureName);
    }

    const canvas = scene.make.graphics({ x: 0, y: 0 });

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
        const wIndex = f - 4;
        let ox = 0;
        let oy = 0;

        const isLeftLeg = x < 16;
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

      const trackBounds = (px: number, py: number, w: number, h: number) => {
        if (isDrawingTorso && f === 0) {
          torsoMinX = Math.min(torsoMinX, px);
          torsoMaxX = Math.max(torsoMaxX, px + w - 1);
          torsoMinY = Math.min(torsoMinY, py);
          torsoMaxY = Math.max(torsoMaxY, py + h - 1);
        }
      };

      const dot = (x: number, y: number, color: number) => {
        const finalY = y < 24 ? y + breatheOffset : y;
        const { ox, oy } =
          isDrawingLegs && typeof getWalkOffsets === "function"
            ? getWalkOffsets(x, y)
            : { ox: 0, oy: 0 };
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) +
          shiftX +
          ox;
        const finalYPose =
          (isAttack || isDefend || isCharge || isWalk
            ? finalY + poseOffsetY / 2
            : finalY) + oy;
        trackBounds(finalX, finalYPose + DRAW_OFFSET_Y, 1, 1);
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
          isDrawingLegs && typeof getWalkOffsets === "function"
            ? getWalkOffsets(x, y)
            : { ox: 0, oy: 0 };
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) +
          shiftX +
          ox;
        const finalYPose =
          (isAttack || isDefend || isCharge || isWalk
            ? finalY + poseOffsetY / 2
            : finalY) + oy;
        trackBounds(finalX, finalYPose + DRAW_OFFSET_Y, w, h);
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
          isDrawingLegs && typeof getWalkOffsets === "function"
            ? getWalkOffsets(x, y)
            : { ox: 0, oy: 0 };
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) +
          shiftX +
          ox;
        const finalYPose =
          (isAttack || isDefend || isCharge || isWalk
            ? finalY + poseOffsetY / 2
            : finalY) + oy;
        trackBounds(finalX, finalYPose + DRAW_OFFSET_Y, w, h);
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
          isDrawingLegs && typeof getWalkOffsets === "function"
            ? getWalkOffsets(x, y)
            : { ox: 0, oy: 0 };

        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) +
          shiftX +
          ox;

        const finalYPose =
          isAttack || isDefend || isCharge || isWalk
            ? y + poseOffsetY / 2
            : y;

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
          isDrawingLegs && typeof getWalkOffsets === "function"
            ? getWalkOffsets(x, y)
            : { ox: 0, oy: 0 };
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) +
          shiftX +
          ox;
        const finalYPose =
          isAttack || isDefend || isCharge || isWalk
            ? y + poseOffsetY / 2
            : y;
        canvas.fillStyle(color, 1);
        canvas.fillRect(
          (offsetX + finalX) * SCALE,
          (finalYPose + breatheOffset + DRAW_OFFSET_Y) * SCALE,
          1 * SCALE,
          1 * SCALE,
        );
      };

      // Shading helpers
      const getShade = (c: number, darkenPct: number) =>
        Phaser.Display.Color.IntegerToColor(c).darken(darkenPct).color;
      const getLight = (c: number, lightenPct: number) =>
        Phaser.Display.Color.IntegerToColor(c).lighten(lightenPct).color;

      const WHITE = 0xffffff;
      const BLACK = 0x111111;

      const TORSO_1 = colors.color_torso_1 ?? colors.gi1;
      const TORSO_1_SHADOW = getShade(TORSO_1, 22);
      const TORSO_1_DEEP = getShade(TORSO_1, 40);
      const TORSO_1_LIGHT = getLight(TORSO_1, 18);

      const TORSO_2 = colors.color_torso_2 ?? colors.gi2;
      const TORSO_2_SHADOW = getShade(TORSO_2, 22);
      const TORSO_2_DEEP = getShade(TORSO_2, 40);
      const TORSO_2_LIGHT = getLight(TORSO_2, 18);

      const LEGS_1 = colors.color_legs_1 ?? colors.gi1;
      const LEGS_1_SHADOW = getShade(LEGS_1, 22);
      const LEGS_1_DEEP = getShade(LEGS_1, 40);
      const LEGS_1_LIGHT = getLight(LEGS_1, 18);

      const LEGS_2 = colors.color_legs_2 ?? colors.gi2;
      const LEGS_2_SHADOW = getShade(LEGS_2, 22);

      const FEET_1 = colors.color_feet_1 ?? colors.gi2;
      const FEET_1_SHADOW = getShade(FEET_1, 25);
      const FEET_1_LIGHT = getLight(FEET_1, 20);

      const FEET_2 = colors.color_feet_2 ?? colors.gi1;
      const FEET_2_SHADOW = getShade(FEET_2, 25);

      const HEAD_1 = colors.color_head_1 ?? colors.gi1;
      const HEAD_1_SHADOW = getShade(HEAD_1, 22);
      const HEAD_2 = colors.color_head_2 ?? colors.gi2;

      const ACC_1 = colors.color_acc_1 ?? colors.gi2;
      const ACC_1_SHADOW = getShade(ACC_1, 25);
      const ACC_1_LIGHT = getLight(ACC_1, 20);

      const SKIN_TONE = colors.skin;
      const SKIN_SHADOW = getShade(SKIN_TONE, 18);
      const SKIN_DEEP = getShade(SKIN_TONE, 35);
      const SKIN_LIGHT = getLight(SKIN_TONE, 16);

      const HAIR_BASE = colors.hair;
      let hairColor = HAIR_BASE;
      let eyeColor = 0x111111;
      let eyebrowColor = HAIR_BASE;

      if (isUI) {
        hairColor = 0xe0e0e0;
        eyeColor = 0xcccccc;
        eyebrowColor = 0x9e9e9e;
      } else if (isTransformed) {
        hairColor = 0xffea00;
        eyeColor = 0x00f2ff;
        eyebrowColor = 0xd4a000;
      }

      // @ts-ignore
      const pTorso = colors.part_torso || "goku";
      // @ts-ignore
      const pLegs = colors.part_legs || "goku";
      // @ts-ignore
      const pFeet = colors.part_feet || "goku";
      // @ts-ignore
      const pHead = colors.part_head || "goku";

      // ==========================================
      // 0. BACK ACCESSORIES (Cape, Scarf Tails)
      // ==========================================
      if (pAcc === "cape") {
        const capeColor = ACC_1 || 0xd92525;
        const capeShade = ACC_1_SHADOW;
        const capeDeep = getShade(capeColor, 45);
        if (isCharge || isAttack) {
          // Dynamic billowing cape in combat
          box(5, 14, 5, 18, capeDeep);
          box(6, 15, 4, 16, capeShade);
          box(22, 14, 6, 18, capeDeep);
          box(22, 15, 5, 16, capeShade);
          box(4, 26, 4, 8, capeColor);
          box(24, 26, 4, 8, capeColor);
        } else {
          // Resting heroic cape
          box(7, 14, 4, 18, capeDeep);
          box(8, 15, 3, 16, capeShade);
          box(21, 14, 4, 18, capeDeep);
          box(21, 15, 3, 16, capeShade);
          box(6, 28, 4, 5, capeColor);
          box(22, 28, 4, 5, capeColor);
        }
      } else if (pAcc === "scarf") {
        const scarfColor = ACC_1 || 0xd92525;
        const scarfShade = ACC_1_SHADOW;
        // Fluttering scarf tail behind character
        box(5, 14, 4, 3, scarfColor);
        box(3, 16, 4, 4, scarfShade);
        box(1, 19, 3, 5, scarfColor);
        box(0, 23, 2, 4, scarfShade);
      }

      // ==========================================
      // 1. LEGS
      // ==========================================
      isDrawingLegs = true;

      if (pLegs === "spiderman") {
        // High-definition Spider-Man tights (Lycra with anatomical contours)
        box(9, 23, 6, 6, LEGS_2_SHADOW); // Base L
        box(17, 23, 6, 6, LEGS_2_SHADOW); // Base R
        box(13, 23, 6, 2, LEGS_2_SHADOW); // Crotch

        box(10, 23, 4, 6, LEGS_2);
        box(18, 23, 4, 6, LEGS_2);

        // Quad highlights and inner seam
        box(11, 24, 2, 4, getLight(LEGS_2, 18));
        box(19, 24, 2, 4, getLight(LEGS_2, 18));
        box(10, 23, 1, 6, LEGS_2_SHADOW);
        box(21, 23, 1, 6, LEGS_2_SHADOW);
        // Knee articulation line
        box(10, 28, 4, 1, LEGS_2_SHADOW);
        box(18, 28, 4, 1, LEGS_2_SHADOW);
      } else if (pLegs === "jotaro") {
        // Structured Gakuran Tailored Slacks
        box(9, 23, 6, 6, LEGS_1_SHADOW);
        box(17, 23, 6, 6, LEGS_1_SHADOW);
        box(13, 23, 6, 2, LEGS_1_SHADOW);

        box(10, 23, 4, 6, LEGS_1);
        box(18, 23, 4, 6, LEGS_1);

        // Sharp vertical crease lines (JoJo fashion)
        box(11, 24, 1, 5, LEGS_1_LIGHT);
        box(19, 24, 1, 5, LEGS_1_LIGHT);
        box(12, 24, 1, 5, LEGS_1_DEEP);
        box(20, 24, 1, 5, LEGS_1_DEEP);

        // Double studded belts at waist
        box(10, 22, 12, 1, 0xd4a000); // Top gold/yellow belt
        box(10, 23, 12, 1, 0x111111); // Bottom black belt
        dot(12, 22, 0xffffff); // Belt studs
        dot(15, 22, 0xffffff);
        dot(18, 22, 0xffffff);
        // Hanging brass pocket chain
        dot(10, 24, 0xffd700);
        dot(9, 25, 0xffd700);
        dot(10, 26, 0xffd700);
      } else if (pLegs === "saitama") {
        // Saitama Hero Suit Pants
        box(9, 23, 6, 6, LEGS_1_SHADOW);
        box(17, 23, 6, 6, LEGS_1_SHADOW);
        box(13, 23, 6, 2, LEGS_1_SHADOW);

        box(10, 23, 4, 6, LEGS_1);
        box(18, 23, 4, 6, LEGS_1);

        // Clean quad volume
        box(11, 24, 2, 4, LEGS_1_LIGHT);
        box(19, 24, 2, 4, LEGS_1_LIGHT);

        // Reinforced knee pads
        box(10, 27, 4, 2, LEGS_1_SHADOW);
        box(18, 27, 4, 2, LEGS_1_SHADOW);
        box(11, 27, 2, 1, LEGS_1_LIGHT);
        box(19, 27, 2, 1, LEGS_1_LIGHT);
      } else if (pLegs === "vegeta") {
        // Saiyan Battle Spandex
        box(9, 23, 6, 6, LEGS_2_SHADOW);
        box(17, 23, 6, 6, LEGS_2_SHADOW);
        box(13, 23, 6, 2, LEGS_2_SHADOW);

        box(10, 23, 4, 6, LEGS_2);
        box(18, 23, 4, 6, LEGS_2);

        // Horizontal compression lines / muscle definition
        box(11, 24, 3, 1, getLight(LEGS_2, 20));
        box(19, 24, 3, 1, getLight(LEGS_2, 20));
        box(10, 26, 4, 1, LEGS_2_SHADOW);
        box(18, 26, 4, 1, LEGS_2_SHADOW);
        box(11, 27, 3, 1, getLight(LEGS_2, 15));
        box(19, 27, 3, 1, getLight(LEGS_2, 15));
      } else if (pLegs === "chapolim") {
        // Red tights + Yellow hero trunks
        // Red legs base
        box(9, 23, 6, 6, LEGS_1_SHADOW);
        box(17, 23, 6, 6, LEGS_1_SHADOW);
        box(13, 23, 6, 2, LEGS_1_SHADOW);

        box(10, 23, 4, 6, LEGS_1);
        box(18, 23, 4, 6, LEGS_1);

        // Yellow trunks overpants (y=23..25)
        box(9, 23, 14, 3, LEGS_2);
        box(9, 23, 1, 3, LEGS_2_SHADOW);
        box(22, 23, 1, 3, LEGS_2_SHADOW);
        box(14, 25, 4, 1, LEGS_2_SHADOW); // Crotch seam
        // Yellow belt waistband
        box(10, 22, 12, 1, LEGS_2_SHADOW);
      } else if (pLegs === "naruto") {
        // Orange Shinobi Pants with right leg medical wraps & shuriken holster
        box(9, 23, 6, 6, LEGS_1_SHADOW);
        box(17, 23, 6, 6, LEGS_1_SHADOW);
        box(13, 23, 6, 2, LEGS_1_SHADOW);

        box(10, 23, 4, 6, LEGS_1);
        box(18, 23, 4, 6, LEGS_1);

        // Deep anime baggy folds
        box(10, 25, 4, 1, LEGS_1_DEEP);
        box(18, 25, 4, 1, LEGS_1_DEEP);

        // Right leg white medical bandage wraps (x=17..22, y=24..26)
        box(17, 24, 6, 3, 0xffffff);
        box(17, 24, 1, 3, 0xbbbbbb);
        box(22, 24, 1, 3, 0xbbbbbb);
        box(18, 25, 4, 1, 0xdddddd);
        // Shuriken Holster pouch on right leg
        box(21, 25, 2, 2, 0x222222);
        box(21, 24, 2, 1, 0x444444);
      } else if (pLegs === "sasuke") {
        // Dark Hakama Shorts & Purple Shimenawa Rope Belt
        box(9, 23, 6, 6, LEGS_1_SHADOW);
        box(17, 23, 6, 6, LEGS_1_SHADOW);
        box(13, 23, 6, 2, LEGS_1_SHADOW);

        box(10, 23, 4, 6, LEGS_1);
        box(18, 23, 4, 6, LEGS_1);

        // Bare knee/thigh gap near bottom before sandals
        box(10, 27, 4, 2, SKIN_TONE);
        box(18, 27, 4, 2, SKIN_TONE);
        box(10, 27, 1, 2, SKIN_SHADOW);
        box(21, 27, 1, 2, SKIN_SHADOW);

        // Purple Rope Belt (Shimenawa) around waist
        const ROPE_PURPLE = LEGS_2 || 0x7c3aed;
        const ROPE_LIGHT = getLight(ROPE_PURPLE, 25);
        box(9, 22, 14, 2, ROPE_PURPLE);
        // Braided rope segments
        dot(10, 22, ROPE_LIGHT);
        dot(12, 22, ROPE_LIGHT);
        dot(14, 22, ROPE_LIGHT);
        dot(16, 22, ROPE_LIGHT);
        dot(18, 22, ROPE_LIGHT);
        dot(20, 22, ROPE_LIGHT);
        // Hanging knotted rope ends
        box(14, 24, 2, 4, ROPE_PURPLE);
        box(17, 24, 2, 3, ROPE_PURPLE);
      } else if (pLegs === "luffy") {
        // Rolled-up Blue Denim Shorts with fluffy frayed white cuffs
        box(9, 23, 6, 4, 0x1e3a8a); // Denim blue
        box(17, 23, 6, 4, 0x1e3a8a);
        box(13, 23, 6, 2, 0x172554);

        box(10, 23, 4, 3, 0x2563eb);
        box(18, 23, 4, 3, 0x2563eb);

        // White fluffy rolled cuffs at hems
        box(8, 26, 7, 2, 0xffffff);
        box(17, 26, 7, 2, 0xffffff);
        box(8, 27, 7, 1, 0xcccccc);
        box(17, 27, 7, 1, 0xcccccc);

        // Bare legs / knees underneath shorts
        box(10, 28, 4, 1, SKIN_TONE);
        box(18, 28, 4, 1, SKIN_TONE);
        box(10, 28, 1, 1, SKIN_SHADOW);
        box(21, 28, 1, 1, SKIN_SHADOW);

        // Yellow sash belt at waist
        box(9, 22, 14, 2, 0xfacc15);
        box(13, 23, 3, 3, 0xeab308); // Hanging sash tail
      } else {
        // Goku Iconic Baggy Dogi Pants
        box(9, 23, 6, 6, LEGS_1_SHADOW);
        box(17, 23, 6, 6, LEGS_1_SHADOW);
        box(13, 23, 6, 2, LEGS_1_SHADOW);

        box(10, 23, 4, 6, LEGS_1);
        box(18, 23, 4, 6, LEGS_1);

        // Dynamic Anime Knee and Inseam Folds
        box(11, 24, 2, 3, LEGS_1_LIGHT);
        box(19, 24, 2, 3, LEGS_1_LIGHT);
        box(10, 25, 4, 1, LEGS_1_DEEP);
        box(18, 25, 4, 1, LEGS_1_DEEP);
        box(10, 27, 4, 1, LEGS_1_SHADOW);
        box(18, 27, 4, 1, LEGS_1_SHADOW);

        // Thick Obi Belt (Dark Blue) with Hanging Knot
        box(9, 22, 14, 2, LEGS_2_SHADOW);
        box(10, 22, 12, 2, LEGS_2);
        box(10, 22, 12, 1, getLight(LEGS_2, 15));
        // Hanging sash tails
        box(12, 24, 2, 4, LEGS_2_SHADOW);
        box(13, 24, 2, 3, LEGS_2);
      }

      // ==========================================
      // 2. FEET & BOOTS
      // ==========================================
      if (pFeet === "spiderman") {
        // Red Spider-Man Boots with subtle webbing & traction sole
        box(8, 29, 6, 5, FEET_2_SHADOW);
        box(18, 29, 6, 5, FEET_2_SHADOW);

        box(9, 29, 5, 5, FEET_2);
        box(18, 29, 5, 5, FEET_2);

        // Shiny highlights & sole
        box(10, 30, 2, 3, getLight(FEET_2, 20));
        box(19, 30, 2, 3, getLight(FEET_2, 20));
        // Black sole grip
        box(8, 33, 7, 1, 0x111111);
        box(18, 33, 7, 1, 0x111111);
      } else if (pFeet === "chapolim") {
        // Yellow socks + Red retro sneakers with white bumper soles
        // Yellow socks
        box(9, 29, 5, 1, 0xfacc15);
        box(18, 29, 5, 1, 0xfacc15);
        // Red sneaker body
        box(8, 30, 6, 3, 0xd92525);
        box(18, 30, 6, 3, 0xd92525);
        // Yellow laces
        dot(10, 31, 0xfacc15);
        dot(19, 31, 0xfacc15);
        // White toe bumper & sole
        box(7, 32, 3, 2, 0xffffff);
        box(22, 32, 3, 2, 0xffffff);
        box(8, 33, 7, 1, 0xffffff);
        box(18, 33, 7, 1, 0xffffff);
      } else if (pFeet === "saitama") {
        // Tall Red Hero Boots with folded top collar
        box(8, 29, 6, 5, FEET_2_SHADOW);
        box(18, 29, 6, 5, FEET_2_SHADOW);

        box(9, 29, 5, 5, FEET_2);
        box(18, 29, 5, 5, FEET_2);

        // Folded collar cuff
        box(8, 29, 6, 1, getLight(FEET_2, 25));
        box(18, 29, 6, 1, getLight(FEET_2, 25));

        // Specular vertical shine
        box(10, 30, 1, 3, getLight(FEET_2, 30));
        box(19, 30, 1, 3, getLight(FEET_2, 30));

        // Sturdy sole
        box(8, 33, 7, 1, 0x222222);
        box(18, 33, 7, 1, 0x222222);
      } else if (pFeet === "vegeta") {
        // Saiyan Battle Armor Boots (White shell with golden ribbed toe cap)
        box(8, 29, 6, 5, 0xcccccc);
        box(18, 29, 6, 5, 0xcccccc);

        box(9, 29, 5, 4, 0xffffff);
        box(18, 29, 5, 4, 0xffffff);

        // Gold ribbed protective toe caps
        box(7, 31, 4, 3, 0xd4a000);
        box(21, 31, 4, 3, 0xd4a000);
        box(7, 32, 3, 1, 0xffd700);
        box(21, 32, 3, 1, 0xffd700);
        // Ribbed lines
        dot(8, 31, 0x8b6508);
        dot(22, 31, 0x8b6508);

        // Thick combat tread sole
        box(7, 33, 8, 1, 0x333333);
        box(18, 33, 8, 1, 0x333333);
      } else if (pFeet === "jotaro") {
        // Polished Formal Dress Shoes (Sharp toe gloss & heel)
        box(8, 29, 6, 5, 0x000000);
        box(18, 29, 6, 5, 0x000000);

        box(9, 29, 5, 4, 0x222222);
        box(18, 29, 5, 4, 0x222222);

        // Glossy specular highlight on toe leather
        box(8, 31, 2, 2, 0xffffff);
        box(22, 31, 2, 2, 0xffffff);
        box(10, 30, 1, 2, 0x888888);
        box(19, 30, 1, 2, 0x888888);

        // Shoe Heel Block & Sole
        box(8, 33, 7, 1, 0x111111);
        box(18, 33, 7, 1, 0x111111);
        dot(8, 33, 0x444444);
        dot(18, 33, 0x444444);
      } else if (pFeet === "naruto" || pFeet === "sasuke") {
        // Open-toe Shinobi Ninja Sandals
        // Fabric ankle sleeve
        box(9, 29, 5, 3, FEET_1_SHADOW);
        box(18, 29, 5, 3, FEET_1_SHADOW);
        box(10, 29, 3, 2, FEET_1);
        box(19, 29, 3, 2, FEET_1);

        // Exposed skin foot / toes
        box(8, 31, 6, 2, SKIN_TONE);
        box(18, 31, 6, 2, SKIN_TONE);
        box(8, 31, 1, 2, SKIN_SHADOW);
        box(23, 31, 1, 2, SKIN_SHADOW);
        // Toe separation dots
        dot(7, 32, SKIN_TONE);
        dot(23, 32, SKIN_TONE);
        dot(8, 32, SKIN_SHADOW);
        dot(22, 32, SKIN_SHADOW);

        // Ninja Wooden/Rubber Sole
        box(7, 33, 8, 1, 0x1a1a1a);
        box(18, 33, 8, 1, 0x1a1a1a);
      } else if (pFeet === "luffy") {
        // Straw/Wood Waraji Sandals
        box(9, 29, 4, 3, SKIN_TONE);
        box(18, 29, 4, 3, SKIN_TONE);
        box(8, 31, 6, 2, SKIN_TONE);
        box(18, 31, 6, 2, SKIN_TONE);

        // Brown Y-straps across foot
        dot(9, 31, 0x78350f);
        dot(11, 31, 0x78350f);
        dot(10, 32, 0x78350f);
        dot(19, 31, 0x78350f);
        dot(21, 31, 0x78350f);
        dot(20, 32, 0x78350f);

        // Straw woven sole
        box(7, 33, 8, 1, 0xb45309);
        box(18, 33, 8, 1, 0xb45309);
      } else {
        // Goku Martial Arts Boots (Dark blue boots with yellow cross ropes & red stripe)
        box(8, 29, 6, 5, FEET_1_SHADOW);
        box(18, 29, 6, 5, FEET_1_SHADOW);

        box(9, 29, 5, 5, FEET_1);
        box(18, 29, 5, 5, FEET_1);

        // Red central vertical stripe
        box(10, 29, 1, 4, 0xd92525);
        box(19, 29, 1, 4, 0xd92525);

        // Yellow rope cross-ties
        box(9, 30, 4, 1, 0xfacc15);
        box(18, 30, 4, 1, 0xfacc15);
        dot(9, 32, 0xfacc15);
        dot(21, 32, 0xfacc15);
        dot(18, 32, 0xfacc15);
        dot(22, 32, 0xfacc15);

        // Ankle top rim padding
        box(8, 29, 6, 1, getLight(FEET_1, 20));
        box(18, 29, 6, 1, getLight(FEET_1, 20));

        // Black traction sole
        box(7, 33, 8, 1, 0x111111);
        box(18, 33, 8, 1, 0x111111);
      }

      isDrawingLegs = false;

      // ==========================================
      // 3. TORSO & ARMS
      // ==========================================
      isDrawingTorso = true;

      if (pTorso === "spiderman") {
        // High-definition Spider-Man Suit
        // Red center chest with blue side panels
        box(11, 14, 10, 9, TORSO_2); // Blue base
        box(13, 14, 6, 9, TORSO_1); // Red center
        box(11, 14, 2, 9, TORSO_2); // Blue left
        box(19, 14, 2, 9, TORSO_2); // Blue right

        // Muscle contouring on red center
        box(13, 14, 6, 1, TORSO_1_LIGHT); // Clavicles
        box(15, 14, 2, 4, TORSO_1_SHADOW); // Pec split
        box(14, 18, 4, 1, TORSO_1_SHADOW); // Ab line

        // Center Spider Emblem (Iconic black spider)
        box(15, 16, 2, 3, BLACK); // Body
        dot(15, 15, BLACK); // Head
        dot(16, 15, BLACK);
        // Legs branching out
        dot(13, 15, BLACK);
        dot(18, 15, BLACK);
        dot(14, 16, BLACK);
        dot(17, 16, BLACK);
        dot(14, 18, BLACK);
        dot(17, 18, BLACK);
        dot(13, 19, BLACK);
        dot(18, 19, BLACK);

        if (isCharge) {
          box(20, 4, 4, 11, TORSO_1);
          box(20, 2, 4, 3, TORSO_1);
          box(8, 4, 4, 11, TORSO_1);
          box(8, 2, 4, 3, TORSO_1);
        } else if (isAttack) {
          box(20, 13, 6, 5, TORSO_1);
          box(25, 14, 7, 4, TORSO_1);
          box(32, 13, 4, 5, TORSO_1); // Punch fist
          // Back arm
          box(6, 14, 4, 4, TORSO_1);
          box(5, 17, 4, 6, TORSO_1);
        } else {
          // Resting / Stance arms
          box(7, 14, 4, 5, TORSO_1); // Shoulder red
          box(21, 14, 4, 5, TORSO_1);
          box(7, 18, 4, 3, TORSO_2); // Bicep blue
          box(21, 18, 4, 3, TORSO_2);
          box(7, 21, 4, 5, TORSO_1); // Gauntlet red
          box(21, 21, 4, 5, TORSO_1);
          box(7, 25, 3, 2, TORSO_1_SHADOW);
          box(21, 25, 3, 2, TORSO_1_SHADOW);
        }
      } else if (pTorso === "jotaro") {
        // Gakuran Long Overcoat & Tight Ribbed Muscle Shirt & Golden Chain
        // Ribbed Undershirt
        box(13, 14, 6, 9, TORSO_2_SHADOW);
        box(14, 14, 4, 9, TORSO_2);
        // Muscle lines visible through shirt
        box(15, 14, 2, 4, TORSO_2_DEEP);
        box(14, 19, 4, 1, TORSO_2_DEEP);

        // Open Gakuran Overcoat Flaps (Left and Right)
        box(10, 13, 4, 11, TORSO_1_SHADOW);
        box(18, 13, 4, 11, TORSO_1_SHADOW);
        box(11, 13, 2, 11, TORSO_1);
        box(19, 13, 2, 11, TORSO_1);
        // Wide structured lapels
        box(10, 12, 3, 4, TORSO_1_LIGHT);
        box(19, 12, 3, 4, TORSO_1_LIGHT);

        // Iconic Heavy Golden Chain draped from collar across chest
        box(12, 13, 2, 1, 0xffd700);
        dot(13, 14, 0xffd700);
        dot(14, 15, 0xffd700);
        dot(15, 16, 0xffd700);
        dot(16, 17, 0xffd700);
        dot(17, 18, 0xffd700);
        // Chain link shadows
        dot(13, 15, 0xb45309);
        dot(15, 17, 0xb45309);

        if (isCharge) {
          box(20, 4, 5, 11, TORSO_1);
          box(20, 2, 4, 3, SKIN_TONE);
          box(7, 4, 5, 11, TORSO_1);
          box(7, 2, 4, 3, SKIN_TONE);
        } else if (isAttack) {
          // ORA ORA Punching extension
          box(19, 13, 6, 5, TORSO_1);
          box(24, 14, 8, 4, TORSO_1);
          box(32, 13, 5, 5, SKIN_TONE); // Big fist
          box(32, 14, 2, 2, SKIN_SHADOW);
          // Back arm
          box(6, 14, 5, 4, TORSO_1);
          box(5, 17, 4, 6, TORSO_1);
          box(5, 23, 4, 2, SKIN_TONE);
        } else {
          // Long coat sleeves
          box(7, 14, 5, 10, TORSO_1_SHADOW);
          box(8, 14, 3, 9, TORSO_1);
          box(7, 24, 4, 2, SKIN_TONE); // Hand

          box(20, 14, 5, 10, TORSO_1_SHADOW);
          box(21, 14, 3, 9, TORSO_1);
          box(21, 24, 4, 2, SKIN_TONE);
        }
      } else if (pTorso === "vegeta") {
        // Saiyan Battle Armor (White/Gold chestplate & ribbed bodysuit)
        // Dark blue bodysuit base
        box(11, 14, 10, 9, TORSO_2_SHADOW);
        box(12, 14, 8, 9, TORSO_2);

        // Armor Plate (White chest armor with golden pectoral segments)
        box(12, 14, 8, 5, 0xffffff);
        box(12, 14, 1, 5, 0xcccccc);
        box(19, 14, 1, 5, 0xcccccc);

        // Golden Pectoral Shields
        box(13, 15, 3, 3, 0xffd700);
        box(16, 15, 3, 3, 0xffd700);
        box(13, 17, 3, 1, 0xd4a000);
        box(16, 17, 3, 1, 0xd4a000);
        // Specular glint
        dot(14, 15, 0xffffff);
        dot(17, 15, 0xffffff);

        // Abdominal horizontal flexible armor ribs
        box(13, 19, 6, 1, 0xd4a000);
        box(13, 21, 6, 1, 0xd4a000);

        if (isCharge) {
          box(20, 4, 4, 10, TORSO_2);
          box(20, 2, 4, 4, 0xffffff); // White gloves
          box(8, 4, 4, 10, TORSO_2);
          box(8, 2, 4, 4, 0xffffff);
        } else if (isAttack) {
          // Shoulder Pad front
          box(20, 12, 6, 3, 0xffd700);
          box(21, 12, 4, 1, 0xffffff);
          box(24, 14, 7, 4, TORSO_2);
          box(31, 13, 5, 5, 0xffffff); // White glove fist
          // Back arm
          box(6, 12, 5, 3, 0xffd700);
          box(5, 15, 4, 6, TORSO_2);
          box(5, 21, 4, 4, 0xffffff);
        } else {
          // Golden Shoulder Epaulet Guards
          box(6, 12, 6, 3, 0xffd700);
          box(6, 12, 5, 1, 0xffffff);
          box(6, 14, 6, 1, 0xd4a000);

          box(20, 12, 6, 3, 0xffd700);
          box(21, 12, 5, 1, 0xffffff);
          box(20, 14, 6, 1, 0xd4a000);

          // Bodysuit arms
          box(7, 15, 4, 5, TORSO_2);
          box(21, 15, 4, 5, TORSO_2);

          // Flared White Saiyan Gloves
          box(6, 20, 5, 2, 0xffffff); // Flared cuff
          box(21, 20, 5, 2, 0xffffff);
          box(7, 22, 4, 4, 0xffffff); // Glove body & hand
          box(21, 22, 4, 4, 0xffffff);
          box(7, 24, 4, 1, 0xcccccc); // Shadow
          box(21, 24, 4, 1, 0xcccccc);
        }
      } else if (pTorso === "saitama") {
        // Saitama Hero Jumpsuit & Cape Clasps & Belt
        box(11, 14, 10, 9, TORSO_1_SHADOW);
        box(12, 14, 8, 9, TORSO_1);

        // Muscle contouring on jumpsuit
        box(15, 14, 2, 4, TORSO_1_SHADOW);
        box(14, 19, 4, 1, TORSO_1_SHADOW);

        // Silver Zipper at collar
        box(15, 14, 2, 3, 0xd1d5db);
        dot(15, 17, 0x6b7280); // Pull tab

        // Cape Buttons / Shoulder Discs (Red or Gloves color)
        dot(12, 15, TORSO_2);
        dot(19, 15, TORSO_2);
        dot(12, 15, 0xffffff); // Glint
        dot(19, 15, 0xffffff);

        // Wide Black Belt with Polished Gold Buckle
        box(11, 22, 10, 2, 0x111111);
        box(14, 21, 4, 3, 0xffd700); // Buckle
        box(15, 22, 2, 1, 0x111111); // Center hole
        dot(14, 21, 0xffffff); // Buckle shine

        if (isCharge) {
          box(20, 4, 4, 10, TORSO_1);
          box(20, 2, 4, 4, TORSO_2); // Red gloves
          box(8, 4, 4, 10, TORSO_1);
          box(8, 2, 4, 4, TORSO_2);
        } else if (isAttack) {
          // ONE PUNCH!
          box(19, 13, 6, 5, TORSO_1);
          box(24, 14, 6, 4, TORSO_1);
          box(30, 13, 6, 5, TORSO_2); // Big Red Fist
          box(30, 13, 6, 1, getLight(TORSO_2, 25)); // Specular fist highlight
          // Back arm
          box(6, 14, 4, 4, TORSO_1);
          box(5, 17, 4, 4, TORSO_1);
          box(5, 21, 4, 4, TORSO_2);
        } else {
          // Arms in yellow jumpsuit
          box(7, 14, 4, 6, TORSO_1);
          box(21, 14, 4, 6, TORSO_1);
          box(7, 14, 1, 6, TORSO_1_SHADOW);
          box(24, 14, 1, 6, TORSO_1_SHADOW);

          // Red Superhero Gloves with Flared Cuffs
          box(6, 20, 5, 2, TORSO_2); // Cuff
          box(21, 20, 5, 2, TORSO_2);
          box(7, 22, 4, 4, TORSO_2); // Hand
          box(21, 22, 4, 4, TORSO_2);
          box(7, 24, 4, 1, TORSO_2_SHADOW);
          box(21, 24, 4, 1, TORSO_2_SHADOW);
        }
      } else if (pTorso === "chapolim") {
        // Chapolim Superhero Tunic with Yellow Heart "CH" Shield
        box(11, 14, 10, 9, TORSO_1_SHADOW);
        box(12, 14, 8, 9, TORSO_1);

        // Yellow Heart Shield Emblem
        box(12, 15, 8, 4, TORSO_2); // Top lobes
        box(13, 19, 6, 1, TORSO_2); // Taper
        box(15, 20, 2, 1, TORSO_2); // Point

        // Crisp "CH" monogram inside the heart
        // C
        box(13, 16, 2, 1, TORSO_1_SHADOW);
        box(13, 17, 1, 1, TORSO_1_SHADOW);
        box(13, 18, 2, 1, TORSO_1_SHADOW);
        // H
        box(16, 16, 1, 3, TORSO_1_SHADOW);
        box(18, 16, 1, 3, TORSO_1_SHADOW);
        box(17, 17, 1, 1, TORSO_1_SHADOW);

        if (isCharge) {
          box(20, 4, 4, 10, TORSO_1);
          box(20, 2, 4, 3, SKIN_TONE);
          box(8, 4, 4, 10, TORSO_1);
          box(8, 2, 4, 3, SKIN_TONE);
        } else if (isAttack) {
          box(19, 13, 6, 5, TORSO_1);
          box(24, 14, 7, 4, TORSO_1);
          box(31, 13, 4, 5, SKIN_TONE);
          // Back arm
          box(6, 14, 4, 4, TORSO_1);
          box(5, 17, 4, 6, TORSO_1);
          box(5, 23, 4, 2, SKIN_TONE);
        } else {
          box(7, 14, 4, 8, TORSO_1);
          box(21, 14, 4, 8, TORSO_1);
          // Yellow cuff trim
          box(7, 22, 4, 1, TORSO_2);
          box(21, 22, 4, 1, TORSO_2);
          box(7, 23, 4, 2, SKIN_TONE); // Hands
          box(21, 23, 4, 2, SKIN_TONE);
        }
      } else if (pTorso === "muscle") {
        // Sem Camisa (Torso Nu / Ultra Definido 8-Pack & Serratus)
        box(11, 14, 10, 9, SKIN_SHADOW);
        box(12, 14, 8, 9, SKIN_TONE);

        // Defined Lateral Latissimus V-Taper
        box(11, 14, 1, 9, SKIN_DEEP);
        box(20, 14, 1, 9, SKIN_DEEP);

        // Clavicles & Collarbone
        box(12, 14, 3, 1, SKIN_SHADOW);
        box(17, 14, 3, 1, SKIN_SHADOW);

        // Sculpted Pectorals with Top Sheen & Bottom Shadow
        box(15, 14, 2, 4, SKIN_DEEP); // Cleavage line
        box(13, 17, 3, 1, SKIN_DEEP); // Under-pec L
        box(16, 17, 3, 1, SKIN_DEEP); // Under-pec R
        box(13, 15, 2, 2, SKIN_LIGHT); // Pec highlight L
        box(17, 15, 2, 2, SKIN_LIGHT); // Pec highlight R

        // 8-Pack Abdominal Muscles
        box(15, 18, 2, 5, SKIN_DEEP); // Center line
        box(13, 19, 6, 1, SKIN_DEEP); // Horizontal break 1
        box(13, 21, 6, 1, SKIN_DEEP); // Horizontal break 2
        // Abs volume highlights
        dot(13, 18, SKIN_LIGHT);
        dot(18, 18, SKIN_LIGHT);
        dot(13, 20, SKIN_LIGHT);
        dot(18, 20, SKIN_LIGHT);

        if (isCharge) {
          box(20, 4, 4, 10, SKIN_TONE);
          box(20, 8, 4, 3, TORSO_1); // Wristbands
          box(20, 2, 4, 3, SKIN_TONE);
          box(8, 4, 4, 10, SKIN_TONE);
          box(8, 8, 4, 3, TORSO_1);
          box(8, 2, 4, 3, SKIN_TONE);
        } else if (isAttack) {
          box(19, 13, 6, 5, SKIN_TONE);
          box(24, 14, 7, 4, SKIN_TONE);
          box(29, 14, 2, 4, TORSO_1); // Wristband
          box(31, 13, 5, 5, SKIN_TONE);
          // Back arm
          box(6, 14, 4, 4, SKIN_TONE);
          box(5, 17, 4, 5, SKIN_TONE);
          box(5, 21, 4, 2, TORSO_1);
          box(5, 23, 4, 2, SKIN_TONE);
        } else {
          // Muscular bare arms
          box(7, 14, 4, 7, SKIN_TONE);
          box(21, 14, 4, 7, SKIN_TONE);
          box(7, 14, 1, 7, SKIN_SHADOW);
          box(24, 14, 1, 7, SKIN_SHADOW);
          // Bicep / Deltoid cuts
          dot(8, 17, SKIN_LIGHT);
          dot(22, 17, SKIN_LIGHT);

          // Martial Arts Wristbands
          box(7, 21, 4, 3, TORSO_1);
          box(21, 21, 4, 3, TORSO_1);
          box(7, 23, 4, 1, TORSO_1_SHADOW);
          box(21, 23, 4, 1, TORSO_1_SHADOW);

          // Hands
          box(7, 24, 3, 2, SKIN_TONE);
          box(21, 24, 3, 2, SKIN_TONE);
        }
      } else if (pTorso === "naruto") {
        // Naruto Shinobi Track Jacket (Orange with Blue Collar/Yoke & White Neck)
        box(11, 14, 10, 9, TORSO_1_SHADOW);
        box(12, 14, 8, 9, TORSO_1);

        // Blue shoulder yoke / collar
        box(11, 13, 10, 3, TORSO_2);
        box(11, 13, 10, 1, getLight(TORSO_2, 15));
        // High white collar inside
        box(13, 12, 6, 2, 0xffffff);

        // Black central zipper
        box(15, 14, 2, 9, 0x111111);
        dot(15, 14, 0xcccccc); // Zipper slider

        // Uzumaki spiral patch on left arm/chest
        dot(12, 17, 0xd92525);
        dot(13, 17, 0xd92525);

        if (isCharge) {
          box(20, 4, 4, 10, TORSO_1);
          box(20, 2, 4, 3, SKIN_TONE);
          box(8, 4, 4, 10, TORSO_1);
          box(8, 2, 4, 3, SKIN_TONE);
        } else if (isAttack) {
          // Rasengan wind-up punch
          box(19, 13, 6, 5, TORSO_1);
          box(24, 14, 7, 4, TORSO_1);
          box(31, 13, 5, 5, SKIN_TONE);
          // Back arm
          box(6, 14, 4, 4, TORSO_1);
          box(5, 17, 4, 6, TORSO_1);
          box(5, 23, 4, 2, SKIN_TONE);
        } else {
          box(7, 14, 4, 9, TORSO_1);
          box(21, 14, 4, 9, TORSO_1);
          // Blue upper sleeve caps
          box(7, 14, 4, 2, TORSO_2);
          box(21, 14, 4, 2, TORSO_2);
          // Hands
          box(7, 23, 4, 2, SKIN_TONE);
          box(21, 23, 4, 2, SKIN_TONE);
        }
      } else if (pTorso === "sasuke") {
        // Sasuke High-Collar Blue Tunic & Arm Warmers
        box(11, 14, 10, 9, TORSO_1_SHADOW);
        box(12, 14, 8, 9, TORSO_1);

        // High stand-up flared collar (Standing tall around the neck)
        box(10, 11, 12, 4, TORSO_1_SHADOW);
        box(11, 11, 10, 3, TORSO_1);
        box(11, 11, 10, 1, TORSO_1_LIGHT); // Top collar rim highlight

        // Front zipper line
        box(15, 14, 2, 9, TORSO_1_DEEP);
        box(15, 14, 1, 9, 0x444444);

        if (isCharge) {
          // Chidori charge pose
          box(20, 14, 4, 3, TORSO_1); // Sleeve cap
          box(20, 10, 4, 4, SKIN_TONE); // Bare bicep
          box(20, 4, 4, 6, 0xffffff); // White arm warmer
          box(20, 2, 4, 3, SKIN_TONE);

          box(7, 14, 4, 3, TORSO_1);
          box(7, 10, 4, 4, SKIN_TONE);
          box(7, 4, 4, 6, 0xffffff);
          box(7, 2, 4, 3, SKIN_TONE);
        } else if (isAttack) {
          box(19, 13, 5, 4, TORSO_1);
          box(24, 14, 3, 4, SKIN_TONE);
          box(27, 13, 5, 5, 0xffffff); // Arm warmer
          box(32, 13, 4, 5, SKIN_TONE);
          // Back arm
          box(6, 14, 4, 3, TORSO_1);
          box(5, 17, 4, 3, SKIN_TONE);
          box(5, 20, 4, 5, 0xffffff);
          box(5, 25, 4, 2, SKIN_TONE);
        } else {
          // Short sleeves with bare bicep gap & long arm warmers
          box(7, 14, 4, 4, TORSO_1);
          box(21, 14, 4, 4, TORSO_1);

          box(7, 18, 4, 3, SKIN_TONE); // Bare bicep gap
          box(21, 18, 4, 3, SKIN_TONE);

          box(7, 21, 4, 4, 0xffffff); // White arm warmer
          box(21, 21, 4, 4, 0xffffff);
          box(7, 21, 1, 4, 0xcccccc);
          box(24, 21, 1, 4, 0xcccccc);

          box(7, 25, 3, 2, SKIN_TONE); // Hand
          box(21, 25, 3, 2, SKIN_TONE);
        }
      } else if (pTorso === "luffy") {
        // Open Red Vest & Bare Chest with X-Scar
        box(11, 14, 10, 9, SKIN_SHADOW);
        box(12, 14, 8, 9, SKIN_TONE);

        // Open Red Vest Flaps (Left and Right)
        box(10, 14, 3, 9, TORSO_1_SHADOW);
        box(19, 14, 3, 9, TORSO_1_SHADOW);
        box(11, 14, 2, 9, TORSO_1);
        box(19, 14, 2, 9, TORSO_1);

        // Muscle Pectorals & Abs
        box(15, 14, 2, 4, SKIN_DEEP);
        box(14, 19, 4, 1, SKIN_DEEP);

        // Giant X-Scar on chest
        box(13, 16, 6, 1, 0xef4444);
        box(15, 14, 2, 5, 0xef4444);
        dot(14, 17, 0xb91c1c);
        dot(17, 17, 0xb91c1c);

        if (isCharge) {
          box(20, 4, 4, 10, SKIN_TONE);
          box(20, 14, 4, 3, TORSO_1); // Vest shoulder
          box(20, 2, 4, 3, SKIN_TONE);
          box(8, 4, 4, 10, SKIN_TONE);
          box(8, 14, 4, 3, TORSO_1);
          box(8, 2, 4, 3, SKIN_TONE);
        } else if (isAttack) {
          // GOMU GOMU PISTOL stretch!
          box(19, 13, 5, 4, TORSO_1);
          box(24, 14, 8, 3, SKIN_TONE);
          box(32, 13, 5, 5, SKIN_TONE);
          // Back arm
          box(6, 14, 4, 3, TORSO_1);
          box(5, 17, 4, 6, SKIN_TONE);
          box(5, 23, 4, 2, SKIN_TONE);
        } else {
          box(7, 14, 4, 3, TORSO_1); // Vest sleeve
          box(21, 14, 4, 3, TORSO_1);
          box(7, 17, 4, 8, SKIN_TONE); // Bare arm
          box(21, 17, 4, 8, SKIN_TONE);
          box(7, 25, 3, 2, SKIN_TONE);
          box(21, 25, 3, 2, SKIN_TONE);
        }
      } else {
        // Goku Iconic Martial Arts Gi (Torso)
        // Deep Blue Undershirt
        box(13, 14, 6, 9, TORSO_2_SHADOW);
        box(14, 14, 4, 9, TORSO_2);
        // Chest window
        box(14, 14, 4, 3, SKIN_SHADOW);
        box(15, 14, 2, 3, SKIN_TONE);

        // Orange Gi Over Flaps with Thick Fabric Folds
        box(10, 14, 4, 9, TORSO_1_SHADOW);
        box(18, 14, 4, 9, TORSO_1_SHADOW);
        box(11, 14, 2, 9, TORSO_1);
        box(19, 14, 2, 9, TORSO_1);

        // V-Neck Gi lapels
        box(11, 14, 1, 9, TORSO_1_LIGHT);
        box(20, 14, 1, 9, TORSO_1_LIGHT);

        // Gi folds
        dot(12, 17, TORSO_1_DEEP);
        dot(19, 17, TORSO_1_DEEP);

        if (isCharge) {
          box(20, 14, 4, 3, TORSO_1);
          box(20, 4, 4, 10, SKIN_TONE);
          box(20, 4, 4, 3, TORSO_2); // Blue wristband
          box(20, 2, 4, 3, SKIN_TONE);

          box(7, 14, 4, 3, TORSO_1);
          box(7, 4, 4, 10, SKIN_TONE);
          box(7, 4, 4, 3, TORSO_2);
          box(7, 2, 4, 3, SKIN_TONE);
        } else if (isAttack) {
          // Kamehameha punch
          box(18, 13, 5, 5, TORSO_1);
          box(23, 14, 6, 4, SKIN_TONE);
          box(29, 13, 3, 5, TORSO_2); // Wristband
          box(32, 13, 5, 5, SKIN_TONE); // Fist
          // Back arm
          box(6, 14, 4, 4, TORSO_1);
          box(5, 16, 4, 5, SKIN_TONE);
          box(5, 21, 4, 3, TORSO_2);
          box(5, 24, 4, 2, SKIN_TONE);
        } else {
          // Orange shoulder sleeves
          box(7, 14, 5, 4, TORSO_1_SHADOW);
          box(8, 14, 3, 3, TORSO_1);
          box(7, 17, 4, 5, SKIN_TONE); // Bare bicep
          box(7, 22, 4, 3, TORSO_2); // Blue wristband
          box(7, 25, 3, 2, SKIN_TONE); // Hand

          box(20, 14, 5, 4, TORSO_1_SHADOW);
          box(21, 14, 3, 3, TORSO_1);
          box(21, 17, 4, 5, SKIN_TONE);
          box(21, 22, 4, 3, TORSO_2);
          box(21, 25, 3, 2, SKIN_TONE);
        }
      }

      isDrawingTorso = false;

      // ==========================================
      // 4. HEAD & FACE
      // ==========================================
      const hasStrawHat = pAcc === "straw_hat";

      if (pHead === "spiderman") {
        // Full Mask with Large Expressive Angled White Spider Eyes & Web Grid
        headBox(11, 5, 10, 8, HEAD_1_SHADOW);
        headBox(12, 5, 8, 8, HEAD_1);
        headBox(14, 13, 4, 1, HEAD_1); // Neck

        // Web pattern lines
        headBox(16, 5, 1, 7, 0x111111); // Center vertical
        headDot(13, 7, 0x111111);
        headDot(19, 7, 0x111111);
        headDot(12, 10, 0x111111);
        headDot(20, 10, 0x111111);

        // Large angled Spider-Man eyes with black border & white lens
        headBox(12, 7, 3, 3, 0x000000);
        headBox(13, 8, 2, 2, 0xffffff);
        headDot(14, 8, 0xffffff);

        headBox(17, 7, 3, 3, 0x000000);
        headBox(17, 8, 2, 2, 0xffffff);
        headDot(17, 8, 0xffffff);
      } else if (pHead === "saitama") {
        // Smooth Polished Bald Dome
        headBox(11, 5, 10, 8, SKIN_SHADOW);
        headBox(12, 5, 8, 8, SKIN_TONE);
        headBox(14, 13, 4, 1, SKIN_TONE);
        // Specular sheen on top of head
        if (!hasStrawHat) {
          headBox(14, 5, 3, 1, SKIN_LIGHT);
        }

        if (isCharge || isAttack) {
          // Serious Mode
          headBox(13, 8, 2, 1, 0x000000); // Fierce eyebrows
          headBox(17, 8, 2, 1, 0x000000);
          headBox(13, 9, 2, 2, 0xffffff);
          headBox(17, 9, 2, 2, 0xffffff);
          headDot(14, 9, 0x000000);
          headDot(17, 9, 0x000000);
          headBox(15, 11, 2, 1, 0x000000);
        } else {
          // Casual Derp Face
          headDot(14, 9, 0x000000);
          headDot(18, 9, 0x000000);
          headDot(14, 10, 0xffffff);
          headDot(18, 10, 0xffffff);
          headBox(15, 11, 2, 1, SKIN_SHADOW);
        }
      } else if (pHead === "chapolim") {
        // Red Cowl + Seamless Yellow Antennae with Pom-poms
        headBox(11, 5, 10, 8, HEAD_1_SHADOW);
        headBox(12, 5, 8, 8, HEAD_1);
        headBox(14, 13, 4, 1, SKIN_TONE);

        // Face opening in cowl
        headBox(13, 7, 6, 5, SKIN_TONE);

        if (hasStrawHat) {
          // Cute angled Antennae emerging from sides of the Straw Hat
          headBox(7, 2, 1, 4, HEAD_1);
          headBox(24, 2, 1, 4, HEAD_1);
          // Pom-poms on tips
          headBox(6, 0, 3, 2, HEAD_2);
          headBox(23, 0, 3, 2, HEAD_2);
        } else {
          headBox(11, 4, 10, 1, HEAD_1_SHADOW);
          headBox(12, 4, 8, 1, HEAD_1);
          // Antennae (anchored on cowl top y=2..4)
          headBox(12, 2, 1, 3, HEAD_1);
          headBox(19, 2, 1, 3, HEAD_1);
          // Pom-poms on tips
          headBox(11, 0, 3, 2, HEAD_2);
          headBox(18, 0, 3, 2, HEAD_2);
        }

        // Friendly eyes & smile
        headDot(14, 8, eyeColor);
        headDot(17, 8, eyeColor);
        headBox(15, 11, 2, 1, SKIN_SHADOW);
      } else if (pHead === "vegeta") {
        // Vegeta Widow's Peak & Flame Hair
        headBox(12, 6, 8, 7, SKIN_TONE);
        headBox(14, 13, 4, 1, SKIN_TONE);
        headBox(13, 12, 6, 1, SKIN_SHADOW);

        if (hasStrawHat) {
          // Sideburns and widow's peak under brim
          headBox(9, 5, 3, 5, hairColor);
          headBox(20, 5, 3, 5, hairColor);
          headDot(15, 6, hairColor);
          headDot(16, 6, hairColor);
        } else {
          // Widow's Peak forehead hairline
          headBox(12, 5, 8, 1, hairColor);
          headDot(15, 6, hairColor);
          headDot(16, 6, hairColor);

          // Aggressive Flame Hair mass
          headBox(10, 0, 12, 5, hairColor);
          headBox(10, -3, 12, 3, hairColor);
          headBox(11, -6, 10, 3, hairColor);
          headBox(12, -9, 8, 3, hairColor);
          headBox(13, -12, 6, 3, hairColor);
          headBox(14, -14, 4, 2, hairColor); // Center spike

          // Hair depth / highlights
          headBox(13, -8, 1, 6, isTransformed ? 0xffffff : 0x444444);
          headBox(17, -8, 1, 6, isTransformed ? 0xffffff : 0x444444);
        }

        // Fierce angled eyebrows
        headDot(12, 8, eyebrowColor);
        headDot(13, 8, eyebrowColor);
        headDot(14, 8, eyebrowColor);
        headDot(19, 8, eyebrowColor);
        headDot(18, 8, eyebrowColor);
        headDot(17, 8, eyebrowColor);

        // Eyes
        headBox(13, 9, 2, 1, 0xffffff);
        headBox(17, 9, 2, 1, 0xffffff);
        headDot(14, 9, eyeColor);
        headDot(17, 9, eyeColor);

        if (isAttack || isCharge) {
          headBox(14, 11, 4, 2, 0x000000);
        } else {
          headBox(14, 11, 4, 1, 0x111111);
        }
      } else if (pHead === "naruto") {
        // Naruto Spiky Blond Hair & Whiskers
        headBox(12, 6, 8, 7, SKIN_TONE);
        headBox(14, 13, 4, 1, SKIN_TONE);

        if (hasStrawHat) {
          // Side spikes and bangs framing under hat
          headBox(8, 5, 4, 4, hairColor);
          headBox(20, 5, 4, 4, hairColor);
          headBox(13, 6, 2, 1, hairColor);
          headBox(17, 6, 2, 1, hairColor);
        } else {
          // Spiky Hair
          headBox(10, 1, 12, 4, hairColor);
          headBox(11, -2, 3, 3, hairColor);
          headBox(15, -3, 3, 4, hairColor);
          headBox(18, -2, 3, 3, hairColor);
        }

        // Whiskers (3 on each cheek)
        dot(12, 9, 0x444444);
        dot(12, 10, 0x444444);
        dot(12, 11, 0x444444);
        dot(19, 9, 0x444444);
        dot(19, 10, 0x444444);
        dot(19, 11, 0x444444);

        // Eyes & Grin
        headBox(13, 8, 2, 1, 0xffffff);
        headBox(17, 8, 2, 1, 0xffffff);
        headDot(14, 8, eyeColor);
        headDot(17, 8, eyeColor);
        headBox(14, 11, 4, 1, 0x000000);
      } else if (pHead === "sasuke") {
        // Sasuke Layered Center-parted Bangs & Ducktail Spikes & Sharingan Eyes
        headBox(12, 6, 8, 7, SKIN_TONE);
        headBox(14, 13, 4, 1, SKIN_TONE);

        if (hasStrawHat) {
          // Front bangs framing cheeks
          headBox(8, 5, 3, 6, hairColor);
          headBox(21, 5, 3, 6, hairColor);
          headBox(14, 6, 4, 1, hairColor);
        } else {
          // Spiky Hair mass
          headBox(9, 0, 14, 7, hairColor);
          headBox(16, -2, 4, 3, hairColor); // Ducktail back spikes
          headBox(11, -1, 3, 2, hairColor);

          // Front bangs framing cheeks
          headBox(8, 4, 3, 7, hairColor);
          headBox(21, 4, 3, 7, hairColor);
          // Center parted V-bang
          headBox(14, 5, 4, 3, hairColor);
        }

        // Sharingan Eyes (Crimson with Tomoe pupil)
        headBox(13, 8, 2, 1, 0xffffff);
        headBox(17, 8, 2, 1, 0xffffff);
        headDot(14, 8, 0xef4444);
        headDot(17, 8, 0xef4444);
        dot(14, 8, 0x000000); // Tomoe dot
        dot(17, 8, 0x000000);

        headBox(14, 11, 4, 1, 0x000000); // Cool stoic line
      } else if (pHead === "jotaro") {
        // Gakuran Visor Cap Fused with Hair + Gold Hand Badge + Strong Jaw
        headBox(12, 6, 8, 7, SKIN_TONE);
        headBox(14, 13, 4, 1, SKIN_TONE);
        headBox(13, 11, 6, 2, SKIN_SHADOW);

        if (hasStrawHat) {
          // Side and back hair
          headBox(9, 6, 3, 6, hairColor);
          headBox(20, 6, 3, 6, hairColor);
          headBox(10, 10, 12, 3, hairColor);
        } else {
          // Hat Crown
          headBox(10, 1, 12, 4, HEAD_1);
          headBox(10, 1, 1, 4, HEAD_1_SHADOW);
          headBox(21, 1, 1, 4, HEAD_2);

          // Visor / Brim
          headBox(9, 4, 14, 2, HEAD_1);
          headBox(10, 5, 12, 1, 0x111111); // Shadow under brim on eyes

          // Gold Hand & Pin on Hat
          headBox(12, 2, 4, 2, 0xffd700);
          headBox(13, 3, 2, 1, 0xb45309);
          headBox(17, 2, 2, 2, HEAD_1_SHADOW);

          // Back Hair fusion
          headBox(9, 6, 2, 6, hairColor);
          headBox(21, 6, 2, 6, hairColor);
          headBox(10, 10, 12, 3, hairColor);
        }

        // Intense JoJo eyes
        headBox(13, 8, 2, 1, 0xffffff);
        headBox(17, 8, 2, 1, 0xffffff);
        headDot(14, 8, eyeColor);
        headDot(17, 8, eyeColor);

        headBox(14, 11, 4, 1, 0x000000);
      } else if (pHead === "luffy") {
        // Luffy Messy Hair, Under-Eye Scar & Confident Grin
        headBox(12, 6, 8, 7, SKIN_TONE);
        headBox(14, 13, 4, 1, SKIN_TONE);

        if (hasStrawHat) {
          // Side hair tufts and bangs peeking under the brim
          headBox(8, 5, 4, 4, hairColor);
          headBox(20, 5, 4, 4, hairColor);
          headBox(12, 6, 2, 2, hairColor);
          headBox(18, 6, 2, 2, hairColor);
        } else {
          // Messy Black Hair
          headBox(10, 1, 12, 5, hairColor);
          headBox(8, 3, 3, 4, hairColor);
          headBox(21, 3, 3, 4, hairColor);
        }

        // Eyes
        headBox(13, 8, 2, 1, 0xffffff);
        headBox(17, 8, 2, 1, 0xffffff);
        headDot(14, 8, 0x000000);
        headDot(17, 8, 0x000000);

        // Under-eye stitched scar
        dot(18, 10, 0xef4444);
        dot(17, 10, 0xef4444);

        // Wide White Grin
        headBox(14, 11, 4, 1, 0xffffff);
        headBox(14, 10, 4, 1, 0x000000);
      } else {
        // Goku Iconic Multi-layered Spiky Hair & Expressive Eyes
        headBox(12, 6, 8, 7, SKIN_TONE);
        headBox(14, 13, 4, 1, SKIN_TONE);
        headBox(13, 12, 6, 1, SKIN_SHADOW);

        if (hasStrawHat) {
          // Side hair tufts and front bangs peeking out from under the straw hat
          headBox(7, 5, 4, 5, hairColor);
          headBox(21, 5, 4, 5, hairColor);
          headBox(6, 7, 2, 3, hairColor);
          headBox(24, 7, 2, 3, hairColor);
          headBox(13, 6, 2, 2, hairColor);
          headBox(17, 6, 2, 2, hairColor);
        } else {
          // Hair Base & Spikes
          if (isTransformed && !isUI) {
            // Super Saiyan
            headBox(10, 0, 12, 6, hairColor);
            headBox(8, -2, 3, 6, hairColor);
            headBox(6, 0, 2, 4, hairColor);
            headBox(21, -2, 3, 6, hairColor);
            headBox(24, 0, 2, 4, hairColor);
            headBox(11, -6, 3, 6, hairColor);
            headBox(14, -8, 4, 8, hairColor);
            headBox(18, -5, 3, 5, hairColor);
            // Golden Inner Sheen
            headBox(13, -4, 2, 4, 0xffffff);
            headBox(15, -6, 2, 4, 0xffffff);
          } else if (isUI) {
            // Ultra Instinct
            headBox(10, 1, 12, 7, hairColor);
            headBox(14, -2, 4, 4, hairColor);
            headBox(8, 2, 3, 5, hairColor);
            headBox(21, 2, 3, 5, hairColor);
            headBox(12, 1, 2, 3, 0xffffff);
            headBox(18, 1, 2, 3, 0xffffff);
          } else {
            // Base Goku Hair
            headBox(10, 1, 12, 6, hairColor);
            headBox(6, 1, 4, 4, hairColor);
            headBox(8, -1, 4, 3, hairColor);
            headBox(22, 1, 4, 4, hairColor);
            headBox(20, -1, 4, 3, hairColor);
            headBox(12, -2, 4, 4, hairColor);
            headBox(16, -3, 4, 5, hairColor);
            // Front bangs
            headBox(13, 6, 2, 2, hairColor);
            headBox(17, 6, 2, 2, hairColor);
          }
        }

        // Eyes
        headBox(13, 8, 2, 1, 0xffffff);
        headBox(17, 8, 2, 1, 0xffffff);
        headDot(14, 8, eyeColor);
        headDot(17, 8, eyeColor);

        // Eyebrows
        headDot(13, 7, eyebrowColor);
        headDot(14, 7, eyebrowColor);
        headDot(17, 7, eyebrowColor);
        headDot(18, 7, eyebrowColor);

        if (isAttack) {
          headBox(15, 11, 2, 1, 0x440000);
        } else if (isCharge) {
          headBox(14, 11, 4, 2, 0x000000);
        } else {
          headDot(16, 11, 0x222222); // Smirk
        }
      }

      // ==========================================
      // 5. FRONT ACCESSORIES
      // ==========================================
      if (pAcc === "straw_hat") {
        // Masterwork Straw Hat (Ultra-detailed anime straw hat with woven texture)
        isDrawingHat = true;

        // Straw Hat Crown Dome (y=1..4)
        headBox(9, 1, 14, 4, 0xffd700);
        headBox(9, 1, 2, 4, 0xb48200); // Left shadow
        headBox(21, 1, 2, 4, 0xb48200); // Right shadow
        headBox(11, 1, 10, 1, 0xfff066); // Specular highlight sheen
        
        // Woven cross-hatch micro-texture on dome
        headDot(11, 2, 0xd4a000);
        headDot(13, 2, 0xd4a000);
        headDot(15, 2, 0xd4a000);
        headDot(17, 2, 0xd4a000);
        headDot(19, 2, 0xd4a000);
        headDot(12, 3, 0xd4a000);
        headDot(14, 3, 0xd4a000);
        headDot(16, 3, 0xd4a000);
        headDot(18, 3, 0xd4a000);
        headDot(20, 3, 0xd4a000);

        // Crimson Ribbon Band (y=4)
        headBox(9, 4, 14, 1, 0xef4444);
        headBox(9, 4, 2, 1, 0x991b1b);
        headBox(21, 4, 2, 1, 0x991b1b);
        headDot(10, 4, 0x7f1d1d);
        headDot(21, 4, 0x7f1d1d);

        // Wide Straw Brim (y=5..6) with organic curve
        headBox(4, 5, 24, 2, 0xa07100); // Under-brim shadow base
        headBox(5, 5, 22, 1, 0xffd700); // Main bright brim
        headBox(6, 4, 20, 1, 0xffea00); // Upper brim curve & sheen
        headBox(4, 6, 24, 1, 0x854d0e); // Rim bottom edge
        headDot(4, 5, 0xffd700); // Left brim upward flare
        headDot(27, 5, 0xffd700); // Right brim upward flare

        // Atmospheric cast shadow under brim onto face/mask
        alphaBox(10, 6, 12, 1, 0x000000, 0.35);

        // Chin Strap Cord & Leather Buckle
        headBox(9, 7, 1, 5, 0x78350f);
        headBox(22, 7, 1, 5, 0x78350f);
        headBox(10, 12, 2, 1, 0x78350f);
        headBox(20, 12, 2, 1, 0x78350f);
        headBox(12, 13, 8, 1, 0x78350f);
        headDot(16, 13, 0xd97706); // Wooden slider bead

        isDrawingHat = false;
      } else if (pAcc === "headband") {
        // Polished Konoha Shinobi Headband with Fluttering Cloth Ties
        const bandColor = ACC_1 || 0x1e293b;
        const bandShade = ACC_1_SHADOW;

        // Cloth Band wrapping forehead
        headBox(10, 4, 12, 3, bandColor);
        headBox(10, 6, 12, 1, bandShade);

        // Steel Plate (Centered on forehead)
        headBox(11, 4, 10, 3, 0xd1d5db); // Metallic silver
        headBox(11, 4, 10, 1, 0xf8fafc); // Top highlight shine
        headBox(11, 6, 10, 1, 0x64748b); // Bottom bevel

        // Corner Rivets (4 studs)
        headDot(12, 4, 0x1e293b);
        headDot(12, 6, 0x1e293b);
        headDot(19, 4, 0x1e293b);
        headDot(19, 6, 0x1e293b);

        // Engraved Leaf Swirl Symbol
        headDot(15, 5, 0x0f172a);
        headDot(16, 5, 0x0f172a);
        headDot(14, 5, 0x0f172a);

        // Rogue Slash across plate
        headDot(13, 6, 0x000000);
        headDot(15, 5, 0x000000);
        headDot(17, 4, 0x000000);

        // Fluttering Bandana Tails behind head
        headBox(7, 4, 3, 2, bandColor);
        headBox(5, 5, 3, 3, bandShade);
        headBox(4, 7, 2, 4, bandColor);
      } else if (pAcc === "scouter") {
        // Saiyan Scouter Headset (Translucent lens + Ear unit)
        // Ear bracket
        headBox(10, 7, 2, 4, 0xffffff);
        headBox(10, 8, 1, 2, 0xd4a000);

        // Translucent Glowing Green Lens over left eye
        alphaBox(12, 7, 4, 3, 0x22c55e, 0.65);
        // Optical reticle HUD lines
        dot(13, 8, 0xffffff);
        dot(15, 7, 0x22c55e);
      } else if (pAcc === "sword") {
        // Masterwork Katana (Steel Blade, Golden Tsuba, Braided Tsuka, Slash VFX)
        let handColor = SKIN_TONE;
        if (pTorso === "vegeta" || pTorso === "saitama") handColor = 0xffffff;
        else if (pTorso === "spiderman") handColor = TORSO_1;

        if (isCharge) {
          // Upward Blade Guard Stance
          box(21, -16, 3, 18, 0xd1d5db); // Steel blade
          box(23, -16, 1, 18, 0xffffff); // Edge highlight
          box(21, -16, 1, 18, 0x64748b); // Spine shadow

          box(19, 2, 7, 2, 0xffd700); // Golden Tsuba
          box(21, 4, 3, 6, 0x451a03); // Wrapped Tsuka
          box(21, 10, 3, 1, 0xffd700); // Pommel

          // Grip fingers over hilt
          box(20, 5, 4, 3, handColor);
        } else if (isAttack) {
          // Crescent Energy Slash Trail VFX
          alphaBox(24, 22, 10, 4, 0x38bdf8, 0.25);
          alphaBox(32, 17, 14, 4, 0x38bdf8, 0.45);
          alphaBox(42, 12, 16, 6, 0x38bdf8, 0.7);
          alphaBox(34, 18, 10, 2, 0xffffff, 0.85);

          // Forward Thrust Blade
          box(34, 13, 18, 3, 0xd1d5db);
          box(34, 13, 18, 1, 0xffffff); // Top edge shine
          box(34, 15, 18, 1, 0x64748b);

          box(32, 11, 2, 7, 0xffd700); // Tsuba
          box(27, 13, 5, 3, 0x451a03); // Tsuka
          box(26, 13, 1, 3, 0xffd700); // Pommel

          box(28, 13, 3, 3, handColor);
        } else {
          // Resting Sheathed / Drawn Katana in hand
          box(16, 23, 2, 3, 0xffd700); // Pommel
          box(18, 23, 6, 3, 0x451a03); // Tsuka (Braided hilt)
          box(24, 21, 2, 7, 0xffd700); // Golden Tsuba

          // Blade extending forward
          box(26, 23, 16, 3, 0xd1d5db);
          box(26, 23, 16, 1, 0xffffff); // Top shine
          box(26, 25, 16, 1, 0x64748b); // Spine
          // Kissaki tip curve
          box(42, 24, 2, 2, 0xd1d5db);
          box(42, 24, 2, 1, 0xffffff);

          // Fingers gripping hilt
          box(20, 23, 3, 3, handColor);
        }
      }

      // Universal Contact Shadows
      alphaBox(11, 23, 11, 1, 0x000000, 0.25); // Torso/legs seam
      alphaBox(9, 29, 14, 1, 0x000000, 0.2); // Legs/feet seam
      alphaBox(13, 13, 6, 1, 0x000000, 0.2); // Under-chin shadow
    }

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

    return {
      minX: torsoMinX <= torsoMaxX ? torsoMinX : 0,
      minY: torsoMinY <= torsoMaxY ? torsoMinY : 0,
      w: torsoMaxX >= torsoMinX ? torsoMaxX - torsoMinX + 1 : 0,
      h: torsoMaxY >= torsoMinY ? torsoMaxY - torsoMinY + 1 : 0,
    };
  };

  const bounds = generateForm(0);
  generateForm(1);
  generateForm(2);

  return { torsoBounds: bounds };
}
