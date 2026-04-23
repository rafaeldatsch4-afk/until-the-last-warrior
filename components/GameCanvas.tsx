import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../game/gameConfig';

const GameCanvas: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameRef.current) return;

    // Ensure the container exists before initializing
    if (containerRef.current) {
      // Create a new configuration object to force the parent
      const config = {
        ...gameConfig,
        parent: containerRef.current
      };

      gameRef.current = new Phaser.Game(config);
    }

    return () => {
      if (gameRef.current) {
        // Prevent AudioContext errors during HMR/unmount by disabling pause on blur
        if (gameRef.current.sound) {
          gameRef.current.sound.pauseOnBlur = false;
        }
        // Remove visibility listeners to prevent AudioContext errors after destruction
        gameRef.current.events.off('hidden');
        gameRef.current.events.off('visible');
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      id="game-container" 
      className="w-full h-full bg-[#071026] flex items-center justify-center"
    />
  );
};

export default GameCanvas;