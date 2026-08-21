import Phaser from "phaser";

export class ArenaTextureBuilder {
  /**
   * Generates high-definition, beautifully detailed textures for all 8 battle arenas.
   */
  public static buildAllArenaTextures(scene: Phaser.Scene) {
    const arenas = [
      { key: "arena", builder: ArenaTextureBuilder.buildEarthArena },
      { key: "arena_namek", builder: ArenaTextureBuilder.buildNamekArena },
      { key: "arena_city", builder: ArenaTextureBuilder.buildCityArena },
      { key: "arena_tournament", builder: ArenaTextureBuilder.buildTournamentArena },
      { key: "arena_ice", builder: ArenaTextureBuilder.buildIceArena },
      { key: "arena_lava", builder: ArenaTextureBuilder.buildLavaArena },
      { key: "arena_desert", builder: ArenaTextureBuilder.buildDesertArena },
      { key: "arena_dark", builder: ArenaTextureBuilder.buildDarkArena },
    ];

    for (const arena of arenas) {
      // Remove old texture if already exists to ensure fresh crisp generation
      if (scene.textures.exists(arena.key)) {
        scene.textures.remove(arena.key);
      }
      arena.builder(scene, arena.key);
    }
  }

  // 1. PLANETA TERRA (Earth - Lush Green Hills, Azure Sky, Majestic Mountains & Sun)
  private static buildEarthArena(scene: Phaser.Scene, key: string) {
    const w = 960;
    const h = 540;
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Sky Gradient
    g.fillGradientStyle(0x0c3866, 0x0c3866, 0x3a88c8, 0x8ecae6, 1);
    g.fillRect(0, 0, w, h);

    // Radiant Sun & Corona Glow
    g.fillStyle(0xfff9db, 0.25);
    g.fillCircle(720, 110, 95);
    g.fillStyle(0xfff3bf, 0.45);
    g.fillCircle(720, 110, 60);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(720, 110, 32);

    // Sun Rays
    g.lineStyle(1.5, 0xffffff, 0.15);
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      g.beginPath();
      g.moveTo(720 + Math.cos(angle) * 40, 110 + Math.sin(angle) * 40);
      g.lineTo(720 + Math.cos(angle) * 140, 110 + Math.sin(angle) * 140);
      g.strokePath();
    }

    // Distant Clouds
    const drawCloud = (cx: number, cy: number, scale: number, alpha: number) => {
      g.fillStyle(0xffffff, alpha);
      g.fillCircle(cx, cy, 30 * scale);
      g.fillCircle(cx + 25 * scale, cy - 12 * scale, 24 * scale);
      g.fillCircle(cx + 50 * scale, cy, 28 * scale);
      g.fillCircle(cx + 75 * scale, cy - 8 * scale, 22 * scale);
      g.fillRoundedRect(cx - 20 * scale, cy + 2 * scale, 120 * scale, 24 * scale, 12 * scale);
    };

    drawCloud(120, 100, 0.9, 0.65);
    drawCloud(420, 75, 1.2, 0.75);
    drawCloud(830, 160, 0.7, 0.55);
    drawCloud(260, 180, 0.6, 0.45);

    // Far Mountain Silhouettes (Layer 1 - Blue Mist)
    g.fillStyle(0x23496d, 0.85);
    g.beginPath();
    g.moveTo(0, h * 0.68);
    const farPeaks = [
      [0, 310], [90, 240], [180, 310], [270, 220], [380, 320],
      [490, 230], [590, 300], [700, 210], [810, 290], [900, 235], [960, 280]
    ];
    for (const [px, py] of farPeaks) g.lineTo(px, py);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.closePath();
    g.fillPath();

    // Snowcaps on Far Peaks
    g.fillStyle(0xffffff, 0.75);
    const snowTriangles = [[90, 240, 35], [270, 220, 45], [490, 230, 40], [700, 210, 50], [900, 235, 38]];
    for (const [sx, sy, sz] of snowTriangles) {
      g.fillTriangle(sx, sy, sx - sz, sy + sz * 0.8, sx + sz, sy + sz * 0.8);
    }

