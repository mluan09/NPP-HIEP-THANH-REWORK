import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { SearchInput } from './SearchInput';

interface ResponsiveSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
}

export const ResponsiveSearchSheet: React.FC<ResponsiveSearchSheetProps> = ({
  isOpen,
  onClose,
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  title = 'Tìm kiếm',
}) => {
  // Listen for Escape key to close sheet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 pt-16 sm:pt-20">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Search Card / Popover */}
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-4 sm:p-5 flex flex-col gap-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-sm">
                <Search className="w-4 h-4 text-amber-500" />
                <span>{title}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng tìm kiếm"
                className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input with autoFocus & clear button */}
            <div className="pt-1">
              <SearchInput
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoFocus={true}
              />
            </div>

            {/* Quick action bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
              <span>{value ? `Đang lọc: "${value}"` : 'Nhập từ khóa để lọc dữ liệu'}</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm shadow-amber-500/10 transition-colors"
              >
                Xem kết quả
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
