import { supabase } from './supabase';

export interface Profile {
  id: string;
  full_name: string;
  role: 'owner' | 'manager' | 'staff';
  created_at: string;
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
  const { data, error } = await supabase.from('inventory').select('*');
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
  const { error } = await supabase.from('inventory').delete().eq('id', id);
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

export const upsertDebt = async (debt: Debt) => {
  const { error } = await supabase.from('debts').upsert(debt);
  if (error) throw error;
};

export const deleteDebt = async (saleId: string) => {
  const { error } = await supabase.from('debts').delete().eq('sale_id', saleId);
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

// Delete auth user via Edge Function (owner only)
export const deleteAuthUser = async (userId: string): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ user_id: userId }),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Failed to delete user');
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