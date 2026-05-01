import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../game/gameConfig';

const GameCanvas: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameRef.current) return;

    if (containerRef.current) {
      const config = {
        ...gameConfig,
        parent: containerRef.current
      };

      gameRef.current = new Phaser.Game(config);

      const handleResize = () => {
        if (gameRef.current && containerRef.current) {
          gameRef.current.scale.resize(960, 540);
          if (gameRef.current.canvas) {
            gameRef.current.canvas.style.width = `${containerRef.current.clientWidth}px`;
            gameRef.current.canvas.style.height = `${containerRef.current.clientHeight}px`;
          }
        }
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
      className="w-full h-full bg-black overflow-hidden flex items-center justify-center [&>canvas]:!w-full [&>canvas]:!h-full [&>canvas]:!object-fill [&>canvas]:![image-rendering:pixelated]"
    />
  );
};

export default GameCanvas;