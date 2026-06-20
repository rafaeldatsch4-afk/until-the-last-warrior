import Phaser from "phaser";
import type BattleScene from "../scenes/BattleScene";

export class BattleCamera {
  scene: BattleScene;
  camera: Phaser.Cameras.Scene2D.Camera;

  constructor(scene: BattleScene) {
    this.scene = scene;
    this.camera = scene.cameras.main;
  }

  setupCamera(mapWidth: number) {
    this.camera.setBounds(-500, -500, mapWidth + 1000, 1500);

    if (this.camera.postFX) {
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
    this.camera.shake(duration, intensity);
  }

  flash(
    duration: number = 100,
    r: number = 255,
    g: number = 255,
    b: number = 255,
    force: boolean = false,
  ) {
    this.camera.flash(duration, r, g, b, force);
  }

  reset() {
    this.camera.setZoom(1);
    this.camera.centerOn(480, 270);
  }
}
