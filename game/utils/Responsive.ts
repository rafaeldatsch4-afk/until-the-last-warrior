import Phaser from "phaser";

export class Responsive {
  static getVisibleBounds(scene: Phaser.Scene) {
    const scaleManager = scene.scale;
    const { width, height } = scaleManager.displaySize;
    const { width: pWidth, height: pHeight } = scaleManager.parentSize;
    
    // Scale factor applied to the game canvas (ENVELOP scales uniformly)
    const scale = width / 960; // Assuming base width is 960
    
    // How many pixels of the canvas (in scaled CSS pixels) bleed out?
    const bleedX = Math.max(0, width - pWidth);
    const bleedY = Math.max(0, height - pHeight);
    
    // Convert bleed to game coordinates (divide by scale, and split by 2 since it's centered)
    const gameBleedX = (bleedX / scale) / 2;
    const gameBleedY = (bleedY / scale) / 2;
    
    // Fetch CSS safe area for notches
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

    return {
      left: gameBleedX + safeLeft,
      right: 960 - gameBleedX - safeRight,
      top: gameBleedY + safeTop,
      bottom: 540 - gameBleedY - safeBottom,
      width: 960 - (gameBleedX * 2) - safeLeft - safeRight,
      height: 540 - (gameBleedY * 2) - safeTop - safeBottom,
      centerX: 960 / 2,
      centerY: 540 / 2,
    };
  }
}
