import Phaser from "phaser";
import { CharacterData } from "../types";

export function generateCustomSprite(scene: Phaser.Scene, charData: CharacterData) {
    const key = charData.key;
    const colors = charData.customData || { gi1: 0xff5a00, gi2: 0x003399, hair: 0x1a1a1a, skin: 0xffce9e };

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

            const breatheOffset = (!isAttack && !isDefend && !isCharge && !isWalk && (f === 1 || f === 3)) ? 1 : 0;
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
                const finalYPose = (isAttack || isDefend || isCharge ? finalY + poseOffsetY / 2 : finalY) + oy;
                canvas.fillStyle(color, 1);
                canvas.fillRect((offsetX + finalX) * SCALE, (finalYPose + DRAW_OFFSET_Y) * SCALE, SCALE, SCALE);
            };

            const alphaBox = (x: number, y: number, w: number, h: number, color: number, alpha: number) => {
                const finalY = y < 24 ? y + breatheOffset : y;
                const { ox, oy } = typeof getWalkOffsets === 'function' ? getWalkOffsets(x, y) : { ox:0, oy:0 };
                const finalX = (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX + ox;
                const finalYPose = (isAttack || isDefend || isCharge ? finalY + poseOffsetY / 2 : finalY) + oy;
                canvas.fillStyle(color, alpha);
                canvas.fillRect((offsetX + finalX) * SCALE, (finalYPose + DRAW_OFFSET_Y) * SCALE, w * SCALE, h * SCALE);
            };

            const box = (x: number, y: number, w: number, h: number, color: number) => {
                const finalY = y < 24 ? y + breatheOffset : y;
                const { ox, oy } = typeof getWalkOffsets === 'function' ? getWalkOffsets(x, y) : { ox:0, oy:0 };
                const finalX = (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX + ox;
                const finalYPose = (isAttack || isDefend || isCharge ? finalY + poseOffsetY / 2 : finalY) + oy;
                canvas.fillStyle(color, 1);
                canvas.fillRect((offsetX + finalX) * SCALE, (finalYPose + DRAW_OFFSET_Y) * SCALE, w * SCALE, h * SCALE);
            };

            const headBox = (x: number, y: number, w: number, h: number, color: number) => {
                const { ox, oy } = typeof getWalkOffsets === 'function' ? getWalkOffsets(x, y) : { ox:0, oy:0 };
                const finalX = (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX + ox;
                const finalYPose = isAttack || isDefend ? y + poseOffsetY / 2 : y;
                canvas.fillStyle(color, 1);
                canvas.fillRect((offsetX + finalX) * SCALE, (finalYPose + breatheOffset + DRAW_OFFSET_Y) * SCALE, w * SCALE, h * SCALE);
            };

            const headDot = (x: number, y: number, color: number) => {
                const { ox, oy } = typeof getWalkOffsets === 'function' ? getWalkOffsets(x, y) : { ox:0, oy:0 };
                const finalX = (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX + ox;
                const finalYPose = isAttack || isDefend ? y + poseOffsetY / 2 : y;
                canvas.fillStyle(color, 1);
                canvas.fillRect((offsetX + finalX) * SCALE, (finalYPose + breatheOffset + DRAW_OFFSET_Y) * SCALE, SCALE, SCALE);
            };

            const WHITE = 0xffffff;
            const BLACK = 0x111111;

            {
                const GI_1 = colors.gi1; 
                const GI_1_SHADOW = Phaser.Display.Color.IntegerToColor(colors.gi1).darken(20).color;
                const GI_2 = colors.gi2; 
                const GI_2_SHADOW = Phaser.Display.Color.IntegerToColor(colors.gi2).darken(20).color;
                
                const SKIN_TONE = colors.skin;
                const SKIN_SHADOW = Phaser.Display.Color.IntegerToColor(colors.skin).darken(20).color;
                
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
                const pTorso = colors.part_torso || 'goku';
                // @ts-ignore
                const pLegs = colors.part_legs || 'goku';
                // @ts-ignore
                const pFeet = colors.part_feet || 'goku';
                // @ts-ignore
                const pHead = colors.part_head || 'goku';
                // @ts-ignore
                const pAcc = colors.part_accessory || 'none';

                // ====================
                // LEGS
                // ====================
                if (pLegs === 'spiderman') {
                    // Spiderman tight pants (blue)
                    box(10, 23, 4, 6, GI_2);
                    box(18, 23, 4, 6, GI_2);
                    box(10, 23, 1, 6, GI_2_SHADOW);
                    box(21, 23, 1, 6, GI_2_SHADOW);
                } else if (pLegs === 'jotaro') {
                    // Jotaro long coat / slacks (black)
                    box(10, 23, 4, 6, GI_1);
                    box(18, 23, 4, 6, GI_1);
                    box(14, 23, 4, 2, GI_1); 
                    box(10, 23, 2, 6, GI_1_SHADOW);
                    box(18, 23, 2, 6, GI_1_SHADOW);
                } else if (pLegs === 'saitama') {
                    // Saitama yellow suit legs
                    box(10, 23, 4, 6, GI_1);
                    box(18, 23, 4, 6, GI_1);
                    box(14, 23, 4, 2, GI_1); 
                    box(10, 23, 1, 6, GI_1_SHADOW);
                    box(21, 23, 1, 6, GI_1_SHADOW);
                } else {
                    // Goku baggy pants (orange)
                    box(10, 23, 4, 6, GI_1);
                    box(18, 23, 4, 6, GI_1);
                    box(14, 23, 4, 2, GI_1); 
                    box(10, 23, 1, 6, GI_1_SHADOW);
                    box(21, 23, 1, 6, GI_1_SHADOW);
                    box(12, 24, 1, 4, GI_1_SHADOW);
                    box(19, 24, 1, 4, GI_1_SHADOW);
                }

                // ====================
                // FEET
                // ====================
                if (pFeet === 'spiderman') {
                    box(10, 29, 4, 5, GI_1);
                    box(18, 29, 4, 5, GI_1);
                    box(10, 29, 1, 5, GI_1_SHADOW);
                    box(18, 29, 1, 5, GI_1_SHADOW);
                    box(10, 30, 4, 1, BLACK); // Web lines
                    box(18, 30, 4, 1, BLACK);
                } else if (pFeet === 'chapolim') {
                    box(10, 29, 4, 3, GI_2); // yellow top
                    box(18, 29, 4, 3, GI_2);
                    box(10, 32, 4, 2, GI_1); // red bottom
                    box(18, 32, 4, 2, GI_1);
                } else {
                    box(10, 29, 4, 3, GI_2);
                    box(18, 29, 4, 3, GI_2);
                    box(10, 29, 4, 1, 0xeaddcf); // rope
                    box(18, 29, 4, 1, 0xeaddcf);
                    box(12, 29, 1, 3, GI_1); // red part
                    box(20, 29, 1, 3, GI_1); 
                    box(10, 31, 4, 1, GI_2);
                    box(18, 31, 4, 1, GI_2);
                    box(10, 30, 1, 2, GI_2_SHADOW);
                    box(18, 30, 1, 2, GI_2_SHADOW);
                }

                // ====================
                // TORSO
                // ====================
                if (pTorso === 'spiderman') {
                    box(13, 14, 6, 9, GI_1); // Red core
                    box(11, 14, 2, 9, GI_2); // Blue sides
                    box(19, 14, 2, 9, GI_2);
                    box(13, 14, 1, 9, GI_1_SHADOW);
                    box(15, 17, 2, 3, BLACK); // Logo (simplified)
                    
                    if (isCharge) {
                        box(20, 4, 3, 10, GI_1); 
                        box(20, 14, 3, 3, GI_2);
                        box(9, 4, 3, 10, GI_1); 
                        box(9, 14, 3, 3, GI_2); 
                    } else if (isAttack) {
                        box(21, 13, 5, 4, GI_1); 
                        box(31, 13, 4, 4, GI_1); 
                        box(6, 15, 4, 5, GI_1);
                    } else {
                        box(8, 14, 3, 4, GI_1);
                        box(21, 14, 3, 4, GI_1);
                        box(8, 18, 3, 3, GI_2);
                        box(21, 18, 3, 3, GI_2);
                        box(8, 20, 3, 3, GI_1);
                        box(21, 20, 3, 3, GI_1); 
                    }
                } else if (pTorso === 'jotaro') {
                    box(11, 14, 10, 11, GI_1); // Heavy black coat
                    box(13, 14, 6, 9, GI_2); // Inner shirt
                    box(14, 14, 4, 3, SKIN_TONE); // Chest
                    box(17, 14, 2, 8, GI_1_SHADOW); 
                    
                    if (isCharge) {
                        box(20, 4, 3, 10, GI_1); 
                        box(9, 4, 3, 10, GI_1); 
                    } else if (isAttack) {
                        box(21, 13, 5, 4, GI_1); 
                        box(31, 13, 4, 4, SKIN_TONE); 
                        box(6, 15, 4, 5, GI_1);
                    } else {
                        box(8, 14, 3, 7, GI_1);
                        box(21, 14, 3, 7, GI_1);
                        box(8, 21, 3, 2, SKIN_TONE);
                        box(21, 21, 3, 2, SKIN_TONE); 
                    }
                } else if (pTorso === 'vegeta') {
                    box(11, 14, 10, 9, GI_2); // Blue suit under
                    box(12, 14, 8, 5, GI_1); // Armor
                    box(10, 13, 3, 2, GI_1_SHADOW); // Shoulder pad
                    box(19, 13, 3, 2, GI_1_SHADOW);
                    box(14, 15, 4, 3, 0xffffff); // Chest plate
                    
                    if (isCharge) {
                        box(20, 4, 3, 10, GI_2); 
                        box(20, 2, 3, 3, WHITE); // Gloves
                        box(9, 4, 3, 10, GI_2); 
                        box(9, 2, 3, 3, WHITE); 
                    } else if (isAttack) {
                        box(21, 13, 5, 4, GI_2); 
                        box(31, 13, 4, 4, WHITE); 
                        box(6, 15, 4, 5, GI_2);
                    } else {
                        box(8, 14, 3, 6, GI_2);
                        box(21, 14, 3, 6, GI_2);
                        box(8, 20, 3, 3, WHITE);
                        box(21, 20, 3, 3, WHITE); 
                    }
                } else {
                    // Goku Gi
                    box(11, 14, 10, 9, GI_1);
                    box(13, 14, 6, 4, GI_2); 
                    box(13, 14, 1, 4, GI_2_SHADOW);
                    box(18, 14, 1, 4, GI_2_SHADOW);
                    box(14, 14, 4, 2, SKIN_TONE); 
                    box(14, 15, 4, 1, SKIN_SHADOW);
                    dot(15, 16, SKIN_TONE); 
                    box(19, 17, 2, 6, GI_1_SHADOW); 
                    box(11, 17, 1, 5, GI_1_SHADOW); 
                    box(14, 18, 1, 4, GI_1_SHADOW);
                    box(17, 18, 1, 4, GI_1_SHADOW); 
                    box(12, 19, 8, 1, GI_1_SHADOW); 
                    box(11, 22, 10, 2, GI_2); // Sash
                    box(11, 23, 10, 1, GI_2_SHADOW);
                    box(11, 23, 2, 4, GI_2);
                    dot(12, 27, GI_2);

                    if (isCharge) {
                        box(20, 4, 3, 10, SKIN_TONE); 
                        box(20, 14, 3, 3, GI_1); 
                        box(20, 4, 3, 3, GI_2); 
                        box(20, 2, 3, 3, SKIN_TONE); 
                        box(9, 4, 3, 10, SKIN_TONE); 
                        box(9, 14, 3, 3, GI_1); 
                        box(9, 4, 3, 3, GI_2); 
                        box(9, 2, 3, 3, SKIN_TONE); 
                    } else if (isAttack) {
                        box(21, 13, 5, 4, SKIN_TONE); 
                        box(21, 13, 3, 4, GI_1); 
                        box(21, 13, 1, 4, GI_1_SHADOW);
                        box(26, 14, 5, 3, SKIN_TONE); 
                        box(30, 14, 2, 3, GI_2); 
                        box(31, 13, 4, 4, SKIN_TONE); 
                        box(31, 13, 2, 2, 0xffffff); 
                        alphaBox(33, 13, 6, 4, SKIN_TONE, 0.4);
                        box(6, 15, 4, 5, SKIN_TONE);
                        box(7, 14, 4, 3, GI_1);
                        box(6, 18, 4, 2, GI_2);
                    } else {
                        box(8, 14, 3, 4, GI_1);
                        box(21, 14, 3, 4, GI_1);
                        box(8, 15, 1, 3, GI_1_SHADOW);
                        box(23, 15, 1, 3, GI_1_SHADOW);
                        box(8, 18, 3, 3, SKIN_TONE);
                        box(21, 18, 3, 3, SKIN_TONE);
                        box(8, 20, 3, 3, GI_2);
                        box(21, 20, 3, 3, GI_2); 
                        box(8, 23, 3, 2, SKIN_TONE);
                        box(21, 23, 3, 2, SKIN_TONE); 
                    }
                }

                // ====================
                // ACCESSORY (Back layer)
                // ====================
                if (pAcc === 'cape' && pTorso !== 'jotaro') {
                    box(10, 14, 12, 12, GI_2); // Simple cape behind arms
                    box(9, 16, 2, 10, GI_2);
                    box(21, 16, 2, 10, GI_2);
                }

                // ====================
                // HEAD / FACE
                // ====================
                if (pHead === 'spiderman') {
                    headBox(12, 6, 8, 7, GI_1);
                    headDot(11, 9, GI_1);
                    headDot(20, 9, GI_1); 
                    headBox(13, 12, 6, 1, GI_1_SHADOW); 

                    headDot(13, 9, BLACK); headDot(14, 9, BLACK); headDot(15, 9, BLACK);
                    headDot(17, 9, BLACK); headDot(18, 9, BLACK); headDot(19, 9, BLACK);
                    headDot(14, 10, WHITE); headDot(18, 10, WHITE);
                } else if (pHead === 'saitama') {
                    headBox(12, 5, 8, 8, SKIN_TONE);
                    headDot(11, 9, SKIN_TONE);
                    headDot(20, 9, SKIN_TONE); 
                    headBox(13, 12, 6, 1, SKIN_SHADOW); 
                    headDot(14, 9, BLACK);
                    headDot(18, 9, BLACK);
                    headDot(14, 10, WHITE);
                    headDot(18, 10, WHITE);
                } else if (pHead === 'chapolim') {
                    headBox(12, 6, 8, 7, SKIN_TONE); // face
                    headBox(11, 5, 10, 5, GI_1); // Red hood covering top/sides
                    headDot(11, 9, GI_1);
                    headDot(20, 9, GI_1); 
                    
                    headBox(13, 3, 1, 2, GI_1); // Antennae
                    headBox(18, 3, 1, 2, GI_1); 
                    headDot(12, 2, GI_2); // yellow tips
                    headDot(19, 2, GI_2);

                    headDot(14, 9, eyeColor);
                    headDot(18, 9, eyeColor);
                } else {
                    // Generic anime head (Goku base)
                    headBox(12, 6, 8, 7, SKIN_TONE);
                    headDot(11, 9, SKIN_TONE);
                    headDot(20, 9, SKIN_TONE); 
                    headDot(11, 10, SKIN_SHADOW);
                    headDot(20, 10, SKIN_SHADOW); 
                    headBox(13, 12, 6, 1, SKIN_SHADOW); 
                    
                    headDot(13, 9, WHITE); headDot(17, 9, WHITE);
                    headDot(14, 9, eyeColor); headDot(18, 9, eyeColor);
                    headDot(13, 8, eyebrowColor); headDot(14, 8, eyebrowColor); headDot(17, 8, eyebrowColor); headDot(18, 8, eyebrowColor);
                    headDot(15, 8, SKIN_SHADOW); headDot(16, 8, SKIN_SHADOW);
                    headDot(15, 11, 0xdca880); 
                    headDot(13, 11, SKIN_SHADOW); headDot(18, 11, SKIN_SHADOW);

                    if (isAttack) {
                        headBox(15, 12, 2, 1, 0x440000); 
                    } else if (isDefend) {
                        headBox(15, 12, 2, 1, WHITE); 
                    } else {
                        headDot(16, 12, 0x222222); 
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
                if (pAcc === 'sword') {
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
