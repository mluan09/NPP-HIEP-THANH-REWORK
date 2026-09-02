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
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-12 rounded-3xl text-center max-w-md mx-auto space-y-4 shadow-sm my-12">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Quyền Truy Cập Bị Từ Chối</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-emerald-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Tổng thu</span>
          </div>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">+{totalIncome.toLocaleString()}đ</span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-rose-600">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Tổng chi</span>
          </div>
          <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">-{totalExpense.toLocaleString()}đ</span>
          <div className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">Mua hàng NCC:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{expensePurchase.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vận hành (Lương):</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{expenseOperation.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Chi phí khác:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{expenseOther.toLocaleString()}đ</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-amber-600">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Số dư quỹ hiện tại</span>
          </div>
          <span className={`text-2xl font-extrabold ${balance >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {balance >= 0 ? '+' : ''}{balance.toLocaleString()}đ
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col gap-4">
        {/* Row 1: Search + Filters + Buttons */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Tìm theo lý do, ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-slate-100"
            />
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
          </div>

          {/* Filters - no "Tất cả quỹ" */}
          <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => { setFilterType('income'); clearDateFilter(); }}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 ease-out transform-gpu hover:-translate-y-0.5 ${filterType === 'income'
                ? 'bg-white dark:bg-slate-800 shadow-sm text-emerald-600 dark:text-emerald-450 scale-[1.02]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40'
                }`}
            >
              Phiếu Thu
            </button>
            <button
              onClick={() => { setFilterType('expense'); clearDateFilter(); }}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 ease-out transform-gpu hover:-translate-y-0.5 ${filterType === 'expense'
                ? 'bg-white dark:bg-slate-800 shadow-sm text-rose-650 dark:text-rose-400 scale-[1.02]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40'
                }`}
            >
              Phiếu Chi
            </button>
            <button
              onClick={() => { setFilterType('sales'); clearDateFilter(); }}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 ease-out transform-gpu hover:-translate-y-0.5 ${filterType === 'sales'
                ? 'bg-white dark:bg-slate-800 shadow-sm text-amber-600 dark:text-amber-400 scale-[1.02]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40'
                }`}
            >
              Bán Hàng
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 w-full md:w-auto md:ml-auto">
            <button
              onClick={() => openAddDialog('income')}
              className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Lập Phiếu Thu</span>
            </button>
            <button
              onClick={() => openAddDialog('expense')}
              className="flex-1 md:flex-none bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Lập Phiếu Chi</span>
            </button>
          </div>
        </div>

        {/* Row 2: Date Range Picker */}
        <div className="flex flex-col md:flex-row gap-3 items-center border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
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

      <AnimatePresence mode="wait">
        {filterType === 'sales' ? (
          <motion.div
            key="sales-detail"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden"
          >
            {/* Sales Header + Summary Totals */}
            <div className="p-4 border-b border-slate-150 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Chi tiết bán hàng hằng ngày</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Theo từng sản phẩm trong đơn hàng{(dateFrom || dateTo) ? ` • ${dateFrom || '...'} → ${dateTo || '...'}` : ''}</p>
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
                  <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/55">
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">STT</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">CTV bán hàng</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày bán hàng</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Khách hàng</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Địa chỉ khách hàng</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tên sản phẩm</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Giá bán</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Thành tiền</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Thành tiền giá vốn</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Lợi nhuận ròng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
                  {salesRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 text-sm">
                        Chưa có dữ liệu bán hàng{(dateFrom || dateTo) ? ' trong khoảng thời gian đã chọn' : ''}
                      </td>
                    </tr>
                  ) : (
                    salesRows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-300">{idx + 1}</td>
                        <td className="p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{row.sellerName}</td>
                        <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                          {new Intl.DateTimeFormat('vi-VN').format(new Date(row.saleDate))}
                        </td>
                        <td className="p-4 text-sm font-semibold text-slate-800 dark:text-slate-200">{row.customerName}</td>
                        <td className="p-4 text-sm text-slate-500 dark:text-slate-400 min-w-52">{row.customerAddress}</td>
                        <td className="p-4 text-sm font-bold text-slate-900 dark:text-slate-100 min-w-48">
                          {row.productName}
                          <div className="text-[10px] text-slate-400 font-semibold">SL: {row.quantity.toLocaleString('vi-VN')}</div>
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
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden"
          >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/55">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">STT</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày giờ giao dịch</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Lý do thu chi</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Thu quỹ (+)</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Chi quỹ (-)</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Ghi chú</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-sm">
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
                    <tr key={e.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-300">{idx + 1}</td>
                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{formattedDateTime}</td>
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
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 break-words whitespace-normal leading-relaxed">
                            {e.description}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right">
                        {e.income > 0 ? `+${e.income.toLocaleString('vi-VN')}đ` : '---'}
                      </td>
                      <td className="p-4 text-sm font-bold text-rose-600 dark:text-rose-455 text-right">
                        {e.total_expense > 0 ? `-${e.total_expense.toLocaleString('vi-VN')}đ` : '---'}
                      </td>
                      <td className="p-4 text-sm text-slate-450 dark:text-slate-400 italic text-center">{e.notes || '---'}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => openEditDialog(e)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-lg cursor-pointer transition-colors"
                            title="Chỉnh sửa phiếu"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(e)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg cursor-pointer transition-colors"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDialogOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-250 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl flex flex-col gap-5 z-10"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {editingEntry
                    ? `Chỉnh Sửa Phiếu`
                    : txType === 'income' ? 'Lập Phiếu Thu Quỹ' : 'Lập Phiếu Chi Quỹ'
                  }
                </h3>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5 dark:text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Lý do giao dịch</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={txType === 'income' ? 'Thu nợ khách hàng, thanh toán mua vỏ két...' : 'Chi lương nhân viên, thanh toán điện nước...'}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none dark:text-slate-100"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Số tiền (đ)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCurrencyInput(amount)}
                    onChange={(e) => setAmount(parseCurrencyInput(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl px-3.5 py-2 text-sm font-bold focus:outline-none dark:text-slate-100"
                    required
                  />
                </div>

                {txType === 'expense' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Danh mục chi phí</label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none dark:text-slate-200 cursor-pointer"
                    >
                      <option value="purchase">Mua hàng nhà cung cấp (Beer/Beverage)</option>
                      <option value="operation">Chi phí vận hành (Lương, mặt bằng, điện nước)</option>
                      <option value="other">Các chi phí khác</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Chi tiết / Ghi chú</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Phương thức thanh toán, số tài khoản..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none dark:text-slate-100"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                    className="px-4 py-2 border border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs cursor-pointer hover:bg-slate-50"
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