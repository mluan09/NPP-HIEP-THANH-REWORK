import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, X } from 'lucide-react';
import { SearchInput } from './SearchInput';

export interface ProductSearchResult {
  id: string;
  name: string;
  sku: string;
  price?: number;
}

interface ResponsiveSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
  productResults?: ProductSearchResult[];
  onSelectProduct?: (product: ProductSearchResult) => void;
}

export const ResponsiveSearchSheet: React.FC<ResponsiveSearchSheetProps> = ({
  isOpen,
  onClose,
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  title = 'Tìm kiếm',
  productResults,
  onSelectProduct,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const hasProductSearch = productResults !== undefined;
  const normalizedValue = value.trim();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-16 sm:p-4 sm:pt-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-bg/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="responsive-search-sheet-title"
            className="relative z-10 flex max-h-[calc(100dvh-5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-2xl sm:max-h-[calc(100dvh-6rem)] sm:p-5"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-line pb-2">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Search className="h-4 w-4 text-amber-500" />
                <span id="responsive-search-sheet-title">{title}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng tìm kiếm"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-alt hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="shrink-0 pt-3">
              <SearchInput
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoFocus={true}
              />
            </div>

            {hasProductSearch ? (
              <div
                className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-line"
                role="listbox"
                aria-label="Kết quả tìm kiếm sản phẩm"
              >
                {!normalizedValue ? (
                  <p className="p-6 text-center text-sm text-muted">
                    Nhập tên sản phẩm hoặc SKU để xem kết quả.
                  </p>
                ) : productResults.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted">
                    Không có sản phẩm khớp với "{value}".
                  </p>
                ) : (
                  productResults.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      role="option"
                      aria-label={`Chọn ${product.name}`}
                      onClick={() => onSelectProduct?.(product)}
                      className="flex w-full items-center gap-3 border-b border-line p-3 text-left last:border-b-0 focus:bg-amber-500/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500"
                      >
                        <Package className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-foreground">
                          {product.name}
                        </span>
                        <span className="block truncate text-xs text-muted">{product.sku}</span>
                      </span>
                      {typeof product.price === 'number' && (
                        <span className="shrink-0 text-sm font-bold text-foreground">
                          {product.price.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="mt-3 flex shrink-0 items-center justify-between border-t border-line pt-3 text-xs text-muted">
                <span>{value ? `Đang lọc: "${value}"` : 'Nhập từ khóa để lọc dữ liệu'}</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-amber-500/10 transition-colors hover:bg-amber-600"
                >
                  Xem kết quả
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};