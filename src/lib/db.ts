import { supabase } from './supabase';

export interface Profile {
  id: string;
  full_name: string;
  role: 'owner' | 'manager' | 'staff';
  employee_id?: string | null;
  created_at: string;
  is_locked?: boolean;
  concurrent_attempts?: number;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_seen: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  product_name: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  initial_stock: number;
  import_qty: number;
  export_qty: number;
  created_at: string;
  deleted_at?: string | null;
}

export interface Customer {
  id: string;
  customer_code: string;
  customer_name: string;
  phone: string;
  address: string;
  notes: string;
  created_at: string;
}

export interface Sale {
  id: string;
  seller_id: string;
  customer_id: string;
  sale_date: string;
  status: 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  total_revenue: number;
  total_cost: number;
  profit: number;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  selling_price: number;
  cost_price: number;
  subtotal_revenue: number;
  subtotal_cost: number;
}

export interface Debt {
  id: string;
  customer_id: string;
  sale_id: string | null;
  total_amount: number;
  paid_amount: number;
  remaining_debt: number;
  status: 'PAID' | 'PENDING';
  updated_at: string;
}

export interface CashbookEntry {
  id: string;
  code: string;
  transaction_date: string;
  description: string;
  income: number;
  expense_purchase: number;
  expense_operation: number;
  expense_other: number;
  total_expense: number;
  notes: string;
  created_at: string;
}

// Fetch all data from Supabase
export const fetchProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return data ?? [];
};

export const fetchInventory = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .is('deleted_at', null);
  if (error) throw error;
  return data ?? [];
};

export const fetchCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase.from('customers').select('*');
  if (error) throw error;
  return data ?? [];
};

export const fetchSales = async (): Promise<Sale[]> => {
  const { data, error } = await supabase.from('sales').select('*');
  if (error) throw error;
  return data ?? [];
};

export const fetchSaleItems = async (): Promise<SaleItem[]> => {
  const { data, error } = await supabase.from('sale_items').select('*');
  if (error) throw error;
  return data ?? [];
};

export const fetchDebts = async (): Promise<Debt[]> => {
  const { data, error } = await supabase.from('debts').select('*');
  if (error) throw error;
  return data ?? [];
};

export const fetchCashbook = async (): Promise<CashbookEntry[]> => {
  const { data, error } = await supabase.from('cashbook').select('*');
  if (error) throw error;
  return data ?? [];
};

// Fetch all DB at once
export const getDb = async () => {
  const [profiles, inventory, customers, sales, sale_items, debts, cashbook] = await Promise.all([
    fetchProfiles(),
    fetchInventory(),
    fetchCustomers(),
    fetchSales(),
    fetchSaleItems(),
    fetchDebts(),
    fetchCashbook(),
  ]);
  return { profiles, inventory, customers, sales, sale_items, debts, cashbook };
};

export type DbData = Awaited<ReturnType<typeof getDb>>;

// Upsert helpers
export const upsertInventory = async (item: InventoryItem) => {
  const { error } = await supabase.from('inventory').upsert(item);
  if (error) throw error;
};

export const deleteInventoryItem = async (id: string) => {
  const { error } = await supabase
    .from('inventory')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

export const upsertCustomer = async (customer: Customer) => {
  const { error } = await supabase.from('customers').upsert(customer);
  if (error) throw error;
};

export const deleteCustomer = async (id: string) => {
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw error;
};

export const upsertSale = async (sale: Sale) => {
  const { error } = await supabase.from('sales').upsert(sale);
  if (error) throw error;
};

export const deleteSale = async (id: string) => {
  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) throw error;
};

export const upsertSaleItems = async (items: SaleItem[]) => {
  const { error } = await supabase.from('sale_items').upsert(items);
  if (error) throw error;
};

export const deleteSaleItem = async (saleId: string) => {
  const { error } = await supabase.from('sale_items').delete().eq('sale_id', saleId);
  if (error) throw error;
};

export const deleteSaleItemsBySaleIds = async (saleIds: string[]) => {
  if (saleIds.length === 0) return;
  const { error } = await supabase.from('sale_items').delete().in('sale_id', saleIds);
  if (error) throw error;
};

export const upsertDebt = async (debt: Debt) => {
  const { error } = await supabase.from('debts').upsert(debt);
  if (error) throw error;
};

export const deleteDebt = async (saleId: string) => {
  const { error } = await supabase.from('debts').delete().eq('sale_id', saleId);
  if (error) throw error;
};

export const deleteDebtById = async (id: string) => {
  const { error } = await supabase.from('debts').delete().eq('id', id);
  if (error) throw error;
};

export const deleteDebtsByCustomer = async (customerId: string) => {
  const { error } = await supabase.from('debts').delete().eq('customer_id', customerId);
  if (error) throw error;
};

