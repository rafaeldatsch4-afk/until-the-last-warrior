import Phaser from "phaser";

export class ResponsiveUtils {
  private static activeScene: Phaser.Scene | null = null;

  // Chame isso uma vez, cedo no ciclo de vida do jogo (ex: no create() da primeira cena
  // que rodar), para que getSafeBounds() tenha uma cena válida para usar depois.
  static init(scene: Phaser.Scene) {
    ResponsiveUtils.activeScene = scene;
  }

  static getSafeBounds() {
    const scene = ResponsiveUtils.activeScene;

    if (!scene || !scene.scale) {
      // Fallback seguro caso init() não tenha sido chamado ainda
      return {
        left: 48, right: 912, top: 27, bottom: 513,
        width: 864, height: 486, centerX: 480, centerY: 270,
      };
    }

    const scaleManager = scene.scale;
    const { width, height } = scaleManager.displaySize;
    const { width: pWidth, height: pHeight } = scaleManager.parentSize;

    const scale = width / 960;

    const bleedX = Math.max(0, width - pWidth);
    const bleedY = Math.max(0, height - pHeight);

    const gameBleedX = (bleedX / scale) / 2;
    const gameBleedY = (bleedY / scale) / 2;

    let safeTop = 0, safeRight = 0, safeBottom = 0, safeLeft = 0;
    try {
      const div = document.createElement('div');
      div.style.padding = 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
      div.style.position = 'absolute';
      div.style.visibility = 'hidden';
      document.body.appendChild(div);
      const style = getComputedStyle(div);
      safeTop = (parseInt(style.paddingTop) || 0) / scale;
      safeRight = (parseInt(style.paddingRight) || 0) / scale;
      safeBottom = (parseInt(style.paddingBottom) || 0) / scale;
      safeLeft = (parseInt(style.paddingLeft) || 0) / scale;
      document.body.removeChild(div);
    } catch (e) {}

    const marginX = 960 * 0.05;
    const marginY = 540 * 0.05;

    return {
      left: gameBleedX + safeLeft + marginX,
      right: 960 - gameBleedX - safeRight - marginX,
      top: gameBleedY + safeTop + marginY,
      bottom: 540 - gameBleedY - safeBottom - marginY,
      width: 960 - (gameBleedX * 2) - safeLeft - safeRight - (marginX * 2),
      height: 540 - (gameBleedY * 2) - safeTop - safeBottom - (marginY * 2),
      centerX: 960 / 2,
      centerY: 540 / 2,
    };
  }
}
