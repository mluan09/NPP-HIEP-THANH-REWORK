import { useState, type FC } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { Profile } from '../lib/db';
import { ALL_MENU_ITEMS } from './menuItems';

import { useTheme } from '../context/ThemeContext';

interface BottomNavProps {
  currentUser: Profile;
  onNavigate: (tab: string) => void;
}

export const BottomNav: FC<BottomNavProps> = ({ currentUser, onNavigate }) => {
  const navigate = useNavigate();
  const { uiTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const allowed = ALL_MENU_ITEMS.filter((i) => i.allowed.includes(currentUser.role));

  const primaryTabs = uiTheme === 'modern'
    ? ['overview', 'inventory', 'customers', 'debts']
    : ['sales', 'inventory', 'customers', 'debts'];

  const primary = allowed.filter((i) => primaryTabs.includes(i.id)).slice(0, 4);
  const overflow = allowed.filter((i) => !primaryTabs.includes(i.id));

  const goSales = () => {
    setMoreOpen(false);
    onNavigate('sales');
    navigate('/sales');
  };

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden bg-black/50"
          onClick={() => setMoreOpen(false)}
          aria-hidden="true"
        />
      )}
      {moreOpen && (
        <div className="fixed bottom-20 left-4 right-4 z-40 lg:hidden rounded-2xl border border-line-strong bg-surface p-2 shadow-xl">
          {overflow.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                onClick={() => { onNavigate(item.id); setMoreOpen(false); }}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold min-h-[48px] ${isActive ? 'bg-amber-500/20 text-amber-300' : 'text-secondary'}`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
      <nav
        aria-label="Dieu huong chinh mobile"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="grid grid-cols-5 items-stretch">
          {primary.slice(0, 2).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 py-2 min-h-[60px] text-[10px] font-bold ${isActive ? 'text-amber-400' : 'text-muted'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span className={isActive ? '' : 'font-semibold'}>{item.label.split(' ').slice(-1)[0]}</span>
                    {isActive && <span className="h-1 w-6 rounded-full bg-amber-500" />}
                  </>
                )}
              </NavLink>
            );
          })}
          <div className="flex items-start justify-center">
            <button
              type="button"
              onClick={goSales}
              aria-label="Tao don hang nhanh"
              className="touch-target -mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
          {primary.slice(2, 4).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 py-2 min-h-[60px] text-[10px] font-bold ${isActive ? 'text-amber-400' : 'text-muted'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span className={isActive ? '' : 'font-semibold'}>{item.label.split(' ').slice(-1)[0]}</span>
                    {isActive && <span className="h-1 w-6 rounded-full bg-amber-500" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
        {overflow.length > 0 && (
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className="absolute right-2 top-1 rounded-lg px-2 py-1 text-[10px] font-bold text-muted"
          >
            {moreOpen ? 'Dong' : `Them ${overflow.length} muc`}
          </button>
        )}
      </nav>
    </>
  );
};

