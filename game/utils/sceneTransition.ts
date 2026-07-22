import Phaser from "phaser";

export const transitionTo = (scene: Phaser.Scene, targetScene: string, data?: any) => {
  window.dispatchEvent(new CustomEvent('scene-transition-start'));
  
  setTimeout(() => {
    const newScene = scene.scene.get(targetScene);
    newScene.events.once('create', () => {
      // Delay slightly to ensure first frame is rendered
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('scene-transition-end'));
      }, 50);
    });
    scene.scene.start(targetScene, data);
  }, 300);
};
