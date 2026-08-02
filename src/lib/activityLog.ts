import { supabase } from './supabase';
import type { Profile } from './db';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  actor_id: string;
  actor_name: string;
  actor_role: 'owner' | 'manager' | 'staff';
  action: string;
  detail?: string;
  category: 'sale' | 'inventory' | 'customer' | 'debt' | 'cashbook' | 'account';
}

const STORAGE_KEY = 'npp_activity_log';
export const LOG_PAGE_SIZE = 20;
export const LOG_MAX_PAGES = 5;
export const LOG_MAX_ENTRIES = LOG_PAGE_SIZE * LOG_MAX_PAGES; // 100

// Local fallback only — used when Supabase insert fails
const getLocalLog = (): ActivityLogEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActivityLogEntry[]) : [];
  } catch {
    return [];
  }
};

const pushLocalLog = (entry: ActivityLogEntry) => {
  const entries = getLocalLog();
  const updated = [entry, ...entries];
  while (updated.length > LOG_MAX_ENTRIES) {
    updated.pop();
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    const trimmed = updated.slice(0, Math.floor(LOG_MAX_ENTRIES / 2));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }
};

/**
 * Ghi nhật ký hoạt động lên Supabase.
 * Fallback localStorage nếu insert lỗi (offline / RLS).
 */
export const logActivity = (
  actor: Profile,
  action: string,
  category: ActivityLogEntry['category'],
  detail?: string
): void => {
  const newEntry: ActivityLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    actor_id: actor.id,
    actor_name: actor.full_name,
    actor_role: actor.role,
    action,
    detail,
    category,
  };

  // Fire-and-forget insert; fallback local nếu lỗi
  try {
    supabase
      .from('activity_logs')
      .insert(newEntry)
      .then(({ error }: { error: Error | null }) => {
        if (error) {
          console.warn('logActivity: Supabase insert failed, fallback localStorage', error.message);
          pushLocalLog(newEntry);
        }
      });
  } catch (err) {
    console.warn('logActivity: network error, fallback localStorage', err);
    pushLocalLog(newEntry);
  }
};

/**
 * Fetch nhật ký từ Supabase. Gộp thêm local fallback để không mất log
 * khi insert trước đó bị lỗi mạng.
 */
export const getActivityLog = async (): Promise<ActivityLogEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(LOG_MAX_ENTRIES);

    if (error) throw error;
    if (data && data.length > 0) {
      return data as ActivityLogEntry[];
    }
  } catch (err) {
    console.warn('getActivityLog: Supabase fetch failed, using localStorage', err);
  }

  // Fallback: chỉ trả local khi Supabase trống hoặc lỗi
  return getLocalLog();
};

/**
 * Xoá toàn bộ nhật ký (owner only). Xoá trên Supabase + local.
 */
export const clearActivityLog = async (): Promise<void> => {
  try {
    const { error } = await supabase.from('activity_logs').delete().neq('id', '');
    if (error) throw error;
  } catch (err) {
    console.warn('clearActivityLog: Supabase delete failed', err);
  }
  localStorage.removeItem(STORAGE_KEY);
};