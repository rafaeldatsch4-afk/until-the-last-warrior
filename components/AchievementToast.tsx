import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ToastData {
  id: number;
  title: string;
  desc: string;
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
      
      // Remove after 4 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 4000);
    };

    window.addEventListener('achievement-unlocked', handleAchievement);
    return () => window.removeEventListener('achievement-unlocked', handleAchievement);
  }, []);

  return (
    <div className="absolute top-16 left-4 z-50 flex flex-col gap-2 pointer-events-none">
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
