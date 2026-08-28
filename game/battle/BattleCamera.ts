import Phaser from "phaser";
import type BattleScene from "../scenes/BattleScene";

export class BattleCamera {
  scene: BattleScene;
  camera: Phaser.Cameras.Scene2D.Camera;
  private lastShakeTime: number = 0;

  constructor(scene: BattleScene) {
    this.scene = scene;
    this.camera = scene.cameras.main;
  }

  setupCamera(mapWidth: number) {
    this.camera.setBounds(-500, -500, mapWidth + 1000, 1500);

    const isPotato = this.scene.gameState?.settings?.lowPerformanceMode;
    if (this.camera.postFX && !isPotato) {
      this.camera.postFX.addVignette(0.5, 0.5, 0.9, 0.3);
    }
  }

  updateZoomAndPan(playerX: number, enemyX: number) {
    let midX = (playerX + enemyX) / 2;
    let dist = Math.abs(playerX - enemyX);

    let targetZoom = 1.0;
    if (dist > 600) {
      targetZoom = 960 / (dist + 360);
    }
    targetZoom = Phaser.Math.Clamp(targetZoom, 0.6, 1.0);

    this.camera.setZoom(Phaser.Math.Linear(this.camera.zoom, targetZoom, 0.1));
    this.camera.centerOnX(
      Phaser.Math.Linear(this.camera.midPoint.x, midX, 0.1),
    );

    if (this.scene.battleUI?.uiContainer) {
      this.scene.battleUI.uiContainer.setScale(1 / this.camera.zoom);
      this.scene.battleUI.uiContainer.setPosition(
        (960 - 960 / this.camera.zoom) / 2,
        (540 - 540 / this.camera.zoom) / 2,
      );
    }
  }

  shake(duration: number = 200, intensity: number = 0.05) {
    const isPotato = this.scene.gameState?.settings?.lowPerformanceMode;
    if (isPotato) {
      const now = this.scene.time?.now || Date.now();
      // Throttle micro-shakes to prevent rendering frame-time spikes on low-end devices
      if (now - this.lastShakeTime < 75) return;
      this.lastShakeTime = now;

      // Deliver a punchy, short micro-shake that preserves impact feel
      const balancedDuration = Math.min(Math.round(duration * 0.45), 140);
      const balancedIntensity = Math.min(intensity * 0.4, 0.015);
      this.camera.shake(balancedDuration, balancedIntensity);
      return;
    }
    this.camera.shake(duration, intensity);
  }

  flash(
    duration: number = 100,
    r: number = 255,
    g: number = 255,
    b: number = 255,
    force: boolean = false,
  ) {
    // Keep flash punchy and brief (capped at 220ms) to avoid blocking gameplay or getting stuck
    const safeDuration = Math.min(duration, 220);
    const isPotato = this.scene.gameState?.settings?.lowPerformanceMode;
    const finalDuration = isPotato ? Math.min(safeDuration * 0.6, 100) : safeDuration;

    try {
      this.camera.flash(finalDuration, r, g, b, force);
    } catch (e) {
      console.warn("Camera flash error:", e);
    }

    // Safety watchdog: ensure flashEffect is guaranteed to reset and never stay frozen on screen
    if (this.scene.time) {
      this.scene.time.delayedCall(finalDuration + 60, () => {
        try {
          const flashEffect = (this.camera as any).flashEffect;
          if (flashEffect && flashEffect.isRunning) {
            flashEffect.reset();
          }
        } catch (e) {}
      });
    }
  }

  reset() {
    this.camera.setZoom(1);
    this.camera.centerOn(480, 270);
  }
}
