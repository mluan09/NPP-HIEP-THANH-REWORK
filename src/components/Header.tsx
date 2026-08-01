import { useState } from 'react';
import { Users, Trash2, X, UserPlus, Shield } from 'lucide-react';
import type { Profile } from '../lib/db';
import { createAuthUser, deleteAuthUser } from '../lib/db';
import { useModal } from '../hooks/useModal';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from './Toast';

interface HeaderProps {
  activeTab: string;
  currentUser?: Profile;
  profiles?: Profile[];
  onRoleSwitch?: (profile: Profile) => void;
  onProfilesChange?: (profiles: Profile[]) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  currentUser,
  profiles = [],
  onProfilesChange,
}) => {
  const { modalState, showConfirm, showAlert } = useModal();
  const { showToast } = useToast();
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'owner' | 'manager' | 'staff'>('staff');
  const [loading, setLoading] = useState(false);

  const isOwner = currentUser?.role === 'owner';

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

  const handleDeleteUser = (profile: Profile) => {
    if (profile.id === currentUser?.id) {
      showAlert('Không thể xóa', 'Không thể xóa tài khoản đang đăng nhập.', 'warning');
      return;
    }
    showConfirm(
      'Xác nhận xóa tài khoản',
      `Xóa tài khoản "${profile.full_name}" (${roleLabel(profile.role)})?\n\nHành động này không thể hoàn tác.`,
      async () => {
        try {
          await deleteAuthUser(profile.id);
          onProfilesChange?.(profiles.filter(p => p.id !== profile.id));
          showToast(`Đã xóa tài khoản ${profile.full_name}`);
        } catch (err: unknown) {
          showAlert('Lỗi', err instanceof Error ? err.message : 'Không thể xóa tài khoản', 'danger');
        }
      },
      { type: 'danger', confirmText: 'Xóa tài khoản', cancelText: 'Hủy' }
    );
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const employeeId = newEmployeeId.trim().toUpperCase();
    const fullName = newName.trim();
    const password = newPassword.trim();

    if (!employeeId || !password || !fullName) {
      showAlert('Thiếu thông tin', 'Vui lòng điền đầy đủ Mã NV, mật khẩu và tên.', 'warning');
      return;
    }

    if (password.length < 6) {
      showAlert('Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 6 ký tự.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const result = await createAuthUser({
        employee_id: employeeId,
        password,
        full_name: fullName,
        role: newRole,
      });

      const newProfile: Profile = {
        id: result.id,
        full_name: result.full_name,
        role: result.role as 'owner' | 'manager' | 'staff',
        employee_id: result.employee_id,
        created_at: new Date().toISOString(),
      };
      onProfilesChange?.([...profiles, newProfile]);
      showToast(`Đã tạo tài khoản ${fullName} (${employeeId}) thành công`);
      setNewEmployeeId('');
      setNewPassword('');
      setNewName('');
      setNewRole('staff');
      setIsCreating(false);
    } catch (err: unknown) {
      showAlert('Lỗi tạo tài khoản', err instanceof Error ? err.message : 'Không thể tạo tài khoản', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-slate-200/50 dark:border-slate-800/50 glass-panel sticky top-0 right-0 z-20 px-8 flex items-center justify-between">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {getTabTitle(activeTab)}
          </h1>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-4">
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowUserPanel(!showUserPanel)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                title="Quản lý tài khoản"
              >
                <Users className="w-4 h-4" />
                <span>Tài khoản ({profiles.length})</span>
              </button>

              {showUserPanel && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {/* Panel header */}
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Quản lý tài khoản</span>
                    </div>
                    <button
                      onClick={() => { setShowUserPanel(false); setIsCreating(false); }}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  {/* User list */}
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {profiles.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {p.full_name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">
                              {p.full_name}
                              {p.id === currentUser?.id && <span className="ml-1 text-amber-500">(bạn)</span>}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${roleBadge(p.role)}`}>
                              {roleLabel(p.role)}
                            </span>
                            {p.employee_id && (
                              <span className="ml-1 text-[10px] font-semibold text-slate-400">
                                {p.employee_id}
                              </span>
                            )}
                          </div>
                        </div>
                        {p.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(p)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors flex-shrink-0"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Create user */}
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    {!isCreating ? (
                      <button
                        onClick={() => setIsCreating(true)}
                        className="w-full flex items-center justify-center gap-2 p-3 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Thêm tài khoản mới</span>
                      </button>
                    ) : (
                      <form onSubmit={handleCreateUser} className="p-3 space-y-2">
                        <input
                          type="text"
                          placeholder="Họ và tên"
                          value={newName}
                          onChange={e => setNewName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none dark:text-slate-100"
                        />
                        <input
                          type="text"
                          placeholder="Mã nhân viên (VD: NV004)"
                          value={newEmployeeId}
                          onChange={e => setNewEmployeeId(e.target.value.toUpperCase())}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none dark:text-slate-100 uppercase"
                        />
                        <input
                          type="password"
                          placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none dark:text-slate-100"
                        />
                        <select
                          value={newRole}
                          onChange={e => setNewRole(e.target.value as 'owner' | 'manager' | 'staff')}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none dark:text-slate-100"
                        >
                          <option value="staff">Nhân Viên</option>
                          <option value="manager">Quản Lý</option>
                          <option value="owner">Chủ Cửa Hàng</option>
                        </select>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          Tài khoản sẽ đăng nhập bằng Mã NV và mật khẩu đã đặt.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="flex-1 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-xs cursor-pointer hover:bg-slate-50"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                          >
                            {loading ? 'Đang tạo...' : 'Tạo'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
      <ConfirmModal {...modalState} />
    </>
  );
};