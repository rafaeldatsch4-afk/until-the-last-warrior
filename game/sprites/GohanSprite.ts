import Phaser from "phaser";

export function generateGohanSprite(scene: Phaser.Scene) {
    const generateForm = (form: number) => {
        const key = "gohan";

        const isSSJ = form === 1;
        const isBeast = form === 2;
        const isTransformed = form > 0;
        
        const SCALE = 2;
        const FRAME_WIDTH = 96;
        const FRAME_HEIGHT = 64; 
        const DRAW_OFFSET_Y = 24; 
        const FRAMES = 12;

        const sheetWidth = FRAME_WIDTH * SCALE * FRAMES;
        const sheetHeight = FRAME_HEIGHT * SCALE;

        const canvas = scene.make.graphics({ x: 0, y: 0 });
        canvas.clear();
        const shiftX = 24;

        // Custom Teen Gohan Pixel Art (Cell Games Arc)
        const parts = {
            head: [
              "  ssSSSSs  ",
              " sAAA AAAs ",
              " SWES SWEs ",
              " SSSdSSSss ",
              " sSSSSMSs  ",
              "  sSSSSS   ",
              "   ssss    "
            ],
            headScream: [
              "  ssSSSSs  ",
              " sAAA AAds ",
              " SWES SWEs ",
              " SSSdSSSss ",
              " sSSWMWSs  ",
              "  sSMMMS   ",
              "   ssss    "
            ],
            body: [
              "   bbB   ", 
              "  oBBBo  ",
              " oOOBBBo ",
              " oOOOOOo ",
              " OOOOOOO ",
              " oOOOOOo ",
              "  OOOOO  ",
              "  oOOOo  ",
              "  ooooo  ",
              "  BBBBB  ",
              "  bbbbb  ",
              "  B b B  "
            ],
            bodyCharge: [
              "   bbB   ", 
              "  oBBBo  ",
              " oOOBBBo ",
              " OOOOOOO ",
              " OOOOOOO ",
              " oOOOOOo ",
              "  oOOOo  ",
              "  ooooo  ",
              "  BBBBB  ",
              "  bbbbb  ",
              "  B b B  "
            ],
            lArm: [
              " ooo ",
              " oOo ",
              "  O  ",
              "  s  ",
              " sSs ",
              "  S  ",
              " bBb ",
              " sSs "
            ],
            rArm: [
              " oOo",
              " OOO",
              " OOO",
              "  S ",
              " sSs",
              " sSs",
              " bBb",
              " bBb",
              " sSs",
              "  s "
            ],
            rArmBlock: [ 
              " oOo  ",
              " OOO  ",
              " OOOs ",
              " sSsS ",
              " sSsS ",
              " bBbs ",
              " sSs  "
            ],
            lArmBlock: [ 
              "  ooo ",
              "  oOo ",
              " sSsO ",
              " SsSs ",
              " sBbs ",
              "  sSs "
            ],
            lArmKame: [ 
              " ooo ",
              " oOo ",
              "  s  ",
              " sSs ",
              " sS  "
            ],
            rArmKame: [ 
              " oOo ",
              " OOO ",
              " sS  ",
              " sSs ",
              " Ss  "
            ],
            lArmFire: [ 
              " oooOOOssSs",
              " oOooOosSsS",
              "   ssbBbsS "
            ],
            rArmFire: [ 
              "  oOoOOOssSs",
              "  OOOOOsSSsS",
              "    sssbBbs "
            ],
            lLeg: [
              " oOo ",
              "  O  ",
              " oOo ",
              " OOO ",
              " oOo ",
              " bb  ",
              " BbB ",
              " DbD ",
              " RRR "
            ],
            rLeg: [
              " OOO ",
              " OOO ",
              " OOO ",
              " oOo ",
              " oOo ",
              " bbB ",
              " BbB ",
              " DbD ",
              " RRR "
            ],
            lLegWide: [
              " oOo ",
              " OoO ",
              " OOO ",
              " oOo ",
              " ooo ",
              " bb  ",
              " BbB ",
              " DbD ",
              " RRR "
            ]
        };

        const hairOptions = {
            0: [ // Base
              "  A A  A   ",
              " AA AAA A  ",
              " AAAAAAAA  ",
              " AAAAA AA  ",
              "  aA  A a  ",
              "  a    a   "
            ],
            1: [ // SSJ
              "     A     ",
              "   A AA A  ",
              "  AA A AAA ",
              " aAAA AAAAa",
              " aAAAAAAAAA",
              " Aa AA Aa  ",
              "  a A  a   ",
              "    a      "
            ],
            2: [ // Beast (long hair falling description)
              "    A A    ",
              "   AAAAA   ",
              " a AAAAAa  ",
              " AAAAAAAA  ",
              " AAAAAAAa  ",
              " Aa AA Aa  ",  
              " Aa   a    ",
              " Aa        ",
              " Aa        ", 
              " Aa        ",
              " aa        "
            ]
        };

        const EYE_BASE = 0x111111;
        const EYE_SSJ = 0x11ccaa; 
        const EYE_BEAST = 0xff2222; 
        
        const hairColor = isSSJ ? 0xffde00 : (isBeast ? 0x111111 : 0x111111);
        const hairShadow = isSSJ ? 0xc7a000 : 0x333344;
        const eyeColor = isBeast ? EYE_BEAST : isSSJ ? EYE_SSJ : EYE_BASE;

        const colorMap: Record<string, number> = {
            'S': 0xffcfb0,
            's': 0xe0a080,
            'd': 0xb06040,
            'W': 0xffffff,
            'E': eyeColor,
            'O': 0xff7e00,
            'o': 0xcc5200,
            'Y': 0xffa040,
            'B': 0x1c3b99,
            'b': 0x0f2066,
            'D': 0x0a1440,
            'R': 0xccaa22,
            'M': 0x550000,
            'A': hairColor,
            'a': hairShadow
        };

        for (let f = 0; f < FRAMES; f++) {
            const offsetX = f * FRAME_WIDTH;
            const isWalk = f >= 4 && f <= 7;
            const isAttack = f === 8 || f === 9;
            const isDefend = f === 10;
            const isCharge = f === 11;

            let bx = 12, by = 13;
            let hx = 12, hy = 6;
            let hax = 12, hay = 2; // hair 
            let lax = 18, lay = 14;  // left arm (back)
            let rax = 13, ray = 15;  // right arm (front)
            let llx = 16, lly = 24;  // left leg (back)
            let rlx = 13, rly = 24;  // right leg (front)
            
            let hd = parts.head;
            let bd = parts.body;
            let la = parts.lArm;
            let ra = parts.rArm;
            let ll = parts.lLeg;
            let rl = parts.rLeg;
            let hairArt = hairOptions[form as keyof typeof hairOptions];

            if (!isWalk && !isAttack && !isDefend && !isCharge && (f === 1 || f === 3)) {
                by += 1; hy += 1; hay += 1; lay += 1; ray += 1; 
            }

            if (isWalk) {
                const w = f - 4;
                if (w === 0) { llx+=1; lly-=1; rlx-=2; lax-=1; rax+=1; }
                if (w === 1) { llx+=3; lly-=2; rlx-=4; lax-=2; lay-=1; rax+=2; ray-=1; }
                if (w === 2) { rlx-=1; rly-=1; }
                if (w === 3) { llx-=3; rlx+=2; rly-=2; lax+=1; rax-=1; }
            }

            if (isAttack) {
                hd = parts.headScream;
                if (f === 8) { 
                    la = parts.lArmKame; ra = parts.rArmKame;
                    rax -= 2; lax += 2;
                    ray += 3; lay += 3;
                    hx -= 1; bx -= 1; rlx -= 1; llx -= 1;
                    hay += 1; 
                } else { 
                    la = parts.lArmFire; ra = parts.rArmFire;
                    rax += 6; lax += 4;
                    ray += 1; lay += 1;
                    hx += 2; bx += 1; rlx += 1; llx += 1;
                    hay += 1;
                    ll = parts.lLegWide; rl = parts.lLegWide;
                    rlx -= 2; llx += 2;
                }
            }

            if (isDefend) {
                la = parts.lArmBlock; ra = parts.rArmBlock;
                lax -= 2; rax += 1;
                lay += 2; ray += 1;
                bx -= 1; hx -= 1; hay += 1;
                ll = parts.lLegWide; rl = parts.lLegWide;
            }

            if (isCharge) {
                hd = parts.headScream;
                bd = parts.bodyCharge; 
                hx -= 1; bx -= 1; by += 1;
                lax = 20; lay = 17;
                rax = 10; ray = 17;
                ll = parts.lLegWide; rl = parts.lLegWide;
                llx += 1; rlx -= 1; lly+=1; rly+=1;
            }

            const drawAura = (x: number, y: number, w: number, h: number, c: number, a: number) => {
                canvas.fillStyle(c, a);
                canvas.fillRect(Math.floor((offsetX + x + shiftX) * SCALE), Math.floor((y + DRAW_OFFSET_Y) * SCALE), Math.floor(w * SCALE), Math.floor(h * SCALE));
            };

            const drawArt = (x0: number, y0: number, art: string[]) => {
                for (let y = 0; y < art.length; y++) {
                    const row = art[y];
                    for (let x = 0; x < row.length; x++) {
                        const char = row[x];
                        if (char !== ' ' && colorMap[char] !== undefined) {
                            const px = Math.floor(offsetX + x0 + x + shiftX);
                            const py = Math.floor(y0 + y + DRAW_OFFSET_Y);
                            canvas.fillStyle(colorMap[char], 1);
                            canvas.fillRect(px * SCALE, py * SCALE, SCALE, SCALE);
                        }
                    }
                }
            };

            // Back Aura
            if (isTransformed && !isWalk) {
                let a1, a2, a3, c1, c2, c3;
                if (isBeast) { 
                    c1 = 0x6a0dad; a1 = 0.4; 
                    c2 = 0xcd0000; a2 = 0.5; 
                    c3 = 0x4b0082; a3 = 0.6; 
                } else { 
                    c1 = 0xffaa00; a1 = 0.3;
                    c2 = 0xffdd00; a2 = 0.5;
                    c3 = 0xffffee; a3 = 0.6;
                }
                let bob = (f%4) * 2 - 2;
                drawAura(-2, -16 + bob, 36, 50 - bob, c1, a1);
                drawAura(2, -26 - bob, 28, 58 + bob, c1, a1);
                drawAura(4, -12 - bob, 24, 44 + bob, c2, a2);
                drawAura(6, -20 + bob, 20, 50 - bob, c2, a2);
                drawAura(8, -8 + bob, 16, 38 - bob, c3, a3);
                
                if (f%2===0) {
                    drawAura(-6, 2, 6, 12, c1, a1);
                    drawAura(32, -2, 6, 16, c1, a1);
                    drawAura(6, -30, 8, 8, c2, a2);
                } else {
                    drawAura(-4, -2, 6, 16, c1, a1);
                    drawAura(30, 2, 6, 12, c1, a1);
                    drawAura(14, -28, 8, 8, c2, a2);
                }
            }

            // Draw Character Layers
            drawArt(llx, lly, ll); // Back Leg
            drawArt(lax, lay, la); // Back Arm
            drawArt(bx, by, bd);   // Body
            drawArt(hx, hy, hd);   // Head
            drawArt(hax, hay, hairArt); // Hair
            drawArt(rlx, rly, rl); // Front Leg
            drawArt(rax, ray, ra); // Front Arm

            // Kama Effects
            if (isAttack && f === 9) {
                drawAura(rax+8, ray-3, 12, 12, 0x00ffff, 0.4);
                drawAura(rax+10, ray-1, 8, 8, 0xffffff, 0.8);
            }

            // Front Aura
            if (isTransformed && !isWalk) {
                let a1, a2, a3, c1, c2, c3;
                if (isBeast) { 
                    c1 = 0x6a0dad; a1 = 0.2; 
                    c2 = 0xcd0000; a2 = 0.3; 
                    c3 = 0xffffff; a3 = 0.4; 
                } else { 
                    c1 = 0xffaa00; a1 = 0.1;
                    c2 = 0xffdd00; a2 = 0.2;
                    c3 = 0xffffee; a3 = 0.4;
                }
                
                let bob = ((f+1)%4) * 2 - 2;
                drawAura(2, -8 + bob, 24, 42, c1, a1);
                drawAura(6, 2 + bob, 16, 28, c3, a2);
                
                // Lightnings
                if (isBeast && f % 2 === 0) {
                    drawAura(0, -3 + bob, 3, 10, 0xffbbbb, 0.6); 
                    drawAura(24, 15 + bob, 4, 6, 0xffbbbb, 0.6);
                    drawAura(10, -16 + bob, 2, 8, 0xffbbbb, 0.6);
                    drawAura(5, 25, 3, 5, 0xffbbbb, 0.6);
                } else if (isBeast && f % 2 !== 0) {
                    drawAura(22, 2 + bob, 3, 12, 0xffbbbb, 0.6);
                    drawAura(-2, 12 + bob, 5, 5, 0xffbbbb, 0.6);
                    drawAura(15, -18 + bob, 2, 10, 0xffbbbb, 0.6);
                }
                
                if (isCharge) {
                    drawAura(-12, 28, 56, 6, c1, a2);
                    drawAura(-8, 30, 48, 4, c3, a3);
                    drawAura(-4, 29, 40, 2, c2, a3);
                }
            }
        }

        let textureName = key;
        if (isBeast) textureName = `${key}_ui`;
        else if (isSSJ) textureName = `${key}_ssj`;

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

    if (!scene.textures.exists("gohan")) { generateForm(0); }
    if (!scene.textures.exists("gohan_ssj")) { generateForm(1); }
    if (!scene.textures.exists("gohan_ui")) { generateForm(2); }
}