export const deleteSalesByCustomer = async (customerId: string) => {
  const { error } = await supabase.from('sales').delete().eq('customer_id', customerId);
  if (error) throw error;
};

export const upsertCashbookEntry = async (entry: CashbookEntry) => {
  const { error } = await supabase.from('cashbook').upsert(entry);
  if (error) throw error;
};

export const deleteCashbookEntry = async (id: string) => {
  const { error } = await supabase.from('cashbook').delete().eq('id', id);
  if (error) throw error;
};

// ─── Lock/Unlock account ───────────────────────────────────────────────────
export const lockProfile = async (userId: string, reason = 'Đăng nhập đồng thời từ nhiều nơi') => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_locked: true, concurrent_attempts: 0 })
    .eq('id', userId);
  if (error) throw error;
  // Xoá tất cả sessions của user bị khoá
  await supabase.from('user_sessions').delete().eq('user_id', userId);
  console.info(`Profile ${userId} locked: ${reason}`);
};

export const unlockProfile = async (userId: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_locked: false, concurrent_attempts: 0 })
    .eq('id', userId);
  if (error) throw error;
};

// ─── User Sessions ────────────────────────────────────────────────────────
export const upsertUserSession = async (session: {
  user_id: string;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
}) => {
  const { error } = await supabase.from('user_sessions').upsert(
    { ...session, last_seen: new Date().toISOString() },
    { onConflict: 'session_token' }
  );
  if (error) throw error;
};

export const deleteUserSession = async (sessionToken: string) => {
  const { error } = await supabase.from('user_sessions').delete().eq('session_token', sessionToken);
  if (error) throw error;
};

export const deleteAllUserSessions = async (userId: string) => {
  const { error } = await supabase.from('user_sessions').delete().eq('user_id', userId);
  if (error) throw error;
};

export const checkSessionExists = async (sessionToken: string): Promise<boolean> => {
  const { data } = await supabase
    .from('user_sessions')
    .select('session_token')
    .eq('session_token', sessionToken)
    .maybeSingle();
  return data !== null;
};

export const getActiveSessions = async (userId: string): Promise<UserSession[]> => {
  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 phút
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('last_seen', cutoff);
  if (error) throw error;
  return (data ?? []) as UserSession[];
};

export const incrementConcurrentAttempts = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('concurrent_attempts')
    .eq('id', userId)
    .single();
  if (error) throw error;
  const next = ((data?.concurrent_attempts ?? 0) as number) + 1;
  await supabase.from('profiles').update({ concurrent_attempts: next }).eq('id', userId);
  return next;
};

// Helper to call Edge Functions with auth
const callEdgeFunction = async (
  functionName: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Chưa đăng nhập');

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `Lỗi ${functionName}`);
  return json;
};

// Create auth user via Edge Function (owner only)
export const createAuthUser = async (params: {
  employee_id: string;
  password: string;
  full_name: string;
  role: 'owner' | 'manager' | 'staff';
}): Promise<{ id: string; email: string; full_name: string; role: string; employee_id: string }> => {
  const result = await callEdgeFunction('create-user', params);
  return result.user as { id: string; email: string; full_name: string; role: string; employee_id: string };
};

// Delete auth user via Edge Function (owner only)
export const deleteAuthUser = async (userId: string): Promise<void> => {
  await callEdgeFunction('delete-user', { user_id: userId });
};

// Update auth user via Edge Function (owner only)
export const updateAuthUser = async (params: {
  user_id: string;
  password?: string;
  full_name?: string;
  employee_id?: string;
  role?: 'owner' | 'manager' | 'staff';
}): Promise<{ id: string; email: string; full_name: string; role: string; employee_id: string }> => {
  const result = await callEdgeFunction('update-user', params);
  return result.user as { id: string; email: string; full_name: string; role: string; employee_id: string };
};

// Auto increment codes
export const generateCustomerCode = (customers: Customer[]): string => {
  const maxNum = customers.reduce((max, c) => {
    const num = parseInt(c.customer_code.replace('KH-', ''));
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return `KH-${String(maxNum + 1).padStart(4, '0')}`;
};

export const generateCashbookCode = (entries: CashbookEntry[], type: 'income' | 'expense'): string => {
  const prefix = type === 'income' ? 'PT-' : 'PC-';
  const filtered = entries.filter(e => e.code.startsWith(prefix));
  const maxNum = filtered.reduce((max, e) => {
    const num = parseInt(e.code.replace(prefix, ''));
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
};

// Legacy compatibility - synchronous wrapper using cached data
// Pages that haven't migrated to async can use this with pre-fetched data
export const saveDb = (_db: DbData) => {
  // No-op: writes now go through individual upsert functions
  console.warn('saveDb() is deprecated. Use individual upsert functions instead.');
};