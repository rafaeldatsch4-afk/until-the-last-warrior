import React, { useEffect, useState, useRef } from 'react';

export const MobileControls: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || ('ontouchstart' in window));
    };
    checkMobile();
  }, []);

  if (!isMobile) return null;

  const handleTouch = (btn: string, state: boolean) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('mobile-input', { detail: { btn, state } }));
  };

  const btnClass = "w-14 h-14 rounded-full bg-black/50 border-2 border-white/50 text-white font-bold text-sm flex items-center justify-center active:bg-white/30 active:scale-95 transition-all select-none touch-none";

  return (
    <div 
      className="fixed inset-0 z-40 pointer-events-none flex justify-between items-end"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))'
      }}
    >
      {/* D-Pad (Left Side) */}
      <div className="pointer-events-auto flex flex-col items-center justify-end p-4 gap-2">
        <button 
          className={btnClass}
          onTouchStart={handleTouch('up', true)} onTouchEnd={handleTouch('up', false)} onMouseDown={handleTouch('up', true)} onMouseUp={handleTouch('up', false)}
        >UP</button>
        <div className="flex gap-10">
          <button 
            className={btnClass}
            onTouchStart={handleTouch('left', true)} onTouchEnd={handleTouch('left', false)} onMouseDown={handleTouch('left', true)} onMouseUp={handleTouch('left', false)}
          >LT</button>
          <button 
            className={btnClass}
            onTouchStart={handleTouch('right', true)} onTouchEnd={handleTouch('right', false)} onMouseDown={handleTouch('right', true)} onMouseUp={handleTouch('right', false)}
          >RT</button>
        </div>
        <button 
          className={btnClass}
          onTouchStart={handleTouch('down', true)} onTouchEnd={handleTouch('down', false)} onMouseDown={handleTouch('down', true)} onMouseUp={handleTouch('down', false)}
        >DN</button>
      </div>

      {/* Action Buttons (Right Side) */}
      <div className="pointer-events-auto grid grid-cols-3 gap-2 p-4 mb-4">
          <button 
            className={`${btnClass} !bg-orange-500/50 !border-orange-400`}
            onTouchStart={handleTouch('dsh', true)} onTouchEnd={handleTouch('dsh', false)}
          >DSH</button>
          <button 
            className={`${btnClass} !bg-cyan-500/50 !border-cyan-400`}
            onTouchStart={handleTouch('ki', true)} onTouchEnd={handleTouch('ki', false)}
          >KI</button>
          <button 
            className={`${btnClass} !bg-yellow-500/50 !border-yellow-400`}
            onTouchStart={handleTouch('spc', true)} onTouchEnd={handleTouch('spc', false)}
          >SPC</button>
          
          <button 
            className={`${btnClass} !bg-blue-500/50 !border-blue-400`}
            onTouchStart={handleTouch('def', true)} onTouchEnd={handleTouch('def', false)}
          >DEF</button>
          <button 
            className={`${btnClass} !bg-green-500/50 !border-green-400`}
            onTouchStart={handleTouch('chg', true)} onTouchEnd={handleTouch('chg', false)}
          >CHG</button>
          <button 
            className={`${btnClass} !w-16 !h-16 !bg-red-500/50 !border-red-400 !text-base`}
            onTouchStart={handleTouch('atk', true)} onTouchEnd={handleTouch('atk', false)}
          >ATK</button>
      </div>

    </div>
  );
};
