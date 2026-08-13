import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Users,
  ShoppingCart,
  CreditCard,
  BookOpen,
  LogOut,
  MessageCircle,
  Shield,
  ClipboardList,
  MoreHorizontal,
  X,
} from 'lucide-react';
import type { Profile } from '../lib/db';
import { useModal } from '../hooks/useModal';
import { ConfirmModal } from './ConfirmModal';

interface SidebarProps {
  setActiveTab: (tab: string) => void;
  currentUser: Profile;
  onLogout: () => void;
}

const ALL_MENU_ITEMS = [
  { id: 'sales', label: 'Tạo Đơn Hàng', icon: ShoppingCart, allowed: ['owner', 'manager', 'staff'] },
  { id: 'inventory', label: 'Kho Hàng', icon: Package, allowed: ['owner', 'manager', 'staff'] },
  { id: 'customers', label: 'Khách Hàng', icon: Users, allowed: ['owner', 'manager', 'staff'] },
  { id: 'debts', label: 'Quản Lý Công Nợ', icon: CreditCard, allowed: ['owner', 'manager', 'staff'] },
  { id: 'cashbook', label: 'Nhật Ký Thu Chi', icon: BookOpen, allowed: ['owner', 'manager'] },
  { id: 'accounts', label: 'Quản Lý Tài Khoản', icon: Shield, allowed: ['owner'] },
  { id: 'activity-log', label: 'Nhật Ký Hoạt Động', icon: ClipboardList, allowed: ['owner'] },
  { id: 'feedback', label: 'Góp Ý & Báo Lỗi', icon: MessageCircle, allowed: ['owner', 'manager', 'staff'] },
];

// 4 mục chính luôn hiện trên Bottom Nav
const BOTTOM_NAV_PRIMARY_IDS = ['sales', 'inventory', 'customers', 'debts'];

export const Sidebar: React.FC<SidebarProps> = ({
  setActiveTab,
  currentUser,
  onLogout,
}) => {
  const { modalState, showConfirm } = useModal();
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const handleLogoutConfirm = () => {
    showConfirm(
      'Xác nhận đăng xuất',
      `Bạn có chắc chắn muốn đăng xuất khỏi tài khoản [${currentUser.full_name}] không?`,
      onLogout,
      { type: 'warning', confirmText: 'Đăng xuất', cancelText: 'Ở lại' }
    );
  };

  const allowedItems = ALL_MENU_ITEMS.filter((item) =>
    item.allowed.includes(currentUser.role)
  );

  const bottomNavPrimary = allowedItems.filter((item) =>
    BOTTOM_NAV_PRIMARY_IDS.includes(item.id)
  );

  const bottomNavMore = allowedItems.filter(
    (item) => !BOTTOM_NAV_PRIMARY_IDS.includes(item.id)
  );

  return (
    <>
      {/* ─── Desktop / Landscape Mini Sidebar ─── */}
      {/* hidden on portrait mobile, icon-only mini on landscape mobile, full on desktop */}
      <aside className="hidden landscape:flex lg:flex flex-col h-screen fixed left-0 top-0 z-30 w-16 lg:w-68 glass-panel border-r border-slate-200/50 dark:border-slate-800/50 transition-all duration-300">

        {/* Brand / Logo — only on desktop */}
        <div className="hidden lg:flex p-5 border-b border-slate-200/40 dark:border-slate-800/40 flex-col items-center gap-3">
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
              <span className="text-[10px] text-slate-400 font-semibold tracking-widest mt-1">
                DISTRIBUTOR
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold w-full justify-center shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>NPP Hiệp Thành</span>
          </div>
        </div>

        {/* Mini logo dot — landscape mobile only */}
        <div className="flex lg:hidden items-center justify-center py-3 border-b border-slate-800/40">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-extrabold text-xs">NT</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 lg:p-4 space-y-1 flex-1 overflow-y-auto">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={({ isActive }) =>
                  `relative w-full flex items-center gap-3 px-2 lg:px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer overflow-hidden ${
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
                    <span className="relative z-10 flex items-center gap-3 w-full justify-center lg:justify-start">
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                          isActive ? 'text-white scale-110' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      <span className="hidden lg:block">{item.label}</span>
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout — full button on desktop, icon-only on mini */}
        <div className="p-2 lg:p-4 border-t border-slate-200/40 dark:border-slate-800/40 bg-slate-50/40 dark:bg-slate-900/20">
          {/* Desktop full button */}
          <div className="hidden lg:block">
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLogoutConfirm}
              className="group relative w-full overflow-hidden rounded-2xl border border-red-200/70 dark:border-red-950/40 bg-white/80 dark:bg-slate-900/70 px-3 py-2.5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-red-500/8 via-orange-500/8 to-amber-500/8 opacity-0 group-hover:opacity-100"
                initial={false}
                animate={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
              />
              <div className="relative z-10 flex items-center justify-center gap-2">
                <motion.div
                  className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-500 to-orange-500 flex items-center justify-center text-white shadow-sm"
                  whileHover={{ rotate: 8 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                >
                  <LogOut className="w-4 h-4" />
                </motion.div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">Đăng xuất</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Thoát phiên hiện tại</div>
                </div>
              </div>
            </motion.button>
          </div>

          {/* Mini icon logout */}
          <div className="flex lg:hidden justify-center">
            <button
              onClick={handleLogoutConfirm}
              title="Đăng xuất"
              className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Portrait Mobile Bottom Navigation ─── */}
      <nav className="portrait:flex landscape:hidden lg:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-slate-900 border-t border-slate-800/80 items-center justify-around px-1">
        {bottomNavPrimary.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={`/${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-2 rounded-xl transition-colors cursor-pointer ${
                  isActive ? 'text-amber-400' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className={`text-[9px] font-semibold leading-none ${isActive ? 'text-amber-400' : 'text-slate-500'}`}>
                    {item.label.split(' ')[0]}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* More button — only if there are additional items */}
        {bottomNavMore.length > 0 && (
          <button
            onClick={() => setShowMoreSheet(true)}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-2 rounded-xl text-slate-400 cursor-pointer transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[9px] font-semibold leading-none text-slate-500">Thêm</span>
          </button>
        )}
      </nav>

      {/* ─── More Sheet (Portrait Mobile) ─── */}
      <AnimatePresence>
        {showMoreSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="portrait:block landscape:hidden lg:hidden fixed inset-0 z-40 bg-slate-950/70"
              onClick={() => setShowMoreSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="portrait:flex landscape:hidden lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 rounded-t-3xl flex-col p-4 pb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-100">Menu khác</span>
                <button
                  onClick={() => setShowMoreSheet(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                {bottomNavMore.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={`/${item.id}`}
                      onClick={() => {
                        setActiveTab(item.id);
                        setShowMoreSheet(false);
                      }}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>

              {/* Logout in More sheet */}
              <button
                onClick={() => {
                  setShowMoreSheet(false);
                  handleLogoutConfirm();
                }}
                className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors w-full"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span>Đăng xuất</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal {...modalState} />
    </>
  );
};