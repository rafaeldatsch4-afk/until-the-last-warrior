import Phaser from "phaser";

export const transitionTo = (scene: Phaser.Scene, targetScene: string, data?: any) => {
  window.dispatchEvent(new CustomEvent('scene-transition-start'));
  
  let isFinished = false;
  const finishTransition = () => {
    if (isFinished) return;
    isFinished = true;
    window.dispatchEvent(new CustomEvent('scene-transition-end'));
  };

  // Allow 150ms for transition overlay to smoothly fade in
  setTimeout(() => {
    try {
      const targetSceneInstance = scene.scene.get(targetScene);
      if (targetSceneInstance) {
        targetSceneInstance.events.once('create', () => {
          setTimeout(finishTransition, 40);
        });
        targetSceneInstance.events.once('start', () => {
          setTimeout(finishTransition, 80);
        });
      }
      scene.scene.start(targetScene, data);
    } catch (err) {
      console.warn("Scene transition fallback:", err);
      finishTransition();
    }

    // Hard fallback timeout ensures black screen can NEVER get stuck
    setTimeout(finishTransition, 250);
  }, 150);
};