    // Mid Mountain Range (Layer 2 - Deep Pine Teal)
    g.fillStyle(0x194d44, 0.92);
    g.beginPath();
    g.moveTo(0, h * 0.74);
    const midPeaks = [
      [0, 350], [130, 290], [240, 360], [360, 280], [470, 345],
      [610, 275], [740, 350], [860, 295], [960, 340]
    ];
    for (const [px, py] of midPeaks) g.lineTo(px, py);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.closePath();
    g.fillPath();

    // Rolling Green Hills (Layer 3)
    g.fillStyle(0x2d6a4f, 1);
    g.fillCircle(160, 450, 230);
    g.fillCircle(520, 470, 260);
    g.fillCircle(840, 440, 240);

    // Forest Tree Clumps
    g.fillStyle(0x1b4332, 0.95);
    for (let tx = 30; tx < w; tx += 45) {
      const treeY = 360 + Math.sin(tx * 0.05) * 20;
      g.fillTriangle(tx, treeY - 24, tx - 14, treeY + 12, tx + 14, treeY + 12);
      g.fillTriangle(tx + 12, treeY - 18, tx - 2, treeY + 12, tx + 24, treeY + 12);
    }

    // Main Ground Plateau (Layer 4)
    g.fillStyle(0x40916c, 1);
    g.fillRect(0, h * 0.73, w, h * 0.27);

    // Ground Dirt & Grass Texture Line
    g.fillStyle(0x52b788, 1);
    g.fillRect(0, h * 0.73, w, 14);

    g.fillStyle(0x2d6a4f, 0.8);
    for (let x = 0; x < w; x += 18) {
      g.fillTriangle(x, h * 0.73, x + 8, h * 0.73 - 8, x + 16, h * 0.73);
    }

