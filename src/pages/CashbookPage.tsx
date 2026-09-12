import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldAlert,
  X,
  Edit3,
  Trash2,
  ShoppingCart,
  Calendar
} from 'lucide-react';
import { generateCashbookCode, upsertCashbookEntry, deleteCashbookEntry } from '../lib/db';
import { formatCurrencyInput, parseCurrencyInput } from '../lib/currency';
import { logActivity } from '../lib/activityLog';
import type { CashbookEntry, Customer, InventoryItem, Profile, Sale, SaleItem } from '../lib/db';
import { useModal } from '../hooks/useModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { DateRangePicker } from '../components/DateRangePicker';
import { useToast } from '../components/Toast';
import { ResponsiveSearchSheet } from '../components/ResponsiveSearchSheet';

interface CashbookPageProps {
  cashbook: CashbookEntry[];
  setCashbook: React.Dispatch<React.SetStateAction<CashbookEntry[]>>;
  sales: Sale[];
  saleItems: SaleItem[];
  customers: Customer[];
  inventory: InventoryItem[];
  profiles: Profile[];
  currentUser: Profile;
}

export const CashbookPage: React.FC<CashbookPageProps> = ({
  cashbook,
  setCashbook,
  sales,
  saleItems,
  customers,
  inventory,
  profiles,
  currentUser
}) => {
  const { modalState, showAlert, showConfirm } = useModal();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);
  const [filterType, setFilterType] = useState<'income' | 'expense' | 'sales'>('income');

  // Date filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [editingEntry, setEditingEntry] = useState<CashbookEntry | null>(null);

  // Form fields
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [expenseCategory, setExpenseCategory] = useState<'purchase' | 'operation' | 'other'>('operation');
  const [notes, setNotes] = useState('');

  // RLS / Role enforcement check
  const isAllowed = currentUser.role === 'owner' || currentUser.role === 'manager';

  if (!isAllowed) {
    return (
      <div className="bg-surface border border-line p-12 rounded-3xl text-center max-w-md mx-auto space-y-4 shadow-sm my-12">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Quyền Truy Cập Bị Từ Chối</h3>
        <p className="text-xs text-muted leading-relaxed">
          Chỉ có **Chủ Cửa Hàng (Owner)** hoặc **Quản Lý (Manager)** mới có quyền truy cập vào sổ quỹ thu chi và thông tin doanh thu nội bộ. Tài khoản hiện tại của bạn là **Nhân viên (Staff)**.
        </p>
      </div>
    );
  }

  // Calculations
  const totalIncome = cashbook.reduce((sum, e) => sum + e.income, 0);
  const totalExpense = cashbook.reduce((sum, e) => sum + e.total_expense, 0);
  const balance = totalIncome - totalExpense;

  const expensePurchase = cashbook.reduce((sum, e) => sum + e.expense_purchase, 0);
  const expenseOperation = cashbook.reduce((sum, e) => sum + e.expense_operation, 0);
  const expenseOther = cashbook.reduce((sum, e) => sum + e.expense_other, 0);

  // Helper: check if a date string falls within the selected date range
  const isInDateRange = (dateStr: string) => {
    if (!dateFrom && !dateTo) return true;
    const d = dateStr.slice(0, 10); // 'YYYY-MM-DD'
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  };

  const salesRows = sales
    .filter(sale => sale.status !== 'CANCELLED')
    .filter(sale => isInDateRange(sale.sale_date))
    .flatMap(sale => {
      const customer = customers.find(c => c.id === sale.customer_id);
      const seller = profiles.find(p => p.id === sale.seller_id);
      return saleItems
        .filter(item => item.sale_id === sale.id)
        .map(item => {
          const product = inventory.find(i => i.id === item.product_id);
          return {
            id: item.id,
            sellerName: seller?.full_name || '---',
            saleDate: sale.sale_date,
            customerName: customer?.customer_name || '---',
            customerAddress: customer?.address || '---',
            productName: product?.product_name || '---',
            quantity: item.quantity,
            sellingPrice: item.selling_price,
            subtotalRevenue: item.subtotal_revenue,
            subtotalCost: item.subtotal_cost,
            netProfit: item.subtotal_revenue - item.subtotal_cost,
          };
        });
    })
    .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());

  // Sales totals for summary cards
  const totalSalesRevenue = salesRows.reduce((sum, r) => sum + r.subtotalRevenue, 0);
  const totalSalesCost = salesRows.reduce((sum, r) => sum + r.subtotalCost, 0);
  const totalSalesProfit = salesRows.reduce((sum, r) => sum + r.netProfit, 0);

  // Filter transactions (with date range)
  const filteredEntries = cashbook.filter(entry => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = entry.description.toLowerCase().includes(term) ||
      (entry.notes || '').toLowerCase().includes(term);

    // Date range filter
    const entryDate = (entry.transaction_date || entry.created_at || '').slice(0, 10);
    if (!isInDateRange(entryDate)) return false;

    if (filterType === 'income') {
      return matchesSearch && entry.income > 0;
    }
    if (filterType === 'expense') {
      return matchesSearch && entry.total_expense > 0;
    }
    return matchesSearch;
  });

  const openAddDialog = (type: 'income' | 'expense') => {
    setEditingEntry(null);
    setTxType(type);
    setDescription('');
    setAmount(100000);
    setExpenseCategory('operation');
    setNotes('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (entry: CashbookEntry) => {
    setEditingEntry(entry);
    setTxType(entry.income > 0 ? 'income' : 'expense');
    setDescription(entry.description);
    setAmount(entry.income > 0 ? entry.income : entry.total_expense);
    setNotes(entry.notes || '');
    if (entry.expense_purchase > 0) setExpenseCategory('purchase');
    else if (entry.expense_operation > 0) setExpenseCategory('operation');
    else setExpenseCategory('other');
    setIsDialogOpen(true);
  };

  const handleDelete = (entry: CashbookEntry) => {
    showConfirm(
      'Xác nhận xóa phiếu',
      `Bạn có chắc chắn muốn xóa phiếu "${entry.description}" không? Hành động này không thể hoàn tác.`,
      async () => {
        try {
          await deleteCashbookEntry(entry.id);
          setCashbook(prev => prev.filter(e => e.id !== entry.id));
          logActivity(currentUser, 'Xóa phiếu thu/chi','cashbook', `${entry.description}`);
          showToast(`Đã xoá phiếu thành công`);
        } catch (err) {
          console.error('Xoá phiếu thất bại:', err);
          showAlert('Lỗi', 'Không thể xoá phiếu. Vui lòng thử lại.', 'danger');
        }
      },
      { type: 'danger', confirmText: 'Xóa phiếu', cancelText: 'Hủy bỏ' }
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showAlert('Thiếu thông tin', 'Vui lòng nhập lý do thu/chi.', 'warning');
      return;
    }
    if (amount <= 0) {
      showAlert('Số tiền không hợp lệ', 'Vui lòng nhập số tiền lớn hơn 0đ.', 'warning');
      return;
    }

    if (editingEntry) {
      // Update existing entry
      setCashbook(prev => prev.map(e => {
        if (e.id !== editingEntry.id) return e;
        const updated = {
          ...e,
          description,
          notes,
          income: txType === 'income' ? Number(amount) : 0,
          expense_purchase: txType === 'expense' && expenseCategory === 'purchase' ? Number(amount) : 0,
          expense_operation: txType === 'expense' && expenseCategory === 'operation' ? Number(amount) : 0,
          expense_other: txType === 'expense' && expenseCategory === 'other' ? Number(amount) : 0,
          total_expense: txType === 'expense' ? Number(amount) : 0,
        };
        upsertCashbookEntry(updated).catch(console.error);
        return updated;
      }));
      logActivity(currentUser, 'Điều chỉnh phiếu thu/chi', 'cashbook', `${description}`);
      setIsDialogOpen(false);
      setEditingEntry(null);
      showToast(`Đã điều chỉnh phiếu ${editingEntry.code} thành công`);
      return;
    }

    const code = generateCashbookCode(cashbook, txType);

    const newEntry: CashbookEntry = {
      id: `cb-${Date.now()}`,
      code,
      transaction_date: new Date().toISOString().slice(0, 10),
      description,
      income: txType === 'income' ? Number(amount) : 0,
      expense_purchase: txType === 'expense' && expenseCategory === 'purchase' ? Number(amount) : 0,
      expense_operation: txType === 'expense' && expenseCategory === 'operation' ? Number(amount) : 0,
      expense_other: txType === 'expense' && expenseCategory === 'other' ? Number(amount) : 0,
      total_expense: txType === 'expense' ? Number(amount) : 0,
      notes,
      created_at: new Date().toISOString(),
    };

    setCashbook(prev => [newEntry, ...prev]);
    upsertCashbookEntry(newEntry).catch(console.error);
    logActivity(currentUser, txType === 'income' ? 'Tạo phiếu thu' : 'Tạo phiếu chi', 'cashbook', `${description}`);
    setIsDialogOpen(false);
  };

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
        <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-line shadow-sm space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-emerald-600">
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider truncate">Tổng thu</span>
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 block truncate">+{totalIncome.toLocaleString()}đ</span>
        </div>
        <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-line shadow-sm space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-rose-600">
            <TrendingDown className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider truncate">Tổng chi</span>
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 block truncate">-{totalExpense.toLocaleString()}đ</span>
          <div className="text-[10px] text-muted space-y-0.5 pt-1 border-t border-line">
            <div className="flex justify-between gap-1">
              <span className="text-muted truncate">Mua hàng NCC:</span>
              <span className="font-semibold text-foreground shrink-0">{expensePurchase.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between gap-1">
              <span className="text-muted truncate">Vận hành (Lương):</span>
              <span className="font-semibold text-foreground shrink-0">{expenseOperation.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between gap-1">
              <span className="text-muted truncate">Chi phí khác:</span>
              <span className="font-semibold text-foreground shrink-0">{expenseOther.toLocaleString()}đ</span>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-line shadow-sm space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-amber-600">
            <DollarSign className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider truncate">Số dư quỹ hiện tại</span>
          </div>
          <span className={`text-xl sm:text-2xl font-extrabold block truncate ${balance >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {balance >= 0 ? '+' : ''}{balance.toLocaleString()}đ
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-surface p-3.5 sm:p-4 rounded-2xl border border-line shadow-sm flex flex-col gap-4">
        {/* Row 1: Search + Filters + Buttons */}
        <div className="flex flex-wrap lg:flex-nowrap gap-3 lg:gap-4 items-center justify-between">
          {/* Desktop Search (>= lg) */}
          <div className="hidden lg:block relative w-72">
            <input
              type="text"
              placeholder="Tìm theo lý do, ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg border border-line rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-muted" />
          </div>

          {/* Touch/Tablet Search Icon (< lg) */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSearchSheetOpen(true)}
              aria-label="Tìm kiếm giao dịch"
              className="min-w-[44px] min-h-[44px] px-3 rounded-xl bg-surface-alt border border-line text-muted hover:text-amber-500 dark:hover:text-amber-400 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Search className="w-5 h-5 text-amber-500" />
              {searchTerm ? (
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 max-w-[120px] truncate">
                  {searchTerm}
                </span>
              ) : (
                <span className="text-xs text-muted">Tìm kiếm...</span>
              )}
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Xóa bộ lọc tìm kiếm"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted hover:text-secondary rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters - no "Tất cả quỹ" */}
          <div className="flex gap-1.5 bg-surface-alt p-1 rounded-xl">
            <button
              onClick={() => { setFilterType('income'); clearDateFilter(); }}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 ease-out transform-gpu hover:-translate-y-0.5 ${filterType === 'income'
                ? 'bg-surface shadow-sm text-emerald-400 scale-[1.02]'
                : 'text-muted hover:text-secondary hover:bg-surface-alt'
                }`}
            >
              Phiếu Thu
            </button>
            <button
              onClick={() => { setFilterType('expense'); clearDateFilter(); }}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 ease-out transform-gpu hover:-translate-y-0.5 ${filterType === 'expense'
                ? 'bg-surface shadow-sm text-rose-400 scale-[1.02]'
                : 'text-muted hover:text-secondary hover:bg-surface-alt'
                }`}
            >
              Phiếu Chi
            </button>
            <button
              onClick={() => { setFilterType('sales'); clearDateFilter(); }}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 ease-out transform-gpu hover:-translate-y-0.5 ${filterType === 'sales'
                ? 'bg-surface shadow-sm text-amber-600 dark:text-amber-400 scale-[1.02]'
                : 'text-muted hover:text-secondary hover:bg-surface-alt'
                }`}
            >
              Bán Hàng
            </button>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 lg:ml-auto">
            <button
              onClick={() => openAddDialog('income')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Lập Phiếu Thu</span>
            </button>
            <button
              onClick={() => openAddDialog('expense')}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Lập Phiếu Chi</span>
            </button>
          </div>
        </div>

        {/* Row 2: Date Range Picker */}
        <div className="flex flex-wrap gap-3 items-center border-t border-line pt-3">
          <div className="flex items-center gap-2 text-muted">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Lọc theo ngày:</span>
          </div>
          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            onChange={(from, to) => {
              setDateFrom(from);
              setDateTo(to);
            }}
            onClear={clearDateFilter}
          />
        </div>
      </div>

      {/* Search Sheet for touch landscape / tablet */}
      <ResponsiveSearchSheet
        isOpen={isSearchSheetOpen}
        onClose={() => setIsSearchSheetOpen(false)}
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Tìm theo lý do, ghi chú..."
        title="Tìm kiếm trong sổ quỹ"
      />

      <AnimatePresence mode="wait">
        {filterType === 'sales' ? (
          <motion.div
            key="sales-detail"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden"
          >
            {/* Sales Header + Summary Totals */}
            <div className="p-4 border-b border-line">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Chi tiết bán hàng hằng ngày</h3>
                  <p className="text-xs text-muted">Theo từng sản phẩm trong đơn hàng{(dateFrom || dateTo) ? ` • ${dateFrom || '...'} → ${dateTo || '...'}` : ''}</p>
                </div>
              </div>
              {/* Summary totals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Tổng thành tiền</span>
                  </div>
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    {totalSalesRevenue.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Tổng giá vốn</span>
                  </div>
                  <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
                    {totalSalesCost.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className={`${totalSalesProfit >= 0 ? 'bg-amber-500/5 border-amber-500/15' : 'bg-rose-500/5 border-rose-500/15'} border rounded-xl p-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <DollarSign className={`w-4 h-4 ${totalSalesProfit >= 0 ? 'text-amber-500' : 'text-rose-500'}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${totalSalesProfit >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>Lợi nhuận ròng</span>
                  </div>
                  <span className={`text-lg font-extrabold ${totalSalesProfit >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {totalSalesProfit >= 0 ? '+' : ''}{totalSalesProfit.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-surface-alt">
                    <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">STT</th>
                    <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">CTV bán hàng</th>
                    <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Ngày bán hàng</th>
                    <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Khách hàng</th>
                    <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Địa chỉ khách hàng</th>
                    <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Tên sản phẩm</th>
                    <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Giá bán</th>
                    <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Thành tiền</th>
                    <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Thành tiền giá vốn</th>
                    <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Lợi nhuận ròng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {salesRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted text-sm">
                        Chưa có dữ liệu bán hàng{(dateFrom || dateTo) ? ' trong khoảng thời gian đã chọn' : ''}
                      </td>
                    </tr>
                  ) : (
                    salesRows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-surface-alt dark:hover:bg-surface-alt transition-colors">
                        <td className="p-4 text-sm font-bold text-foreground">{idx + 1}</td>
                        <td className="p-4 text-sm font-semibold text-secondary">{row.sellerName}</td>
                        <td className="p-4 text-sm text-muted">
                          {new Intl.DateTimeFormat('vi-VN').format(new Date(row.saleDate))}
                        </td>
                        <td className="p-4 text-sm font-semibold text-foreground">{row.customerName}</td>
                        <td className="p-4 text-sm text-muted min-w-52">{row.customerAddress}</td>
                        <td className="p-4 text-sm font-bold text-foreground min-w-48">
                          {row.productName}
                          <div className="text-[10px] text-muted font-semibold">SL: {row.quantity.toLocaleString('vi-VN')}</div>
                        </td>
                        <td className="p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right">{row.sellingPrice.toLocaleString('vi-VN')}đ</td>
                        <td className="p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right">{row.subtotalRevenue.toLocaleString('vi-VN')}đ</td>
                        <td className="p-4 text-sm font-bold text-rose-600 dark:text-rose-400 text-right">{row.subtotalCost.toLocaleString('vi-VN')}đ</td>
                        <td className={`p-4 text-sm font-extrabold text-right ${row.netProfit >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {row.netProfit.toLocaleString('vi-VN')}đ
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cashbook-ledger"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden"
          >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line bg-surface-alt">
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">STT</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Ngày giờ giao dịch</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Lý do thu chi</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Thu quỹ (+)</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Chi quỹ (-)</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-center">Ghi chú</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted text-sm">
                    Không tìm thấy giao dịch dòng tiền nào{(dateFrom || dateTo) ? ' trong khoảng thời gian đã chọn' : ''}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e, idx) => {
                  const isIncome = e.income > 0;
                  const formattedDateTime = e.created_at
                    ? new Intl.DateTimeFormat('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                      }).format(new Date(e.created_at))
                    : e.transaction_date;

                  return (
                    <tr key={e.id} className="hover:bg-surface-alt dark:hover:bg-surface-alt transition-colors">
                      <td className="p-4 text-sm font-bold text-foreground">{idx + 1}</td>
                      <td className="p-4 text-sm text-muted">{formattedDateTime}</td>
                      <td className="p-4">
                        <div className="flex items-start gap-1.5">
                          {isIncome ? (
                            <div className="p-1 bg-emerald-500/10 text-emerald-600 rounded-md">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="p-1 bg-rose-500/10 text-rose-600 rounded-md">
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <span className="text-sm font-bold text-foreground break-words whitespace-normal leading-relaxed">
                            {e.description}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right">
                        {e.income > 0 ? `+${e.income.toLocaleString('vi-VN')}đ` : '---'}
                      </td>
                      <td className="p-4 text-sm font-bold text-rose-600 dark:text-rose-400 text-right">
                        {e.total_expense > 0 ? `-${e.total_expense.toLocaleString('vi-VN')}đ` : '---'}
                      </td>
                      <td className="p-4 text-sm text-muted italic text-center">{e.notes || '---'}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => openEditDialog(e)}
                            className="p-1.5 bg-surface-alt text-secondary hover:text-amber-500 dark:hover:text-amber-400 rounded-lg cursor-pointer transition-colors"
                            title="Chỉnh sửa phiếu"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(e)}
                            className="p-1.5 bg-surface-alt text-secondary hover:text-rose-500 dark:hover:text-rose-400 rounded-lg cursor-pointer transition-colors"
                            title="Xóa phiếu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Write Receipt / Payment Voucher Modal Dialog */}
      <AnimatePresence>
        {isDialogOpen && (
          <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDialogOpen(false)}
              className="fixed inset-0 bg-bg"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-surface rounded-2xl sm:rounded-3xl border border-line w-full max-w-md shadow-2xl flex flex-col z-10 max-h-[calc(100dvh-1.5rem)] lg:max-h-[90vh] overflow-hidden"
            >
              <div className="flex justify-between items-center px-5 sm:px-6 py-3.5 sm:py-4 border-b border-line shrink-0 bg-inherit">
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {editingEntry
                    ? `Chỉnh Sửa Phiếu`
                    : txType === 'income' ? 'Lập Phiếu Thu Quỹ' : 'Lập Phiếu Chi Quỹ'
                  }
                </h3>
                <button
                  type="button"
                  aria-label="Đóng"
                  onClick={() => setIsDialogOpen(false)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-surface-alt dark:hover:bg-surface-alt rounded-xl cursor-pointer text-muted hover:text-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted">Lý do giao dịch</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={txType === 'income' ? 'Thu nợ khách hàng, thanh toán mua vỏ két...' : 'Chi lương nhân viên, thanh toán điện nước...'}
                      className="w-full bg-surface-alt border border-line rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted">Số tiền (đ)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrencyInput(amount)}
                      onChange={(e) => setAmount(parseCurrencyInput(e.target.value))}
                      className="w-full bg-surface-alt border border-line rounded-xl px-3.5 py-2 text-sm font-bold focus:outline-none"
                      required
                    />
                  </div>

                  {txType === 'expense' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted block">Danh mục chi phí</label>
                      <select
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value as any)}
                        className="w-full bg-surface-alt border border-line rounded-xl px-3.5 py-2 text-sm focus:outline-none cursor-pointer"
                      >
                        <option value="purchase">Mua hàng nhà cung cấp (Beer/Beverage)</option>
                        <option value="operation">Chi phí vận hành (Lương, mặt bằng, điện nước)</option>
                        <option value="other">Các chi phí khác</option>
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted">Chi tiết / Ghi chú</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Phương thức thanh toán, số tài khoản..."
                      className="w-full bg-surface-alt border border-line rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sticky bottom-0 px-5 sm:px-6 py-3.5 sm:py-4 border-t border-line bg-surface flex gap-3 justify-end items-center shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                  <button
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                    className="px-4 py-2 border border-line-strong text-secondary rounded-xl text-xs cursor-pointer hover:bg-surface-alt"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md ${txType === 'income'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10'
                      }`}
                  >
                    {editingEntry ? 'Lưu thay đổi' : 'Lưu phiếu'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Confirmation / Alert Modal */}
      <ConfirmModal {...modalState} />
    </div>
  );
};