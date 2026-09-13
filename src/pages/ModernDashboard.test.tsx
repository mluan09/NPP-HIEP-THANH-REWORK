import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModernDashboard } from './ModernDashboard';
import type { Profile, InventoryItem, Sale, SaleItem, Customer, Debt } from '../lib/db';

const mockProfile: Profile = {
  id: 'usr-1',
  full_name: 'Nguyễn Văn A',
  role: 'owner',
  employee_id: 'NV001',
  created_at: '2026-01-01T00:00:00Z',
};

const mockInventory: InventoryItem[] = [
  {
    id: 'p1',
    sku: 'SP001',
    product_name: 'Bia Tiger 330ml',
    unit: 'thùng',
    cost_price: 320000,
    selling_price: 360000,
    initial_stock: 50,
    import_qty: 20,
    export_qty: 15,
    created_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'p2',
    sku: 'SP002',
    product_name: 'Bánh Chocopie Hộp 12',
    unit: 'hộp',
    cost_price: 45000,
    selling_price: 55000,
    initial_stock: 30,
    import_qty: 10,
    export_qty: 5,
    created_at: '2026-02-01T00:00:00Z',
  },
];

const mockSales: Sale[] = [
  {
    id: 's1',
    seller_id: 'usr-1',
    customer_id: 'c1',
    sale_date: new Date().toISOString(),
    status: 'COMPLETED',
    total_revenue: 720000,
    total_cost: 640000,
    profit: 80000,
    created_at: new Date().toISOString(),
  },
];

const mockSaleItems: SaleItem[] = [
  {
    id: 'si1',
    sale_id: 's1',
    product_id: 'p1',
    quantity: 2,
    selling_price: 360000,
    cost_price: 320000,
    subtotal_revenue: 720000,
    subtotal_cost: 640000,
  },
];

const mockCustomers: Customer[] = [
  {
    id: 'c1',
    customer_code: 'KH001',
    customer_name: 'Đại lý An Bình',
    phone: '0901234567',
    address: '123 Đường 1',
    notes: '',
    created_at: '2026-01-01T00:00:00Z',
  },
];

const mockDebts: Debt[] = [
  {
    id: 'd1',
    customer_id: 'c1',
    sale_id: 's1',
    total_amount: 720000,
    paid_amount: 500000,
    remaining_debt: 220000,
    status: 'PENDING',
    updated_at: '2026-02-01T00:00:00Z',
  },
];

describe('ModernDashboard', () => {
  afterEach(cleanup);

  it('renders hero metrics with greeting and financial stats', () => {
    const onNavigate = vi.fn();
    render(
      <ModernDashboard
        currentUser={mockProfile}
        inventory={mockInventory}
        sales={mockSales}
        saleItems={mockSaleItems}
        customers={mockCustomers}
        debts={mockDebts}
        onNavigate={onNavigate}
      />
    );

    expect(screen.getByText(/Xin chào, Nguyễn Văn A!/i)).toBeDefined();
    const table = screen.getByRole('table');
    expect(within(table).getByText('Bia Tiger 330ml')).toBeDefined();
    expect(within(table).getByText('Bánh Chocopie Hộp 12')).toBeDefined();

    // CTA navigation
    fireEvent.click(screen.getByText('Tạo Đơn Hàng Nhanh'));
    expect(onNavigate).toHaveBeenCalledWith('sales');
  });

  it('filters items by search keyword in top products table', () => {
    render(
      <ModernDashboard
        currentUser={mockProfile}
        inventory={mockInventory}
        sales={mockSales}
        saleItems={mockSaleItems}
        customers={mockCustomers}
        debts={mockDebts}
        onNavigate={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Lọc theo tên hoặc mã SKU/i);
    fireEvent.change(searchInput, { target: { value: 'Chocopie' } });

    const table = screen.getByRole('table');
    expect(within(table).getByText('Bánh Chocopie Hộp 12')).toBeDefined();
    expect(within(table).queryByText('Bia Tiger 330ml')).toBeNull();
  });

  it('filters by category pills', () => {
    render(
      <ModernDashboard
        currentUser={mockProfile}
        inventory={mockInventory}
        sales={mockSales}
        saleItems={mockSaleItems}
        customers={mockCustomers}
        debts={mockDebts}
        onNavigate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('ĐỒ UỐNG'));
    const table = screen.getByRole('table');
    expect(within(table).getByText('Bia Tiger 330ml')).toBeDefined();
    expect(within(table).queryByText('Bánh Chocopie Hộp 12')).toBeNull();
  });
});
