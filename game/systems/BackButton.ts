/**
 * Android back button / back gesture.
 *
 * Installed as an app (PWABuilder / TWA) or opened from the home screen, the game is a
 * single page with no history, so "back" closed it. Keep one guard entry in the history
 * and turn each back press into the in-game "back": the same ESC every screen already
 * handles (previous screen, pause menu in battle). On the main menu the first press only
 * warns; a second press within 2 s is allowed through and closes the app normally.
 */

const GUARD = { utlwBackGuard: true };
const EXIT_WINDOW_MS = 2000;
const ROOT_SCENES = new Set(["MenuScene", "BootScene", "PreloadScene"]);

/** React overlays (login/profile modal) call preventDefault() on this event to consume "back". */
export const BACK_EVENT = "utlw-back";

function pressEscape() {
  for (const type of ["keydown", "keyup"] as const) {
    const event = new KeyboardEvent(type, { key: "Escape", code: "Escape", bubbles: true, cancelable: true });
    // Phaser maps keys by keyCode, which the KeyboardEvent constructor cannot set
    Object.defineProperty(event, "keyCode", { get: () => 27 });
    Object.defineProperty(event, "which", { get: () => 27 });
    window.dispatchEvent(event);
  }
}

function showExitHint() {
  const hint = document.createElement("div");
  hint.setAttribute("role", "status");
  hint.textContent = "Pressione voltar de novo para sair";
  hint.style.cssText =
    "position:fixed;left:50%;bottom:max(24px,env(safe-area-inset-bottom));transform:translateX(-50%);" +
    "z-index:10001;padding:10px 18px;background:rgba(7,16,38,.92);color:#fff;border:1px solid #38bdf8;" +
    "border-radius:999px;font:600 14px system-ui,sans-serif;pointer-events:none";
  document.body.append(hint);
  setTimeout(() => hint.remove(), EXIT_WINDOW_MS);
}

function activeSceneKeys(): string[] {
  const game = (window as any).gameInstance;
  if (!game?.scene) return [];
  return game.scene.getScenes(true).map((s: any) => s.scene.key as string);
}

export function installBackButton() {
  if (typeof window === "undefined" || !window.history?.pushState) return;

  let exitArmedUntil = 0;
  const arm = () => window.history.pushState(GUARD, "");
  if (!window.history.state?.utlwBackGuard) arm();

  window.addEventListener("popstate", () => {
    // A React overlay is open: let it close itself
    const overlay = new CustomEvent(BACK_EVENT, { cancelable: true });
    if (!window.dispatchEvent(overlay)) {
      arm();
      return;
    }

    const scenes = activeSceneKeys();
    const atRoot = scenes.length === 0 || scenes.every((key) => ROOT_SCENES.has(key));

    if (atRoot) {
      if (Date.now() < exitArmedUntil) return; // second press: nothing left in history, the app closes
      exitArmedUntil = Date.now() + EXIT_WINDOW_MS;
      showExitHint();
      // Not re-armed on purpose, so a second press really leaves; re-arm once the window passes
      setTimeout(() => {
        if (Date.now() >= exitArmedUntil && !window.history.state?.utlwBackGuard) arm();
      }, EXIT_WINDOW_MS);
      return;
    }

    arm();
    pressEscape();
  });
}
