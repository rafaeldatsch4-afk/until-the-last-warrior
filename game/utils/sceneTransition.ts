import type Phaser from "phaser";
import { ensureScene } from "../systems/SceneLoader";

const transitioning = new WeakSet<Phaser.Scene>();

export const transitionTo = (scene: Phaser.Scene, targetScene: string, data?: any) => {
  if (transitioning.has(scene)) return;
  transitioning.add(scene);
  window.dispatchEvent(new CustomEvent('scene-transition-start'));
  
  let isFinished = false;
  const finishTransition = () => {
    if (isFinished) return;
    isFinished = true;
    transitioning.delete(scene);
    window.dispatchEvent(new CustomEvent('scene-transition-end'));
  };

  // 100ms for overlay to fade in cleanly
  setTimeout(async () => {
    try {
      if (scene && scene.scene) {
        await ensureScene(scene, targetScene);
        if (!scene.sys.isActive()) { finishTransition(); return; }
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
      console.warn("Scene transition failed:", err);
      window.dispatchEvent(new CustomEvent("scene-load-error"));
      finishTransition();
    }

    // Guaranteed hard timeout so black screen NEVER gets stuck
    setTimeout(finishTransition, 180);
  }, 100);
};
