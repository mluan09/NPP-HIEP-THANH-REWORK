import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
import type { Profile } from '../lib/db';
import { ALL_MENU_ITEMS } from './menuItems';

interface CommandPaletteProps {
  currentUser: Profile | null;
  onNavigate: (tab: string) => void;
}

export const CommandPalette: FC<CommandPaletteProps> = ({ currentUser, onNavigate }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const openPalette = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const combo = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (combo) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('npp:open-palette', openPalette);
    (window as any).openCommandPalette = openPalette;
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('npp:open-palette', openPalette); };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = 'hidden';
      return () => {
        clearTimeout(t);
        document.body.style.overflow = '';
      };
    }
  }, [open ]);

  const items = useMemo(() => {
    const allowed = ALL_MENU_ITEMS.filter((i) => !currentUser || i.allowed.includes(currentUser.role));
    const q = query.trim().toLowerCase();
    if (!q) return allowed;
    return allowed.filter((i) => i.label.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
  }, [query, currentUser]);

  useEffect(() => { setActiveIndex(0); }, [query]);

  const go = (id: string) => {
    setOpen(false);
    onNavigate(id);
    navigate(`/${id}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Tim nhanh chuc nang"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-2xl"
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <div className="flex items-center gap-2 border-b border-line px-4">
              <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((v) => Math.min(v + 1, items.length - 1)); }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((v) => Math.max(v - 1, 0)); }
                  if (e.key === 'Enter' && items[activeIndex]) go(items[activeIndex].id);
                }}
                placeholder="Tim chuc nang... (vi du: kho, cong no, thu chi)"
                aria-label="Tim nhanh chuc nang"
                className="h-12 w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none focus-visible:outline-none"
              />
              <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px] text-muted">ESC</kbd>
            </div>
            <div className="max-h-72 overflow-y-auto p-2" role="listbox" aria-label="Ket qua tim kiem">
              {items.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted">Khong tim thay muc nao.</p>
              )}
              {items.map((item, idx) => {
                const Icon = item.icon;
                const active = idx === activeIndex;
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => go(item.id)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16, delay: Math.min(idx * 0.02, 0.12), ease: 'easeOut' }}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm min-h-[44px] transition-colors duration-150 ${active ? 'bg-amber-500/20 text-foreground' : 'text-secondary hover:bg-surface-alt'}`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                    <span className="font-semibold">{item.label}</span>
                    <span className="ml-auto text-[11px] text-muted">/{item.id}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
