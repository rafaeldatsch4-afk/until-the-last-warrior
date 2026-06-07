
import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import { AuthButton } from './components/AuthModal';

const App: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isMenuScene, setIsMenuScene] = useState(true); // Default to true, assuming we start near menu

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);

    const handleSceneChange = (e: any) => {
      if (e.detail === 'MenuScene') {
        setIsMenuScene(true);
      } else {
        setIsMenuScene(false);
      }
    };
    window.addEventListener('scene-changed', handleSceneChange);

    // Listen for PWA installation prompt
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      (window as any).deferredPWAInstallPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleRequestInstall = async () => {
      const prompt = (window as any).deferredPWAInstallPrompt;
      if (prompt) {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
          (window as any).deferredPWAInstallPrompt = null;
          setDeferredPrompt(null);
        } else {
          console.log('User dismissed the install prompt');
        }
      }
    };
    window.addEventListener('request-pwa-install', handleRequestInstall);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('request-pwa-install', handleRequestInstall);
      window.removeEventListener('scene-changed', handleSceneChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.log(e));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(e => console.log(e));
      }
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-black text-white overflow-hidden relative">
      <main className="flex-1 flex items-center justify-center w-full p-0 relative overflow-hidden">
        <AuthButton />
        {/* Buttons Container */}
        <div className="absolute top-4 right-4 z-40 flex flex-col sm:flex-row gap-2">
          {isMenuScene && (
            <button
              onClick={toggleFullscreen}
              className="bg-black/50 hover:bg-black/80 text-white p-2 text-sm rounded backdrop-blur transition-all outline-none hidden landscape:block md:block border border-yellow-500/50"
              title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
            >
              {isFullscreen ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Rotate Device Overlay */}
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center landscape:hidden md:hidden">
          <div className="w-32 h-32 mb-8 animate-bounce">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400 w-full h-full">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <path d="M12 18h.01" />
              <path d="M16.5 9.4L19 12l-2.5 2.6" />
              <path d="M19 12H9" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 tracking-wide font-retro leading-tight">GIRE O<br/>CELULAR</h2>
          <p className="text-slate-300 text-lg mb-8 max-w-xs">Para a melhor experiência e resolução, jogue com a tela deitada.</p>
          <button 
            onClick={() => {
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(e => console.log(e));
              }
            }}
            className="px-8 py-4 bg-yellow-500 text-black font-bold rounded-full shadow-lg hover:bg-yellow-400 active:scale-95 transition-all text-lg"
          >
            TELA CHEIA
          </button>
        </div>

        <div className="relative overflow-hidden bg-black flex items-center justify-center w-full h-full">
          <GameCanvas />
        </div>
      </main>
    </div>
  );
};

export default App;
