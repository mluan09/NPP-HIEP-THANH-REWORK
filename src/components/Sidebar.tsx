import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import type { Profile } from '../lib/db';
import { ALL_MENU_ITEMS } from './menuItems';

interface SidebarProps {
  setActiveTab: (tab: string) => void;
  currentUser: Profile;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ setActiveTab, currentUser, onLogout }) => {
  const allowedItems = ALL_MENU_ITEMS.filter((item) => item.allowed.includes(currentUser.role));

  return (
    <aside className="hidden lg:flex flex-col h-screen fixed left-0 top-0 z-30 w-68 glass-panel border-r border-slate-200/50 dark:border-slate-800/50 transition-all duration-300">
      <div className="p-5 border-b border-slate-200/40 dark:border-slate-800/40 flex flex-col items-center gap-3">
        <div className="relative group w-full flex items-center justify-center p-2 rounded-xl bg-white/50 dark:bg-slate-900/40 shadow-sm border border-slate-200/30 dark:border-slate-800/30">
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
            <span className="text-[10px] text-slate-400 font-semibold tracking-widest mt-1">DISTRIBUTOR</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold w-full justify-center shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span>NPP Hiệp Thành</span>
        </div>
      </div>

      <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={`/${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={({ isActive }) =>
                `relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer overflow-hidden ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBadge"
                      className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-600 rounded-xl shadow-md shadow-amber-500/20"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-3 w-full">
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white scale-110' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200/40 dark:border-slate-800/40 bg-slate-50/40 dark:bg-slate-900/20">
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onLogout}
          className="group relative w-full overflow-hidden rounded-2xl border border-red-200/70 dark:border-red-950/40 bg-white/80 dark:bg-slate-900/70 px-3 py-2.5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
        >
          <div className="relative z-10 flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-500 to-orange-500 flex items-center justify-center text-white shadow-sm">
              <LogOut className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">Đăng xuất</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Thoát phiên hiện tại</div>
            </div>
          </div>
        </motion.button>
      </div>
    </aside>
  );
};
