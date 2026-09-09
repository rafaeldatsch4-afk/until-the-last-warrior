/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from 'virtual:pwa-register';

/** Updating is explicit: never reload a battle or erase the player's save. */
export function registerGameUpdates() {
  if (!('serviceWorker' in navigator)) return;
  let notice: HTMLDivElement | undefined;
  const update = registerSW({
    immediate: true,
    onNeedRefresh() {
      if (notice) return;
      notice = document.createElement('div');
      notice.setAttribute('role', 'status');
      notice.style.cssText = 'position:fixed;top:max(8px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:10000;padding:10px 16px;background:#172033;color:white;border:1px solid #64748b;border-radius:12px;font:14px system-ui;display:flex;gap:12px;align-items:center;max-width:90vw';
      const message = document.createElement('span');
      message.textContent = 'Nova versão disponível';
      const button = document.createElement('button');
      button.textContent = 'Atualizar jogo';
      button.style.cssText = 'padding:8px 12px;background:#38bdf8;color:#07111f;border:0;border-radius:6px;font-weight:bold;cursor:pointer';
      button.onclick = () => {
        button.disabled = true;
        update(true).catch(() => { button.disabled = false; });
      };
      notice.append(message, button);
      document.body.append(notice);
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      let lastCheck = 0;
      const check = () => {
        if (document.hidden || Date.now() - lastCheck < 60_000) return;
        lastCheck = Date.now();
        registration.update().catch(() => {}); // Offline play remains available.
      };
      window.addEventListener('focus', check);
      document.addEventListener('visibilitychange', check);
      check();
    },
    onRegisterError(error) { console.warn('Não foi possível verificar atualizações do jogo.', error); },
  });
}
