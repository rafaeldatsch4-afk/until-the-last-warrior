import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ToastData {
  id: number;
  title: string;
  desc: string;
}

/**
 * Toca um efeito sonoro de celebração com fanfarra triunfante e brilho sonoro
 */
function playCelebrationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    let sfxVol = 0.6;
    try {
      const state = (window as any).UTLW?.state;
      if (state?.settings?.sfxVolume !== undefined) {
        sfxVol = Math.max(0, Math.min(1, state.settings.sfxVolume * 0.6));
      }
    } catch {}

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Sequência de notas triunfantes: C5 -> E5 -> G5 -> C6 + harmonização cintilante (E6, G6, C7)
    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.14, type: 'triangle' as OscillatorType, gain: 0.4 * sfxVol },
      { freq: 659.25, time: 0.10, dur: 0.14, type: 'triangle' as OscillatorType, gain: 0.45 * sfxVol },
      { freq: 783.99, time: 0.20, dur: 0.16, type: 'triangle' as OscillatorType, gain: 0.5 * sfxVol },
      { freq: 1046.50, time: 0.32, dur: 0.85, type: 'triangle' as OscillatorType, gain: 0.6 * sfxVol },
      // Harmonização e brilho sonoro de vitória
      { freq: 1318.51, time: 0.34, dur: 0.82, type: 'sine' as OscillatorType, gain: 0.35 * sfxVol },
      { freq: 1567.98, time: 0.36, dur: 0.80, type: 'sine' as OscillatorType, gain: 0.3 * sfxVol },
      { freq: 2093.00, time: 0.38, dur: 0.75, type: 'sine' as OscillatorType, gain: 0.22 * sfxVol },
      { freq: 2637.02, time: 0.40, dur: 0.65, type: 'sine' as OscillatorType, gain: 0.15 * sfxVol },
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      const startTime = now + note.time;
      const endTime = startTime + note.dur;

      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, note.gain), startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(endTime + 0.05);
    });

    setTimeout(() => {
      try {
        if (ctx.state !== 'closed') {
          ctx.close();
        }
      } catch {}
    }, 1600);
  } catch (err) {
    console.warn("Celebration audio error:", err);
  }
}

export const AchievementToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    let nextId = 0;
    const handleAchievement = (e: any) => {
      const newToast = {
        id: nextId++,
        title: e.detail.title,
        desc: e.detail.desc,
      };
      
      setToasts(prev => [...prev, newToast]);
      playCelebrationSound();
      
      // Remove after 4 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 4000);
    };

    window.addEventListener('achievement-unlocked', handleAchievement);
    return () => window.removeEventListener('achievement-unlocked', handleAchievement);
  }, []);

  return (
    <div className="absolute z-50 flex flex-col gap-2 pointer-events-none" style={{ top: 'max(4rem, calc(3rem + env(safe-area-inset-top)))', left: 'max(1rem, env(safe-area-inset-left))' }}>
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-[#111625] border-2 border-[#f1c40f] rounded-lg p-3 w-72 shadow-[0_0_15px_rgba(241,196,15,0.4)] flex items-start gap-3 pointer-events-auto"
          >
            <div className="bg-[#f1c40f] rounded-full p-2 flex-shrink-0 mt-1 shadow-[0_0_10px_rgba(241,196,15,0.8)] flex items-center justify-center h-10 w-10">
              <span className="text-xl">🏆</span>
            </div>
            <div className="flex flex-col">
              <span className="text-yellow-400 font-bold text-[10px] uppercase tracking-wider">Conquista Desbloqueada!</span>
              <span className="text-white font-bold text-lg leading-tight mt-1">{toast.title}</span>
              <span className="text-slate-300 text-xs leading-tight mt-1">{toast.desc}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
