import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, LogOut } from 'lucide-react';
import type { Profile } from '../lib/db';
import { ALL_MENU_ITEMS } from './menuItems';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  setActiveTab: (tab: string) => void;
  currentUser: Profile;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ setActiveTab, currentUser, onLogout }) => {
  const { uiTheme } = useTheme();
  const isModern = uiTheme === 'modern';
  const allowedItems = ALL_MENU_ITEMS.filter((item) => item.allowed.includes(currentUser.role));

  const mainBusinessIds = ['overview', 'sales', 'inventory', 'customers', 'debts'];
  const businessItems = allowedItems.filter((item) => mainBusinessIds.includes(item.id));
  const systemItems = allowedItems.filter((item) => !mainBusinessIds.includes(item.id));

  const renderNavGroup = (items: typeof allowedItems, groupLabel?: string) => (
    <div className="space-y-1">
      {isModern && groupLabel && (
        <div className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-muted/70">
          {groupLabel}
        </div>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.id}
            to={`/${item.id}`}
            onClick={() => setActiveTab(item.id)}
            className={({ isActive }) =>
              `relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer overflow-hidden ${
                isActive
                  ? isModern
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold shadow-sm shadow-amber-500/10'
                    : 'text-white font-bold'
                  : 'text-secondary hover:bg-surface-alt hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {!isModern && isActive && (
                  <motion.div
                    layoutId="activeTabBadge"
                    className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-600 rounded-xl shadow-md shadow-amber-500/20"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                {isModern && isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-gradient-to-b from-amber-400 to-orange-500" />
                )}
                <span className="relative z-10 flex items-center gap-3 flex-1 min-w-0">
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform ${
                      isActive
                        ? isModern
                          ? 'text-amber-400 scale-110'
                          : 'text-white scale-110'
                        : 'text-muted'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {isModern && (
                  <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 transition-all ${
                      isActive ? 'text-amber-400 translate-x-0 opacity-100' : 'text-muted/40 -translate-x-1 opacity-0 group-hover:opacity-100'
                    }`}
                  />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-68 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex flex-col items-center gap-3 border-b border-line p-5">
        <div className="group relative flex w-full items-center justify-center rounded-xl border border-line bg-input p-2 shadow-sm">
          <img
            src="/logo-new.png"
            alt="NPP Hiep Thanh"
            className="max-h-24 object-contain transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = document.getElementById('logo-fallback');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div id="logo-fallback" className="hidden flex-col items-center justify-center py-4 text-center">
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 text-base leading-tight tracking-wider uppercase">
              NPP HIỆP THÀNH
            </span>
            <span className="text-[10px] text-muted font-semibold tracking-widest mt-1">DISTRIBUTOR</span>
          </div>
        </div>
        <div className="flex w-full items-center justify-center gap-2 rounded-full border border-amber-500/20 bg-tint-amber px-3 py-1.5 text-xs font-semibold text-tint-amber-fg shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span>NPP Hiệp Thành</span>
        </div>
      </div>

      <nav className="p-4 space-y-3 flex-1 overflow-y-auto">
        {isModern ? (
          <>
            {renderNavGroup(businessItems, 'Nghiệp vụ')}
            {systemItems.length > 0 && renderNavGroup(systemItems, 'Hệ thống & Hỗ trợ')}
          </>
        ) : (
          renderNavGroup(allowedItems)
        )}
      </nav>

      <div className="border-t border-line bg-bg p-4">
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onLogout}
          className="group relative w-full overflow-hidden rounded-2xl border border-red-900/40 bg-surface px-3 py-2.5 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer"
        >
          <div className="relative z-10 flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-500 to-orange-500 flex items-center justify-center text-white shadow-sm">
              <LogOut className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-none text-foreground">Đăng xuất</div>
              <div className="mt-1 text-[10px] text-muted">Thoát phiên hiện tại</div>
            </div>
          </div>
        </motion.button>
      </div>
    </aside>
  );
};
