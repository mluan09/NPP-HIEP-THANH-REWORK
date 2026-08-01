import { useMemo, useState } from 'react';
import { Shield, Trash2, UserPlus, Users } from 'lucide-react';
import type { Profile } from '../lib/db';
import { createAuthUser, deleteAuthUser } from '../lib/db';
import { useModal } from '../hooks/useModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

interface AccountsPageProps {
  currentUser: Profile;
  profiles: Profile[];
  onProfilesChange: (profiles: Profile[]) => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  currentUser,
  profiles,
  onProfilesChange,
}) => {
  const { modalState, showConfirm, showAlert } = useModal();
  const { showToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'owner' | 'manager' | 'staff'>('staff');
  const [loading, setLoading] = useState(false);

  const sortedProfiles = useMemo(() => {
    const roleOrder = { owner: 0, manager: 1, staff: 2 };
    return [...profiles].sort((a, b) => {
      const roleDiff = roleOrder[a.role] - roleOrder[b.role];
      if (roleDiff !== 0) return roleDiff;
      return a.full_name.localeCompare(b.full_name, 'vi');
    });
  }, [profiles]);

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
    if (profile.id === currentUser.id) {
      showAlert('Không thể xóa', 'Không thể xóa tài khoản đang đăng nhập.', 'warning');
      return;
    }

    showConfirm(
      'Xác nhận xóa tài khoản',
      `Xóa tài khoản "${profile.full_name}" (${roleLabel(profile.role)})?\n\nHành động này không thể hoàn tác.`,
      async () => {
        try {
          await deleteAuthUser(profile.id);
          onProfilesChange(profiles.filter((p) => p.id !== profile.id));
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

    const employeeExists = profiles.some((profile) => profile.employee_id?.toUpperCase() === employeeId);
    if (employeeExists) {
      showAlert('Mã nhân viên đã tồn tại', `Mã ${employeeId} đã được sử dụng.`, 'warning');
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

      onProfilesChange([...profiles, newProfile]);
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
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Quản Lý Tài Khoản
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Chỉ tài khoản Owner có quyền tạo và xóa tài khoản đăng nhập.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreating((value) => !value)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-lg shadow-amber-500/20 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isCreating ? 'Đóng form' : 'Thêm tài khoản mới'}</span>
          </button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreateUser} className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70">
            <input
              type="text"
              placeholder="Họ và tên"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="lg:col-span-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:text-slate-100"
            />
            <input
              type="text"
              placeholder="Mã nhân viên (VD: NV005)"
              value={newEmployeeId}
              onChange={(e) => setNewEmployeeId(e.target.value.toUpperCase())}
              className="lg:col-span-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:text-slate-100 uppercase"
            />
            <input
              type="password"
              placeholder="Mật khẩu (tối thiểu 6 ký tự)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="lg:col-span-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:text-slate-100"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as 'owner' | 'manager' | 'staff')}
              className="lg:col-span-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:text-slate-100"
            >
              <option value="staff">Nhân Viên</option>
              <option value="manager">Quản Lý</option>
              <option value="owner">Chủ Cửa Hàng</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="lg:col-span-1 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
            <p className="lg:col-span-5 text-xs text-slate-500 dark:text-slate-400">
              Tài khoản sẽ đăng nhập bằng Mã NV và mật khẩu đã đặt. Email nội bộ được tạo theo dạng MãNV@npp.local.
            </p>
          </form>
        )}
      </section>

      <section className="glass-panel rounded-3xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Danh sách tài khoản
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {profiles.length} tài khoản
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {sortedProfiles.map((profile) => (
            <div key={profile.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-inner shrink-0">
                  {profile.full_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {profile.full_name}
                    </h4>
                    {profile.id === currentUser.id && (
                      <span className="text-[10px] font-bold text-amber-500">(bạn)</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${roleBadge(profile.role)}`}>
                      {roleLabel(profile.role)}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {profile.employee_id ?? 'Chưa có Mã NV'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDeleteUser(profile)}
                disabled={profile.id === currentUser.id}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title={profile.id === currentUser.id ? 'Không thể xóa tài khoản đang đăng nhập' : 'Xóa tài khoản'}
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      <ConfirmModal {...modalState} />
    </div>
  );
};