import Phaser from "phaser";

export class ArenaTextureBuilder {
  public static readonly WIDTH = 1920;
  public static readonly HEIGHT = 1080;

  /**
   * Generates ultra-high definition, painterly, atmospheric backgrounds for all 8 arenas.
   */
  public static buildAllArenaTextures(scene: Phaser.Scene) {
    const arenaDefs = [
      { key: "arena", draw: ArenaTextureBuilder.drawEarthArena },
      { key: "arena_namek", draw: ArenaTextureBuilder.drawNamekArena },
      { key: "arena_city", draw: ArenaTextureBuilder.drawCityArena },
      { key: "arena_tournament", draw: ArenaTextureBuilder.drawTournamentArena },
      { key: "arena_ice", draw: ArenaTextureBuilder.drawIceArena },
      { key: "arena_lava", draw: ArenaTextureBuilder.drawLavaArena },
      { key: "arena_desert", draw: ArenaTextureBuilder.drawDesertArena },
      { key: "arena_dark", draw: ArenaTextureBuilder.drawDarkArena },
    ];

    for (const def of arenaDefs) {
      if (scene.textures.exists(def.key)) {
        scene.textures.remove(def.key);
      }

      const canvasTexture = scene.textures.createCanvas(
        def.key,
        ArenaTextureBuilder.WIDTH,
        ArenaTextureBuilder.HEIGHT
      );
      if (canvasTexture) {
        const ctx = canvasTexture.getContext();
        def.draw(ctx, ArenaTextureBuilder.WIDTH, ArenaTextureBuilder.HEIGHT);
        canvasTexture.refresh();
      }
    }
  }

