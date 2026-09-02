import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, ChevronLeft, ChevronRight, Shield, Clock3, UserCircle2, Package, CreditCard, BookOpen, ShoppingCart, Users, BadgeInfo, Trash2, PlusCircle, Pencil, RotateCcw } from 'lucide-react';
import type { Profile } from '../lib/db';
import { getActivityLog, LOG_MAX_PAGES, LOG_PAGE_SIZE, type ActivityLogEntry } from '../lib/activityLog';
import { supabase } from '../lib/supabase';

interface ActivityLogPageProps {
  currentUser: Profile;
}

const categoryMeta: Record<ActivityLogEntry['category'], { label: string; icon: React.ReactNode; badge: string }> = {
  sale: {
    label: 'Đơn hàng',
    icon: <ShoppingCart className="w-4 h-4" />,
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  inventory: {
    label: 'Kho hàng',
    icon: <Package className="w-4 h-4" />,
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  },
  customer: {
    label: 'Khách hàng',
    icon: <Users className="w-4 h-4" />,
    badge: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300',
  },
  debt: {
    label: 'Công nợ',
    icon: <CreditCard className="w-4 h-4" />,
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  },
  cashbook: {
    label: 'Sổ quỹ',
    icon: <BookOpen className="w-4 h-4" />,
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  },
  account: {
    label: 'Tài khoản',
    icon: <Shield className="w-4 h-4" />,
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  },
};

type ActionType = 'delete' | 'create' | 'update' | 'recall' | 'other';

const detectActionType = (action: string): ActionType => {
  const lower = action.toLowerCase();
  if (lower.includes('thu hồi')) return 'recall';
  if (lower.includes('xoá') || lower.includes('xóa') || lower.includes('huỷ') || lower.includes('hủy')) return 'delete';
  if (lower.includes('thêm') || lower.includes('tạo') || lower.includes('lập')) return 'create';
  if (lower.includes('sửa') || lower.includes('điều chỉnh') || lower.includes('cập nhật') || lower.includes('thay đổi') || lower.includes('chỉnh sửa')) return 'update';
  return 'other';
};

const actionTypeMeta: Record<ActionType, { label: string; icon: React.ReactNode; badge: string; border: string; bg: string; iconBg: string }> = {
  delete: {
    label: 'Xoá',
    icon: <Trash2 className="w-3.5 h-3.5" />,
    badge: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-900/50',
    border: 'border-l-red-500',
    bg: 'bg-red-50/60 dark:bg-red-950/20',
    iconBg: 'bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400',
  },
  create: {
    label: 'Thêm mới',
    icon: <PlusCircle className="w-3.5 h-3.5" />,
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-900/50',
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  },
  update: {
    label: 'Chỉnh sửa',
    icon: <Pencil className="w-3.5 h-3.5" />,
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-900/50',
    border: 'border-l-amber-500',
    bg: 'bg-amber-50/60 dark:bg-amber-950/20',
    iconBg: 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  },
  recall: {
    label: 'Thu hồi',
    icon: <RotateCcw className="w-3.5 h-3.5" />,
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300 ring-1 ring-yellow-200 dark:ring-yellow-900/50',
    border: 'border-l-yellow-500',
    bg: 'bg-yellow-50/60 dark:bg-yellow-950/20',
    iconBg: 'bg-yellow-500/15 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400',
  },
  other: {
    label: 'Khác',
    icon: <BadgeInfo className="w-3.5 h-3.5" />,
    badge: 'bg-slate-800 text-slate-300',
    border: 'border-l-slate-400',
    bg: 'bg-slate-950',
    iconBg: 'bg-violet-500/10 text-violet-500',
  },
};

const roleLabel = (role: Profile['role']) => {
  if (role === 'owner') return 'Chủ Cửa Hàng';
  if (role === 'manager') return 'Quản Lý';
  return 'Nhân Viên';
};

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));

