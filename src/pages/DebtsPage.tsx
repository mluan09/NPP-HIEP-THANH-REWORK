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
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'paid'>('pending');

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
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Tổng dư nợ chưa thu hồi</span>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-450">
              {debts.reduce((sum, d) => sum + d.remaining_debt, 0).toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Số lượng đơn hàng chưa thanh toán</span>
            <span className="text-xl font-bold dark:text-slate-100">
              {debts.filter(d => d.remaining_debt > 0).length} đơn
            </span>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Tổng công nợ đã hoàn tất thu</span>
            <span className="text-xl font-bold dark:text-slate-100">
              {debts.reduce((sum, d) => sum + d.paid_amount, 0).toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Tìm theo tên Khách Hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-slate-100"
          />
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
        </div>

        {/* Tab Filters */}
        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 ease-out transform-gpu hover:-translate-y-0.5 ${filterTab === 'all'
              ? 'bg-white dark:bg-slate-800 shadow-sm text-[#FF0000] font-bold scale-[1.02]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40'
              }`}
          >
            Tất cả công nợ
          </button>
          <button
            onClick={() => setFilterTab('pending')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 ease-out transform-gpu hover:-translate-y-0.5 ${filterTab === 'pending'
              ? 'bg-white dark:bg-slate-800 shadow-sm text-amber-600 dark:text-amber-400 scale-[1.02]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40'
              }`}
          >
            Còn nợ (Chờ thu)
          </button>
          <button
            onClick={() => setFilterTab('paid')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 ease-out transform-gpu hover:-translate-y-0.5 ${filterTab === 'paid'
              ? 'bg-white dark:bg-slate-800 shadow-sm text-emerald-600 dark:text-emerald-400 scale-[1.02]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40'
              }`}
          >
            Đã thanh toán
          </button>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/55">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Khách hàng</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày giao dịch</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Tổng công nợ gốc</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Đã thanh toán</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Dư nợ còn lại</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Trạng thái</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-sm">
                    Không tìm thấy bản ghi công nợ nào
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => {
                  const customerName = getCustomerName(debt.customer_id);
                  const isPaid = debt.remaining_debt <= 0;

                  return (
                    <tr key={debt.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="p-4">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{customerName}</span>
                      </td>
                      <td className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
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
                            <span className="text-slate-400 text-xs font-semibold">Đã hoàn thành</span>
                          )}
                          {isOwner && (
                            <>
                              <button
                                onClick={() => openEditDialog(debt)}
                                className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-lg cursor-pointer transition-colors"
                                title="Điều chỉnh công nợ"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDebt(debt)}
                                className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg cursor-pointer transition-colors"
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
          <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDebt(null)}
              className="fixed inset-0 bg-slate-950/90"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-250 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl flex flex-col gap-5 z-10"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    Ghi Nhận Thu Nợ Khách Hàng
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDebt(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5 dark:text-slate-400" />
                </button>
              </div>

              <form onSubmit={handlePayDebt} className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl space-y-2.5 text-xs text-slate-400 border border-slate-800">
                  <p><span className="font-bold text-slate-700 dark:text-slate-350">Khách hàng:</span> {getCustomerName(selectedDebt.customer_id)}</p>
                  <p><span className="font-bold text-slate-700 dark:text-slate-350">Mã chứng từ nợ:</span> {selectedDebt.sale_id ? `Đơn hàng ĐH-${selectedDebt.sale_id.toUpperCase()}` : 'Khoản nợ tự do'}</p>
                  <p><span className="font-bold text-slate-700 dark:text-slate-350">Tổng số nợ gốc:</span> {selectedDebt.total_amount.toLocaleString()}đ</p>
                  <p><span className="font-bold text-slate-700 dark:text-slate-350">Nợ còn lại hiện tại:</span> {selectedDebt.remaining_debt.toLocaleString()}đ</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Số tiền khách thanh toán (đ)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCurrencyInput(payAmount)}
                    onChange={(e) => setPayAmount(parseCurrencyInput(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-950 dark:text-slate-100 focus:outline-none"
                    required
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setPayAmount(selectedDebt.remaining_debt)}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] font-bold text-slate-600 dark:text-slate-400 rounded cursor-pointer"
                    >
                      Thu đủ nợ còn lại
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayAmount(Math.floor(selectedDebt.remaining_debt / 2))}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] font-bold text-slate-600 dark:text-slate-400 rounded cursor-pointer"
                    >
                      Thu một nửa (50%)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-amber-500/5 p-3.5 rounded-xl border border-dashed border-amber-500/20 text-xs">
                  <div>
                    <span className="text-slate-400 block">Số nợ cũ:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{selectedDebt.remaining_debt.toLocaleString()}đ</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">Số nợ sau thu:</span>
                    <span className="font-extrabold text-amber-600 dark:text-amber-450 flex items-center justify-end gap-1">
                      <span>{(selectedDebt.remaining_debt - payAmount).toLocaleString()}đ</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Ghi chú phiếu thu</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none dark:text-slate-100"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedDebt(null)}
                    className="px-4 py-2 border border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs cursor-pointer hover:bg-slate-50"
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
          <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingDebt(null)}
              className="fixed inset-0 bg-slate-950/90"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-250 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl flex flex-col gap-5 z-10"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Điều chỉnh công nợ</h3>
                </div>
                <button
                  onClick={() => setEditingDebt(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5 dark:text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSaveEditDebt} className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl space-y-2.5 text-xs text-slate-400 border border-slate-800">
                  <p><span className="font-bold text-slate-700 dark:text-slate-350">Khách hàng:</span> {getCustomerName(editingDebt.customer_id)}</p>
                  <p><span className="font-bold text-slate-700 dark:text-slate-350">Ngày giao dịch:</span> {getTransactionDate(editingDebt)}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Tổng công nợ (đ)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCurrencyInput(editTotalAmount)}
                    onChange={(e) => setEditTotalAmount(parseCurrencyInput(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-950 dark:text-slate-100 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Đã thanh toán (đ)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCurrencyInput(editPaidAmount)}
                    onChange={(e) => setEditPaidAmount(parseCurrencyInput(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-950 dark:text-slate-100 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 bg-amber-500/5 p-3.5 rounded-xl border border-dashed border-amber-500/20 text-xs">
                  <div>
                    <span className="text-slate-400 block">Dư nợ mới:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{Math.max(0, editTotalAmount - editPaidAmount).toLocaleString()}đ</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">Trạng thái:</span>
                    <span className="font-extrabold text-amber-600 dark:text-amber-450">
                      {editTotalAmount - editPaidAmount <= 0 ? 'Đã thu xong' : 'Chờ thu nợ'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingDebt(null)}
                    className="px-4 py-2 border border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs cursor-pointer hover:bg-slate-50"
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
