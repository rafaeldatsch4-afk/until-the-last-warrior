import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../game/gameConfig';

const GameCanvas: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleSceneChange = (e: any) => {
      if (e.detail === 'MenuScene') {
        setIsLoaded(true);
      }
    };
    window.addEventListener('scene-changed', handleSceneChange);
    return () => window.removeEventListener('scene-changed', handleSceneChange);
  }, []);


  useEffect(() => {
    if (gameRef.current) return;

    if (containerRef.current) {
      // Clean up any stray canvases that might cause flickering and overlaps
      containerRef.current.innerHTML = '';

      const config = {
        ...gameConfig,
        parent: containerRef.current
      };

      gameRef.current = new Phaser.Game(config);

      let resizeTimeout: ReturnType<typeof setTimeout>;
      const handleResize = () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (gameRef.current && containerRef.current) {
            gameRef.current.scale.refresh();
          }
        }, 100);
      };

      window.addEventListener('resize', handleResize);
      setTimeout(handleResize, 100); // Initial resize
      
      return () => {
        window.removeEventListener('resize', handleResize);
        if (gameRef.current) {
          if (gameRef.current.sound) {
            gameRef.current.sound.pauseOnBlur = false;
          }
          gameRef.current.events.off('hidden');
          gameRef.current.events.off('visible');
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
      };
    }
  }, []);

  return (
    <>
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black">
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-yellow-500 font-retro tracking-widest animate-pulse">CARREGANDO...</p>
        </div>
      )}
      <div 
         ref={containerRef} 
         id="game-container" 
         className="w-full h-full bg-black overflow-hidden flex items-center justify-center touch-none overscroll-none"
      />
    </>
  );
};

export default GameCanvas;