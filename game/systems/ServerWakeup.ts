/// <reference types="vite/client" />

const RAILWAY_URL = "https://until-the-last-warrior-production.up.railway.app";
const WAKE_INTERVAL_MS = 5 * 60_000;

/** Base URL of the online PvP server ("" means same origin, as in local dev). */
export function getMultiplayerServerUrl(): string {
  const host = window.location.hostname;
  if (host.includes("run.app") || host === "localhost") return "";
  return import.meta.env.VITE_MULTIPLAYER_URL || RAILWAY_URL;
}

/**
 * The Railway free plan puts the PvP server to sleep when idle, and waking it takes a few
 * seconds. Ping it as soon as someone opens the game (and again when they come back to the
 * tab) so it is already awake if they pick online PvP. Failures are ignored: offline play
 * never depends on it.
 */
export function wakeMultiplayerServerOnVisit() {
  const url = getMultiplayerServerUrl();
  if (!url) return;
  let lastWake = 0;
  const wake = () => {
    if (document.hidden || !navigator.onLine || Date.now() - lastWake < WAKE_INTERVAL_MS) return;
    lastWake = Date.now();
    fetch(`${url}/api/health`, { mode: "no-cors", cache: "no-store" }).catch(() => {});
  };
  document.addEventListener("visibilitychange", wake);
  wake();
}
