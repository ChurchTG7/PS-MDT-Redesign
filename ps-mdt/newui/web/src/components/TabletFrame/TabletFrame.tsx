import React, { useState, useEffect, useRef, memo, useMemo, PropsWithChildren } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

const TabletFrameInner = memo(function TabletFrame({ forcedOpen, children }: TabletFrameProps) {
  const [resolution, toggleResolution] = usePersistedResolution('ps-mdt:resolution', '1080');
  const [isPeeking, setIsPeeking] = useState(false);
  
  // Resolution configurations - memoized to prevent recreation
  const resolutionConfig = useMemo(() => ({
    '1080': {
      width: '96vw',
      maxWidth: 1920,
      height: '96vh',
      maxHeight: 1080,
      label: '1080p',
      peekDistance: '90vh'
    },
    '720': {
      width: '80vw',
      maxWidth: 1280,
      height: '80vh',
      maxHeight: 720,
      label: '720p',
      peekDistance: '80vh'
    }
  }), []);
  
  const config = resolutionConfig[resolution];
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperRect, setWrapperRect] = useState<WrapperRect | null>(null);
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
        {/* Backdrop removed to keep background fully transparent */}

        {/* tablet device */}
        <AnimatePresence>
          {forcedOpen && (
            <motion.div
              ref={wrapperRef}
              // show a debug outline in dev builds to visualize alignment
              className={import.meta?.env?.DEV ? 'ps-mdt-debug-wrapper' : ''}
              initial={{ opacity: 0, scale: 0.9, y: 40, rotateX: 15 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: isPeeking ? config.peekDistance : 0, 
                rotateX: 0 
              }}
              exit={{ opacity: 0, scale: 0.92, y: 30, rotateX: 10 }}
              transition={{
                duration: 0.45,
                ease: [0.16, 1, 0.3, 1],
                rotateX: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
                y: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
              }}
              style={{
                width: config.width,
                maxWidth: config.maxWidth,
                height: config.height,
                maxHeight: config.maxHeight,
                perspective: 1000,
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'stretch',
                position: 'relative'
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
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsPeeking(!isPeeking)}
                  style={{
                    position: 'absolute',
                    top: '0',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '85%',
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
                  padding: '2.5vh 2.5vh',
                  borderRadius: '0 0 2.8vh 2.8vh',
                  background: 'linear-gradient(145deg, rgba(26,31,46,0.7) 0%, rgba(15,20,25,0.6) 100%)',
                  boxShadow: `
                    0 0 0 2px rgba(255,255,255,0.03),
                    inset 0 2px 4px rgba(255,255,255,0.05),
                    inset 0 -2px 4px rgba(0,0,0,0.4)
                  `
                }}>
                  {/* Resolution Toggle Button - Minimal */}
                  <motion.button
                    whileHover={{ opacity: 1, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleResolution}
                    style={{
                      position: 'absolute',
                      top: '1vh',
                      right: '1.5vw',
                      zIndex: 20,
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 10,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      opacity: 0.5,
                      backdropFilter: 'blur(4px)',
                      WebkitBackdropFilter: 'blur(4px)',
                      transition: 'all 0.2s ease'
                    }}
                    title={`Switch to ${resolution === '1080' ? '720p' : '1080p'} (Compact Mode)`}
                  >
                    <i className="fa-solid fa-display" style={{ fontSize: 10 }} />
                    <span>{config.label}</span>
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
                    border: '1px solid rgba(56,189,248,0.18)',
                    boxShadow: `
                      inset 0 0 0 1px rgba(56,189,248,0.12),
                      inset 0 2px 6px rgba(8,12,20,0.28),
                      0 24px 48px rgba(8,12,20,0.22)
                    `,
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                    overflow: 'hidden'
                  }}>
                    {/* Screen glow effect */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'radial-gradient(circle at 50% 0%, rgba(56,189,248,0.03), transparent 60%)',
                      pointerEvents: 'none'
                    }} />

                    {children}
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

import withErrorBoundary from '../withErrorBoundary'

const TabletFrame = withErrorBoundary(TabletFrameInner, { scopeName: 'TabletFrame', fullScreen: false })

export default TabletFrame
