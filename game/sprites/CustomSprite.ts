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
        if (!isWalk) return { ox: 0, oy: 0 };
        const wIndex = f - 4;
        let ox = 0,
          oy = 0;

        if (!isWalk || y < 22) return { ox: 0, oy: 0 };
        const isLeftLeg = x < 15;
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
        let drawY = y;
        let drawH = h;
        if (pAcc === "straw_hat" && !isDrawingHat && drawY < 5) {
          const diff = 5 - drawY;
          drawY = 5;
          drawH -= diff;
          if (drawH <= 0) return;
        }
        
        const { ox, oy } =
          isDrawingLegs && typeof getWalkOffsets === "function"
            ? getWalkOffsets(x, y)
            : { ox: 0, oy: 0 };
            
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) +
          shiftX +
          ox;
          
        const finalYPose =
          isAttack || isDefend || isCharge || isWalk ? drawY + poseOffsetY / 2 : drawY;
          
        canvas.fillStyle(color, 1);
        canvas.fillRect(
          (offsetX + finalX) * SCALE,
          (finalYPose + breatheOffset + DRAW_OFFSET_Y) * SCALE,
          w * SCALE,
          drawH * SCALE,
        );
      };

      const headDot = (x: number, y: number, color: number) => {
        if (pAcc === "straw_hat" && !isDrawingHat && y < 5) return;
        
        const { ox, oy } =
          isDrawingLegs && typeof getWalkOffsets === "function"
            ? getWalkOffsets(x, y)
            : { ox: 0, oy: 0 };
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) +
          shiftX +
          ox;
        const finalYPose =
          isAttack || isDefend || isCharge || isWalk ? y + poseOffsetY / 2 : y;
        canvas.fillStyle(color, 1);
        canvas.fillRect(
          (offsetX + finalX) * SCALE,
          (finalYPose + breatheOffset + DRAW_OFFSET_Y) * SCALE,
          1 * SCALE,
          1 * SCALE,
        );
      };
      const WHITE = 0xffffff;
      const BLACK = 0x111111;

      {
        const TORSO_1 = colors.color_torso_1 ?? colors.gi1;
        const TORSO_1_SHADOW =
          Phaser.Display.Color.IntegerToColor(TORSO_1).darken(20).color;
        const TORSO_2 = colors.color_torso_2 ?? colors.gi2;
        const TORSO_2_SHADOW =
          Phaser.Display.Color.IntegerToColor(TORSO_2).darken(20).color;

        const LEGS_1 = colors.color_legs_1 ?? colors.gi1;
        const LEGS_1_SHADOW =
          Phaser.Display.Color.IntegerToColor(LEGS_1).darken(20).color;
        const LEGS_2 = colors.color_legs_2 ?? colors.gi2;
        const LEGS_2_SHADOW =
          Phaser.Display.Color.IntegerToColor(LEGS_2).darken(20).color;

        const FEET_1 = colors.color_feet_1 ?? colors.gi2;
        const FEET_1_SHADOW =
          Phaser.Display.Color.IntegerToColor(FEET_1).darken(20).color;
        const FEET_2 = colors.color_feet_2 ?? colors.gi1;
        const FEET_2_SHADOW =
          Phaser.Display.Color.IntegerToColor(FEET_2).darken(20).color;

        const HEAD_1 = colors.color_head_1 ?? colors.gi1;

        const ACC_1 = colors.color_acc_1 ?? colors.gi2;

        const SKIN_TONE = colors.skin;
        const SKIN_SHADOW = Phaser.Display.Color.IntegerToColor(
          colors.skin,
        ).darken(20).color;
        const SKIN_DEEP = Phaser.Display.Color.IntegerToColor(
          colors.skin,
        ).darken(40).color;

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
        // @ts-ignore

        // ====================
        // LEGS
        // ====================
        isDrawingLegs = true;
        if (pLegs === "spiderman") {
          // Spiderman tight pants (blue with red boots later)
          box(10, 23, 4, 6, LEGS_2);
          box(18, 23, 4, 6, LEGS_2);
          box(14, 23, 4, 2, LEGS_2);
          box(10, 23, 1, 6, LEGS_2_SHADOW);
          box(21, 23, 1, 6, LEGS_2_SHADOW);
          box(12, 24, 1, 4, LEGS_2_SHADOW); // Inner thigh definition
          box(19, 24, 1, 4, LEGS_2_SHADOW);
        } else if (pLegs === "jotaro") {
          // --- FULL HD JOTARO LEGS ---
          // Thick, structured slacks
          box(9, 24, 6, 6, LEGS_1_SHADOW); // Left leg base
          box(17, 24, 6, 6, LEGS_1_SHADOW); // Right leg base
          box(13, 24, 6, 2, LEGS_1_SHADOW); // Crotch bridge
          
          // Leg volumes and crisp folds
          box(10, 24, 4, 6, LEGS_1); // Left thigh volume
          box(18, 24, 4, 6, LEGS_1); // Right thigh volume
          
          // Fabric creases (sharp anime shading)
          alphaBox(11, 25, 1, 4, 0x000000, 0.4); // Deep crease L
          alphaBox(19, 25, 1, 4, 0x000000, 0.4); // Deep crease R
          alphaBox(13, 27, 2, 1, 0x000000, 0.3); // Knee fold L
          alphaBox(17, 27, 2, 1, 0x000000, 0.3); // Knee fold R
          
          // Thigh highlights for material texture
          alphaBox(10, 24, 1, 5, 0xffffff, 0.15);
          alphaBox(21, 24, 1, 5, 0xffffff, 0.15);

          // Pocket chains
          box(9, 25, 1, 3, 0xffd700); // Outer chain
          box(10, 26, 1, 2, 0xffd700); // Inner loop
        } else if (pLegs === "saitama") {
          // Saitama yellow suit legs
          box(10, 23, 4, 6, LEGS_1);
          box(18, 23, 4, 6, LEGS_1);
          box(14, 23, 4, 2, LEGS_1);
          box(10, 23, 1, 6, LEGS_1_SHADOW);
          box(21, 23, 1, 6, LEGS_1_SHADOW);
          // Knee details
          box(11, 26, 2, 1, LEGS_1_SHADOW);
          box(19, 26, 2, 1, LEGS_1_SHADOW);
        } else if (pLegs === "vegeta") {
          // --- FULL HD VEGETA LEGS ---
          // Tight Spandex with heavy quad definitions
          box(9, 23, 5, 7, LEGS_2_SHADOW); // L leg base
          box(18, 23, 5, 7, LEGS_2_SHADOW); // R leg base
          box(10, 23, 3, 7, LEGS_2); // L core
          box(19, 23, 3, 7, LEGS_2); // R core
          
          box(13, 23, 6, 3, LEGS_2_SHADOW); // Crotch

          // Spandex Ribbing (Horizontal tension lines)
          alphaBox(9, 24, 5, 1, 0x000000, 0.4);
          alphaBox(18, 24, 5, 1, 0x000000, 0.4);
          alphaBox(9, 26, 5, 1, 0x000000, 0.4);
          alphaBox(18, 26, 5, 1, 0x000000, 0.4);
          alphaBox(9, 28, 5, 1, 0x000000, 0.4);
          alphaBox(18, 28, 5, 1, 0x000000, 0.4);
          
          // Specular highlight on spandex (Shiny)
          alphaBox(10, 23, 1, 7, 0xffffff, 0.3);
          alphaBox(21, 23, 1, 7, 0xffffff, 0.3);
        } else if (pLegs === "chapolim") {
          // Red tight pants
          box(10, 23, 4, 6, LEGS_1);
          box(18, 23, 4, 6, LEGS_1);
          box(14, 23, 4, 2, LEGS_1);
          box(10, 23, 1, 6, LEGS_1_SHADOW);
          box(21, 23, 1, 6, LEGS_1_SHADOW);
          // Yellow shorts over
          box(10, 23, 4, 3, LEGS_2);
          box(18, 23, 4, 3, LEGS_2);
          box(14, 23, 4, 3, LEGS_2);
          box(10, 23, 1, 3, TORSO_2_SHADOW);
          box(21, 23, 1, 3, TORSO_2_SHADOW);
        } else if (pLegs === "naruto") {
          // Orange baggy pants with bandage wrap on right leg
          box(9, 23, 7, 6, LEGS_1); // Orange
          box(16, 23, 7, 6, LEGS_1); // Orange
          box(9, 23, 1, 6, LEGS_1_SHADOW);
          box(22, 23, 1, 6, LEGS_1_SHADOW);
          // Bandage and kunai holster on right leg
          box(9, 26, 5, 2, 0xffffff); // White bandage
          box(9, 26, 1, 2, 0x111111); // Holster shadow
        } else if (pLegs === "sasuke") {
          // Grey/Dark blue shorts or baggy pants
          box(9, 23, 7, 6, LEGS_2); // Dark
          box(16, 23, 7, 6, LEGS_2); // Dark
          // Skirt/Robe flap
          box(8, 23, 3, 5, LEGS_1); // Light color flap
          box(21, 23, 3, 5, LEGS_1); // Light color flap
          box(9, 23, 1, 6, LEGS_2_SHADOW);
          box(22, 23, 1, 6, LEGS_2_SHADOW);
          box(10, 23, 12, 2, 0x5a2d6b); // Purple rope belt
          box(10, 24, 2, 4, 0x5a2d6b);
        } else if (pLegs === "luffy") {
          // Rolled up blue jeans
          box(9, 23, 7, 4, LEGS_2); // Blue
          box(16, 23, 7, 4, LEGS_2);
          box(9, 27, 7, 1, 0xe0e0e0); // White fluff
          box(16, 27, 7, 1, 0xe0e0e0);
          // Bare legs below
          box(10, 28, 4, 1, SKIN_TONE); 
          box(18, 28, 4, 1, SKIN_TONE);
        } else {
          // --- FULL HD GOKU LEGS ---
          // Baggy pants base shadow
          box(9, 25, 7, 5, LEGS_1_SHADOW); // Left leg base
          box(16, 25, 7, 5, LEGS_1_SHADOW); // Right leg base
          
          // Baggy pants volume
          box(10, 25, 5, 5, LEGS_1); // Left thigh
          box(17, 25, 5, 5, LEGS_1); // Right thigh
          box(13, 25, 6, 3, LEGS_1); // Crotch bridge

          // Folds/creases
          alphaBox(11, 25, 1, 5, 0x000000, 0.2); // inner crease L
          alphaBox(20, 25, 1, 5, 0x000000, 0.2); // inner crease R
          alphaBox(14, 26, 1, 4, 0x000000, 0.2); // middle fold L
          alphaBox(17, 26, 1, 4, 0x000000, 0.2); // middle fold R

          // Belt (Thick Obi)
          box(10, 23, 12, 2, LEGS_2_SHADOW); // Belt base shadow
          box(11, 23, 10, 2, LEGS_2); // Blue belt
          
          // Belt knot dangling
          box(12, 25, 3, 4, LEGS_2_SHADOW);
          box(13, 25, 2, 4, LEGS_2);
        }

        // ====================
        // FEET
        // ====================
        if (pFeet === "spiderman") {
          // --- FULL HD SPIDER-MAN BOOTS ---
          // Base shape
          box(9, 29, 6, 5, FEET_2_SHADOW);
          box(17, 29, 6, 5, FEET_2_SHADOW);
          box(10, 29, 4, 4, FEET_2);
          box(18, 29, 4, 4, FEET_2);
          
          // Web lines (intricate)
          alphaBox(9, 30, 6, 1, 0x000000, 0.6);
          alphaBox(17, 30, 6, 1, 0x000000, 0.6);
          alphaBox(9, 32, 6, 1, 0x000000, 0.6);
          alphaBox(17, 32, 6, 1, 0x000000, 0.6);
          
          // Boot soles
          box(9, 34, 6, 1, 0x111111);
          box(17, 34, 6, 1, 0x111111);
          
          // Boot tip highlights
          alphaBox(9, 33, 2, 1, 0xffffff, 0.3);
          alphaBox(21, 33, 2, 1, 0xffffff, 0.3);
        } else if (pFeet === "chapolim") {
          // --- FULL HD CHAPOLIM SHOES ---
          // Yellow socks / calves
          box(9, 29, 6, 3, FEET_1_SHADOW);
          box(17, 29, 6, 3, FEET_1_SHADOW);
          box(10, 29, 4, 2, FEET_1);
          box(18, 29, 4, 2, FEET_1);
          
          // Red sneakers with yellow laces
          box(8, 32, 7, 3, FEET_2_SHADOW);
          box(17, 32, 7, 3, FEET_2_SHADOW);
          box(9, 32, 5, 2, FEET_2);
          box(18, 32, 5, 2, FEET_2);
          
          // Laces
          box(10, 32, 2, 2, FEET_1);
          box(19, 32, 2, 2, FEET_1);
          
          // Soles
          box(8, 34, 7, 1, 0x333333);
          box(17, 34, 7, 1, 0x333333);
          
          // Tip highlights
          alphaBox(8, 33, 2, 1, 0xffffff, 0.3);
          alphaBox(22, 33, 2, 1, 0xffffff, 0.3);
        } else if (pFeet === "saitama") {
          // --- FULL HD SAITAMA BOOTS ---
          // Red boots with folds
          box(8, 28, 7, 2, FEET_2_SHADOW); // Boot top fold
          box(17, 28, 7, 2, FEET_2_SHADOW);
          box(9, 28, 5, 1, FEET_2);
          box(18, 28, 5, 1, FEET_2);
          
          box(9, 30, 6, 4, FEET_2_SHADOW);
          box(17, 30, 6, 4, FEET_2_SHADOW);
          box(10, 30, 4, 3, FEET_2);
          box(18, 30, 4, 3, FEET_2);
          
          // Sole
          box(9, 34, 6, 1, 0x111111);
          box(17, 34, 6, 1, 0x111111);
          
          // Reflections
          alphaBox(13, 31, 1, 2, 0xffffff, 0.4);
          alphaBox(21, 31, 1, 2, 0xffffff, 0.4);
        } else if (pFeet === "vegeta") {
          // --- FULL HD VEGETA BOOTS ---
          // White saiyan armor boots
          box(9, 29, 6, 5, 0xcccccc); // Base shadow
          box(17, 29, 6, 5, 0xcccccc);
          box(10, 29, 4, 4, 0xffffff); // Volume
          box(18, 29, 4, 4, 0xffffff);
          
          // Gold ribbed toes
          box(9, 33, 6, 1, 0xb8860b); // Gold shadow
          box(17, 33, 6, 1, 0xb8860b);
          box(10, 33, 4, 1, 0xffd700); // Gold toe
          box(18, 33, 4, 1, 0xffd700);
          
          // Ribbed lines on gold
          alphaBox(11, 33, 1, 1, 0x000000, 0.3);
          alphaBox(13, 33, 1, 1, 0x000000, 0.3);
          alphaBox(19, 33, 1, 1, 0x000000, 0.3);
          alphaBox(21, 33, 1, 1, 0x000000, 0.3);
          
          // Soles
          box(9, 34, 6, 1, 0x333333);
          box(17, 34, 6, 1, 0x333333);
        } else if (pFeet === "jotaro") {
          // --- FULL HD JOTARO SHOES ---
          // Expensive polished dress shoes
          box(8, 30, 6, 4, FEET_1_SHADOW); // Base silhouette L
          box(18, 30, 6, 4, FEET_1_SHADOW); // Base silhouette R
          
          // Leather upper volume
          box(9, 30, 4, 3, FEET_1);
          box(19, 30, 4, 3, FEET_1);
          
          // Sharp glossy shine
          box(10, 30, 2, 2, FEET_2); // White/bright gloss
          box(20, 30, 2, 2, FEET_2);
          
          // Shoe soles (Thick)
          box(8, 33, 6, 1, 0x111111);
          box(18, 33, 6, 1, 0x111111);
          // Heel bump
          box(8, 33, 2, 2, 0x000000);
          box(18, 33, 2, 2, 0x000000);
        } else if (pFeet === "naruto" || pFeet === "sasuke") {
          // --- FULL HD SHINOBI SANDALS ---
          // Base Skin (Bare foot and ankle)
          box(9, 29, 6, 5, SKIN_SHADOW);
          box(17, 29, 6, 5, SKIN_SHADOW);
          box(10, 29, 4, 4, SKIN_TONE);
          box(18, 29, 4, 4, SKIN_TONE);
          
          // Fabric calf warmer (Blue/Black)
          box(9, 29, 6, 2, FEET_1_SHADOW);
          box(10, 29, 4, 1, FEET_1);
          
          // Sandal straps crossing
          box(9, 31, 6, 2, FEET_1_SHADOW);
          box(10, 31, 4, 1, FEET_1);
          alphaBox(10, 32, 1, 1, 0x000000, 0.5); // strap hole exposing skin
          alphaBox(18, 32, 1, 1, 0x000000, 0.5);
          
          // Wooden/Rubber Sole
          box(9, 33, 6, 1, 0x222222); // Dark rim
          box(9, 34, 6, 1, 0x111111); // Bottom tread
          box(17, 33, 6, 1, 0x222222);
          box(17, 34, 6, 1, 0x111111);
          
          // Toes peeking out
          box(10, 33, 2, 1, SKIN_TONE);
          box(18, 33, 2, 1, SKIN_TONE);
        } else if (pFeet === "luffy") {
          // --- FULL HD LUFFY SANDALS ---
          // Bare feet with sandals
          box(9, 29, 6, 5, SKIN_SHADOW);
          box(17, 29, 6, 5, SKIN_SHADOW);
          box(10, 29, 4, 4, SKIN_TONE); 
          box(18, 29, 4, 4, SKIN_TONE);
          
          // Straps (Y-shape)
          box(10, 32, 4, 1, 0x8b4513); // Across
          box(18, 32, 4, 1, 0x8b4513);
          box(11, 33, 2, 1, 0x5c4033); // Down to toes
          box(19, 33, 2, 1, 0x5c4033);
          
          // Toes
          box(10, 33, 1, 1, SKIN_TONE);
          box(13, 33, 1, 1, SKIN_TONE);
          box(18, 33, 1, 1, SKIN_TONE);
          box(21, 33, 1, 1, SKIN_TONE);

          // Sole
          box(9, 34, 6, 1, 0x5c4033); // Dark wood sole
          box(17, 34, 6, 1, 0x5c4033);
        } else {
          // --- FULL HD GOKU BOOTS ---
          // Thick combat boots with straps
          box(9, 30, 6, 5, FEET_1_SHADOW); // L boot shadow base
          box(17, 30, 6, 5, FEET_1_SHADOW); // R boot shadow base
          box(10, 30, 4, 4, FEET_1); // L volume
          box(18, 30, 4, 4, FEET_1); // R volume
          
          // Yellow rope ties at the top
          box(9, 30, 6, 1, 0xd4a000); 
          box(10, 30, 4, 1, 0xffea00);
          box(17, 30, 6, 1, 0xd4a000);
          box(18, 30, 4, 1, 0xffea00);
          
          // Red Stripe running down
          box(11, 31, 2, 4, FEET_2);
          box(19, 31, 2, 4, FEET_2);
          
          // Boot tip highlights
          alphaBox(9, 33, 2, 1, 0xffffff, 0.3);
          alphaBox(21, 33, 2, 1, 0xffffff, 0.3);
          
          // Thick soles
          box(9, 34, 6, 1, 0x111111);
          box(17, 34, 6, 1, 0x111111);
        }

        // ====================
        // TORSO
        // ====================
        isDrawingLegs = false;
        isDrawingTorso = true;
        if (pTorso === "spiderman") {
          const SPIDER_OUTLINE = 0x1a0a00;
          box(13, 14, 6, 9, TORSO_1); // Core Red
          box(11, 14, 2, 9, TORSO_2); // Blue sides
          box(19, 14, 2, 9, TORSO_2);

          // Volume Shading (20% darker edges)
          box(13, 14, 1, 9, TORSO_1_SHADOW); // Inner red shadow
          box(18, 14, 1, 9, TORSO_1_SHADOW);
          box(11, 14, 1, 9, TORSO_2_SHADOW); // Outer blue shadow
          box(20, 14, 1, 9, TORSO_2_SHADOW);

          // Belt
          box(11, 22, 10, 2, TORSO_1);
          box(11, 22, 1, 2, TORSO_1_SHADOW); // Belt shadow left
          box(20, 22, 1, 2, TORSO_1_SHADOW); // Belt shadow right
          box(11, 23, 10, 1, SPIDER_OUTLINE); // Belt web line

          // Central Spider Logo (clean 6-pixel icon)
          box(15, 16, 2, 1, SPIDER_OUTLINE); // Center Body
          dot(14, 15, SPIDER_OUTLINE); // Top-left leg
          dot(17, 15, SPIDER_OUTLINE); // Top-right leg
          dot(14, 17, SPIDER_OUTLINE); // Bottom-left leg
          dot(17, 17, SPIDER_OUTLINE); // Bottom-right leg

          if (isCharge) {
            box(20, 4, 3, 10, TORSO_1);
            box(20, 14, 3, 3, TORSO_1);
            box(20, 2, 3, 3, TORSO_1); // Hands
            box(22, 2, 1, 15, TORSO_1_SHADOW); // Outer arm shadow

            box(9, 4, 3, 10, TORSO_1);
            box(9, 14, 3, 3, TORSO_1);
            box(9, 2, 3, 3, TORSO_1); // Hands
            box(9, 2, 1, 15, TORSO_1_SHADOW); // Outer arm shadow
          } else if (isAttack) {
            box(21, 14, 6, 3, TORSO_1); // shoulder
            box(27, 14, 5, 3, TORSO_1); // forearm
            box(32, 13, 4, 4, TORSO_1); // hand
            box(21, 16, 11, 1, TORSO_1_SHADOW); // under arm shadow
            box(32, 13, 1, 4, TORSO_1_SHADOW); // hand base shadow

            box(8, 14, 3, 4, TORSO_1);
            box(7, 18, 4, 4, TORSO_1);
            box(7, 14, 1, 8, TORSO_1_SHADOW); // back arm shadow
          } else {
            // Classic Idle Arms (Blue bicep, red glove)
            box(8, 14, 3, 4, TORSO_2); // shoulders
            box(21, 14, 3, 4, TORSO_2);
            box(8, 14, 1, 4, TORSO_2_SHADOW);
            box(23, 14, 1, 4, TORSO_2_SHADOW);

            // Forearm / Gloves
            box(8, 18, 3, 5, TORSO_1);
            box(21, 18, 3, 5, TORSO_1);
            box(8, 18, 1, 5, TORSO_1_SHADOW);
            box(23, 18, 1, 5, TORSO_1_SHADOW);

            // Glove Web Rings
            box(8, 19, 3, 1, SPIDER_OUTLINE);
            box(21, 19, 3, 1, SPIDER_OUTLINE);
            box(8, 21, 3, 1, SPIDER_OUTLINE);
            box(21, 21, 3, 1, SPIDER_OUTLINE);

            // Hands
            box(8, 23, 3, 2, TORSO_1);
            box(21, 23, 3, 2, TORSO_1);
            box(8, 23, 1, 2, TORSO_1_SHADOW);
            box(23, 23, 1, 2, TORSO_1_SHADOW);
          }
        } else if (pTorso === "jotaro") {
          // --- FULL HD JOTARO TORSO ---
          // Giant fluttering Gakuran Coat (Base/Back layer)
          box(7, 14, 4, 12, TORSO_1_SHADOW); // Huge left flair
          box(21, 14, 4, 12, TORSO_1_SHADOW); // Huge right flair
          box(8, 15, 2, 10, TORSO_1); // Flair volume highlight L
          box(22, 15, 2, 10, TORSO_1); // Flair volume highlight R
          
          // Wind flutter folds
          alphaBox(7, 20, 3, 2, 0x000000, 0.4);
          alphaBox(22, 18, 3, 2, 0x000000, 0.4);

          // Broad Shoulders & Main Coat Body
          box(10, 13, 12, 10, TORSO_1_SHADOW); // Thick shadow base
          box(11, 14, 10, 9, TORSO_1); // Coat core
          
          // Collar (High stiff collar)
          box(11, 12, 10, 3, TORSO_1);
          box(11, 12, 2, 3, TORSO_1_SHADOW); // L shadow
          box(19, 12, 2, 3, TORSO_1_SHADOW); // R shadow
          box(11, 12, 10, 1, 0xffd700); // Gold trim on collar

          // Inner tight shirt (Muscle fit)
          box(13, 14, 6, 9, TORSO_2_SHADOW);
          box(14, 14, 4, 9, TORSO_2);
          
          // Pectoral and Abdominal definition through the tight shirt
          alphaBox(14, 16, 4, 1, 0x000000, 0.3); // Pec under-shadow
          alphaBox(15, 18, 2, 1, 0x000000, 0.2); // Upper abs
          alphaBox(15, 20, 2, 1, 0x000000, 0.2); // Lower abs
          
          // Exposed chest/neck window
          box(14, 13, 4, 3, SKIN_SHADOW);
          box(15, 13, 2, 2, SKIN_TONE);
          
          // Massive Gold Chain
          box(12, 14, 2, 1, 0xffd700);
          box(13, 15, 1, 1, 0xffd700);
          box(12, 16, 2, 1, 0xffd700);
          box(11, 17, 1, 1, 0xffd700);
          alphaBox(12, 14, 2, 4, 0xffffff, 0.4); // Chain glint

          // Thick Open Lapels overlapping the shirt
          // Left Lapel
          box(11, 14, 2, 9, TORSO_1);
          box(12, 14, 1, 9, TORSO_2_SHADOW); // Lapel depth
          alphaBox(11, 14, 1, 9, 0xffffff, 0.15); // Edge highlight
          
          // Right Lapel
          box(19, 14, 2, 9, TORSO_1);
          box(19, 14, 1, 9, TORSO_2_SHADOW);
          alphaBox(20, 14, 1, 9, 0xffffff, 0.15);

          // Double Belts (JoJo trademark)
          // Belt 1
          box(12, 22, 8, 1, 0x111111); // Black leather
          box(14, 22, 2, 1, 0xffd700); // Buckle
          box(18, 22, 2, 1, 0xaaaaaa); // Studs
          // Belt 2 (tilted)
          box(11, 23, 10, 1, 0x773311); // Brown leather
          box(16, 23, 2, 1, 0xffd700); // Buckle
          box(13, 23, 1, 1, 0xaaaaaa); // Studs

          if (isCharge) {
            // Arms raised for Stand summoning / shouting
            box(20, 4, 4, 10, TORSO_1_SHADOW); // Front arm sleeve
            box(21, 5, 2, 8, TORSO_1); // Sleeve volume
            box(20, 2, 3, 3, SKIN_TONE); // Front hand
            
            box(8, 4, 4, 10, TORSO_1_SHADOW); // Back arm sleeve
            box(9, 5, 2, 8, TORSO_1);
            box(9, 2, 3, 3, SKIN_SHADOW); // Back hand (darker)
          } else if (isAttack) {
            // Dynamic attack pose pointing forward / punching
            box(18, 13, 12, 5, TORSO_1_SHADOW); // Front arm stretched
            box(19, 14, 10, 3, TORSO_1); // Stretched sleeve volume
            
            // Fists/Hands
            box(30, 13, 4, 4, SKIN_TONE);
            box(30, 14, 2, 2, SKIN_SHADOW); // knuckles
            
            // Back arm pulled back
            box(6, 14, 5, 7, TORSO_1_SHADOW);
            box(7, 15, 3, 5, TORSO_1);
          } else {
            // Stoic pose - hands in pockets (Jotaro signature)
            // Back Shoulder
            box(7, 14, 4, 4, TORSO_1);
            box(7, 14, 1, 4, 0xffffff); // Shoulder highlight
            
            // Back arm digging into pocket
            box(8, 17, 3, 6, TORSO_1_SHADOW); 
            box(9, 18, 1, 4, TORSO_1);
            
            // Front Shoulder
            box(21, 14, 4, 4, TORSO_1); 
            box(21, 14, 1, 4, 0xffffff); // Shoulder highlight
            
            // Front arm digging into pocket
            box(21, 17, 3, 6, TORSO_1_SHADOW); 
            box(22, 18, 1, 4, TORSO_1);
          }
        } else if (pTorso === "vegeta") {
          // Bodysuit underneath
          box(12, 19, 8, 4, TORSO_2_SHADOW);
          for (let ty = 19; ty < 23; ty += 2) {
            box(12, ty, 8, 1, TORSO_2_SHADOW);
            box(12, ty + 1, 8, 1, TORSO_2);
          }
          // Inner bodysuit shadows
          box(12, 19, 1, 5, TORSO_2_SHADOW);
          box(19, 19, 1, 5, TORSO_2_SHADOW);

          // Main armor block
          box(11, 14, 10, 5, TORSO_1_SHADOW); // Base shadow
          box(12, 14, 8, 5, TORSO_1); // White armor plate core

          // Side gold straps wrap (Classic Vegeta gold straps)
          box(11, 14, 1, 5, 0xffd700); // Gold strap left
          box(20, 14, 1, 5, 0xffd700); // Gold strap right
          // Strap shadows
          box(12, 14, 1, 5, 0xd4a000); 
          box(19, 14, 1, 5, 0xd4a000);

          // Chest segments (Angular Pectorals)
          box(11, 16, 4, 1, TORSO_1_SHADOW);
          box(17, 16, 4, 1, TORSO_1_SHADOW);
          box(15, 14, 2, 3, TORSO_1_SHADOW); // Center division

          // Abdomen armor segments (vertical ribbed plates)
          for (let rx = 13; rx <= 18; rx += 1) {
            if (rx % 2 !== 0) {
              box(rx, 17, 1, 2, TORSO_1_SHADOW);
            } else {
              box(rx, 17, 1, 2, TORSO_1);
            }
          }

          // Armor bright highlights
          box(13, 14, 2, 1, 0xffffff);
          box(17, 14, 2, 1, 0xffffff); // Top chest highlights

          // Under-armpit shading for depth (20% darker)
          box(11, 16, 2, 3, TORSO_1_SHADOW);
          box(19, 16, 2, 3, TORSO_1_SHADOW);

          if (isCharge) {
            box(20, 4, 3, 10, TORSO_2);
            
            // Shoulder pad (Charge)
            box(19, 13, 5, 4, 0xd4a000); // Gold hinge
            box(20, 13, 3, 3, 0xffd700);
            box(19, 12, 5, 2, TORSO_1); // Pad
            box(20, 12, 4, 1, 0xffffff); // 1px metallic highlight
            
            box(20, 2, 3, 3, WHITE); // Gloves
            box(9, 4, 3, 10, TORSO_2);
            
            // Shoulder pad (Charge)
            box(8, 13, 5, 4, 0xd4a000); // Gold hinge
            box(9, 13, 3, 3, 0xffd700);
            box(8, 12, 5, 2, TORSO_1); // Pad
            box(8, 12, 4, 1, 0xffffff); // 1px metallic highlight
            
            box(9, 2, 3, 3, WHITE);
          } else if (isAttack) {
            // Back arm shoulder pad
            box(7, 13, 4, 3, 0xd4a000);
            box(8, 13, 2, 2, 0xffd700);
            box(6, 12, 5, 2, TORSO_1);
            box(7, 12, 4, 1, 0xffffff); // metallic highlight
            
            box(21, 13, 5, 4, TORSO_2);
            
            // Front arm shoulder pad
            box(20, 13, 4, 3, 0xd4a000);
            box(21, 13, 2, 2, 0xffd700);
            box(20, 12, 5, 2, TORSO_1);
            box(21, 12, 4, 1, 0xffffff); // metallic highlight

            box(26, 14, 5, 3, TORSO_2);
            box(30, 14, 2, 3, WHITE); // glove edge
            box(31, 13, 4, 4, WHITE);
            box(6, 15, 4, 5, WHITE);
            box(7, 14, 4, 3, TORSO_2);
            box(6, 18, 4, 2, WHITE); // glove edge
          } else {
            // Resting arms with Suit Ribbing
            box(8, 14, 3, 6, TORSO_2);
            box(21, 14, 3, 6, TORSO_2);
            // Arm ribbed shading
            box(8, 15, 3, 1, TORSO_2_SHADOW);
            box(8, 17, 3, 1, TORSO_2_SHADOW);
            box(21, 15, 3, 1, TORSO_2_SHADOW);
            box(21, 17, 3, 1, TORSO_2_SHADOW);
            
            // Shoulder Pads Vegeta style
            // Big shoulder pads overlapping arms
            box(8, 13, 4, 3, 0xd4a000); // Gold hinge shadow
            box(9, 13, 2, 3, 0xffd700); // Gold hinge core
            box(20, 13, 4, 3, 0xd4a000);
            box(21, 13, 2, 3, 0xffd700);

            box(7, 12, 5, 2, TORSO_1); // Left pad
            box(20, 12, 5, 2, TORSO_1); // Right pad
            // Pad highlights (metallic 1px line)
            box(7, 12, 4, 1, 0xffffff);
            box(21, 12, 4, 1, 0xffffff);

            box(7, 13, 1, 2, TORSO_1_SHADOW); // pad shadow
            box(24, 13, 1, 2, TORSO_1_SHADOW);

            box(8, 20, 3, 4, WHITE); // Gloves
            box(21, 20, 3, 4, WHITE);
            // Glove shadow
            box(8, 20, 1, 4, 0xaaaaaa);
            box(23, 20, 1, 4, 0xaaaaaa);

            box(7, 20, 5, 2, WHITE); // Glove cuff
            box(20, 20, 5, 2, WHITE);
            box(7, 21, 5, 1, 0xdddddd); // Cuffs shadow
            box(20, 21, 5, 1, 0xdddddd);
            
            // Hands
            box(8, 24, 3, 2, WHITE);
            box(21, 24, 3, 2, WHITE);
            box(8, 25, 3, 1, 0xdddddd);
            box(21, 25, 3, 1, 0xdddddd);
          }
        } else if (pTorso === "saitama") {
          box(11, 14, 10, 9, TORSO_1); // yellow suit

          // Torso shading (Muscles)
          box(11, 14, 1, 9, TORSO_1_SHADOW);
          box(20, 14, 1, 9, TORSO_1_SHADOW);
          box(14, 17, 1, 4, TORSO_1_SHADOW); // Abs line
          box(17, 17, 1, 4, TORSO_1_SHADOW);

          // Neck / Zipper (Zíper prateado)
          box(15, 14, 2, 2, 0xdcdcdc); // ZIPPER_SILVER
          dot(15, 16, BLACK); // Zipper pull

          // Cape buttons at neck - discs (Gloves color / TORSO_2)
          dot(12, 15, TORSO_2);
          dot(19, 15, TORSO_2);

          // Belt / Cinto
          box(11, 22, 10, 2, BLACK);
          box(14, 22, 4, 2, 0xffd700); // Gold Buckle
          dot(15, 22, WHITE); // Buckle shine

          if (isCharge) {
            box(20, 4, 3, 10, TORSO_1);
            box(20, 2, 3, 3, TORSO_2); // red gloves
            box(9, 4, 3, 10, TORSO_1);
            box(9, 2, 3, 3, TORSO_2); // red gloves
          } else if (isAttack) {
            box(21, 13, 5, 4, TORSO_1);
            box(26, 14, 5, 3, TORSO_1);
            box(30, 14, 2, 3, TORSO_2); // glove edge
            box(31, 13, 4, 4, TORSO_2);
            box(6, 15, 4, 5, TORSO_2);
            box(7, 14, 4, 3, TORSO_1);
            box(6, 18, 4, 2, TORSO_2); // glove edge
          } else {
            box(8, 14, 3, 6, TORSO_1);
            box(21, 14, 3, 6, TORSO_1);
            // Arm Shading
            box(8, 14, 1, 6, TORSO_1_SHADOW);
            box(23, 14, 1, 6, TORSO_1_SHADOW);

            // Red Gloves
            box(8, 20, 3, 5, TORSO_2);
            box(21, 20, 3, 5, TORSO_2);
            box(7, 20, 5, 2, TORSO_2); // Glove cuffs
            box(20, 20, 5, 2, TORSO_2);
            
            // Glove shadows
            box(7, 21, 5, 1, TORSO_2_SHADOW);
            box(20, 21, 5, 1, TORSO_2_SHADOW);
            box(8, 22, 1, 3, TORSO_2_SHADOW);
            box(23, 22, 1, 3, TORSO_2_SHADOW);
          }
        } else if (pTorso === "chapolim") {
          box(11, 14, 10, 9, TORSO_1); // Red suit
          box(11, 14, 1, 9, TORSO_1_SHADOW); // Side shadow left
          box(20, 14, 1, 9, TORSO_1_SHADOW); // Side shadow right

          // Yellow heart shield (Badge)
          box(12, 15, 8, 4, TORSO_2); // Top heart lobes
          box(13, 19, 6, 1, TORSO_2); // Lower taper
          box(15, 20, 2, 1, TORSO_2); // Bottom point

          // Center "CH" in red (using TORSO_1_SHADOW for maximum legibility and contrast)
          // C
          box(13, 16, 2, 1, TORSO_1_SHADOW);
          box(13, 17, 1, 1, TORSO_1_SHADOW);
          box(13, 18, 2, 1, TORSO_1_SHADOW);
          // H
          box(16, 16, 1, 3, TORSO_1_SHADOW);
          box(18, 16, 1, 3, TORSO_1_SHADOW);
          box(17, 17, 1, 1, TORSO_1_SHADOW);

          if (isCharge) {
            box(20, 4, 3, 10, TORSO_1);
            box(20, 2, 3, 3, SKIN_TONE);
            box(9, 4, 3, 10, TORSO_1);
            box(9, 2, 3, 3, SKIN_TONE);
          } else if (isAttack) {
            box(21, 13, 5, 4, TORSO_1);
            box(26, 14, 5, 3, TORSO_1);
            box(30, 14, 2, 3, TORSO_1); // sleeve edge
            box(31, 13, 4, 4, SKIN_TONE);
            box(6, 15, 4, 5, SKIN_TONE);
            box(7, 14, 4, 3, TORSO_1);
            box(6, 18, 4, 2, TORSO_1); // sleeve edge
          } else {
            box(8, 14, 3, 7, TORSO_1);
            box(21, 14, 3, 7, TORSO_1);
            // Red sleeves shadow
            box(8, 14, 1, 7, TORSO_1_SHADOW);
            box(23, 14, 1, 7, TORSO_1_SHADOW);
            
            // Cuffs
            box(7, 20, 5, 2, TORSO_1);
            box(20, 20, 5, 2, TORSO_1);
            box(7, 21, 5, 1, TORSO_1_SHADOW);
            box(20, 21, 5, 1, TORSO_1_SHADOW);

            box(8, 22, 3, 2, SKIN_TONE); // Hands
            box(21, 22, 3, 2, SKIN_TONE);
          }
        } else if (pTorso === "naruto") {
          // Orange jacket with blue collar and shoulders
          box(11, 14, 10, 9, TORSO_1); // Core orange
          box(11, 14, 1, 9, TORSO_1_SHADOW);
          box(20, 14, 1, 9, TORSO_1_SHADOW);
          box(11, 14, 10, 2, TORSO_2); // Blue collar/shoulder
          // Zipper
          box(15, 14, 2, 9, 0x111111); // Black zipper line
          if (isCharge) {
            box(20, 4, 3, 13, TORSO_1); // Full sleeve
            box(20, 2, 3, 3, SKIN_TONE); // Hands
            box(9, 4, 3, 13, TORSO_1); // Full sleeve
            box(9, 2, 3, 3, SKIN_TONE); // Hands
          } else if (isAttack) {
            box(21, 13, 5, 4, TORSO_1); // Shoulder
            box(26, 14, 5, 3, TORSO_1); // Arm extending
            box(30, 14, 2, 3, TORSO_1); // Wrist
            box(32, 13, 4, 4, SKIN_TONE); // Hand Punching
            
            box(7, 14, 4, 3, TORSO_1); // Back Shoulder
            box(6, 17, 4, 5, TORSO_1); // Back Arm 
            box(6, 22, 4, 2, SKIN_TONE); // Back Hand
          } else {
            box(8, 14, 3, 10, TORSO_1); // Arm Orange
            box(21, 14, 3, 10, TORSO_1);
            box(8, 14, 1, 10, TORSO_1_SHADOW);
            box(23, 14, 1, 10, TORSO_1_SHADOW);
            box(8, 24, 3, 2, SKIN_TONE); // Hands
            box(21, 24, 3, 2, SKIN_TONE);
          }
        } else if (pTorso === "sasuke") {
          // --- FULL HD SASUKE TORSO ---
          // Iconic High-collar blue shirt
          box(10, 14, 12, 9, TORSO_1_SHADOW); 
          box(11, 14, 10, 9, TORSO_1); 
          
          // High collar (Standing up behind/around neck)
          box(10, 11, 12, 4, TORSO_1_SHADOW);
          box(11, 11, 10, 3, TORSO_1);
          alphaBox(11, 11, 10, 1, 0xffffff, 0.2); // Collar edge
          
          // Zipper / center split line
          box(15, 14, 2, 9, TORSO_1_SHADOW);
          box(15, 14, 1, 9, 0x444444); // Zipper teeth

          // Subtle fabric creases
          alphaBox(12, 18, 2, 1, 0x000000, 0.2);
          alphaBox(18, 17, 2, 1, 0x000000, 0.2);
          
          // Uchiha Crest on the back? Invisible here, but we can imply collar shape.

          if (isCharge) {
            // Chidori charging pose
            box(20, 14, 5, 4, TORSO_1_SHADOW); // T-shirt sleeve
            box(21, 14, 3, 3, TORSO_1); 
            box(20, 10, 5, 4, SKIN_SHADOW); // Bare bicep
            box(21, 11, 3, 3, SKIN_TONE);
            box(20, 4, 5, 6, 0xaaaaaa); // White arm warmer shadow
            box(21, 4, 3, 5, 0xffffff); // Arm warmer
            box(20, 2, 4, 3, SKIN_SHADOW); // Hand
            
            box(7, 14, 5, 4, TORSO_1_SHADOW);
            box(8, 14, 3, 3, TORSO_1);
            box(7, 10, 5, 4, SKIN_SHADOW);
            box(8, 11, 3, 3, SKIN_TONE);
            box(7, 4, 5, 6, 0xaaaaaa);
            box(8, 4, 3, 5, 0xffffff);
            box(7, 2, 4, 3, SKIN_SHADOW);
          } else if (isAttack) {
            box(19, 13, 6, 5, TORSO_1_SHADOW);
            box(20, 13, 4, 4, TORSO_1);
            
            box(24, 14, 3, 4, SKIN_SHADOW); // Bicep
            box(25, 14, 2, 3, SKIN_TONE);
            
            box(27, 13, 6, 5, 0xaaaaaa); // Arm warmer
            box(28, 14, 4, 3, 0xffffff);
            
            box(33, 13, 4, 4, SKIN_SHADOW); // Hand
            
            box(6, 14, 5, 4, TORSO_1_SHADOW);
            box(7, 14, 3, 3, TORSO_1);
            box(5, 17, 5, 3, SKIN_SHADOW);
            box(5, 19, 5, 5, 0xaaaaaa); // Arm warmer
            box(6, 19, 3, 4, 0xffffff);
          } else {
             // Cool, calm stance
             box(7, 14, 5, 5, TORSO_1_SHADOW); // Sleeve
             box(8, 14, 3, 4, TORSO_1);
             box(7, 18, 5, 3, SKIN_SHADOW); // Bare bicep gap
             box(8, 19, 3, 2, SKIN_TONE);
             box(7, 21, 5, 5, 0xaaaaaa); // Arm warmer
             box(8, 21, 3, 4, 0xffffff);
             box(7, 26, 4, 3, SKIN_SHADOW); // Hand
             
             box(20, 14, 5, 5, TORSO_1_SHADOW); 
             box(21, 14, 3, 4, TORSO_1);
             box(20, 18, 5, 3, SKIN_SHADOW); 
             box(21, 19, 3, 2, SKIN_TONE);
             box(20, 21, 5, 5, 0xaaaaaa); 
             box(21, 21, 3, 4, 0xffffff);
             box(21, 26, 4, 3, SKIN_SHADOW);
          }
        } else if (pTorso === "luffy") {
          // Open red vest, bare chest
          box(11, 14, 10, 9, SKIN_TONE); // Bare chest
          
          // Chest & Abs details
          box(15, 14, 2, 4, SKIN_SHADOW); // Pec cleavage
          box(14, 17, 1, 1, SKIN_SHADOW); // left pec bottom
          box(17, 17, 1, 1, SKIN_SHADOW); // right pec bottom
          box(15, 19, 2, 4, SKIN_SHADOW); // Abs center
          box(14, 20, 4, 1, SKIN_SHADOW); // Abs horizontal

          box(11, 14, 3, 9, TORSO_1); // Red vest left
          box(18, 14, 3, 9, TORSO_1); // Red vest right
          box(10, 14, 1, 9, TORSO_1_SHADOW);
          box(21, 14, 1, 9, TORSO_1_SHADOW);
          
          // Scar on chest (drawn above the chest lines)
          box(13, 17, 3, 1, 0xff0000);
          box(14, 16, 1, 3, 0xff0000);
          if (isCharge) {
            box(20, 4, 3, 10, SKIN_TONE); // Bare arms
            box(20, 14, 3, 3, TORSO_1); // Vest shoulder
            box(20, 2, 3, 3, SKIN_TONE); // Hands
            box(9, 4, 3, 10, SKIN_TONE);
            box(9, 14, 3, 3, TORSO_1);
            box(9, 2, 3, 3, SKIN_TONE); // Hands
          } else if (isAttack) {
            box(21, 13, 5, 4, TORSO_1); // Vest shoulder
            box(26, 14, 6, 3, SKIN_TONE); // Arm extending
            box(32, 13, 4, 4, SKIN_TONE); // Hand
            
            box(7, 14, 4, 3, TORSO_1); // Back vest shoulder
            box(6, 17, 4, 5, SKIN_TONE); // Back arm
            box(6, 22, 4, 2, SKIN_TONE); // Back hand
          } else {
            box(8, 14, 3, 4, TORSO_1); // Vest sleeve
            box(21, 14, 3, 4, TORSO_1);
            box(8, 18, 3, 6, SKIN_TONE); // Bare arms
            box(21, 18, 3, 6, SKIN_TONE);
            box(8, 24, 3, 2, SKIN_TONE); // Hands
            box(21, 24, 3, 2, SKIN_TONE);
          }
        } else if (pTorso === "muscle") {
          // Bare chest / Muscles base
          box(11, 14, 10, 9, SKIN_TONE);

          // Lateral Shading (Side muscle definition / latissimus dorsi)
          box(11, 14, 1, 9, SKIN_SHADOW);
          box(20, 14, 1, 9, SKIN_SHADOW);
          box(12, 18, 1, 5, SKIN_SHADOW); // V-taper left
          box(19, 18, 1, 5, SKIN_SHADOW); // V-taper right

          // Collarbones and Trapezius
          box(12, 14, 3, 1, SKIN_SHADOW);
          box(17, 14, 3, 1, SKIN_SHADOW);

          // Pectorals / Chest definition (Refined)
          box(15, 14, 2, 4, SKIN_SHADOW); // central cleavage line deeper
          box(13, 17, 3, 1, SKIN_SHADOW); // left pec bottom curve
          box(12, 16, 1, 1, SKIN_SHADOW); // left pec outer curve
          box(16, 17, 3, 1, SKIN_SHADOW); // right pec bottom curve
          box(19, 16, 1, 1, SKIN_SHADOW); // right pec outer curve

          // Pectoral Highlights (Volume)
          const SKIN_HIGH = Phaser.Display.Color.IntegerToColor(SKIN_TONE).lighten(15).color;
          box(13, 15, 2, 2, SKIN_HIGH); // left pec highlight
          box(17, 15, 2, 2, SKIN_HIGH); // right pec highlight

          // Abs (6-pack refined)
          box(15, 19, 2, 4, SKIN_SHADOW); // Center abs division
          box(14, 19, 4, 1, SKIN_SHADOW); // Upper pack horizontal break
          box(14, 21, 4, 1, SKIN_SHADOW); // Mid pack horizontal break
          box(14, 23, 4, 1, SKIN_SHADOW); // Lower pack horizontal break
          
          // Abs volume (Highlights on the blocks)
          box(13, 18, 1, 1, SKIN_HIGH); // Upper left
          box(18, 18, 1, 1, SKIN_HIGH); // Upper right
          box(13, 20, 1, 1, SKIN_HIGH); // Mid left
          box(18, 20, 1, 1, SKIN_HIGH); // Mid right

          if (isCharge) {
            box(20, 4, 3, 10, SKIN_TONE);
            box(20, 14, 3, 3, TORSO_1); // wristbands
            box(20, 4, 3, 3, TORSO_2);
            box(20, 2, 3, 3, SKIN_TONE); // Hands
            box(9, 4, 3, 10, SKIN_TONE);
            box(9, 14, 3, 3, TORSO_1);
            box(9, 4, 3, 3, TORSO_2);
            box(9, 2, 3, 3, SKIN_TONE); // Hands
          } else if (isAttack) {
            box(21, 13, 5, 4, SKIN_TONE);
            box(26, 14, 5, 3, SKIN_TONE);
            box(30, 14, 2, 3, TORSO_1); // wristband
            box(31, 13, 4, 4, SKIN_TONE);
            box(6, 15, 4, 5, SKIN_TONE);
            box(7, 14, 4, 3, SKIN_TONE);
            box(6, 18, 4, 2, TORSO_1);
          } else {
            // Bare arms
            box(8, 14, 3, 6, SKIN_TONE);
            box(21, 14, 3, 6, SKIN_TONE);
            // Arm shadow/definition
            box(8, 14, 1, 6, SKIN_SHADOW);
            box(23, 14, 1, 6, SKIN_SHADOW);

            // Wristbands (Munhequeiras)
            box(8, 20, 3, 3, TORSO_1);
            box(21, 20, 3, 3, TORSO_1);
            box(8, 20, 1, 3, TORSO_1_SHADOW); // wristbands shadows
            box(23, 20, 1, 3, TORSO_1_SHADOW);

            // Hands (Mãos)
            box(8, 23, 3, 2, SKIN_TONE);
            box(21, 23, 3, 2, SKIN_TONE);
            box(8, 24, 3, 1, SKIN_SHADOW); // hands shade/knuckles
            box(21, 24, 3, 1, SKIN_SHADOW);
          }
        } else {
          // --- FULL HD GOKU GI (TORSO) ---
          // Deep Blue Undershirt with heavy muscle definition
          box(13, 14, 6, 9, TORSO_2_SHADOW); // Base dark blue
          box(14, 14, 4, 9, TORSO_2); // Mid tone
          alphaBox(14, 16, 4, 1, 0x000000, 0.3); // Pec under-shadow on shirt
          alphaBox(15, 18, 2, 4, 0x000000, 0.2); // Abs definition through shirt
          
          // Deep V-Neck Chest Window
          box(14, 14, 4, 4, SKIN_SHADOW); 
          box(15, 14, 2, 3, SKIN_TONE); 
          box(15, 14, 2, 1, SKIN_SHADOW); // Cleavage line
          box(14, 17, 1, 1, SKIN_SHADOW); // Pec curve L
          box(17, 17, 1, 1, SKIN_SHADOW); // Pec curve R
          
          // Orange Gi Main (Thick fabric with heavy folds)
          box(10, 14, 4, 9, TORSO_1_SHADOW); // Left flap base
          box(18, 14, 4, 9, TORSO_1_SHADOW); // Right flap base
          box(11, 14, 2, 9, TORSO_1); // Left flap core
          box(19, 14, 2, 9, TORSO_1); // Right flap core
          
          // Gi wrinkles (Iconic Dragon Ball folds)
          alphaBox(11, 16, 2, 1, 0x000000, 0.3);
          alphaBox(11, 19, 2, 1, 0x000000, 0.3);
          alphaBox(19, 15, 2, 1, 0x000000, 0.3);
          alphaBox(19, 18, 2, 1, 0x000000, 0.3);
          
          // Gi Edge Highlights
          alphaBox(12, 14, 1, 9, 0xffffff, 0.2);
          alphaBox(19, 14, 1, 9, 0xffffff, 0.2);

          if (isCharge) {
            // Charging - Arms spread out
            box(20, 4, 5, 10, SKIN_SHADOW); // Back arm base
            box(21, 5, 3, 8, SKIN_TONE); // Core muscle
            box(20, 14, 4, 4, TORSO_1_SHADOW); // Orange sleeve
            box(21, 14, 2, 3, TORSO_1); 
            box(20, 4, 5, 3, TORSO_2_SHADOW); // Blue wristband
            box(21, 4, 3, 2, TORSO_2);
            box(20, 2, 4, 3, SKIN_TONE); // Fist
            
            box(7, 4, 5, 10, SKIN_SHADOW); 
            box(8, 5, 3, 8, SKIN_TONE); 
            box(8, 14, 4, 4, TORSO_1_SHADOW); 
            box(9, 14, 2, 3, TORSO_1);
            box(7, 4, 5, 3, TORSO_2_SHADOW);
            box(8, 4, 3, 2, TORSO_2);
            box(8, 2, 4, 3, SKIN_TONE); 
          } else if (isAttack) {
            // Punching Forward
            box(18, 13, 5, 5, TORSO_1_SHADOW); // Shoulder
            box(19, 13, 3, 4, TORSO_1);
            
            box(23, 14, 7, 4, SKIN_SHADOW); // Arm stretching
            box(24, 14, 5, 2, SKIN_TONE); // Muscle highlight
            
            box(28, 13, 3, 5, TORSO_2_SHADOW); // Wristband
            box(29, 14, 2, 3, TORSO_2); 
            
            box(31, 13, 5, 5, SKIN_TONE); // Fist
            box(31, 14, 2, 2, SKIN_SHADOW); // Knuckles
            
            // Back arm pulled back
            box(6, 14, 4, 4, TORSO_1_SHADOW); 
            box(7, 14, 2, 3, TORSO_1);
            box(5, 16, 4, 5, SKIN_SHADOW);
            box(6, 17, 2, 3, SKIN_TONE);
            box(5, 20, 4, 3, TORSO_2_SHADOW); // Wristband
            box(6, 20, 2, 2, TORSO_2);
          } else {
            // Combat Stance (Front & Back Arm details)
            // BACK ARM
            box(7, 14, 5, 4, TORSO_1_SHADOW); // Orange sleeve
            box(8, 14, 3, 3, TORSO_1);
            box(7, 17, 5, 6, SKIN_SHADOW); // Bare arm
            box(8, 18, 3, 4, SKIN_TONE); // Bicep/Forearm highlight
            box(7, 22, 5, 3, TORSO_2_SHADOW); // Wristband
            box(8, 22, 3, 2, TORSO_2);
            box(7, 25, 4, 3, SKIN_SHADOW); // Hand
            
            // FRONT ARM
            box(20, 14, 5, 4, TORSO_1_SHADOW); // Orange sleeve
            box(21, 14, 3, 3, TORSO_1);
            box(20, 17, 5, 6, SKIN_SHADOW); // Bare arm
            box(21, 18, 3, 4, SKIN_TONE); 
            box(20, 22, 5, 3, TORSO_2_SHADOW); // Wristband
            box(21, 22, 3, 2, TORSO_2);
            box(21, 25, 4, 3, SKIN_SHADOW); // Hand
          }
        }
        isDrawingTorso = false;

        // ====================
        isDrawingLegs = false;
        // ACCESSORY (Back layer)
        // ====================

        const HEAD_1_SHADOW =
          Phaser.Display.Color.IntegerToColor(HEAD_1).darken(20).color;
        const HEAD_2 = colors.color_head_2 ?? colors.gi2;

        // ====================
        // HEAD / FACE
        // ====================
        if (pHead === "spiderman") {
          headBox(12, 6, 8, 7, HEAD_1);
          headBox(14, 13, 4, 1, HEAD_1); // Neck
          headDot(11, 9, HEAD_1);
          headDot(20, 9, HEAD_1);
          headBox(13, 12, 6, 1, HEAD_1_SHADOW);

          // Web pattern lines on mask
          headBox(16, 6, 1, 6, BLACK); // center vertical
          headDot(14, 7, BLACK);
          headDot(18, 7, BLACK);
          headDot(13, 10, BLACK);
          headDot(19, 10, BLACK);

          // Clean Spiderman Eyes
          // Left Eye Outline
          headBox(12, 7, 3, 3, BLACK);
          headBox(13, 8, 2, 1, WHITE); // Left Eye Inner
          
          // Right Eye Outline
          headBox(17, 7, 3, 3, BLACK);
          headBox(17, 8, 2, 1, WHITE); // Right Eye Inner
        } else if (pHead === "saitama") {
          headBox(12, 5, 8, 8, SKIN_TONE);
          headBox(14, 13, 4, 1, SKIN_TONE); // Neck
          headDot(11, 9, SKIN_TONE);
          headDot(20, 9, SKIN_TONE);
          headBox(13, 12, 6, 1, SKIN_SHADOW); // chin shadow
          
          // Derp/Serious eyes
          if (isCharge || isAttack) {
            headBox(13, 8, 2, 1, eyebrowColor);
            headBox(17, 8, 2, 1, eyebrowColor);
            headBox(13, 9, 2, 2, WHITE);
            headBox(17, 9, 2, 2, WHITE);
            headDot(14, 9, BLACK); // sharp pupil
            headDot(18, 9, BLACK);
          } else {
            headDot(14, 9, BLACK);
            headDot(18, 9, BLACK);
            headDot(14, 10, WHITE);
            headDot(18, 10, WHITE);
          }
          
          // Mouth
          if (isCharge) {
            headBox(15, 11, 2, 2, BLACK);
          } else {
            headBox(15, 11, 2, 1, SKIN_SHADOW);
          }
        } else if (pHead === "chapolim") {
          headBox(12, 6, 8, 7, SKIN_TONE); // face
          headBox(14, 13, 4, 1, SKIN_TONE); // Neck
          headBox(11, 4, 10, 6, HEAD_1); // Capacete (agora começa em y=4, mais alto, sem buraco)
          headBox(12, 6, 8, 2, HEAD_1_SHADOW); // Capacete shadow
          headDot(11, 9, HEAD_1);
          headDot(20, 9, HEAD_1);
          
          // Face exposure
          headBox(13, 8, 6, 4, SKIN_TONE); 

          // Antena conectada ao capacete (y=2 a y=5, sem espaço)
          headBox(13, 2, 1, 3, HEAD_1);
          headBox(18, 2, 1, 3, HEAD_1);
          
          // Pompons
          headBox(12, 0, 3, 2, HEAD_2); // ponta amarela esquerda
          headBox(17, 0, 3, 2, HEAD_2); // ponta amarela direita

          headDot(14, 9, eyeColor);
          headDot(18, 9, eyeColor);
        } else if (pHead === "vegeta") {
          headBox(12, 6, 8, 7, SKIN_TONE);
          headBox(14, 13, 4, 1, SKIN_TONE); // Neck
          headDot(11, 9, SKIN_TONE); // ear
          headDot(20, 9, SKIN_TONE); // ear
          headBox(13, 12, 6, 1, SKIN_SHADOW);

          // Eyes
          headBox(13, 9, 2, 1, WHITE);
          headBox(17, 9, 2, 1, WHITE);
          headDot(14, 9, eyeColor);
          headDot(17, 9, eyeColor);

          // Angry eyebrows sloped inward
          // Left eyebrow
          headDot(12, 8, eyebrowColor);
          headDot(13, 8, eyebrowColor);
          headDot(14, 8, eyebrowColor);
          // Right eyebrow
          headDot(19, 8, eyebrowColor);
          headDot(18, 8, eyebrowColor);
          headDot(17, 8, eyebrowColor);

          headDot(15, 8, eyebrowColor); // center connection
          headDot(16, 8, eyebrowColor);

          // Widow's peak base
          headBox(13, 5, 6, 1, hairColor); // wider peak base
          headDot(15, 6, hairColor);
          headDot(16, 6, hairColor);

          headBox(11, 5, 2, 3, hairColor); // thicker side burns
          headBox(19, 5, 2, 3, hairColor);

          if (isTransformed) {
            // Super Saiyan Vegeta hair stands straight up
            headBox(10, 0, 12, 5, hairColor); // Base volume covers y=0..4
            headBox(10, -3, 12, 3, hairColor); // Fill corners
            headBox(11, -6, 10, 4, hairColor);
            headBox(12, -9, 8, 4, hairColor);
            headBox(13, -12, 6, 4, hairColor);
            headBox(14, -14, 4, 3, hairColor); // Central spike
            
            // Side flares tightly connected
            headBox(8, -4, 2, 6, hairColor); 
            headBox(7, -2, 1, 4, hairColor);
            headBox(22, -4, 2, 6, hairColor);
            headBox(24, -2, 1, 4, hairColor);
            
            // Inner hair detail
            headBox(13, -8, 1, 6, 0xcca600);
            headBox(17, -8, 1, 6, 0xcca600);
            headBox(15, -11, 1, 5, 0xcca600);
          } else {
            // Base Vegeta hair
            headBox(10, 0, 12, 5, hairColor);
            headBox(10, -2, 12, 2, hairColor);
            headBox(11, -5, 10, 4, hairColor);
            headBox(12, -8, 8, 4, hairColor);
            headBox(13, -10, 6, 3, hairColor);
            headBox(14, -12, 4, 3, hairColor);
            
            // Side flares 
            headBox(8, -2, 2, 5, hairColor);
            headBox(7, 0, 1, 3, hairColor);
            headBox(22, -2, 2, 5, hairColor);
            headBox(24, 0, 1, 3, hairColor);
          }

          if (isAttack) {
            headBox(14, 11, 4, 2, 0x440000); // Shouting wide open mouth
          } else if (isDefend) {
            headBox(14, 11, 4, 1, WHITE); // Clenched teeth
          } else if (isCharge) {
            headBox(14, 11, 4, 2, 0x000000); // Open mouth yelling
          } else {
            headBox(14, 11, 4, 1, SKIN_SHADOW); // Scowl line
            headDot(15, 11, 0x222222);
            headDot(16, 11, 0x222222);
          }
        } else if (pHead === "naruto") {
          headBox(12, 6, 8, 7, SKIN_TONE);
          headBox(14, 13, 4, 1, SKIN_TONE); // Neck
          headDot(11, 9, SKIN_TONE);
          headDot(20, 9, SKIN_TONE);
          headBox(13, 12, 6, 1, SKIN_SHADOW);

          // Headband
          headBox(11, 5, 10, 2, HEAD_1); // Blue cloth
          headBox(13, 5, 6, 2, 0xaaaaaa); // Metal plate
          headDot(15, 6, BLACK); // Leaf symbol dot

          // Hair (Spiky yellow)
          headBox(10, 2, 12, 3, hairColor); // base hair
          headBox(11, -1, 3, 3, hairColor); // left spike
          headBox(15, -2, 2, 4, hairColor); // center spike
          headBox(18, -1, 3, 3, hairColor); // right spike
          headBox(11, 4, 10, 1, hairColor); // bangs

          // Whiskers
          headDot(12, 10, 0x555555);
          headDot(19, 10, 0x555555);

          // Eyes
          headBox(13, 9, 2, 1, WHITE);
          headBox(17, 9, 2, 1, WHITE);
          headDot(14, 9, eyeColor);
          headDot(17, 9, eyeColor);

          // Mouth
          if (isAttack) {
            headBox(14, 11, 4, 2, 0x440000); // Shouting
          } else if (isDefend) {
            headBox(14, 11, 4, 1, WHITE); // Clenched teeth
          } else if (isCharge) {
            headBox(14, 11, 4, 2, 0x000000); // Open mouth yelling
          } else {
            headBox(14, 12, 4, 1, SKIN_SHADOW); // Smile
            headDot(13, 11, SKIN_SHADOW);
            headDot(18, 11, SKIN_SHADOW);
          }
        } else if (pHead === "sasuke") {
          // --- FULL HD SASUKE HEAD ---
          headBox(12, 6, 8, 7, SKIN_TONE);
          headBox(14, 13, 4, 2, SKIN_TONE); 
          
          headBox(12, 9, 8, 4, SKIN_SHADOW); 
          headBox(13, 9, 6, 3, SKIN_TONE); 
          headBox(15, 10, 2, 2, SKIN_SHADOW); // Nose
          
          // Hair (Spiky black, back and front bangs - highly detailed duck-butt style)
          const S_HAIR_SHADOW = 0x111111;
          headBox(9, 0, 14, 7, S_HAIR_SHADOW); 
          headBox(10, 1, 12, 6, hairColor); 
          
          // Back ducktail spikes
          headBox(16, -2, 4, 4, S_HAIR_SHADOW);
          headBox(17, -1, 2, 3, hairColor);
          headBox(11, -1, 3, 3, S_HAIR_SHADOW);
          headBox(12, 0, 1, 2, hairColor);

          // Side bangs framing the face
          headBox(8, 4, 3, 6, S_HAIR_SHADOW);
          headBox(9, 5, 2, 4, hairColor);
          headBox(21, 4, 3, 6, S_HAIR_SHADOW);
          headBox(21, 5, 2, 4, hairColor);
          
          // Middle V-bang
          headBox(14, 5, 4, 4, S_HAIR_SHADOW);
          headBox(15, 6, 2, 2, hairColor);

          // Eyes
          headBox(12, 7, 3, 2, eyebrowColor); // intense brow
          headBox(17, 7, 3, 2, eyebrowColor);
          
          headBox(13, 9, 2, 1, WHITE);
          headBox(17, 9, 2, 1, WHITE);
          
          // Sharingan (Red pupil with black dot)
          headBox(14, 9, 1, 1, 0xff0000); 
          headBox(17, 9, 1, 1, 0xff0000);
          alphaBox(14, 9, 1, 1, 0x000000, 0.5); // tomoe center
          alphaBox(17, 9, 1, 1, 0x000000, 0.5);

          // Mouth
          if (isAttack) {
            headBox(14, 12, 4, 1, 0x440000);
          } else if (isDefend) {
            headBox(14, 12, 4, 1, WHITE);
          } else if (isCharge) {
            headBox(14, 12, 4, 2, 0x000000);
          } else {
            headBox(15, 12, 2, 1, SKIN_SHADOW); // Serious line
          }
        } else if (pHead === "luffy") {
          headBox(12, 6, 8, 7, SKIN_TONE);
          headBox(14, 13, 4, 1, SKIN_TONE); // Neck
          headDot(11, 9, SKIN_TONE);
          headDot(20, 9, SKIN_TONE);

          // Hair
          headBox(11, 6, 10, 2, hairColor);
          
          // Straw hat
          headBox(9, 5, 14, 1, 0xffd700); // Brim
          headBox(11, 2, 10, 3, 0xffd700); // Top
          headBox(11, 4, 10, 1, 0xff0000); // Red ribbon

          // Eyes
          headBox(13, 9, 2, 1, WHITE);
          headBox(17, 9, 2, 1, WHITE);
          headDot(14, 9, BLACK);
          headDot(17, 9, BLACK);
          // Scar under left eye (viewer right)
          headDot(18, 11, 0xff0000);
          
          // Big smile
          if (!isCharge) {
            headBox(14, 11, 4, 1, WHITE);
            headBox(14, 10, 4, 1, BLACK); // line above teeth
          } else {
             headBox(14, 11, 4, 2, BLACK);
          }
        } else if (pHead === "jotaro") {
          // --- FULL HD JOTARO HEAD ---
          // Base Skin & Neck
          headBox(12, 6, 8, 7, SKIN_TONE);
          headBox(14, 13, 4, 2, SKIN_TONE); 
          headBox(12, 9, 8, 4, SKIN_SHADOW); // lower face shadow (JoJo strong jaw)
          headBox(13, 9, 6, 3, SKIN_TONE); // bring back cheek highlight
          
          // Ears
          headBox(11, 8, 1, 3, SKIN_TONE);
          headBox(11, 9, 1, 1, SKIN_SHADOW);
          headBox(20, 8, 1, 3, SKIN_TONE);
          headBox(20, 9, 1, 1, SKIN_SHADOW);

          // Jawline contour
          headBox(13, 12, 1, 1, 0x000000);
          headBox(18, 12, 1, 1, 0x000000);

          // Jotaro Iconic Torn Hat (fuses into hair)
          // Crown of the hat
          headBox(11, 1, 10, 3, HEAD_1); 
          headBox(11, 1, 1, 3, HEAD_1_SHADOW); // left shade
          headBox(19, 1, 2, 3, HEAD_2); // right highlight
          
          // Visor / Brim
          headBox(9, 4, 14, 2, HEAD_1); 
          headBox(9, 4, 1, 2, HEAD_1_SHADOW);
          headBox(22, 4, 1, 2, HEAD_2);
          headBox(10, 5, 12, 1, 0x111111); // under-brim shadow on face
          
          // Hat Decor (Gold Badge + Hand)
          headBox(12, 2, 4, 2, 0xffd700); // Gold palm/anchor base
          headBox(13, 3, 2, 1, 0xb8860b); // inner badge shade
          headBox(17, 2, 2, 2, HEAD_1_SHADOW); // Button pin

          // Torn back / Hair fusion
          // The hat slowly transitions into spiky hair at the back/bottom
          headBox(9, 6, 2, 6, hairColor); // Left hair side
          headBox(21, 6, 2, 6, hairColor); // Right hair side
          headBox(10, 10, 12, 4, hairColor); // Back hair mass
          
          // Hair spikes & highlights
          headBox(9, 10, 1, 2, 0x000000); 
          headBox(22, 10, 1, 2, 0x000000); 
          headBox(11, 11, 2, 3, HEAD_1_SHADOW); // Blend hat color into hair
          headBox(19, 11, 2, 3, HEAD_1_SHADOW);
          
          // Face details - JoJo style thick brows & sharp eyes
          headBox(12, 7, 3, 2, eyebrowColor); // angry thick brow L
          headBox(17, 7, 3, 2, eyebrowColor); // angry thick brow R
          headBox(13, 8, 2, 1, 0x000000); // lower brow depth
          headBox(17, 8, 2, 1, 0x000000); 
          
          // Eyes
          headBox(13, 9, 2, 1, 0xffffff); // Sclera L
          headBox(17, 9, 2, 1, 0xffffff); // Sclera R
          headBox(14, 9, 1, 1, eyeColor); // Pupil L
          headBox(17, 9, 1, 1, eyeColor); // Pupil R
          
          // Nose line (JoJo shadow)
          headBox(15, 9, 1, 3, SKIN_SHADOW);
          headBox(16, 11, 1, 1, SKIN_SHADOW);

          if (isCharge) {
            headBox(14, 12, 4, 2, 0x000000); // open shouting mouth
            headBox(15, 12, 2, 1, 0xffffff); // teeth
          } else {
            headBox(14, 12, 4, 1, 0x000000); // stoic line
            headBox(15, 13, 2, 1, SKIN_SHADOW); // lip shadow
          }
        } else {
          // Generic anime head (Goku base)
          headBox(12, 6, 8, 7, SKIN_TONE);
          headBox(14, 13, 4, 1, SKIN_TONE); // Neck
          headDot(11, 9, SKIN_TONE);
          headDot(20, 9, SKIN_TONE);
          headDot(11, 10, SKIN_SHADOW);
          headDot(20, 10, SKIN_SHADOW);
          headBox(13, 12, 6, 1, SKIN_SHADOW);

          headDot(13, 9, WHITE);
          headDot(17, 9, WHITE);
          headDot(14, 9, eyeColor);
          headDot(18, 9, eyeColor);
          headDot(13, 8, eyebrowColor);
          headDot(14, 8, eyebrowColor);
          headDot(17, 8, eyebrowColor);
          headDot(18, 8, eyebrowColor);
          headDot(15, 8, SKIN_SHADOW);
          headDot(16, 8, SKIN_SHADOW);
          headDot(15, 11, SKIN_SHADOW);
          headDot(13, 11, SKIN_SHADOW);
          headDot(18, 11, SKIN_SHADOW);

          if (isAttack) {
            headBox(15, 12, 2, 1, 0x440000); // Small open mouth
          } else if (isDefend) {
            headBox(15, 12, 2, 1, WHITE); // Clenched teeth
          } else if (isCharge) {
            headBox(15, 12, 2, 2, 0x000000); // Open mouth yelling
          } else {
            headDot(16, 12, 0x222222); // Smirk corner
          }

          if (isTransformed && !isUI) {
            headBox(11, 0, 10, 6, hairColor);
            headBox(9, -2, 2, 6, hairColor);
            headBox(7, 0, 2, 4, hairColor);
            headBox(21, -2, 2, 6, hairColor);
            headBox(23, 0, 2, 4, hairColor);
            headBox(11, -6, 2, 6, hairColor);
            headBox(14, -8, 3, 8, hairColor);
            headBox(18, -5, 2, 5, hairColor);
            headBox(14, 6, 2, 2, hairColor);
            headBox(17, 6, 1, 1, hairColor);
            // inner detail
            headBox(13, -4, 1, 4, 0xcca600);
            headBox(15, -6, 1, 4, 0xcca600);
            headBox(18, -3, 1, 3, 0xcca600);
          } else if (isUI) {
            headBox(11, 1, 10, 7, hairColor);
            headBox(14, -1, 4, 3, hairColor);
            headBox(9, 2, 2, 5, hairColor);
            headBox(7, 3, 2, 4, hairColor);
            headBox(21, 2, 2, 4, hairColor);
            headBox(13, 6, 2, 3, hairColor);
            headBox(16, 6, 3, 3, hairColor);
            // Ultra Instinct Aura in hair
            headBox(12, 1, 1, 3, WHITE);
            headBox(18, 1, 1, 3, WHITE);
            headBox(15, -1, 1, 3, WHITE);
          } else {
            // Goku Base Hair
            headBox(11, 1, 10, 6, hairColor); 
            headBox(7, 1, 4, 3, hairColor); 
            headBox(9, -1, 3, 3, hairColor);
            headBox(21, 1, 4, 3, hairColor);
            headBox(20, -1, 3, 3, hairColor);
            headBox(12, -2, 3, 4, hairColor);
            headBox(16, -3, 3, 5, hairColor);
            headBox(13, 6, 2, 2, hairColor);
            headBox(17, 6, 2, 2, hairColor);
            headBox(15, 6, 1, 3, hairColor);
          }
        }

        // ====================
        isDrawingLegs = false;
                // ACCESSORY (Front layer)
        // ====================
        if (pAcc === "straw_hat") {
          // --- FULL HD STRAW HAT ---
          isDrawingHat = true;
          // Back rim shadow
          headBox(7, 5, 18, 2, 0xa07100); 
          // Main wide brim
          headBox(6, 4, 20, 1, 0xffd700); 
          headBox(7, 3, 18, 1, 0xffd700);
          
          // Dome
          headBox(10, 0, 12, 3, 0xffd700); 
          // Dome shading
          headBox(10, 0, 2, 3, 0xa07100);
          headBox(20, 0, 2, 3, 0xa07100);
          
          // Texture lines (Straw weave)
          headBox(11, 1, 10, 1, 0xd4a000);
          headBox(12, 2, 8, 1, 0xd4a000);
          
          // Red ribbon
          headBox(10, 3, 12, 1, 0xff0000); 
          headBox(10, 3, 2, 1, 0xaa0000); 
          headBox(20, 3, 2, 1, 0xaa0000); 
          
          // Neck string
          headBox(11, 13, 1, 3, 0x8b4513);
          headBox(20, 13, 1, 3, 0x8b4513);
          headBox(12, 15, 8, 1, 0x8b4513);
          
          // Face shadow from brim (draw top of the face dark)
          headBox(12, 6, 8, 2, SKIN_SHADOW);
          
          isDrawingHat = false;
        } else if (pAcc === "headband") {
          // --- SASUKE / ITACHI KONOHA ROGUE HEADBAND (ULTRA PIXEL DETAIL) ---
          const CLOTH_COLOR = ACC_1 || 0x182238; // Dark navy blue cloth
          const CLOTH_SHADOW = Phaser.Display.Color.IntegerToColor(CLOTH_COLOR).darken(25).color;

          // 1. Cloth Band wrapping forehead (x=10 to 21, y=3 to 6)
          headBox(10, 3, 12, 4, CLOTH_COLOR); 
          headBox(10, 6, 12, 1, CLOTH_SHADOW); 

          // 2. Metal Plate Base (10x4 pixels centered on forehead: x=11 to 20, y=3 to 6)
          headBox(11, 3, 10, 4, 0xd1d5db); // Bright steel silver base
          headBox(11, 3, 10, 1, 0xf8fafc); // Top edge metallic specular shine
          headBox(11, 6, 10, 1, 0x64748b); // Bottom bevel shadow
          
          // Plate Corner Bevels / Dark Border
          headDot(11, 3, 0x334155);
          headDot(11, 6, 0x334155);
          headDot(20, 3, 0x334155);
          headDot(20, 6, 0x334155);

          // 3. Rivets (6 studs total - 3 on each side)
          const RIVET = 0x1e293b;
          headDot(12, 4, RIVET);
          headDot(12, 5, RIVET);
          headDot(12, 6, RIVET);
          headDot(19, 4, RIVET);
          headDot(19, 5, RIVET);
          headDot(19, 6, RIVET);

          // 4. Konoha Leaf Symbol (Símbolo da Folha de Konoha)
          // Engraved dark emblem: Spiral + Arch + Pointer tip
          const LEAF = 0x0f172a;
          headDot(15, 3, LEAF); headDot(16, 3, LEAF); headDot(17, 3, LEAF); // Top arch
          headDot(17, 4, LEAF); // Right curve
          headDot(16, 4, LEAF); headDot(15, 4, LEAF); // Inner swirl top
          headDot(15, 5, LEAF); headDot(16, 5, LEAF); // Inner swirl bottom
          headDot(13, 5, LEAF); headDot(14, 5, LEAF); // Leaf tip extension pointing left
          headDot(14, 6, LEAF); headDot(15, 6, LEAF); // Base stem

          // 5. Rogue Diagonal Slash (Cut line across entire emblem from bottom-left to top-right)
          const CUT = 0x000000;
          headDot(12, 6, CUT);
          headDot(13, 6, CUT);
          headDot(14, 5, CUT);
          headDot(15, 5, CUT);
          headDot(16, 4, CUT);
          headDot(17, 4, CUT);
          headDot(18, 3, CUT);
          headDot(19, 3, CUT);

          // 6. Cut Highlight (3D Gouge metallic reflection under the slash)
          const HIGHLIGHT = 0xffffff;
          headDot(13, 7, HIGHLIGHT);
          headDot(14, 6, HIGHLIGHT);
          headDot(15, 6, HIGHLIGHT);
          headDot(16, 5, HIGHLIGHT);
          headDot(17, 5, HIGHLIGHT);
          headDot(18, 4, HIGHLIGHT);
          
        } else if (pAcc === "sword") {
          // --- PROPER KATANA / SWORD ---
          let handColor = SKIN_TONE;
          if (pTorso === "vegeta" || pTorso === "saitama") handColor = WHITE;
          else if (pTorso === "spiderman") handColor = TORSO_1;

          if (isCharge) {
            // Raised front hand
            box(20, -16, 4, 16, 0xcccccc); // Blade base
            box(22, -16, 1, 16, 0xffffff); // Edge highlight
            box(21, -16, 1, 16, 0x777777); // Fuller/shadow
            
            box(19, 0, 6, 2, 0xffd700); // Guard
            box(21, 2, 2, 6, 0x552200); // Hilt leather
            box(21, 8, 2, 1, 0xffd700); // Pommel

            // Redraw fingers over hilt
            box(20, 3, 4, 3, handColor);
          } else if (isAttack) {
            // VFX: Sword Slash Trail (Sweep arc)
            // Outer glow (cyan)
            alphaBox(22, 24, 8, 4, 0x00ffff, 0.15); 
            alphaBox(28, 19, 12, 4, 0x00ffff, 0.3);
            alphaBox(36, 14, 16, 5, 0x00ffff, 0.45);
            alphaBox(46, 9, 12, 6, 0x00ffff, 0.6);

            // Inner bright core (white)
            alphaBox(28, 20, 6, 2, 0xffffff, 0.4);
            alphaBox(38, 15, 10, 2, 0xffffff, 0.6);
            alphaBox(48, 11, 10, 2, 0xffffff, 0.8);

            // Forward front hand
            box(34, 12, 18, 4, 0xcccccc); // Blade base
            box(34, 12, 18, 1, 0xffffff); // Edge
            box(34, 14, 18, 1, 0x777777); // Fuller
            
            box(32, 11, 2, 6, 0xffd700); // Guard
            box(28, 13, 4, 2, 0x552200); // Hilt leather
            box(27, 13, 1, 2, 0xffd700); // Pommel

            // Redraw fingers over hilt
            box(29, 13, 3, 3, handColor);
          } else {
            // Resting in front hand, pointing forward (right)
            // Pommel
            box(16, 22, 2, 4, 0xffd700);
            // Hilt
            box(18, 23, 6, 2, 0x552200); 
            // Guard
            box(24, 21, 2, 6, 0xffd700);
            
            // Blade Base (Horizontal)
            box(26, 22, 16, 4, 0xcccccc);
            box(26, 22, 16, 1, 0xffffff); // Top edge shine
            box(26, 25, 16, 1, 0x777777); // Bottom shadow
            
            // Tip (Curve)
            box(42, 23, 2, 3, 0xcccccc);
            box(42, 23, 2, 1, 0xffffff); // Top edge shine
            box(44, 24, 2, 2, 0xcccccc);

            // Redraw fingers overlapping hilt to create grip
            box(20, 23, 3, 2, handColor);
          }
        }
      }

      // Sombra de contato universal torso/pernas
      alphaBox(11, 23, 11, 1, 0x000000, 0.25);
      
      // Sombra de contato pernas/pés
      alphaBox(10, 29, 12, 1, 0x000000, 0.2);
      
      // Sombra sob o queixo
      alphaBox(13, 13, 6, 1, 0x000000, 0.15);
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
      h: torsoMaxY >= torsoMinY ? torsoMaxY - torsoMinY + 1 : 0
    };
  };

  const bounds = generateForm(0);
  generateForm(1);
  generateForm(2);

  return { torsoBounds: bounds };
}

