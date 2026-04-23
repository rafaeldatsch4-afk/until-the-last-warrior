
import React from 'react';
import GameCanvas from './components/GameCanvas';

const App: React.FC = () => {
  return (
    <div className="h-[100dvh] w-full flex flex-col bg-black text-white overflow-hidden">
      <main className="flex-1 flex items-center justify-center w-full p-0 relative overflow-hidden">
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

        <div className="relative overflow-hidden bg-[#071026] flex items-center justify-center w-full h-full">
          <GameCanvas />
        </div>
      </main>
    </div>
  );
};

export default App;
