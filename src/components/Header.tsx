import type { Profile } from '../lib/db';

interface HeaderProps {
  activeTab: string;
  currentUser?: Profile;
  profiles?: Profile[];
  onRoleSwitch?: (profile: Profile) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
}) => {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'sales': return 'Tạo Đơn Hàng Nhanh';
      case 'inventory': return 'Quản Lý Kho Hàng';
      case 'customers': return 'Danh Sách Khách Hàng';
      case 'debts': return 'Quản Lý & Thu Hồi Công Nợ';
      case 'cashbook': return 'Sổ Quỹ Thu Chi';
      case 'feedback': return 'Góp Ý & Báo Lỗi';
      default: return 'Trang Chủ';
    }
  };

  return (
    <header className="h-16 border-b border-slate-200/50 dark:border-slate-800/50 glass-panel sticky top-0 right-0 z-20 px-8 flex items-center justify-between">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          {getTabTitle(activeTab)}
        </h1>
      </div>

      {/* Quick Actions & Role Switcher */}
      <div className="flex items-center gap-4">
      </div>
    </header>
  );
};
