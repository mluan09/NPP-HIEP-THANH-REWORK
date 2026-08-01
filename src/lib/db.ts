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

// Initial Mock Data
const INITIAL_PROFILES: Profile[] = [
  { id: 'u-1', full_name: 'Nguyễn Văn Hiệp', role: 'owner', created_at: new Date().toISOString() },
  { id: 'u-2', full_name: 'Trần Thị Thanh', role: 'manager', created_at: new Date().toISOString() },
  { id: 'u-3', full_name: 'Lê Văn Nam', role: 'staff', created_at: new Date().toISOString() }
];

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'p-1',
    sku: 'TIGER-01',
    product_name: 'Bia Tiger (Thùng 24 lon)',
    unit: 'Thùng',
    cost_price: 320000,
    selling_price: 355000,
    initial_stock: 150,
    import_qty: 60,
    export_qty: 35,
    created_at: new Date().toISOString()
  },
  {
    id: 'p-2',
    sku: 'HEI-02',
    product_name: 'Bia Heineken (Thùng 24 lon)',
    unit: 'Thùng',
    cost_price: 395000,
    selling_price: 430000,
    initial_stock: 120,
    import_qty: 40,
    export_qty: 25,
    created_at: new Date().toISOString()
  },
  {
    id: 'p-3',
    sku: 'LAR-03',
    product_name: 'Bia Larue (Thùng 24 lon)',
    unit: 'Thùng',
    cost_price: 235000,
    selling_price: 260000,
    initial_stock: 200,
    import_qty: 80,
    export_qty: 95,
    created_at: new Date().toISOString()
  },
  {
    id: 'p-4',
    sku: 'COCA-04',
    product_name: 'Nước ngọt Coca-Cola (Khay 24 lon)',
    unit: 'Khay',
    cost_price: 180000,
    selling_price: 210000,
    initial_stock: 250,
    import_qty: 120,
    export_qty: 140,
    created_at: new Date().toISOString()
  },
  {
    id: 'p-5',
    sku: 'PEPSI-05',
    product_name: 'Nước ngọt Pepsi (Khay 24 lon)',
    unit: 'Khay',
    cost_price: 175000,
    selling_price: 205000,
    initial_stock: 220,
    import_qty: 100,
    export_qty: 110,
    created_at: new Date().toISOString()
  },
  {
    id: 'p-6',
    sku: 'REDBULL-06',
    product_name: 'Nước tăng lực Red Bull (Khay 24 lon)',
    unit: 'Khay',
    cost_price: 220000,
    selling_price: 255000,
    initial_stock: 100,
    import_qty: 50,
    export_qty: 40,
    created_at: new Date().toISOString()
  },
  {
    id: 'p-7',
    sku: 'AQUA-07',
    product_name: 'Nước suối Aquafina (Thùng 24 chai 500ml)',
    unit: 'Thùng',
    cost_price: 85000,
    selling_price: 105000,
    initial_stock: 300,
    import_qty: 150,
    export_qty: 180,
    created_at: new Date().toISOString()
  }
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c-1',
    customer_code: 'KH-0001',
    customer_name: 'Tạp hóa Thanh Vy',
    phone: '0908123456',
    address: '123 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh',
    notes: 'Khách hàng thân thiết, giao hàng buổi sáng',
    created_at: new Date().toISOString()
  },
  {
    id: 'c-2',
    customer_code: 'KH-0002',
    customer_name: 'Quán nhậu Bình Dân 79',
    phone: '0912987654',
    address: '79 Điện Biên Phủ, Quận Bình Thạnh, TP. Hồ Chí Minh',
    notes: 'Thanh toán công nợ theo tuần',
    created_at: new Date().toISOString()
  },
  {
    id: 'c-3',
    customer_code: 'KH-0003',
    customer_name: 'Đại lý nước ngọt Minh Thư',
    phone: '0933456789',
    address: '456 Xô Viết Nghệ Tĩnh, Quận Bình Thạnh, TP. Hồ Chí Minh',
    notes: 'Nhập số lượng lớn, chiết khấu tốt',
    created_at: new Date().toISOString()
  },
  {
    id: 'c-4',
    customer_code: 'KH-0004',
    customer_name: 'Tạp hóa Cô Lan',
    phone: '0988776655',
    address: '88 Phan Đăng Lưu, Quận Phú Nhuận, TP. Hồ Chí Minh',
    notes: 'Lấy lẻ các loại nước giải khát',
    created_at: new Date().toISOString()
  }
];

const INITIAL_SALES: Sale[] = [
  {
    id: 's-1',
    seller_id: 'u-3',
    customer_id: 'c-1',
    sale_date: '2026-07-15',
    status: 'COMPLETED',
    total_revenue: 12150000,
    total_cost: 10900000,
    profit: 1250000,
    created_at: '2026-07-15T09:30:00Z'
  },
  {
    id: 's-2',
    seller_id: 'u-2',
    customer_id: 'c-2',
    sale_date: '2026-07-18',
    status: 'COMPLETED',
    total_revenue: 18500000,
    total_cost: 16800000,
    profit: 170000,
    created_at: '2026-07-18T14:45:00Z'
  },
  {
    id: 's-3',
    seller_id: 'u-3',
    customer_id: 'c-3',
    sale_date: '2026-07-20',
    status: 'CONFIRMED',
    total_revenue: 25400000,
    total_cost: 22800000,
    profit: 2600000,
    created_at: '2026-07-20T10:15:00Z'
  }
];

