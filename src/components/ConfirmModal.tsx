import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export type ModalType = 'danger' | 'warning' | 'info' | 'success';

export interface ModalOptions {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const ConfirmModal: React.FC<ModalOptions> = ({
  isOpen,
  title,
  message,
  type = 'warning',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  showCancel = true,
  onConfirm,
  onCancel,
}) => {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showCancel && onCancel) {
          onCancel();
        } else {
          onConfirm();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showCancel, onCancel, onConfirm]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <XCircle className="w-8 h-8 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="w-8 h-8 text-emerald-500" />;
      case 'info':
      default:
        return <Info className="w-8 h-8 text-blue-500" />;
    }
  };

  const getHeaderBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-500/10 border-rose-500/20';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'info':
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  const getConfirmBtnColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30 text-white';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/30 text-white';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30 text-white';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={showCancel && onCancel ? onCancel : onConfirm}
          className="fixed inset-0 bg-slate-950/90"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
        >
          {/* Top Bar Accent */}
          <div className={`p-4 border-b flex items-center gap-3.5 ${getHeaderBg()}`}>
            <div className="p-2 rounded-xl bg-slate-900/80 shadow-inner">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-100 truncate">
                {title}
              </h3>
            </div>
            {showCancel && onCancel && (
              <button
                onClick={onCancel}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
              {message}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="p-4 bg-slate-950/50 border-t border-slate-800/60 flex items-center justify-end gap-3">
            {showCancel && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl border border-slate-700/60 text-slate-300 hover:bg-slate-800/70 font-semibold text-xs transition-colors cursor-pointer"
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              onClick={onConfirm}
              className={`px-5 py-2 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer ${getConfirmBtnColor()}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
