import Phaser from "phaser";

export const transitionTo = (scene: Phaser.Scene, targetScene: string, data?: any) => {
  scene.cameras.main.fadeOut(300, 0, 0, 0);
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    scene.scene.start(targetScene, data);
  });
};
