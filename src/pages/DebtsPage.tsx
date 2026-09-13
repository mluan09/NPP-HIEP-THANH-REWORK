import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Search,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  X,
  Wallet,
  ArrowRight,
  Edit3,
  Trash2
} from 'lucide-react';
import { generateCashbookCode, upsertDebt, upsertCashbookEntry, deleteDebtById } from '../lib/db';
import { formatCurrencyInput, parseCurrencyInput } from '../lib/currency';
import { logActivity } from '../lib/activityLog';
import type { Debt, Customer, Profile, CashbookEntry, Sale, SaleItem, InventoryItem } from '../lib/db';
import { useModal } from '../hooks/useModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { usePersistedState } from '../hooks/usePersistedState';

interface DebtsPageProps {
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  customers: Customer[];
  cashbook: CashbookEntry[];
  setCashbook: React.Dispatch<React.SetStateAction<CashbookEntry[]>>;
  sales: Sale[];
  saleItems: SaleItem[];
  inventory: InventoryItem[];
  currentUser: Profile;
}

export const DebtsPage: React.FC<DebtsPageProps> = ({
  debts,
  setDebts,
  customers,
  cashbook,
  setCashbook,
  sales,
  saleItems,
  inventory,
  currentUser
}) => {
  const { modalState, showAlert, showConfirm } = useModal();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = usePersistedState<'all' | 'pending' | 'paid'>('npp_debts_filter', 'pending');

  // Payment Dialog state
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState('');

  // Edit Dialog state
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [editTotalAmount, setEditTotalAmount] = useState<number>(0);
  const [editPaidAmount, setEditPaidAmount] = useState<number>(0);

  const isOwner = currentUser.role === 'owner';

  // Get customer name helper
  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.customer_name : 'Khách hàng vãng lai';
  };

  // Get transaction date from sale or fallback to debt updated date
  const getTransactionDate = (debt: Debt) => {
    if (debt.sale_id) {
      const sale = sales.find(s => s.id === debt.sale_id);
      if (sale) return sale.sale_date;
    }
    return (debt.updated_at || '').slice(0, 10);
  };

  const getProductsForSale = (saleId?: string | null): string => {
    if (!saleId) return 'KHÁC';
    const items = saleItems.filter(si => si.sale_id === saleId);
    if (items.length === 0) return saleId.toUpperCase();

    return items
      .map(si => {
        const product = inventory.find(p => p.id === si.product_id);
        return product ? `${product.product_name} (x${si.quantity})` : `SP không xác định (x${si.quantity})`;
      })
      .join(', ');
  };

  // Compute remaining debt dynamically from total - paid
  const getRemainingDebt = (debt: Debt) => {
    return Math.max(0, debt.total_amount - debt.paid_amount);
  };

  // Group or filter debts
  const filteredDebts = debts.filter(debt => {
    const customerName = getCustomerName(debt.customer_id).toLowerCase();
    const matchesSearch = customerName.includes(searchTerm.toLowerCase());

    if (filterTab === 'pending') {
      return matchesSearch && debt.remaining_debt > 0;
    }
    if (filterTab === 'paid') {
      return matchesSearch && debt.remaining_debt <= 0;
    }
    return matchesSearch;
  });

  const openPaymentDialog = (debt: Debt) => {
    setSelectedDebt(debt);
    setPayAmount(debt.remaining_debt); // Default to paying full remaining debt
    setPaymentNotes(`Thu hồi công nợ đơn hàng ${debt.sale_id ? debt.sale_id.toUpperCase() : 'KHÁC'}`);
  };

  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;

    if (payAmount <= 0) {
      showAlert('Số tiền không hợp lệ', 'Vui lòng nhập số tiền thanh toán lớn hơn 0đ.', 'warning');
      return;
    }

    if (payAmount > selectedDebt.remaining_debt) {
      showAlert('Số tiền vượt hạn mức', `Số tiền thanh toán (${payAmount.toLocaleString('vi-VN')}đ) không được vượt quá số nợ còn lại (${selectedDebt.remaining_debt.toLocaleString('vi-VN')}đ).`, 'warning');
      return;
    }

    const customerName = getCustomerName(selectedDebt.customer_id);
    const productSummary = getProductsForSale(selectedDebt.sale_id);

    // 1. Update Debts Table state
    const nextDebt = {
      ...selectedDebt,
      paid_amount: selectedDebt.paid_amount + payAmount,
      remaining_debt: Math.max(0, selectedDebt.total_amount - (selectedDebt.paid_amount + payAmount)),
      status: Math.max(0, selectedDebt.total_amount - (selectedDebt.paid_amount + payAmount)) <= 0 ? 'PAID' : 'PENDING',
      updated_at: new Date().toISOString()
    } as Debt;

    const entryCode = generateCashbookCode(cashbook, 'income');
    const newEntry: CashbookEntry = {
      id: `cb-${Date.now()}`,
      code: entryCode,
      transaction_date: new Date().toISOString().slice(0, 10),
      description: `Thu nợ KH: ${customerName} (Sản phẩm: ${productSummary})`,
      income: payAmount,
      expense_purchase: 0,
      expense_operation: 0,
      expense_other: 0,
      total_expense: 0,
      notes: paymentNotes || 'Thu hồi công nợ',
      created_at: new Date().toISOString()
    };

    await upsertDebt(nextDebt);
    await upsertCashbookEntry(newEntry);

    setDebts(prev => prev.map(d => d.id === selectedDebt.id ? nextDebt : d));
    setCashbook(prev => [newEntry, ...prev]);

    logActivity(
      currentUser,
      'Thu công nợ',
      'debt',
      `${customerName} • ${payAmount.toLocaleString('vi-VN')}đ`
    );
    showToast(`Đã thu công nợ ${customerName} thành công`);
    setSelectedDebt(null);
  };

  const openEditDialog = (debt: Debt) => {
    setEditingDebt(debt);
    setEditTotalAmount(debt.total_amount);
    setEditPaidAmount(debt.paid_amount);
  };

  const handleSaveEditDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebt) return;

    if (editTotalAmount <= 0) {
      showAlert('Số tiền không hợp lệ', 'Tổng công nợ phải lớn hơn 0đ.', 'warning');
      return;
    }

    if (editPaidAmount < 0) {
      showAlert('Số tiền không hợp lệ', 'Số tiền đã thanh toán không được nhỏ hơn 0đ.', 'warning');
      return;
    }

    if (editPaidAmount > editTotalAmount) {
      showAlert('Số tiền không hợp lệ', 'Số tiền đã thanh toán không được lớn hơn tổng công nợ.', 'warning');
      return;
    }

    const remaining = editTotalAmount - editPaidAmount;
    const updatedDebt: Debt = {
      ...editingDebt,
      total_amount: editTotalAmount,
      paid_amount: editPaidAmount,
      remaining_debt: remaining,
      status: remaining <= 0 ? 'PAID' : 'PENDING',
      updated_at: new Date().toISOString()
    };

    await upsertDebt(updatedDebt);
    setDebts(prev => prev.map(d => d.id === editingDebt.id ? updatedDebt : d));
    logActivity(
      currentUser,
      'Điều chỉnh công nợ',
      'debt',
      `${getCustomerName(editingDebt.customer_id)} • ${updatedDebt.remaining_debt.toLocaleString('vi-VN')}đ còn lại`
    );
    showToast(`Đã điều chỉnh công nợ ${getCustomerName(editingDebt.customer_id)} thành công`);
    setEditingDebt(null);
  };

  const handleDeleteDebt = (debt: Debt) => {
    const customerName = getCustomerName(debt.customer_id);
    showConfirm(
      'Xác nhận xoá công nợ',
      `Bạn có chắc chắn muốn xoá khoản công nợ của khách hàng "${customerName}" không?`,
      () => {
        deleteDebtById(debt.id)
          .then(() => {
            setDebts(prev => prev.filter(d => d.id !== debt.id));
            logActivity(currentUser, 'Xoá công nợ', 'debt', customerName);
            showToast(`Đã xoá công nợ ${customerName} thành công`);
          })
          .catch(console.error);
      },
      { type: 'danger', confirmText: 'Xoá công nợ', cancelText: 'Huỷ' }
    );
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-line shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-muted font-semibold block">Tổng dư nợ chưa thu hồi</span>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {debts.reduce((sum, d) => sum + d.remaining_debt, 0).toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-line shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-muted font-semibold block">Số lượng đơn hàng chưa thanh toán</span>
            <span className="text-xl font-bold">
              {debts.filter(d => d.remaining_debt > 0).length} đơn
            </span>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-line shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-muted font-semibold block">Tổng công nợ đã hoàn tất thu</span>
            <span className="text-xl font-bold">
              {debts.reduce((sum, d) => sum + d.paid_amount, 0).toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar filter */}
      <div className="bg-surface p-4 rounded-2xl border border-line shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Tìm theo tên Khách Hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-alt border border-line rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-muted" />
        </div>

        {/* Tab Filters */}
        <div className="flex gap-1.5 bg-surface-alt p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 ease-out transform-gpu hover:-translate-y-0.5 ${filterTab === 'all'
              ? 'bg-surface shadow-sm text-[#FF0000] font-bold scale-[1.02]'
              : 'text-muted hover:text-secondary hover:bg-surface/50 dark:hover:bg-surface-alt'
              }`}
          >
            Tất cả công nợ
          </button>
          <button
            onClick={() => setFilterTab('pending')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 ease-out transform-gpu hover:-translate-y-0.5 ${filterTab === 'pending'
              ? 'bg-surface shadow-sm text-amber-600 dark:text-amber-400 scale-[1.02]'
              : 'text-muted hover:text-secondary hover:bg-surface/50 dark:hover:bg-surface-alt'
              }`}
          >
            Còn nợ (Chờ thu)
          </button>
          <button
            onClick={() => setFilterTab('paid')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 ease-out transform-gpu hover:-translate-y-0.5 ${filterTab === 'paid'
              ? 'bg-surface shadow-sm text-emerald-600 dark:text-emerald-400 scale-[1.02]'
              : 'text-muted hover:text-secondary hover:bg-surface/50 dark:hover:bg-surface-alt'
              }`}
          >
            Đã thanh toán
          </button>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line bg-surface-alt">
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Khách hàng</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Ngày giao dịch</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Tổng công nợ gốc</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Đã thanh toán</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Dư nợ còn lại</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-center">Trạng thái</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted text-sm">
                    Không tìm thấy bản ghi công nợ nào
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => {
                  const customerName = getCustomerName(debt.customer_id);
                  const isPaid = debt.remaining_debt <= 0;

                  return (
                    <tr key={debt.id} className="hover:bg-surface-alt dark:hover:bg-surface-alt transition-colors">
                      <td className="p-4">
                        <span className="text-sm font-bold text-foreground">{customerName}</span>
                      </td>
                      <td className="p-4 text-sm font-semibold text-secondary">
                        {getTransactionDate(debt)}
                      </td>
                      <td className="p-4 text-sm font-bold text-rose-600 dark:text-rose-400 text-right">
                        {debt.total_amount.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400 text-right">
                        {debt.paid_amount.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-4 text-sm font-extrabold text-amber-600 dark:text-amber-400 text-right">
                        {getRemainingDebt(debt).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${isPaid
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                          }`}>
                          {isPaid ? 'Đã thu xong' : 'Chờ thu nợ'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isPaid ? (
                            <button
                              onClick={() => openPaymentDialog(debt)}
                              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-amber-500/10"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Thu nợ</span>
                            </button>
                          ) : (
                            <span className="text-muted text-xs font-semibold">Đã hoàn thành</span>
                          )}
                          {isOwner && (
                            <>
                              <button
                                onClick={() => openEditDialog(debt)}
                                className="p-1.5 bg-surface-alt text-secondary hover:text-amber-500 dark:hover:text-amber-400 rounded-lg cursor-pointer transition-colors"
                                title="Điều chỉnh công nợ"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDebt(debt)}
                                className="p-1.5 bg-surface-alt text-secondary hover:text-red-500 dark:hover:text-red-400 rounded-lg cursor-pointer transition-colors"
                                title="Xoá công nợ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Debt Payment Modal Dialog */}
      <AnimatePresence>
        {selectedDebt && (
          <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDebt(null)}
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
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    Ghi Nhận Thu Nợ Khách Hàng
                  </h3>
                </div>
                <button
                  type="button"
                  aria-label="Đóng"
                  onClick={() => setSelectedDebt(null)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-surface-alt dark:hover:bg-surface-alt rounded-xl cursor-pointer text-muted hover:text-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePayDebt} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
                  <div className="bg-bg p-4 rounded-2xl space-y-2.5 text-xs text-muted border border-line">
                    <p><span className="font-bold text-secondary">Khách hàng:</span> {getCustomerName(selectedDebt.customer_id)}</p>
                    <p><span className="font-bold text-secondary">Mã chứng từ nợ:</span> {selectedDebt.sale_id ? `Đơn hàng ĐH-${selectedDebt.sale_id.toUpperCase()}` : 'Khoản nợ tự do'}</p>
                    <p><span className="font-bold text-secondary">Tổng số nợ gốc:</span> {selectedDebt.total_amount.toLocaleString()}đ</p>
                    <p><span className="font-bold text-secondary">Nợ còn lại hiện tại:</span> {selectedDebt.remaining_debt.toLocaleString()}đ</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted block">Số tiền khách thanh toán (đ)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrencyInput(payAmount)}
                      onChange={(e) => setPayAmount(parseCurrencyInput(e.target.value))}
                      className="w-full bg-surface-alt border border-line rounded-xl px-3.5 py-2.5 text-sm font-bold text-foreground focus:outline-none"
                      required
                    />
                    <div className="flex gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setPayAmount(selectedDebt.remaining_debt)}
                        className="px-2 py-1 bg-surface-alt hover:bg-surface-alt text-[10px] font-bold text-secondary rounded cursor-pointer"
                      >
                        Thu đủ nợ còn lại
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayAmount(Math.floor(selectedDebt.remaining_debt / 2))}
                        className="px-2 py-1 bg-surface-alt hover:bg-surface-alt text-[10px] font-bold text-secondary rounded cursor-pointer"
                      >
                        Thu một nửa (50%)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-amber-500/5 p-3.5 rounded-xl border border-dashed border-amber-500/20 text-xs">
                    <div>
                      <span className="text-muted block">Số nợ cũ:</span>
                      <span className="font-bold text-secondary">{selectedDebt.remaining_debt.toLocaleString()}đ</span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted block">Số nợ sau thu:</span>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400 flex items-center justify-end gap-1">
                        <span>{(selectedDebt.remaining_debt - payAmount).toLocaleString()}đ</span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted block">Ghi chú phiếu thu</label>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="w-full bg-surface-alt border border-line rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sticky bottom-0 px-5 sm:px-6 py-3.5 sm:py-4 border-t border-line bg-surface flex gap-3 justify-end items-center shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                  <button
                    type="button"
                    onClick={() => setSelectedDebt(null)}
                    className="px-4 py-2 border border-line-strong text-secondary rounded-xl text-xs cursor-pointer hover:bg-surface-alt"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md shadow-amber-500/10 flex items-center gap-1"
                  >
                    <span>Thu tiền quỹ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Debt Modal */}
      <AnimatePresence>
        {editingDebt && (
          <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingDebt(null)}
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
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base sm:text-lg font-bold text-foreground">Điều chỉnh công nợ</h3>
                </div>
                <button
                  type="button"
                  aria-label="Đóng"
                  onClick={() => setEditingDebt(null)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-surface-alt dark:hover:bg-surface-alt rounded-xl cursor-pointer text-muted hover:text-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditDebt} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
                  <div className="bg-bg p-4 rounded-2xl space-y-2.5 text-xs text-muted border border-line">
                    <p><span className="font-bold text-secondary">Khách hàng:</span> {getCustomerName(editingDebt.customer_id)}</p>
                    <p><span className="font-bold text-secondary">Ngày giao dịch:</span> {getTransactionDate(editingDebt)}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted block">Tổng công nợ (đ)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrencyInput(editTotalAmount)}
                      onChange={(e) => setEditTotalAmount(parseCurrencyInput(e.target.value))}
                      className="w-full bg-surface-alt border border-line rounded-xl px-3.5 py-2.5 text-sm font-bold text-foreground focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted block">Đã thanh toán (đ)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrencyInput(editPaidAmount)}
                      onChange={(e) => setEditPaidAmount(parseCurrencyInput(e.target.value))}
                      className="w-full bg-surface-alt border border-line rounded-xl px-3.5 py-2.5 text-sm font-bold text-foreground focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-amber-500/5 p-3.5 rounded-xl border border-dashed border-amber-500/20 text-xs">
                    <div>
                      <span className="text-muted block">Dư nợ mới:</span>
                      <span className="font-bold text-secondary">{Math.max(0, editTotalAmount - editPaidAmount).toLocaleString()}đ</span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted block">Trạng thái:</span>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400">
                        {editTotalAmount - editPaidAmount <= 0 ? 'Đã thu xong' : 'Chờ thu nợ'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 px-5 sm:px-6 py-3.5 sm:py-4 border-t border-line bg-surface flex gap-3 justify-end items-center shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                  <button
                    type="button"
                    onClick={() => setEditingDebt(null)}
                    className="px-4 py-2 border border-line-strong text-secondary rounded-xl text-xs cursor-pointer hover:bg-surface-alt"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md shadow-amber-500/10 flex items-center gap-1"
                  >
                    <span>Lưu điều chỉnh</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
