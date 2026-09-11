import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LogOut } from 'lucide-react';
import type { Profile } from '../lib/db';
import { TouchMenu } from './TouchMenu';
import { useDeviceMode } from '../hooks/useDeviceMode';

interface HeaderProps {
  activeTab: string;
  currentUser?: Profile;
  touchMenuOpen: boolean;
  onTouchMenuToggle: () => void;
  onTouchMenuClose: () => void;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
}

const getTabTitle = (tab: string) => {
  switch (tab) {
    case 'sales': return 'Tạo Đơn Hàng Nhanh';
    case 'inventory': return 'Quản Lý Kho Hàng';
    case 'customers': return 'Danh Sách Khách Hàng';
    case 'debts': return 'Quản Lý & Thu Hồi Công Nợ';
    case 'cashbook': return 'Nhật Ký Thu Chi';
    case 'accounts': return 'Quản Lý Tài Khoản';
    case 'activity-log': return 'Nhật Ký Hoạt Động';
    case 'feedback': return 'Góp Ý & Báo Lỗi';
    default: return 'Trang Chủ';
  }
};

const roleLabel = (role: string) => {
  if (role === 'owner') return 'Chủ Cửa Hàng';
  if (role === 'manager') return 'Quản Lý';
  return 'Nhân Viên';
};

const roleBadge = (role: string) => {
  if (role === 'owner') return 'bg-amber-950 text-amber-300';
  if (role === 'manager') return 'bg-blue-950 text-blue-300';
  return 'bg-slate-800 text-slate-300';
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  currentUser,
  touchMenuOpen,
  onTouchMenuToggle,
  onTouchMenuClose,
  onNavigate,
  onLogout,
}) => {
  const { isTouchLandscape } = useDeviceMode();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);

  // Close profile menu when touch menu opens or tab changes
  useEffect(() => {
    if (touchMenuOpen) {
      setProfileMenuOpen(false);
    }
  }, [touchMenuOpen]);

  useEffect(() => {
    setProfileMenuOpen(false);
  }, [activeTab]);

  // Click outside and Escape key handlers for profile menu
  useEffect(() => {
    if (!profileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        profileTriggerRef.current?.focus();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (
        !profileMenuRef.current?.contains(event.target as Node) &&
        !profileTriggerRef.current?.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [profileMenuOpen]);

  return (
    <header className="sticky top-0 z-20 flex h-12 min-w-0 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 shadow-sm shadow-black/20 lg:h-16 lg:px-8">
      {/* Left section: menu and page title */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {currentUser && (
          <TouchMenu
            currentUser={currentUser}
            isOpen={touchMenuOpen}
            isVisible={isTouchLandscape}
            onToggle={() => {
              setProfileMenuOpen(false);
              onTouchMenuToggle();
            }}
            onClose={onTouchMenuClose}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-slate-100 lg:text-xl">
            {getTabTitle(activeTab)}
          </h1>
        </div>
      </div>

      {/* Right section: interactive role and user avatar */}
      {currentUser && (
        <div className="relative ml-3 flex max-w-[55%] shrink-0 items-center">
          <button
            ref={profileTriggerRef}
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            aria-expanded={profileMenuOpen}
            aria-haspopup="true"
            aria-label="Thông tin tài khoản và đăng xuất"
            className="group flex items-center gap-2 lg:gap-3 rounded-full p-1 transition-all hover:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-amber-500/60 cursor-pointer"
          >
            <div className="hidden min-w-0 max-w-[12rem] text-right sm:block lg:max-w-[18rem]">
              <p className="truncate text-sm font-bold leading-tight text-slate-100 group-hover:text-amber-300 transition-colors">
                {currentUser.full_name}
              </p>
              <span className={`mt-0.5 inline-block max-w-full truncate rounded px-2 py-0.5 text-[10px] font-bold ${roleBadge(currentUser.role)}`}>
                {roleLabel(currentUser.role)}
              </span>
            </div>
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-sm font-bold text-white shadow-inner group-hover:ring-2 group-hover:ring-amber-400/50 transition-all lg:h-9 lg:w-9">
              {currentUser.full_name.charAt(0)}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-slate-900 ring-1 ring-slate-700 text-[8px] text-slate-300">
                <ChevronDown className="h-2 w-2" />
              </span>
            </div>
          </button>

          {/* Profile Popover / Dropdown with Logout */}
          <AnimatePresence>
            {profileMenuOpen && (
              <motion.div
                ref={profileMenuRef}
                role="menu"
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-2.5 shadow-xl shadow-black/40 z-50"
              >
                {/* User card info */}
                <div className="flex items-center gap-3 px-2 py-2 mb-1 rounded-xl bg-slate-800/60 border border-slate-800">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-sm font-bold text-white shadow-sm">
                    {currentUser.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-slate-100">
                      {currentUser.full_name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ${roleBadge(currentUser.role)}`}>
                        {roleLabel(currentUser.role)}
                      </span>
                      {currentUser.employee_id && (
                        <span className="truncate text-[10px] text-slate-400">
                          #{currentUser.employee_id}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="my-1.5 border-t border-slate-800" />

                {/* Logout action */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onLogout();
                  }}
                  className="flex w-full min-h-[40px] items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-300 transition-colors hover:bg-rose-500/15 hover:text-rose-200 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>Đăng xuất</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </header>
  );
};
