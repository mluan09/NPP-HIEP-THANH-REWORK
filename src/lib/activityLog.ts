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

export const getActivityLog = (): ActivityLogEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActivityLogEntry[]) : [];
  } catch {
    return [];
  }
};

export const logActivity = (
  actor: Profile,
  action: string,
  category: ActivityLogEntry['category'],
  detail?: string
): void => {
  const entries = getActivityLog();
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

  // Prepend newest entry, trim oldest if over limit
  const updated = [newEntry, ...entries];
  while (updated.length > LOG_MAX_ENTRIES) {
    updated.pop(); // remove oldest
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage full — remove oldest half then retry
    const trimmed = updated.slice(0, Math.floor(LOG_MAX_ENTRIES / 2));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }
};

export const clearActivityLog = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
