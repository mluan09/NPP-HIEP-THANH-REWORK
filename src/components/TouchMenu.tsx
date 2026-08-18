import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Menu, X } from 'lucide-react';
import type { Profile } from '../lib/db';
import { ALL_MENU_ITEMS } from './menuItems';

interface TouchMenuProps {
  currentUser: Profile;
  isOpen: boolean;
  isVisible: boolean;
  onToggle: () => void;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
}

export const TouchMenu: React.FC<TouchMenuProps> = ({
  currentUser,
  isOpen,
  isVisible,
  onToggle,
  onClose,
  onNavigate,
  onLogout,
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const allowedItems = ALL_MENU_ITEMS.filter((item) => item.allowed.includes(currentUser.role));

  useEffect(() => {
    if (!isOpen) return;
    firstItemRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        triggerRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen, onClose]);

  if (!isVisible) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={isOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
        aria-expanded={isOpen}
        aria-controls="touch-menu"
        onClick={onToggle}
        className="fixed top-2 left-3 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/70 bg-slate-900/90 text-slate-200 shadow-lg backdrop-blur-md transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/60 cursor-pointer"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            id="touch-menu"
            role="menu"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="fixed top-14 left-3 z-50 w-64 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl"
          >
            <nav className="space-y-1">
              {allowedItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.id}
                    ref={index === 0 ? firstItemRef : undefined}
                    to={`/${item.id}`}
                    role="menuitem"
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className={({ isActive }) =>
                      `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                        isActive ? 'bg-amber-500/20 text-amber-300' : 'text-slate-200 hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="my-2 border-t border-slate-800" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/10 cursor-pointer"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Đăng xuất</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
