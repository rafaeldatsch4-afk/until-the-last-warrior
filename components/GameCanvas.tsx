import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../game/gameConfig';

const GameCanvas: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div 
      ref={containerRef} 
      id="game-container" 
      className="w-full h-full bg-black overflow-hidden flex items-center justify-center touch-none overscroll-none"
    />
  );
};

export default GameCanvas;