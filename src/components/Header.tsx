import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, LogOut, Palette, Search, Sparkles } from 'lucide-react';
import type { Profile } from '../lib/db';
import { TouchMenu } from './TouchMenu';
import { useDeviceMode } from '../hooks/useDeviceMode';
import { useTheme } from '../context/ThemeContext';

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
    case 'overview':
    case 'dashboard': return 'Tổng Quan Hoạt Động';
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
  if (role === 'owner') return 'bg-tint-amber text-tint-amber-fg';
  if (role === 'manager') return 'bg-tint-blue text-tint-blue-fg';
  return 'bg-surface-alt text-secondary';
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
  const { uiTheme, setUiTheme } = useTheme();
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

  const isModern = uiTheme === 'modern';

  return (
    <header className="sticky top-0 z-20 flex h-12 min-w-0 shrink-0 items-center justify-between border-b border-line bg-surface px-4 shadow-sm shadow-black/20 lg:h-16 lg:px-8">
      {/* Left section: menu, search and page title */}
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

        <button
          type="button"
          data-palette-button="true"
          aria-label="Tim nhanh chuc nang"
          title="Tim nhanh (Ctrl+K)"
          onClick={() => document.dispatchEvent(new CustomEvent('npp:open-palette'))}
          className={
            isModern
              ? "hidden shrink-0 items-center gap-2.5 rounded-xl border border-line-strong bg-input px-3 py-2 text-xs font-semibold text-foreground shadow-sm hover:border-amber-500/50 hover:bg-surface-alt transition-colors md:flex touch-target"
              : "hidden shrink-0 items-center gap-2 rounded-xl border border-line bg-input px-2.5 py-2 text-[11px] text-muted hover:text-foreground md:flex touch-target"
          }
        >
          <Search className={isModern ? "h-4 w-4 text-amber-500" : "h-4 w-4"} aria-hidden="true" />
          {isModern ? (
            <>
              <span className="text-muted font-medium">Tìm nhanh...</span>
              <kbd className="rounded border border-line-strong bg-surface px-1.5 py-0.5 text-[10px] font-bold text-secondary">Ctrl+K</kbd>
            </>
          ) : (
            <span className="font-bold">Ctrl+K</span>
          )}
        </button>

        <div className="min-w-0 flex-1 flex items-center gap-3">
          <h1 className="truncate text-base font-bold text-foreground lg:text-xl">
            {getTabTitle(activeTab)}
          </h1>
          {isModern && (
            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 xl:flex">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Hệ thống online</span>
            </div>
          )}
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
            className="group flex items-center gap-2 lg:gap-3 rounded-full p-1 transition-all hover:bg-surface-alt/80 focus:outline-none focus:ring-2 focus:ring-amber-500/60 cursor-pointer"
          >
            <div className="hidden min-w-0 max-w-[12rem] text-right sm:block lg:max-w-[18rem]">
              <p className="truncate text-sm font-bold leading-tight text-foreground group-hover:text-amber-500 transition-colors">
                {currentUser.full_name}
              </p>
              <span className={`mt-0.5 inline-block max-w-full truncate rounded px-2 py-0.5 text-[10px] font-bold ${roleBadge(currentUser.role)}`}>
                {roleLabel(currentUser.role)}
              </span>
            </div>
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-sm font-bold text-white shadow-inner group-hover:ring-2 group-hover:ring-amber-400/50 transition-all lg:h-9 lg:w-9">
              {currentUser.full_name.charAt(0)}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-surface ring-1 ring-line-strong text-[8px] text-secondary">
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
                className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line-strong bg-surface p-2.5 shadow-xl shadow-black/40 z-50"
              >
                {/* User card info */}
                <div className="flex items-center gap-3 px-2 py-2 mb-1 rounded-xl bg-surface-alt border border-line">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-sm font-bold text-white shadow-sm">
                    {currentUser.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-foreground">
                      {currentUser.full_name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ${roleBadge(currentUser.role)}`}>
                        {roleLabel(currentUser.role)}
                      </span>
                      {currentUser.employee_id && (
                        <span className="truncate text-[10px] text-muted">
                          #{currentUser.employee_id}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="my-1.5 border-t border-line" />

                <p className="px-3 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                  Giao diện
                </p>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={uiTheme === 'classic'}
                  onClick={() => setUiTheme('classic')}
                  className={`flex w-full min-h-[40px] items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                    uiTheme === 'classic'
                      ? 'bg-surface-alt text-foreground'
                      : 'text-secondary hover:bg-surface-alt'
                  }`}
                >
                  <Palette className="h-4 w-4 shrink-0 text-muted" />
                  <span className="flex-1 text-left">Giao diện hiện tại</span>
                  {uiTheme === 'classic' && <Check className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                </button>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={uiTheme === 'modern'}
                  onClick={() => setUiTheme('modern')}
                  className={`flex w-full min-h-[40px] items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                    uiTheme === 'modern'
                      ? 'bg-surface-alt text-foreground'
                      : 'text-secondary hover:bg-surface-alt'
                  }`}
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-muted" />
                  <span className="flex-1 text-left">Giao diện mới</span>
                  {uiTheme === 'modern' && <Check className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                </button>

                <div className="my-1.5 border-t border-line" />

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