export const ActivityLogPage: React.FC<ActivityLogPageProps> = ({ currentUser }) => {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [page, setPage] = useState(1);

  const loadEntries = useCallback(() => {
    getActivityLog().then(setEntries).catch(console.error);
  }, []);

  useEffect(() => {
    loadEntries();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadEntries();
      }
    };

    const channel = supabase
      .channel('activity-log-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activity_logs' },
        () => {
          loadEntries();
        }
      )
      .subscribe();

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [loadEntries]);

  const totalPages = useMemo(() => {
    const rawPages = Math.ceil(entries.length / LOG_PAGE_SIZE);
    return Math.min(Math.max(rawPages, 1), LOG_MAX_PAGES);
  }, [entries]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * LOG_PAGE_SIZE;
    return entries.slice(start, start + LOG_PAGE_SIZE);
  }, [entries, page]);

  const visiblePages = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages]);

  if (currentUser.role !== 'owner') {
    return null;
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="glass-panel rounded-3xl p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <motion.div
              whileHover={{ rotate: 8, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center"
            >
              <ClipboardList className="w-6 h-6" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Nhật Ký Hoạt Động</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Theo dõi thao tác thành viên. Lưu tối đa {LOG_MAX_PAGES} trang gần nhất, mỗi trang {LOG_PAGE_SIZE} hoạt động.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <div className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng log</div>
              <div className="text-lg font-bold text-slate-100">{entries.length}</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Trang hiện tại</div>
              <div className="text-lg font-bold text-slate-100">{page}/{totalPages}</div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
        className="glass-panel overflow-hidden rounded-3xl"
      >
        <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 3 }}>
              <BadgeInfo className="w-5 h-5 text-violet-500" />
            </motion.div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Hoạt động gần nhất</h3>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: page > 1 ? 1.04 : 1 }}
              whileTap={{ scale: page > 1 ? 0.96 : 1 }}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Trước</span>
            </motion.button>

            <div className="flex items-center gap-1.5">
              {visiblePages.map((pageNumber) => {
                const active = pageNumber === page;
                return (
                  <motion.button
                    key={pageNumber}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setPage(pageNumber)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      active
                        ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {pageNumber}
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              whileHover={{ scale: page < totalPages ? 1.04 : 1 }}
              whileTap={{ scale: page < totalPages ? 0.96 : 1 }}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <span>Sau</span>
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        <div className="p-4 sm:p-6 min-h-[420px]">
          {paginatedEntries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-[360px] rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center text-center px-6"
            >
              <Clock3 className="w-10 h-10 text-slate-400 mb-4" />
              <h4 className="text-base font-bold text-slate-100">Chưa có hoạt động nào</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md">
                Nhật ký sẽ xuất hiện khi thành viên thực hiện thao tác có ghi log trong hệ thống.
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -22 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-3"
              >
                {paginatedEntries.map((entry, index) => {
                  const meta = categoryMeta[entry.category];
                  const actionType = detectActionType(entry.action);
                  const actionMeta = actionTypeMeta[actionType];
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: index * 0.02 }}
                      className={`rounded-2xl border border-slate-200/70 dark:border-slate-800/70 ${actionMeta.bg} p-4 border-l-4 ${actionMeta.border}`}
                    >
                      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${actionMeta.iconBg}`}>
                            {meta.icon}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-100">{entry.action}</h4>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${meta.badge}`}>
                                {meta.icon}
                                <span>{meta.label}</span>
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${actionMeta.badge}`}>
                                {actionMeta.icon}
                                <span>{actionMeta.label}</span>
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className="inline-flex items-center gap-1">
                                <UserCircle2 className="w-3.5 h-3.5" />
                                <span className="font-semibold text-slate-300">{entry.actor_name}</span>
                              </span>
                              <span>•</span>
                              <span>{roleLabel(entry.actor_role)}</span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                <Clock3 className="w-3.5 h-3.5" />
                                {formatTime(entry.timestamp)}
                              </span>
                            </div>

                            {entry.detail && (
                              <p className="mt-2 break-words rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-300">
                                {entry.detail}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default ActivityLogPage;