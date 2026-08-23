import Phaser from "phaser";

export class LogoTextureBuilder {
  public static readonly LOGO_KEY = "utlw_logo";
  public static readonly WIDTH = 480;
  public static readonly HEIGHT = 270;

  /**
   * Generates or ensures a high-definition, procedural fighting game logo texture.
   * Completely self-contained, avoiding external network file load errors.
   */
  public static ensureLogoTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists(this.LOGO_KEY)) {
      return;
    }

    const canvasTexture = scene.textures.createCanvas(
      this.LOGO_KEY,
      this.WIDTH,
      this.HEIGHT
    );

    if (!canvasTexture) return;

    const ctx = canvasTexture.getContext();
    this.drawLogo(ctx, this.WIDTH, this.HEIGHT);
    canvasTexture.refresh();
  }

  private static drawRoundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.arcTo(x + w, y, x + w, y + radius, radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
    ctx.lineTo(x + radius, y + h);
    ctx.arcTo(x, y + h, x, y + h - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  }

  private static drawLogo(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number
  ): void {
    try {
      ctx.save();
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      // --- 1. Background Crest (Shield / Rounded Plate) ---
      const plateW = w - 24;
      const plateH = h - 20;
      const plateX = 12;
      const plateY = 10;
      const radius = 18;

      // Dark metallic obsidian gradient
      const bgGrad = ctx.createLinearGradient(0, plateY, 0, plateY + plateH);
      bgGrad.addColorStop(0, "#111827");
      bgGrad.addColorStop(0.5, "#0b0f19");
      bgGrad.addColorStop(1, "#030712");

      this.drawRoundRect(ctx, plateX, plateY, plateW, plateH, radius);
      ctx.fillStyle = bgGrad;
      ctx.fill();

      // Radiant energy glow in center
      const radialGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 180);
      radialGlow.addColorStop(0, "rgba(245, 158, 11, 0.28)");
      radialGlow.addColorStop(0.4, "rgba(220, 38, 38, 0.18)");
      radialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = radialGlow;
      ctx.fill();

      // --- 2. Golden Metallic Outer Frame & Accents ---
      const goldGrad = ctx.createLinearGradient(plateX, plateY, plateX + plateW, plateY + plateH);
      goldGrad.addColorStop(0, "#ffe066");
      goldGrad.addColorStop(0.3, "#f59e0b");
      goldGrad.addColorStop(0.7, "#b45309");
      goldGrad.addColorStop(1, "#d97706");

      this.drawRoundRect(ctx, plateX, plateY, plateW, plateH, radius);
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = goldGrad;
      ctx.stroke();

      // Inner subtle chamfer stroke
      this.drawRoundRect(ctx, plateX + 5, plateY + 5, plateW - 10, plateH - 10, radius - 4);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
      ctx.stroke();

      // --- 3. Dynamic Energy Slashes / Crossed Katanas Silhouette ---
      ctx.save();
      ctx.translate(cx, cy - 8);

      // Left-to-right slash
      const slash1 = ctx.createLinearGradient(-160, -60, 160, 60);
      slash1.addColorStop(0, "rgba(245, 158, 11, 0)");
      slash1.addColorStop(0.5, "rgba(255, 237, 213, 0.85)");
      slash1.addColorStop(1, "rgba(239, 68, 68, 0)");

      ctx.beginPath();
      ctx.moveTo(-170, -38);
      ctx.quadraticCurveTo(0, 0, 170, 38);
      ctx.lineWidth = 3;
      ctx.strokeStyle = slash1;
      ctx.stroke();

      // Right-to-left slash
      const slash2 = ctx.createLinearGradient(160, -60, -160, 60);
      slash2.addColorStop(0, "rgba(239, 68, 68, 0)");
      slash2.addColorStop(0.5, "rgba(255, 237, 213, 0.85)");
      slash2.addColorStop(1, "rgba(245, 158, 11, 0)");

      ctx.beginPath();
      ctx.moveTo(170, -38);
      ctx.quadraticCurveTo(0, 0, -170, 38);
      ctx.lineWidth = 3;
      ctx.strokeStyle = slash2;
      ctx.stroke();

      ctx.restore();

      // --- 4. Top Header Typography ("UNTIL THE LAST") ---
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const subText = "UNTIL  THE  LAST";
      ctx.font = "900 24px system-ui, -apple-system, 'Arial Black', sans-serif";

      // Text Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fillText(subText, cx + 2, cy - 42);

      // Text Gradient
      const subGrad = ctx.createLinearGradient(0, cy - 55, 0, cy - 30);
      subGrad.addColorStop(0, "#fffbeb");
      subGrad.addColorStop(0.5, "#fde68a");
      subGrad.addColorStop(1, "#f59e0b");

      ctx.lineWidth = 4;
      ctx.strokeStyle = "#1e1b4b";
      ctx.strokeText(subText, cx, cy - 44);

      ctx.fillStyle = subGrad;
      ctx.fillText(subText, cx, cy - 44);
      ctx.restore();

      // --- 5. Main Hero Typography ("WARRIOR") ---
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const mainText = "WARRIOR";
      ctx.font = "900 68px system-ui, -apple-system, 'Impact', 'Arial Black', sans-serif";

      // Heavy 3D Drop Shadow Layers
      ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
      ctx.fillText(mainText, cx + 4, cy + 24);
      ctx.fillText(mainText, cx + 2, cy + 22);

      // Deep Dark Outline
      ctx.lineWidth = 10;
      ctx.strokeStyle = "#450a0a";
      ctx.strokeText(mainText, cx, cy + 18);

      ctx.lineWidth = 6;
      ctx.strokeStyle = "#000000";
      ctx.strokeText(mainText, cx, cy + 18);

      // Fiery Metallic Gradient Fill
      const mainGrad = ctx.createLinearGradient(0, cy - 18, 0, cy + 50);
      mainGrad.addColorStop(0, "#ffffff");
      mainGrad.addColorStop(0.15, "#fef08a");
      mainGrad.addColorStop(0.45, "#f59e0b");
      mainGrad.addColorStop(0.75, "#dc2626");
      mainGrad.addColorStop(1, "#991b1b");

      ctx.fillStyle = mainGrad;
      ctx.fillText(mainText, cx, cy + 18);

      // Top Glossy Sheen Highlight Line
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.strokeText(mainText, cx, cy + 16);
      ctx.restore();

      // --- 6. Lower Subtitle Ribbon ("★ ULTIMATE ANIME FIGHTER ★") ---
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const ribbonY = cy + 76;
      const ribbonW = 270;
      const ribbonH = 22;

      const ribbonBg = ctx.createLinearGradient(cx - ribbonW / 2, 0, cx + ribbonW / 2, 0);
      ribbonBg.addColorStop(0, "rgba(220, 38, 38, 0)");
      ribbonBg.addColorStop(0.2, "rgba(185, 28, 28, 0.85)");
      ribbonBg.addColorStop(0.8, "rgba(185, 28, 28, 0.85)");
      ribbonBg.addColorStop(1, "rgba(220, 38, 38, 0)");

      ctx.fillStyle = ribbonBg;
      ctx.fillRect(cx - ribbonW / 2, ribbonY - ribbonH / 2, ribbonW, ribbonH);

      ctx.font = "bold 11px system-ui, -apple-system, 'Roboto', sans-serif";
      ctx.fillStyle = "#fef08a";
      ctx.fillText("★ ULTIMATE ANIME FIGHTER ★", cx, ribbonY);
      ctx.restore();

      ctx.restore();
    } catch (err) {
      console.error("Error generating logo canvas:", err);
      // Fallback simple draw
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#ffd54a";
      ctx.font = "900 32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("UNTIL THE LAST", w / 2, h / 2 - 15);
      ctx.fillStyle = "#ef4444";
      ctx.font = "900 50px sans-serif";
      ctx.fillText("WARRIOR", w / 2, h / 2 + 40);
    }
  }
}
