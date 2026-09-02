import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Trash2, UserPlus, Users, Pencil, X, Check, Save, Crown, Briefcase, User, Lock, LockOpen } from 'lucide-react';
import type { Profile } from '../lib/db';
import { createAuthUser, deleteAuthUser, updateAuthUser, lockProfile, unlockProfile } from '../lib/db';
import { logActivity } from '../lib/activityLog';
import { useModal } from '../hooks/useModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

interface AccountsPageProps {
  currentUser: Profile;
  profiles: Profile[];
  onProfilesChange: (profiles: Profile[]) => void;
}

interface EditForm {
  profile: Profile;
  full_name: string;
  employee_id: string;
  role: 'owner' | 'manager' | 'staff';
  password: string;
}

interface CreateForm {
  full_name: string;
  employee_id: string;
  role: 'owner' | 'manager' | 'staff';
  password: string;
}

type RoleOption = { value: 'owner' | 'manager' | 'staff'; label: string; icon: React.ReactNode; color: string; bg: string; border: string };

const roleOptions: RoleOption[] = [
  {
    value: 'owner',
    label: 'Chủ Cửa Hàng',
    icon: <Crown className="w-4 h-4" />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/40 ring-amber-500/30',
  },
  {
    value: 'manager',
    label: 'Quản Lý',
    icon: <Briefcase className="w-4 h-4" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/40 ring-blue-500/30',
  },
  {
    value: 'staff',
    label: 'Nhân Viên',
    icon: <User className="w-4 h-4" />,
    color: 'text-slate-400',
    bg: 'bg-slate-500/15',
    border: 'border-slate-500/40 ring-slate-500/30',
  },
];

