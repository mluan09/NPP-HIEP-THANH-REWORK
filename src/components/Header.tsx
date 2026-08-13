import type { Profile } from '../lib/db';

interface HeaderProps {
  activeTab: string;
  currentUser?: Profile;
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
  if (role === 'owner') return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
  if (role === 'manager') return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
};

export const Header: React.FC<HeaderProps> = ({ activeTab, currentUser }) => {
  return (
    <header className="h-12 lg:h-16 border-b border-slate-200/50 dark:border-slate-800/50 glass-panel sticky top-0 right-0 z-20 px-4 lg:px-8 flex items-center justify-between">
      {/* Title */}
      <div>
        <h1 className="text-base lg:text-xl font-bold text-slate-800 dark:text-slate-100 truncate max-w-[160px] sm:max-w-none">
          {getTabTitle(activeTab)}
        </h1>
      </div>

      {/* User Info */}
      {currentUser && (
        <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {currentUser.full_name}
            </p>
            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${roleBadge(currentUser.role)}`}>
              {roleLabel(currentUser.role)}
            </span>
          </div>
          <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-inner flex-shrink-0">
            {currentUser.full_name.charAt(0)}
          </div>
        </div>
      )}
    </header>
  );
};
