import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, AlertTriangle, Undo2 } from 'lucide-react';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning';
  duration?: number;
  action?: ToastAction;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'info' | 'warning', opts?: { duration?: number; action?: ToastAction }) => void;
  showUndoToast: (message: string, onUndo: () => void) => void;
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
  const duration = toast.duration || (toast.type === 'warning' ? 8000 : 5000);
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

  return (
    <motion.div
      role="status"
      aria-live="polite"
      layout
      initial={{ opacity: 0, y: 100, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 120, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      tabIndex={0}
      className={`flex items-center gap-3 bg-surface text-foreground border shadow-xl px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 max-w-sm w-full cursor-default ${
        toast.type === 'warning'
          ? 'border-red-500/60 shadow-red-950/40 focus:ring-red-500/50'
          : 'border-emerald-500/40 shadow-emerald-950/30 focus:ring-emerald-500/50'
      }`}
    >
      <div className={`p-1 rounded-lg flex-shrink-0 ${toast.type === 'warning' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
        {toast.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
      </div>
      <p className="text-sm font-medium flex-1 text-secondary leading-snug">{toast.message}</p>
      {toast.action && (
        <button
          type="button"
          onClick={() => { toast.action?.onClick(); onClose(toast.id); }}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 min-h-[36px] cursor-pointer"
        >
          <Undo2 className="w-3.5 h-3.5" />
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        aria-label="Dong thong bao"
        className="text-muted hover:text-foreground p-1 rounded-lg hover:bg-surface-alt transition-colors cursor-pointer touch-target"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast: ToastContextType['showToast'] = useCallback((message, type = 'success', opts) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-2), { id, message, type, duration: opts?.duration, action: opts?.action }]);
  }, []);

  const showUndoToast = useCallback((message: string, onUndo: () => void) => {
    showToast(message, 'success', { duration: 6000, action: { label: 'Hoan tac', onClick: onUndo } });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showUndoToast }}>
      {children}
      <div
        aria-label="Thong bao he thong"
        className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-[90] flex flex-col gap-2 pointer-events-auto left-4 sm:left-auto"
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