function RoleSelector({ value, onChange, disabled = false }: { value: 'owner' | 'manager' | 'staff'; onChange: (v: 'owner' | 'manager' | 'staff') => void; disabled?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {roleOptions.map((opt) => {
        const selected = value === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            className={`relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            } ${
              selected
                ? `${opt.bg} ${opt.border} ring-2`
                : 'border-slate-800 bg-slate-950 hover:border-slate-700'
            }`}
          >
            <motion.span
              animate={selected ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
              className={selected ? opt.color : 'text-slate-500'}
            >
              {opt.icon}
            </motion.span>
            <span className={`text-[11px] font-bold ${selected ? 'text-slate-100' : 'text-slate-500'}`}>
              {opt.label}
            </span>
            <AnimatePresence>
              {selected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center ${opt.bg}`}
                >
                  <Check className={`w-3 h-3 ${opt.color}`} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  currentUser,
  profiles,
  onProfilesChange,
}) => {
  const { modalState, showConfirm, showAlert } = useModal();
  const { showToast } = useToast();
  const [creating, setCreating] = useState<CreateForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<EditForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lockingId, setLockingId] = useState<string | null>(null);

  const hasModal = !!(editing || creating);

  useEffect(() => {
    document.body.style.overflow = hasModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [hasModal]);

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
    return 'bg-slate-800 text-slate-300';
  };

  const roleIconColor = (role: string) => {
    if (role === 'owner') return 'from-amber-400 to-orange-500';
    if (role === 'manager') return 'from-blue-400 to-indigo-500';
    return 'from-slate-400 to-slate-600';
  };

  // ─── Lock / Unlock ───────────────────────────────
  const handleToggleLock = (profile: Profile) => {
    if (profile.id === currentUser.id) {
      showAlert('Không thể khoá', 'Không thể tự khoá tài khoản đang đăng nhập.', 'warning');
      return;
    }
    const isLocked = profile.is_locked ?? false;
    showConfirm(
      isLocked ? 'Mở khoá tài khoản' : 'Khoá tài khoản',
      isLocked
        ? `Mở khoá tài khoản "${profile.full_name}"?\n\nTài khoản sẽ đăng nhập bình thường trở lại.`
        : `Khoá tạm thời tài khoản "${profile.full_name}"?\n\nTài khoản sẽ không thể đăng nhập cho đến khi được mở khoá.`,
      async () => {
        setLockingId(profile.id);
        try {
          if (isLocked) {
            await unlockProfile(profile.id);
            onProfilesChange(profiles.map((p) => p.id === profile.id ? { ...p, is_locked: false, concurrent_attempts: 0 } : p));
            logActivity(currentUser, 'Mở khoá tài khoản', 'account', profile.full_name);
            showToast(`Đã mở khoá tài khoản ${profile.full_name}`);
          } else {
            await lockProfile(profile.id, 'Owner khoá thủ công');
            onProfilesChange(profiles.map((p) => p.id === profile.id ? { ...p, is_locked: true } : p));
            logActivity(currentUser, 'Khoá tài khoản', 'account', profile.full_name);
            showToast(`Đã khoá tài khoản ${profile.full_name}`);
          }
        } catch (err: unknown) {
          showAlert('Lỗi', err instanceof Error ? err.message : 'Không thể thay đổi trạng thái khoá', 'danger');
        } finally {
          setLockingId(null);
        }
      },
      { type: isLocked ? 'warning' : 'danger', confirmText: isLocked ? 'Mở khoá' : 'Khoá tài khoản', cancelText: 'Hủy' }
    );
  };

  // ─── Delete ─────────────────────────────────────
  const handleDeleteUser = (profile: Profile) => {
    if (profile.id === currentUser.id) {
      showAlert('Không thể xóa', 'Không thể xóa tài khoản đang đăng nhập.', 'warning');
      return;
    }
    showConfirm(
      'Xác nhận xóa tài khoản',
      `Xóa tài khoản "${profile.full_name}" (${roleLabel(profile.role)})?\n\nHành động này không thể hoàn tác.`,
      async () => {
        setDeletingId(profile.id);
        try {
          await deleteAuthUser(profile.id);
          onProfilesChange(profiles.filter((p) => p.id !== profile.id));
          logActivity(currentUser, 'Xóa tài khoản', 'account', `${profile.full_name} (${profile.employee_id ?? 'không có mã'})`);
          showToast(`Đã xóa tài khoản ${profile.full_name}`);
        } catch (err: unknown) {
          showAlert('Lỗi', err instanceof Error ? err.message : 'Không thể xóa tài khoản', 'danger');
        } finally {
          setDeletingId(null);
        }
      },
      { type: 'danger', confirmText: 'Xóa tài khoản', cancelText: 'Hủy' }
    );
  };

  // ─── Edit ───────────────────────────────────────
  const handleEditUser = (profile: Profile) => {
    setEditing({
      profile,
      full_name: profile.full_name,
      employee_id: profile.employee_id ?? '',
      role: profile.role,
      password: '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const fullName = editing.full_name.trim();
    const employeeId = editing.employee_id.trim().toUpperCase();
    const password = editing.password.trim();
    if (!fullName) { showAlert('Thiếu thông tin', 'Vui lòng nhập tên nhân viên.', 'warning'); return; }
    if (employeeId && !/^[A-Z0-9]+$/.test(employeeId)) { showAlert('Mã NV không hợp lệ', 'Mã nhân viên chỉ gồm chữ cái và số.', 'warning'); return; }
    if (password && password.length < 6) { showAlert('Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 6 ký tự.', 'warning'); return; }
    if (editing.profile.id === currentUser.id && editing.role !== editing.profile.role) {
      showAlert('Không thể đổi quyền', 'Owner không thể tự điều chỉnh role của bản thân.', 'warning'); return;
    }
    if (profiles.some((p) => p.id !== editing.profile.id && p.employee_id?.toUpperCase() === employeeId)) {
      showAlert('Mã nhân viên đã tồn tại', `Mã ${employeeId} đã được sử dụng bởi tài khoản khác.`, 'warning'); return;
    }
    setSavingEdit(true);
    try {
      await updateAuthUser({
        user_id: editing.profile.id,
        full_name: fullName,
        ...(employeeId ? { employee_id: employeeId } : {}),
        role: editing.role,
        ...(password ? { password } : {}),
      });
      onProfilesChange(profiles.map((p) => p.id === editing.profile.id ? { ...p, full_name: fullName, employee_id: employeeId || p.employee_id, role: editing.role } : p));
      logActivity(currentUser, 'Cập nhật tài khoản', 'account', `${fullName} • role: ${editing.role} • mã NV: ${employeeId || 'không có'}`);
      showToast(`Đã cập nhật tài khoản ${fullName}`);
      setEditing(null);
    } catch (err: unknown) {
      showAlert('Lỗi cập nhật', err instanceof Error ? err.message : 'Không thể cập nhật tài khoản', 'danger');
    } finally { setSavingEdit(false); }
  };

  // ─── Create ─────────────────────────────────────
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creating) return;
    const employeeId = creating.employee_id.trim().toUpperCase();
    const fullName = creating.full_name.trim();
    const password = creating.password.trim();
    if (!employeeId || !password || !fullName) { showAlert('Thiếu thông tin', 'Vui lòng điền đầy đủ Mã NV, mật khẩu và tên.', 'warning'); return; }
    if (password.length < 6) { showAlert('Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 6 ký tự.', 'warning'); return; }
    if (profiles.some((p) => p.employee_id?.toUpperCase() === employeeId)) {
      showAlert('Mã nhân viên đã tồn tại', `Mã ${employeeId} đã được sử dụng.`, 'warning'); return;
    }
    setLoading(true);
    try {
      const result = await createAuthUser({ employee_id: employeeId, password, full_name: fullName, role: creating.role });
      const newProfile: Profile = { id: result.id, full_name: result.full_name, role: result.role as 'owner' | 'manager' | 'staff', employee_id: result.employee_id, created_at: new Date().toISOString() };
      onProfilesChange([...profiles, newProfile]);
      logActivity(currentUser, 'Tạo tài khoản', 'account', `${fullName} (${employeeId}) • role: ${creating.role}`);
      showToast(`Đã tạo tài khoản ${fullName} (${employeeId}) thành công`);
      setCreating(null);
    } catch (err: unknown) {
      showAlert('Lỗi tạo tài khoản', err instanceof Error ? err.message : 'Không thể tạo tài khoản', 'danger');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="glass-panel rounded-3xl p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <motion.div whileHover={{ rotate: 8, scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }} className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Quản Lý Tài Khoản</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Chỉ tài khoản Owner có quyền tạo, chỉnh sửa và xóa tài khoản đăng nhập.</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCreating({ full_name: '', employee_id: '', role: 'staff', password: '' })}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-lg shadow-amber-500/20 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm tài khoản mới</span>
          </motion.button>
        </div>
      </motion.section>

      {/* Account list */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
        className="glass-panel overflow-hidden rounded-3xl"
      >
        <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}>
              <Users className="w-5 h-5 text-amber-500" />
            </motion.div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Danh sách tài khoản</h3>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{profiles.length} tài khoản</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <AnimatePresence initial={false}>
            {sortedProfiles.map((profile) => (
              <motion.div
                key={profile.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-900/70 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${roleIconColor(profile.role)} flex items-center justify-center text-white font-bold shadow-inner shrink-0`}
                  >
                    {profile.full_name.charAt(0)}
                  </motion.div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-sm font-bold text-slate-100">{profile.full_name}</h4>
                      {profile.id === currentUser.id && <span className="text-[10px] font-bold text-amber-500">(bạn)</span>}
                      {profile.is_locked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                          <Lock className="w-2.5 h-2.5" />Bị khoá
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded ${roleBadge(profile.role)} transition-colors`}>{roleLabel(profile.role)}</span>
                      <span className="text-xs font-semibold text-slate-400">{profile.employee_id ?? 'Chưa có Mã NV'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Nút khoá/mở khoá — chỉ Owner thấy, không áp dụng cho chính mình */}
                  {currentUser.role === 'owner' && profile.id !== currentUser.id && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleToggleLock(profile)}
                      disabled={lockingId === profile.id}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        profile.is_locked
                          ? 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20'
                          : 'text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/20'
                      }`}
                      title={profile.is_locked ? 'Mở khoá tài khoản' : 'Khoá tài khoản'}
                    >
                      {lockingId === profile.id ? (
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="inline-flex">
                          <Lock className="w-4 h-4" />
                        </motion.span>
                      ) : profile.is_locked ? (
                        <LockOpen className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      <span>{profile.is_locked ? 'Mở khoá' : 'Khoá'}</span>
                    </motion.button>
                  )}
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }} onClick={() => handleEditUser(profile)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/20 transition-colors cursor-pointer" title="Chỉnh sửa tài khoản">
                    <Pencil className="w-4 h-4" /><span>Sửa</span>
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }} onClick={() => handleDeleteUser(profile)} disabled={profile.id === currentUser.id || deletingId === profile.id} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer" title={profile.id === currentUser.id ? 'Không thể xóa tài khoản đang đăng nhập' : 'Xóa tài khoản'}>
                    {deletingId === profile.id ? (
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="inline-flex"><Trash2 className="w-4 h-4" /></motion.span>
                    ) : (<Trash2 className="w-4 h-4" />)}
                    <span>{deletingId === profile.id ? 'Đang xóa...' : 'Xóa'}</span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* ─── Create Modal ─── */}
      <AnimatePresence>
        {creating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => !loading && setCreating(null)} className="fixed inset-0 bg-slate-950/90" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} transition={{ type: 'spring', damping: 25, stiffness: 320 }} className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10">
              {/* Top Bar */}
              <div className="p-5 border-b border-emerald-500/20 bg-emerald-500/10 flex items-center gap-3.5">
                <motion.div initial={{ rotate: -20, scale: 0.7 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} className="p-2 rounded-xl bg-slate-900/80 shadow-inner">
                  <UserPlus className="w-6 h-6 text-emerald-500" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-100">Thêm tài khoản mới</h3>
                  <p className="text-xs text-slate-400">Tài khoản đăng nhập bằng Mã NV và mật khẩu</p>
                </div>
                <button onClick={() => !loading && setCreating(null)} disabled={loading} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60 transition-colors disabled:opacity-50 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              {/* Body */}
              <form id="create-account-form" onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Họ và tên</label>
                  <input type="text" placeholder="Nhập họ và tên nhân viên" value={creating.full_name} onChange={(e) => setCreating({ ...creating, full_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-100 transition-shadow" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Mã nhân viên</label>
                    <input type="text" placeholder="VD: NV005" value={creating.employee_id} onChange={(e) => setCreating({ ...creating, employee_id: e.target.value.toUpperCase() })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-100 uppercase transition-shadow" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Mật khẩu</label>
                    <input type="password" placeholder="Tối thiểu 6 ký tự" value={creating.password} onChange={(e) => setCreating({ ...creating, password: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-100 transition-shadow" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Vai trò</label>
                  <RoleSelector value={creating.role} onChange={(v) => setCreating({ ...creating, role: v })} />
                </div>
                <p className="text-xs text-slate-500">Email nội bộ được tạo tự động theo dạng MãNV@npp.local.</p>
              </form>

              {/* Footer */}
              <div className="p-4 bg-slate-950/50 border-t border-slate-800/60 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setCreating(null)} disabled={loading} className="px-4 py-2 rounded-xl border border-slate-700/60 text-slate-300 hover:bg-slate-800/70 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50">Hủy</button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} type="submit" form="create-account-form" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-colors cursor-pointer disabled:opacity-50">
                  {loading ? (
                    <><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="inline-flex"><Save className="w-4 h-4" /></motion.span><span>Đang tạo...</span></>
                  ) : (
                    <><UserPlus className="w-4 h-4" /><span>Tạo tài khoản</span></>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Edit Modal ─── */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => !savingEdit && setEditing(null)} className="fixed inset-0 bg-slate-950/90" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} transition={{ type: 'spring', damping: 25, stiffness: 320 }} className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10">
              {/* Top Bar */}
              <div className="p-5 border-b border-amber-500/20 bg-amber-500/10 flex items-center gap-3.5">
                <motion.div initial={{ rotate: -20, scale: 0.7 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} className="p-2 rounded-xl bg-slate-900/80 shadow-inner">
                  <Pencil className="w-6 h-6 text-amber-500" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-100 truncate">Chỉnh sửa tài khoản</h3>
                  <p className="text-xs text-slate-400 truncate">{editing.profile.full_name} · {editing.profile.employee_id ?? 'Chưa có Mã NV'}</p>
                </div>
                <button onClick={() => !savingEdit && setEditing(null)} disabled={savingEdit} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60 transition-colors disabled:opacity-50 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              {/* Body */}
              <form id="edit-account-form" onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Họ và tên</label>
                  <input type="text" placeholder="Họ và tên" value={editing.full_name} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-100 transition-shadow" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Mã nhân viên</label>
                    <input type="text" placeholder="Mã nhân viên" value={editing.employee_id} onChange={(e) => setEditing({ ...editing, employee_id: e.target.value.toUpperCase() })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-100 uppercase transition-shadow" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Mật khẩu mới</label>
                    <input type="password" placeholder="Để trống nếu không đổi" value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-100 transition-shadow" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Vai trò</label>
                  <RoleSelector value={editing.role} onChange={(v) => setEditing({ ...editing, role: v })} disabled={editing.profile.id === currentUser.id} />
                </div>
                {editing.profile.id === currentUser.id && (
                  <p className="text-xs text-amber-500">Owner không thể tự điều chỉnh role của bản thân.</p>
                )}
                <p className="text-xs text-slate-500">Thay đổi sẽ được cập nhật lên Supabase ngay lập tức.</p>
              </form>

              {/* Footer */}
              <div className="p-4 bg-slate-950/50 border-t border-slate-800/60 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setEditing(null)} disabled={savingEdit} className="px-4 py-2 rounded-xl border border-slate-700/60 text-slate-300 hover:bg-slate-800/70 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50">Hủy</button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} type="submit" form="edit-account-form" disabled={savingEdit} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-900/30 transition-colors cursor-pointer disabled:opacity-50">
                  {savingEdit ? (
                    <><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="inline-flex"><Save className="w-4 h-4" /></motion.span><span>Đang lưu...</span></>
                  ) : (
                    <><Check className="w-4 h-4" /><span>Lưu thay đổi</span></>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal {...modalState} />
    </div>
  );
};