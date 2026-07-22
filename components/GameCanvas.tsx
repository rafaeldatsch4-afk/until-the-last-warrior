import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../game/gameConfig';
import { auth, db } from '../firebase/init';
import { doc, onSnapshot } from 'firebase/firestore';

const GameCanvas: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  
  // Middleware de sincronização de moedas
  useEffect(() => {
    let unsubscribeProgress: () => void;
    let unsubscribeProfile: () => void;

    const setupSync = () => {
      const unsubAuth = auth.onAuthStateChanged((user) => {
        if (unsubscribeProgress) unsubscribeProgress();
        if (unsubscribeProfile) unsubscribeProfile();

        if (user) {
          // Listen to the cloud save progress doc
          const progressRef = doc(db, 'users', user.uid, 'save', 'progress');
          unsubscribeProgress = onSnapshot(progressRef, (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (data.coins !== undefined && window.UTLW && window.UTLW.state) {
                if (window.UTLW.state.coins !== data.coins) {
                  window.UTLW.state.coins = data.coins;
                  window.dispatchEvent(new CustomEvent('sync-coins', { detail: { coins: data.coins } }));
                }
              }
            }
          });

          // Listen to the user profile doc just in case coins are updated there directly
          const userRef = doc(db, 'users', user.uid);
          unsubscribeProfile = onSnapshot(userRef, (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (data.coins !== undefined && window.UTLW && window.UTLW.state) {
                // If profile has more coins, sync to game (e.g. bought in store)
                // We'll trust the game state primarily, but if they differ significantly, we can sync.
                // Actually, just syncing from progressRef is usually enough, but we can do it here too
                // if we want to ensure both are in sync.
                if (window.UTLW.state.coins !== data.coins) {
                  window.UTLW.state.coins = data.coins;
                  // Also we should save to progress to keep both in sync
                  if (window.UTLW.save) window.UTLW.save();
                  window.dispatchEvent(new CustomEvent('sync-coins', { detail: { coins: data.coins } }));
                }
              }
            }
          });
        }
      });
      return unsubAuth;
    };

    const unsubAuth = setupSync();

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubscribeProgress) unsubscribeProgress();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

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
      <style>{`
        #game-container canvas {
          width: 100% !important;
          height: 100% !important;
          object-fit: fill !important;
        }
      `}</style>
      <div
          ref={containerRef}
          id="game-container"
          className="w-full h-full bg-black overflow-hidden flex items-center justify-center touch-none overscroll-none"
      />
    </>
  );
};

export default GameCanvas;