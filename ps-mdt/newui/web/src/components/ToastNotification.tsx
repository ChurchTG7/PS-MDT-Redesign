import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Toast {
  id: string;
  type: 'announcement' | 'emergency' | 'recall' | 'meeting' | 'commendation';
  title: string;
  subtitle: string;
  message: string;
  duration: number;
  sound: boolean;
  urgent?: boolean;
}

interface ToastNotificationProps {
  visible: boolean;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ visible }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.action === 'showToast') {
        const newToast: Toast = {
          ...event.data.data,
          id: Date.now().toString(),
        };

        setToasts((prev) => [...prev, newToast]);

        // Auto-remove toast after duration
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, event.data.data.duration);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastStyle = (type: Toast['type'], urgent?: boolean) => {
    const styles = {
      announcement: {
        bg: 'bg-blue-900/95 backdrop-blur-sm',
        border: 'border-blue-400',
        icon: '📢',
        iconColor: 'text-blue-400',
      },
      emergency: {
        bg: urgent ? 'bg-red-900/98 backdrop-blur-sm animate-pulse' : 'bg-red-900/95 backdrop-blur-sm',
        border: 'border-red-400',
        icon: '🚨',
        iconColor: 'text-red-400',
      },
      recall: {
        bg: 'bg-yellow-900/95 backdrop-blur-sm',
        border: 'border-yellow-400',
        icon: '🔔',
        iconColor: 'text-yellow-400',
      },
      meeting: {
        bg: 'bg-indigo-900/95 backdrop-blur-sm',
        border: 'border-indigo-400',
        icon: '📅',
        iconColor: 'text-indigo-400',
      },
      commendation: {
        bg: 'bg-green-900/95 backdrop-blur-sm',
        border: 'border-green-400',
        icon: '🏆',
        iconColor: 'text-green-400',
      },
    };

    return styles[type];
  };

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-auto max-w-md">
      <AnimatePresence mode="sync">
        {toasts.map((toast) => {
          const style = getToastStyle(toast.type, toast.urgent);

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 400, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 400, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`rounded-lg shadow-2xl overflow-hidden border-l-4 ${style.bg} ${style.border} w-96 relative`}
            >
              {/* Close button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors z-10 text-lg leading-none"
                aria-label="Close notification"
              >
                ×
              </button>

              <div className="flex items-start gap-4 p-4 pr-10">
                {/* Icon */}
                <div className={`text-2xl mt-0.5 flex-shrink-0 ${toast.urgent ? 'animate-bounce' : ''}`}>
                  {style.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <h3 className="text-white font-bold text-base mb-1 leading-tight">
                    {toast.title}
                  </h3>

                  {/* Subtitle */}
                  <p className="text-white/80 text-sm mb-2 font-medium leading-tight">
                    {toast.subtitle}
                  </p>

                  {/* Message */}
                  <p className="text-white/70 text-xs leading-relaxed break-words">
                    {toast.message}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: toast.duration / 1000, ease: 'linear' }}
                className={`h-1 ${style.iconColor.replace('text-', 'bg-')} opacity-50`}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ToastNotification;