const INITIAL_SALE_ITEMS: SaleItem[] = [
  // Đơn s-1
  {
    id: 'si-1',
    sale_id: 's-1',
    product_id: 'p-1', // Tiger
    quantity: 20,
    selling_price: 355000,
    cost_price: 320000,
    subtotal_revenue: 7100000,
    subtotal_cost: 6400000
  },
  {
    id: 'si-2',
    sale_id: 's-1',
    product_id: 'p-4', // Coca
    quantity: 24,
    selling_price: 210000,
    cost_price: 180000,
    subtotal_revenue: 5040000,
    subtotal_cost: 4320000
  },
  // Đơn s-2
  {
    id: 'si-3',
    sale_id: 's-2',
    product_id: 'p-2', // Heineken
    quantity: 25,
    selling_price: 430000,
    cost_price: 395000,
    subtotal_revenue: 10750000,
    subtotal_cost: 9875000
  },
  {
    id: 'si-4',
    sale_id: 's-2',
    product_id: 'p-6', // Redbull
    quantity: 30,
    selling_price: 255000,
    cost_price: 220000,
    subtotal_revenue: 7650000,
    subtotal_cost: 6600000
  },
  // Đơn s-3
  {
    id: 'si-5',
    sale_id: 's-3',
    product_id: 'p-3', // Larue
    quantity: 80,
    selling_price: 260000,
    cost_price: 235000,
    subtotal_revenue: 20800000,
    subtotal_cost: 18800000
  },
  {
    id: 'si-6',
    sale_id: 's-3',
    product_id: 'p-7', // Aquafina
    quantity: 44,
    selling_price: 105000,
    cost_price: 85000,
    subtotal_revenue: 4620000,
    subtotal_cost: 3740000
  }
];

const INITIAL_DEBTS: Debt[] = [
  {
    id: 'd-1',
    customer_id: 'c-1',
    sale_id: 's-1',
    total_amount: 12150000,
    paid_amount: 12150000,
    remaining_debt: 0,
    status: 'PAID',
    updated_at: '2026-07-15T09:35:00Z'
  },
  {
    id: 'd-2',
    customer_id: 'c-2',
    sale_id: 's-2',
    total_amount: 18400000,
    paid_amount: 10000000,
    remaining_debt: 8400000,
    status: 'PENDING',
    updated_at: '2026-07-18T14:50:00Z'
  },
  {
    id: 'd-3',
    customer_id: 'c-3',
    sale_id: 's-3',
    total_amount: 25400000,
    paid_amount: 15000000,
    remaining_debt: 10400000,
    status: 'PENDING',
    updated_at: '2026-07-20T10:20:00Z'
  }
];

const INITIAL_CASHBOOK: CashbookEntry[] = [
  {
    id: 'cb-1',
    code: 'PT-0001',
    transaction_date: '2026-07-15',
    description: 'Thu tiền mặt đơn hàng s-1 (KH Tạp hóa Thanh Vy)',
    income: 12150000,
    expense_purchase: 0,
    expense_operation: 0,
    expense_other: 0,
    total_expense: 0,
    notes: 'Thu đủ',
    created_at: '2026-07-15T09:35:00Z'
  },
  {
    id: 'cb-2',
    code: 'PT-0002',
    transaction_date: '2026-07-18',
    description: 'Thu tiền cọc đơn hàng s-2 (KH Quán nhậu Bình Dân 79)',
    income: 10000000,
    expense_purchase: 0,
    expense_operation: 0,
    expense_other: 0,
    total_expense: 0,
    notes: 'Còn nợ 8,400,000đ',
    created_at: '2026-07-18T14:50:00Z'
  },
  {
    id: 'cb-3',
    code: 'PC-0001',
    transaction_date: '2026-07-19',
    description: 'Chi phí thanh toán tiền điện nước kho bãi tháng 07/2026',
    income: 0,
    expense_purchase: 0,
    expense_operation: 4200000,
    expense_other: 0,
    total_expense: 4200000,
    notes: 'Chuyển khoản điện lực',
    created_at: '2026-07-19T08:00:00Z'
  },
  {
    id: 'cb-4',
    code: 'PT-0003',
    transaction_date: '2026-07-20',
    description: 'Thu tiền cọc đơn hàng s-3 (KH Đại lý Minh Thư)',
    income: 15000000,
    expense_purchase: 0,
    expense_operation: 0,
    expense_other: 0,
    total_expense: 0,
    notes: 'Còn nợ 10,400,000đ',
    created_at: '2026-07-20T10:20:00Z'
  }
];

// Helper functions for localStorage
const load = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(`hiepthanh_npp_${key}`);
  if (!data) {
    localStorage.setItem(`hiepthanh_npp_${key}`, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(data);
};

const save = <T>(key: string, data: T): void => {
  localStorage.setItem(`hiepthanh_npp_${key}`, JSON.stringify(data));
};

export const getDb = () => {
  return {
    profiles: load<Profile[]>('profiles', INITIAL_PROFILES),
    inventory: load<InventoryItem[]>('inventory', INITIAL_INVENTORY),
    customers: load<Customer[]>('customers', INITIAL_CUSTOMERS),
    sales: load<Sale[]>('sales', INITIAL_SALES),
    sale_items: load<SaleItem[]>('sale_items', INITIAL_SALE_ITEMS),
    debts: load<Debt[]>('debts', INITIAL_DEBTS),
    cashbook: load<CashbookEntry[]>('cashbook', INITIAL_CASHBOOK)
  };
};

export const saveDb = (db: ReturnType<typeof getDb>) => {
  save('profiles', db.profiles);
  save('inventory', db.inventory);
  save('customers', db.customers);
  save('sales', db.sales);
  save('sale_items', db.sale_items);
  save('debts', db.debts);
  save('cashbook', db.cashbook);
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
