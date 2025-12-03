import React, { useState, useEffect, useRef, memo, useMemo, PropsWithChildren } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDebugEnabled, setDebugEnabled } from '../config';

type Resolution = '1080' | '720';

function usePersistedResolution(key: string, initial: Resolution): [Resolution, () => void] {
  const [resolution, setResolution] = useState<Resolution>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored === '1080' || stored === '720') return stored as Resolution;
    } catch {}
    return initial;
  });
  
  const toggle = () => {
    const newRes: Resolution = resolution === '1080' ? '720' : '1080';
    setResolution(newRes);
    try {
      window.localStorage.setItem(key, newRes);
    } catch {}
  };
  
  return [resolution, toggle];
}

type TabletFrameProps = PropsWithChildren<{
  forcedOpen?: boolean;
}>;

type WrapperRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

const TabletFrame = memo(function TabletFrame({ forcedOpen, children }: TabletFrameProps) {
  const [resolution, toggleResolution] = usePersistedResolution('ps-mdt:resolution', '1080');
  const [isPeeking, setIsPeeking] = useState(false);
  const [debugEnabled, setDebugEnabledState] = useState(getDebugEnabled());
  
  const toggleDebug = () => {
    const newValue = !debugEnabled;
    setDebugEnabled(newValue);
    setDebugEnabledState(newValue);
  };
  
  // Resolution configurations - Full Screen vs Compact mode
  const resolutionConfig = useMemo(() => ({
    '1080': {
      width: '98vw',
      maxWidth: 2560,
      height: '98vh',
      maxHeight: 1440,
      label: 'Full Screen',
      description: 'Maximum viewing area',
      peekDistance: '92vh',
      aspectRatio: '16/9',
      scale: 1.0,
      padding: '2.5vh'
    },
    '720': {
      width: '70vw',
      maxWidth: 1280,
      height: '75vh',
      maxHeight: 800,
      label: 'Compact',
      description: 'Smaller, space-saving view',
      peekDistance: '70vh',
      aspectRatio: '16/10',
      scale: 0.85,
      padding: '2vh'
    }
  }), []);
  
  const config = resolutionConfig[resolution];
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperRect, setWrapperRect] = useState<WrapperRect | null>(null);
  
  // Keyboard shortcut for mode toggle (Ctrl/Cmd + M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        toggleResolution();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleResolution]);
  
  useEffect(() => {
    if (!import.meta?.env?.DEV) return undefined;
    let mounted = true;
    const update = () => {
      try {
        const el = wrapperRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (!mounted) return;
        setWrapperRect({
          top: Math.round(r.top),
          left: Math.round(r.left),
          width: Math.round(r.width),
          height: Math.round(r.height),
          right: Math.round(window.innerWidth - (r.left + r.width)),
          bottom: Math.round(window.innerHeight - (r.top + r.height))
        });
      } catch (e) {}
    };
    update();
    const id = setInterval(update, 300);
    window.addEventListener('resize', update);
    return () => { mounted = false; clearInterval(id); window.removeEventListener('resize', update); };
  }, [resolution, forcedOpen]);
  
  return (
    <div
      className="tablet-viewport-layer"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        background: 'transparent',
        zIndex: 1000
      }}
    >
      <div
        className="tablet-viewport-stage"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          background: 'transparent'
        }}
      >
        {/* Semi-transparent backdrop/shadow behind tablet - removed for FiveM transparency */}
        {/* The backdrop has been removed to allow game view to show through */}

        {/* tablet device */}
        <AnimatePresence>
          {forcedOpen && (
            <motion.div
              ref={wrapperRef}
              // show a debug outline in dev builds to visualize alignment
              className={import.meta?.env?.DEV ? 'ps-mdt-debug-wrapper' : ''}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: isPeeking ? config.peekDistance : 0
              }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{
                duration: 0.25,
                ease: [0.16, 1, 0.3, 1],
                y: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
              }}
              style={{
                width: config.width,
                maxWidth: config.maxWidth,
                height: config.height,
                maxHeight: config.maxHeight,
                aspectRatio: config.aspectRatio,
                perspective: 1000,
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'stretch',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {import.meta?.env?.DEV && wrapperRect && (
                <div style={{
                  position: 'absolute',
                  left: 8,
                  top: 8,
                  zIndex: 9999,
                  background: 'rgba(0,0,0,0.6)',
                  color: '#e6f6ff',
                  padding: '6px 8px',
                  borderRadius: 6,
                  fontSize: 12,
                  lineHeight: '1.2'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>wrapper</div>
                  <div>top: {wrapperRect.top}px</div>
                  <div>left: {wrapperRect.left}px</div>
                  <div>width: {wrapperRect.width}px</div>
                  <div>height: {wrapperRect.height}px</div>
                  <div>right: {wrapperRect.right}px</div>
                  <div>bottom: {wrapperRect.bottom}px</div>
                </div>
              )}
              <div style={{ width: '100%', height: '100%', position: 'relative', paddingTop: '20px' }}>
                {/* Peek Mode Bar - Above tablet frame */}
                <motion.button
                  whileHover={{ opacity: 0.9, height: '24px' }}
                  onClick={() => setIsPeeking(!isPeeking)}
                  style={{
                    position: 'absolute',
                    top: '0',
                    left: '50%',
                    width: '90%',
                    maxWidth: '90%',
                    height: '18px',
                    zIndex: 25,
                    borderRadius: '8px 8px 0 0',
                    background: isPeeking 
                      ? 'linear-gradient(180deg, rgba(34,197,94,0.25) 0%, rgba(34,197,94,0.1) 100%)' 
                      : 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%)',
                    border: 'none',
                    borderBottom: isPeeking 
                      ? '2px solid rgba(34,197,94,0.4)' 
                      : '1px solid rgba(255,255,255,0.1)',
                    color: isPeeking ? 'rgba(34,197,94,1)' : 'rgba(255,255,255,0.5)',
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    opacity: 0.7,
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    transition: 'all 0.2s ease',
                    transform: 'translateX(-50%)',
                    transformOrigin: 'center center',
                    boxShadow: isPeeking 
                      ? '0 2px 12px rgba(34,197,94,0.2)'
                      : '0 2px 6px rgba(0,0,0,0.2)'
                  }}
                  title={isPeeking ? 'Return tablet to normal position' : 'Peek over tablet to see the world'}
                >
                  <i className={`fa-solid ${isPeeking ? 'fa-eye' : 'fa-chevron-down'}`} style={{ fontSize: 10 }} />
                  <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {isPeeking ? 'Peeking' : 'Peek Mode'}
                  </span>
                  <i className={`fa-solid ${isPeeking ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ fontSize: 10 }} />
                </motion.button>

                {/* Tablet bezel/frame */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: 'calc(100% - 20px)',
                  padding: config.padding,
                  borderRadius: '0 0 2.8vh 2.8vh',
                  background: resolution === '1080'
                    ? 'linear-gradient(145deg, rgba(26,31,46,0.75) 0%, rgba(15,20,25,0.65) 100%)'
                    : 'linear-gradient(145deg, rgba(31,26,46,0.7) 0%, rgba(20,15,30,0.6) 100%)',
                  boxShadow: resolution === '1080'
                    ? `
                      0 0 0 2px rgba(59,130,246,0.08),
                      inset 0 2px 4px rgba(59,130,246,0.05),
                      inset 0 -2px 4px rgba(0,0,0,0.4),
                      0 4px 24px rgba(0,0,0,0.3)
                    `
                    : `
                      0 0 0 2px rgba(168,85,247,0.08),
                      inset 0 2px 4px rgba(168,85,247,0.05),
                      inset 0 -2px 4px rgba(0,0,0,0.4),
                      0 2px 16px rgba(0,0,0,0.25)
                    `
                }}>
                  {/* Display Mode Toggle Button - Minimal */}
                  <motion.button
                    whileHover={{ opacity: 0.8, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleResolution}
                    style={{
                      position: 'absolute',
                      top: '0.8vh',
                      right: '1vw',
                      zIndex: 20,
                      width: '20px',
                      height: '20px',
                      padding: 0,
                      borderRadius: 4,
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: resolution === '1080' 
                        ? 'rgba(96,165,250,0.7)' 
                        : 'rgba(192,132,252,0.7)',
                      fontSize: 9,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.4,
                      backdropFilter: 'blur(4px)',
                      WebkitBackdropFilter: 'blur(4px)',
                      transition: 'all 0.2s ease'
                    }}
                    title={`${config.label} Mode - Click to switch (Ctrl/Cmd + M)`}
                  >
                    <i className={`fa-solid ${resolution === '1080' ? 'fa-compress' : 'fa-maximize'}`} style={{ fontSize: 8 }} />
                  </motion.button>

                  {/* Camera notch */}
                  <div style={{
                    position: 'absolute',
                    top: '1.2vh',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 80,
                    height: 8,
                    borderRadius: 999,
                    background: 'linear-gradient(180deg, rgba(15,20,30,0.9), rgba(10,12,18,0.95))',
                    border: '1px solid rgba(0,0,0,0.6)',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
                    zIndex: 10
                  }}>
                    {/* Camera lens */}
                    <div style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(56,189,248,0.4), rgba(30,58,138,0.8))',
                      boxShadow: '0 0 4px rgba(56,189,248,0.6)'
                    }} />
                  </div>

                  {/* Screen */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    borderRadius: '1.8vh',
                    background: 'linear-gradient(180deg, rgba(18,25,43,0.85), rgba(11,19,34,0.75))',
                    border: resolution === '1080'
                      ? '1px solid rgba(59,130,246,0.2)'
                      : '1px solid rgba(168,85,247,0.2)',
                    boxShadow: resolution === '1080'
                      ? `
                        inset 0 0 0 1px rgba(59,130,246,0.12),
                        inset 0 2px 6px rgba(8,12,20,0.28),
                        0 24px 48px rgba(8,12,20,0.22)
                      `
                      : `
                        inset 0 0 0 1px rgba(168,85,247,0.12),
                        inset 0 2px 6px rgba(12,8,20,0.28),
                        0 16px 32px rgba(12,8,20,0.2)
                      `,
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                    overflow: 'hidden'
                  }}>
                    {/* Screen glow effect */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: resolution === '1080'
                        ? 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.04), transparent 60%)'
                        : 'radial-gradient(circle at 50% 0%, rgba(168,85,247,0.04), transparent 60%)',
                      pointerEvents: 'none'
                    }} />

                    {children}
                  </div>

                  {/* Display Mode Indicator Badge - Bottom Left (Minimal) */}
                  <div style={{
                    position: 'absolute',
                    bottom: '1vh',
                    left: '1vh',
                    zIndex: 15,
                    padding: '2px 6px',
                    borderRadius: 6,
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    opacity: 0.35,
                    transition: 'opacity 0.2s ease',
                    pointerEvents: 'none'
                  }}>
                    <i 
                      className={`fa-solid ${resolution === '1080' ? 'fa-compress' : 'fa-maximize'}`} 
                      style={{ 
                        fontSize: 7,
                        color: resolution === '1080' ? 'rgba(96,165,250,0.8)' : 'rgba(192,132,252,0.8)'
                      }} 
                    />
                    <span style={{
                      fontSize: 7,
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.6)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px'
                    }}>
                      {config.label}
                    </span>
                  </div>

                  {/* Power button (decorative) */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: -3,
                    transform: 'translateY(-50%)',
                    width: 6,
                    height: 50,
                    borderRadius: '0 3px 3px 0',
                    background: 'linear-gradient(90deg, rgba(20,25,35,0.9), rgba(15,18,25,0.8))',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)'
                  }} />

                  {/* Volume buttons (decorative) */}
                  <div style={{
                    position: 'absolute',
                    top: '35%',
                    left: -3,
                    width: 6,
                    height: 35,
                    borderRadius: '3px 0 0 3px',
                    background: 'linear-gradient(90deg, rgba(15,18,25,0.8), rgba(20,25,35,0.9))',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)'
                  }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default TabletFrame;
