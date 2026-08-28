import Phaser from "phaser";

export interface SafeBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  scaleFactor: number;
  isUltraWide: boolean;
  aspectRatio: number;
}

export class ResponsiveUtils {
  private static activeScene: Phaser.Scene | null = null;

  public static readonly BASE_WIDTH = 960;
  public static readonly BASE_HEIGHT = 540;
  public static readonly MIN_SCALE = 0.5;
  public static readonly MAX_SCALE = 2.5;

  /**
   * Inicializa a referência estática da cena ativa para resolução de bounds responsivos.
   */
  static init(scene: Phaser.Scene) {
    ResponsiveUtils.activeScene = scene;
  }

  /**
   * Limita o fator de escala/zoom dentro dos limites seguros para evitar distorção visual.
   */
  static clampScale(
    scale: number,
    min: number = ResponsiveUtils.MIN_SCALE,
    max: number = ResponsiveUtils.MAX_SCALE
  ): number {
    return Phaser.Math.Clamp(scale, min, max);
  }

  /**
   * Retorna o fator de escala atual baseado na viewport da cena ativa.
   */
  static getScaleFactor(customScene?: Phaser.Scene): number {
    const scene = customScene || ResponsiveUtils.activeScene;
    if (!scene || !scene.scale) return 1;

    const { width } = scene.scale.displaySize;
    const rawScale = width / ResponsiveUtils.BASE_WIDTH;
    return ResponsiveUtils.clampScale(rawScale);
  }

  /**
   * Detecta se a tela atual possui proporção ultra-wide (ex: 20:9, 21:9 ou aspect ratio >= 1.95).
   */
  static isUltraWide(customScene?: Phaser.Scene): boolean {
    const scene = customScene || ResponsiveUtils.activeScene;
    if (!scene || !scene.scale) return false;

    const { width: pWidth, height: pHeight } = scene.scale.parentSize;
    const { width: dWidth, height: dHeight } = scene.scale.displaySize;

    const w = pWidth > 0 ? pWidth : dWidth;
    const h = pHeight > 0 ? pHeight : dHeight;

    if (h <= 0) return false;
    return w / h >= 1.95;
  }

  /**
   * Calcula as dimensões e limites seguros (Safe Bounds) da tela,
   * prevenindo cortes em telas ultra-wide (20:9, 21:9) e respeitando safe-area-insets (notches).
   */
  static getSafeBounds(customScene?: Phaser.Scene): SafeBounds {
    const scene = customScene || ResponsiveUtils.activeScene;

    if (!scene || !scene.scale) {
      // Fallback padrão 16:9 caso nenhuma cena tenha sido inicializada
      return {
        left: 48,
        right: 912,
        top: 27,
        bottom: 513,
        width: 864,
        height: 486,
        centerX: 480,
        centerY: 270,
        scaleFactor: 1,
        isUltraWide: false,
        aspectRatio: 16 / 9,
      };
    }

    const scaleManager = scene.scale;
    const { width, height } = scaleManager.displaySize;
    const { width: pWidth, height: pHeight } = scaleManager.parentSize;

    const viewportW = pWidth > 0 ? pWidth : width;
    const viewportH = pHeight > 0 ? pHeight : height;
    const aspectRatio = viewportH > 0 ? viewportW / viewportH : 16 / 9;
    const isUltraWide = aspectRatio >= 1.95;

    const rawScale = width / ResponsiveUtils.BASE_WIDTH;
    const scale = ResponsiveUtils.clampScale(rawScale);

    const bleedX = Math.max(0, width - pWidth);
    const bleedY = Math.max(0, height - pHeight);

    const gameBleedX = scale > 0 ? bleedX / scale / 2 : 0;
    const gameBleedY = scale > 0 ? bleedY / scale / 2 : 0;

    let safeTop = 0;
    let safeRight = 0;
    let safeBottom = 0;
    let safeLeft = 0;

    try {
      if (typeof document !== "undefined" && document.body) {
        const div = document.createElement("div");
        div.style.padding =
          "env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)";
        div.style.position = "absolute";
        div.style.visibility = "hidden";
        div.style.pointerEvents = "none";
        document.body.appendChild(div);
        const style = getComputedStyle(div);
        const invScale = scale > 0 ? 1 / scale : 1;
        safeTop = (parseInt(style.paddingTop, 10) || 0) * invScale;
        safeRight = (parseInt(style.paddingRight, 10) || 0) * invScale;
        safeBottom = (parseInt(style.paddingBottom, 10) || 0) * invScale;
        safeLeft = (parseInt(style.paddingLeft, 10) || 0) * invScale;
        document.body.removeChild(div);
      }
    } catch {
      // Ignora erro em ambientes sem suporte a env()
    }

    // Margens adaptativas com proteção reforçada para telas ultra-wide
    const extraMarginRatio = isUltraWide ? 0.04 : 0.02;
    const marginX = ResponsiveUtils.BASE_WIDTH * extraMarginRatio;
    const marginY = ResponsiveUtils.BASE_HEIGHT * 0.03;

    // Garante que as margens seguras permaneçam estritamente nas bordas do jogo (960x540)
    const rawLeft = gameBleedX + safeLeft + marginX;
    const rawRight = ResponsiveUtils.BASE_WIDTH - (gameBleedX + safeRight + marginX);
    const rawTop = gameBleedY + safeTop + marginY;
    const rawBottom = ResponsiveUtils.BASE_HEIGHT - (gameBleedY + safeBottom + marginY);

    const left = Phaser.Math.Clamp(rawLeft, 20, 64);
    const right = Phaser.Math.Clamp(rawRight, ResponsiveUtils.BASE_WIDTH - 64, ResponsiveUtils.BASE_WIDTH - 20);
    const top = Phaser.Math.Clamp(rawTop, 16, 42);
    const bottom = Phaser.Math.Clamp(rawBottom, ResponsiveUtils.BASE_HEIGHT - 42, ResponsiveUtils.BASE_HEIGHT - 16);

    const safeWidth = Math.max(300, right - left);
    const safeHeight = Math.max(200, bottom - top);

    return {
      left,
      right,
      top,
      bottom,
      width: safeWidth,
      height: safeHeight,
      centerX: ResponsiveUtils.BASE_WIDTH / 2,
      centerY: ResponsiveUtils.BASE_HEIGHT / 2,
      scaleFactor: scale,
      isUltraWide,
      aspectRatio,
    };
  }
}
