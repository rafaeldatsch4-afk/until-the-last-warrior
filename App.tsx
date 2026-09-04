
import React, { useState, useEffect, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import { AuthButton } from './components/AuthModal';
import { AchievementToast } from './components/AchievementToast';

interface TextInputPromptData {
  title: string;
  currentValue: string;
  onComplete: (val: string) => void;
}

const TextInputModal: React.FC<{
  prompt: TextInputPromptData;
  onClose: () => void;
}> = ({ prompt, onClose }) => {
  const [text, setText] = useState(prompt.currentValue || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Disable Phaser keyboard capture and listeners while typing
    const game = (window as any).gameInstance;
    if (game?.input?.keyboard) {
      game.input.keyboard.enabled = false;
      if (typeof game.input.keyboard.stopListeners === 'function') {
        game.input.keyboard.stopListeners();
      }
      if (game.input.keyboard.preventDefault !== undefined) {
        game.input.keyboard.preventDefault = false;
      }
    }

    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      // Re-enable Phaser keyboard input when modal closes
      if (game?.input?.keyboard) {
        game.input.keyboard.enabled = true;
        if (typeof game.input.keyboard.startListeners === 'function') {
          game.input.keyboard.startListeners();
        }
      }
    };
  }, []);

  const handleConfirm = () => {
    const finalVal = text.trim() || prompt.currentValue || "Guerreiro";
    prompt.onComplete(finalVal);
    onClose();
  };

  const handleCharClick = (char: string) => {
    if (text.length < 16) {
      setText((prev) => prev + char);
    }
  };

  const handleBackspace = () => {
    setText((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setText('');
  };

  const quickLetters = [
    "A","B","C","D","E","F","G","H","I","J","K","L","M",
    "N","O","P","Q","R","S","T","U","V","W","X","Y","Z",
    "0","1","2","3","4","5","6","7","8","9"," "
  ];

  return (
    <div 
      className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-[#0f172a] border-2 border-[#38bdf8] p-4 sm:p-5 rounded-xl shadow-2xl max-w-md w-full flex flex-col gap-3 text-white"
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
          <h3 className="text-base sm:text-lg font-bold text-sky-400 font-mono flex items-center gap-2">
            <span>⚔️</span> {prompt.title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl font-bold px-2"
          >
            ✕
          </button>
        </div>

        {/* Input box */}
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            maxLength={16}
            value={text}
            onChange={(e) => setText(e.target.value.substring(0, 16))}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') {
                handleConfirm();
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="Digite o nome..."
            className="w-full bg-[#1e293b] text-yellow-300 text-center text-lg sm:text-xl font-bold p-3 rounded-lg border-2 border-slate-600 focus:border-yellow-400 outline-none uppercase tracking-wider shadow-inner"
            autoFocus
          />
          {text.length > 0 && (
            <button
              onClick={handleClear}
              className="absolute right-3 text-slate-400 hover:text-red-400 font-bold text-sm px-2 py-1 bg-slate-800 rounded"
              title="Limpar"
            >
              ✕
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 text-center">
          {text.length}/16 caracteres • Digite pelo teclado ou toque nas teclas abaixo
        </div>

        {/* Virtual on-screen keypad for touch/mobile */}
        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-wrap justify-center gap-1 max-h-36 overflow-y-auto">
          {quickLetters.map((char) => (
            <button
              key={char}
              type="button"
              onClick={() => handleCharClick(char)}
              className="px-2 py-1.5 bg-slate-800 hover:bg-sky-600 active:bg-sky-500 rounded text-xs sm:text-sm font-mono font-bold text-slate-200 min-w-[28px] transition-colors"
            >
              {char === " " ? "ESPAÇO" : char}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            className="px-3 py-1.5 bg-red-950/80 hover:bg-red-800 active:bg-red-700 rounded text-xs sm:text-sm font-bold text-red-200 transition-colors"
          >
            ⌫ APAGAR
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-1">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 py-2.5 sm:py-3 rounded-lg font-bold uppercase transition-all text-sm"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 active:scale-95 text-slate-950 py-2.5 sm:py-3 rounded-lg font-bold uppercase tracking-wide transition-all shadow-lg font-mono text-sm"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isMenuScene, setIsMenuScene] = useState(true);
  const [textInputPrompt, setTextInputPrompt] = useState<TextInputPromptData | null>(null);
  const [isShaking, setIsShaking] = useState<string | false>(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const onFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFull);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);

    const handleSceneChange = (e: any) => {
      if (e.detail === 'MenuScene') {
        setIsMenuScene(true);
      } else {
        setIsMenuScene(false);
      }
    };
    window.addEventListener('scene-changed', handleSceneChange);

    const handleTextInput = (e: any) => {
      setTextInputPrompt(e.detail);
    };
    window.addEventListener('request-text-input', handleTextInput);

    const handleShakeScreen = (e: any) => {
      let intensity = e.detail?.intensity || 'medium';
      let duration = 400;
      if (intensity === 'light') duration = 200;
      else if (intensity === 'heavy') duration = 600;
      else if (intensity === 'super') {
        intensity = 'heavy';
        duration = 750;
      }
      setIsShaking(intensity);
      setTimeout(() => setIsShaking(false), duration);
    };
    window.addEventListener('shake-screen', handleShakeScreen);

    const handleTransitionStart = () => {
      setIsTransitioning(true);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      // Hard timeout guarantee: transition can NEVER stay black
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 400);
    };

    const handleTransitionEnd = () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      setIsTransitioning(false);
    };

    window.addEventListener('scene-transition-start', handleTransitionStart);
    window.addEventListener('scene-transition-end', handleTransitionEnd);

    // Listen for PWA installation prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
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
          (window as any).deferredPWAInstallPrompt = null;
          setDeferredPrompt(null);
        }
      }
    };
    window.addEventListener('request-pwa-install', handleRequestInstall);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMenuScene && !textInputPrompt) {
        if (['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
          window.dispatchEvent(new CustomEvent('menu-nav', { detail: e.key }));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      window.removeEventListener('scene-transition-start', handleTransitionStart);
      window.removeEventListener('scene-transition-end', handleTransitionEnd);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange', onFullscreenChange);
      document.removeEventListener('MSFullscreenChange', onFullscreenChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('request-pwa-install', handleRequestInstall);
      window.removeEventListener('scene-changed', handleSceneChange);
      window.removeEventListener('request-text-input', handleTextInput);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('shake-screen', handleShakeScreen);
    };
  }, [isMenuScene, textInputPrompt]);

  const toggleFullscreen = () => {
    const doc = document as any;
    const docEl = document.documentElement as any;
    const isFull = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (!isFull) {
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch((e: any) => console.log(e));
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch((e: any) => console.log(e));
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  };

  return (
    <div className={`fixed inset-0 bg-[#071026] text-white overflow-hidden flex flex-col ${isShaking ? `animate-shake-screen-${isShaking}` : ''}`}>
      <main className="flex-1 w-full p-0 relative overflow-hidden">
        <AuthButton />
        <AchievementToast />
        
        {/* Fullscreen Button - Only on First Screen (MenuScene) */}
        {isMenuScene && (
          <div 
            className="absolute z-40"
            style={{ 
              top: 'max(1rem, env(safe-area-inset-top))', 
              right: 'max(1rem, env(safe-area-inset-right))' 
            }}
            onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
            onMouseDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
            onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
            onTouchStart={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
          >
            <button
              onClick={toggleFullscreen}
              className="group relative flex items-center justify-center w-10 h-10 bg-gray-900 rounded-sm border border-yellow-500/50 hover:border-yellow-500 hover:bg-black active:scale-95 transition-all duration-300 shadow-lg"
              title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
              aria-label={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
            >
              {isFullscreen ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              )}
            </button>
          </div>
        )}

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

        {/* Interactive Text Input Prompt */}
        {textInputPrompt && (
          <TextInputModal
            prompt={textInputPrompt}
            onClose={() => setTextInputPrompt(null)}
          />
        )}

        <div className="relative overflow-hidden bg-[#071026] w-full h-full">
          <GameCanvas />
        </div>
      </main>

      {/* Scene Transition Overlay (pointer-events-none ensures it never blocks clicks) */}
      <div 
        className={`fixed inset-0 bg-black z-[200] pointer-events-none transition-opacity duration-200 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
      ></div>
    </div>
  );
};

export default App;