    // Sub-ground Strata
    g.fillStyle(0x1b4332, 1);
    g.fillRect(0, h * 0.84, w, h * 0.16);
    g.fillStyle(0x081c15, 1);
    g.fillRect(0, h * 0.93, w, h * 0.07);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  // 2. NAMEKUSEI (Namek - Green Sky, Twin Ringed Moons, Ajissa Trees & Spire Plateaus)
  private static buildNamekArena(scene: Phaser.Scene, key: string) {
    const w = 960;
    const h = 540;
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Emerald Alien Sky
    g.fillGradientStyle(0x044343, 0x044343, 0x168778, 0x64dfdf, 1);
    g.fillRect(0, 0, w, h);

    // Primary Giant Ringed Planet in Sky
    const planetX = 740;
    const planetY = 130;
    g.fillStyle(0x2ec4b6, 0.3);
    g.fillCircle(planetX, planetY, 88);
    g.fillStyle(0x38b000, 0.6);
    g.fillCircle(planetX, planetY, 68);
    g.fillStyle(0x70e000, 0.85);
    g.fillCircle(planetX, planetY, 60);

    // Planet Atmospheric Bands
    g.fillStyle(0x007200, 0.4);
    g.fillRect(planetX - 58, planetY - 14, 116, 12);
    g.fillRect(planetX - 50, planetY + 12, 100, 16);

    // Planetary Rings
    g.lineStyle(6, 0x9ef01a, 0.6);
    g.strokeEllipse(planetX, planetY, 190, 48);
    g.lineStyle(2, 0xffffff, 0.8);
    g.strokeEllipse(planetX, planetY, 210, 56);

    // Secondary Smaller Moon
    g.fillStyle(0x80ffdb, 0.85);
    g.fillCircle(220, 100, 32);
    g.fillStyle(0x48bfe3, 0.5);
    g.fillCircle(214, 94, 28);

    // Namekian Turquoise Atmosphere Clouds
    g.fillStyle(0x72efdd, 0.35);
    g.fillRoundedRect(80, 160, 220, 26, 13);
    g.fillRoundedRect(360, 190, 300, 32, 16);
    g.fillRoundedRect(680, 220, 200, 24, 12);

    // Distant Conical Namekian Plateaus
    g.fillStyle(0x0f4c5c, 0.9);
    const namekPeaks = [
      [140, 230, 70], [320, 250, 90], [540, 220, 80], [780, 240, 85], [920, 260, 60]
    ];
    for (const [px, py, pw] of namekPeaks) {
      g.fillRoundedRect(px - pw / 2, py, pw, h - py, 14);
      g.fillCircle(px, py, pw * 0.45);
    }

    // Emerald Water Horizon
    g.fillStyle(0x19a974, 0.95);
    g.fillRect(0, h * 0.65, w, h * 0.12);

    // Ajissa Alien Trees (Cylindrical Trunk + Perfect Sphere Canopies)
    const drawAjissaTree = (tx: number, ty: number, trScale: number) => {
      g.fillStyle(0x22577a, 1);
      g.fillRect(tx - 4 * trScale, ty - 50 * trScale, 8 * trScale, 50 * trScale);
      g.fillStyle(0x38b000, 1);
      g.fillCircle(tx, ty - 55 * trScale, 22 * trScale);
      g.fillStyle(0x70e000, 0.7);
      g.fillCircle(tx - 4 * trScale, ty - 60 * trScale, 14 * trScale);
    };

    drawAjissaTree(90, 370, 0.9);
    drawAjissaTree(130, 380, 0.7);
    drawAjissaTree(440, 365, 1.1);
    drawAjissaTree(480, 375, 0.8);
    drawAjissaTree(820, 370, 1.0);
    drawAjissaTree(870, 365, 0.75);

    // Main Vibrant Green Ground
    g.fillStyle(0x2d6a4f, 1);
    g.fillRect(0, h * 0.74, w, h * 0.26);

    // Glowing Mineral Moss Top Border
    g.fillStyle(0x52b788, 1);
    g.fillRect(0, h * 0.74, w, 12);

    g.fillStyle(0x74c69d, 0.9);
    for (let x = 0; x < w; x += 22) {
      g.fillCircle(x, h * 0.74 + 3, 5);
    }

    // Deep Subterranean Alien Strata
    g.fillStyle(0x1b4332, 1);
    g.fillRect(0, h * 0.85, w, h * 0.15);
    g.fillStyle(0x081c15, 1);
    g.fillRect(0, h * 0.94, w, h * 0.06);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  // 3. CIDADE DESTRUÍDA (Destroyed City - Apocalyptic Sunset, Ruined Skyscrapers & Sparks)
  private static buildCityArena(scene: Phaser.Scene, key: string) {
    const w = 960;
    const h = 540;
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Fiery Sunset Apocalyptic Sky
    g.fillGradientStyle(0x1c0a00, 0x3d0000, 0xa11d00, 0xff7b00, 1);
    g.fillRect(0, 0, w, h);

    // Glowing Blood Sun
    g.fillStyle(0xffd000, 0.25);
    g.fillCircle(500, 200, 80);
    g.fillStyle(0xffe600, 0.7);
    g.fillCircle(500, 200, 48);

    // Dense Smoke Clouds
    const drawSmoke = (sx: number, sy: number, radius: number) => {
      g.fillStyle(0x1a1110, 0.65);
      g.fillCircle(sx, sy, radius);
      g.fillCircle(sx + radius * 0.5, sy - radius * 0.3, radius * 0.8);
      g.fillCircle(sx - radius * 0.4, sy - radius * 0.2, radius * 0.7);
    };

    drawSmoke(180, 180, 60);
    drawSmoke(380, 140, 75);
    drawSmoke(740, 160, 70);

    // Distant Ruined Skyline (Layer 1 - Dark Crimson Silhouette)
    g.fillStyle(0x2b0909, 0.9);
    for (let bx = 10; bx < w; bx += 48) {
      const bH = 120 + Math.sin(bx * 0.1) * 60 + (bx % 3 === 0 ? 80 : 0);
      g.fillRect(bx, 380 - bH, 40, bH + 80);
      // Ruined slant roof
      if (bx % 2 === 0) {
        g.fillTriangle(bx, 380 - bH, bx + 40, 380 - bH + 25, bx, 380 - bH + 25);
      }
    }

    // Midground Destroyed Highrises (Layer 2 - Concrete & Steel with Windows)
    g.fillStyle(0x1a1a1a, 1);
    const buildings = [
      { x: 30, w: 90, h: 260 },
      { x: 150, w: 110, h: 310 },
      { x: 300, w: 85, h: 220 },
      { x: 410, w: 130, h: 340 },
      { x: 570, w: 95, h: 250 },
      { x: 690, w: 120, h: 300 },
      { x: 840, w: 100, h: 270 }
    ];

    for (const b of buildings) {
      const topY = 400 - b.h;
      g.fillRect(b.x, topY, b.w, b.h + 50);

      // Cracked facade bite/crumble
      g.fillStyle(0x3d0000, 1);
      g.fillCircle(b.x + b.w, topY + 40, 24);
      g.fillCircle(b.x, topY + 80, 20);

      // Broken Windows (Amber & Fire glow)
      g.fillStyle(0xff8c00, 0.75);
      for (let wy = topY + 40; wy < 380; wy += 26) {
        for (let wx = b.x + 12; wx < b.x + b.w - 14; wx += 20) {
          if (Math.random() > 0.45) {
            g.fillRect(wx, wy, 10, 14);
          }
        }
      }
      g.fillStyle(0x1a1a1a, 1);
    }

    // Fire & Embers on Rooftops
    g.fillStyle(0xff3c00, 0.85);
    g.fillTriangle(180, 100, 195, 70, 210, 100);
    g.fillTriangle(440, 70, 460, 40, 480, 70);
    g.fillTriangle(730, 110, 750, 80, 770, 110);

    // Broken Highway Asphalt Combat Platform (Foreground)
    g.fillStyle(0x262626, 1);
    g.fillRect(0, h * 0.74, w, h * 0.26);

    // Yellow Highway Dashed Line
    g.fillStyle(0xf1c40f, 0.85);
    for (let x = 20; x < w; x += 80) {
      g.fillRect(x, h * 0.77, 45, 6);
    }

    // Asphalt Surface Edge & Cracks
    g.fillStyle(0x404040, 1);
    g.fillRect(0, h * 0.74, w, 8);

    g.lineStyle(2, 0x0d0d0d, 0.9);
    g.beginPath();
    g.moveTo(120, h * 0.74);
    g.lineTo(190, h * 0.82);
    g.lineTo(240, h * 0.80);
    g.moveTo(500, h * 0.74);
    g.lineTo(550, h * 0.86);
    g.moveTo(780, h * 0.74);
    g.lineTo(820, h * 0.84);
    g.strokePath();

    // Dark Subsoil / Rubble Concrete
    g.fillStyle(0x141414, 1);
    g.fillRect(0, h * 0.86, w, h * 0.14);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  // 4. TORNEIO SUPREMO (Martial Arts Arena - Colosseum Amphitheater, Tiled Ring & Sky)
  private static buildTournamentArena(scene: Phaser.Scene, key: string) {
    const w = 960;
    const h = 540;
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Crisp Azure Anime Arena Sky
    g.fillGradientStyle(0x1b4965, 0x1b4965, 0x5fa8d3, 0xbfe3f0, 1);
    g.fillRect(0, 0, w, h);

    // Golden Sun
    g.fillStyle(0xfff3b0, 0.35);
    g.fillCircle(480, 90, 75);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(480, 90, 36);

    // High Drifting Tournament Clouds
    g.fillStyle(0xffffff, 0.7);
    g.fillRoundedRect(60, 80, 180, 24, 12);
    g.fillRoundedRect(720, 110, 200, 26, 13);
    g.fillRoundedRect(280, 140, 240, 28, 14);

    // Colosseum Amphitheater Stands (Background)
    g.fillStyle(0x8d99ae, 0.9);
    g.beginPath();
    g.moveTo(0, 320);
    g.lineTo(0, 220);
    g.lineTo(w, 220);
    g.lineTo(w, 320);
    g.closePath();
    g.fillPath();

    // Spectator Seating Rows
    g.fillStyle(0x4a5568, 0.6);
    for (let sy = 230; sy < 320; sy += 15) {
      g.fillRect(0, sy, w, 4);
    }

    // Decorative Colosseum Arches & Pillars
    g.fillStyle(0xdfe6e9, 0.95);
    for (let px = 40; px < w; px += 85) {
      g.fillRect(px, 195, 20, 125);
      g.fillCircle(px + 10, 195, 14);
      // Festival Banner Ribbon
      g.fillStyle(px % 2 === 0 ? 0xe74c3c : 0xf1c40f, 0.9);
      g.fillTriangle(px + 20, 210, px + 50, 220, px + 20, 230);
      g.fillStyle(0xdfe6e9, 0.95);
    }

    // Great Tournament Dragon Statue Pillars (Left & Right)
    const drawPillar = (px: number) => {
      g.fillStyle(0x718096, 1);
      g.fillRect(px - 28, 160, 56, 220);
      g.fillStyle(0xf1c40f, 1);
      g.fillCircle(px, 150, 22);
      g.fillStyle(0xe2e8f0, 1);
      g.fillRect(px - 34, 170, 68, 14);
      g.fillRect(px - 34, 340, 68, 16);
    };

    drawPillar(90);
    drawPillar(870);

    // Tournament Tile Ring Fighting Ground (Foreground)
    g.fillStyle(0xced4da, 1);
    g.fillRect(0, h * 0.72, w, h * 0.28);

    // Golden Boundary Trim on Ring
    g.fillStyle(0xf1c40f, 1);
    g.fillRect(0, h * 0.72, w, 10);
    g.fillStyle(0xd4ac0d, 1);
    g.fillRect(0, h * 0.72 + 10, w, 4);

    // Distinctive Grid Floor Tile Lines
    g.lineStyle(2, 0x868e96, 0.75);
    for (let tx = 0; tx < w; tx += 60) {
      g.beginPath();
      g.moveTo(tx, h * 0.72 + 14);
      g.lineTo(tx, h);
      g.strokePath();
    }
    for (let ty = h * 0.72 + 14; ty < h; ty += 40) {
      g.beginPath();
      g.moveTo(0, ty);
      g.lineTo(w, ty);
      g.strokePath();
    }

    // Stone Steps Base
    g.fillStyle(0x6c757d, 1);
    g.fillRect(0, h * 0.92, w, h * 0.08);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  // 5. GELEIRA ETERNA (Ice Glacier - Aurora Borealis, Jagged Ice Spires & Frozen Floor)
  private static buildIceArena(scene: Phaser.Scene, key: string) {
    const w = 960;
    const h = 540;
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Polar Night Sky
    g.fillGradientStyle(0x03071e, 0x03071e, 0x0a2540, 0x1d4e89, 1);
    g.fillRect(0, 0, w, h);

    // Twinkling Polar Stars
    g.fillStyle(0xffffff, 0.8);
    for (let i = 0; i < 40; i++) {
      const sx = (i * 27) % w;
      const sy = (i * 19) % 200;
      g.fillCircle(sx, sy, (i % 3 === 0) ? 2 : 1);
    }

    // Vibrant Aurora Borealis (Waving Glowing Ribbons)
    const drawAuroraRibbon = (color: number, baseY: number, alpha: number) => {
      g.fillStyle(color, alpha);
      g.beginPath();
      g.moveTo(0, baseY);
      for (let x = 0; x <= w; x += 40) {
        const y = baseY + Math.sin(x * 0.008 + baseY) * 45 + Math.cos(x * 0.015) * 25;
        g.lineTo(x, y);
      }
      g.lineTo(w, baseY + 90);
      for (let x = w; x >= 0; x -= 40) {
        const y = baseY + 90 + Math.sin(x * 0.008 + baseY) * 45;
        g.lineTo(x, y);
      }
      g.closePath();
      g.fillPath();
    };

    drawAuroraRibbon(0x00ffcc, 80, 0.45);
    drawAuroraRibbon(0x7000ff, 120, 0.35);
    drawAuroraRibbon(0x00d2ff, 160, 0.4);

    // Distant Crystalline Glacier Mountains (Layer 1)
    g.fillStyle(0x3a86ff, 0.7);
    g.beginPath();
    g.moveTo(0, h * 0.7);
    const icePeaksFar = [
      [0, 280], [100, 200], [220, 290], [340, 180], [460, 280],
      [580, 190], [700, 275], [820, 195], [960, 270]
    ];
    for (const [px, py] of icePeaksFar) g.lineTo(px, py);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.closePath();
    g.fillPath();

    // Sharp Foreground Ice Spires (Layer 2)
    const drawIceSpire = (ix: number, iy: number, iw: number, ih: number) => {
      // Left Facet (Cyan)
      g.fillStyle(0x80ffdb, 0.95);
      g.fillTriangle(ix, iy - ih, ix - iw / 2, iy, ix, iy);
      // Right Facet (Deep Ice Blue)
      g.fillStyle(0x48cae4, 0.95);
      g.fillTriangle(ix, iy - ih, ix, iy, ix + iw / 2, iy);
      // White Glistening Crest
      g.fillStyle(0xffffff, 0.85);
      g.fillTriangle(ix, iy - ih, ix - 6, iy - ih + 35, ix + 6, iy - ih + 35);
    };

    drawIceSpire(80, 390, 80, 180);
    drawIceSpire(180, 390, 60, 130);
    drawIceSpire(320, 390, 95, 210);
    drawIceSpire(480, 390, 70, 150);
    drawIceSpire(640, 390, 110, 230);
    drawIceSpire(780, 390, 85, 170);
    drawIceSpire(900, 390, 75, 140);

    // Frozen Permafrost Ice Floor (Foreground)
    g.fillStyle(0xade8f4, 1);
    g.fillRect(0, h * 0.74, w, h * 0.26);

    // Glowing Cyan Surface Ice Sheen
    g.fillStyle(0x00f5d4, 0.9);
    g.fillRect(0, h * 0.74, w, 8);

    // Sub-zero Glacial Cracks
    g.lineStyle(2, 0x0077b6, 0.85);
    const crackStarts = [120, 340, 580, 810];
    for (const cx of crackStarts) {
      g.beginPath();
      g.moveTo(cx, h * 0.74);
      g.lineTo(cx + 30, h * 0.82);
      g.lineTo(cx + 15, h * 0.90);
      g.lineTo(cx + 50, h * 0.98);
      g.strokePath();
    }

    // Deep Dense Ice Glacial Core
    g.fillStyle(0x023e8a, 1);
    g.fillRect(0, h * 0.88, w, h * 0.12);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  // 6. VULCÃO INFERNAL (Infernal Volcano - Erupting Lava, Jagged Magma Crags & Ash)
  private static buildLavaArena(scene: Phaser.Scene, key: string) {
    const w = 960;
    const h = 540;
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Volcanic Ash & Crimson Sky
    g.fillGradientStyle(0x1a0500, 0x2d0c00, 0x661000, 0xcc2900, 1);
    g.fillRect(0, 0, w, h);

    // Volcanic Lightning Arcs
    g.lineStyle(2.5, 0xffd000, 0.85);
    const drawLightning = (lx: number, ly: number) => {
      g.beginPath();
      g.moveTo(lx, ly);
      g.lineTo(lx + 20, ly + 40);
      g.lineTo(lx - 10, ly + 70);
      g.lineTo(lx + 25, ly + 110);
      g.strokePath();
    };
    drawLightning(240, 40);
    drawLightning(700, 60);

    // Erupting Volcano Peaks in Background
    const drawVolcano = (vx: number, vy: number, vw: number, vh: number) => {
      g.fillStyle(0x2b0d0d, 1);
      g.fillTriangle(vx - vw / 2, vy + vh, vx, vy, vx + vw / 2, vy + vh);

      // Magma Crater Eruption Plume
      g.fillStyle(0xff5400, 0.95);
      g.fillCircle(vx, vy, 28);
      g.fillStyle(0xffd000, 1);
      g.fillCircle(vx, vy, 16);

      // Overflowing Lava Cascades
      g.fillStyle(0xff4800, 0.9);
      g.beginPath();
      g.moveTo(vx - 8, vy);
      g.lineTo(vx - 20, vy + vh * 0.7);
      g.lineTo(vx + 6, vy + vh * 0.7);
      g.lineTo(vx + 8, vy);
      g.closePath();
      g.fillPath();
    };

    drawVolcano(260, 190, 240, 180);
    drawVolcano(680, 170, 280, 200);

    // Jagged Obsidian Basalt Crags (Midground)
    g.fillStyle(0x190808, 1);
    for (let cx = 20; cx < w; cx += 70) {
      const cragH = 160 + Math.sin(cx * 0.08) * 60;
      g.fillTriangle(cx, 400 - cragH, cx - 35, 400, cx + 35, 400);
    }

    // Flowing Molten Lava Battle Ground (Foreground)
    g.fillStyle(0xff3c00, 1);
    g.fillRect(0, h * 0.74, w, h * 0.26);

    // Intense Yellow-Orange Heat Core
    g.fillStyle(0xffb703, 1);
    g.fillRect(0, h * 0.74, w, 14);

    // Bubbling Magma Glow Orbs
    g.fillStyle(0xffea00, 0.9);
    for (let x = 40; x < w; x += 90) {
      g.fillCircle(x, h * 0.74 + 7, 10);
      g.fillCircle(x + 25, h * 0.74 + 5, 6);
    }

    // Basalt Crust Islands Floating on Lava
    g.fillStyle(0x1c0d0d, 1);
    const basaltPlates = [
      [30, 180], [250, 150], [440, 200], [680, 160], [860, 120]
    ];
    for (const [bx, bw] of basaltPlates) {
      g.fillRoundedRect(bx, h * 0.76, bw, 26, 8);
      // Glowing heat edge on rock
      g.lineStyle(2, 0xff5400, 0.9);
      g.strokeRoundedRect(bx, h * 0.76, bw, 26, 8);
    }

    // Deep Magma Trench
    g.fillStyle(0x9d0208, 1);
    g.fillRect(0, h * 0.88, w, h * 0.12);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  // 7. DESERTO ESQUECIDO (Forgotten Desert - Blazing Sun, Terracotta Dunes & Ancient Ruins)
  private static buildDesertArena(scene: Phaser.Scene, key: string) {
    const w = 960;
    const h = 540;
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Desert Twilight / Solar Sky
    g.fillGradientStyle(0x7f2905, 0xa73e0a, 0xe07a2a, 0xf6bd60, 1);
    g.fillRect(0, 0, w, h);

    // Blinding Solar Disk
    g.fillStyle(0xfff3b0, 0.3);
    g.fillCircle(240, 120, 110);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(240, 120, 42);

    // Distant Sandstorms & Atmospheric Haze
    g.fillStyle(0xf4a261, 0.35);
    g.fillRoundedRect(40, 180, 360, 40, 20);
    g.fillRoundedRect(500, 200, 420, 50, 25);

    // Ancient Ruined Sandstone Pyramids in Background
    g.fillStyle(0xb06834, 0.85);
    g.fillTriangle(480, 190, 340, 340, 620, 340);
    g.fillStyle(0x8c4a1b, 0.95);
    g.fillTriangle(480, 190, 480, 340, 620, 340); // Shadow side

    g.fillStyle(0xb06834, 0.85);
    g.fillTriangle(760, 220, 660, 350, 860, 350);
    g.fillStyle(0x8c4a1b, 0.95);
    g.fillTriangle(760, 220, 760, 350, 860, 350);

    // Weathered Sandstone Monolith Pillars
    const drawRuinPillar = (rx: number, ry: number, rw: number, rh: number) => {
      g.fillStyle(0xcc8952, 1);
      g.fillRect(rx, ry, rw, rh);
      g.fillStyle(0x8c4a1b, 1);
      g.fillRect(rx + rw * 0.6, ry, rw * 0.4, rh); // Shadow facet
      // Broken top angle
      g.fillStyle(0xa73e0a, 1);
      g.fillTriangle(rx, ry, rx + rw, ry, rx + rw, ry + 16);
    };

    drawRuinPillar(110, 260, 32, 120);
    drawRuinPillar(160, 290, 28, 90);
    drawRuinPillar(820, 250, 36, 130);
    drawRuinPillar(880, 280, 30, 100);

    // Rolling Golden Sand Dunes (Midground)
    g.fillStyle(0xdd9955, 1);
    g.fillCircle(180, 460, 240);
    g.fillStyle(0xca7733, 1);
    g.fillCircle(620, 480, 280);
    g.fillStyle(0xdd9955, 1);
    g.fillCircle(900, 450, 220);

    // Desert Sand Arena Floor (Foreground)
    g.fillStyle(0xe9a15b, 1);
    g.fillRect(0, h * 0.74, w, h * 0.26);

    // Wind-blown Sand Ridge Edge
    g.fillStyle(0xf6bd60, 1);
    g.fillRect(0, h * 0.74, w, 10);

    // Ripple Wave Texture
    g.lineStyle(2, 0xc87d32, 0.6);
    for (let ry = h * 0.77; ry < h; ry += 24) {
      g.beginPath();
      g.moveTo(0, ry);
      for (let rx = 0; rx <= w; rx += 50) {
        g.lineTo(rx, ry + Math.sin(rx * 0.04) * 6);
      }
      g.strokePath();
    }

    // Dense Sandstone Base
    g.fillStyle(0x99582a, 1);
    g.fillRect(0, h * 0.88, w, h * 0.12);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  // 8. REINO DAS TREVAS (Dark Realm - Cosmic Void, Swirling Nebulae, Monoliths & Portal)
  private static buildDarkArena(scene: Phaser.Scene, key: string) {
    const w = 960;
    const h = 540;
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Deep Void Cosmic Gradient
    g.fillGradientStyle(0x050014, 0x10002b, 0x240046, 0x3c096c, 1);
    g.fillRect(0, 0, w, h);

    // Twinkling Starfield & Cosmic Dust
    g.fillStyle(0xffffff, 0.9);
    for (let i = 0; i < 60; i++) {
      const sx = (i * 37) % w;
      const sy = (i * 23) % 300;
      g.fillCircle(sx, sy, (i % 4 === 0) ? 2.5 : 1);
    }

    // Swirling Magenta & Violet Nebulae
    const drawNebulaCloud = (nx: number, ny: number, nColor: number, nAlpha: number) => {
      g.fillStyle(nColor, nAlpha);
      g.fillCircle(nx, ny, 110);
      g.fillCircle(nx + 60, ny - 30, 90);
      g.fillCircle(nx - 50, ny + 20, 80);
      g.fillCircle(nx + 30, ny + 40, 70);
    };

    drawNebulaCloud(320, 140, 0x7209b7, 0.45);
    drawNebulaCloud(680, 160, 0xf72585, 0.35);
    drawNebulaCloud(500, 200, 0x4cc9f0, 0.3);

    // Giant Dimensional Cosmic Vortex (Black Hole / Energy Rift)
    const riftX = 500;
    const riftY = 160;
    g.fillStyle(0x000000, 1);
    g.fillCircle(riftX, riftY, 45);

    // Event Horizon Glowing Rings
    g.lineStyle(4, 0xf72585, 0.85);
    g.strokeEllipse(riftX, riftY, 130, 40);
    g.lineStyle(3, 0x4cc9f0, 0.9);
    g.strokeEllipse(riftX, riftY, 160, 50);
    g.lineStyle(1.5, 0xffffff, 0.95);
    g.strokeEllipse(riftX, riftY, 190, 60);

    // Floating Zero-G Obsidian Monoliths & Shattered Landmasses
    const drawFloatingIsland = (ix: number, iy: number, iw: number, ih: number) => {
      g.fillStyle(0x190028, 1);
      g.fillTriangle(ix, iy + ih, ix - iw / 2, iy, ix + iw / 2, iy);
      g.fillRoundedRect(ix - iw / 2, iy - 6, iw, 12, 4);

      // Glowing Rune Crystals on Monolith
      g.fillStyle(0x4cc9f0, 0.9);
      g.fillCircle(ix - 12, iy - 10, 4);
      g.fillCircle(ix + 10, iy - 14, 5);
    };

    drawFloatingIsland(140, 240, 120, 60);
    drawFloatingIsland(340, 260, 90, 45);
    drawFloatingIsland(720, 230, 140, 70);
    drawFloatingIsland(880, 270, 80, 40);

    // Dark Ethereal Crystalline Ground (Foreground)
    g.fillStyle(0x18002e, 1);
    g.fillRect(0, h * 0.74, w, h * 0.26);

    // Glowing Neon Magenta / Violet Rift Edge
    g.fillStyle(0xf72585, 1);
    g.fillRect(0, h * 0.74, w, 8);
    g.fillStyle(0x7209b7, 0.8);
    g.fillRect(0, h * 0.74 + 8, w, 6);

    // Cosmic Energy Fissures
    g.lineStyle(2, 0x4cc9f0, 0.9);
    const darkFissures = [160, 420, 680, 840];
    for (const fx of darkFissures) {
      g.beginPath();
      g.moveTo(fx, h * 0.74);
      g.lineTo(fx - 25, h * 0.84);
      g.lineTo(fx + 10, h * 0.92);
      g.lineTo(fx - 15, h);
      g.strokePath();
    }

    // Abyssal Core
    g.fillStyle(0x080010, 1);
    g.fillRect(0, h * 0.90, w, h * 0.10);

    g.generateTexture(key, w, h);
    g.destroy();
  }
}
