import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface SingleToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const SingleToast: React.FC<SingleToastProps> = ({ toast, onClose }) => {
  const duration = toast.duration || 4000;
  const remainingTimeRef = useRef<number>(duration);
  const [isPaused, setIsPaused] = useState(false);
  const lastTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isPaused) return;

    lastTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTimeRef.current;
      lastTimeRef.current = now;

      remainingTimeRef.current -= elapsed;
      if (remainingTimeRef.current <= 0) {
        clearInterval(interval);
        onClose(toast.id);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, toast.id, onClose]);

  const handleClose = () => {
    onClose(toast.id);
  };

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);
  const handleFocus = () => setIsPaused(true);
  const handleBlur = () => setIsPaused(false);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      layout
      initial={{ opacity: 0, y: 100, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 120, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={0}
      className="flex items-center gap-3 bg-slate-900/95 text-slate-100 border border-emerald-500/40 shadow-xl shadow-emerald-950/30 px-4 py-3 rounded-2xl backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50 max-w-sm w-full cursor-default"
    >
      <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded-lg flex-shrink-0">
        <CheckCircle2 className="w-5 h-5" />
      </div>
      <p className="text-sm font-medium flex-1 text-slate-200 leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Đóng thông báo"
        className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-label="Thông báo hệ thống"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-auto"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <SingleToast key={toast.id} toast={toast} onClose={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};