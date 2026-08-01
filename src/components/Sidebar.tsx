import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  CreditCard, 
  BookOpen, 
  LogOut,
  MessageCircle
} from 'lucide-react';
import type { Profile } from '../lib/db';
import { useModal } from '../hooks/useModal';
import { ConfirmModal } from './ConfirmModal';

interface SidebarProps {
  setActiveTab: (tab: string) => void;
  currentUser: Profile;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  setActiveTab, 
  currentUser, 
  onLogout 
}) => {
  const { modalState, showConfirm } = useModal();

  const handleLogoutConfirm = () => {
    showConfirm(
      'Xác nhận đăng xuất',
      `Bạn có chắc chắn muốn đăng xuất khỏi tài khoản [${currentUser.full_name}] không?`,
      onLogout,
      { type: 'warning', confirmText: 'Đăng xuất', cancelText: 'Ở lại' }
    );
  };
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Chủ Cửa Hàng';
      case 'manager': return 'Quản Lý';
      default: return 'Nhân Viên';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/30';
      case 'manager': return 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/30';
      default: return 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/50';
    }
  };

  // Check roles permissions
  const menuItems = [
    { id: 'sales', label: 'Tạo Đơn Hàng', icon: ShoppingCart, allowed: ['owner', 'manager', 'staff'] },
    { id: 'inventory', label: 'Kho Hàng', icon: Package, allowed: ['owner', 'manager', 'staff'] },
    { id: 'customers', label: 'Khách Hàng', icon: Users, allowed: ['owner', 'manager', 'staff'] },
    { id: 'debts', label: 'Quản Lý Công Nợ', icon: CreditCard, allowed: ['owner', 'manager', 'staff'] },
    { id: 'cashbook', label: 'Sổ Quỹ Thu Chi', icon: BookOpen, allowed: ['owner', 'manager'] },
    { id: 'feedback', label: 'Góp Ý & Báo Lỗi', icon: MessageCircle, allowed: ['owner', 'manager', 'staff'] },
  ];

  return (
    <aside className="w-68 glass-panel border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-between h-screen fixed left-0 top-0 z-30 transition-all-300">
      <div>
        {/* Brand/Logo Area */}
        <div className="p-5 border-b border-slate-200/40 dark:border-slate-800/40 flex flex-col items-center gap-3">
          <div className="relative group w-full flex items-center justify-center p-2 rounded-xl bg-white/50 dark:bg-slate-900/40 shadow-sm border border-slate-200/30 dark:border-slate-800/30">
            <img 
              src="/logo-new.png" 
              alt="NPP Hiep Thanh" 
              className="max-h-24 object-contain transition-transform duration-300 group-hover:scale-105" 
              onError={(e) => {
                // Fallback text if logo fails to load
                e.currentTarget.style.display = 'none';
                const fallback = document.getElementById('logo-fallback');
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div 
              id="logo-fallback" 
              className="hidden flex-col items-center justify-center py-4 text-center"
            >
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 text-base leading-tight tracking-wider uppercase">
                NPP HIỆP THÀNH
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-widest mt-1">
                DISTRIBUTOR
              </span>
            </div>
          </div>

          {/* Database & Connection Indicator - Updated text to NPP Hiệp Thành */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold w-full justify-center shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>NPP Hiệp Thành</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1 relative">
          {menuItems.map((item) => {
            const isAllowed = item.allowed.includes(currentUser.role);
            if (!isAllowed) return null;

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
                      <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'text-white scale-110' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span>{item.label}</span>
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Session Area */}
      <div className="p-4 border-t border-slate-200/40 dark:border-slate-800/40 space-y-3 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="flex items-center gap-3 p-2 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
            {currentUser.full_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate leading-none mb-1">
              {currentUser.full_name}
            </h4>
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getRoleColor(currentUser.role)}`}>
              {getRoleLabel(currentUser.role)}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogoutConfirm}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950/30 dark:text-red-400 dark:hover:bg-red-950/20 text-xs font-semibold transition-colors duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>

      {/* Logout Confirm Modal */}
      <ConfirmModal {...modalState} />
    </aside>
  );
};
