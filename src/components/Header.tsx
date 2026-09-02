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

  return (
    <header className="sticky top-0 z-20 flex h-12 min-w-0 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 shadow-sm shadow-black/20 lg:h-16 lg:px-8">
      {/* Left section: menu and page title */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {currentUser && (
          <TouchMenu
            currentUser={currentUser}
            isOpen={touchMenuOpen}
            isVisible={isTouchLandscape}
            onToggle={onTouchMenuToggle}
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

      {/* Right section: role and user avatar */}
      {currentUser && (
        <div className="ml-3 flex max-w-[55%] shrink-0 items-center gap-2 lg:gap-3">
          <div className="hidden min-w-0 max-w-[12rem] text-right sm:block lg:max-w-[18rem]">
            <p className="truncate text-sm font-bold leading-tight text-slate-100">
              {currentUser.full_name}
            </p>
            <span className={`mt-0.5 inline-block max-w-full truncate rounded px-2 py-0.5 text-[10px] font-bold ${roleBadge(currentUser.role)}`}>
              {roleLabel(currentUser.role)}
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-sm font-bold text-white shadow-inner lg:h-9 lg:w-9">
            {currentUser.full_name.charAt(0)}
          </div>
        </div>
      )}
    </header>
  );
};
