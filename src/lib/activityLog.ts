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

export const LOG_PAGE_SIZE = 20;
export const LOG_MAX_PAGES = 5;
export const LOG_MAX_ENTRIES = LOG_PAGE_SIZE * LOG_MAX_PAGES; // 100

/**
 * Ghi nhật ký hoạt động lên Supabase.
 * Không fallback localStorage để tránh lệch dữ liệu giữa các thiết bị.
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

  supabase
    .from('activity_logs')
    .insert(newEntry)
    .then(
      ({ error }: { error: Error | null }) => {
        if (error) {
          console.warn('logActivity: Supabase insert failed', error.message);
        }
      },
      (err) => {
        console.warn('logActivity: network error', err);
      }
    );
};

/**
 * Fetch nhật ký từ Supabase.
 */
export const getActivityLog = async (): Promise<ActivityLogEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(LOG_MAX_ENTRIES);

    if (error) throw error;
    return (data ?? []) as ActivityLogEntry[];
  } catch (err) {
    console.warn('getActivityLog: Supabase fetch failed', err);
    return [];
  }
};

/**
 * Xoá toàn bộ nhật ký (owner only).
 */
export const clearActivityLog = async (): Promise<void> => {
  try {
    const { error } = await supabase.from('activity_logs').delete().neq('id', '');
    if (error) throw error;
  } catch (err) {
    console.warn('clearActivityLog: Supabase delete failed', err);
  }
};
