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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={showCancel && onCancel ? onCancel : onConfirm}
          className="fixed inset-0 bg-bg/90"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl flex flex-col max-h-[calc(100dvh-1.5rem)] lg:max-h-[90vh]"
        >
          {/* Top Bar Accent */}
          <div className={`p-3.5 sm:p-4 border-b flex items-center gap-3.5 shrink-0 ${getHeaderBg()}`}>
            <div className="p-2 rounded-xl bg-surface/80 shadow-inner shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground truncate">
                {title}
              </h3>
            </div>
            {showCancel && onCancel && (
              <button
                type="button"
                aria-label="Đóng"
                onClick={onCancel}
                className="w-9 h-9 flex items-center justify-center text-muted hover:text-foreground rounded-lg hover:bg-surface-alt/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
            <div className="text-sm text-secondary whitespace-pre-line leading-relaxed">
              {message}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="p-3.5 sm:p-4 bg-bg/50 border-t border-line/60 flex items-center justify-end gap-3 shrink-0 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))]">
            {showCancel && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl border border-line-strong text-secondary hover:bg-surface-alt font-semibold text-xs transition-colors cursor-pointer"
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
