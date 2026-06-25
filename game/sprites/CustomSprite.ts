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
          // Spiderman tight pants (blue with red boots later)
          box(10, 23, 4, 6, LEGS_2);
          box(18, 23, 4, 6, LEGS_2);
          box(14, 23, 4, 2, LEGS_2);
          box(10, 23, 1, 6, LEGS_2_SHADOW);
          box(21, 23, 1, 6, LEGS_2_SHADOW);
          box(12, 24, 1, 4, LEGS_2_SHADOW); // Inner thigh definition
          box(19, 24, 1, 4, LEGS_2_SHADOW);
        } else if (pLegs === "jotaro") {
          // Jotaro long coat flares and slacks (black)
          box(9, 23, 5, 6, LEGS_1); // Thicker legs
          box(18, 23, 5, 6, LEGS_1);
          box(14, 23, 4, 2, LEGS_1);
          box(10, 23, 1, 6, LEGS_1_SHADOW);
          box(21, 23, 1, 6, LEGS_1_SHADOW);
          // Belt is already handled in torso for jotaro, but we can add pocket chains
          box(10, 24, 1, 3, 0xffd700); // Gold chain left
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
          // Tight blue suit pants
          box(10, 23, 4, 6, LEGS_2);
          box(18, 23, 4, 6, LEGS_2);
          box(14, 23, 4, 2, LEGS_2);
          box(10, 23, 1, 6, LEGS_2_SHADOW);
          box(21, 23, 1, 6, LEGS_2_SHADOW);
          // Ribbing continued
          box(10, 25, 4, 1, LEGS_2_SHADOW);
          box(18, 25, 4, 1, LEGS_2_SHADOW);
          box(10, 27, 4, 1, LEGS_2_SHADOW);
          box(18, 27, 4, 1, LEGS_2_SHADOW);
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
          box(10, 32, 4, 1, BLACK); // Web lines
          box(18, 32, 4, 1, BLACK);
        } else if (pFeet === "chapolim") {
          box(10, 29, 4, 3, FEET_1); // yellow top
          box(18, 29, 4, 3, FEET_1);
          box(10, 29, 1, 3, FEET_1_SHADOW); 
          box(18, 29, 1, 3, FEET_1_SHADOW); 
          box(10, 32, 4, 2, FEET_2); // red bottom
          box(18, 32, 4, 2, FEET_2);
        } else if (pFeet === "saitama") {
          box(10, 29, 4, 5, FEET_2); // red boots
          box(18, 29, 4, 5, FEET_2);
          box(10, 29, 1, 5, FEET_2_SHADOW);
          box(18, 29, 1, 5, FEET_2_SHADOW);
          // boot top folds
          box(9, 28, 6, 2, FEET_2);
          box(17, 28, 6, 2, FEET_2);
          box(9, 29, 6, 1, FEET_2_SHADOW);
          box(17, 29, 6, 1, FEET_2_SHADOW);
        } else if (pFeet === "vegeta") {
          box(10, 29, 4, 5, WHITE); // white boots
          box(18, 29, 4, 5, WHITE);
          box(10, 29, 1, 5, 0xdddddd);
          box(18, 29, 1, 5, 0xdddddd);
          box(10, 33, 4, 1, 0xffd700); // gold toe
          box(18, 33, 4, 1, 0xffd700); // gold toe
        } else if (pFeet === "jotaro") {
          box(9, 29, 5, 5, BLACK); // black shoes, slightly wider
          box(18, 29, 5, 5, BLACK);
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
          box(13, 14, 6, 9, TORSO_1); // Core Red
          box(11, 14, 2, 9, TORSO_2); // Blue sides
          box(19, 14, 2, 9, TORSO_2);

          // Shading
          box(13, 14, 1, 9, TORSO_1_SHADOW);
          box(11, 14, 1, 9, TORSO_2_SHADOW);
          box(20, 14, 1, 9, TORSO_2_SHADOW);

          // Belt
          box(11, 22, 10, 2, TORSO_1);
          box(11, 23, 10, 1, BLACK); // Belt web line
          box(13, 17, 6, 1, BLACK); // Horizontal web curve
          box(13, 19, 6, 1, BLACK);

          // Web pattern vertical lines (thin and clean)
          box(16, 14, 1, 8, BLACK);
          dot(14, 15, BLACK);
          dot(18, 15, BLACK);
          dot(13, 17, BLACK);
          dot(19, 17, BLACK);
          dot(14, 20, BLACK);
          dot(18, 20, BLACK);

          // Small Spider Emblem
          box(15, 16, 2, 3, BLACK); // Body
          box(14, 16, 4, 1, BLACK); // Upper legs
          box(14, 18, 4, 1, BLACK); // Lower legs

          if (isCharge) {
            box(20, 4, 3, 10, TORSO_1);
            box(20, 14, 3, 3, TORSO_1);
            box(20, 2, 3, 3, TORSO_1); // Hands
            box(9, 4, 3, 10, TORSO_1);
            box(9, 14, 3, 3, TORSO_1);
            box(9, 2, 3, 3, TORSO_1); // Hands
          } else if (isAttack) {
            box(21, 14, 6, 3, TORSO_1); // shoulder
            box(27, 14, 5, 3, TORSO_1); // forearm
            box(32, 13, 4, 4, TORSO_1); // hand
            box(8, 14, 3, 4, TORSO_1);
            box(7, 18, 4, 4, TORSO_1);
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
            box(8, 19, 3, 1, BLACK);
            box(21, 19, 3, 1, BLACK);
            box(8, 21, 3, 1, BLACK);
            box(21, 21, 3, 1, BLACK);

            // Hands
            box(8, 23, 3, 2, TORSO_1);
            box(21, 23, 3, 2, TORSO_1);
          }
        } else if (pTorso === "jotaro") {
          // Gakuran / Heavy coat
          box(11, 14, 10, 8, TORSO_1_SHADOW); // base coat shadow
          box(12, 14, 8, 8, TORSO_1);

          // Inner Shirt
          box(13, 14, 6, 8, TORSO_2_SHADOW);
          box(14, 14, 4, 8, TORSO_2);

          // Exposed chest/neck
          box(14, 14, 4, 2, SKIN_SHADOW);
          box(15, 14, 2, 1, SKIN_TONE);

          // Open coat lapels (Lapelas abertas)
          box(11, 14, 2, 8, TORSO_1); // Lapela esquerda
          box(11, 14, 1, 8, TORSO_1_SHADOW); // Linha lapela esquerda
          box(19, 14, 2, 8, TORSO_1); // Lapela direita
          box(20, 14, 1, 8, TORSO_1_SHADOW); // Linha lapela direita

          // High collar (Gola alta rígida)
          box(12, 11, 8, 3, TORSO_1_SHADOW);
          box(13, 12, 6, 2, TORSO_1);

          // Golden metal chain (Corrente dourada em argolas)
          box(12, 13, 1, 5, 0xd4a000); // Gold dark
          dot(12, 13, 0xffea00); // Gold light
          dot(12, 15, 0xffea00);
          dot(12, 17, 0xffea00);

          // Double belts / Cinto duplo de Jotaro
          box(11, 22, 10, 2, TORSO_1_SHADOW);
          box(12, 22, 8, 1, 0x27ae60); // Green belt
          box(12, 23, 8, 1, 0xc0392b); // Red belt
          box(14, 22, 2, 2, 0xffd700); // Gold buckle

          // Coat flares at back sides (Abas do casaco)
          box(9, 14, 2, 11, TORSO_1_SHADOW); // Coat flair left
          box(21, 14, 2, 11, TORSO_1_SHADOW); // Coat flair right

          if (isCharge) {
            box(20, 4, 3, 10, TORSO_1);
            box(20, 2, 3, 3, SKIN_TONE); // Hands
            box(9, 4, 3, 10, TORSO_1);
            box(9, 2, 3, 3, SKIN_TONE);
          } else if (isAttack) {
            // Braço de ataque Jotaro style
            box(18, 13, 10, 5, TORSO_1);
            box(18, 13, 10, 1, TORSO_1_SHADOW);
            box(28, 13, 4, 4, SKIN_TONE);
            box(28, 13, 2, 2, SKIN_SHADOW);
            box(8, 14, 4, 8, TORSO_1);
          } else {
            // Braços Jotaro style no bolso/cruzados
            box(8, 14, 3, 3, TORSO_1); // Ombro Trás
            box(21, 14, 3, 3, TORSO_1); // Ombro Frente
            
            box(8, 16, 3, 7, TORSO_1_SHADOW); // Braço trás Base
            box(9, 17, 1, 5, TORSO_1); // Braço trás Volume
            
            box(21, 16, 3, 7, TORSO_1_SHADOW); // Braço frente Base
            box(22, 17, 1, 5, TORSO_1); // Braço frente Volume
          }
        } else if (pTorso === "vegeta") {
          // Bodysuit underneath
          box(12, 19, 8, 4, TORSO_2_SHADOW);
          for (let ty = 19; ty < 23; ty += 2) {
            box(12, ty, 8, 1, TORSO_2_SHADOW);
            box(12, ty + 1, 8, 1, TORSO_2);
          }
          box(12, 19, 1, 5, TORSO_2_SHADOW);
          box(19, 19, 1, 5, TORSO_2_SHADOW);

          // Main armor block
          box(11, 14, 10, 5, TORSO_1); // White armor plate

          // Side gold straps wrap (Classic Vegeta gold straps)
          box(11, 14, 1, 5, 0xffd700); // Gold strap left
          box(20, 14, 1, 5, 0xffd700); // Gold strap right

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

          if (isCharge) {
            box(20, 4, 3, 10, TORSO_2);
            box(20, 14, 3, 3, TORSO_1); // Shoulder pad
            box(20, 2, 3, 3, WHITE); // Gloves
            box(9, 4, 3, 10, TORSO_2);
            box(9, 14, 3, 3, TORSO_1); // Shoulder pad
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
            // Resting arms with Suit Ribbing
            box(8, 14, 3, 6, TORSO_2);
            box(21, 14, 3, 6, TORSO_2);
            // Arm ribbed shading
            box(8, 15, 3, 1, TORSO_2_SHADOW);
            box(8, 17, 3, 1, TORSO_2_SHADOW);
            box(21, 15, 3, 1, TORSO_2_SHADOW);
            box(21, 17, 3, 1, TORSO_2_SHADOW);
            
            // Shoulder Pads Vegeta style
            box(7, 13, 5, 2, TORSO_1); // Left pad
            box(20, 13, 5, 2, TORSO_1); // Right pad
            box(7, 13, 1, 2, TORSO_1_SHADOW); // pad shadow
            box(24, 13, 1, 2, TORSO_1_SHADOW);

            box(8, 20, 3, 4, WHITE); // Gloves
            box(21, 20, 3, 4, WHITE);
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
        } else if (pTorso === "muscle") {
          // Bare chest / Muscles
          box(11, 14, 10, 9, SKIN_TONE);

          // Lateral Shading (Side muscle definition)
          box(11, 14, 1, 9, SKIN_SHADOW);
          box(20, 14, 1, 9, SKIN_SHADOW);

          // Pectorals / Chest definition
          box(12, 17, 3, 1, SKIN_SHADOW); // left pec bottom
          box(17, 17, 3, 1, SKIN_SHADOW); // right pec bottom
          box(15, 14, 2, 5, SKIN_SHADOW); // central cleavage line

          // Collarbones (Clavículas)
          box(12, 14, 2, 1, SKIN_SHADOW);
          box(18, 14, 2, 1, SKIN_SHADOW);

          // Abs (6-pack / 8-pack muscle lines)
          box(15, 19, 2, 4, SKIN_SHADOW); // Center abs division
          box(13, 19, 1, 3, SKIN_SHADOW); // Left abs outline
          box(18, 19, 1, 3, SKIN_SHADOW); // Right abs outline
          box(13, 20, 6, 1, SKIN_SHADOW); // Upper pack horizontal break
          box(13, 22, 6, 1, SKIN_SHADOW); // Lower pack horizontal break

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
          // Goku Gi
          box(11, 14, 10, 9, TORSO_1);
          box(13, 14, 6, 4, TORSO_2); // Undershirt
          box(13, 14, 1, 4, TORSO_2_SHADOW);
          box(18, 14, 1, 4, TORSO_2_SHADOW);
          box(14, 14, 4, 2, SKIN_TONE); // Neck

          // Neck shadow
          box(14, 15, 4, 1, SKIN_SHADOW);
          dot(15, 16, SKIN_TONE); // V-neck dip

          // Gi folds on torso
          box(19, 17, 2, 6, TORSO_1_SHADOW); // Shading right
          box(11, 17, 1, 5, TORSO_1_SHADOW); // Shading left
          box(14, 18, 1, 4, TORSO_1_SHADOW);
          box(17, 18, 1, 4, TORSO_1_SHADOW); // Inner folds
          box(12, 19, 8, 1, TORSO_1_SHADOW); // Horizontal fold
          box(15, 20, 2, 2, TORSO_1_SHADOW); // Center wrinkle

          // Sash with knot (Faixa azul com nó)
          box(11, 22, 10, 2, TORSO_2); // Sash
          box(11, 23, 10, 1, TORSO_2_SHADOW); // Sash shadow
          box(11, 23, 2, 4, TORSO_2); // Knot flap
          box(11, 27, 2, 1, TORSO_2); // Lower flap
          box(11, 24, 1, 4, TORSO_2_SHADOW); // Knot shadow

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
            box(8, 18, 1, 3, SKIN_SHADOW); // arm shadow
            box(23, 18, 1, 3, SKIN_SHADOW);
            box(9, 19, 1, 2, SKIN_SHADOW);
            box(22, 19, 1, 2, SKIN_SHADOW); // Bicep definition

            box(8, 20, 3, 3, TORSO_2); // Wristbands
            box(21, 20, 3, 3, TORSO_2);
            box(8, 20, 1, 3, TORSO_2_SHADOW); // Wristbands shadow
            box(23, 20, 1, 3, TORSO_2_SHADOW);

            box(8, 23, 3, 2, SKIN_TONE); // Hands
            box(21, 23, 3, 2, SKIN_TONE);
            box(8, 24, 3, 1, SKIN_SHADOW); // Knuckles
            box(21, 24, 3, 1, SKIN_SHADOW);
          }
        }

        // ====================
        // ACCESSORY (Back layer)
        // ====================
        if (pAcc === "cape" && pTorso !== "jotaro") {
          box(8, 15, 3, 14, ACC_1); // aba esquerda
          box(21, 15, 3, 14, ACC_1); // aba direita
          box(9, 27, 14, 2, ACC_1); // dobra inferior conectando
          const ACC_1_SHADOW = Phaser.Display.Color.IntegerToColor(ACC_1).darken(20).color;
          box(8, 15, 1, 14, ACC_1_SHADOW); // sombra da dobra
          box(23, 15, 1, 14, ACC_1_SHADOW);
        } else if (pAcc === "sword") {
          // Sword sheathed on back
          box(23, 6, 2, 16, 0xdcdcdc); // lâmina na lateral, não sobre o peito
          box(22, 6, 1, 16, 0xaaaaaa); // sombra da lâmina
          box(21, 11, 4, 2, ACC_1); // hilt guard
          box(22, 4, 2, 4, 0x8b4513); // cabo
        } else if (pAcc === "aura_blue") {
          // Visual back aura
          canvas.fillStyle(0x0088ff, 0.4);
          canvas.fillRect((offsetX + 4) * SCALE, (DRAW_OFFSET_Y + 2) * SCALE, 24 * SCALE, 32 * SCALE);
          canvas.fillStyle(0x00ffff, 0.6);
          canvas.fillRect((offsetX + 6) * SCALE, (DRAW_OFFSET_Y + 4) * SCALE, 20 * SCALE, 28 * SCALE);
          canvas.fillStyle(0xffffff, 1);
        } else if (pAcc === "aura_red") {
          // Visual back aura
          canvas.fillStyle(0xaa0000, 0.4);
          canvas.fillRect((offsetX + 4) * SCALE, (DRAW_OFFSET_Y + 2) * SCALE, 24 * SCALE, 32 * SCALE);
          canvas.fillStyle(0xff0000, 0.6);
          canvas.fillRect((offsetX + 6) * SCALE, (DRAW_OFFSET_Y + 4) * SCALE, 20 * SCALE, 28 * SCALE);
          canvas.fillStyle(0xffffff, 1);
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
        } else if (pHead === "jotaro") {
          headBox(12, 6, 8, 7, SKIN_TONE);
          headDot(11, 9, SKIN_TONE);
          headDot(20, 9, SKIN_TONE);

          // Jotaro Hat
          headBox(10, 4, 12, 3, HEAD_1); // Brim
          headBox(11, 1, 10, 3, HEAD_1); // Top
          // Hat decor
          headBox(12, 3, 3, 1, 0xffd700); // Gold pin
          headBox(16, 2, 2, 2, HEAD_1_SHADOW);

          // Hair blending (integrating with hat at the back)
          headBox(10, 6, 2, 5, hairColor);
          headBox(20, 6, 2, 5, hairColor);
          headBox(11, 10, 10, 3, hairColor); // back hair (fused with hat)
          headBox(11, 12, 10, 1, 0x111111); // hair shadow

          headBox(13, 8, 2, 1, eyebrowColor); // angry brow
          headBox(17, 8, 2, 1, eyebrowColor);
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