  // =========================================================================
  // 1. PLANETA TERRA (Lush Mountains, Blue Sky, Sunbeams, River & Plateau)
  // =========================================================================
  private static drawEarthArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    skyGrad.addColorStop(0, "#0b2545");
    skyGrad.addColorStop(0.3, "#134074");
    skyGrad.addColorStop(0.65, "#407ba7");
    skyGrad.addColorStop(0.85, "#8da9c4");
    skyGrad.addColorStop(1, "#eef4f8");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Radiant Sun with Corona & God Rays
    const sunX = w * 0.72;
    const sunY = h * 0.22;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 240);
    sunGlow.addColorStop(0, "rgba(255, 255, 240, 1)");
    sunGlow.addColorStop(0.15, "rgba(255, 243, 176, 0.8)");
    sunGlow.addColorStop(0.4, "rgba(255, 218, 121, 0.35)");
    sunGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 240, 0, Math.PI * 2);
    ctx.fill();

    // God Rays
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#ffffff";
    for (let angle = 0.2; angle < Math.PI * 0.9; angle += 0.14) {
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(sunX + Math.cos(angle) * w, sunY + Math.sin(angle) * h);
      ctx.lineTo(sunX + Math.cos(angle + 0.06) * w, sunY + Math.sin(angle + 0.06) * h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Fluffy High Anime Clouds
    const drawCloud = (cx: number, cy: number, scale: number, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      const cGrad = ctx.createLinearGradient(cx, cy - 40 * scale, cx, cy + 40 * scale);
      cGrad.addColorStop(0, "#ffffff");
      cGrad.addColorStop(1, "#c5d7e8");
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 45 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 40 * scale, cy - 20 * scale, 35 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 80 * scale, cy - 10 * scale, 40 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 120 * scale, cy + 5 * scale, 30 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 60 * scale, cy + 15 * scale, 35 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawCloud(w * 0.15, h * 0.18, 1.4, 0.7);
    drawCloud(w * 0.42, h * 0.12, 1.8, 0.85);
    drawCloud(w * 0.88, h * 0.28, 1.1, 0.6);
    drawCloud(w * 0.05, h * 0.32, 1.0, 0.5);

    // Far Mountain Tier 1 (Snowcapped Majestic Alpine Peaks)
    ctx.fillStyle = "#3d5a80";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.65);
    const mountain1 = [
      [0, h * 0.55], [w * 0.1, h * 0.42], [w * 0.2, h * 0.52], [w * 0.32, h * 0.36],
      [w * 0.45, h * 0.54], [w * 0.58, h * 0.38], [w * 0.7, h * 0.48], [w * 0.82, h * 0.34],
      [w * 0.92, h * 0.44], [w, h * 0.50]
    ];
    for (const [px, py] of mountain1) ctx.lineTo(px, py);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Snow caps on Tier 1
    ctx.fillStyle = "#ffffff";
    const snowPeaks = [
      [w * 0.1, h * 0.42, 60], [w * 0.32, h * 0.36, 85],
      [w * 0.58, h * 0.38, 75], [w * 0.82, h * 0.34, 90]
    ];
    for (const [sx, sy, sz] of snowPeaks) {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - sz, sy + sz * 0.75);
      ctx.lineTo(sx - sz * 0.3, sy + sz * 0.55);
      ctx.lineTo(sx, sy + sz * 0.7);
      ctx.lineTo(sx + sz * 0.4, sy + sz * 0.5);
      ctx.lineTo(sx + sz, sy + sz * 0.75);
      ctx.closePath();
      ctx.fill();
    }

    // Atmospheric Blue Haze Mist Layer
    const haze1 = ctx.createLinearGradient(0, h * 0.45, 0, h * 0.65);
    haze1.addColorStop(0, "rgba(220, 235, 245, 0)");
    haze1.addColorStop(1, "rgba(180, 210, 230, 0.7)");
    ctx.fillStyle = haze1;
    ctx.fillRect(0, h * 0.45, w, h * 0.2);

    // Mid Mountain Tier 2 (Deep Pine / Slate Foothills)
    ctx.fillStyle = "#293241";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.68);
    const mountain2 = [
      [0, h * 0.6], [w * 0.14, h * 0.52], [w * 0.28, h * 0.62], [w * 0.42, h * 0.48],
      [w * 0.56, h * 0.58], [w * 0.72, h * 0.46], [w * 0.86, h * 0.56], [w, h * 0.52]
    ];
    for (const [px, py] of mountain2) ctx.lineTo(px, py);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Rolling Green Hills (Tier 3)
    const hillGrad = ctx.createLinearGradient(0, h * 0.55, 0, h * 0.76);
    hillGrad.addColorStop(0, "#2d6a4f");
    hillGrad.addColorStop(1, "#1b4332");
    ctx.fillStyle = hillGrad;

    ctx.beginPath();
    ctx.arc(w * 0.2, h * 0.88, w * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.75, h * 0.90, w * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.48, h * 0.86, w * 0.34, 0, Math.PI * 2);
    ctx.fill();

    // Pine Forest Silhouettes
    ctx.fillStyle = "#081c15";
    for (let tx = 10; tx < w; tx += 28) {
      const treeY = h * 0.62 + Math.sin(tx * 0.015) * 35;
      const th = 28 + Math.sin(tx * 0.05) * 12;
      ctx.beginPath();
      ctx.moveTo(tx, treeY - th);
      ctx.lineTo(tx - 12, treeY + 10);
      ctx.lineTo(tx + 12, treeY + 10);
      ctx.closePath();
      ctx.fill();
    }

    // Main Plateau Combat Arena (Foreground)
    const groundGrad = ctx.createLinearGradient(0, h * 0.72, 0, h);
    groundGrad.addColorStop(0, "#52b788");
    groundGrad.addColorStop(0.04, "#40916c");
    groundGrad.addColorStop(0.2, "#2d6a4f");
    groundGrad.addColorStop(0.55, "#1b4332");
    groundGrad.addColorStop(1, "#081c15");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);

    // Glowing Emerald Grass Rim Highlight
    ctx.fillStyle = "#95d5b2";
    ctx.fillRect(0, h * 0.72, w, 6);

    // Grass Blade Tuft Details
    ctx.fillStyle = "#74c69d";
    for (let gx = 0; gx < w; gx += 14) {
      ctx.beginPath();
      ctx.moveTo(gx, h * 0.72);
      ctx.lineTo(gx + 6, h * 0.72 - 10);
      ctx.lineTo(gx + 12, h * 0.72);
      ctx.fill();
    }

    // Rocky Earth Strata Cracks & Pebbles
    ctx.strokeStyle = "#1b4332";
    ctx.lineWidth = 3;
    for (let rx = 50; rx < w; rx += 140) {
      ctx.beginPath();
      ctx.moveTo(rx, h * 0.77);
      ctx.lineTo(rx + 35, h * 0.84);
      ctx.lineTo(rx + 70, h * 0.81);
      ctx.stroke();
    }
  }

  // =========================================================================
  // 2. NAMEKUSEI (Teal Sky, Double Ringed Moons, Ajissa Trees, Conical Cliffs)
  // =========================================================================
  private static drawNamekArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Emerald / Cyan Alien Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    skyGrad.addColorStop(0, "#03252a");
    skyGrad.addColorStop(0.35, "#0b525b");
    skyGrad.addColorStop(0.7, "#14746f");
    skyGrad.addColorStop(0.9, "#2dc653");
    skyGrad.addColorStop(1, "#80ffdb");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Giant Ringed Gas Planet
    const px = w * 0.78;
    const py = h * 0.24;
    const pRadius = 110;

    // Atmospheric Planet Glow
    const pGlow = ctx.createRadialGradient(px, py, pRadius * 0.5, px, py, pRadius * 1.8);
    pGlow.addColorStop(0, "rgba(100, 223, 223, 0.4)");
    pGlow.addColorStop(1, "rgba(100, 223, 223, 0)");
    ctx.fillStyle = pGlow;
    ctx.beginPath();
    ctx.arc(px, py, pRadius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Planet Sphere
    const planetGrad = ctx.createLinearGradient(px - pRadius, py - pRadius, px + pRadius, py + pRadius);
    planetGrad.addColorStop(0, "#48bfe3");
    planetGrad.addColorStop(0.4, "#56ab91");
    planetGrad.addColorStop(0.8, "#2d6a4f");
    planetGrad.addColorStop(1, "#081c15");
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(px, py, pRadius, 0, Math.PI * 2);
    ctx.fill();

    // Atmospheric Bands on Planet
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, pRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "rgba(45, 106, 79, 0.5)";
    ctx.fillRect(px - pRadius, py - 30, pRadius * 2, 24);
    ctx.fillRect(px - pRadius, py + 15, pRadius * 2, 30);
    ctx.restore();

    // Planetary Rings
    ctx.save();
    ctx.strokeStyle = "rgba(181, 228, 140, 0.85)";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.ellipse(px, py, pRadius * 2.1, pRadius * 0.5, -0.25, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(px, py, pRadius * 2.25, pRadius * 0.54, -0.25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Secondary Small Cyan Moon
    const m2X = w * 0.22;
    const m2Y = h * 0.16;
    const moonGrad = ctx.createRadialGradient(m2X - 10, m2Y - 10, 5, m2X, m2Y, 45);
    moonGrad.addColorStop(0, "#ffffff");
    moonGrad.addColorStop(0.5, "#72efdd");
    moonGrad.addColorStop(1, "#0077b6");
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(m2X, m2Y, 45, 0, Math.PI * 2);
    ctx.fill();

    // Distant Conical Namekian Plateaus
    ctx.fillStyle = "#1b4965";
    const plateaus = [
      [w * 0.12, h * 0.38, 110, h * 0.4],
      [w * 0.32, h * 0.44, 150, h * 0.35],
      [w * 0.52, h * 0.36, 130, h * 0.42],
      [w * 0.70, h * 0.42, 120, h * 0.36],
      [w * 0.88, h * 0.39, 140, h * 0.4]
    ];
    for (const [cx, cy, cw, ch] of plateaus) {
      ctx.beginPath();
      ctx.roundRect(cx - cw / 2, cy, cw, ch, [24, 24, 0, 0]);
      ctx.fill();
      // Dome Cap
      ctx.beginPath();
      ctx.arc(cx, cy, cw * 0.45, Math.PI, 0);
      ctx.fill();
    }

    // Emerald Water Horizon
    const waterGrad = ctx.createLinearGradient(0, h * 0.63, 0, h * 0.74);
    waterGrad.addColorStop(0, "#2ec4b6");
    waterGrad.addColorStop(1, "#0f4c5c");
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, h * 0.63, w, h * 0.11);

    // Ajissa Trees (Cylindrical Trunk + Perfect Sphere Spherical Foliage)
    const drawAjissa = (tx: number, ty: number, scale: number) => {
      ctx.fillStyle = "#22577a";
      ctx.fillRect(tx - 6 * scale, ty - 85 * scale, 12 * scale, 85 * scale);

      const foliageGrad = ctx.createRadialGradient(
        tx - 12 * scale,
        ty - 95 * scale,
        10 * scale,
        tx,
        ty - 90 * scale,
        45 * scale
      );
      foliageGrad.addColorStop(0, "#9ef01a");
      foliageGrad.addColorStop(0.6, "#38b000");
      foliageGrad.addColorStop(1, "#004b23");
      ctx.fillStyle = foliageGrad;
      ctx.beginPath();
      ctx.arc(tx, ty - 90 * scale, 42 * scale, 0, Math.PI * 2);
      ctx.fill();
    };

    drawAjissa(w * 0.08, h * 0.74, 1.2);
    drawAjissa(w * 0.15, h * 0.74, 0.9);
    drawAjissa(w * 0.44, h * 0.74, 1.4);
    drawAjissa(w * 0.50, h * 0.74, 1.0);
    drawAjissa(w * 0.85, h * 0.74, 1.3);
    drawAjissa(w * 0.92, h * 0.74, 0.85);

    // Namekian Grass & Combat Ground
    const namekGround = ctx.createLinearGradient(0, h * 0.73, 0, h);
    namekGround.addColorStop(0, "#38b000");
    namekGround.addColorStop(0.06, "#2d6a4f");
    namekGround.addColorStop(0.4, "#1b4332");
    namekGround.addColorStop(1, "#081c15");
    ctx.fillStyle = namekGround;
    ctx.fillRect(0, h * 0.73, w, h * 0.27);

    // Glowing Aqua Moss Border
    ctx.fillStyle = "#70e000";
    ctx.fillRect(0, h * 0.73, w, 8);
  }

  // =========================================================================
  // 3. CIDADE DESTRUÍDA (Apocalyptic Burning Sunset, Ruined Towers & Rubble)
  // =========================================================================
  private static drawCityArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Blood Orange Apocalyptic Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    skyGrad.addColorStop(0, "#190000");
    skyGrad.addColorStop(0.25, "#3d0000");
    skyGrad.addColorStop(0.55, "#780000");
    skyGrad.addColorStop(0.8, "#c1121f");
    skyGrad.addColorStop(1, "#ff7b00");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Giant Glowing Blood Sun
    const sunX = w * 0.52;
    const sunY = h * 0.32;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 180);
    sunGrad.addColorStop(0, "#fff3b0");
    sunGrad.addColorStop(0.3, "#ffaa00");
    sunGrad.addColorStop(0.7, "#e63946");
    sunGrad.addColorStop(1, "rgba(230, 57, 70, 0)");
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 180, 0, Math.PI * 2);
    ctx.fill();

    // Billowing Smoke Clouds
    const drawSmoke = (sx: number, sy: number, radius: number) => {
      ctx.fillStyle = "rgba(20, 10, 10, 0.75)";
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.arc(sx + radius * 0.6, sy - radius * 0.4, radius * 0.8, 0, Math.PI * 2);
      ctx.arc(sx - radius * 0.5, sy - radius * 0.3, radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    };

    drawSmoke(w * 0.18, h * 0.28, 90);
    drawSmoke(w * 0.42, h * 0.22, 110);
    drawSmoke(w * 0.78, h * 0.25, 100);

    // Far Skyline Silhouettes (Layer 1)
    ctx.fillStyle = "#2b0a0a";
    for (let bx = 0; bx < w; bx += 70) {
      const bh = 220 + Math.sin(bx * 0.08) * 120 + (bx % 3 === 0 ? 140 : 0);
      ctx.fillRect(bx, h * 0.68 - bh, 55, bh + 100);
    }

    // Midground Ruined High-Rises with Broken Windows & Fires (Layer 2)
    ctx.fillStyle = "#1a1a1a";
    const buildings = [
      { x: w * 0.04, w: 160, h: 480 },
      { x: w * 0.16, w: 200, h: 560 },
      { x: w * 0.32, w: 140, h: 420 },
      { x: w * 0.44, w: 220, h: 600 },
      { x: w * 0.60, w: 170, h: 460 },
      { x: w * 0.72, w: 210, h: 540 },
      { x: w * 0.88, w: 150, h: 500 },
    ];

    for (const b of buildings) {
      const topY = h * 0.74 - b.h;
      ctx.fillStyle = "#1e1e24";
      ctx.fillRect(b.x, topY, b.w, b.h + 100);

      // Crumpled / Blasted Top Angle
      ctx.fillStyle = "#780000";
      ctx.beginPath();
      ctx.arc(b.x + b.w * 0.8, topY + 40, 45, 0, Math.PI * 2);
      ctx.fill();

      // Lit/Burning Orange Windows
      ctx.fillStyle = "#ff9e00";
      for (let wy = topY + 60; wy < h * 0.72; wy += 38) {
        for (let wx = b.x + 18; wx < b.x + b.w - 20; wx += 30) {
          if (Math.random() > 0.4) {
            ctx.fillRect(wx, wy, 16, 22);
          }
        }
      }
    }

    // Broken Concrete Highway Combat Deck (Foreground)
    const roadGrad = ctx.createLinearGradient(0, h * 0.73, 0, h);
    roadGrad.addColorStop(0, "#343a40");
    roadGrad.addColorStop(0.1, "#212529");
    roadGrad.addColorStop(1, "#0d0d0d");
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, h * 0.73, w, h * 0.27);

    // Yellow Highway Divider Dashes
    ctx.fillStyle = "#ffb703";
    for (let rx = 30; rx < w; rx += 140) {
      ctx.fillRect(rx, h * 0.78, 80, 10);
    }

    // Asphalt Edge & Fractures
    ctx.fillStyle = "#495057";
    ctx.fillRect(0, h * 0.73, w, 10);

    ctx.strokeStyle = "#ff4800";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.73);
    ctx.lineTo(w * 0.22, h * 0.86);
    ctx.moveTo(w * 0.55, h * 0.73);
    ctx.lineTo(w * 0.62, h * 0.88);
    ctx.stroke();
  }

  // =========================================================================
  // 4. TORNEIO SUPREMO (Grand Martial Arts Colosseum, Azure Sky, Dragon Statues)
  // =========================================================================
  private static drawTournamentArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Vibrant Blue Anime Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    skyGrad.addColorStop(0, "#03045e");
    skyGrad.addColorStop(0.3, "#0077b6");
    skyGrad.addColorStop(0.65, "#00b4d8");
    skyGrad.addColorStop(0.85, "#90e0ef");
    skyGrad.addColorStop(1, "#caf0f8");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Brilliant Sun
    const sunX = w * 0.5;
    const sunY = h * 0.18;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 160);
    sunGlow.addColorStop(0, "#ffffff");
    sunGlow.addColorStop(0.3, "rgba(255, 234, 0, 0.8)");
    sunGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 160, 0, Math.PI * 2);
    ctx.fill();

    // Colosseum Amphitheater Stands (Background)
    ctx.fillStyle = "#6c757d";
    ctx.fillRect(0, h * 0.42, w, h * 0.32);

    // Seating Rows
    ctx.fillStyle = "#495057";
    for (let sy = h * 0.44; sy < h * 0.74; sy += 24) {
      ctx.fillRect(0, sy, w, 6);
    }

    // Colosseum Marble Arches & Festive Flags
    ctx.fillStyle = "#e9ecef";
    for (let px = 60; px < w; px += 120) {
      ctx.fillRect(px, h * 0.36, 32, h * 0.38);
      ctx.beginPath();
      ctx.arc(px + 16, h * 0.36, 20, Math.PI, 0);
      ctx.fill();

      // Red & Gold Festival Banners
      ctx.fillStyle = px % 240 === 60 ? "#d90429" : "#ffb703";
      ctx.beginPath();
      ctx.moveTo(px + 32, h * 0.38);
      ctx.lineTo(px + 80, h * 0.40);
      ctx.lineTo(px + 32, h * 0.43);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#e9ecef";
    }

    // Massive Dragon Statues / Pillars on Edges
    const drawGrandPillar = (px: number) => {
      ctx.fillStyle = "#adb5bd";
      ctx.fillRect(px - 45, h * 0.28, 90, h * 0.46);
      ctx.fillStyle = "#ffb703";
      ctx.beginPath();
      ctx.arc(px, h * 0.26, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f8f9fa";
      ctx.fillRect(px - 55, h * 0.30, 110, 20);
      ctx.fillRect(px - 55, h * 0.68, 110, 24);
    };

    drawGrandPillar(w * 0.08);
    drawGrandPillar(w * 0.92);

    // Martial Arts Tiled Ring (Foreground)
    const ringGrad = ctx.createLinearGradient(0, h * 0.72, 0, h);
    ringGrad.addColorStop(0, "#dee2e6");
    ringGrad.addColorStop(0.1, "#ced4da");
    ringGrad.addColorStop(1, "#6c757d");
    ctx.fillStyle = ringGrad;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);

    // Golden Boundary Line of Tournament Stage
    ctx.fillStyle = "#f72585";
    ctx.fillRect(0, h * 0.72, w, 14);
    ctx.fillStyle = "#ffb703";
    ctx.fillRect(0, h * 0.72 + 14, w, 8);

    // Tile Grid Lines
    ctx.strokeStyle = "#adb5bd";
    ctx.lineWidth = 3;
    for (let tx = 0; tx < w; tx += 95) {
      ctx.beginPath();
      ctx.moveTo(tx, h * 0.74);
      ctx.lineTo(tx, h);
      ctx.stroke();
    }
    for (let ty = h * 0.74; ty < h; ty += 60) {
      ctx.beginPath();
      ctx.moveTo(0, ty);
      ctx.lineTo(w, ty);
      ctx.stroke();
    }
  }

  // =========================================================================
  // 5. GELEIRA ETERNA (Arctic Polar Night, Aurora Borealis, Ice Spires & Permafrost)
  // =========================================================================
  private static drawIceArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Polar Night Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    skyGrad.addColorStop(0, "#010a13");
    skyGrad.addColorStop(0.3, "#031d36");
    skyGrad.addColorStop(0.65, "#0b3c5d");
    skyGrad.addColorStop(1, "#1d7874");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Twinkling Starfield
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 90; i++) {
      const sx = (i * 73) % w;
      const sy = (i * 37) % (h * 0.55);
      const sr = i % 4 === 0 ? 3 : 1.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing Multicolored Aurora Waves
    const drawAuroraWave = (baseY: number, color: string, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= w; x += 50) {
        const y = baseY + Math.sin(x * 0.005 + baseY) * 60 + Math.cos(x * 0.01) * 35;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, baseY + 140);
      for (let x = w; x >= 0; x -= 50) {
        const y = baseY + 140 + Math.sin(x * 0.005 + baseY) * 60;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    drawAuroraWave(h * 0.12, "#00f5d4", 0.5);
    drawAuroraWave(h * 0.18, "#7209b7", 0.4);
    drawAuroraWave(h * 0.24, "#4cc9f0", 0.45);

    // Distant Crystalline Mountain Range (Layer 1)
    ctx.fillStyle = "#10375c";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.68);
    const iceFar = [
      [0, h * 0.55], [w * 0.15, h * 0.38], [w * 0.3, h * 0.52], [w * 0.48, h * 0.34],
      [w * 0.65, h * 0.50], [w * 0.82, h * 0.36], [w, h * 0.48]
    ];
    for (const [px, py] of iceFar) ctx.lineTo(px, py);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Sharp Faceted Ice Spires (Layer 2)
    const drawSpire = (ix: number, iy: number, iw: number, ih: number) => {
      // Left Facet (Light Turquoise)
      ctx.fillStyle = "#90e0ef";
      ctx.beginPath();
      ctx.moveTo(ix, iy - ih);
      ctx.lineTo(ix - iw / 2, iy);
      ctx.lineTo(ix, iy);
      ctx.closePath();
      ctx.fill();

      // Right Facet (Deep Azure)
      ctx.fillStyle = "#0077b6";
      ctx.beginPath();
      ctx.moveTo(ix, iy - ih);
      ctx.lineTo(ix, iy);
      ctx.lineTo(ix + iw / 2, iy);
      ctx.closePath();
      ctx.fill();

      // Gleam Peak
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(ix, iy - ih);
      ctx.lineTo(ix - 10, iy - ih + 50);
      ctx.lineTo(ix + 10, iy - ih + 50);
      ctx.closePath();
      ctx.fill();
    };

    drawSpire(w * 0.12, h * 0.74, 140, 320);
    drawSpire(w * 0.28, h * 0.74, 110, 240);
    drawSpire(w * 0.48, h * 0.74, 170, 380);
    drawSpire(w * 0.68, h * 0.74, 130, 290);
    drawSpire(w * 0.88, h * 0.74, 160, 350);

    // Frozen Permafrost Ice Arena Floor (Foreground)
    const iceFloorGrad = ctx.createLinearGradient(0, h * 0.73, 0, h);
    iceFloorGrad.addColorStop(0, "#caf0f8");
    iceFloorGrad.addColorStop(0.1, "#90e0ef");
    iceFloorGrad.addColorStop(0.5, "#0077b6");
    iceFloorGrad.addColorStop(1, "#03045e");
    ctx.fillStyle = iceFloorGrad;
    ctx.fillRect(0, h * 0.73, w, h * 0.27);

    // Glowing Cyan Ice Crystal Edge
    ctx.fillStyle = "#00f5d4";
    ctx.fillRect(0, h * 0.73, w, 8);

    // Deep Glacial Fractures
    ctx.strokeStyle = "#00b4d8";
    ctx.lineWidth = 4;
    for (const fx of [w * 0.18, w * 0.45, w * 0.72]) {
      ctx.beginPath();
      ctx.moveTo(fx, h * 0.73);
      ctx.lineTo(fx + 50, h * 0.84);
      ctx.lineTo(fx + 20, h * 0.94);
      ctx.stroke();
    }
  }

  // =========================================================================
  // 6. VULCÃO INFERNAL (Volcanic Lightning, Magma Eruptions & Basalt Islands)
  // =========================================================================
  private static drawLavaArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Volcanic Ash Crimson Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    skyGrad.addColorStop(0, "#0b0000");
    skyGrad.addColorStop(0.3, "#250000");
    skyGrad.addColorStop(0.65, "#6a040f");
    skyGrad.addColorStop(0.85, "#d00000");
    skyGrad.addColorStop(1, "#ff5400");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Volcanic Lightning Arcs
    ctx.strokeStyle = "#ffea00";
    ctx.lineWidth = 3.5;
    const drawLightning = (lx: number, ly: number) => {
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + 35, ly + 65);
      ctx.lineTo(lx - 20, ly + 120);
      ctx.lineTo(lx + 45, ly + 180);
      ctx.stroke();
    };
    drawLightning(w * 0.25, h * 0.08);
    drawLightning(w * 0.75, h * 0.12);

    // Erupting Volcano Caldrons
    const drawVolcano = (vx: number, vy: number, vw: number, vh: number) => {
      ctx.fillStyle = "#1e0000";
      ctx.beginPath();
      ctx.moveTo(vx - vw / 2, vy + vh);
      ctx.lineTo(vx - vw * 0.18, vy);
      ctx.lineTo(vx + vw * 0.18, vy);
      ctx.lineTo(vx + vw / 2, vy + vh);
      ctx.closePath();
      ctx.fill();

      // Magma Fountain Eruption
      const magmaGrad = ctx.createRadialGradient(vx, vy, 10, vx, vy, 90);
      magmaGrad.addColorStop(0, "#ffffff");
      magmaGrad.addColorStop(0.3, "#ffea00");
      magmaGrad.addColorStop(0.7, "#ff5400");
      magmaGrad.addColorStop(1, "rgba(255, 84, 0, 0)");
      ctx.fillStyle = magmaGrad;
      ctx.beginPath();
      ctx.arc(vx, vy - 20, 90, 0, Math.PI * 2);
      ctx.fill();
    };

    drawVolcano(w * 0.28, h * 0.35, 450, 380);
    drawVolcano(w * 0.74, h * 0.32, 520, 420);

    // Basalt Obsidian Crags (Midground)
    ctx.fillStyle = "#100000";
    for (let cx = 0; cx < w; cx += 110) {
      const ch = 220 + Math.sin(cx * 0.05) * 80;
      ctx.beginPath();
      ctx.moveTo(cx, h * 0.74 - ch);
      ctx.lineTo(cx - 60, h * 0.74);
      ctx.lineTo(cx + 60, h * 0.74);
      ctx.closePath();
      ctx.fill();
    }

    // Molten Lava Fighting Field (Foreground)
    const lavaGrad = ctx.createLinearGradient(0, h * 0.73, 0, h);
    lavaGrad.addColorStop(0, "#ffea00");
    lavaGrad.addColorStop(0.1, "#ff5400");
    lavaGrad.addColorStop(0.45, "#d00000");
    lavaGrad.addColorStop(1, "#370617");
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(0, h * 0.73, w, h * 0.27);

    // Glowing Lava Edge
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, h * 0.73, w, 6);

    // Floating Basalt Rock Platforms
    ctx.fillStyle = "#150000";
    const islands = [
      [w * 0.05, 300], [w * 0.32, 360], [w * 0.65, 380], [w * 0.88, 220]
    ];
    for (const [ix, iw] of islands) {
      ctx.beginPath();
      ctx.roundRect(ix, h * 0.77, iw, 45, 14);
      ctx.fill();
      ctx.strokeStyle = "#ff7b00";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  // =========================================================================
  // 7. DESERTO ESQUECIDO (Terracotta Pyramids, Sand Dunes & Blazing Solar Disc)
  // =========================================================================
  private static drawDesertArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Solar Desert Horizon Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    skyGrad.addColorStop(0, "#6f1d1b");
    skyGrad.addColorStop(0.25, "#99582a");
    skyGrad.addColorStop(0.55, "#bb9457");
    skyGrad.addColorStop(0.85, "#ffe6a7");
    skyGrad.addColorStop(1, "#ffffff");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Blinding Sun
    const sunX = w * 0.32;
    const sunY = h * 0.22;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 200);
    sunGrad.addColorStop(0, "#ffffff");
    sunGrad.addColorStop(0.3, "rgba(255, 230, 167, 0.9)");
    sunGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 200, 0, Math.PI * 2);
    ctx.fill();

    // Ancient Sandstone Pyramids
    const drawPyramid = (px: number, py: number, psize: number) => {
      // Lit side
      ctx.fillStyle = "#e07a5f";
      ctx.beginPath();
      ctx.moveTo(px, py - psize);
      ctx.lineTo(px - psize * 1.2, py);
      ctx.lineTo(px, py);
      ctx.closePath();
      ctx.fill();

      // Shadow side
      ctx.fillStyle = "#8d0801";
      ctx.beginPath();
      ctx.moveTo(px, py - psize);
      ctx.lineTo(px, py);
      ctx.lineTo(px + psize * 1.2, py);
      ctx.closePath();
      ctx.fill();
    };

    drawPyramid(w * 0.55, h * 0.65, 260);
    drawPyramid(w * 0.82, h * 0.67, 180);

    // Weathered Ancient Columns
    for (const rx of [w * 0.12, w * 0.22, w * 0.72]) {
      ctx.fillStyle = "#d4a373";
      ctx.fillRect(rx, h * 0.48, 40, h * 0.26);
      ctx.fillStyle = "#a98467";
      ctx.fillRect(rx + 24, h * 0.48, 16, h * 0.26);
    }

    // Rolling Golden Sand Dunes
    ctx.fillStyle = "#ddb892";
    ctx.beginPath();
    ctx.arc(w * 0.25, h * 0.92, w * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#b08968";
    ctx.beginPath();
    ctx.arc(w * 0.75, h * 0.94, w * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Desert Combat Floor (Foreground)
    const sandFloorGrad = ctx.createLinearGradient(0, h * 0.73, 0, h);
    sandFloorGrad.addColorStop(0, "#ffe6a7");
    sandFloorGrad.addColorStop(0.1, "#ddb892");
    sandFloorGrad.addColorStop(0.6, "#b08968");
    sandFloorGrad.addColorStop(1, "#7f4f24");
    ctx.fillStyle = sandFloorGrad;
    ctx.fillRect(0, h * 0.73, w, h * 0.27);

    // Wind Sand Ripple Ridges
    ctx.strokeStyle = "#7f4f24";
    ctx.lineWidth = 3;
    for (let ry = h * 0.76; ry < h; ry += 35) {
      ctx.beginPath();
      ctx.moveTo(0, ry);
      for (let rx = 0; rx <= w; rx += 80) {
        ctx.lineTo(rx, ry + Math.sin(rx * 0.02) * 10);
      }
      ctx.stroke();
    }
  }

  // =========================================================================
  // 8. REINO DAS TREVAS (Cosmic Nebulae, Dimensional Rift & Floating Monoliths)
  // =========================================================================
  private static drawDarkArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Void Cosmos Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    skyGrad.addColorStop(0, "#050014");
    skyGrad.addColorStop(0.3, "#10002b");
    skyGrad.addColorStop(0.65, "#240046");
    skyGrad.addColorStop(1, "#3c096c");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Cosmic Starfield
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 120; i++) {
      const sx = (i * 97) % w;
      const sy = (i * 47) % (h * 0.65);
      const sr = i % 5 === 0 ? 3.5 : 1.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Swirling Purple & Cyan Nebulae
    const drawNebula = (nx: number, ny: number, color: string) => {
      const nGrad = ctx.createRadialGradient(nx, ny, 30, nx, ny, 260);
      nGrad.addColorStop(0, color);
      nGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = nGrad;
      ctx.beginPath();
      ctx.arc(nx, ny, 260, 0, Math.PI * 2);
      ctx.fill();
    };

    drawNebula(w * 0.28, h * 0.25, "rgba(114, 9, 183, 0.5)");
    drawNebula(w * 0.75, h * 0.32, "rgba(247, 37, 133, 0.4)");
    drawNebula(w * 0.52, h * 0.38, "rgba(76, 201, 240, 0.35)");

    // Dimensional Black Hole Rift
    const rx = w * 0.5;
    const ry = h * 0.28;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(rx, ry, 75, 0, Math.PI * 2);
    ctx.fill();

    // Accretion Rings
    ctx.save();
    ctx.strokeStyle = "#f72585";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(rx, ry, 220, 65, 0.1, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#4cc9f0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(rx, ry, 260, 80, 0.1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Floating Zero-G Obsidian Monoliths
    const drawMonolith = (mx: number, my: number, mw: number, mh: number) => {
      ctx.fillStyle = "#10002b";
      ctx.fillRect(mx - mw / 2, my, mw, mh);
      // Glowing Arcane Runes
      ctx.fillStyle = "#4cc9f0";
      ctx.fillRect(mx - 6, my + 20, 12, 12);
      ctx.fillRect(mx - 4, my + 50, 8, 25);
    };

    drawMonolith(w * 0.15, h * 0.44, 70, 160);
    drawMonolith(w * 0.35, h * 0.48, 55, 120);
    drawMonolith(w * 0.75, h * 0.42, 80, 180);
    drawMonolith(w * 0.88, h * 0.46, 60, 140);

    // Cosmic Crystal Combat Ground (Foreground)
    const darkGround = ctx.createLinearGradient(0, h * 0.73, 0, h);
    darkGround.addColorStop(0, "#3c096c");
    darkGround.addColorStop(0.1, "#240046");
    darkGround.addColorStop(0.5, "#10002b");
    darkGround.addColorStop(1, "#050014");
    ctx.fillStyle = darkGround;
    ctx.fillRect(0, h * 0.73, w, h * 0.27);

    // Neon Rift Edge
    ctx.fillStyle = "#f72585";
    ctx.fillRect(0, h * 0.73, w, 8);
    ctx.fillStyle = "#4cc9f0";
    ctx.fillRect(0, h * 0.73 + 8, w, 4);

    // Void Energy Fissures
    ctx.strokeStyle = "#4cc9f0";
    ctx.lineWidth = 3;
    for (const ex of [w * 0.2, w * 0.55, w * 0.82]) {
      ctx.beginPath();
      ctx.moveTo(ex, h * 0.73);
      ctx.lineTo(ex - 35, h * 0.85);
      ctx.lineTo(ex + 20, h * 0.95);
      ctx.stroke();
    }
  }
}
