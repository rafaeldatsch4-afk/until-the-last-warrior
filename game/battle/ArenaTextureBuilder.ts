import Phaser from "phaser";

export class ArenaTextureBuilder {
  public static readonly WIDTH = 1920;
  public static readonly HEIGHT = 1080;

  /**
   * Generates ultra-high definition, painterly, atmospheric backgrounds for all 8 arenas
   * with organic mountain ranges, realistic trees, and rich architectural details.
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
        canvasTexture.setFilter(Phaser.Textures.FilterMode.LINEAR);
        const ctx = canvasTexture.getContext();
        def.draw(ctx, ArenaTextureBuilder.WIDTH, ArenaTextureBuilder.HEIGHT);
        canvasTexture.refresh();
      }
    }
  }

  // =========================================================================
  // HELPER: REALISTIC PINE TREE (Tiered needle boughs, shaded depth, organic trunk)
  // =========================================================================
  private static drawDetailedPineTree(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    palette?: {
      trunk?: string;
      lightNeedle?: string;
      midNeedle?: string;
      darkNeedle?: string;
    }
  ) {
    ctx.save();
    const trunkColor = palette?.trunk || "#2c1810";
    const lightNeedle = palette?.lightNeedle || "#52b788";
    const midNeedle = palette?.midNeedle || "#2d6a4f";
    const darkNeedle = palette?.darkNeedle || "#081c15";

    const treeHeight = 110 * scale;
    const trunkWidth = 10 * scale;

    // 1. Organic Tapered Trunk
    ctx.fillStyle = trunkColor;
    ctx.beginPath();
    ctx.moveTo(x - trunkWidth * 0.8, y);
    ctx.lineTo(x - trunkWidth * 0.3, y - treeHeight * 0.6);
    ctx.lineTo(x + trunkWidth * 0.3, y - treeHeight * 0.6);
    ctx.lineTo(x + trunkWidth * 0.8, y);
    ctx.closePath();
    ctx.fill();

    // Trunk Bark Highlights
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(x - trunkWidth * 0.6, y - treeHeight * 0.4, trunkWidth * 0.3, treeHeight * 0.35);

    // 2. Multi-tiered Boughs (From top to bottom)
    const tiers = [
      { yOffset: treeHeight * 0.95, width: 28 * scale, height: 26 * scale },
      { yOffset: treeHeight * 0.82, width: 44 * scale, height: 30 * scale },
      { yOffset: treeHeight * 0.68, width: 62 * scale, height: 34 * scale },
      { yOffset: treeHeight * 0.52, width: 80 * scale, height: 38 * scale },
      { yOffset: treeHeight * 0.35, width: 98 * scale, height: 42 * scale },
      { yOffset: treeHeight * 0.18, width: 112 * scale, height: 46 * scale },
    ];

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const tierCenterY = y - tier.yOffset;
      const hw = tier.width / 2;

      // Dark underside shadow of tier
      ctx.fillStyle = darkNeedle;
      ctx.beginPath();
      ctx.moveTo(x, tierCenterY - tier.height * 0.6);
      ctx.lineTo(x - hw, tierCenterY + tier.height * 0.4);
      ctx.quadraticCurveTo(x, tierCenterY + tier.height * 0.6, x + hw, tierCenterY + tier.height * 0.4);
      ctx.closePath();
      ctx.fill();

      // Midtone body of tier
      ctx.fillStyle = midNeedle;
      ctx.beginPath();
      ctx.moveTo(x, tierCenterY - tier.height * 0.6);
      ctx.lineTo(x - hw * 0.9, tierCenterY + tier.height * 0.25);
      // Serrated bough needles
      for (let s = -hw * 0.7; s <= hw * 0.7; s += 12 * scale) {
        ctx.lineTo(x + s, tierCenterY + tier.height * 0.35);
        ctx.lineTo(x + s + 6 * scale, tierCenterY + tier.height * 0.2);
      }
      ctx.lineTo(x + hw * 0.9, tierCenterY + tier.height * 0.25);
      ctx.closePath();
      ctx.fill();

      // Top sun-dappled foliage highlights (left-to-center highlight)
      ctx.fillStyle = lightNeedle;
      ctx.beginPath();
      ctx.moveTo(x, tierCenterY - tier.height * 0.6);
      ctx.lineTo(x - hw * 0.75, tierCenterY + tier.height * 0.1);
      ctx.quadraticCurveTo(x - hw * 0.2, tierCenterY + tier.height * 0.15, x + hw * 0.3, tierCenterY);
      ctx.closePath();
      ctx.fill();
    }

    // Needle tips at the apex
    ctx.fillStyle = lightNeedle;
    ctx.beginPath();
    ctx.moveTo(x, y - treeHeight - 8 * scale);
    ctx.lineTo(x - 6 * scale, y - treeHeight + 12 * scale);
    ctx.lineTo(x + 6 * scale, y - treeHeight + 12 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // =========================================================================
  // HELPER: LUSH BROADLEAF / DECIDUOUS TREE (Gnarled trunk + leafy clouds)
  // =========================================================================
  private static drawLushDeciduousTree(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    palette?: {
      trunk?: string;
      canopyLight?: string;
      canopyMid?: string;
      canopyDark?: string;
    }
  ) {
    ctx.save();
    const trunkColor = palette?.trunk || "#3e2723";
    const canopyLight = palette?.canopyLight || "#95d5b2";
    const canopyMid = palette?.canopyMid || "#40916c";
    const canopyDark = palette?.canopyDark || "#1b4332";

    const treeHeight = 130 * scale;

    // 1. Organic Branching Trunk
    ctx.fillStyle = trunkColor;
    ctx.beginPath();
    ctx.moveTo(x - 14 * scale, y);
    ctx.quadraticCurveTo(x - 8 * scale, y - treeHeight * 0.3, x - 10 * scale, y - treeHeight * 0.55);
    // Left branch
    ctx.lineTo(x - 35 * scale, y - treeHeight * 0.75);
    ctx.lineTo(x - 26 * scale, y - treeHeight * 0.78);
    ctx.lineTo(x - 4 * scale, y - treeHeight * 0.6);
    // Right branch
    ctx.lineTo(x + 28 * scale, y - treeHeight * 0.72);
    ctx.lineTo(x + 35 * scale, y - treeHeight * 0.68);
    ctx.lineTo(x + 6 * scale, y - treeHeight * 0.5);
    ctx.quadraticCurveTo(x + 10 * scale, y - treeHeight * 0.25, x + 16 * scale, y);
    ctx.closePath();
    ctx.fill();

    // 2. Volumetric Foliage Canopy Clumps
    const clumps = [
      { ox: -35 * scale, oy: -treeHeight * 0.8, r: 38 * scale },
      { ox: 35 * scale, oy: -treeHeight * 0.75, r: 40 * scale },
      { ox: 0, oy: -treeHeight * 0.92, r: 46 * scale },
      { ox: -18 * scale, oy: -treeHeight * 0.65, r: 35 * scale },
      { ox: 22 * scale, oy: -treeHeight * 0.62, r: 36 * scale },
      { ox: 0, oy: -treeHeight * 0.72, r: 44 * scale },
    ];

    // Pass 1: Deep shadow volume
    ctx.fillStyle = canopyDark;
    for (const c of clumps) {
      ctx.beginPath();
      ctx.arc(x + c.ox, y + c.oy + 8 * scale, c.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pass 2: Midtone foliage
    ctx.fillStyle = canopyMid;
    for (const c of clumps) {
      ctx.beginPath();
      ctx.arc(x + c.ox, y + c.oy, c.r * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pass 3: Sun-drenched highlights
    ctx.fillStyle = canopyLight;
    for (const c of clumps) {
      ctx.beginPath();
      ctx.arc(x + c.ox - c.r * 0.22, y + c.oy - c.r * 0.25, c.r * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Individual leaf texture highlights
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(x + c.ox - c.r * 0.3, y + c.oy - c.r * 0.35, 4 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x + c.ox - c.r * 0.15, y + c.oy - c.r * 0.45, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = canopyLight;
    }

    ctx.restore();
  }

  // =========================================================================
  // HELPER: MAJESTIC JAGGED MOUNTAIN RANGE WITH DETAILED ROCK FACETS & SNOW
  // =========================================================================
  private static drawMajesticMountainRange(
    ctx: CanvasRenderingContext2D,
    w: number,
    peaks: Array<{ x: number; y: number; width: number; snowDepth: number }>,
    colors: {
      lightFacet: string;
      shadowFacet: string;
      snowLight: string;
      snowShadow: string;
      baseColor: string;
    }
  ) {
    ctx.save();

    for (const peak of peaks) {
      const px = peak.x;
      const py = peak.y;
      const hw = peak.width / 2;
      const baseY = py + (peak.width * 0.65);

      // Left Ridge (Lit by Sun)
      ctx.fillStyle = colors.lightFacet;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - hw, baseY);
      ctx.lineTo(px, baseY + 20);
      ctx.closePath();
      ctx.fill();

      // Right Ridge (Shadowed)
      ctx.fillStyle = colors.shadowFacet;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, baseY + 20);
      ctx.lineTo(px + hw, baseY);
      ctx.closePath();
      ctx.fill();

      // Rocky Strata & Ridges on Slopes
      ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + hw * 0.2, py + (baseY - py) * 0.4);
      ctx.lineTo(px - hw * 0.1, py + (baseY - py) * 0.7);
      ctx.lineTo(px + hw * 0.4, baseY);
      ctx.stroke();

      // Snow Cap (Lit side)
      if (peak.snowDepth > 0) {
        const sd = peak.snowDepth;
        ctx.fillStyle = colors.snowLight;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - sd * 0.7, py + sd);
        ctx.lineTo(px - sd * 0.4, py + sd * 0.8);
        ctx.lineTo(px - sd * 0.2, py + sd * 1.1);
        ctx.lineTo(px, py + sd * 0.9);
        ctx.closePath();
        ctx.fill();

        // Snow Cap (Shadow side)
        ctx.fillStyle = colors.snowShadow;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + sd * 0.9);
        ctx.lineTo(px + sd * 0.25, py + sd * 1.05);
        ctx.lineTo(px + sd * 0.5, py + sd * 0.75);
        ctx.lineTo(px + sd * 0.8, py + sd);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // =========================================================================
  // HELPER: DETAILED AJISSA TREE (Authentic Dragon Ball Namekian Tree)
  // Perfectly spherical, multi-layered lush foliage with 3D volumetric shading
  // =========================================================================
  private static drawAuthenticAjissaTree(
    ctx: CanvasRenderingContext2D,
    tx: number,
    ty: number,
    scale: number
  ) {
    ctx.save();
    const treeH = 150 * scale;
    const sphereRadius = 52 * scale;
    const sphereY = ty - treeH + sphereRadius * 0.5;

    // 1. Organic Namekian Wood Trunk (Tapered with ring nodes)
    const trunkW = 14 * scale;
    const trunkGrad = ctx.createLinearGradient(tx - trunkW, ty, tx + trunkW, ty);
    trunkGrad.addColorStop(0, "#0c3028");
    trunkGrad.addColorStop(0.35, "#174a3e");
    trunkGrad.addColorStop(0.7, "#1e5e4f");
    trunkGrad.addColorStop(1, "#0c3028");
    ctx.fillStyle = trunkGrad;

    ctx.beginPath();
    ctx.moveTo(tx - trunkW * 0.8, ty);
    ctx.quadraticCurveTo(tx - trunkW * 0.35, ty - treeH * 0.5, tx - trunkW * 0.3, sphereY + sphereRadius * 0.7);
    ctx.lineTo(tx + trunkW * 0.3, sphereY + sphereRadius * 0.7);
    ctx.quadraticCurveTo(tx + trunkW * 0.35, ty - treeH * 0.5, tx + trunkW * 0.8, ty);
    ctx.closePath();
    ctx.fill();

    // Trunk Roots at Base
    ctx.fillStyle = "#0c3028";
    ctx.beginPath();
    ctx.moveTo(tx - trunkW * 0.8, ty);
    ctx.quadraticCurveTo(tx - trunkW * 1.5, ty + 6 * scale, tx - trunkW * 1.8, ty + 12 * scale);
    ctx.lineTo(tx - trunkW * 0.4, ty);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(tx + trunkW * 0.8, ty);
    ctx.quadraticCurveTo(tx + trunkW * 1.5, ty + 6 * scale, tx + trunkW * 1.8, ty + 12 * scale);
    ctx.lineTo(tx + trunkW * 0.4, ty);
    ctx.fill();

    // Alien Cyan Ring Nodes on Trunk
    const ringSpacing = 24 * scale;
    for (let ry = ty - 18 * scale; ry > sphereY + sphereRadius * 0.8; ry -= ringSpacing) {
      const rw = (trunkW * 0.6) - (ty - ry) * 0.03 * scale;
      // Shadow under ring
      ctx.strokeStyle = "rgba(4, 18, 14, 0.6)";
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.ellipse(tx, ry + 2 * scale, Math.max(3, rw), 2.5 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Glowing Teal Ring Node
      ctx.strokeStyle = "#52b788";
      ctx.lineWidth = 2.5 * scale;
      ctx.beginPath();
      ctx.ellipse(tx, ry, Math.max(3, rw), 2.5 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Specular highlight on ring
      ctx.strokeStyle = "#b7e4c7";
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.ellipse(tx - rw * 0.3, ry - 0.5 * scale, rw * 0.35, 1.2 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Hanging Spores / Fruit underneath canopy
    const sporeOffsets = [-0.65, -0.35, 0, 0.35, 0.65];
    for (const off of sporeOffsets) {
      const sx = tx + off * sphereRadius * 0.7;
      const sy = sphereY + sphereRadius * 0.82 + Math.abs(off) * 4 * scale;
      // Stem
      ctx.strokeStyle = "#2d6a4f";
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.moveTo(sx, sphereY + sphereRadius * 0.6);
      ctx.lineTo(sx, sy);
      ctx.stroke();

      // Spore / Pod
      const podGrad = ctx.createRadialGradient(sx - 1, sy - 1, 1, sx, sy, 5 * scale);
      podGrad.addColorStop(0, "#d8f3dc");
      podGrad.addColorStop(0.5, "#52b788");
      podGrad.addColorStop(1, "#1b4332");
      ctx.fillStyle = podGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, 4.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Volumetric Spherical Canopy Foliage
    // Pass A: Ambient Dark Green Base + Shadow
    const sphereGrad = ctx.createRadialGradient(
      tx - sphereRadius * 0.35,
      sphereY - sphereRadius * 0.35,
      sphereRadius * 0.1,
      tx,
      sphereY,
      sphereRadius
    );
    sphereGrad.addColorStop(0, "#b7e4c7");
    sphereGrad.addColorStop(0.25, "#74c69d");
    sphereGrad.addColorStop(0.55, "#40916c");
    sphereGrad.addColorStop(0.82, "#1b4332");
    sphereGrad.addColorStop(1, "#081c15");

    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(tx, sphereY, sphereRadius, 0, Math.PI * 2);
    ctx.fill();

    // Pass B: Subtle Organic Canopy Fluffs (Texture clumps around sphere edge)
    ctx.fillStyle = "rgba(45, 106, 79, 0.4)";
    const fluffAngles = [0.2, 0.7, 1.3, 1.9, 2.6, 3.4, 4.1, 4.9, 5.6];
    for (const a of fluffAngles) {
      const fx = tx + Math.cos(a) * (sphereRadius * 0.88);
      const fy = sphereY + Math.sin(a) * (sphereRadius * 0.88);
      ctx.beginPath();
      ctx.arc(fx, fy, 12 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pass C: Light Dappled Leaf Clusters
    const leafClusters = [
      { ox: -sphereRadius * 0.35, oy: -sphereRadius * 0.35, r: 18 * scale, color: "#d8f3dc" },
      { ox: -sphereRadius * 0.1, oy: -sphereRadius * 0.5, r: 14 * scale, color: "#95d5b2" },
      { ox: -sphereRadius * 0.45, oy: -sphereRadius * 0.1, r: 15 * scale, color: "#95d5b2" },
      { ox: 0, oy: -sphereRadius * 0.2, r: 16 * scale, color: "#74c69d" },
      { ox: sphereRadius * 0.25, oy: -sphereRadius * 0.3, r: 13 * scale, color: "#52b788" },
      { ox: -sphereRadius * 0.2, oy: sphereRadius * 0.2, r: 12 * scale, color: "#40916c" },
    ];

    for (const lc of leafClusters) {
      ctx.fillStyle = lc.color;
      ctx.beginPath();
      ctx.arc(tx + lc.ox, sphereY + lc.oy, lc.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pass D: High-Gloss Specular Sun Reflection & Texture Flecks
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.beginPath();
    ctx.ellipse(
      tx - sphereRadius * 0.42,
      sphereY - sphereRadius * 0.42,
      12 * scale,
      7 * scale,
      -Math.PI / 4,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Individual foliage sparkle dots (each isolated in its own beginPath)
    const sparkles = [
      { ox: -sphereRadius * 0.55, oy: -sphereRadius * 0.28, r: 2.2 * scale },
      { ox: -sphereRadius * 0.28, oy: -sphereRadius * 0.58, r: 2.0 * scale },
      { ox: -sphereRadius * 0.18, oy: -sphereRadius * 0.32, r: 2.5 * scale },
      { ox: -sphereRadius * 0.48, oy: -sphereRadius * 0.48, r: 1.8 * scale },
    ];
    ctx.fillStyle = "#ffffff";
    for (const sp of sparkles) {
      ctx.beginPath();
      ctx.arc(tx + sp.ox, sphereY + sp.oy, sp.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pass E: Soft Teal Rim Light on the Right/Bottom (from glowing Namek water)
    ctx.strokeStyle = "rgba(114, 239, 221, 0.35)";
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(tx, sphereY, sphereRadius - 1.5 * scale, Math.PI * 0.15, Math.PI * 0.75);
    ctx.stroke();

    ctx.restore();
  }

  // =========================================================================
  // HELPER: AUTHENTIC NAMEKIAN DWELLING / VILLAGE HOUSE
  // Smooth earthen dome/capsule house with curved arches, skylights and warm interior glow
  // =========================================================================
  private static drawNamekianHouse(
    ctx: CanvasRenderingContext2D,
    hx: number,
    hy: number,
    scale: number,
    options?: { withSpire?: boolean; withStairs?: boolean }
  ) {
    ctx.save();
    const houseW = 85 * scale;
    const houseH = 65 * scale;
    const domeR = houseW / 2;

    // 1. Soft Ground Shadow
    ctx.fillStyle = "rgba(8, 28, 21, 0.55)";
    ctx.beginPath();
    ctx.ellipse(hx, hy, houseW * 0.7, 12 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Main Earthen Clay Dome Structure
    const wallGrad = ctx.createLinearGradient(hx - domeR, hy - houseH, hx + domeR, hy);
    wallGrad.addColorStop(0, "#fefae0");
    wallGrad.addColorStop(0.2, "#faedcd");
    wallGrad.addColorStop(0.65, "#e9d8a6");
    wallGrad.addColorStop(1, "#bc6c25");
    ctx.fillStyle = wallGrad;

    ctx.beginPath();
    // Lower body
    ctx.moveTo(hx - domeR, hy);
    ctx.lineTo(hx - domeR, hy - houseH * 0.45);
    // Smooth curved dome roof
    ctx.bezierCurveTo(
      hx - domeR, hy - houseH * 1.05,
      hx + domeR, hy - houseH * 1.05,
      hx + domeR, hy - houseH * 0.45
    );
    ctx.lineTo(hx + domeR, hy);
    ctx.closePath();
    ctx.fill();

    // Wall Texture & Rim Shading
    ctx.strokeStyle = "#dda15e";
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    // 3. Optional Rooftop Observation Spire / Fin
    if (options?.withSpire) {
      const spireH = 28 * scale;
      const spireY = hy - houseH * 0.85;
      ctx.fillStyle = "#d4a373";
      ctx.beginPath();
      ctx.moveTo(hx - 8 * scale, spireY);
      ctx.quadraticCurveTo(hx, spireY - spireH, hx, spireY - spireH);
      ctx.quadraticCurveTo(hx, spireY - spireH, hx + 8 * scale, spireY);
      ctx.closePath();
      ctx.fill();

      // Spire Orb
      ctx.fillStyle = "#48cae4";
      ctx.beginPath();
      ctx.arc(hx, spireY - spireH, 5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Circular Stained Glass / Skylight Window
    const winX = hx;
    const winY = hy - houseH * 0.58;
    const winR = 11 * scale;

    // Window Frame
    ctx.fillStyle = "#606c38";
    ctx.beginPath();
    ctx.arc(winX, winY, winR + 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Warm Interior
    const winGrad = ctx.createRadialGradient(winX, winY, 1, winX, winY, winR);
    winGrad.addColorStop(0, "#ffffff");
    winGrad.addColorStop(0.4, "#ffd166");
    winGrad.addColorStop(0.85, "#f77f00");
    winGrad.addColorStop(1, "#d62828");
    ctx.fillStyle = winGrad;
    ctx.beginPath();
    ctx.arc(winX, winY, winR, 0, Math.PI * 2);
    ctx.fill();

    // Window Cross Bars
    ctx.strokeStyle = "#283618";
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(winX - winR, winY);
    ctx.lineTo(winX + winR, winY);
    ctx.moveTo(winX, winY - winR);
    ctx.lineTo(winX, winY + winR);
    ctx.stroke();

    // 5. Arched Entrance Doorway
    const doorW = 20 * scale;
    const doorH = 26 * scale;
    const doorX = hx - doorW / 2;
    const doorY = hy - doorH;

    // Door Frame
    ctx.fillStyle = "#283618";
    ctx.beginPath();
    ctx.roundRect(doorX - 2 * scale, doorY - 2 * scale, doorW + 4 * scale, doorH + 2 * scale, [10 * scale, 10 * scale, 0, 0]);
    ctx.fill();

    // Glowing Doorway Interior
    const doorGrad = ctx.createLinearGradient(hx, doorY, hx, hy);
    doorGrad.addColorStop(0, "#ffd166");
    doorGrad.addColorStop(0.7, "#e76f51");
    doorGrad.addColorStop(1, "#264653");
    ctx.fillStyle = doorGrad;
    ctx.beginPath();
    ctx.roundRect(doorX, doorY, doorW, doorH, [8 * scale, 8 * scale, 0, 0]);
    ctx.fill();

    // 6. Optional Stone Steps at Entrance
    if (options?.withStairs) {
      ctx.fillStyle = "#8a817c";
      ctx.fillRect(hx - doorW * 0.75, hy, doorW * 1.5, 4 * scale);
      ctx.fillStyle = "#bcb8b1";
      ctx.fillRect(hx - doorW * 0.9, hy + 4 * scale, doorW * 1.8, 4 * scale);
    }

    ctx.restore();
  }

  // =========================================================================
  // HELPER: GRAND ELDER SAICHORO'S SANCTUARY PALACE (ATOP HIGH PLATEAU)
  // =========================================================================
  private static drawGrandElderPalace(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    scale: number
  ) {
    ctx.save();
    const palaceW = 160 * scale;
    const palaceH = 110 * scale;

    // Base Tier Terrace
    const baseGrad = ctx.createLinearGradient(px - palaceW / 2, py, px + palaceW / 2, py);
    baseGrad.addColorStop(0, "#e9d8a6");
    baseGrad.addColorStop(0.5, "#fefae0");
    baseGrad.addColorStop(1, "#d4a373");
    ctx.fillStyle = baseGrad;

    ctx.beginPath();
    ctx.roundRect(px - palaceW / 2, py - 35 * scale, palaceW, 35 * scale, [8 * scale, 8 * scale, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = "#bc6c25";
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    // Columns on Terrace
    ctx.fillStyle = "#faedcd";
    for (let cx = px - palaceW * 0.42; cx <= px + palaceW * 0.42; cx += 28 * scale) {
      ctx.fillRect(cx - 3 * scale, py - 35 * scale, 6 * scale, 35 * scale);
    }

    // Main Central Grand Sanctuary Dome
    const mainDomeW = 90 * scale;
    const mainDomeH = 65 * scale;
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.moveTo(px - mainDomeW / 2, py - 35 * scale);
    ctx.lineTo(px - mainDomeW / 2, py - 35 * scale - mainDomeH * 0.4);
    ctx.bezierCurveTo(
      px - mainDomeW / 2, py - 35 * scale - mainDomeH * 1.1,
      px + mainDomeW / 2, py - 35 * scale - mainDomeH * 1.1,
      px + mainDomeW / 2, py - 35 * scale - mainDomeH * 0.4
    );
    ctx.lineTo(px + mainDomeW / 2, py - 35 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Grand Portal with Glowing Aura
    const portalW = 28 * scale;
    const portalH = 42 * scale;
    const portalY = py - 35 * scale - portalH;
    const portalGrad = ctx.createRadialGradient(px, portalY + portalH * 0.5, 2, px, portalY + portalH * 0.5, portalW);
    portalGrad.addColorStop(0, "#ffffff");
    portalGrad.addColorStop(0.3, "#48cae4");
    portalGrad.addColorStop(0.75, "#0077b6");
    portalGrad.addColorStop(1, "#03045e");
    ctx.fillStyle = portalGrad;
    ctx.beginPath();
    ctx.roundRect(px - portalW / 2, portalY, portalW, portalH, [14 * scale, 14 * scale, 0, 0]);
    ctx.fill();

    // Palace Apex Spire with Glowing Orb
    const spireTopY = py - 35 * scale - mainDomeH * 0.95;
    ctx.fillStyle = "#dda15e";
    ctx.beginPath();
    ctx.moveTo(px - 10 * scale, spireTopY);
    ctx.lineTo(px, spireTopY - 30 * scale);
    ctx.lineTo(px + 10 * scale, spireTopY);
    ctx.closePath();
    ctx.fill();

    // Glowing Dragon Clan Orb on Sanctuary Top
    const orbGrad = ctx.createRadialGradient(px - 2, spireTopY - 30 * scale - 2, 1, px, spireTopY - 30 * scale, 9 * scale);
    orbGrad.addColorStop(0, "#ffffff");
    orbGrad.addColorStop(0.35, "#ffd166");
    orbGrad.addColorStop(0.8, "#ff9e00");
    orbGrad.addColorStop(1, "#e85d04");
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(px, spireTopY - 30 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // =========================================================================
  // 1. PLANETA TERRA (Lush Mountains, Blue Sky, Sunbeams, River & Plateau)
  // =========================================================================
  private static drawEarthArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // 1. Brilliant High-Altitude Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.72);
    skyGrad.addColorStop(0, "#08203e");
    skyGrad.addColorStop(0.2, "#134074");
    skyGrad.addColorStop(0.5, "#2a6f97");
    skyGrad.addColorStop(0.75, "#61a5c2");
    skyGrad.addColorStop(0.9, "#a9d6e5");
    skyGrad.addColorStop(1, "#e2f1f8");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Radiant Sun & Atmospheric Volumetric God Rays
    const sunX = w * 0.78;
    const sunY = h * 0.18;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 320);
    sunGlow.addColorStop(0, "rgba(255, 255, 250, 1)");
    sunGlow.addColorStop(0.12, "rgba(255, 245, 180, 0.9)");
    sunGlow.addColorStop(0.35, "rgba(255, 218, 121, 0.4)");
    sunGlow.addColorStop(0.7, "rgba(255, 255, 255, 0.12)");
    sunGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 320, 0, Math.PI * 2);
    ctx.fill();

    // God Rays
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.fillStyle = "#ffffff";
    for (let angle = 0.3; angle < Math.PI * 0.95; angle += 0.11) {
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(sunX + Math.cos(angle) * w * 1.2, sunY + Math.sin(angle) * h * 1.2);
      ctx.lineTo(sunX + Math.cos(angle + 0.05) * w * 1.2, sunY + Math.sin(angle + 0.05) * h * 1.2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 3. Fluffy Cumulus Anime Clouds
    const drawCloud = (cx: number, cy: number, scale: number, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      const cGrad = ctx.createLinearGradient(cx, cy - 40 * scale, cx, cy + 40 * scale);
      cGrad.addColorStop(0, "#ffffff");
      cGrad.addColorStop(1, "#c8d9e6");
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 45 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 40 * scale, cy - 22 * scale, 38 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 85 * scale, cy - 12 * scale, 42 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 130 * scale, cy + 8 * scale, 34 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 65 * scale, cy + 18 * scale, 38 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawCloud(w * 0.12, h * 0.14, 1.4, 0.75);
    drawCloud(w * 0.44, h * 0.10, 1.8, 0.85);
    drawCloud(w * 0.88, h * 0.25, 1.2, 0.65);
    drawCloud(w * 0.03, h * 0.28, 1.1, 0.55);

    // 4. TIER 1: MAJESTIC SNOWCAPPED ALPINE MOUNTAIN RANGE (Far Background)
    const farPeaks = [
      { x: w * 0.08, y: h * 0.32, width: 380, snowDepth: 95 },
      { x: w * 0.25, y: h * 0.26, width: 440, snowDepth: 120 },
      { x: w * 0.45, y: h * 0.30, width: 420, snowDepth: 110 },
      { x: w * 0.62, y: h * 0.22, width: 500, snowDepth: 145 },
      { x: w * 0.82, y: h * 0.28, width: 460, snowDepth: 125 },
      { x: w * 0.98, y: h * 0.34, width: 390, snowDepth: 100 },
    ];
    ArenaTextureBuilder.drawMajesticMountainRange(ctx, w, farPeaks, {
      lightFacet: "#6c8da3",
      shadowFacet: "#344e5f",
      snowLight: "#ffffff",
      snowShadow: "#d7e3ec",
      baseColor: "#22333b",
    });

    // Atmospheric Blue Mist Veil between Mountain Layers
    const mistGrad1 = ctx.createLinearGradient(0, h * 0.42, 0, h * 0.58);
    mistGrad1.addColorStop(0, "rgba(226, 241, 248, 0)");
    mistGrad1.addColorStop(0.6, "rgba(180, 215, 235, 0.65)");
    mistGrad1.addColorStop(1, "rgba(150, 195, 220, 0.85)");
    ctx.fillStyle = mistGrad1;
    ctx.fillRect(0, h * 0.42, w, h * 0.16);

    // 5. TIER 2: MID-RANGE ROCKY HIGHLANDS & CLIFF RIDGES
    const midPeaks = [
      { x: w * 0.16, y: h * 0.42, width: 420, snowDepth: 0 },
      { x: w * 0.36, y: h * 0.38, width: 460, snowDepth: 0 },
      { x: w * 0.55, y: h * 0.44, width: 400, snowDepth: 0 },
      { x: w * 0.74, y: h * 0.39, width: 480, snowDepth: 0 },
      { x: w * 0.92, y: h * 0.45, width: 380, snowDepth: 0 },
    ];
    ArenaTextureBuilder.drawMajesticMountainRange(ctx, w, midPeaks, {
      lightFacet: "#415a77",
      shadowFacet: "#1b263b",
      snowLight: "#8da9c4",
      snowShadow: "#415a77",
      baseColor: "#0d1b2a",
    });

    // 6. TIER 3: ROLLING FORESTED FOOTHILLS
    ctx.save();
    // Ridge Layer A (Back Forest Ridge)
    ctx.fillStyle = "#1e4d38";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.58);
    for (let x = 0; x <= w; x += 40) {
      const y = h * 0.54 + Math.sin(x * 0.004) * 35 + Math.cos(x * 0.009) * 20;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Rich Dense Pine Treeline on Ridge Layer A
    for (let tx = 15; tx < w; tx += 22) {
      const ty = h * 0.54 + Math.sin(tx * 0.004) * 35 + Math.cos(tx * 0.009) * 20;
      const tScale = 0.42 + Math.sin(tx * 0.05) * 0.12;
      ArenaTextureBuilder.drawDetailedPineTree(ctx, tx, ty + 5, tScale, {
        trunk: "#1a0f0a",
        lightNeedle: "#2d6a4f",
        midNeedle: "#1b4332",
        darkNeedle: "#081c15",
      });
    }

    // Ridge Layer B (Front Emerald Grassy Foothill Ridge)
    const hillGrad = ctx.createLinearGradient(0, h * 0.58, 0, h * 0.72);
    hillGrad.addColorStop(0, "#40916c");
    hillGrad.addColorStop(0.3, "#2d6a4f");
    hillGrad.addColorStop(1, "#1b4332");
    ctx.fillStyle = hillGrad;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.64);
    for (let x = 0; x <= w; x += 30) {
      const y = h * 0.62 + Math.sin(x * 0.0035 + 1.2) * 30 + Math.sin(x * 0.008) * 15;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Grove of Broadleaf & Pine Trees on Ridge Layer B
    for (let tx = 25; tx < w; tx += 48) {
      const ty = h * 0.62 + Math.sin(tx * 0.0035 + 1.2) * 30 + Math.sin(tx * 0.008) * 15;
      const tScale = 0.65 + Math.sin(tx * 0.03) * 0.15;
      if (tx % 3 === 0) {
        ArenaTextureBuilder.drawLushDeciduousTree(ctx, tx, ty + 8, tScale * 0.85);
      } else {
        ArenaTextureBuilder.drawDetailedPineTree(ctx, tx, ty + 8, tScale);
      }
    }
    ctx.restore();

    // 7. MAIN COMBAT PLATEAU (Lush Emerald Field & Rocky Strata)
    const groundGrad = ctx.createLinearGradient(0, h * 0.72, 0, h);
    groundGrad.addColorStop(0, "#74c69d");
    groundGrad.addColorStop(0.04, "#52b788");
    groundGrad.addColorStop(0.18, "#2d6a4f");
    groundGrad.addColorStop(0.5, "#1b4332");
    groundGrad.addColorStop(1, "#081c15");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);

    // Glowing Grass Rim Highlight
    ctx.fillStyle = "#b7e4c7";
    ctx.fillRect(0, h * 0.72, w, 6);

    // Realistic Individual Grass Blades along the combat line
    ctx.fillStyle = "#95d5b2";
    for (let gx = 0; gx < w; gx += 8) {
      const gh = 10 + Math.sin(gx * 0.1) * 6;
      ctx.beginPath();
      ctx.moveTo(gx, h * 0.72);
      ctx.quadraticCurveTo(gx + 3, h * 0.72 - gh, gx + 6, h * 0.72);
      ctx.fill();
    }

    // 8. HERO FOREGROUND TREES (Grand framing trees on the left & right)
    ArenaTextureBuilder.drawDetailedPineTree(ctx, w * 0.06, h * 0.74, 1.45);
    ArenaTextureBuilder.drawDetailedPineTree(ctx, w * 0.11, h * 0.76, 1.15);
    ArenaTextureBuilder.drawLushDeciduousTree(ctx, w * 0.92, h * 0.75, 1.4);
    ArenaTextureBuilder.drawDetailedPineTree(ctx, w * 0.86, h * 0.76, 1.2);

    // Wildflowers & Forest Flora in Foreground
    const flowerColors = ["#ffd166", "#ef476f", "#06d6a0", "#118ab2", "#ffffff"];
    for (let fx = 15; fx < w; fx += 35) {
      const fy = h * 0.74 + Math.sin(fx * 0.08) * 12;
      ctx.fillStyle = flowerColors[fx % flowerColors.length];
      ctx.beginPath();
      ctx.arc(fx, fy, 4, 0, Math.PI * 2);
      ctx.fill();
      // Stem
      ctx.strokeStyle = "#52b788";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx, fy + 8);
      ctx.stroke();
    }
  }

  // =========================================================================
  // 2. NAMEKUSEI (Grand Guru Palace, Conical Spires, Authentic Village Dwellings, Ajissa Trees)
  // =========================================================================
  private static drawNamekArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // 1. Alien Emerald / Cyan Namekian Atmosphere
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    skyGrad.addColorStop(0, "#011f26");
    skyGrad.addColorStop(0.25, "#064e5b");
    skyGrad.addColorStop(0.55, "#0b7a75");
    skyGrad.addColorStop(0.8, "#17b890");
    skyGrad.addColorStop(1, "#9bf6ff");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Giant Ringed Gas Planet in Sky
    const px = w * 0.80;
    const py = h * 0.22;
    const pRadius = 115;

    // Atmospheric Glow
    const pGlow = ctx.createRadialGradient(px, py, pRadius * 0.4, px, py, pRadius * 1.9);
    pGlow.addColorStop(0, "rgba(114, 239, 221, 0.45)");
    pGlow.addColorStop(1, "rgba(114, 239, 221, 0)");
    ctx.fillStyle = pGlow;
    ctx.beginPath();
    ctx.arc(px, py, pRadius * 1.9, 0, Math.PI * 2);
    ctx.fill();

    // Planet Body
    const planetGrad = ctx.createLinearGradient(px - pRadius, py - pRadius, px + pRadius, py + pRadius);
    planetGrad.addColorStop(0, "#48cae4");
    planetGrad.addColorStop(0.35, "#52b788");
    planetGrad.addColorStop(0.7, "#2d6a4f");
    planetGrad.addColorStop(1, "#081c15");
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(px, py, pRadius, 0, Math.PI * 2);
    ctx.fill();

    // Planet Atmospheric Storm Bands
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, pRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "rgba(45, 106, 79, 0.5)";
    ctx.fillRect(px - pRadius, py - 35, pRadius * 2, 22);
    ctx.fillRect(px - pRadius, py + 12, pRadius * 2, 28);
    ctx.fillStyle = "rgba(183, 228, 199, 0.3)";
    ctx.fillRect(px - pRadius, py - 8, pRadius * 2, 14);
    ctx.restore();

    // Grand Planetary Rings (Diagonal Tilt)
    ctx.save();
    ctx.strokeStyle = "rgba(183, 228, 199, 0.85)";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.ellipse(px, py, pRadius * 2.2, pRadius * 0.48, -0.22, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(px, py, pRadius * 2.35, pRadius * 0.52, -0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Secondary Glowing Turquoise Moon
    const m2X = w * 0.18;
    const m2Y = h * 0.15;
    const moonGrad = ctx.createRadialGradient(m2X - 10, m2Y - 10, 5, m2X, m2Y, 48);
    moonGrad.addColorStop(0, "#ffffff");
    moonGrad.addColorStop(0.4, "#9bf6ff");
    moonGrad.addColorStop(0.85, "#0077b6");
    moonGrad.addColorStop(1, "#03045e");
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(m2X, m2Y, 48, 0, Math.PI * 2);
    ctx.fill();

    // 3. Iconic Conical Namekian Rock Mesas & Spire Pillars (Natural geological formations)
    const drawNamekMesa = (
      mx: number,
      baseY: number,
      topY: number,
      topW: number,
      baseW: number,
      palette: { lit: string; shadow: string; rim: string }
    ) => {
      ctx.save();
      // Left Lit Face
      const leftGrad = ctx.createLinearGradient(mx - baseW / 2, topY, mx, baseY);
      leftGrad.addColorStop(0, palette.lit);
      leftGrad.addColorStop(1, palette.shadow);
      ctx.fillStyle = leftGrad;

      ctx.beginPath();
      ctx.moveTo(mx, topY);
      ctx.lineTo(mx - topW / 2, topY + 15);
      ctx.lineTo(mx - baseW / 2, baseY);
      ctx.lineTo(mx, baseY);
      ctx.closePath();
      ctx.fill();

      // Right Shadowed Face
      const rightGrad = ctx.createLinearGradient(mx, topY, mx + baseW / 2, baseY);
      rightGrad.addColorStop(0, palette.shadow);
      rightGrad.addColorStop(1, "#051614");
      ctx.fillStyle = rightGrad;

      ctx.beginPath();
      ctx.moveTo(mx, topY);
      ctx.lineTo(mx, baseY);
      ctx.lineTo(mx + baseW / 2, baseY);
      ctx.lineTo(mx + topW / 2, topY + 15);
      ctx.closePath();
      ctx.fill();

      // Rounded Natural Flat Plateau Cap
      const capGrad = ctx.createLinearGradient(mx - topW / 2, topY, mx + topW / 2, topY);
      capGrad.addColorStop(0, "#74c69d");
      capGrad.addColorStop(0.5, "#52b788");
      capGrad.addColorStop(1, "#2d6a4f");
      ctx.fillStyle = capGrad;
      ctx.beginPath();
      ctx.ellipse(mx, topY + 8, topW / 2, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rock Horizontal Sedimentary Strata
      ctx.strokeStyle = "rgba(11, 40, 34, 0.4)";
      ctx.lineWidth = 3;
      for (let sy = topY + 35; sy < baseY - 20; sy += 38) {
        const span = (sy - topY) / (baseY - topY);
        const wAtY = topW + (baseW - topW) * span;
        ctx.beginPath();
        ctx.moveTo(mx - wAtY * 0.45, sy);
        ctx.lineTo(mx + wAtY * 0.45, sy + 6);
        ctx.stroke();
      }
      ctx.restore();
    };

    // Far Background Namek Spire Pillars
    drawNamekMesa(w * 0.10, h * 0.65, h * 0.38, 140, 220, { lit: "#17564d", shadow: "#092924", rim: "#52b788" });
    drawNamekMesa(w * 0.34, h * 0.65, h * 0.28, 200, 300, { lit: "#1d6a5f", shadow: "#0b342e", rim: "#74c69d" });
    drawNamekMesa(w * 0.62, h * 0.65, h * 0.35, 170, 260, { lit: "#17564d", shadow: "#092924", rim: "#52b788" });
    drawNamekMesa(w * 0.90, h * 0.65, h * 0.32, 180, 280, { lit: "#1d6a5f", shadow: "#0b342e", rim: "#74c69d" });

    // 4. Grand Elder Saichoro's Sanctuary Temple atop the Central Mesa (w * 0.34)
    ArenaTextureBuilder.drawGrandElderPalace(ctx, w * 0.34, h * 0.28 + 8, 0.9);

    // Distant Ajissa trees atop the distant plateaus
    ArenaTextureBuilder.drawAuthenticAjissaTree(ctx, w * 0.08, h * 0.38 + 8, 0.45);
    ArenaTextureBuilder.drawAuthenticAjissaTree(ctx, w * 0.64, h * 0.35 + 8, 0.48);
    ArenaTextureBuilder.drawAuthenticAjissaTree(ctx, w * 0.92, h * 0.32 + 8, 0.5);

    // 5. Emerald Turquoise Water Horizon (Namekian Oceans & Lakes)
    const waterGrad = ctx.createLinearGradient(0, h * 0.62, 0, h * 0.74);
    waterGrad.addColorStop(0, "#52b788");
    waterGrad.addColorStop(0.3, "#1b7a70");
    waterGrad.addColorStop(0.7, "#0b525b");
    waterGrad.addColorStop(1, "#022b3a");
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, h * 0.62, w, h * 0.12);

    // Glowing Aqua Wave Shimmer on Horizon
    ctx.strokeStyle = "rgba(183, 228, 199, 0.6)";
    ctx.lineWidth = 2;
    for (let wy = h * 0.64; wy < h * 0.73; wy += 14) {
      ctx.beginPath();
      ctx.moveTo(0, wy);
      for (let wx = 0; wx < w; wx += 60) {
        ctx.lineTo(wx + 30, wy + (Math.sin(wx * 0.02 + wy) * 3));
      }
      ctx.stroke();
    }

    // 6. Midground Rolling Green Foothills & Traditional Namekian Village Dwellings
    const hillGrad = ctx.createLinearGradient(0, h * 0.66, 0, h * 0.75);
    hillGrad.addColorStop(0, "#74c69d");
    hillGrad.addColorStop(0.4, "#40916c");
    hillGrad.addColorStop(1, "#1b4332");
    ctx.fillStyle = hillGrad;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.70);
    for (let x = 0; x <= w; x += 40) {
      const y = h * 0.68 + Math.sin(x * 0.004) * 22 + Math.cos(x * 0.01) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Traditional Namekian Village Dwellings nestled on the midground hills
    ArenaTextureBuilder.drawNamekianHouse(ctx, w * 0.22, h * 0.70, 0.72, { withSpire: true, withStairs: true });
    ArenaTextureBuilder.drawNamekianHouse(ctx, w * 0.74, h * 0.69, 0.85, { withSpire: false, withStairs: true });
    ArenaTextureBuilder.drawNamekianHouse(ctx, w * 0.82, h * 0.71, 0.65, { withSpire: true, withStairs: false });

    // Midground Ajissa Tree Grove
    ArenaTextureBuilder.drawAuthenticAjissaTree(ctx, w * 0.16, h * 0.71, 0.75);
    ArenaTextureBuilder.drawAuthenticAjissaTree(ctx, w * 0.28, h * 0.71, 0.68);
    ArenaTextureBuilder.drawAuthenticAjissaTree(ctx, w * 0.68, h * 0.70, 0.78);
    ArenaTextureBuilder.drawAuthenticAjissaTree(ctx, w * 0.88, h * 0.71, 0.72);

    // 7. Foreground Combat Ground: Vibrant Lime / Emerald Namekian Plains
    const namekGround = ctx.createLinearGradient(0, h * 0.73, 0, h);
    namekGround.addColorStop(0, "#9ef01a");
    namekGround.addColorStop(0.04, "#70e000");
    namekGround.addColorStop(0.18, "#38b000");
    namekGround.addColorStop(0.5, "#007200");
    namekGround.addColorStop(1, "#004b23");
    ctx.fillStyle = namekGround;
    ctx.fillRect(0, h * 0.73, w, h * 0.27);

    // Glowing Lime Moss Rim Highlight
    ctx.fillStyle = "#ccff33";
    ctx.fillRect(0, h * 0.73, w, 6);

    // Individual Namekian Alien Grass Blades
    ctx.fillStyle = "#b7e4c7";
    for (let gx = 0; gx < w; gx += 8) {
      const gh = 12 + Math.sin(gx * 0.12) * 6;
      ctx.beginPath();
      ctx.moveTo(gx, h * 0.73);
      ctx.quadraticCurveTo(gx + 3, h * 0.73 - gh, gx + 6, h * 0.73);
      ctx.fill();
    }

    // 8. Hero Foreground Framing Elements
    // Left: Majestic Authentic Namekian Ajissa Trees & Village Dwelling
    ArenaTextureBuilder.drawNamekianHouse(ctx, w * 0.05, h * 0.77, 1.15, { withSpire: true, withStairs: true });
    ArenaTextureBuilder.drawAuthenticAjissaTree(ctx, w * 0.12, h * 0.76, 1.25);
    ArenaTextureBuilder.drawAuthenticAjissaTree(ctx, w * 0.03, h * 0.78, 1.45);

    // Right: Grand Majestic Ajissa Trees
    ArenaTextureBuilder.drawAuthenticAjissaTree(ctx, w * 0.94, h * 0.76, 1.4);
    ArenaTextureBuilder.drawAuthenticAjissaTree(ctx, w * 0.86, h * 0.77, 1.15);

    // Bioluminescent Spore Flora on Combat Field
    const sporeColors = ["#9bf6ff", "#ffd166", "#70e000", "#ffffff"];
    for (let sx = 20; sx < w; sx += 32) {
      const sy = h * 0.75 + Math.sin(sx * 0.06) * 14;
      ctx.fillStyle = sporeColors[sx % sporeColors.length];
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Stem
      ctx.strokeStyle = "#52b788";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, sy + 7);
      ctx.stroke();
    }
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

    // Midground Ruined High-Rises with Architectural Details & Fires (Layer 2)
    const buildings = [
      { x: w * 0.04, w: 160, h: 480, antenna: true },
      { x: w * 0.16, w: 200, h: 560, antenna: false },
      { x: w * 0.32, w: 140, h: 420, antenna: true },
      { x: w * 0.44, w: 220, h: 600, antenna: true },
      { x: w * 0.60, w: 170, h: 460, antenna: false },
      { x: w * 0.72, w: 210, h: 540, antenna: true },
      { x: w * 0.88, w: 150, h: 500, antenna: false },
    ];

    for (const b of buildings) {
      const topY = h * 0.74 - b.h;
      // Building Main Body Gradient
      const bGrad = ctx.createLinearGradient(b.x, topY, b.x + b.w, topY);
      bGrad.addColorStop(0, "#2b2d42");
      bGrad.addColorStop(0.5, "#1f2029");
      bGrad.addColorStop(1, "#121318");
      ctx.fillStyle = bGrad;
      ctx.fillRect(b.x, topY, b.w, b.h + 100);

      // Crumpled / Blasted Top Angle
      ctx.fillStyle = "#780000";
      ctx.beginPath();
      ctx.arc(b.x + b.w * 0.8, topY + 40, 45, 0, Math.PI * 2);
      ctx.fill();

      // Rooftop Communications Antenna / Helipad Tower
      if (b.antenna) {
        ctx.strokeStyle = "#ff4800";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(b.x + b.w * 0.4, topY);
        ctx.lineTo(b.x + b.w * 0.4, topY - 60);
        ctx.stroke();

        ctx.fillStyle = "#ff0054";
        ctx.beginPath();
        ctx.arc(b.x + b.w * 0.4, topY - 60, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Lit/Burning Orange & Cyberpunk Neon Windows
      for (let wy = topY + 60; wy < h * 0.72; wy += 38) {
        for (let wx = b.x + 18; wx < b.x + b.w - 20; wx += 30) {
          const rand = Math.sin(wx * 11 + wy * 17);
          if (rand > 0.3) {
            ctx.fillStyle = rand > 0.7 ? "#ffb703" : "#fb8500";
            ctx.fillRect(wx, wy, 16, 22);

            // Window frame
            ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
            ctx.lineWidth = 1;
            ctx.strokeRect(wx, wy, 16, 22);
          } else if (rand < -0.6) {
            // Broken window with internal red embers
            ctx.fillStyle = "#9e2a2b";
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
  // 4. TORNEIO DE ARTES MARCIAIS (Tenkaichi Budōkai - Authentic Dragon Ball Anime Arena)
  // =========================================================================
  private static drawTournamentArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();

    // 1. Vibrant Dragon Ball Anime Sky Gradient (Bright Tropical Azure)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.72);
    skyGrad.addColorStop(0, "#0177c8");
    skyGrad.addColorStop(0.25, "#1aa8ec");
    skyGrad.addColorStop(0.55, "#70cef8");
    skyGrad.addColorStop(0.85, "#bfe9fc");
    skyGrad.addColorStop(1, "#e6f7ff");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 1.1 Tropical Sun Glare in Top Corner
    const sunGlow = ctx.createRadialGradient(w * 0.85, h * 0.12, 10, w * 0.85, h * 0.12, 220);
    sunGlow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    sunGlow.addColorStop(0.2, "rgba(255, 245, 180, 0.6)");
    sunGlow.addColorStop(0.5, "rgba(255, 230, 150, 0.2)");
    sunGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(w * 0.85, h * 0.12, 220, 0, Math.PI * 2);
    ctx.fill();

    // 2. Soft Dragon Ball Puffy Cumulus Clouds (Toriyama Anime Style)
    const drawFluffyAnimeCloud = (cx: number, cy: number, scale: number) => {
      ctx.save();
      // Cloud shadow underneath
      ctx.fillStyle = "rgba(180, 210, 230, 0.55)";
      ctx.beginPath();
      ctx.arc(cx, cy + 6 * scale, 42 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 38 * scale, cy - 12 * scale, 36 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 78 * scale, cy - 4 * scale, 40 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 118 * scale, cy + 11 * scale, 32 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 60 * scale, cy + 22 * scale, 38 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Cloud White Body
      const cGrad = ctx.createLinearGradient(cx, cy - 40 * scale, cx, cy + 35 * scale);
      cGrad.addColorStop(0, "#ffffff");
      cGrad.addColorStop(0.7, "#f5fbff");
      cGrad.addColorStop(1, "#ddecfa");
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 40 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 38 * scale, cy - 18 * scale, 34 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 78 * scale, cy - 10 * scale, 38 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 118 * scale, cy + 5 * scale, 30 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 60 * scale, cy + 15 * scale, 36 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawFluffyAnimeCloud(w * 0.08, h * 0.14, 1.5);
    drawFluffyAnimeCloud(w * 0.44, h * 0.10, 1.8);
    drawFluffyAnimeCloud(w * 0.80, h * 0.16, 1.4);

    // 3. ICONIC FESTIVE RAINBOW ARCHES (Soaring behind the temple)
    const drawRainbowArch = (isLeft: boolean) => {
      ctx.save();
      const baseCenterX = isLeft ? w * 0.20 : w * 0.80;
      const baseCenterY = h * 0.68;
      const archRadius = 290;
      const bands = [
        { color: "#e63946", width: 14 }, // Red
        { color: "#f77f00", width: 14 }, // Orange
        { color: "#fcbf49", width: 14 }, // Yellow
        { color: "#06d6a0", width: 14 }, // Emerald Mint
        { color: "#118ab2", width: 14 }, // Cyan Blue
        { color: "#8338ec", width: 12 }, // Purple
        { color: "#ff70a6", width: 12 }, // Pink
        { color: "#ffffff", width: 8 },  // White Highlight
      ];

      let currentR = archRadius;
      for (const band of bands) {
        ctx.strokeStyle = band.color;
        ctx.lineWidth = band.width;
        ctx.beginPath();
        if (isLeft) {
          ctx.ellipse(baseCenterX, baseCenterY, currentR, currentR * 1.5, -0.22, Math.PI * 1.05, Math.PI * 1.74);
        } else {
          ctx.ellipse(baseCenterX, baseCenterY, currentR, currentR * 1.5, 0.22, Math.PI * 1.26, Math.PI * 1.95);
        }
        ctx.stroke();
        currentR -= band.width;
      }
      ctx.restore();
    };

    drawRainbowArch(true);
    drawRainbowArch(false);

    // 3.1 Festive Bunting / Pennant Flags Strings in Background
    const drawFlagString = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.save();
      ctx.strokeStyle = "rgba(80, 80, 80, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + 20, x2, y2);
      ctx.stroke();

      const flagColors = ["#e63946", "#ffd166", "#06d6a0", "#118ab2", "#f72585", "#ffffff"];
      const count = 10;
      for (let i = 1; i < count; i++) {
        const t = i / count;
        const fx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * ((x1 + x2) / 2) + t * t * x2;
        const fy = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * (Math.max(y1, y2) + 20) + t * t * y2;
        ctx.fillStyle = flagColors[i % flagColors.length];
        ctx.beginPath();
        ctx.moveTo(fx - 6, fy);
        ctx.lineTo(fx + 6, fy);
        ctx.lineTo(fx, fy + 14);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    };

    drawFlagString(w * 0.04, h * 0.40, w * 0.24, h * 0.44);
    drawFlagString(w * 0.76, h * 0.44, w * 0.96, h * 0.40);

    // 4. Lush Round Trees behind the Dojo Walls
    const drawBackTreeClump = (tx: number, ty: number, r: number) => {
      ctx.save();
      // Trunk
      ctx.fillStyle = "#5c3d2e";
      ctx.fillRect(tx - 8, ty + r * 0.4, 16, 50);

      // Foliage Clump
      const treeGrad = ctx.createRadialGradient(tx - r * 0.3, ty - r * 0.3, r * 0.15, tx, ty, r);
      treeGrad.addColorStop(0, "#a7e9af");
      treeGrad.addColorStop(0.35, "#52b788");
      treeGrad.addColorStop(0.7, "#2d6a4f");
      treeGrad.addColorStop(1, "#183a2b");
      ctx.fillStyle = treeGrad;
      ctx.beginPath();
      ctx.arc(tx, ty, r, 0, Math.PI * 2);
      ctx.arc(tx - r * 0.55, ty + r * 0.15, r * 0.65, 0, Math.PI * 2);
      ctx.arc(tx + r * 0.55, ty + r * 0.15, r * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Leaf highlights
      ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
      ctx.beginPath();
      ctx.arc(tx - r * 0.25, ty - r * 0.35, r * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawBackTreeClump(w * 0.08, h * 0.48, 80);
    drawBackTreeClump(w * 0.17, h * 0.50, 65);
    drawBackTreeClump(w * 0.25, h * 0.52, 55);
    drawBackTreeClump(w * 0.75, h * 0.52, 55);
    drawBackTreeClump(w * 0.83, h * 0.50, 65);
    drawBackTreeClump(w * 0.92, h * 0.48, 80);

    // 5. MAIN DOJO TEMPLE BUILDING (Tenkaichi Budōkai Hall)
    const templeCenterX = w * 0.5;
    const templeBaseY = h * 0.70;
    const templeWidth = 1140;

    // A. Main White Stucco Back Walls
    const wallLeft = templeCenterX - templeWidth / 2 + 50;
    const wallRight = templeCenterX + templeWidth / 2 - 50;
    const wallTop = h * 0.42;
    const wallHeight = templeBaseY - wallTop;

    ctx.fillStyle = "#faf0ca";
    ctx.fillRect(wallLeft, wallTop, wallRight - wallLeft, wallHeight);

    // Wall Timber Posts & Trim
    ctx.fillStyle = "#582f0e";
    ctx.fillRect(wallLeft, wallTop, 16, wallHeight);
    ctx.fillRect(wallRight - 16, wallTop, 16, wallHeight);
    ctx.fillRect(templeCenterX - 250, wallTop, 14, wallHeight);
    ctx.fillRect(templeCenterX + 236, wallTop, 14, wallHeight);

    // Horizontal Transom Windows (Blue anime glass with shine)
    const drawWindow = (wx: number, wy: number, ww: number, wh: number) => {
      ctx.fillStyle = "#333333";
      ctx.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
      const wGrad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
      wGrad.addColorStop(0, "#64b5f6");
      wGrad.addColorStop(0.5, "#1e88e5");
      wGrad.addColorStop(1, "#0d47a1");
      ctx.fillStyle = wGrad;
      ctx.fillRect(wx, wy, ww, wh);
      // Diagonal Glass Reflection Highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.beginPath();
      ctx.moveTo(wx + ww * 0.2, wy);
      ctx.lineTo(wx + ww * 0.4, wy);
      ctx.lineTo(wx + ww * 0.25, wy + wh);
      ctx.lineTo(wx + ww * 0.05, wy + wh);
      ctx.closePath();
      ctx.fill();
    };

    drawWindow(templeCenterX - 390, h * 0.46, 90, 30);
    drawWindow(templeCenterX + 300, h * 0.46, 90, 30);

    // B. UPPER TOWER PAVILION & UPPER THATCH ROOF (Second Tier)
    const upperTowerW = 360;
    const upperTowerH = 80;
    const upperTowerY = h * 0.22;

    // Upper Tower White Wall
    ctx.fillStyle = "#fdfbf7";
    ctx.fillRect(templeCenterX - upperTowerW / 2 + 30, upperTowerY + 25, upperTowerW - 60, upperTowerH);
    ctx.strokeStyle = "#582f0e";
    ctx.lineWidth = 4;
    ctx.strokeRect(templeCenterX - upperTowerW / 2 + 30, upperTowerY + 25, upperTowerW - 60, upperTowerH);

    // Upper Thatched Roof Cap
    const upperRoofGrad = ctx.createLinearGradient(0, upperTowerY - 40, 0, upperTowerY + 30);
    upperRoofGrad.addColorStop(0, "#ddb892");
    upperRoofGrad.addColorStop(0.3, "#b08968");
    upperRoofGrad.addColorStop(0.7, "#7f5539");
    upperRoofGrad.addColorStop(1, "#582f0e");
    ctx.fillStyle = upperRoofGrad;

    ctx.beginPath();
    ctx.moveTo(templeCenterX, upperTowerY - 35);
    ctx.quadraticCurveTo(templeCenterX - upperTowerW * 0.35, upperTowerY - 10, templeCenterX - upperTowerW * 0.58, upperTowerY + 28);
    ctx.lineTo(templeCenterX + upperTowerW * 0.58, upperTowerY + 28);
    ctx.quadraticCurveTo(templeCenterX + upperTowerW * 0.35, upperTowerY - 10, templeCenterX, upperTowerY - 35);
    ctx.closePath();
    ctx.fill();

    // C. ICONIC WHITE BULL / DEMON HORNS ON UPPER ROOF (Center Front)
    const drawUpperHorns = () => {
      ctx.save();
      const hornBaseY = upperTowerY + 58;

      // Drop Shadow for Horns
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.arc(templeCenterX, hornBaseY + 4, 22, 0, Math.PI * 2);
      ctx.fill();

      // Left Horn
      const hornGradLeft = ctx.createLinearGradient(templeCenterX - 95, hornBaseY - 55, templeCenterX, hornBaseY);
      hornGradLeft.addColorStop(0, "#ffffff");
      hornGradLeft.addColorStop(0.6, "#f8f9fa");
      hornGradLeft.addColorStop(1, "#ced4da");
      ctx.fillStyle = hornGradLeft;
      ctx.strokeStyle = "#2b2d42";
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.moveTo(templeCenterX - 5, hornBaseY + 6);
      ctx.quadraticCurveTo(templeCenterX - 55, hornBaseY + 14, templeCenterX - 105, hornBaseY - 46);
      ctx.quadraticCurveTo(templeCenterX - 60, hornBaseY - 18, templeCenterX - 5, hornBaseY - 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Horn
      const hornGradRight = ctx.createLinearGradient(templeCenterX + 95, hornBaseY - 55, templeCenterX, hornBaseY);
      hornGradRight.addColorStop(0, "#ffffff");
      hornGradRight.addColorStop(0.6, "#f8f9fa");
      hornGradRight.addColorStop(1, "#ced4da");
      ctx.fillStyle = hornGradRight;

      ctx.beginPath();
      ctx.moveTo(templeCenterX + 5, hornBaseY + 6);
      ctx.quadraticCurveTo(templeCenterX + 55, hornBaseY + 14, templeCenterX + 105, hornBaseY - 46);
      ctx.quadraticCurveTo(templeCenterX + 60, hornBaseY - 18, templeCenterX + 5, hornBaseY - 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Horn Center Mounting Ring (Gold Medallion)
      const medGrad = ctx.createRadialGradient(templeCenterX, hornBaseY - 2, 2, templeCenterX, hornBaseY - 2, 16);
      medGrad.addColorStop(0, "#fff3b0");
      medGrad.addColorStop(0.5, "#ffd166");
      medGrad.addColorStop(1, "#b08968");
      ctx.fillStyle = medGrad;
      ctx.strokeStyle = "#7f5539";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(templeCenterX, hornBaseY - 2, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    drawUpperHorns();

    // D. GRAND SLOPED THATCHED ROOF (Main Tier)
    const mainRoofTopY = h * 0.26;
    const mainRoofBottomY = h * 0.46;
    const mainRoofW = templeWidth + 140;

    const thatchGrad = ctx.createLinearGradient(0, mainRoofTopY, 0, mainRoofBottomY);
    thatchGrad.addColorStop(0, "#eed7a1");
    thatchGrad.addColorStop(0.2, "#ddb892");
    thatchGrad.addColorStop(0.5, "#b08968");
    thatchGrad.addColorStop(0.8, "#7f5539");
    thatchGrad.addColorStop(1, "#3e2415");
    ctx.fillStyle = thatchGrad;

    ctx.beginPath();
    ctx.moveTo(templeCenterX - 220, mainRoofTopY + 25);
    ctx.lineTo(templeCenterX + 220, mainRoofTopY + 25);
    // Right curved flared eaves
    ctx.quadraticCurveTo(templeCenterX + mainRoofW * 0.35, mainRoofTopY + 70, templeCenterX + mainRoofW * 0.52, mainRoofBottomY + 15);
    ctx.quadraticCurveTo(templeCenterX + mainRoofW * 0.45, mainRoofBottomY + 30, templeCenterX + mainRoofW * 0.42, mainRoofBottomY + 18);
    ctx.lineTo(templeCenterX - mainRoofW * 0.42, mainRoofBottomY + 18);
    ctx.quadraticCurveTo(templeCenterX - mainRoofW * 0.45, mainRoofBottomY + 30, templeCenterX - mainRoofW * 0.52, mainRoofBottomY + 15);
    ctx.quadraticCurveTo(templeCenterX - mainRoofW * 0.35, mainRoofTopY + 70, templeCenterX - 220, mainRoofTopY + 25);
    ctx.closePath();
    ctx.fill();

    // Thatch Texture Grooves / Strata along the slopes
    ctx.strokeStyle = "rgba(62, 36, 21, 0.45)";
    ctx.lineWidth = 3;
    for (let rx = -mainRoofW * 0.44; rx <= mainRoofW * 0.44; rx += 28) {
      ctx.beginPath();
      ctx.moveTo(templeCenterX + rx * 0.4, mainRoofTopY + 28);
      ctx.lineTo(templeCenterX + rx, mainRoofBottomY + 16);
      ctx.stroke();
    }

    // Heavy Dark Wood Underside Eaves
    ctx.fillStyle = "#2c1810";
    ctx.fillRect(templeCenterX - mainRoofW * 0.44, mainRoofBottomY + 18, mainRoofW * 0.88, 14);

    // Eave Rafter Beams
    ctx.fillStyle = "#e07a5f";
    for (let bx = templeCenterX - mainRoofW * 0.42; bx < templeCenterX + mainRoofW * 0.42; bx += 32) {
      ctx.fillRect(bx, mainRoofBottomY + 18, 8, 14);
    }

    // 6. THE FAMOUS TENKAICHI BUDŌKAI SIGNBOARD (Center Plaque: 天下一武道会)
    const drawSignboard = () => {
      ctx.save();
      const sbW = 400;
      const sbH = 92;
      const sbX = templeCenterX - sbW / 2;
      const sbY = h * 0.28;

      // Drop Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.roundRect(sbX + 6, sbY + 6, sbW, sbH, 10);
      ctx.fill();

      // Outer Golden Beveled Frame
      const goldGrad = ctx.createLinearGradient(sbX, sbY, sbX + sbW, sbY + sbH);
      goldGrad.addColorStop(0, "#ffe066");
      goldGrad.addColorStop(0.3, "#ffc300");
      goldGrad.addColorStop(0.7, "#ffaa00");
      goldGrad.addColorStop(1, "#c77700");
      ctx.fillStyle = goldGrad;
      ctx.beginPath();
      ctx.roundRect(sbX, sbY, sbW, sbH, 8);
      ctx.fill();

      ctx.strokeStyle = "#7f4f24";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Inner Red Border Frame
      ctx.strokeStyle = "#c1121f";
      ctx.lineWidth = 4.5;
      ctx.strokeRect(sbX + 10, sbY + 10, sbW - 20, sbH - 20);

      // Inner Off-White Plaque Face
      const faceGrad = ctx.createLinearGradient(sbX, sbY + 14, sbX, sbY + sbH - 14);
      faceGrad.addColorStop(0, "#ffffff");
      faceGrad.addColorStop(1, "#fdf0d5");
      ctx.fillStyle = faceGrad;
      ctx.fillRect(sbX + 13, sbY + 13, sbW - 26, sbH - 26);

      // Corner Metal Brackets
      ctx.fillStyle = "#ffb703";
      const bracketSize = 12;
      ctx.fillRect(sbX + 10, sbY + 10, bracketSize, bracketSize);
      ctx.fillRect(sbX + sbW - 10 - bracketSize, sbY + 10, bracketSize, bracketSize);
      ctx.fillRect(sbX + 10, sbY + sbH - 10 - bracketSize, bracketSize, bracketSize);
      ctx.fillRect(sbX + sbW - 10 - bracketSize, sbY + sbH - 10 - bracketSize, bracketSize, bracketSize);

      // Bold Calligraphy: 天下一武道会
      ctx.fillStyle = "#111111";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "900 38px 'Hiragino Kaku Gothic Pro', 'Noto Sans JP', 'MS Gothic', sans-serif";
      ctx.fillText("天下一武道会", templeCenterX, sbY + sbH / 2 + 1);

      ctx.restore();
    };

    drawSignboard();

    // 7. COURTYARD FRONT RED WALLS, STONE DEMON ONI RELIEFS & PAGODA GATE PILLARS
    const courtyardTopY = h * 0.50;
    const courtyardH = templeBaseY - courtyardTopY;
    const gateW = 230;

    // Left Red Stucco Wall Section
    const redWallLeftGrad = ctx.createLinearGradient(templeCenterX - 500, courtyardTopY, templeCenterX - gateW / 2, courtyardTopY);
    redWallLeftGrad.addColorStop(0, "#9b2226");
    redWallLeftGrad.addColorStop(0.5, "#ae2012");
    redWallLeftGrad.addColorStop(1, "#bb3e03");
    ctx.fillStyle = redWallLeftGrad;
    ctx.fillRect(templeCenterX - 500, courtyardTopY, 500 - gateW / 2, courtyardH);

    // Right Red Stucco Wall Section
    const redWallRightGrad = ctx.createLinearGradient(templeCenterX + gateW / 2, courtyardTopY, templeCenterX + 500, courtyardTopY);
    redWallRightGrad.addColorStop(0, "#bb3e03");
    redWallRightGrad.addColorStop(0.5, "#ae2012");
    redWallRightGrad.addColorStop(1, "#9b2226");
    ctx.fillStyle = redWallRightGrad;
    ctx.fillRect(templeCenterX + gateW / 2, courtyardTopY, 500 - gateW / 2, courtyardH);

    // Wall White Decorative Molding Insets & Foundation Skirting
    ctx.fillStyle = "#f4f1de";
    // Skirting base
    ctx.fillRect(templeCenterX - 505, templeBaseY - 16, 1010, 16);
    // Wall top stone coping
    ctx.fillRect(templeCenterX - 505, courtyardTopY - 6, 505 - gateW / 2 + 5, 12);
    ctx.fillRect(templeCenterX + gateW / 2 - 5, courtyardTopY - 6, 505 - gateW / 2 + 5, 12);

    // White decorative inner panels on red walls
    ctx.strokeStyle = "#fdf0d5";
    ctx.lineWidth = 3.5;
    ctx.strokeRect(templeCenterX - 470, courtyardTopY + 16, 320, courtyardH - 38);
    ctx.strokeRect(templeCenterX + 150, courtyardTopY + 16, 320, courtyardH - 38);

    // CARVED STONE DEMON ONI GARGOLYE RELIEFS (Left & Right Wall Centers)
    const drawDemonGargoyleFace = (dx: number, dy: number, scale: number) => {
      ctx.save();
      const faceR = 48 * scale;

      // Shadow behind sculpture
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.arc(dx + 5, dy + 5, faceR * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // Stone Face Base (Sandstone / Warm Grey Stucco)
      const stoneGrad = ctx.createRadialGradient(dx - 12 * scale, dy - 12 * scale, 5 * scale, dx, dy, faceR);
      stoneGrad.addColorStop(0, "#f8f9fa");
      stoneGrad.addColorStop(0.35, "#e9ecef");
      stoneGrad.addColorStop(0.7, "#ced4da");
      stoneGrad.addColorStop(1, "#6c757d");
      ctx.fillStyle = stoneGrad;

      ctx.beginPath();
      ctx.arc(dx, dy, faceR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#495057";
      ctx.lineWidth = 3.5 * scale;
      ctx.stroke();

      // Sculpted Stone Horns (Curving upward and outward)
      const drawHorn = (isLeftHorn: boolean) => {
        ctx.fillStyle = "#e9ecef";
        ctx.beginPath();
        const sign = isLeftHorn ? -1 : 1;
        ctx.moveTo(dx + sign * 18 * scale, dy - faceR * 0.55);
        ctx.quadraticCurveTo(dx + sign * 56 * scale, dy - faceR * 1.2, dx + sign * 48 * scale, dy - faceR * 1.55);
        ctx.quadraticCurveTo(dx + sign * 26 * scale, dy - faceR * 0.95, dx + sign * 3 * scale, dy - faceR * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };
      drawHorn(true);
      drawHorn(false);

      // Stone Eye Sockets & Bulging Round Eyes
      const eyeSpacing = 22 * scale;
      const eyeY = dy - 8 * scale;
      const eyeR = 12 * scale;

      // Left Eye
      ctx.fillStyle = "#adb5bd";
      ctx.beginPath();
      ctx.arc(dx - eyeSpacing, eyeY, eyeR + 3 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(dx - eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111111";
      ctx.beginPath();
      ctx.arc(dx - eyeSpacing, eyeY, 4.5 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Right Eye
      ctx.fillStyle = "#adb5bd";
      ctx.beginPath();
      ctx.arc(dx + eyeSpacing, eyeY, eyeR + 3 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(dx + eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111111";
      ctx.beginPath();
      ctx.arc(dx + eyeSpacing, eyeY, 4.5 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Broad Snout / Nose
      ctx.fillStyle = "#adb5bd";
      ctx.beginPath();
      ctx.moveTo(dx, dy + 2 * scale);
      ctx.lineTo(dx - 9 * scale, dy + 14 * scale);
      ctx.lineTo(dx + 9 * scale, dy + 14 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wide Grinning Fanged Mouth
      ctx.fillStyle = "#1b1b1b";
      ctx.beginPath();
      ctx.ellipse(dx, dy + 26 * scale, 30 * scale, 13 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sharp Pointed Fangs / Teeth
      ctx.fillStyle = "#f8f9fa";
      const toothPoints = [-22, -14, -5, 5, 14, 22];
      for (const tp of toothPoints) {
        // Upper Teeth
        ctx.beginPath();
        ctx.moveTo(dx + (tp - 3) * scale, dy + 16 * scale);
        ctx.lineTo(dx + tp * scale, dy + 25 * scale);
        ctx.lineTo(dx + (tp + 3) * scale, dy + 16 * scale);
        ctx.fill();
        // Lower Teeth
        ctx.beginPath();
        ctx.moveTo(dx + (tp - 3) * scale, dy + 37 * scale);
        ctx.lineTo(dx + tp * scale, dy + 29 * scale);
        ctx.lineTo(dx + (tp + 3) * scale, dy + 37 * scale);
        ctx.fill();
      }

      // Stone Beard / Mane Fluff details
      ctx.fillStyle = "#ced4da";
      const fluffOffsets = [-38, -25, 0, 25, 38];
      for (const fo of fluffOffsets) {
        ctx.beginPath();
        ctx.arc(dx + fo * scale, dy + (faceR - 2) * scale, 9 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    };

    drawDemonGargoyleFace(templeCenterX - 310, courtyardTopY + courtyardH * 0.52, 1.1);
    drawDemonGargoyleFace(templeCenterX + 310, courtyardTopY + courtyardH * 0.52, 1.1);

    // BALINESE-STYLE STEPPED PAGODA GATE PILLARS (Framing the Entrance)
    const drawGatePillar = (px: number) => {
      ctx.save();
      const pW = 52;
      const pH = courtyardH + 50;
      const pTopY = courtyardTopY - 50;

      const pGrad = ctx.createLinearGradient(px - pW / 2, pTopY, px + pW / 2, pTopY);
      pGrad.addColorStop(0, "#fdf0d5");
      pGrad.addColorStop(0.5, "#ddb892");
      pGrad.addColorStop(1, "#b08968");
      ctx.fillStyle = pGrad;

      // Main Pillar Body
      ctx.fillRect(px - pW / 2, pTopY + 32, pW, pH - 32);
      ctx.strokeStyle = "#7f5539";
      ctx.lineWidth = 3.5;
      ctx.strokeRect(px - pW / 2, pTopY + 32, pW, pH - 32);

      // Inset Red Panels in Pillar
      ctx.fillStyle = "#ae2012";
      ctx.fillRect(px - pW * 0.32, pTopY + 48, pW * 0.64, 42);
      ctx.fillRect(px - pW * 0.32, pTopY + 110, pW * 0.64, 52);

      // Stepped Pagoda Crown Rooflets on Pillar
      const tiers = [
        { y: pTopY + 24, w: pW + 18, h: 10 },
        { y: pTopY + 12, w: pW + 8, h: 9 },
        { y: pTopY + 2, w: pW - 6, h: 8 },
      ];
      ctx.fillStyle = "#ddb892";
      for (const t of tiers) {
        ctx.fillRect(px - t.w / 2, t.y, t.w, t.h);
        ctx.strokeRect(px - t.w / 2, t.y, t.w, t.h);
      }

      // Ornamental Pointed Top Finial
      ctx.fillStyle = "#c1121f";
      ctx.beginPath();
      ctx.moveTo(px, pTopY - 16);
      ctx.lineTo(px - 11, pTopY + 2);
      ctx.lineTo(px + 11, pTopY + 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    drawGatePillar(templeCenterX - gateW / 2);
    drawGatePillar(templeCenterX + gateW / 2);

    // CENTRAL ENTRANCE ARCHWAY & MARTIAL ARTS "武" SCREEN
    const archTopY = courtyardTopY + 10;
    const archW = gateW - 52;
    const archH = courtyardH - 10;
    const archX = templeCenterX - archW / 2;

    // Dark Gateway Interior
    ctx.fillStyle = "#1b0c06";
    ctx.beginPath();
    ctx.roundRect(archX, archTopY, archW, archH, [16, 16, 0, 0]);
    ctx.fill();

    // Red Portal Arch Trim
    ctx.strokeStyle = "#e63946";
    ctx.lineWidth = 4.5;
    ctx.stroke();

    // Standing Folding Screen (Byōbu) with Red "武" (Martial Arts) Character
    const drawMuScreen = () => {
      ctx.save();
      const screenW = archW * 0.80;
      const screenH = archH * 0.70;
      const screenX = templeCenterX - screenW / 2;
      const screenY = templeBaseY - screenH - 12;

      // Screen Gold/Wood Frame
      ctx.fillStyle = "#ffb703";
      ctx.fillRect(screenX - 4, screenY - 4, screenW + 8, screenH + 8);
      ctx.strokeStyle = "#7f5539";
      ctx.lineWidth = 3;
      ctx.strokeRect(screenX - 4, screenY - 4, screenW + 8, screenH + 8);

      // Screen Off-White Lacquered Face
      ctx.fillStyle = "#fefae0";
      ctx.fillRect(screenX, screenY, screenW, screenH);

      // Red Circle in Center
      const muR = 28;
      ctx.strokeStyle = "#d90429";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(templeCenterX, screenY + screenH / 2, muR, 0, Math.PI * 2);
      ctx.stroke();

      // Bold Red Kanji "武" (Mu / Martial Arts)
      ctx.fillStyle = "#d90429";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "900 30px 'Hiragino Kaku Gothic Pro', 'Noto Sans JP', sans-serif";
      ctx.fillText("武", templeCenterX, screenY + screenH / 2 + 1);

      ctx.restore();
    };

    drawMuScreen();

    // Tournament Announcer Silhouette / Mini Figure (with Blond Hair, Dark Sunglasses & Microphone)
    const drawAnnouncer = () => {
      ctx.save();
      const ax = templeCenterX;
      const ay = templeBaseY - 14;
      const aScale = 1.0;

      // Dark Suit Body
      ctx.fillStyle = "#212529";
      ctx.beginPath();
      ctx.roundRect(ax - 10 * aScale, ay - 42 * aScale, 20 * aScale, 42 * aScale, [4, 4, 0, 0]);
      ctx.fill();

      // White Shirt Collar & Red Tie
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(ax - 6 * aScale, ay - 42 * aScale);
      ctx.lineTo(ax, ay - 33 * aScale);
      ctx.lineTo(ax + 6 * aScale, ay - 42 * aScale);
      ctx.fill();

      ctx.fillStyle = "#d90429";
      ctx.fillRect(ax - 2 * aScale, ay - 35 * aScale, 4 * aScale, 14 * aScale);

      // Head & Skin
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(ax, ay - 50 * aScale, 8 * aScale, 0, Math.PI * 2);
      ctx.fill();

      // Iconic Blond Hair
      ctx.fillStyle = "#ffe066";
      ctx.beginPath();
      ctx.arc(ax, ay - 53 * aScale, 9 * aScale, Math.PI * 0.8, Math.PI * 2.2);
      ctx.fill();

      // Dark Sunglasses
      ctx.fillStyle = "#000000";
      ctx.fillRect(ax - 6 * aScale, ay - 52 * aScale, 12 * aScale, 4 * aScale);

      // Microphone
      ctx.fillStyle = "#ced4da";
      ctx.fillRect(ax + 8 * aScale, ay - 36 * aScale, 3 * aScale, 14 * aScale);
      ctx.fillStyle = "#212529";
      ctx.beginPath();
      ctx.arc(ax + 9.5 * aScale, ay - 38 * aScale, 4 * aScale, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    drawAnnouncer();

    // 8. SIDE PERIMETER WALLS (Low Sandstone Walls with Red Coping)
    const sideWallTopY = h * 0.56;
    const sideWallH = templeBaseY - sideWallTopY;

    // Left Perimeter Wall
    const pWallGradLeft = ctx.createLinearGradient(0, sideWallTopY, templeCenterX - 500, sideWallTopY);
    pWallGradLeft.addColorStop(0, "#d4a373");
    pWallGradLeft.addColorStop(1, "#faedcd");
    ctx.fillStyle = pWallGradLeft;
    ctx.fillRect(0, sideWallTopY, templeCenterX - 500, sideWallH);

    // Right Perimeter Wall
    const pWallGradRight = ctx.createLinearGradient(templeCenterX + 500, sideWallTopY, w, sideWallTopY);
    pWallGradRight.addColorStop(0, "#faedcd");
    pWallGradRight.addColorStop(1, "#d4a373");
    ctx.fillStyle = pWallGradRight;
    ctx.fillRect(templeCenterX + 500, sideWallTopY, w - (templeCenterX + 500), sideWallH);

    // Rounded Red Coping Caps along Side Walls
    ctx.fillStyle = "#c1121f";
    ctx.fillRect(0, sideWallTopY - 7, templeCenterX - 500, 12);
    ctx.fillRect(templeCenterX + 500, sideWallTopY - 7, w - (templeCenterX + 500), 12);

    // Little Corner Stone Stupas on Side Walls
    const drawStupa = (sx: number) => {
      ctx.fillStyle = "#e9ecef";
      ctx.fillRect(sx - 12, sideWallTopY - 26, 24, 20);
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(sx, sideWallTopY - 26, 9, 0, Math.PI * 2);
      ctx.fill();
    };

    drawStupa(w * 0.05);
    drawStupa(w * 0.95);

    // 9. ELEVATED MARTIAL ARTS FIGHTING RING (Foreground Tiled Stage)
    const stageTopY = h * 0.70;
    const stageBottomY = h * 0.94;

    // Tiled Arena Floor
    const ringGrad = ctx.createLinearGradient(0, stageTopY, 0, stageBottomY);
    ringGrad.addColorStop(0, "#ffffff");
    ringGrad.addColorStop(0.2, "#f4f6f8");
    ringGrad.addColorStop(0.6, "#e9ecef");
    ringGrad.addColorStop(1, "#d0d7de");
    ctx.fillStyle = ringGrad;
    ctx.fillRect(0, stageTopY, w, stageBottomY - stageTopY);

    // Perspective Stone Flagstone Grid Lines
    ctx.strokeStyle = "rgba(160, 170, 180, 0.85)";
    ctx.lineWidth = 3.5;

    // Horizontal Tile Rows with perspective spacing
    const tileRows = [0, 0.14, 0.30, 0.50, 0.74, 1.0];
    for (const tr of tileRows) {
      const ty = stageTopY + (stageBottomY - stageTopY) * tr;
      ctx.beginPath();
      ctx.moveTo(0, ty);
      ctx.lineTo(w, ty);
      ctx.stroke();
    }

    // Vertical Perspective Grid Lines
    for (let tx = -240; tx <= w + 240; tx += 120) {
      ctx.beginPath();
      ctx.moveTo(templeCenterX + (tx - templeCenterX) * 0.78, stageTopY);
      ctx.lineTo(tx, stageBottomY);
      ctx.stroke();
    }

    // Subtle stone texture speckles on ring
    ctx.fillStyle = "rgba(108, 117, 125, 0.18)";
    for (let s = 0; s < 200; s++) {
      const sx = (s * 83) % w;
      const sy = stageTopY + ((s * 47) % (stageBottomY - stageTopY));
      ctx.fillRect(sx, sy, 3, 2);
    }

    // 10. CRISP CRIMSON BOUNDARY OUT-OF-BOUNDS LINE ALONG STAGE LIP
    ctx.fillStyle = "#d90429";
    ctx.fillRect(0, stageBottomY - 7, w, 12);
    ctx.fillStyle = "#780000";
    ctx.fillRect(0, stageBottomY + 5, w, 5);

    // 11. DEEP NAVY / INDIGO GROUND BELOW RING PLATFORM (Anime Apron Floor)
    const apronGrad = ctx.createLinearGradient(0, stageBottomY + 10, 0, h);
    apronGrad.addColorStop(0, "#1d3557");
    apronGrad.addColorStop(0.4, "#14213d");
    apronGrad.addColorStop(1, "#0a1128");
    ctx.fillStyle = apronGrad;
    ctx.fillRect(0, stageBottomY + 10, w, h - (stageBottomY + 10));

    // Floor Shadow underneath the elevated stage rim
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, stageBottomY + 10, w, 10);

    ctx.restore();
  }

  // =========================================================================
  // 5. GELEIRA ETERNA (Arctic Polar Night, Aurora Borealis, Ice Spires & Permafrost)
  // =========================================================================
  private static drawIceArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();

    // 1. Deep Arctic Polar Twilight & Night Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.72);
    skyGrad.addColorStop(0, "#010712");
    skyGrad.addColorStop(0.2, "#041527");
    skyGrad.addColorStop(0.45, "#08253d");
    skyGrad.addColorStop(0.7, "#0e3e59");
    skyGrad.addColorStop(0.9, "#155e75");
    skyGrad.addColorStop(1, "#164e63");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 1.1 Twinkling Arctic Starfield with Cross Glints
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 120; i++) {
      const sx = (i * 79 + 37) % w;
      const sy = (i * 43 + 19) % (h * 0.52);
      const sr = (i % 7 === 0) ? 2.5 : (i % 3 === 0 ? 1.8 : 1.0);
      const alpha = 0.4 + ((i * 17) % 60) / 100;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();

      // Bright stars get 4-point cross glints
      if (i % 12 === 0) {
        ctx.strokeStyle = `rgba(224, 242, 254, ${alpha * 0.8})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sx - 8, sy);
        ctx.lineTo(sx + 8, sy);
        ctx.moveTo(sx, sy - 8);
        ctx.lineTo(sx, sy + 8);
        ctx.stroke();
      }
    }

    // 1.2 Luminous Arctic Full Moon with Halo
    const moonX = w * 0.82;
    const moonY = h * 0.16;
    const moonR = 48;

    // Outer Ice Halo Ring
    const haloGrad = ctx.createRadialGradient(moonX, moonY, moonR * 0.8, moonX, moonY, moonR * 3.5);
    haloGrad.addColorStop(0, "rgba(186, 230, 253, 0.45)");
    haloGrad.addColorStop(0.4, "rgba(56, 189, 248, 0.2)");
    haloGrad.addColorStop(0.8, "rgba(167, 139, 250, 0.08)");
    haloGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Moon Body
    const moonBodyGrad = ctx.createRadialGradient(moonX - 12, moonY - 12, 6, moonX, moonY, moonR);
    moonBodyGrad.addColorStop(0, "#ffffff");
    moonBodyGrad.addColorStop(0.5, "#f0f9ff");
    moonBodyGrad.addColorStop(0.85, "#e0f2fe");
    moonBodyGrad.addColorStop(1, "#bae6fd");
    ctx.fillStyle = moonBodyGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();

    // Subtle Lunar Mare / Ice Craters
    ctx.fillStyle = "rgba(125, 211, 252, 0.25)";
    ctx.beginPath();
    ctx.arc(moonX - 14, moonY + 8, 14, 0, Math.PI * 2);
    ctx.arc(moonX + 16, moonY - 10, 18, 0, Math.PI * 2);
    ctx.arc(moonX + 8, moonY + 18, 11, 0, Math.PI * 2);
    ctx.fill();

    // 2. SPECTACULAR AURORA BOREALIS (Multi-layered Sinusoidal Curtains with Vertical Light Rays)
    const drawAuroraCurtain = (
      baseY: number,
      height: number,
      colorTop: string,
      colorMid: string,
      colorBot: string,
      freq: number,
      amp: number,
      offset: number,
      alpha: number
    ) => {
      ctx.save();
      ctx.globalAlpha = alpha;

      // Vertical rays pass
      for (let x = 0; x <= w; x += 18) {
        const wave = Math.sin(x * freq + offset) * amp + Math.cos(x * freq * 1.8 + offset * 0.7) * (amp * 0.4);
        const rayTopY = baseY + wave - height;
        const rayBotY = baseY + wave + height * 0.3;

        const rayGrad = ctx.createLinearGradient(x, rayTopY, x, rayBotY);
        rayGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
        rayGrad.addColorStop(0.2, colorTop);
        rayGrad.addColorStop(0.6, colorMid);
        rayGrad.addColorStop(0.9, colorBot);
        rayGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = rayGrad;
        ctx.fillRect(x - 8, rayTopY, 16, rayBotY - rayTopY);
      }

      // Smooth flowing ribbon band
      ctx.beginPath();
      ctx.moveTo(0, baseY + Math.sin(offset) * amp);
      for (let x = 0; x <= w; x += 25) {
        const y = baseY + Math.sin(x * freq + offset) * amp + Math.cos(x * freq * 1.8 + offset * 0.7) * (amp * 0.4);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, baseY + height);
      for (let x = w; x >= 0; x -= 25) {
        const y = baseY + height + Math.sin(x * freq + offset) * (amp * 0.7);
        ctx.lineTo(x, y);
      }
      ctx.closePath();

      const ribbonGrad = ctx.createLinearGradient(0, baseY - height * 0.5, 0, baseY + height);
      ribbonGrad.addColorStop(0, colorTop);
      ribbonGrad.addColorStop(0.5, colorMid);
      ribbonGrad.addColorStop(1, colorBot);
      ctx.fillStyle = ribbonGrad;
      ctx.fill();

      ctx.restore();
    };

    // Emerald Green Lower Aurora
    drawAuroraCurtain(h * 0.28, 90, "rgba(5, 150, 105, 0.4)", "rgba(52, 211, 153, 0.75)", "rgba(110, 231, 183, 0)", 0.0035, 45, 1.2, 0.8);
    // Vibrant Neon Cyan Mid Aurora
    drawAuroraCurtain(h * 0.22, 110, "rgba(14, 116, 144, 0.5)", "rgba(56, 189, 248, 0.85)", "rgba(186, 230, 253, 0)", 0.0042, 55, 2.8, 0.85);
    // Electric Violet-Pink Upper Curtain
    drawAuroraCurtain(h * 0.14, 100, "rgba(147, 51, 234, 0.4)", "rgba(232, 121, 249, 0.7)", "rgba(244, 114, 182, 0)", 0.003, 40, 4.5, 0.7);

    // 3. DISTANT MAJESTIC GLACIAL MOUNTAINS (Far Background Silhouette & Ridge Lighting)
    const drawGlacialMountainRange = (
      baseY: number,
      height: number,
      baseColorDark: string,
      baseColorLight: string,
      snowColor: string,
      peaks: number[]
    ) => {
      ctx.save();
      const numSegments = peaks.length - 1;
      const step = w / numSegments;

      // Draw shadowed mountain body
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      for (let i = 0; i <= numSegments; i++) {
        const px = i * step;
        const py = baseY - peaks[i] * height;
        ctx.lineTo(px, py);
      }
      ctx.lineTo(w, baseY);
      ctx.closePath();

      const mGrad = ctx.createLinearGradient(0, baseY - height, 0, baseY);
      mGrad.addColorStop(0, baseColorLight);
      mGrad.addColorStop(0.5, baseColorDark);
      mGrad.addColorStop(1, "#031726");
      ctx.fillStyle = mGrad;
      ctx.fill();

      // Sharp Crystalline Mountain Facets & Snow Crevasses
      for (let i = 0; i < numSegments; i++) {
        const x1 = i * step;
        const y1 = baseY - peaks[i] * height;
        const x2 = (i + 1) * step;
        const y2 = baseY - peaks[i + 1] * height;
        const midX = (x1 + x2) / 2;
        const ridgeY = Math.min(y1, y2) + 20;

        // Left illuminated snow face
        ctx.fillStyle = snowColor;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(midX, baseY);
        ctx.lineTo(x1, baseY);
        ctx.closePath();
        ctx.fill();

        // Sharp highlight ridge line
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(midX + 10, baseY);
        ctx.stroke();

        // Blue ice fissure in mountain
        ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(midX, ridgeY);
        ctx.lineTo(midX - 15, baseY);
        ctx.stroke();
      }

      ctx.restore();
    };

    // Far Range (Deep Indigo & Snowy Blue)
    drawGlacialMountainRange(
      h * 0.60,
      170,
      "#082f49",
      "#0e496a",
      "rgba(186, 230, 253, 0.35)",
      [0.4, 0.85, 0.35, 0.95, 0.5, 0.78, 0.3, 0.9, 0.45, 0.88, 0.4]
    );

    // Mid Range (Sharp Turquoise Ice Peaks & Glacial Walls)
    drawGlacialMountainRange(
      h * 0.68,
      140,
      "#0c4a6e",
      "#0284c7",
      "rgba(224, 242, 254, 0.55)",
      [0.6, 0.3, 0.88, 0.45, 0.92, 0.38, 0.82, 0.5, 0.95, 0.35, 0.75, 0.5]
    );

    // 4. MASSIVE GLACIAL ICE WALL & FROZEN WATERFALLS (Midground Glacial Shelf)
    const shelfTopY = h * 0.50;
    const shelfBottomY = h * 0.72;

    // Glacial Ice Shelf Body
    const shelfGrad = ctx.createLinearGradient(0, shelfTopY, 0, shelfBottomY);
    shelfGrad.addColorStop(0, "#e0f2fe");
    shelfGrad.addColorStop(0.15, "#7dd3fc");
    shelfGrad.addColorStop(0.45, "#0284c7");
    shelfGrad.addColorStop(0.75, "#0369a1");
    shelfGrad.addColorStop(1, "#082f49");
    ctx.fillStyle = shelfGrad;

    // Jagged top edge of ice shelf
    ctx.beginPath();
    ctx.moveTo(0, shelfBottomY);
    ctx.lineTo(0, shelfTopY + 20);
    for (let sx = 0; sx <= w; sx += 60) {
      const sy = shelfTopY + Math.sin(sx * 0.015) * 14 + Math.cos(sx * 0.035) * 8;
      ctx.lineTo(sx, sy);
    }
    ctx.lineTo(w, shelfBottomY);
    ctx.closePath();
    ctx.fill();

    // Glacial Ice Crevasses & Stratified Blue Layers in the Ice Wall
    ctx.strokeStyle = "rgba(14, 165, 233, 0.6)";
    ctx.lineWidth = 3;
    for (let cx = 40; cx < w; cx += 110) {
      ctx.beginPath();
      ctx.moveTo(cx, shelfTopY + 15);
      ctx.lineTo(cx + ((cx % 3 === 0) ? 25 : -20), shelfTopY + 60);
      ctx.lineTo(cx + 10, shelfBottomY);
      ctx.stroke();

      // Deep dark crevasse shadow
      ctx.strokeStyle = "rgba(3, 105, 161, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + 3, shelfTopY + 20);
      ctx.lineTo(cx + 15, shelfBottomY);
      ctx.stroke();
    }

    // Frozen Cascading Waterfalls (Translucent Cyan Ice Columns)
    const drawFrozenWaterfall = (fx: number, fw: number) => {
      ctx.save();
      const wfGrad = ctx.createLinearGradient(fx - fw / 2, shelfTopY + 10, fx + fw / 2, shelfBottomY);
      wfGrad.addColorStop(0, "#ffffff");
      wfGrad.addColorStop(0.3, "#a5f3fc");
      wfGrad.addColorStop(0.7, "#38bdf8");
      wfGrad.addColorStop(1, "#0284c7");
      ctx.fillStyle = wfGrad;

      ctx.beginPath();
      ctx.moveTo(fx - fw * 0.4, shelfTopY + 10);
      ctx.lineTo(fx + fw * 0.4, shelfTopY + 10);
      ctx.lineTo(fx + fw * 0.6, shelfBottomY);
      ctx.lineTo(fx - fw * 0.6, shelfBottomY);
      ctx.closePath();
      ctx.fill();

      // Vertical Icicle Columns in the waterfall
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 2.5;
      for (let ix = -fw * 0.4; ix <= fw * 0.4; ix += 8) {
        ctx.beginPath();
        ctx.moveTo(fx + ix, shelfTopY + 15);
        ctx.lineTo(fx + ix * 1.15, shelfBottomY - 10);
        ctx.stroke();
      }

      // Frosted spray mist at base
      const mistGrad = ctx.createRadialGradient(fx, shelfBottomY - 10, 5, fx, shelfBottomY - 10, fw * 1.2);
      mistGrad.addColorStop(0, "rgba(224, 242, 254, 0.8)");
      mistGrad.addColorStop(0.6, "rgba(125, 211, 252, 0.3)");
      mistGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = mistGrad;
      ctx.beginPath();
      ctx.ellipse(fx, shelfBottomY - 5, fw * 1.1, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    drawFrozenWaterfall(w * 0.22, 65);
    drawFrozenWaterfall(w * 0.64, 75);

    // 5. MASTERWORK 3D CRYSTALLINE ICE SPIRES & GIGANTIC ICEBERGS (Faceted Polygons & Specular Highlights)
    const drawCrystalSpire3D = (cx: number, cy: number, width: number, height: number, tilt: number = 0) => {
      ctx.save();
      ctx.translate(cx, cy);
      if (tilt !== 0) ctx.rotate(tilt);

      const tipX = 0;
      const tipY = -height;
      const baseLeftX = -width / 2;
      const baseRightX = width / 2;
      const baseMidX = width * 0.08;
      const midLeftX = -width * 0.38;
      const midRightX = width * 0.38;
      const midY = -height * 0.45;

      // Soft Glow / Subsurface Aura behind Crystal
      const auraGrad = ctx.createRadialGradient(0, -height * 0.5, 10, 0, -height * 0.5, width * 1.5);
      auraGrad.addColorStop(0, "rgba(56, 189, 248, 0.45)");
      auraGrad.addColorStop(0.5, "rgba(6, 182, 212, 0.2)");
      auraGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, -height * 0.5, width * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Shadow behind Spire
      ctx.fillStyle = "rgba(3, 10, 20, 0.5)";
      ctx.beginPath();
      ctx.moveTo(tipX + 8, tipY + 8);
      ctx.lineTo(baseRightX + 15, 10);
      ctx.lineTo(baseLeftX - 15, 10);
      ctx.closePath();
      ctx.fill();

      // FACET 1: Leftmost Darker Facet (Teal / Deep Ultramarine Ice)
      const facet1Grad = ctx.createLinearGradient(baseLeftX, midY, midLeftX, midY);
      facet1Grad.addColorStop(0, "#0c4a6e");
      facet1Grad.addColorStop(0.5, "#0284c7");
      facet1Grad.addColorStop(1, "#38bdf8");
      ctx.fillStyle = facet1Grad;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(baseLeftX, 0);
      ctx.lineTo(midLeftX, midY);
      ctx.closePath();
      ctx.fill();

      // FACET 2: Center-Left Facet (Brilliant Glowing Cyan Core)
      const facet2Grad = ctx.createLinearGradient(midLeftX, tipY, baseMidX, 0);
      facet2Grad.addColorStop(0, "#e0f2fe");
      facet2Grad.addColorStop(0.3, "#7dd3fc");
      facet2Grad.addColorStop(0.7, "#0284c7");
      facet2Grad.addColorStop(1, "#0369a1");
      ctx.fillStyle = facet2Grad;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(midLeftX, midY);
      ctx.lineTo(baseMidX, 0);
      ctx.closePath();
      ctx.fill();

      // FACET 3: Center-Right Facet (Specular Highlight & Pure Refractive White/Ice)
      const facet3Grad = ctx.createLinearGradient(baseMidX, tipY, midRightX, 0);
      facet3Grad.addColorStop(0, "#ffffff");
      facet3Grad.addColorStop(0.25, "#bae6fd");
      facet3Grad.addColorStop(0.65, "#38bdf8");
      facet3Grad.addColorStop(1, "#0284c7");
      ctx.fillStyle = facet3Grad;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(baseMidX, 0);
      ctx.lineTo(midRightX, midY);
      ctx.closePath();
      ctx.fill();

      // FACET 4: Rightmost Shaded Facet (Deep Glacial Blue Shadow)
      const facet4Grad = ctx.createLinearGradient(midRightX, midY, baseRightX, midY);
      facet4Grad.addColorStop(0, "#0284c7");
      facet4Grad.addColorStop(0.6, "#0369a1");
      facet4Grad.addColorStop(1, "#082f49");
      ctx.fillStyle = facet4Grad;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(midRightX, midY);
      ctx.lineTo(baseRightX, 0);
      ctx.closePath();
      ctx.fill();

      // Sharp Specular Ridge Lines & Edges
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(baseMidX, 0);
      ctx.stroke();

      ctx.strokeStyle = "rgba(224, 242, 254, 0.75)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(midLeftX, midY);
      ctx.lineTo(baseLeftX, 0);
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(midRightX, midY);
      ctx.lineTo(baseRightX, 0);
      ctx.stroke();

      // Snow Dusting on Crystal Shoulders
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.ellipse(midLeftX, midY, width * 0.18, 6, -0.3, 0, Math.PI * 2);
      ctx.ellipse(midRightX, midY, width * 0.18, 6, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Brilliant Diamond Sparkle / Lens Flare on Crystal Tip
      const sparkleGrad = ctx.createRadialGradient(tipX, tipY, 2, tipX, tipY, 24);
      sparkleGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
      sparkleGrad.addColorStop(0.3, "rgba(186, 230, 253, 0.9)");
      sparkleGrad.addColorStop(0.7, "rgba(56, 189, 248, 0.4)");
      sparkleGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = sparkleGrad;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 24, 0, Math.PI * 2);
      ctx.fill();

      // 4-Point Star Flare
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(tipX, tipY - 18);
      ctx.quadraticCurveTo(tipX, tipY, tipX + 18, tipY);
      ctx.quadraticCurveTo(tipX, tipY, tipX, tipY + 18);
      ctx.quadraticCurveTo(tipX, tipY, tipX - 18, tipY);
      ctx.quadraticCurveTo(tipX, tipY, tipX, tipY - 18);
      ctx.closePath();
      ctx.fill();

      // Secondary Smaller Crystal Shards flanking the base
      const drawMiniShard = (sx: number, sw: number, sh: number, sTilt: number) => {
        ctx.save();
        ctx.translate(sx, 0);
        ctx.rotate(sTilt);
        const sGrad = ctx.createLinearGradient(-sw / 2, -sh, sw / 2, 0);
        sGrad.addColorStop(0, "#ffffff");
        sGrad.addColorStop(0.4, "#7dd3fc");
        sGrad.addColorStop(1, "#0369a1");
        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.moveTo(0, -sh);
        ctx.lineTo(-sw / 2, 0);
        ctx.lineTo(sw / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      };

      drawMiniShard(baseLeftX - 10, width * 0.35, height * 0.38, -0.25);
      drawMiniShard(baseRightX + 10, width * 0.35, height * 0.42, 0.28);
      drawMiniShard(baseLeftX + width * 0.2, width * 0.25, height * 0.25, -0.1);

      ctx.restore();
    };

    // Background Smaller Spires
    drawCrystalSpire3D(w * 0.05, h * 0.72, 100, 260, -0.06);
    drawCrystalSpire3D(w * 0.24, h * 0.72, 85, 210, 0.05);
    drawCrystalSpire3D(w * 0.40, h * 0.72, 110, 290, -0.04);
    drawCrystalSpire3D(w * 0.58, h * 0.72, 95, 240, 0.06);
    drawCrystalSpire3D(w * 0.76, h * 0.72, 105, 270, -0.05);
    drawCrystalSpire3D(w * 0.95, h * 0.72, 110, 280, 0.08);

    // Prominent Foreground Glacial Crystal Pillars (Towering Grand Spires)
    drawCrystalSpire3D(w * 0.13, h * 0.72, 170, 420, -0.08);
    drawCrystalSpire3D(w * 0.87, h * 0.72, 180, 440, 0.09);
    drawCrystalSpire3D(w * 0.48, h * 0.72, 140, 360, 0.03);

    // 6. FOREGROUND GLACIAL PERMAFROST & POLISHED ICE PLATFORM (Combat Ring)
    const stageTopY = h * 0.70;
    const stageBottomY = h * 0.94;
    const stageH = stageBottomY - stageTopY;

    // A. Polished Glacial Ice Sheet Base
    const iceFloorGrad = ctx.createLinearGradient(0, stageTopY, 0, stageBottomY);
    iceFloorGrad.addColorStop(0, "#f0f9ff");
    iceFloorGrad.addColorStop(0.12, "#bae6fd");
    iceFloorGrad.addColorStop(0.35, "#38bdf8");
    iceFloorGrad.addColorStop(0.65, "#0284c7");
    iceFloorGrad.addColorStop(0.85, "#0369a1");
    iceFloorGrad.addColorStop(1, "#075985");
    ctx.fillStyle = iceFloorGrad;
    ctx.fillRect(0, stageTopY, w, stageH);

    // B. Subsurface Glowing Cyan Fissures & Spiderweb Ice Cracks
    const drawIceFracture = (startX: number, startY: number, length: number, angle: number) => {
      ctx.save();
      ctx.strokeStyle = "rgba(186, 230, 253, 0.85)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);

      let currX = startX;
      let currY = startY;
      const numSegments = 6;
      for (let s = 0; s < numSegments; s++) {
        const segLen = length / numSegments;
        const wiggle = (Math.sin(s * 2.3 + startX) * 0.6) + angle;
        currX += Math.cos(wiggle) * segLen;
        currY += Math.sin(wiggle) * segLen;
        ctx.lineTo(currX, currY);

        // Branch crack
        if (s === 2 || s === 4) {
          ctx.moveTo(currX, currY);
          ctx.lineTo(currX + Math.cos(wiggle + 0.8) * (segLen * 0.7), currY + Math.sin(wiggle + 0.8) * (segLen * 0.7));
          ctx.moveTo(currX, currY);
        }
      }
      ctx.stroke();

      // Deep cyan glow inside fracture
      ctx.strokeStyle = "rgba(6, 182, 212, 0.5)";
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.restore();
    };

    drawIceFracture(w * 0.16, stageTopY + 15, 180, 0.9);
    drawIceFracture(w * 0.38, stageTopY + 25, 220, 1.1);
    drawIceFracture(w * 0.62, stageTopY + 10, 200, 0.8);
    drawIceFracture(w * 0.82, stageTopY + 20, 190, 1.2);

    // C. Hexagonal Crystalline Ice Flagstone Tiles (Perspective Grid)
    ctx.strokeStyle = "rgba(224, 242, 254, 0.45)";
    ctx.lineWidth = 2.5;

    // Horizontal Depth Lines
    const iceRows = [0, 0.14, 0.30, 0.50, 0.74, 1.0];
    for (const tr of iceRows) {
      const ty = stageTopY + stageH * tr;
      ctx.beginPath();
      ctx.moveTo(0, ty);
      ctx.lineTo(w, ty);
      ctx.stroke();
    }

    // Perspective Lines radiating from horizon center
    const vpX = w * 0.5;
    for (let tx = -260; tx <= w + 260; tx += 110) {
      ctx.beginPath();
      ctx.moveTo(vpX + (tx - vpX) * 0.75, stageTopY);
      ctx.lineTo(tx, stageBottomY);
      ctx.stroke();
    }

    // D. Frosted Windblown Snow Drifts across the Stage Surface
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    for (let d = 0; d < 8; d++) {
      const dx = ((d * 210) % w);
      const dy = stageTopY + ((d * 37) % (stageH - 20)) + 10;
      const dw = 140 + (d % 3) * 50;
      ctx.beginPath();
      ctx.ellipse(dx, dy, dw, 7, -0.05, 0, Math.PI * 2);
      ctx.fill();
    }

    // E. Sparkling Diamond Dust & Ice Crystals on Stage
    for (let s = 0; s < 150; s++) {
      const sx = (s * 89) % w;
      const sy = stageTopY + ((s * 53) % stageH);
      const alpha = 0.3 + ((s * 23) % 70) / 100;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(sx, sy, 3, 2);
    }

    // 7. GLOWING TURQUOISE GLACIER LIP & SHARP HANGING ICICLES (Stage Rim)
    // Luminous Crystal Boundary Edge
    const rimGrad = ctx.createLinearGradient(0, stageBottomY - 8, 0, stageBottomY + 6);
    rimGrad.addColorStop(0, "#ffffff");
    rimGrad.addColorStop(0.3, "#a5f3fc");
    rimGrad.addColorStop(0.7, "#06b6d4");
    rimGrad.addColorStop(1, "#0284c7");
    ctx.fillStyle = rimGrad;
    ctx.fillRect(0, stageBottomY - 8, w, 14);

    // Specular Highlight Line
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, stageBottomY - 6, w, 2.5);

    // Hanging Sharp Icicles along the Glacier Lip
    const drawIcicle = (ix: number, iLength: number, iWidth: number) => {
      ctx.save();
      const iGrad = ctx.createLinearGradient(ix - iWidth / 2, stageBottomY + 6, ix + iWidth / 2, stageBottomY + 6 + iLength);
      iGrad.addColorStop(0, "#ffffff");
      iGrad.addColorStop(0.3, "#bae6fd");
      iGrad.addColorStop(0.7, "#38bdf8");
      iGrad.addColorStop(1, "rgba(2, 132, 199, 0.4)");
      ctx.fillStyle = iGrad;

      ctx.beginPath();
      ctx.moveTo(ix - iWidth / 2, stageBottomY + 6);
      ctx.lineTo(ix + iWidth / 2, stageBottomY + 6);
      ctx.lineTo(ix, stageBottomY + 6 + iLength);
      ctx.closePath();
      ctx.fill();

      // Specular highlight on icicle
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ix - iWidth * 0.2, stageBottomY + 6);
      ctx.lineTo(ix, stageBottomY + 6 + iLength);
      ctx.stroke();

      ctx.restore();
    };

    for (let ix = 10; ix < w; ix += 22) {
      const len = 12 + ((ix * 31) % 38);
      const wid = 8 + ((ix * 13) % 8);
      drawIcicle(ix, len, wid);
    }

    // 8. POLAR ABYSS & FLOATING PACK ICE OCEAN BELOW (Foreground Base)
    const oceanGrad = ctx.createLinearGradient(0, stageBottomY + 6, 0, h);
    oceanGrad.addColorStop(0, "#082f49");
    oceanGrad.addColorStop(0.3, "#02172b");
    oceanGrad.addColorStop(0.7, "#010d18");
    oceanGrad.addColorStop(1, "#00050a");
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, stageBottomY + 6, w, h - (stageBottomY + 6));

    // Drop Shadow under the glacier shelf
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, stageBottomY + 6, w, 14);

    // Floating Ice Floes in the Abyss
    const drawIceFloe = (fx: number, fy: number, fw: number, fh: number) => {
      ctx.save();
      ctx.fillStyle = "#bae6fd";
      ctx.beginPath();
      ctx.ellipse(fx, fy, fw, fh, 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(fx - 2, fy - 2, fw * 0.8, fh * 0.7, 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawIceFloe(w * 0.12, h * 0.97, 45, 10);
    drawIceFloe(w * 0.35, h * 0.98, 60, 12);
    drawIceFloe(w * 0.65, h * 0.96, 50, 11);
    drawIceFloe(w * 0.88, h * 0.97, 55, 12);

    ctx.restore();
  }

  // =========================================================================
  // 6. VULCÃO INFERNAL (Painterly Stratovolcanoes, Calderas, Magma & Basalt)
  // =========================================================================
  private static drawLavaArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();

    // 1. APOCALYPTIC CRIMSON SKY & ATMOSPHERE
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.72);
    skyGrad.addColorStop(0, "#080204");
    skyGrad.addColorStop(0.20, "#190408");
    skyGrad.addColorStop(0.42, "#3b080c");
    skyGrad.addColorStop(0.65, "#771212");
    skyGrad.addColorStop(0.82, "#b91c1c");
    skyGrad.addColorStop(0.92, "#ea580c");
    skyGrad.addColorStop(1, "#f97316");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 1.1 Volcanic Ash & Smoke Plumes (Soft Volumetric Clouds)
    const drawSmokePuff = (cx: number, cy: number, r: number, alpha: number, glow: boolean) => {
      ctx.save();
      const pGrad = ctx.createRadialGradient(
        cx,
        cy + (glow ? r * 0.25 : 0),
        r * 0.1,
        cx,
        cy,
        r
      );
      if (glow) {
        pGrad.addColorStop(0, `rgba(255, 140, 40, ${alpha * 0.9})`);
        pGrad.addColorStop(0.35, `rgba(185, 28, 28, ${alpha * 0.75})`);
        pGrad.addColorStop(0.75, `rgba(35, 10, 12, ${alpha * 0.85})`);
        pGrad.addColorStop(1, "rgba(10, 2, 4, 0)");
      } else {
        pGrad.addColorStop(0, `rgba(45, 15, 18, ${alpha * 0.85})`);
        pGrad.addColorStop(0.6, `rgba(25, 8, 10, ${alpha * 0.7})`);
        pGrad.addColorStop(1, "rgba(5, 1, 2, 0)");
      }
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // Layered clouds filling the upper atmosphere
    const smokePuffs = [
      { x: w * 0.15, y: h * 0.22, r: 210, a: 0.85, g: true },
      { x: w * 0.32, y: h * 0.14, r: 170, a: 0.75, g: false },
      { x: w * 0.48, y: h * 0.10, r: 190, a: 0.80, g: true },
      { x: w * 0.70, y: h * 0.18, r: 230, a: 0.90, g: true },
      { x: w * 0.88, y: h * 0.12, r: 180, a: 0.75, g: false },
      { x: w * 0.28, y: h * 0.30, r: 140, a: 0.60, g: true },
      { x: w * 0.78, y: h * 0.28, r: 160, a: 0.65, g: true },
    ];
    for (const sp of smokePuffs) {
      drawSmokePuff(sp.x, sp.y, sp.r, sp.a, sp.g);
    }

    // 1.2 Fine Jagged Volcanic Lightning
    const drawVolcanicLightningFork = (startX: number, startY: number, length: number) => {
      ctx.save();
      ctx.strokeStyle = "#fffbeb";
      ctx.lineWidth = 2.2;
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 10;

      let cx = startX;
      let cy = startY;
      ctx.beginPath();
      ctx.moveTo(cx, cy);

      const steps = 14;
      for (let i = 0; i < steps; i++) {
        const segLen = length / steps;
        cx += (Math.random() - 0.48) * 26;
        cy += segLen * (0.8 + Math.random() * 0.4);
        ctx.lineTo(cx, cy);

        // Branching secondary spark
        if (i === 4 || i === 8) {
          ctx.save();
          ctx.strokeStyle = "#fed7aa";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + (i === 4 ? -28 : 32), cy + 22);
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.stroke();
      ctx.restore();
    };

    drawVolcanicLightningFork(w * 0.24, h * 0.04, 180);
    drawVolcanicLightningFork(w * 0.72, h * 0.06, 200);

    // 2. PAINTERLY STRATOVOLCANOES WITH NATURAL SLOPES & CALDERAS
    const drawRealisticVolcano = (
      centerX: number,
      calderaY: number,
      baseY: number,
      width: number,
      calderaWidth: number,
      isForeground: boolean
    ) => {
      ctx.save();
      const halfW = width / 2;
      const leftBase = centerX - halfW;
      const rightBase = centerX + halfW;
      const leftCaldera = centerX - calderaWidth / 2;
      const rightCaldera = centerX + calderaWidth / 2;

      // 2.1 Volcano Silhouette (Organic mountain slope curve)
      const slopePointsLeft: [number, number][] = [
        [leftBase, baseY],
        [leftBase + halfW * 0.25, baseY - (baseY - calderaY) * 0.18],
        [leftBase + halfW * 0.45, baseY - (baseY - calderaY) * 0.38],
        [leftBase + halfW * 0.65, baseY - (baseY - calderaY) * 0.62],
        [leftBase + halfW * 0.82, baseY - (baseY - calderaY) * 0.84],
        [leftCaldera, calderaY],
      ];

      const slopePointsRight: [number, number][] = [
        [rightCaldera, calderaY],
        [rightBase - halfW * 0.82, baseY - (baseY - calderaY) * 0.84],
        [rightBase - halfW * 0.65, baseY - (baseY - calderaY) * 0.62],
        [rightBase - halfW * 0.45, baseY - (baseY - calderaY) * 0.38],
        [rightBase - halfW * 0.25, baseY - (baseY - calderaY) * 0.18],
        [rightBase, baseY],
      ];

      // Base Mountain Body Fill
      const mtnGrad = ctx.createLinearGradient(centerX, calderaY, centerX, baseY);
      mtnGrad.addColorStop(0, "#2b060a");
      mtnGrad.addColorStop(0.35, "#1c0406");
      mtnGrad.addColorStop(0.70, "#120204");
      mtnGrad.addColorStop(1, "#0a0102");
      ctx.fillStyle = mtnGrad;

      ctx.beginPath();
      ctx.moveTo(slopePointsLeft[0][0], slopePointsLeft[0][1]);
      for (let i = 1; i < slopePointsLeft.length; i++) {
        ctx.lineTo(slopePointsLeft[i][0], slopePointsLeft[i][1]);
      }
      // Caldera Lip curve
      ctx.quadraticCurveTo(centerX, calderaY + 10, rightCaldera, calderaY);
      for (let i = 1; i < slopePointsRight.length; i++) {
        ctx.lineTo(slopePointsRight[i][0], slopePointsRight[i][1]);
      }
      ctx.closePath();
      ctx.fill();

      // 2.2 Rocky Ridge Strata & Mountain Facets (Light / Shadow 3D Form)
      // Left slope illuminated by fiery glow
      ctx.fillStyle = "rgba(185, 28, 28, 0.18)";
      ctx.beginPath();
      ctx.moveTo(centerX, calderaY + 10);
      for (const p of slopePointsLeft) {
        ctx.lineTo(p[0], p[1]);
      }
      ctx.closePath();
      ctx.fill();

      // Shaded crags and dark ravines
      ctx.strokeStyle = "rgba(10, 2, 4, 0.75)";
      ctx.lineWidth = 4;
      const ridges = [-0.6, -0.35, -0.15, 0.15, 0.35, 0.6];
      for (const r of ridges) {
        const sx = centerX + (calderaWidth * 0.4) * r;
        const ex = centerX + (halfW * 0.75) * r;
        ctx.beginPath();
        ctx.moveTo(sx, calderaY + 12);
        ctx.quadraticCurveTo(
          (sx + ex) / 2 + (r < 0 ? -25 : 25),
          calderaY + (baseY - calderaY) * 0.5,
          ex,
          baseY
        );
        ctx.stroke();
      }

      // 2.3 Caldera Crater Basin with Molten Boiling Lava Lake
      // Crater Rim Depth
      ctx.fillStyle = "#120204";
      ctx.beginPath();
      ctx.ellipse(centerX, calderaY + 4, calderaWidth * 0.52, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Magma Lake Reservoir
      const lakeGrad = ctx.createRadialGradient(
        centerX,
        calderaY + 5,
        2,
        centerX,
        calderaY + 5,
        calderaWidth * 0.48
      );
      lakeGrad.addColorStop(0, "#ffffff");
      lakeGrad.addColorStop(0.20, "#fef08a");
      lakeGrad.addColorStop(0.50, "#f97316");
      lakeGrad.addColorStop(0.82, "#dc2626");
      lakeGrad.addColorStop(1, "#450a0a");
      ctx.fillStyle = lakeGrad;
      ctx.beginPath();
      ctx.ellipse(centerX, calderaY + 5, calderaWidth * 0.46, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Volcanic Eruption Plume & Heat Aura over Crater
      const plumeGrad = ctx.createRadialGradient(
        centerX,
        calderaY - 30,
        10,
        centerX,
        calderaY - 30,
        calderaWidth * 1.5
      );
      plumeGrad.addColorStop(0, "rgba(255, 234, 140, 0.85)");
      plumeGrad.addColorStop(0.25, "rgba(249, 115, 22, 0.6)");
      plumeGrad.addColorStop(0.60, "rgba(185, 28, 28, 0.25)");
      plumeGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = plumeGrad;
      ctx.beginPath();
      ctx.arc(centerX, calderaY - 30, calderaWidth * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Billowing Smoke Column Rising from Crater
      drawSmokePuff(centerX - 15, calderaY - 50, calderaWidth * 0.65, 0.85, true);
      drawSmokePuff(centerX + 20, calderaY - 95, calderaWidth * 0.80, 0.75, true);
      drawSmokePuff(centerX - 10, calderaY - 150, calderaWidth * 1.05, 0.70, false);

      // 2.4 Natural Organic Meandering Lava Rivers (Braided & Branching)
      const drawOrganicLavaFlow = (
        startX: number,
        startY: number,
        points: { x: number; y: number; w: number }[]
      ) => {
        ctx.save();
        // Pass 1: Dark Burnt Crust Banks
        ctx.strokeStyle = "#450a0a";
        ctx.lineWidth = points[0].w + 8;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (const p of points) ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // Pass 2: Radiant Orange Magma Body
        ctx.strokeStyle = "#ea580c";
        ctx.lineWidth = points[0].w + 4;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (const p of points) ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // Pass 3: Molten Gold Center
        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = points[0].w;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (const p of points) ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // Pass 4: White-Hot Core Line
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(1.5, points[0].w * 0.4);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (const p of points) ctx.lineTo(p.x, p.y);
        ctx.stroke();

        ctx.restore();
      };

      // Main Lava Stream 1 (Left flank)
      drawOrganicLavaFlow(centerX - calderaWidth * 0.2, calderaY + 8, [
        { x: centerX - calderaWidth * 0.35, y: calderaY + (baseY - calderaY) * 0.25, w: 7 },
        { x: centerX - calderaWidth * 0.28, y: calderaY + (baseY - calderaY) * 0.50, w: 8 },
        { x: centerX - halfW * 0.38, y: calderaY + (baseY - calderaY) * 0.75, w: 9 },
        { x: centerX - halfW * 0.45, y: baseY, w: 10 },
      ]);

      // Tributary Stream (Branches off stream 1)
      drawOrganicLavaFlow(centerX - calderaWidth * 0.35, calderaY + (baseY - calderaY) * 0.25, [
        { x: centerX - halfW * 0.18, y: calderaY + (baseY - calderaY) * 0.48, w: 4.5 },
        { x: centerX - halfW * 0.22, y: calderaY + (baseY - calderaY) * 0.78, w: 5.5 },
        { x: centerX - halfW * 0.20, y: baseY, w: 6.5 },
      ]);

      // Main Lava Stream 2 (Right flank)
      drawOrganicLavaFlow(centerX + calderaWidth * 0.25, calderaY + 9, [
        { x: centerX + calderaWidth * 0.40, y: calderaY + (baseY - calderaY) * 0.30, w: 6.5 },
        { x: centerX + halfW * 0.30, y: calderaY + (baseY - calderaY) * 0.58, w: 7.5 },
        { x: centerX + halfW * 0.42, y: baseY, w: 9 },
      ]);

      ctx.restore();
    };

    // Background Volcano 1 (Left - Grand Stratovolcano)
    drawRealisticVolcano(w * 0.28, h * 0.32, h * 0.70, 780, 130, true);

    // Background Volcano 2 (Right - Massive Active Peak)
    drawRealisticVolcano(w * 0.76, h * 0.28, h * 0.70, 920, 150, true);

    // Distant Horizon Peak (Center)
    drawRealisticVolcano(w * 0.52, h * 0.45, h * 0.70, 460, 70, false);

    // 3. MIDGROUND BASALT CRAGS & VOLCANIC ROCK SPIRES
    const drawBasaltSpire = (cx: number, cy: number, spW: number, spH: number, tilt: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt);

      const spireGrad = ctx.createLinearGradient(-spW / 2, -spH, spW / 2, 0);
      spireGrad.addColorStop(0, "#2c070a");
      spireGrad.addColorStop(0.45, "#180406");
      spireGrad.addColorStop(1, "#0a0102");
      ctx.fillStyle = spireGrad;

      ctx.beginPath();
      ctx.moveTo(0, -spH);
      ctx.lineTo(spW * 0.35, -spH * 0.65);
      ctx.lineTo(spW * 0.5, 0);
      ctx.lineTo(-spW * 0.5, 0);
      ctx.lineTo(-spW * 0.3, -spH * 0.7);
      ctx.closePath();
      ctx.fill();

      // Rim light from surrounding magma
      ctx.strokeStyle = "rgba(249, 115, 22, 0.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -spH);
      ctx.lineTo(spW * 0.35, -spH * 0.65);
      ctx.lineTo(spW * 0.5, 0);
      ctx.stroke();

      ctx.restore();
    };

    // Framing Rock Formations
    drawBasaltSpire(w * 0.06, h * 0.70, 120, 260, -0.05);
    drawBasaltSpire(w * 0.15, h * 0.70, 90, 190, 0.04);
    drawBasaltSpire(w * 0.42, h * 0.70, 80, 150, -0.03);
    drawBasaltSpire(w * 0.62, h * 0.70, 95, 170, 0.05);
    drawBasaltSpire(w * 0.88, h * 0.70, 110, 230, -0.04);
    drawBasaltSpire(w * 0.96, h * 0.70, 130, 270, 0.06);

    // Cascading Lava Waterfalls
    const drawLavaFall = (lx: number, topY: number, botY: number, width: number) => {
      ctx.save();
      const lfGrad = ctx.createLinearGradient(lx, topY, lx, botY);
      lfGrad.addColorStop(0, "#fef08a");
      lfGrad.addColorStop(0.35, "#f97316");
      lfGrad.addColorStop(0.75, "#dc2626");
      lfGrad.addColorStop(1, "#991b1b");
      ctx.fillStyle = lfGrad;

      ctx.beginPath();
      ctx.moveTo(lx - width * 0.4, topY);
      ctx.lineTo(lx + width * 0.4, topY);
      ctx.lineTo(lx + width * 0.6, botY);
      ctx.lineTo(lx - width * 0.6, botY);
      ctx.closePath();
      ctx.fill();

      // Lava Flow Ribs
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      for (let s = -width * 0.25; s <= width * 0.25; s += 8) {
        ctx.beginPath();
        ctx.moveTo(lx + s, topY + 2);
        ctx.lineTo(lx + s * 1.3, botY - 2);
        ctx.stroke();
      }

      // Heat / Steam cloud at foot of waterfall
      const stGrad = ctx.createRadialGradient(lx, botY, 4, lx, botY, width * 1.8);
      stGrad.addColorStop(0, "rgba(254, 240, 138, 0.85)");
      stGrad.addColorStop(0.4, "rgba(249, 115, 22, 0.5)");
      stGrad.addColorStop(1, "rgba(20, 4, 6, 0)");
      ctx.fillStyle = stGrad;
      ctx.beginPath();
      ctx.arc(lx, botY, width * 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawLavaFall(w * 0.10, h * 0.58, h * 0.70, 32);
    drawLavaFall(w * 0.64, h * 0.59, h * 0.70, 36);

    // =========================================================================
    // 4. ARENA COMBAT FLOOR (Natural Volcanic Basalt Rock & Magma Fissures)
    // =========================================================================
    const stageTopY = h * 0.68;
    const stageBottomY = h * 0.94;
    const stageH = stageBottomY - stageTopY;

    // 4.1 Solid Dark Basalt Stone Platform Base
    const stoneFloorGrad = ctx.createLinearGradient(0, stageTopY, 0, stageBottomY);
    stoneFloorGrad.addColorStop(0, "#280709");
    stoneFloorGrad.addColorStop(0.20, "#190406");
    stoneFloorGrad.addColorStop(0.55, "#100204");
    stoneFloorGrad.addColorStop(0.85, "#0a0102");
    stoneFloorGrad.addColorStop(1, "#050101");
    ctx.fillStyle = stoneFloorGrad;
    ctx.fillRect(0, stageTopY, w, stageH);

    // 4.2 Natural Basalt Flagstone Grid & Depth Perspective (Textured Stone Joints)
    ctx.strokeStyle = "rgba(75, 15, 18, 0.65)";
    ctx.lineWidth = 2.5;

    // Perspective depth rows
    const stoneRows = [0, 0.12, 0.26, 0.44, 0.68, 1.0];
    for (const sr of stoneRows) {
      const fy = stageTopY + stageH * sr;
      ctx.beginPath();
      ctx.moveTo(0, fy);
      ctx.lineTo(w, fy);
      ctx.stroke();
    }

    // Perspective stone joints radiating from center horizon
    const vpX = w * 0.5;
    for (let tx = -200; tx <= w + 200; tx += 130) {
      ctx.beginPath();
      ctx.moveTo(vpX + (tx - vpX) * 0.75, stageTopY);
      ctx.lineTo(tx, stageBottomY);
      ctx.stroke();
    }

    // 4.3 Realistic Stone Texture & Chipped Obsidian Flecks
    for (let t = 0; t < 220; t++) {
      const tx = (t * 137 + 19) % w;
      const ty = stageTopY + ((t * 67 + 31) % stageH);
      const alpha = 0.15 + ((t * 29) % 35) / 100;
      ctx.fillStyle = t % 2 === 0 ? `rgba(255, 255, 255, ${alpha * 0.3})` : `rgba(0, 0, 0, ${alpha * 0.6})`;
      ctx.fillRect(tx, ty, (t % 3) + 2, (t % 2) + 1.5);
    }

    // 4.4 Intricate, Jagged Organic Magma Fissures (Molten lava glowing deep in cracks)
    const drawGroundMagmaFracture = (
      startX: number,
      startY: number,
      segments: { dx: number; dy: number; w: number }[]
    ) => {
      ctx.save();
      let cx = startX;
      let cy = startY;
      const path: [number, number][] = [[cx, cy]];
      for (const s of segments) {
        cx += s.dx;
        cy += s.dy;
        path.push([cx, cy]);
      }

      // Step 1: Intense Radiant Heat Glow Aura
      ctx.strokeStyle = "rgba(234, 88, 12, 0.45)";
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(path[0][0], path[0][1]);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1]);
      ctx.stroke();

      // Step 2: Dark Red Fissure Trench
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(path[0][0], path[0][1]);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1]);
      ctx.stroke();

      // Step 3: Bright Orange Magma
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(path[0][0], path[0][1]);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1]);
      ctx.stroke();

      // Step 4: Golden Yellow Molten Core
      ctx.strokeStyle = "#fef08a";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(path[0][0], path[0][1]);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1]);
      ctx.stroke();

      // Step 5: White Hot Center Line
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(path[0][0], path[0][1]);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1]);
      ctx.stroke();

      ctx.restore();
    };

    // Major Fissure Network across the combat floor
    drawGroundMagmaFracture(w * 0.12, stageTopY + 10, [
      { dx: 35, dy: 30, w: 6 },
      { dx: -20, dy: 45, w: 7 },
      { dx: 45, dy: 50, w: 8 },
      { dx: 25, dy: 60, w: 9 },
      { dx: -15, dy: 45, w: 8 },
    ]);

    drawGroundMagmaFracture(w * 0.38, stageTopY + 15, [
      { dx: -30, dy: 40, w: 7 },
      { dx: 50, dy: 55, w: 8 },
      { dx: -25, dy: 50, w: 9 },
      { dx: 40, dy: 65, w: 10 },
    ]);

    drawGroundMagmaFracture(w * 0.65, stageTopY + 12, [
      { dx: 45, dy: 45, w: 7 },
      { dx: -35, dy: 50, w: 8 },
      { dx: 30, dy: 60, w: 9 },
      { dx: 15, dy: 55, w: 8 },
    ]);

    drawGroundMagmaFracture(w * 0.85, stageTopY + 18, [
      { dx: -40, dy: 45, w: 6 },
      { dx: 35, dy: 55, w: 7 },
      { dx: -20, dy: 60, w: 8 },
      { dx: 30, dy: 50, w: 8 },
    ]);

    // Horizontal connecting micro-fissures
    drawGroundMagmaFracture(w * 0.28, stageTopY + stageH * 0.45, [
      { dx: 80, dy: -8, w: 4 },
      { dx: 70, dy: 14, w: 4.5 },
      { dx: 85, dy: -6, w: 4 },
    ]);

    drawGroundMagmaFracture(w * 0.52, stageTopY + stageH * 0.68, [
      { dx: 75, dy: 10, w: 5 },
      { dx: 85, dy: -12, w: 5 },
      { dx: 70, dy: 8, w: 4.5 },
    ]);

    // 4.5 Boiling Magma Vents & Blisters in the Floor
    const drawMagmaVent = (vx: number, vy: number, vr: number) => {
      ctx.save();
      // Heat aura
      const aGrad = ctx.createRadialGradient(vx, vy, 2, vx, vy, vr * 2);
      aGrad.addColorStop(0, "rgba(254, 240, 138, 0.9)");
      aGrad.addColorStop(0.4, "rgba(249, 115, 22, 0.6)");
      aGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = aGrad;
      ctx.beginPath();
      ctx.arc(vx, vy, vr * 2, 0, Math.PI * 2);
      ctx.fill();

      // Molten core
      const vGrad = ctx.createRadialGradient(vx - 2, vy - 2, 1, vx, vy, vr);
      vGrad.addColorStop(0, "#ffffff");
      vGrad.addColorStop(0.3, "#fef08a");
      vGrad.addColorStop(0.7, "#f97316");
      vGrad.addColorStop(1, "#991b1b");
      ctx.fillStyle = vGrad;
      ctx.beginPath();
      ctx.arc(vx, vy, vr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawMagmaVent(w * 0.22, stageTopY + stageH * 0.35, 9);
    drawMagmaVent(w * 0.48, stageTopY + stageH * 0.52, 12);
    drawMagmaVent(w * 0.74, stageTopY + stageH * 0.42, 10);
    drawMagmaVent(w * 0.32, stageTopY + stageH * 0.78, 14);
    drawMagmaVent(w * 0.82, stageTopY + stageH * 0.72, 11);

    // 4.6 Floating Fiery Sparks & Ash Particles across the Stage
    for (let e = 0; e < 100; e++) {
      const ex = (e * 103 + 27) % w;
      const ey = stageTopY + ((e * 41 + 19) % stageH);
      const alpha = 0.4 + ((e * 17) % 60) / 100;
      ctx.fillStyle = e % 3 === 0 ? `rgba(254, 240, 138, ${alpha})` : `rgba(249, 115, 22, ${alpha})`;
      ctx.fillRect(ex, ey, e % 4 === 0 ? 3 : 2, 2);
    }

    // 5. STAGE RIM: INCANDESCENT HEAT EDGE & VISCOUS DRIPPING MAGMA
    const rimGrad = ctx.createLinearGradient(0, stageBottomY - 8, 0, stageBottomY + 8);
    rimGrad.addColorStop(0, "#ffffff");
    rimGrad.addColorStop(0.2, "#fef08a");
    rimGrad.addColorStop(0.55, "#f97316");
    rimGrad.addColorStop(0.85, "#dc2626");
    rimGrad.addColorStop(1, "#450a0a");
    ctx.fillStyle = rimGrad;
    ctx.fillRect(0, stageBottomY - 8, w, 16);

    // Pure White Specular Highlight Edge
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, stageBottomY - 6, w, 2.5);

    // Dripping Molten Magma Stalactites along the Edge
    const drawMagmaDrip = (dx: number, dLen: number, dWid: number) => {
      ctx.save();
      const dGrad = ctx.createLinearGradient(dx, stageBottomY + 8, dx, stageBottomY + 8 + dLen);
      dGrad.addColorStop(0, "#ffffff");
      dGrad.addColorStop(0.25, "#fef08a");
      dGrad.addColorStop(0.65, "#f97316");
      dGrad.addColorStop(1, "rgba(220, 38, 38, 0.2)");
      ctx.fillStyle = dGrad;

      ctx.beginPath();
      ctx.moveTo(dx - dWid / 2, stageBottomY + 8);
      ctx.lineTo(dx + dWid / 2, stageBottomY + 8);
      ctx.lineTo(dx, stageBottomY + 8 + dLen);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    for (let dx = 12; dx < w; dx += 22) {
      const len = 10 + ((dx * 31) % 32);
      const wid = 6 + ((dx * 13) % 7);
      drawMagmaDrip(dx, len, wid);
    }

    // 6. BOTTOM MAGMA OCEAN ABYSS (Beneath Platform)
    const oceanGrad = ctx.createLinearGradient(0, stageBottomY + 8, 0, h);
    oceanGrad.addColorStop(0, "#f97316");
    oceanGrad.addColorStop(0.20, "#dc2626");
    oceanGrad.addColorStop(0.50, "#991b1b");
    oceanGrad.addColorStop(0.80, "#450a0a");
    oceanGrad.addColorStop(1, "#180406");
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, stageBottomY + 8, w, h - (stageBottomY + 8));

    // Floating Obsidian Crusts in the Abyss
    const drawCrustIsland = (ix: number, iy: number, iw: number, ih: number) => {
      ctx.save();
      ctx.fillStyle = "#1c0406";
      ctx.beginPath();
      ctx.ellipse(ix, iy, iw, ih, 0.03, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ea580c";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    };

    drawCrustIsland(w * 0.15, h * 0.97, 50, 10);
    drawCrustIsland(w * 0.45, h * 0.98, 65, 12);
    drawCrustIsland(w * 0.78, h * 0.97, 55, 11);

    ctx.restore();
  }

  // =========================================================================
  // 7. DESERTO ESQUECIDO (Grand Golden Pyramids, Dunes, Relics & Sun Temple)
  // =========================================================================
  private static drawDesertArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();

    // 1. MAJESTIC SOLAR TWILIGHT SKY & ATMOSPHERE
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.72);
    skyGrad.addColorStop(0, "#19082b");    // Deep indigo twilight zenith
    skyGrad.addColorStop(0.18, "#3e122b");  // Rich purple-terracotta
    skyGrad.addColorStop(0.38, "#7c2d12");  // Deep burnt sienna
    skyGrad.addColorStop(0.58, "#c2410c");  // Warm fiery terracotta
    skyGrad.addColorStop(0.75, "#d97706");  // Golden amber
    skyGrad.addColorStop(0.88, "#f59e0b");  // Radiant gold
    skyGrad.addColorStop(0.96, "#fde68a");  // Bright solar glow
    skyGrad.addColorStop(1, "#fffbeb");     // Horizon heat haze
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 1.1 Blazing Solar Disc with Volumetric Corona & God Rays
    const sunX = w * 0.28;
    const sunY = h * 0.22;

    // Atmospheric Sunburst Rays (God Rays)
    ctx.save();
    ctx.translate(sunX, sunY);
    for (let r = 0; r < 14; r++) {
      const angle = (r * Math.PI * 2) / 14 + 0.12;
      const rayGrad = ctx.createRadialGradient(0, 0, 30, 0, 0, 750);
      rayGrad.addColorStop(0, "rgba(255, 251, 235, 0.22)");
      rayGrad.addColorStop(0.3, "rgba(254, 240, 138, 0.12)");
      rayGrad.addColorStop(0.7, "rgba(245, 158, 11, 0.04)");
      rayGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 750, angle - 0.08, angle + 0.08);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Giant Luminous Sun Core
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 260);
    sunGrad.addColorStop(0, "#ffffff");
    sunGrad.addColorStop(0.18, "#fffbeb");
    sunGrad.addColorStop(0.38, "rgba(254, 240, 138, 0.85)");
    sunGrad.addColorStop(0.65, "rgba(245, 158, 11, 0.4)");
    sunGrad.addColorStop(0.85, "rgba(194, 65, 12, 0.15)");
    sunGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 260, 0, Math.PI * 2);
    ctx.fill();

    // Blinding Inner Solar Disc
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
    ctx.fill();

    // 1.2 Atmospheric Desert Dust Clouds & Mirage Heat Waves
    const drawDustCloud = (cx: number, cy: number, rx: number, ry: number, alpha: number) => {
      ctx.save();
      const dGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, rx);
      dGrad.addColorStop(0, `rgba(254, 215, 170, ${alpha * 0.8})`);
      dGrad.addColorStop(0.4, `rgba(217, 119, 6, ${alpha * 0.5})`);
      dGrad.addColorStop(0.75, `rgba(124, 45, 18, ${alpha * 0.25})`);
      dGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = dGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawDustCloud(w * 0.18, h * 0.16, 220, 80, 0.45);
    drawDustCloud(w * 0.45, h * 0.28, 280, 90, 0.35);
    drawDustCloud(w * 0.72, h * 0.18, 250, 75, 0.40);
    drawDustCloud(w * 0.88, h * 0.26, 190, 70, 0.30);

    // Floating Golden Solar Dust Motes
    for (let i = 0; i < 90; i++) {
      const mx = (i * 137 + 43) % w;
      const my = (i * 79 + 17) % (h * 0.65);
      const mr = 1.2 + ((i * 11) % 4) * 0.6;
      const mAlpha = 0.25 + ((i * 23) % 65) / 100;
      ctx.fillStyle = i % 2 === 0 ? `rgba(255, 255, 255, ${mAlpha})` : `rgba(254, 240, 138, ${mAlpha})`;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. DISTANT SANDSTONE MESAS & CANYON BUTTES (Deep Horizon Layer)
    const drawSedimentaryMesa = (
      bx: number,
      by: number,
      bw: number,
      bh: number,
      slope: number
    ) => {
      ctx.save();
      const mGrad = ctx.createLinearGradient(bx, by - bh, bx, by);
      mGrad.addColorStop(0, "#9a3412");
      mGrad.addColorStop(0.3, "#7c2d12");
      mGrad.addColorStop(0.65, "#571c0d");
      mGrad.addColorStop(1, "#3c1208");
      ctx.fillStyle = mGrad;

      const topW = bw * (1 - slope);
      ctx.beginPath();
      ctx.moveTo(bx - bw / 2, by);
      ctx.lineTo(bx - topW / 2, by - bh);
      ctx.lineTo(bx + topW / 2, by - bh);
      ctx.lineTo(bx + bw / 2, by);
      ctx.closePath();
      ctx.fill();

      // Geological Sedimentary Strata Lines
      ctx.lineWidth = 2;
      const numStrata = 6;
      for (let s = 1; s < numStrata; s++) {
        const sy = by - (bh * s) / numStrata;
        const curW = bw - (bw - topW) * (s / numStrata);
        ctx.strokeStyle = s % 2 === 0 ? "rgba(217, 119, 6, 0.4)" : "rgba(30, 9, 5, 0.6)";
        ctx.beginPath();
        ctx.moveTo(bx - curW / 2 + 5, sy);
        ctx.lineTo(bx + curW / 2 - 5, sy);
        ctx.stroke();
      }

      // Sunlit rim highlight on top & left edge
      ctx.strokeStyle = "rgba(254, 215, 170, 0.65)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bx - bw / 2, by);
      ctx.lineTo(bx - topW / 2, by - bh);
      ctx.lineTo(bx + topW / 2, by - bh);
      ctx.stroke();
      ctx.restore();
    };

    drawSedimentaryMesa(w * 0.08, h * 0.62, 280, 160, 0.35);
    drawSedimentaryMesa(w * 0.44, h * 0.64, 220, 120, 0.30);
    drawSedimentaryMesa(w * 0.94, h * 0.63, 320, 180, 0.38);

    // Natural Desert Stone Arch (Far Right Horizon)
    const drawDesertArch = (ax: number, ay: number, aw: number, ah: number) => {
      ctx.save();
      const aGrad = ctx.createLinearGradient(ax, ay - ah, ax, ay);
      aGrad.addColorStop(0, "#7c2d12");
      aGrad.addColorStop(0.5, "#571c0d");
      aGrad.addColorStop(1, "#3c1208");
      ctx.fillStyle = aGrad;

      ctx.beginPath();
      ctx.moveTo(ax - aw / 2, ay);
      ctx.lineTo(ax - aw / 2, ay - ah * 0.7);
      ctx.quadraticCurveTo(ax, ay - ah * 1.15, ax + aw / 2, ay - ah * 0.7);
      ctx.lineTo(ax + aw / 2, ay);
      ctx.lineTo(ax + aw * 0.28, ay);
      ctx.lineTo(ax + aw * 0.28, ay - ah * 0.55);
      ctx.quadraticCurveTo(ax, ay - ah * 0.85, ax - aw * 0.28, ay - ah * 0.55);
      ctx.lineTo(ax - aw * 0.28, ay);
      ctx.closePath();
      ctx.fill();

      // Sunlit rim
      ctx.strokeStyle = "rgba(254, 215, 170, 0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ax - aw / 2, ay - ah * 0.7);
      ctx.quadraticCurveTo(ax, ay - ah * 1.15, ax + aw / 2, ay - ah * 0.7);
      ctx.stroke();
      ctx.restore();
    };

    drawDesertArch(w * 0.86, h * 0.62, 160, 130);

    // 3. MONUMENTAL GREAT PYRAMIDS & ANCIENT RUINS
    // 3.1 Grand Pyramid of the Sun Pharaoh (Main Center-Left)
    const drawMasterPyramid = (
      px: number,
      py: number,
      width: number,
      height: number,
      hasGoldApex: boolean
    ) => {
      ctx.save();
      const apexX = px;
      const apexY = py - height;
      const leftBaseX = px - width * 0.55;
      const rightBaseX = px + width * 0.55;
      const centerBaseX = px + width * 0.04; // Ridge slightly tilted for dramatic 3D perspective

      // Left Face (Sunlit golden sandstone)
      const sunlitGrad = ctx.createLinearGradient(leftBaseX, py, apexX, apexY);
      sunlitGrad.addColorStop(0, "#d97706");
      sunlitGrad.addColorStop(0.35, "#f59e0b");
      sunlitGrad.addColorStop(0.7, "#fbbf24");
      sunlitGrad.addColorStop(1, "#fde68a");
      ctx.fillStyle = sunlitGrad;

      ctx.beginPath();
      ctx.moveTo(apexX, apexY);
      ctx.lineTo(leftBaseX, py);
      ctx.lineTo(centerBaseX, py);
      ctx.closePath();
      ctx.fill();

      // Right Face (Deep terracotta shadow)
      const shadowGrad = ctx.createLinearGradient(centerBaseX, py, rightBaseX, py);
      shadowGrad.addColorStop(0, "#7c2d12");
      shadowGrad.addColorStop(0.4, "#571c0d");
      shadowGrad.addColorStop(0.8, "#3c1208");
      shadowGrad.addColorStop(1, "#200a04");
      ctx.fillStyle = shadowGrad;

      ctx.beginPath();
      ctx.moveTo(apexX, apexY);
      ctx.lineTo(centerBaseX, py);
      ctx.lineTo(rightBaseX, py);
      ctx.closePath();
      ctx.fill();

      // Horizontal Masonry Block Strata (Tiered courses of sandstone blocks)
      const blockCourses = 18;
      for (let c = 1; c < blockCourses; c++) {
        const ratio = c / blockCourses;
        const cy = py - height * (1 - ratio);
        const lX = leftBaseX + (apexX - leftBaseX) * (1 - ratio);
        const cX = centerBaseX + (apexX - centerBaseX) * (1 - ratio);
        const rX = rightBaseX + (apexX - rightBaseX) * (1 - ratio);

        // Sunlit block joint
        ctx.strokeStyle = "rgba(180, 83, 9, 0.45)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(lX, cy);
        ctx.lineTo(cX, cy);
        ctx.stroke();

        // Shadow block joint
        ctx.strokeStyle = "rgba(15, 4, 2, 0.55)";
        ctx.beginPath();
        ctx.moveTo(cX, cy);
        ctx.lineTo(rX, cy);
        ctx.stroke();
      }

      // Central Chiseled Ridge Line
      ctx.strokeStyle = "rgba(255, 251, 235, 0.85)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(apexX, apexY);
      ctx.lineTo(centerBaseX, py);
      ctx.stroke();

      // Gleaming Electrum / Solid Gold Pyramidion (Capstone)
      if (hasGoldApex) {
        const capH = height * 0.14;
        const capApexY = apexY;
        const capBaseY = apexY + capH;
        const capRatio = capH / height;
        const capLeftX = apexX - (apexX - leftBaseX) * capRatio;
        const capCenterX = apexX + (centerBaseX - apexX) * capRatio;
        const capRightX = apexX + (rightBaseX - apexX) * capRatio;

        // Gold sunlit left
        const goldLit = ctx.createLinearGradient(capLeftX, capBaseY, apexX, capApexY);
        goldLit.addColorStop(0, "#f59e0b");
        goldLit.addColorStop(0.5, "#fef08a");
        goldLit.addColorStop(1, "#ffffff");
        ctx.fillStyle = goldLit;
        ctx.beginPath();
        ctx.moveTo(apexX, capApexY);
        ctx.lineTo(capLeftX, capBaseY);
        ctx.lineTo(capCenterX, capBaseY);
        ctx.closePath();
        ctx.fill();

        // Gold shadow right
        const goldShad = ctx.createLinearGradient(capCenterX, capBaseY, capRightX, capBaseY);
        goldShad.addColorStop(0, "#d97706");
        goldShad.addColorStop(1, "#92400e");
        ctx.fillStyle = goldShad;
        ctx.beginPath();
        ctx.moveTo(apexX, capApexY);
        ctx.lineTo(capCenterX, capBaseY);
        ctx.lineTo(capRightX, capBaseY);
        ctx.closePath();
        ctx.fill();

        // Brilliant Solar Lens Flare on Apex
        const flareGrad = ctx.createRadialGradient(apexX, apexY, 2, apexX, apexY, 45);
        flareGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
        flareGrad.addColorStop(0.3, "rgba(254, 240, 138, 0.8)");
        flareGrad.addColorStop(0.7, "rgba(245, 158, 11, 0.3)");
        flareGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = flareGrad;
        ctx.beginPath();
        ctx.arc(apexX, apexY, 45, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    // Distant Grand Pyramid (Right-Center)
    drawMasterPyramid(w * 0.68, h * 0.68, 520, 290, true);

    // Midground Grand Pyramid (Left)
    drawMasterPyramid(w * 0.34, h * 0.69, 640, 360, true);

    // Far Distant Smaller Pyramid (Far Left)
    drawMasterPyramid(w * 0.12, h * 0.67, 340, 190, false);

    // 3.2 Distant Ancient Step-Ziggurat / Terraced Sanctuary (Center)
    const drawStepZiggurat = (zx: number, zy: number, zw: number, zh: number) => {
      ctx.save();
      const tiers = 5;
      for (let t = 0; t < tiers; t++) {
        const tw = zw * (1 - t * 0.16);
        const th = zh / tiers;
        const ty = zy - t * th;

        // Sunlit left half
        ctx.fillStyle = "#d97706";
        ctx.fillRect(zx - tw / 2, ty - th, tw * 0.52, th);

        // Shadowed right half
        ctx.fillStyle = "#571c0d";
        ctx.fillRect(zx, ty - th, tw * 0.5, th);

        // Tier top rim highlight
        ctx.fillStyle = "#fde68a";
        ctx.fillRect(zx - tw / 2, ty - th, tw, 2.5);
      }

      // Temple Sanctuary at Peak
      const topW = zw * 0.25;
      const topY = zy - zh;
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(zx - topW / 2, topY - 20, topW, 20);
      ctx.fillStyle = "#1e0905";
      ctx.fillRect(zx - 6, topY - 14, 12, 14); // Dark sanctuary portal
      ctx.restore();
    };

    drawStepZiggurat(w * 0.52, h * 0.68, 200, 110);

    // 3.3 Colossal Ancient Warrior Pharaoh Statue / Colossus Head (Half-Buried in Dunes)
    const drawColossusPharaohHead = (hx: number, hy: number, scale: number) => {
      ctx.save();
      ctx.translate(hx, hy);
      ctx.scale(scale, scale);

      // Nemes Headdress (Royal striped hood)
      const nGrad = ctx.createLinearGradient(-40, -90, 40, 0);
      nGrad.addColorStop(0, "#d97706");
      nGrad.addColorStop(0.5, "#b45309");
      nGrad.addColorStop(1, "#571c0d");
      ctx.fillStyle = nGrad;

      ctx.beginPath();
      ctx.moveTo(-50, 0);
      ctx.lineTo(-45, -60);
      ctx.quadraticCurveTo(0, -95, 45, -60);
      ctx.lineTo(50, 0);
      ctx.closePath();
      ctx.fill();

      // Headdress gold stripes
      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = 3;
      for (let s = -70; s <= -20; s += 12) {
        ctx.beginPath();
        ctx.arc(0, -50, 40, (s * Math.PI) / 180, ((s + 6) * Math.PI) / 180);
        ctx.stroke();
      }

      // Carved Stone Face (Serene weathered Egyptian features)
      const fGrad = ctx.createLinearGradient(-30, -70, 30, 0);
      fGrad.addColorStop(0, "#f59e0b");
      fGrad.addColorStop(0.5, "#d97706");
      fGrad.addColorStop(1, "#7c2d12");
      ctx.fillStyle = fGrad;

      ctx.beginPath();
      ctx.moveTo(-25, -65);
      ctx.quadraticCurveTo(0, -70, 25, -65);
      ctx.lineTo(22, -15);
      ctx.quadraticCurveTo(0, 0, -22, -15);
      ctx.closePath();
      ctx.fill();

      // Face Shadow (Right half)
      ctx.fillStyle = "rgba(60, 18, 8, 0.45)";
      ctx.beginPath();
      ctx.moveTo(0, -68);
      ctx.lineTo(25, -65);
      ctx.lineTo(22, -15);
      ctx.quadraticCurveTo(10, -5, 0, 0);
      ctx.closePath();
      ctx.fill();

      // Carved Eyes, Brow & Royal Beard
      ctx.fillStyle = "#3c1208";
      // Left eye
      ctx.fillRect(-18, -48, 12, 4);
      // Right eye (shaded)
      ctx.fillRect(6, -48, 12, 4);
      // Nose ridge
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(-2, -50, 4, 24);
      // Lips
      ctx.fillStyle = "#571c0d";
      ctx.fillRect(-10, -20, 20, 5);

      // Uraeus (Royal Cobra Crest on forehead)
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(0, -75, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    drawColossusPharaohHead(w * 0.82, h * 0.69, 1.15);

    // 3.4 Standing Ancient Obelisks with Glowing Hieroglyphs
    const drawAncientObelisk = (
      ox: number,
      oy: number,
      ow: number,
      oh: number,
      tilt: number
    ) => {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(tilt);

      const topW = ow * 0.65;
      const pyramidionH = ow * 1.4;

      // Shaft body (Sunlit Left)
      const oGrad = ctx.createLinearGradient(-ow / 2, 0, ow / 2, 0);
      oGrad.addColorStop(0, "#f59e0b");
      oGrad.addColorStop(0.48, "#d97706");
      oGrad.addColorStop(0.52, "#7c2d12");
      oGrad.addColorStop(1, "#3c1208");
      ctx.fillStyle = oGrad;

      ctx.beginPath();
      ctx.moveTo(-ow / 2, 0);
      ctx.lineTo(-topW / 2, -oh + pyramidionH);
      ctx.lineTo(0, -oh); // Apex of pyramidion
      ctx.lineTo(topW / 2, -oh + pyramidionH);
      ctx.lineTo(ow / 2, 0);
      ctx.closePath();
      ctx.fill();

      // Gold Pyramidion Cap
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.moveTo(-topW / 2, -oh + pyramidionH);
      ctx.lineTo(0, -oh);
      ctx.lineTo(0, -oh + pyramidionH);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.moveTo(0, -oh);
      ctx.lineTo(topW / 2, -oh + pyramidionH);
      ctx.lineTo(0, -oh + pyramidionH);
      ctx.closePath();
      ctx.fill();

      // Glowing Arcane Solar Runes & Hieroglyphs
      ctx.fillStyle = "#fef08a";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 8;
      for (let g = 0; g < 7; g++) {
        const gy = -oh * 0.2 - g * (oh * 0.1);
        ctx.fillRect(-3, gy, 6, 8);
        if (g % 2 === 0) {
          ctx.beginPath();
          ctx.arc(0, gy - 4, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    };

    drawAncientObelisk(w * 0.16, h * 0.69, 28, 220, -0.03);
    drawAncientObelisk(w * 0.22, h * 0.69, 22, 170, 0.05);

    // 3.5 Distant Mirage Oasis (Shimmering Blue Water & Silhouetted Date Palms)
    const drawMirageOasis = (ox: number, oy: number, oWidth: number) => {
      ctx.save();
      // Shimmering blue-cyan mirage pool
      const poolGrad = ctx.createLinearGradient(ox - oWidth / 2, oy, ox + oWidth / 2, oy);
      poolGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
      poolGrad.addColorStop(0.3, "rgba(125, 211, 252, 0.75)");
      poolGrad.addColorStop(0.5, "rgba(224, 242, 254, 0.9)");
      poolGrad.addColorStop(0.7, "rgba(56, 189, 248, 0.75)");
      poolGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = poolGrad;
      ctx.beginPath();
      ctx.ellipse(ox, oy, oWidth / 2, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Date Palm Trees (Swaying silhouetted trunks & fronds)
      const drawPalmTree = (px: number, py: number, pHeight: number, bend: number) => {
        ctx.save();
        ctx.strokeStyle = "#3c1208";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px + bend * 0.6, py - pHeight * 0.5, px + bend, py - pHeight);
        ctx.stroke();

        // Palm Fronds (Feathery leaves radiating from top)
        const topX = px + bend;
        const topY = py - pHeight;
        ctx.strokeStyle = "#2d5a27"; // Desert date palm green
        ctx.lineWidth = 2.5;
        for (let a = -0.8; a <= 0.8; a += 0.25) {
          const frondLen = 22;
          const endX = topX + Math.cos(a * Math.PI) * frondLen;
          const endY = topY + Math.sin(a * Math.PI) * frondLen * 0.7 + (Math.abs(a) * 8);
          ctx.beginPath();
          ctx.moveTo(topX, topY);
          ctx.quadraticCurveTo((topX + endX) / 2, topY - 6, endX, endY);
          ctx.stroke();
        }
        ctx.restore();
      };

      drawPalmTree(ox - 35, oy, 65, -14);
      drawPalmTree(ox - 10, oy, 75, 12);
      drawPalmTree(ox + 25, oy, 58, 16);
      ctx.restore();
    };

    drawMirageOasis(w * 0.48, h * 0.68, 160);

    // 4. ROLLING BARCHAN SAND DUNES (Organic Midground Erg Sea)
    const drawOrganicDune = (
      crestStartX: number,
      crestStartY: number,
      crestPeakX: number,
      crestPeakY: number,
      crestEndX: number,
      crestEndY: number,
      baseY: number,
      sunlitColor: string,
      shadowColor: string
    ) => {
      ctx.save();

      // Sunlit Windward Slope
      ctx.fillStyle = sunlitColor;
      ctx.beginPath();
      ctx.moveTo(crestStartX, crestStartY);
      ctx.quadraticCurveTo(crestPeakX, crestPeakY, crestEndX, crestEndY);
      ctx.lineTo(crestEndX, baseY);
      ctx.lineTo(crestStartX, baseY);
      ctx.closePath();
      ctx.fill();

      // Shadow Leeward Slope
      const sGrad = ctx.createLinearGradient(crestPeakX, crestPeakY, crestPeakX + 200, baseY);
      sGrad.addColorStop(0, shadowColor);
      sGrad.addColorStop(1, "#3c1208");
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.moveTo(crestPeakX, crestPeakY);
      ctx.quadraticCurveTo((crestPeakX + crestEndX) / 2 + 40, (crestPeakY + crestEndY) / 2 - 10, crestEndX, crestEndY);
      ctx.lineTo(crestEndX, baseY);
      ctx.lineTo(crestPeakX, baseY);
      ctx.closePath();
      ctx.fill();

      // Knife-edge Crest Ridge (Bright specular sunlit rim)
      ctx.strokeStyle = "#fffbeb";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(crestStartX, crestStartY);
      ctx.quadraticCurveTo(crestPeakX, crestPeakY, crestEndX, crestEndY);
      ctx.stroke();

      // Fine Wind-Ripple Texture along the dune slope
      ctx.strokeStyle = "rgba(180, 83, 9, 0.25)";
      ctx.lineWidth = 1.4;
      for (let r = crestPeakY + 15; r < baseY; r += 16) {
        ctx.beginPath();
        ctx.moveTo(crestStartX, r);
        for (let rx = crestStartX; rx <= crestEndX; rx += 45) {
          ctx.lineTo(rx, r + Math.sin(rx * 0.03) * 4);
        }
        ctx.stroke();
      }

      ctx.restore();
    };

    // Far Dune Ridge 1
    drawOrganicDune(-100, h * 0.68, w * 0.32, h * 0.60, w * 0.75, h * 0.70, h * 0.75, "#f59e0b", "#9a3412");

    // Mid Dune Ridge 2 (Sweeping from right)
    drawOrganicDune(w * 0.25, h * 0.70, w * 0.78, h * 0.62, w + 120, h * 0.70, h * 0.75, "#fbbf24", "#7c2d12");

    // Near Dune Ridge 3 (Foreground framing wave)
    drawOrganicDune(-50, h * 0.71, w * 0.18, h * 0.66, w * 0.55, h * 0.72, h * 0.75, "#fde68a", "#b45309");

    // =========================================================================
    // 5. COMBAT ARENA FLOOR (Imperial Sandstone Sun Temple Platform)
    // =========================================================================
    const stageTopY = h * 0.68;
    const stageBottomY = h * 0.94;
    const stageH = stageBottomY - stageTopY;

    // 5.1 Base Ancient Sandstone Platform Gradient
    const floorGrad = ctx.createLinearGradient(0, stageTopY, 0, stageBottomY);
    floorGrad.addColorStop(0, "#d97706");  // Warm golden ochre top
    floorGrad.addColorStop(0.25, "#b45309"); // Sandstone midtone
    floorGrad.addColorStop(0.60, "#78350f"); // Aged terracotta depth
    floorGrad.addColorStop(0.85, "#451a03"); // Deep earthen foundation
    floorGrad.addColorStop(1, "#280f02");    // Shadow base
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, stageTopY, w, stageH);

    // 5.2 Megalithic Sandstone Flagstones in Perspective with Mortar Joints
    ctx.strokeStyle = "rgba(40, 15, 2, 0.75)";
    ctx.lineWidth = 3;

    // Perspective depth horizontal rows
    const stoneRows = [0, 0.10, 0.24, 0.42, 0.65, 1.0];
    for (const sr of stoneRows) {
      const fy = stageTopY + stageH * sr;
      ctx.beginPath();
      ctx.moveTo(0, fy);
      ctx.lineTo(w, fy);
      ctx.stroke();

      // Top edge bevel highlight
      ctx.strokeStyle = "rgba(254, 240, 138, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, fy + 2);
      ctx.lineTo(w, fy + 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(40, 15, 2, 0.75)";
      ctx.lineWidth = 3;
    }

    // Perspective stone joints radiating from center horizon
    const vpX = w * 0.5;
    for (let tx = -200; tx <= w + 200; tx += 140) {
      ctx.beginPath();
      ctx.moveTo(vpX + (tx - vpX) * 0.75, stageTopY);
      ctx.lineTo(tx, stageBottomY);
      ctx.stroke();
    }

    // 5.3 Ancient Sun Altar Mosaic Medallion (Center of Combat Platform)
    const medalX = w * 0.5;
    const medalY = stageTopY + stageH * 0.48;
    const medalR = 150;

    // Outer Relief Ring
    ctx.save();
    ctx.strokeStyle = "#fef08a";
    ctx.lineWidth = 5;
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(medalX, medalY, medalR, medalR * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Concentric Ring
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(medalX, medalY, medalR * 0.7, medalR * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 8 Radiating Sun Rays / Dial Spikes
    ctx.strokeStyle = "#fde68a";
    ctx.lineWidth = 2.5;
    for (let s = 0; s < 8; s++) {
      const rad = (s * Math.PI) / 4;
      const x1 = medalX + Math.cos(rad) * (medalR * 0.35);
      const y1 = medalY + Math.sin(rad) * (medalR * 0.14);
      const x2 = medalX + Math.cos(rad) * (medalR * 0.95);
      const y2 = medalY + Math.sin(rad) * (medalR * 0.38);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Glowing Solar Emblem Core
    const coreGrad = ctx.createRadialGradient(medalX, medalY, 2, medalX, medalY, medalR * 0.3);
    coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    coreGrad.addColorStop(0.4, "rgba(254, 240, 138, 0.65)");
    coreGrad.addColorStop(0.8, "rgba(245, 158, 11, 0.25)");
    coreGrad.addColorStop(1, "rgba(217, 119, 6, 0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.ellipse(medalX, medalY, medalR * 0.3, medalR * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5.4 Windblown Sand Drifts Sweeping Over Stone Platform Corners
    const drawSandDriftPatch = (
      sx: number,
      sy: number,
      sw: number,
      sh: number,
      angle: number
    ) => {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle);

      const dGrad = ctx.createLinearGradient(0, -sh, 0, sh);
      dGrad.addColorStop(0, "#fde68a");
      dGrad.addColorStop(0.4, "#f59e0b");
      dGrad.addColorStop(0.8, "#d97706");
      dGrad.addColorStop(1, "rgba(180, 83, 9, 0)");
      ctx.fillStyle = dGrad;

      ctx.beginPath();
      ctx.moveTo(-sw / 2, sh);
      ctx.quadraticCurveTo(0, -sh * 1.2, sw / 2, sh);
      ctx.closePath();
      ctx.fill();

      // Ripples
      ctx.strokeStyle = "rgba(180, 83, 9, 0.4)";
      ctx.lineWidth = 1.5;
      for (let ry = -sh * 0.6; ry <= sh * 0.6; ry += 12) {
        ctx.beginPath();
        ctx.moveTo(-sw * 0.4, ry);
        ctx.quadraticCurveTo(0, ry - 6, sw * 0.4, ry);
        ctx.stroke();
      }
      ctx.restore();
    };

    drawSandDriftPatch(w * 0.08, stageTopY + stageH * 0.25, 240, 60, 0.06);
    drawSandDriftPatch(w * 0.88, stageTopY + stageH * 0.30, 260, 70, -0.05);
    drawSandDriftPatch(w * 0.28, stageBottomY - 15, 200, 50, -0.03);
    drawSandDriftPatch(w * 0.72, stageBottomY - 20, 220, 55, 0.04);

    // 5.5 Weathered Stone Braziers with Eternal Golden Flame (Stage Accents)
    const drawTempleBrazier = (bx: number, by: number) => {
      ctx.save();
      // Stone Pedestal
      const pGrad = ctx.createLinearGradient(bx - 20, by - 60, bx + 20, by);
      pGrad.addColorStop(0, "#d97706");
      pGrad.addColorStop(0.5, "#78350f");
      pGrad.addColorStop(1, "#3c1208");
      ctx.fillStyle = pGrad;

      ctx.beginPath();
      ctx.moveTo(bx - 14, by);
      ctx.lineTo(bx - 10, by - 40);
      ctx.lineTo(bx - 24, by - 55);
      ctx.lineTo(bx + 24, by - 55);
      ctx.lineTo(bx + 10, by - 40);
      ctx.lineTo(bx + 14, by);
      ctx.closePath();
      ctx.fill();

      // Brazier Basin Bowl
      ctx.fillStyle = "#280f02";
      ctx.beginPath();
      ctx.ellipse(bx, by - 55, 24, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eternal Solar Flame
      const fGrad = ctx.createRadialGradient(bx, by - 65, 3, bx, by - 65, 35);
      fGrad.addColorStop(0, "#ffffff");
      fGrad.addColorStop(0.25, "#fef08a");
      fGrad.addColorStop(0.6, "#f59e0b");
      fGrad.addColorStop(0.85, "#ea580c");
      fGrad.addColorStop(1, "rgba(220, 38, 38, 0)");
      ctx.fillStyle = fGrad;

      ctx.beginPath();
      ctx.moveTo(bx - 18, by - 55);
      ctx.quadraticCurveTo(bx - 20, by - 80, bx, by - 105);
      ctx.quadraticCurveTo(bx + 20, by - 80, bx + 18, by - 55);
      ctx.closePath();
      ctx.fill();

      // Floating Sparks
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(bx - 4, by - 110, 3, 3);
      ctx.fillRect(bx + 6, by - 120, 2, 2);
      ctx.fillRect(bx - 8, by - 118, 2, 2);

      ctx.restore();
    };

    drawTempleBrazier(w * 0.05, stageTopY + stageH * 0.45);
    drawTempleBrazier(w * 0.95, stageTopY + stageH * 0.45);

    // 5.6 Ancient Giant Beast Skeleton / Dragon Bones Half-Buried in Sand (Foreground Left)
    const drawDragonBones = (bx: number, by: number) => {
      ctx.save();
      ctx.strokeStyle = "#fef3c7"; // Weathered ivory bone
      ctx.fillStyle = "#faebd7";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";

      // Curved Rib Bones
      for (let r = 0; r < 5; r++) {
        const rx = bx + r * 16;
        const rh = 45 - r * 5;
        ctx.beginPath();
        ctx.moveTo(rx, by);
        ctx.quadraticCurveTo(rx - 12, by - rh, rx + 8, by - rh * 1.1);
        ctx.stroke();
      }

      // Horned Beast Skull
      ctx.beginPath();
      ctx.moveTo(bx - 30, by);
      ctx.lineTo(bx - 20, by - 28);
      ctx.lineTo(bx + 5, by - 18);
      ctx.lineTo(bx + 15, by);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Curved Horn
      ctx.beginPath();
      ctx.moveTo(bx - 18, by - 25);
      ctx.quadraticCurveTo(bx - 40, by - 45, bx - 30, by - 60);
      ctx.stroke();

      // Dark Eye Socket
      ctx.fillStyle = "#280f02";
      ctx.beginPath();
      ctx.ellipse(bx - 8, by - 16, 6, 4, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    drawDragonBones(w * 0.15, stageBottomY - 12);

    // 5.7 Desert Cacti & Flowering Succulents (Foreground Right)
    const drawDesertSaguaro = (cx: number, cy: number, scale: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);

      // Main Trunk
      const cGrad = ctx.createLinearGradient(-12, -90, 12, 0);
      cGrad.addColorStop(0, "#4d7c0f");
      cGrad.addColorStop(0.5, "#365314");
      cGrad.addColorStop(1, "#1a2e05");
      ctx.fillStyle = cGrad;

      ctx.beginPath();
      ctx.roundRect(-10, -90, 20, 90, [10, 10, 0, 0]);
      ctx.fill();

      // Left Arm
      ctx.beginPath();
      ctx.moveTo(-10, -45);
      ctx.lineTo(-28, -45);
      ctx.quadraticCurveTo(-34, -45, -34, -55);
      ctx.lineTo(-34, -75);
      ctx.quadraticCurveTo(-34, -85, -24, -85);
      ctx.quadraticCurveTo(-14, -85, -14, -75);
      ctx.lineTo(-14, -60);
      ctx.lineTo(-10, -60);
      ctx.closePath();
      ctx.fill();

      // Right Arm
      ctx.beginPath();
      ctx.moveTo(10, -35);
      ctx.lineTo(28, -35);
      ctx.quadraticCurveTo(34, -35, 34, -45);
      ctx.lineTo(34, -65);
      ctx.quadraticCurveTo(34, -75, 24, -75);
      ctx.quadraticCurveTo(14, -75, 14, -65);
      ctx.lineTo(14, -50);
      ctx.lineTo(10, -50);
      ctx.closePath();
      ctx.fill();

      // Vertical Rib Lines
      ctx.strokeStyle = "rgba(163, 230, 53, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-4, -85);
      ctx.lineTo(-4, 0);
      ctx.moveTo(4, -85);
      ctx.lineTo(4, 0);
      ctx.stroke();

      // Vibrant Ruby Blossom on Top
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(0, -92, 5, 0, Math.PI * 2);
      ctx.arc(-24, -87, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawDesertSaguaro(w * 0.88, stageBottomY - 10, 1.1);

    // 5.8 Scattered Relic Urns & Spilled Ancient Gold Coins
    const drawSpilledTreasures = (tx: number, ty: number) => {
      ctx.save();
      // Broken Terracotta Urn
      ctx.fillStyle = "#c2410c";
      ctx.beginPath();
      ctx.ellipse(tx, ty - 8, 14, 18, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1e0905";
      ctx.beginPath();
      ctx.ellipse(tx - 6, ty - 18, 6, 4, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Spilled Gold Coins & Ruby Jewels
      ctx.fillStyle = "#facc15";
      for (let c = 0; c < 12; c++) {
        const cx = tx + 10 + (c * 6);
        const cy = ty - 2 + ((c * 7) % 6);
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(tx + 22, ty - 5, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawSpilledTreasures(w * 0.76, stageBottomY - 14);

    // 6. STAGE RIM: CARVED CORNICE MOLDING & POURING SANDFALLS
    const rimGrad = ctx.createLinearGradient(0, stageBottomY - 8, 0, stageBottomY + 8);
    rimGrad.addColorStop(0, "#fde68a");
    rimGrad.addColorStop(0.3, "#f59e0b");
    rimGrad.addColorStop(0.7, "#b45309");
    rimGrad.addColorStop(1, "#451a03");
    ctx.fillStyle = rimGrad;
    ctx.fillRect(0, stageBottomY - 8, w, 16);

    // Pure White Specular Highlight Edge
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, stageBottomY - 6, w, 2.5);

    // Flowing Sand Cascades / Sandfalls Pouring Off the Edge
    const drawSandfallStream = (dx: number, sLen: number, sWid: number) => {
      ctx.save();
      const sGrad = ctx.createLinearGradient(dx, stageBottomY + 8, dx, stageBottomY + 8 + sLen);
      sGrad.addColorStop(0, "#ffffff");
      sGrad.addColorStop(0.2, "#fde68a");
      sGrad.addColorStop(0.6, "#f59e0b");
      sGrad.addColorStop(1, "rgba(217, 119, 6, 0.15)");
      ctx.fillStyle = sGrad;

      ctx.beginPath();
      ctx.moveTo(dx - sWid / 2, stageBottomY + 8);
      ctx.lineTo(dx + sWid / 2, stageBottomY + 8);
      ctx.lineTo(dx, stageBottomY + 8 + sLen);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    for (let dx = 10; dx < w; dx += 20) {
      const len = 14 + ((dx * 29) % 38);
      const wid = 6 + ((dx * 13) % 8);
      drawSandfallStream(dx, len, wid);
    }

    // 7. BOTTOM DESERT ABYSS (Endless Sea of Golden Dunes Below)
    const abyssGrad = ctx.createLinearGradient(0, stageBottomY + 8, 0, h);
    abyssGrad.addColorStop(0, "#b45309");
    abyssGrad.addColorStop(0.25, "#78350f");
    abyssGrad.addColorStop(0.55, "#451a03");
    abyssGrad.addColorStop(0.85, "#280f02");
    abyssGrad.addColorStop(1, "#120601");
    ctx.fillStyle = abyssGrad;
    ctx.fillRect(0, stageBottomY + 8, w, h - (stageBottomY + 8));

    // Rolling Distant Dune Ridges in the Abyss
    const drawAbyssDune = (ix: number, iy: number, iw: number, ih: number) => {
      ctx.save();
      ctx.fillStyle = "#3c1208";
      ctx.beginPath();
      ctx.ellipse(ix, iy, iw, ih, 0.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    };

    drawAbyssDune(w * 0.18, h * 0.97, 65, 12);
    drawAbyssDune(w * 0.48, h * 0.98, 80, 14);
    drawAbyssDune(w * 0.82, h * 0.97, 70, 13);

    ctx.restore();
  }

  // =========================================================================
  // 8. REINO DAS TREVAS (Abyssal Cosmic Void, Singularity & Shattered Nexus)
  // =========================================================================
  private static drawDarkArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();

    // 1. DEEP ABYSSAL COSMOS & MULTI-LAYERED NEBULA STORMS
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    skyGrad.addColorStop(0, "#020008");    // Pitch black abyss
    skyGrad.addColorStop(0.2, "#090118");  // Midnight purple
    skyGrad.addColorStop(0.45, "#15022e"); // Dark ultraviolet
    skyGrad.addColorStop(0.7, "#240046");  // Royal void purple
    skyGrad.addColorStop(0.9, "#3c096c");  // Luminous amethyst horizon
    skyGrad.addColorStop(1, "#10002b");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 1.1 Volumetric Swirling Cosmic Nebulae (Multi-Stop Layered Gas Clouds)
    const drawRichNebula = (
      nx: number,
      ny: number,
      rx: number,
      ry: number,
      c1: string,
      c2: string,
      c3: string,
      rot: number
    ) => {
      ctx.save();
      ctx.translate(nx, ny);
      ctx.rotate(rot);
      const nGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, rx);
      nGrad.addColorStop(0, c1);
      nGrad.addColorStop(0.35, c2);
      nGrad.addColorStop(0.7, c3);
      nGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = nGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // Deep Magenta / Orchid Cosmic Dust
    drawRichNebula(w * 0.78, h * 0.22, 380, 240, "rgba(247, 37, 133, 0.42)", "rgba(181, 23, 158, 0.25)", "rgba(114, 9, 183, 0.08)", 0.25);
    // Cyan Stellar Plasma Cloud
    drawRichNebula(w * 0.22, h * 0.30, 360, 200, "rgba(76, 201, 240, 0.35)", "rgba(67, 97, 238, 0.20)", "rgba(58, 12, 163, 0.06)", -0.3);
    // Center Void Violet Haze
    drawRichNebula(w * 0.52, h * 0.26, 460, 280, "rgba(144, 44, 236, 0.32)", "rgba(92, 10, 168, 0.18)", "rgba(18, 0, 48, 0.05)", 0.08);
    // Upper Cosmic Flare
    drawRichNebula(w * 0.88, h * 0.08, 260, 150, "rgba(251, 113, 133, 0.28)", "rgba(168, 85, 247, 0.15)", "rgba(0, 0, 0, 0)", -0.15);

    // 1.2 Multi-Tier Dynamic Starfield with Cross Diffraction Spikes & Stellar Clusters
    for (let i = 0; i < 220; i++) {
      const sx = (i * 157 + 31) % w;
      const sy = (i * 89 + 17) % (h * 0.68);
      const isBig = i % 17 === 0;
      const isMedium = i % 6 === 0;
      const sr = isBig ? 2.8 : isMedium ? 1.6 : 0.8;
      const alpha = 0.35 + ((i * 37) % 65) / 100;

      // Star Color Palettes: Pure White, Cyan Blue, Radiant Magenta, Golden Glow
      let starColor = `rgba(255, 255, 255, ${alpha})`;
      if (i % 4 === 0) starColor = `rgba(165, 243, 252, ${alpha})`;
      else if (i % 5 === 0) starColor = `rgba(244, 114, 182, ${alpha})`;
      else if (i % 7 === 0) starColor = `rgba(216, 180, 254, ${alpha})`;

      ctx.fillStyle = starColor;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();

      // 4-Point Diffraction Cross Spikes for Brightest Stars
      if (isBig) {
        ctx.strokeStyle = starColor;
        ctx.lineWidth = 1.2;
        const spikeLen = 9 + (i % 5) * 2;
        ctx.beginPath();
        ctx.moveTo(sx - spikeLen, sy);
        ctx.lineTo(sx + spikeLen, sy);
        ctx.moveTo(sx, sy - spikeLen);
        ctx.lineTo(sx, sy + spikeLen);
        ctx.stroke();

        // Soft halo
        const halo = ctx.createRadialGradient(sx, sy, 1, sx, sy, spikeLen * 1.6);
        halo.addColorStop(0, starColor);
        halo.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(sx, sy, spikeLen * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. GARGANTUAN SINGULARITY / RELATIVISTIC BLACK HOLE
    const bhX = w * 0.76;
    const bhY = h * 0.22;
    const bhRadius = 62;

    ctx.save();
    ctx.translate(bhX, bhY);

    // 2.1 Relativistic Jet Streams Shooting into Deep Space
    const jetGrad = ctx.createLinearGradient(0, -350, 0, 350);
    jetGrad.addColorStop(0, "rgba(76, 201, 240, 0)");
    jetGrad.addColorStop(0.35, "rgba(76, 201, 240, 0.45)");
    jetGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
    jetGrad.addColorStop(0.65, "rgba(247, 37, 133, 0.45)");
    jetGrad.addColorStop(1, "rgba(247, 37, 133, 0)");
    ctx.strokeStyle = jetGrad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -320);
    ctx.lineTo(0, 320);
    ctx.stroke();

    // Jet conical flare
    const drawJetCone = (dir: number) => {
      const jcGrad = ctx.createRadialGradient(0, 0, 5, 0, dir * 260, 90);
      jcGrad.addColorStop(0, "rgba(255, 255, 255, 0.8)");
      jcGrad.addColorStop(0.3, "rgba(76, 201, 240, 0.3)");
      jcGrad.addColorStop(0.8, "rgba(114, 9, 183, 0.1)");
      jcGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = jcGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-30, dir * 260);
      ctx.lineTo(30, dir * 260);
      ctx.closePath();
      ctx.fill();
    };
    drawJetCone(-1);
    drawJetCone(1);

    // 2.2 Gravitational Lensing Arc (Light bent over the top of the black hole)
    const lensGrad = ctx.createRadialGradient(0, -10, bhRadius * 0.8, 0, -10, bhRadius * 1.8);
    lensGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    lensGrad.addColorStop(0.25, "rgba(254, 205, 211, 0.85)");
    lensGrad.addColorStop(0.55, "rgba(247, 37, 133, 0.6)");
    lensGrad.addColorStop(0.85, "rgba(114, 9, 183, 0.2)");
    lensGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = lensGrad;
    ctx.beginPath();
    ctx.arc(0, -12, bhRadius * 1.6, Math.PI, Math.PI * 2);
    ctx.fill();

    // 2.3 Back Half of Accretion Disk (Tilted 3D Orbit behind the event horizon)
    const diskAngle = -0.22;
    ctx.save();
    ctx.rotate(diskAngle);

    const backDiskGrad = ctx.createRadialGradient(0, 0, bhRadius * 0.9, 0, 0, 240);
    backDiskGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    backDiskGrad.addColorStop(0.2, "rgba(76, 201, 240, 0.7)");
    backDiskGrad.addColorStop(0.5, "rgba(247, 37, 133, 0.45)");
    backDiskGrad.addColorStop(0.8, "rgba(114, 9, 183, 0.15)");
    backDiskGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = backDiskGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 240, 52, 0, Math.PI, Math.PI * 2); // Upper/back half only
    ctx.fill();
    ctx.restore();

    // 2.4 True Singularity Sphere (Absolute Obsidian Event Horizon)
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(0, 0, bhRadius, 0, Math.PI * 2);
    ctx.fill();

    // Photon Ring Specular Glow (Sharp glowing halo around the shadow)
    const photonRing = ctx.createRadialGradient(0, 0, bhRadius - 4, 0, 0, bhRadius + 14);
    photonRing.addColorStop(0, "rgba(0, 0, 0, 1)");
    photonRing.addColorStop(0.3, "rgba(255, 255, 255, 0.95)");
    photonRing.addColorStop(0.6, "rgba(76, 201, 240, 0.8)");
    photonRing.addColorStop(0.85, "rgba(247, 37, 133, 0.4)");
    photonRing.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = photonRing;
    ctx.beginPath();
    ctx.arc(0, 0, bhRadius + 14, 0, Math.PI * 2);
    ctx.fill();

    // 2.5 Front Half of Accretion Disk (Swirling in front of the horizon with Doppler brightening)
    ctx.save();
    ctx.rotate(diskAngle);

    // Front glowing disk
    const frontDiskGrad = ctx.createRadialGradient(0, 0, bhRadius * 1.05, 0, 0, 260);
    frontDiskGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
    frontDiskGrad.addColorStop(0.18, "rgba(76, 201, 240, 0.9)");
    frontDiskGrad.addColorStop(0.45, "rgba(247, 37, 133, 0.75)");
    frontDiskGrad.addColorStop(0.75, "rgba(114, 9, 183, 0.35)");
    frontDiskGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = frontDiskGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 260, 58, 0, 0, Math.PI); // Lower/front half
    ctx.fill();

    // Filament Stream Rings in the Accretion Disk
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 140, 30, 0, 0, Math.PI);
    ctx.stroke();

    ctx.strokeStyle = "rgba(76, 201, 240, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 190, 42, 0, 0, Math.PI);
    ctx.stroke();

    ctx.strokeStyle = "rgba(247, 37, 133, 0.6)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 230, 50, 0, 0, Math.PI);
    ctx.stroke();

    ctx.restore();

    ctx.restore(); // Restore singularity transform

    // 3. DISTANT SHATTERED PLANETS & VOID CELESTIAL BODIES
    // 3.1 Shattered Crystalline Purple Moon (Left Horizon)
    const moonX = w * 0.16;
    const moonY = h * 0.25;
    const moonR = 48;

    ctx.save();
    const moonGrad = ctx.createRadialGradient(moonX - 12, moonY - 12, 5, moonX, moonY, moonR);
    moonGrad.addColorStop(0, "#c084fc");
    moonGrad.addColorStop(0.4, "#7e22ce");
    moonGrad.addColorStop(0.8, "#3b0764");
    moonGrad.addColorStop(1, "#120224");
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Planetary Ring
    ctx.strokeStyle = "rgba(192, 132, 252, 0.65)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(moonX, moonY, moonR * 1.8, 14, 0.35, 0, Math.PI * 2);
    ctx.stroke();

    // Shattered Floating Chunks breaking away
    ctx.fillStyle = "#e9d5ff";
    for (let c = 0; c < 8; c++) {
      const cx = moonX + 45 + (c * 11);
      const cy = moonY - 20 - (c * 6) + ((c * 7) % 12);
      const cr = 2 + (c % 3) * 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. FLOATING OBSIDIAN MONOLITHS & SHATTERED ZERO-G ISLANDS
    const drawFacetedObsidianMonolith = (
      mx: number,
      my: number,
      mw: number,
      mh: number,
      tilt: number,
      runeColor: string
    ) => {
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(tilt);

      // 3D Faceted Hexagonal / Prismatic Pillar
      const leftW = mw * 0.45;
      const rightW = mw * 0.55;

      // Left illuminated facet
      const lGrad = ctx.createLinearGradient(-leftW, -mh, 0, 0);
      lGrad.addColorStop(0, "#4a044e");
      lGrad.addColorStop(0.5, "#2e0854");
      lGrad.addColorStop(1, "#14012b");
      ctx.fillStyle = lGrad;
      ctx.beginPath();
      ctx.moveTo(-leftW, -mh * 0.85);
      ctx.lineTo(0, -mh);
      ctx.lineTo(0, 0);
      ctx.lineTo(-leftW, -mh * 0.15);
      ctx.closePath();
      ctx.fill();

      // Right shadow facet
      const rGrad = ctx.createLinearGradient(0, -mh, rightW, 0);
      rGrad.addColorStop(0, "#240046");
      rGrad.addColorStop(0.5, "#10002b");
      rGrad.addColorStop(1, "#050014");
      ctx.fillStyle = rGrad;
      ctx.beginPath();
      ctx.moveTo(0, -mh);
      ctx.lineTo(rightW, -mh * 0.85);
      ctx.lineTo(rightW, -mh * 0.15);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      // Top facet (Perspective cap)
      ctx.fillStyle = "#701a75";
      ctx.beginPath();
      ctx.moveTo(0, -mh);
      ctx.lineTo(-leftW, -mh * 0.85);
      ctx.lineTo(0, -mh * 0.72);
      ctx.lineTo(rightW, -mh * 0.85);
      ctx.closePath();
      ctx.fill();

      // Sharp Crystalline Neon Rim Highlights
      ctx.strokeStyle = "rgba(247, 37, 133, 0.75)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-leftW, -mh * 0.85);
      ctx.lineTo(0, -mh);
      ctx.lineTo(rightW, -mh * 0.85);
      ctx.stroke();

      ctx.strokeStyle = "rgba(76, 201, 240, 0.85)";
      ctx.beginPath();
      ctx.moveTo(0, -mh);
      ctx.lineTo(0, 0);
      ctx.stroke();

      // Glowing Arcane Eldritch Glyphs
      ctx.save();
      ctx.fillStyle = runeColor;
      ctx.shadowColor = runeColor;
      ctx.shadowBlur = 12;

      for (let g = 0; g < 4; g++) {
        const gy = -mh * 0.75 + g * (mh * 0.2);
        // Angular runic symbols
        ctx.fillRect(-3, gy, 6, 8);
        ctx.beginPath();
        ctx.arc(0, gy - 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-5, gy + 12);
        ctx.lineTo(0, gy + 16);
        ctx.lineTo(5, gy + 12);
        ctx.stroke();
      }
      ctx.restore();

      // Floating Shards around the monolith
      ctx.fillStyle = "#a855f7";
      for (let s = 0; s < 4; s++) {
        const sx = (s % 2 === 0 ? -1 : 1) * (mw * 0.75 + s * 8);
        const sy = -mh * 0.5 + s * 25;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 4, 8, s * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    // Left Monolith Group
    drawFacetedObsidianMonolith(w * 0.12, h * 0.65, 54, 210, -0.06, "#4cc9f0");
    drawFacetedObsidianMonolith(w * 0.24, h * 0.68, 42, 160, 0.08, "#f72585");

    // Center-Back Floating Spire
    drawFacetedObsidianMonolith(w * 0.48, h * 0.66, 38, 140, -0.04, "#a855f7");

    // Right Monolith Group
    drawFacetedObsidianMonolith(w * 0.88, h * 0.66, 60, 230, 0.05, "#4cc9f0");
    drawFacetedObsidianMonolith(w * 0.96, h * 0.68, 46, 175, -0.07, "#f72585");

    // 4.1 Eldritch Energy Lightning Arcing between floating shards
    const drawVoidLightning = (x1: number, y1: number, x2: number, y2: number, col: string) => {
      ctx.save();
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = col;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 30;
      const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 20;
      ctx.lineTo(midX, midY);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    };

    drawVoidLightning(w * 0.12, h * 0.46, w * 0.24, h * 0.54, "#4cc9f0");
    drawVoidLightning(w * 0.88, h * 0.44, w * 0.78, h * 0.52, "#f72585");
    drawVoidLightning(w * 0.48, h * 0.53, w * 0.56, h * 0.62, "#a855f7");

    // =========================================================================
    // 5. COMBAT ARENA FLOOR (The Shattered Astral Nexus Platform)
    // =========================================================================
    const stageTopY = h * 0.68;
    const stageBottomY = h * 0.94;
    const stageH = stageBottomY - stageTopY;

    // 5.1 Obsidian & Dark Amethyst Foundation
    const stageGrad = ctx.createLinearGradient(0, stageTopY, 0, stageBottomY);
    stageGrad.addColorStop(0, "#240046");  // Deep purple top
    stageGrad.addColorStop(0.25, "#15022e"); // Royal obsidian
    stageGrad.addColorStop(0.60, "#0d011d"); // Midnight void depth
    stageGrad.addColorStop(0.85, "#06000e"); // Abyssal black
    stageGrad.addColorStop(1, "#020006");
    ctx.fillStyle = stageGrad;
    ctx.fillRect(0, stageTopY, w, stageH);

    // 5.2 Megalithic Obsidian Flagstones with Glowing Neon Energy Mortar
    ctx.strokeStyle = "rgba(76, 201, 240, 0.4)";
    ctx.lineWidth = 2.5;

    // Perspective depth rows
    const stoneRows = [0, 0.10, 0.24, 0.42, 0.65, 1.0];
    for (let rIdx = 0; rIdx < stoneRows.length; rIdx++) {
      const sr = stoneRows[rIdx];
      const fy = stageTopY + stageH * sr;
      ctx.beginPath();
      ctx.moveTo(0, fy);
      ctx.lineTo(w, fy);
      ctx.stroke();

      // Top specular rim on stone row
      ctx.strokeStyle = rIdx % 2 === 0 ? "rgba(247, 37, 133, 0.55)" : "rgba(76, 201, 240, 0.55)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, fy + 1.5);
      ctx.lineTo(w, fy + 1.5);
      ctx.stroke();
      ctx.strokeStyle = "rgba(76, 201, 240, 0.4)";
      ctx.lineWidth = 2.5;
    }

    // Radial perspective lines converging toward singularity
    const vpX = w * 0.5;
    for (let tx = -200; tx <= w + 200; tx += 120) {
      ctx.beginPath();
      ctx.moveTo(vpX + (tx - vpX) * 0.72, stageTopY);
      ctx.lineTo(tx, stageBottomY);
      ctx.stroke();
    }

    // 5.3 Colossal Eldritch Astral Transmutation Circle (Center of Platform)
    const circleX = w * 0.5;
    const circleY = stageTopY + stageH * 0.48;
    const circleR = 175;

    ctx.save();
    // Outer Neon Ring
    ctx.strokeStyle = "#4cc9f0";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#4cc9f0";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.ellipse(circleX, circleY, circleR, circleR * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Magenta Secondary Ring
    ctx.strokeStyle = "#f72585";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#f72585";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(circleX, circleY, circleR * 0.75, circleR * 0.30, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Core Inscription Ring
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(circleX, circleY, circleR * 0.45, circleR * 0.18, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 8 Inscribed Runic Astral Chords / Sacred Geometry Triangle Points
    ctx.strokeStyle = "rgba(168, 85, 247, 0.85)";
    ctx.lineWidth = 2;
    for (let s = 0; s < 6; s++) {
      const angle1 = (s * Math.PI * 2) / 6;
      const angle2 = ((s + 2) * Math.PI * 2) / 6;
      const x1 = circleX + Math.cos(angle1) * (circleR * 0.75);
      const y1 = circleY + Math.sin(angle1) * (circleR * 0.30);
      const x2 = circleX + Math.cos(angle2) * (circleR * 0.75);
      const y2 = circleY + Math.sin(angle2) * (circleR * 0.30);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Glowing Core Nexus Flare
    const coreGrad = ctx.createRadialGradient(circleX, circleY, 2, circleX, circleY, circleR * 0.4);
    coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    coreGrad.addColorStop(0.3, "rgba(76, 201, 240, 0.75)");
    coreGrad.addColorStop(0.65, "rgba(247, 37, 133, 0.35)");
    coreGrad.addColorStop(1, "rgba(114, 9, 183, 0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.ellipse(circleX, circleY, circleR * 0.4, circleR * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5.4 Branching Void Energy Fissures with Pulsating Cyan & Magenta Veins
    const drawEnergyFissure = (
      fx: number,
      fy: number,
      length: number,
      angle: number,
      color: string
    ) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(fx, fy);
      let curX = fx;
      let curY = fy;
      const segments = 6;
      for (let s = 1; s <= segments; s++) {
        const segLen = length / segments;
        curX += Math.cos(angle) * segLen + (Math.random() - 0.5) * 16;
        curY += Math.sin(angle) * segLen + (Math.random() - 0.5) * 10;
        ctx.lineTo(curX, curY);
      }
      ctx.stroke();

      // Hot white core
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    };

    drawEnergyFissure(w * 0.18, stageTopY, 130, 1.2, "#4cc9f0");
    drawEnergyFissure(w * 0.32, stageTopY + 20, 110, 1.4, "#f72585");
    drawEnergyFissure(w * 0.74, stageTopY + 10, 140, 1.8, "#4cc9f0");
    drawEnergyFissure(w * 0.86, stageTopY, 120, 1.6, "#f72585");

    // 5.5 Void Crystal Clusters Sprouting from Floor Corners
    const drawVoidCrystalCluster = (cx: number, cy: number, scale: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);

      const crystals = [
        { h: 65, w: 14, angle: -0.25, col: "#4cc9f0", core: "#a5f3fc" },
        { h: 80, w: 18, angle: 0.05, col: "#f72585", core: "#fbcfe8" },
        { h: 55, w: 12, angle: 0.35, col: "#c084fc", core: "#f3e8ff" },
        { h: 40, w: 10, angle: -0.45, col: "#38bdf8", core: "#e0f2fe" },
      ];

      for (const cr of crystals) {
        ctx.save();
        ctx.rotate(cr.angle);

        // Body gradient
        const cGrad = ctx.createLinearGradient(-cr.w / 2, -cr.h, cr.w / 2, 0);
        cGrad.addColorStop(0, cr.core);
        cGrad.addColorStop(0.4, cr.col);
        cGrad.addColorStop(1, "#1e053a");
        ctx.fillStyle = cGrad;

        ctx.beginPath();
        ctx.moveTo(0, -cr.h);
        ctx.lineTo(cr.w / 2, -cr.h * 0.65);
        ctx.lineTo(cr.w / 2, 0);
        ctx.lineTo(-cr.w / 2, 0);
        ctx.lineTo(-cr.w / 2, -cr.h * 0.65);
        ctx.closePath();
        ctx.fill();

        // Facet specular highlight
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -cr.h);
        ctx.lineTo(0, 0);
        ctx.stroke();

        ctx.restore();
      }

      // Base Energy Glow
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 35);
      glow.addColorStop(0, "rgba(247, 37, 133, 0.8)");
      glow.addColorStop(0.5, "rgba(76, 201, 240, 0.4)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    drawVoidCrystalCluster(w * 0.06, stageBottomY - 10, 1.15);
    drawVoidCrystalCluster(w * 0.94, stageBottomY - 10, 1.15);
    drawVoidCrystalCluster(w * 0.28, stageBottomY - 8, 0.85);
    drawVoidCrystalCluster(w * 0.72, stageBottomY - 8, 0.85);

    // 6. STAGE RIM: CHISELED OBSIDIAN CORNICE & CASCADING VOID MATTER
    const rimGrad = ctx.createLinearGradient(0, stageBottomY - 8, 0, stageBottomY + 8);
    rimGrad.addColorStop(0, "#f72585");
    rimGrad.addColorStop(0.35, "#7209b7");
    rimGrad.addColorStop(0.7, "#3a0ca3");
    rimGrad.addColorStop(1, "#050014");
    ctx.fillStyle = rimGrad;
    ctx.fillRect(0, stageBottomY - 8, w, 16);

    // Neon Edge Bevel Highlight
    ctx.fillStyle = "#4cc9f0";
    ctx.fillRect(0, stageBottomY - 7, w, 2.5);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, stageBottomY - 5, w, 1.2);

    // Cascading Void Plasma Streams Pouring off the floating edge
    const drawVoidStream = (dx: number, sLen: number, sWid: number, sColor: string) => {
      ctx.save();
      const sGrad = ctx.createLinearGradient(dx, stageBottomY + 8, dx, stageBottomY + 8 + sLen);
      sGrad.addColorStop(0, "#ffffff");
      sGrad.addColorStop(0.2, sColor);
      sGrad.addColorStop(0.7, "rgba(114, 9, 183, 0.5)");
      sGrad.addColorStop(1, "rgba(5, 0, 20, 0)");
      ctx.fillStyle = sGrad;

      ctx.beginPath();
      ctx.moveTo(dx - sWid / 2, stageBottomY + 8);
      ctx.lineTo(dx + sWid / 2, stageBottomY + 8);
      ctx.lineTo(dx, stageBottomY + 8 + sLen);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    for (let dx = 12; dx < w; dx += 18) {
      const len = 16 + ((dx * 31) % 42);
      const wid = 5 + ((dx * 17) % 7);
      const col = dx % 36 === 0 ? "#f72585" : "#4cc9f0";
      drawVoidStream(dx, len, wid, col);
    }

    // 7. BOTTOM GRAVITATIONAL VOID ABYSS (Infinite Cosmic Depth)
    const abyssGrad = ctx.createLinearGradient(0, stageBottomY + 8, 0, h);
    abyssGrad.addColorStop(0, "#15022e");
    abyssGrad.addColorStop(0.3, "#0d011d");
    abyssGrad.addColorStop(0.65, "#050014");
    abyssGrad.addColorStop(1, "#000000");
    ctx.fillStyle = abyssGrad;
    ctx.fillRect(0, stageBottomY + 8, w, h - (stageBottomY + 8));

    // Distant Asteroid Debris & Floating Dust in the Abyss Below
    ctx.fillStyle = "#4cc9f0";
    for (let b = 0; b < 40; b++) {
      const bx = (b * 149 + 23) % w;
      const by = stageBottomY + 12 + ((b * 47) % (h - stageBottomY - 12));
      const br = 1 + (b % 3);
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
