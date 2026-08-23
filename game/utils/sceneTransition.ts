import Phaser from "phaser";

export const transitionTo = (scene: Phaser.Scene, targetScene: string, data?: any) => {
  window.dispatchEvent(new CustomEvent('scene-transition-start'));
  
  let isFinished = false;
  const finishTransition = () => {
    if (isFinished) return;
    isFinished = true;
    window.dispatchEvent(new CustomEvent('scene-transition-end'));
  };

  // 100ms for overlay to fade in cleanly
  setTimeout(() => {
    try {
      if (scene && scene.scene) {
        const targetSceneInstance = scene.scene.get(targetScene);
        if (targetSceneInstance) {
          targetSceneInstance.events.once('create', () => {
            setTimeout(finishTransition, 40);
          });
          targetSceneInstance.events.once('start', () => {
            setTimeout(finishTransition, 40);
          });
        }
        scene.scene.start(targetScene, data);
      } else {
        finishTransition();
      }
    } catch (err) {
      console.warn("Scene transition fallback:", err);
      finishTransition();
    }

    // Guaranteed hard timeout so black screen NEVER gets stuck
    setTimeout(finishTransition, 180);
  }, 100);
};
