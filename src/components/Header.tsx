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
    case 'cashbook': return 'Sổ Quỹ Thu Chi';
    case 'accounts': return 'Quản Lý Tài Khoản';
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
    <header className="h-16 border-b border-slate-200/50 dark:border-slate-800/50 glass-panel sticky top-0 right-0 z-20 px-8 flex items-center justify-between">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {getTabTitle(activeTab)}
        </h1>
      </div>

      {/* User Info */}
      {currentUser && (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {currentUser.full_name}
            </p>
            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${roleBadge(currentUser.role)}`}>
              {roleLabel(currentUser.role)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
            {currentUser.full_name.charAt(0)}
          </div>
        </div>
      )}
    </header>
  );
};