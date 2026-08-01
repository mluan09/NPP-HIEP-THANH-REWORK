import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: 'owner' | 'manager' | 'staff';
          created_at: string;
        };
      };
      inventory: {
        Row: {
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
        };
      };
      customers: {
        Row: {
          id: string;
          customer_code: string;
          customer_name: string;
          phone: string;
          address: string;
          notes: string;
          created_at: string;
        };
      };
      sales: {
        Row: {
          id: string;
          seller_id: string;
          customer_id: string;
          sale_date: string;
          status: 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
          total_revenue: number;
          total_cost: number;
          profit: number;
          created_at: string;
        };
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          selling_price: number;
          cost_price: number;
          subtotal_revenue: number;
          subtotal_cost: number;
        };
      };
      debts: {
        Row: {
          id: string;
          customer_id: string;
          sale_id: string | null;
          total_amount: number;
          paid_amount: number;
          remaining_debt: number;
          status: 'PAID' | 'PENDING';
          updated_at: string;
        };
      };
      cashbook: {
        Row: {
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
        };
      };
    };
  };
};