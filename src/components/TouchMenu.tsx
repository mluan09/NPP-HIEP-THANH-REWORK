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
    <div className="relative z-40 shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={isOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
        aria-expanded={isOpen}
        aria-controls="touch-menu"
        onClick={onToggle}
        className="touch-target flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-100 shadow-sm transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/60 cursor-pointer"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            id="touch-menu"
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="absolute left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-xl shadow-black/30"
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
    </div>
  );
};
