import Phaser from "phaser";
import { CharacterData } from "../types";

export function generateCustomSprite(
  scene: Phaser.Scene,
  charData: CharacterData,
) {
  const key = charData.key;
  const colors: CharacterData["customData"] = charData.customData || {
    gi1: 0xff5a00,
    gi2: 0x003399,
    hair: 0x1a1a1a,
    skin: 0xffce9e,
  };

  const generateForm = (form: number) => {
    const isTransformed = form > 0;
    const isUI = form === 2;
    const SCALE = 2;
    const FRAME_WIDTH = 96;
    const FRAME_HEIGHT = 64;
    const DRAW_OFFSET_Y = 32;
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
        const pAcc = colors.part_accessory || "none";

        // ====================
        // LEGS
        // ====================
        if (pLegs === "spiderman") {
          // Spiderman tight pants (blue)
          box(10, 23, 4, 6, LEGS_2);
          box(18, 23, 4, 6, LEGS_2);
          box(14, 23, 4, 2, LEGS_2);
          box(10, 23, 1, 6, LEGS_2_SHADOW);
          box(21, 23, 1, 6, LEGS_2_SHADOW);
        } else if (pLegs === "jotaro") {
          // Jotaro long coat / slacks (black)
          box(10, 23, 4, 6, LEGS_1);
          box(18, 23, 4, 6, LEGS_1);
          box(14, 23, 4, 2, LEGS_1);
          box(10, 23, 2, 6, LEGS_1_SHADOW);
          box(18, 23, 2, 6, LEGS_1_SHADOW);
          // Belt
          box(10, 23, 12, 1, LEGS_2);
          box(15, 23, 2, 1, 0xffd700);
        } else if (pLegs === "saitama") {
          // Saitama yellow suit legs
          box(10, 23, 4, 6, LEGS_1);
          box(18, 23, 4, 6, LEGS_1);
          box(14, 23, 4, 2, LEGS_1);
          box(10, 23, 1, 6, LEGS_1_SHADOW);
          box(21, 23, 1, 6, LEGS_1_SHADOW);
        } else if (pLegs === "vegeta") {
          // Tight blue suit pants
          box(10, 23, 4, 6, LEGS_2);
          box(18, 23, 4, 6, LEGS_2);
          box(14, 23, 4, 2, LEGS_2);
        } else if (pLegs === "chapolim") {
          // Red tight pants
          box(10, 23, 4, 6, LEGS_1);
          box(18, 23, 4, 6, LEGS_1);
          box(14, 23, 4, 2, LEGS_1);
          // Yellow shorts over
          box(10, 23, 4, 2, LEGS_2);
          box(18, 23, 4, 2, LEGS_2);
          box(14, 23, 4, 2, LEGS_2);
        } else {
          // Goku baggy pants (orange)
          box(10, 23, 4, 6, LEGS_1);
          box(18, 23, 4, 6, LEGS_1);
          box(14, 23, 4, 2, LEGS_1);
          box(10, 23, 1, 6, LEGS_1_SHADOW);
          box(21, 23, 1, 6, LEGS_1_SHADOW);
          box(12, 24, 1, 4, LEGS_1_SHADOW);
          box(19, 24, 1, 4, LEGS_1_SHADOW);
        }

        // ====================
        // FEET
        // ====================
        if (pFeet === "spiderman") {
          box(10, 29, 4, 5, FEET_2);
          box(18, 29, 4, 5, FEET_2);
          box(10, 29, 1, 5, FEET_2_SHADOW);
          box(18, 29, 1, 5, FEET_2_SHADOW);
          box(10, 30, 4, 1, BLACK); // Web lines
          box(18, 30, 4, 1, BLACK);
        } else if (pFeet === "chapolim") {
          box(10, 29, 4, 3, FEET_1); // yellow top
          box(18, 29, 4, 3, FEET_1);
          box(10, 32, 4, 2, FEET_2); // red bottom
          box(18, 32, 4, 2, FEET_2);
        } else if (pFeet === "saitama") {
          box(10, 29, 4, 5, FEET_2); // red boots
          box(18, 29, 4, 5, FEET_2);
          box(10, 29, 1, 5, FEET_2_SHADOW);
          box(18, 29, 1, 5, FEET_2_SHADOW);
        } else if (pFeet === "vegeta") {
          box(10, 29, 4, 5, WHITE); // white boots
          box(18, 29, 4, 5, WHITE);
          box(10, 33, 4, 1, 0xffd700); // gold toe
          box(18, 33, 4, 1, 0xffd700); // gold toe
        } else if (pFeet === "jotaro") {
          box(10, 29, 4, 5, BLACK); // black shoes
          box(18, 29, 4, 5, BLACK);
          box(11, 29, 1, 5, 0x333333); // shine
          box(19, 29, 1, 5, 0x333333);
        } else {
          box(10, 29, 4, 3, FEET_1);
          box(18, 29, 4, 3, FEET_1);
          box(10, 29, 4, 1, 0xeaddcf); // rope
          box(18, 29, 4, 1, 0xeaddcf);
          box(12, 29, 1, 3, FEET_2); // red part
          box(20, 29, 1, 3, FEET_2);
          box(10, 31, 4, 1, FEET_1);
          box(18, 31, 4, 1, FEET_1);
          box(10, 30, 1, 2, FEET_1_SHADOW);
          box(18, 30, 1, 2, FEET_1_SHADOW);
        }

        // ====================
        // TORSO
        // ====================
        if (pTorso === "spiderman") {
          box(13, 14, 6, 9, TORSO_1); // Red core
          box(11, 14, 2, 9, TORSO_2); // Blue sides
          box(19, 14, 2, 9, TORSO_2);
          box(13, 14, 1, 9, TORSO_1_SHADOW);

          // Web pattern
          box(16, 14, 1, 9, BLACK); // center web
          box(14, 16, 4, 1, BLACK); // horizontal web
          box(14, 19, 4, 1, BLACK); // horizontal web
          box(15, 17, 2, 2, BLACK); // Logo (simplified)

          if (isCharge) {
            box(20, 4, 3, 10, TORSO_1);
            box(20, 14, 3, 3, TORSO_2);
            box(20, 2, 3, 3, TORSO_1); // Hands
            box(9, 4, 3, 10, TORSO_1);
            box(9, 14, 3, 3, TORSO_2);
            box(9, 2, 3, 3, TORSO_1); // Hands
          } else if (isAttack) {
            box(21, 13, 5, 4, TORSO_1);
            box(26, 14, 5, 3, TORSO_1);
            box(30, 14, 2, 3, TORSO_2);
            box(31, 13, 4, 4, TORSO_1);
            box(6, 15, 4, 5, TORSO_1);
            box(7, 14, 4, 3, TORSO_1);
            box(6, 18, 4, 2, TORSO_1);
          } else {
            box(8, 14, 3, 4, TORSO_1);
            box(21, 14, 3, 4, TORSO_1);
            box(8, 18, 3, 3, TORSO_2);
            box(21, 18, 3, 3, TORSO_2);
            box(8, 20, 3, 3, TORSO_1);
            box(21, 20, 3, 3, TORSO_1);
          }
        } else if (pTorso === "jotaro") {
          box(11, 14, 10, 11, TORSO_1); // Heavy black coat
          box(9, 14, 2, 11, TORSO_1); // Coat flair left
          box(21, 14, 2, 11, TORSO_1); // Coat flair right
          box(13, 14, 6, 9, TORSO_2); // Inner shirt
          box(14, 14, 4, 3, SKIN_TONE); // Chest

          box(17, 14, 2, 8, TORSO_1_SHADOW);
          box(12, 16, 2, 5, 0xffd700); // Gold chain

          if (isCharge) {
            box(20, 4, 3, 10, TORSO_1);
            box(20, 2, 3, 3, SKIN_TONE); // Hands
            box(9, 4, 3, 10, TORSO_1);
            box(9, 2, 3, 3, SKIN_TONE);
          } else if (isAttack) {
            box(21, 13, 5, 4, TORSO_1);
            box(26, 14, 5, 3, TORSO_1);
            box(31, 13, 4, 4, SKIN_TONE);
            box(6, 15, 4, 5, SKIN_TONE); // Left hand
            box(7, 14, 4, 3, TORSO_1); // Overlap
            box(6, 18, 4, 2, TORSO_1); // Overlap cuffs
          } else {
            box(8, 14, 3, 7, TORSO_1);
            box(21, 14, 3, 7, TORSO_1);
            box(8, 21, 3, 2, SKIN_TONE);
            box(21, 21, 3, 2, SKIN_TONE);
          }
        } else if (pTorso === "vegeta") {
          box(11, 14, 10, 9, TORSO_2); // Blue suit under
          box(11, 14, 10, 5, TORSO_1); // Armor
          box(9, 13, 3, 2, TORSO_1_SHADOW); // Shoulder pad left
          box(20, 13, 3, 2, TORSO_1_SHADOW); // Shoulder pad right
          box(11, 15, 10, 2, 0xffffff); // Chest plate line
          box(14, 14, 4, 3, TORSO_1); // Chest plate middle

          box(10, 18, 3, 2, TORSO_1_SHADOW); // Abdomen guard left
          box(19, 18, 3, 2, TORSO_1_SHADOW); // Abdomen guard right

          if (isCharge) {
            box(20, 4, 3, 10, TORSO_2);
            box(20, 2, 3, 3, WHITE); // Gloves
            box(9, 4, 3, 10, TORSO_2);
            box(9, 2, 3, 3, WHITE);
          } else if (isAttack) {
            box(21, 13, 5, 4, TORSO_2);
            box(26, 14, 5, 3, TORSO_2);
            box(30, 14, 2, 3, WHITE); // glove edge
            box(31, 13, 4, 4, WHITE);
            box(6, 15, 4, 5, WHITE);
            box(7, 14, 4, 3, TORSO_2);
            box(6, 18, 4, 2, WHITE); // glove edge
          } else {
            box(8, 14, 3, 6, TORSO_2);
            box(21, 14, 3, 6, TORSO_2);
            box(8, 20, 3, 3, WHITE);
            box(21, 20, 3, 3, WHITE);
          }
        } else if (pTorso === "saitama") {
          box(11, 14, 10, 9, TORSO_1); // yellow suit
          box(13, 14, 4, 2, SKIN_TONE); // chest exposed (neck)
          box(15, 16, 1, 6, TORSO_1_SHADOW); // zipper outline

          // belt
          box(11, 22, 10, 2, BLACK);
          box(14, 21, 4, 4, 0xffd700); // buckle

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
            box(8, 20, 3, 3, TORSO_2);
            box(21, 20, 3, 3, TORSO_2);
          }
        } else if (pTorso === "chapolim") {
          box(11, 14, 10, 9, TORSO_1); // red suit

          // Yellow heart shape roughly
          box(14, 15, 2, 1, TORSO_2);
          box(17, 15, 2, 1, TORSO_2);
          box(13, 16, 7, 2, TORSO_2);
          box(14, 18, 5, 2, TORSO_2);
          box(15, 20, 3, 1, TORSO_2);
          box(16, 21, 1, 1, TORSO_2);
          box(15, 17, 2, 2, TORSO_1); // CH roughly

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
            box(8, 14, 3, 6, TORSO_1);
            box(21, 14, 3, 6, TORSO_1);
            box(8, 20, 3, 3, SKIN_TONE);
            box(21, 20, 3, 3, SKIN_TONE);
          }
        } else if (pTorso === "muscle") {
          // Bare chest / Muscles
          box(11, 14, 10, 9, SKIN_TONE);

          // Pectorals
          box(11, 17, 3, 1, SKIN_SHADOW);
          box(18, 17, 3, 1, SKIN_SHADOW);
          box(15, 14, 2, 8, SKIN_SHADOW); // cleavage

          // Abs (6-pack)
          box(14, 19, 4, 1, SKIN_SHADOW);
          box(14, 21, 4, 1, SKIN_SHADOW);

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
            box(8, 14, 3, 7, SKIN_TONE);
            box(21, 14, 3, 7, SKIN_TONE);
            box(8, 20, 3, 3, TORSO_1); // wristbands
            box(21, 20, 3, 3, TORSO_1);
          }
        } else {
          // Goku Gi
          box(11, 14, 10, 9, TORSO_1);
          box(13, 14, 6, 4, TORSO_2);
          box(13, 14, 1, 4, TORSO_2_SHADOW);
          box(18, 14, 1, 4, TORSO_2_SHADOW);
          box(14, 14, 4, 3, SKIN_TONE); // exposed chest

          box(19, 17, 2, 6, TORSO_1_SHADOW);
          box(11, 17, 1, 5, TORSO_1_SHADOW);
          box(14, 18, 1, 4, TORSO_1_SHADOW);
          box(17, 18, 1, 4, TORSO_1_SHADOW);
          box(12, 19, 8, 1, TORSO_1_SHADOW);
          box(11, 22, 10, 2, TORSO_2); // Sash
          box(11, 23, 10, 1, TORSO_2_SHADOW);
          box(11, 23, 2, 4, TORSO_2);
          dot(12, 27, TORSO_2);

          if (isCharge) {
            box(20, 4, 3, 10, SKIN_TONE);
            box(20, 14, 3, 3, TORSO_1);
            box(20, 4, 3, 3, TORSO_2);
            box(20, 2, 3, 3, SKIN_TONE);
            box(9, 4, 3, 10, SKIN_TONE);
            box(9, 14, 3, 3, TORSO_1);
            box(9, 4, 3, 3, TORSO_2);
            box(9, 2, 3, 3, SKIN_TONE);
          } else if (isAttack) {
            box(21, 13, 5, 4, SKIN_TONE);
            box(21, 13, 3, 4, TORSO_1);
            box(21, 13, 1, 4, TORSO_1_SHADOW);
            box(26, 14, 5, 3, SKIN_TONE);
            box(30, 14, 2, 3, TORSO_2);
            box(31, 13, 4, 4, SKIN_TONE);
            box(31, 13, 2, 2, 0xffffff);
            alphaBox(33, 13, 6, 4, SKIN_TONE, 0.4);
            box(6, 15, 4, 5, SKIN_TONE);
            box(7, 14, 4, 3, TORSO_1);
            box(6, 18, 4, 2, TORSO_2);
          } else {
            box(8, 14, 3, 4, TORSO_1);
            box(21, 14, 3, 4, TORSO_1);
            box(8, 15, 1, 3, TORSO_1_SHADOW);
            box(23, 15, 1, 3, TORSO_1_SHADOW);
            box(8, 18, 3, 3, SKIN_TONE);
            box(21, 18, 3, 3, SKIN_TONE);
            box(8, 20, 3, 3, TORSO_2);
            box(21, 20, 3, 3, TORSO_2);
            box(8, 23, 3, 2, SKIN_TONE);
            box(21, 23, 3, 2, SKIN_TONE);
          }
        }

        // ====================
        // ACCESSORY (Back layer)
        // ====================
        if (pAcc === "cape" && pTorso !== "jotaro") {
          box(10, 14, 12, 13, ACC_1); // Simple cape behind arms
          box(9, 16, 2, 11, ACC_1);
          box(21, 16, 2, 11, ACC_1);
        } else if (pAcc === "sword") {
          // Sword sheathed on back
          box(12, 12, 2, 12, 0xdcdcdc); // blade poking out maybe
          box(11, 11, 4, 1, ACC_1); // hilt guard
          box(12, 8, 2, 3, 0x8b4513); // handle
        }

        const HEAD_1_SHADOW =
          Phaser.Display.Color.IntegerToColor(HEAD_1).darken(20).color;
        const HEAD_2 = colors.color_head_2 ?? colors.gi2;

        // ====================
        // HEAD / FACE
        // ====================
        if (pHead === "spiderman") {
          headBox(12, 6, 8, 7, HEAD_1);
          headDot(11, 9, HEAD_1);
          headDot(20, 9, HEAD_1);
          headBox(13, 12, 6, 1, HEAD_1_SHADOW);

          // Clean Spiderman Eyes (No webbing to avoid face lines)
          // Left Eye
          headBox(12, 8, 3, 3, BLACK);
          headBox(13, 9, 2, 1, WHITE);
          // Right Eye
          headBox(17, 8, 3, 3, BLACK);
          headBox(17, 9, 2, 1, WHITE);
        } else if (pHead === "saitama") {
          headBox(12, 5, 8, 8, SKIN_TONE);
          headDot(11, 9, SKIN_TONE);
          headDot(20, 9, SKIN_TONE);
          headBox(13, 12, 6, 1, SKIN_SHADOW);
          headDot(14, 9, BLACK);
          headDot(18, 9, BLACK);
          headDot(14, 10, WHITE);
          headDot(18, 10, WHITE);
        } else if (pHead === "chapolim") {
          headBox(12, 6, 8, 7, SKIN_TONE); // face
          headBox(11, 5, 10, 5, HEAD_1); // Red hood covering top/sides
          headDot(11, 9, HEAD_1);
          headDot(20, 9, HEAD_1);

          headBox(13, 3, 1, 2, HEAD_1); // Antennae
          headBox(18, 3, 1, 2, HEAD_1);
          headDot(12, 2, HEAD_2); // yellow tips
          headDot(19, 2, HEAD_2);

          headDot(14, 9, eyeColor);
          headDot(18, 9, eyeColor);
        } else if (pHead === "vegeta") {
          headBox(12, 6, 8, 7, SKIN_TONE);
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
          headBox(14, 5, 4, 1, hairColor);
          headDot(15, 6, hairColor);
          headDot(16, 6, hairColor);

          headBox(12, 5, 2, 3, hairColor); // side burns
          headBox(18, 5, 2, 3, hairColor);

          if (isTransformed) {
            // Super Saiyan Vegeta hair stands straight up
            headBox(10, 0, 12, 5, hairColor); // Base volume
            headBox(11, -3, 10, 5, hairColor);
            headBox(12, -6, 8, 3, hairColor);
            headBox(13, -8, 6, 2, hairColor);
            headBox(14, -10, 4, 2, hairColor); // Central spike
            headBox(8, -1, 2, 4, hairColor); // side flares
            headBox(22, -1, 2, 4, hairColor);
          } else {
            // Base Vegeta hair
            headBox(10, 0, 12, 5, hairColor);
            headBox(11, -2, 10, 2, hairColor);
            headBox(12, -4, 8, 2, hairColor);
            headBox(13, -6, 6, 2, hairColor);
            headBox(14, -8, 4, 2, hairColor);
            headBox(8, -1, 2, 4, hairColor);
            headBox(22, -1, 2, 4, hairColor);
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
        } else if (pHead === "jotaro") {
          headBox(12, 6, 8, 7, SKIN_TONE);
          headDot(11, 9, SKIN_TONE);
          headDot(20, 9, SKIN_TONE);

          // Jotaro Hat
          headBox(10, 4, 12, 3, HEAD_1); // Brim
          headBox(11, 1, 10, 3, HEAD_1); // Top
          // Hat decor
          headBox(12, 3, 2, 1, 0xffd700); // Gold pin

          // Hair blending
          headBox(10, 6, 2, 4, hairColor);
          headBox(20, 6, 2, 4, hairColor);
          headBox(11, 10, 3, 2, hairColor); // back hair

          headDot(13, 8, eyebrowColor); // angry brow
          headDot(14, 8, eyebrowColor);
          headDot(17, 8, eyebrowColor);
          headDot(18, 8, eyebrowColor);
          headDot(14, 9, eyeColor);
          headDot(18, 9, eyeColor);

          if (isCharge) {
            headBox(15, 12, 2, 2, 0x000000);
          } else {
            headBox(14, 12, 4, 1, 0x000000);
          }
        } else {
          // Generic anime head (Goku base)
          headBox(12, 6, 8, 7, SKIN_TONE);
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
          } else if (isUI) {
            headBox(11, 1, 10, 7, hairColor);
            headBox(14, -1, 4, 3, hairColor);
            headBox(9, 2, 2, 5, hairColor);
            headBox(7, 3, 2, 4, hairColor);
            headBox(21, 2, 2, 4, hairColor);
            headBox(13, 6, 2, 3, hairColor);
            headBox(16, 6, 3, 3, hairColor);
          } else {
            headBox(11, 1, 10, 5, hairColor);
            headBox(13, -2, 3, 3, hairColor);
            headBox(16, -1, 3, 2, hairColor);
            headBox(9, 0, 2, 4, hairColor);
            headBox(7, 1, 2, 3, hairColor);
            headBox(21, 1, 2, 4, hairColor);
            headBox(23, 2, 2, 3, hairColor);
            headBox(13, 6, 2, 2, hairColor);
            headBox(16, 6, 2, 2, hairColor);
          }
        }

        // ====================
        // ACCESSORY (Front layer)
        // ====================
        if (pAcc === "sword") {
          if (isCharge) {
            box(23, 6, 1, 12, 0xaaaaaa);
            box(22, 13, 3, 1, 0xffd700);
            box(23, 14, 1, 3, 0x552200);
          } else if (isAttack) {
            box(32, 10, 12, 1, 0xaaaaaa);
            box(31, 9, 1, 3, 0xffd700);
            box(29, 10, 2, 1, 0x552200);
          } else {
            box(7, 10, 1, 12, 0xaaaaaa);
            box(6, 17, 3, 1, 0xffd700);
            box(7, 18, 1, 3, 0x552200);
          }
        }
      }
    }

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

  generateForm(0);
  generateForm(1);
  generateForm(2);
}
