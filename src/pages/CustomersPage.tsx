import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Phone,
  MapPin,
  FileText,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Clock,
  RotateCcw
} from 'lucide-react';
import type { Customer, Sale, SaleItem, InventoryItem, Debt, Profile } from '../lib/db';
import { upsertCustomer, deleteCustomer, deleteSale, deleteSaleItem, deleteDebt, deleteDebtsByCustomer, deleteSalesByCustomer, deleteSaleItemsBySaleIds, upsertSale, upsertInventory, upsertCashbookEntry } from '../lib/db';
import type { CashbookEntry } from '../lib/db';
import { logActivity } from '../lib/activityLog';
import { useModal } from '../hooks/useModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

interface CustomersPageProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  saleItems: SaleItem[];
  setSaleItems: React.Dispatch<React.SetStateAction<SaleItem[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  cashbook: CashbookEntry[];
  setCashbook: React.Dispatch<React.SetStateAction<CashbookEntry[]>>;
  currentUser: Profile;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({
  customers,
  setCustomers,
  sales,
  setSales,
  saleItems,
  setSaleItems,
  inventory,
  setInventory,
  debts,
  setDebts,
  cashbook: _cashbook,
  setCashbook,
  currentUser
}) => {
  const { modalState, showAlert, showConfirm } = useModal();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Details Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState(false);
  const [notes, setNotes] = useState('');

  const canEdit = currentUser.role === 'owner' || currentUser.role === 'manager';

  // Calculations for each customer
  const getCustomerStats = (customerId: string) => {
    // Filter sales
    const customerSales = sales.filter(s => s.customer_id === customerId && s.status !== 'CANCELLED');
    const totalPurchased = customerSales.reduce((sum, s) => sum + s.total_revenue, 0);

    // Filter debts
    const customerDebts = debts.filter(d => d.customer_id === customerId);
    const remainingDebt = customerDebts.reduce((sum, d) => sum + d.remaining_debt, 0);

    return {
      totalPurchased,
      remainingDebt,
      salesCount: customerSales.length
    };
  };

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    return (
      c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm))
    );
  });

  const openAddDialog = () => {
    setEditingCustomer(null);
    setCustomerName('');
    setPhone('');
    setAddress('');
    setAddressError(false);
    setNotes('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening details modal
    setEditingCustomer(c);
    setCustomerName(c.customer_name);
    setPhone(c.phone);
    setAddress(c.address);
    setAddressError(false);
    setNotes(c.notes);
    setIsDialogOpen(true);
  };

  const handleDeleteCustomer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening details modal
    const customer = customers.find((c) => c.id === id);
    showConfirm(
      'Xác nhận xóa khách hàng',
      `Bạn có chắc chắn muốn xóa khách hàng "${customer?.customer_name || 'này'}"?\nTất cả đơn hàng và công nợ liên quan cũng sẽ bị xóa.`,
      async () => {
        try {
          // Lấy sale IDs của khách hàng để xóa sale_items
          const customerSaleIds = sales.filter(s => s.customer_id === id).map(s => s.id);
          // Xóa theo thứ tự: sale_items → debts → sales → customer
          if (customerSaleIds.length > 0) {
            await deleteSaleItemsBySaleIds(customerSaleIds);
          }
          await deleteDebtsByCustomer(id);
          await deleteSalesByCustomer(id);
          await deleteCustomer(id);
          // Cập nhật state
          setCustomers((prev) => prev.filter((c) => c.id !== id));
          setSales((prev) => prev.filter((s) => s.customer_id !== id));
          setSaleItems((prev) => prev.filter((si) => !customerSaleIds.includes(si.sale_id)));
          setDebts((prev) => prev.filter((d) => d.customer_id !== id));
          logActivity(currentUser, 'Xóa khách hàng', 'customer', customer?.customer_name || 'không rõ');
          showToast(`Đã xoá khách hàng ${customer?.customer_name || 'này'} thành công`);
        } catch (error) {
          console.error(error);
          showAlert('Xóa thất bại', 'Không thể xóa khách hàng. Vui lòng thử lại.', 'danger');
        }
      },
      { type: 'danger', confirmText: 'Xóa khách hàng', cancelText: 'Hủy' }
    );
  };

  // Thu hồi đơn hàng: CANCELLED, hoàn kho, xoá nợ
  const handleRecallSale = (sale: Sale) => {
    if (sale.status === 'CANCELLED') {
      showAlert('Đã thu hồi', 'Đơn hàng này đã được thu hồi trước đó.', 'warning');
      return;
    }
    const productSummary = getProductsForSale(sale.id);
    const items = saleItems.filter(si => si.sale_id === sale.id);
    showConfirm(
      'Xác nhận thu hồi đơn hàng',
      `Thu hồi đơn hàng ngày ${sale.sale_date}?\n\nSản phẩm: ${productSummary}\nTổng giá trị: ${sale.total_revenue.toLocaleString('vi-VN')}đ\n\nSố lượng sẽ được hoàn lại kho. Công nợ liên quan sẽ bị xoá.`,
      async () => {
        try {
          // 1. Cập nhật sale → CANCELLED
          const cancelledSale: Sale = { ...sale, status: 'CANCELLED', total_revenue: 0, total_cost: 0, profit: 0 };
          await upsertSale(cancelledSale);

          // 2. Hoàn kho: giảm export_qty cho từng sản phẩm
          const updatedInventory = [...inventory];
          for (const item of items) {
            const idx = updatedInventory.findIndex(p => p.id === item.product_id);
            if (idx !== -1) {
              const updated = {
                ...updatedInventory[idx],
                export_qty: Math.max(0, updatedInventory[idx].export_qty - item.quantity),
              };
              await upsertInventory(updated);
              updatedInventory[idx] = updated;
            }
          }

          // 3. Tính số tiền khách đã trả = total_revenue - remaining_debt
          const saleDebt = debts.find(d => d.sale_id === sale.id);
          const remainingDebt = saleDebt ? saleDebt.remaining_debt : 0;
          const paidAmount = sale.total_revenue - remainingDebt;

          // 4. Xoá nợ liên quan
          await deleteDebt(sale.id);

          // 5. Tạo bút toán chi hoàn tiền vào sổ quỹ (nếu khách đã trả > 0)
          if (paidAmount > 0) {
            const now = new Date();
            const refundEntry: CashbookEntry = {
              id: `cb-refund-${Date.now()}`,
              code: `HT-${Date.now()}`,
              transaction_date: now.toISOString().split('T')[0],
              description: `Hoàn tiền thu hồi đơn hàng - ${selectedCustomer?.customer_name || 'Khách hàng'} - ${productSummary}`,
              income: 0,
              expense_purchase: 0,
              expense_operation: 0,
              expense_other: paidAmount,
              total_expense: paidAmount,
              notes: `Thu hồi đơn ngày ${sale.sale_date}. Hoàn lại ${paidAmount.toLocaleString('vi-VN')}đ cho khách.`,
              created_at: now.toISOString(),
            };
            await upsertCashbookEntry(refundEntry);
            setCashbook(prev => [...prev, refundEntry]);
          }

          // 6. Cập nhật state
          setSales(prev => prev.map(s => s.id === sale.id ? cancelledSale : s));
          setInventory(updatedInventory);
          setDebts(prev => prev.filter(d => d.sale_id !== sale.id));

          logActivity(
            currentUser,
            'Thu hồi đơn hàng',
            'sale',
            `Khách: ${selectedCustomer?.customer_name || ''} | SP: ${productSummary} | Hoàn tiền: ${paidAmount.toLocaleString('vi-VN')}đ | Ngày: ${sale.sale_date}`
          );
          showToast(`Đã thu hồi đơn hàng ngày ${sale.sale_date}. Hoàn ${paidAmount.toLocaleString('vi-VN')}đ vào sổ quỹ.`);
        } catch (err) {
          console.error('Thu hồi thất bại:', err);
          showAlert('Lỗi', 'Không thể thu hồi đơn hàng. Vui lòng thử lại.', 'danger');
        }
      },
      { type: 'danger', confirmText: 'Thu hồi đơn hàng', cancelText: 'Huỷ' }
    );
  };

  const handleDeleteSaleHistory = (sale: Sale) => {
    const productSummary = getProductsForSale(sale.id);
    showConfirm(
      'Xác nhận xoá nhật ký giao dịch',
      `Bạn có chắc chắn muốn xoá nhật ký giao dịch ngày ${sale.sale_date}?\n\nSản phẩm: ${productSummary}\nTổng thanh toán: ${sale.total_revenue.toLocaleString('vi-VN')}đ\n\nHành động này sẽ xoá đơn hàng, sản phẩm trong đơn và công nợ liên quan.`,
      async () => {
        try {
          await deleteSale(sale.id);
          await deleteSaleItem(sale.id);
          await deleteDebt(sale.id);
          setSales((prev) => prev.filter((s) => s.id !== sale.id));
          setSaleItems((prev) => prev.filter((item) => item.sale_id !== sale.id));
          setDebts((prev) => prev.filter((debt) => debt.sale_id !== sale.id));
          logActivity(currentUser, 'Xóa nhật ký giao dịch', 'customer', `Ngày ${sale.sale_date}`);
          showToast(`Đã xoá nhật ký giao dịch ngày ${sale.sale_date} thành công`);
        } catch (error) {
          console.error(error);
        }
      },
      { type: 'danger', confirmText: 'Xoá nhật ký', cancelText: 'Huỷ' }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showAlert('Thiếu thông tin', 'Vui lòng điền tên khách hàng.', 'warning');
      return;
    }
    if (!address.trim()) {
      setAddressError(true);
      return;
    }
    setAddressError(false);

    try {
      if (editingCustomer) {
        const updated = {
          ...editingCustomer,
          customer_name: customerName,
          phone,
          address,
          notes
        };
        await upsertCustomer(updated);
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? updated : c));
        logActivity(currentUser, 'Cập nhật khách hàng', 'customer', updated.customer_name);
      } else {
        const newCustomer: Customer = {
          id: `c-${Date.now()}`,
          customer_code: `KH-${(customers.length + 1).toString().padStart(3, '0')}`,
          customer_name: customerName,
          phone,
          address,
          notes,
          created_at: new Date().toISOString()
        };
        await upsertCustomer(newCustomer);
        setCustomers(prev => [...prev, newCustomer]);
        logActivity(currentUser, 'Tạo khách hàng', 'customer', newCustomer.customer_name);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  // Get product names for a sale
  const getProductsForSale = (saleId: string): string => {
    const items = saleItems.filter(si => si.sale_id === saleId);
    if (items.length === 0) return '—';

    const uniqueProducts = items.reduce<Array<{ name: string; quantity: number }>>((acc, si) => {
      const product = inventory.find(p => p.id === si.product_id);
      const productName = product ? product.product_name : 'SP không xác định';
      const existing = acc.find(item => item.name === productName);

      if (existing) {
        existing.quantity += si.quantity;
      } else {
        acc.push({ name: productName, quantity: si.quantity });
      }

      return acc;
    }, []);

    return uniqueProducts
      .map(item => `${item.name} (x${item.quantity})`)
      .join(', ');
  };

  // Get debt amount for a specific sale
  const getDebtForSale = (saleId: string, customerId: string): number => {
    const debt = debts.find(d => d.sale_id === saleId && d.customer_id === customerId);
    return debt ? debt.remaining_debt : 0;
  };

  // Determine display status based on debt
  const getSaleDisplayStatus = (sale: Sale): { label: string; style: string } => {
    if (sale.status === 'CANCELLED') {
      return { label: 'Đã hủy', style: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400' };
    }
    if (sale.status === 'DRAFT') {
      return { label: 'Nháp', style: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' };
    }
    const debtAmount = getDebtForSale(sale.id, sale.customer_id);
    if (debtAmount > 0) {
      return { label: 'Còn nợ', style: 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400' };
    }
    return { label: 'Hoàn thành', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' };
  };

  // Get selected customer details (orders and debt lists)
  const getSelectedCustomerDetails = () => {
    if (!selectedCustomer) return null;
    const stats = getCustomerStats(selectedCustomer.id);
    const customerSales = sales
      .filter(s => s.customer_id === selectedCustomer.id)
      .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());

    return {
      stats,
      salesList: customerSales
    };
  };

  const details = getSelectedCustomerDetails();

  return (
    <div className="space-y-6">
      {/* Top metrics summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Tổng khách hàng</span>
            <span className="text-xl font-bold dark:text-slate-100">{customers.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Đang nợ tiền</span>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {customers.filter(c => getCustomerStats(c.id).remainingDebt > 0).length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Tổng số lượng đơn hàng</span>
            <span className="text-xl font-bold dark:text-slate-100">
              {sales.filter(s => s.status !== 'CANCELLED').length}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Tìm theo Tên, Số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-slate-100"
          />
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
        </div>

        {/* Add Customer Button */}
        {canEdit && (
          <button
            onClick={openAddDialog}
            className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm khách hàng</span>
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/55">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">#</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tên khách hàng</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Số điện thoại</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Địa chỉ</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Tổng mua</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Còn nợ</th>
                {canEdit && (
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Hành động</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="p-8 text-center text-slate-400 text-sm">
                    Không tìm thấy khách hàng nào
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c, index) => {
                  const stats = getCustomerStats(c.id);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 cursor-pointer transition-colors"
                      title="Nhấp để xem chi tiết lịch sử giao dịch"
                    >
                      <td className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{index + 1}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 dark:text-slate-100">{c.customer_name}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{c.phone || '---'}</td>
                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">{c.address || '---'}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 dark:text-slate-100 text-right">
                        {stats.totalPurchased.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-4 text-right">
                        <span className={`text-sm font-bold ${stats.remainingDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                          }`}>
                          {stats.remainingDebt > 0 ? `${stats.remainingDebt.toLocaleString('vi-VN')}đ` : '0đ'}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={(e) => openEditDialog(c, e)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-lg cursor-pointer transition-colors"
                              title="Sửa thông tin"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteCustomer(c.id, e)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg cursor-pointer transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Dialog */}
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
              className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl flex flex-col gap-5 z-10"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {editingCustomer ? 'Cập Nhật Khách Hàng' : 'Thêm Khách Hàng Mới'}
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
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Tên khách hàng</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nhập tên đại lý, quán nhậu hoặc tạp hóa..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none dark:text-slate-100"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Số điện thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0908123456"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Địa chỉ giao hàng</label>
                    {addressError && (
                      <span className="text-[11px] font-semibold text-red-500">Vui lòng nhập địa chỉ</span>
                    )}
                  </div>
                  <textarea
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (e.target.value.trim()) setAddressError(false);
                    }}
                    placeholder="Số nhà, tên đường, quận/huyện..."
                    rows={2}
                    aria-invalid={addressError}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl px-3.5 py-2 text-sm focus:outline-none dark:text-slate-100 ${
                      addressError
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                        : 'border-slate-250 dark:border-slate-800'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Ghi chú bổ sung</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Yêu cầu giao hàng, phương thức thanh toán..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none dark:text-slate-100"
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
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md shadow-amber-500/10"
                  >
                    Lưu thông tin
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer Ledger / Details Modal */}
      <AnimatePresence>
        {selectedCustomer && details && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={() => setSelectedCustomer(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-3xl shadow-2xl flex flex-col gap-5 max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex justify-between items-center pb-3 border-b border-slate-150 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-sm">
                  {selectedCustomer.customer_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Sổ giao dịch: {selectedCustomer.customer_name}
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold block">
                    #{customers.findIndex(c => c.id === selectedCustomer.id) + 1}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5 dark:text-slate-400" />
              </button>
            </div>

            {/* Profile body */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40 p-4 rounded-2xl space-y-3.5 text-xs">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">Thông tin chi tiết</h4>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{selectedCustomer.phone || 'Chưa cung cấp'}</span>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{selectedCustomer.address || 'Chưa cung cấp'}</span>
                </div>

                <div className="flex items-start gap-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
                  <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold block text-slate-700 dark:text-slate-350">Ghi chú:</span>
                    <span className="text-slate-500 dark:text-slate-400 mt-0.5 block italic">{selectedCustomer.notes || 'Không có ghi chú'}</span>
                  </div>
                </div>
              </div>

              {/* Financial Box */}
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 p-5 rounded-2xl flex flex-col justify-between">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng sản lượng mua</span>
                  <div className="mt-3">
                    <span className="text-2xl font-extrabold text-slate-950 dark:text-slate-100 block">
                      {details.stats.totalPurchased.toLocaleString('vi-VN')}đ
                    </span>
                    <span className="text-xs text-slate-400 block mt-1">{details.stats.salesCount} đơn hàng giao dịch</span>
                  </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl flex flex-col justify-between">
                  <span className="text-xs text-amber-600/70 dark:text-amber-400/70 font-bold uppercase tracking-wider">Số dư nợ còn lại</span>
                  <div className="mt-3">
                    <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-450 block">
                      {details.stats.remainingDebt.toLocaleString('vi-VN')}đ
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">Sẽ tự động khấu trừ khi thanh toán</span>
                  </div>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="flex-1 flex flex-col min-h-[200px] overflow-hidden">
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                Lịch sử giao dịch đơn hàng
              </h4>
              <div className="flex-1 overflow-y-auto border border-slate-200/50 dark:border-slate-800/50 rounded-xl bg-white dark:bg-slate-900">
                <table className="w-full text-xs text-left border-collapse bg-white dark:bg-slate-900">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5 font-bold">Sản phẩm mua</th>
                      <th className="p-2.5 font-bold">Ngày bán</th>
                      <th className="p-2.5 font-bold text-center">Trạng thái</th>
                      <th className="p-2.5 font-bold text-right">Số nợ</th>
                      <th className="p-2.5 font-bold text-right">Tổng thanh toán</th>
                      {canEdit && (
                        <th className="p-2.5 font-bold text-center">Thu hồi</th>
                      )}
                      {canEdit && (
                        <th className="p-2.5 font-bold text-center">Xoá log</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {details.salesList.length === 0 ? (
                      <tr>
                        <td colSpan={canEdit ? 7 : 5} className="p-6 text-center text-slate-400">
                          Chưa phát sinh giao dịch nào
                        </td>
                      </tr>
                    ) : (
                      details.salesList.map((sale) => {
                        const displayStatus = getSaleDisplayStatus(sale);
                        const saleDebt = getDebtForSale(sale.id, sale.customer_id);

                        return (
                          <tr key={sale.id} className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800">
                            <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-300 max-w-[220px] align-top">
                              <div className="whitespace-normal break-words leading-relaxed">
                                {getProductsForSale(sale.id)}
                              </div>
                            </td>
                            <td className="p-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{sale.sale_date}</td>
                            <td className="p-2.5 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${displayStatus.style}`}>
                                {displayStatus.label === 'Hoàn thành' ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : displayStatus.label === 'Còn nợ' ? (
                                  <Clock className="w-3 h-3 animate-pulse" />
                                ) : null}
                                <span>{displayStatus.label}</span>
                              </span>
                            </td>
                            <td className="p-2.5 text-right whitespace-nowrap">
                              <span className={`font-bold ${saleDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                                {saleDebt > 0 ? `${saleDebt.toLocaleString('vi-VN')}đ` : '0đ'}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {sale.total_revenue.toLocaleString('vi-VN')}đ
                            </td>
                            {canEdit && (
                              <td className="p-2.5 text-center">
                                {sale.status !== 'CANCELLED' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRecallSale(sale)}
                                    className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-950/40 cursor-pointer transition-colors text-[10px] font-bold"
                                    title="Thu hồi đơn hàng (hoàn kho, xoá nợ)"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Thu hồi</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">Đã thu hồi</span>
                                )}
                              </td>
                            )}
                            {canEdit && (
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSaleHistory(sale)}
                                  className="inline-flex items-center justify-center p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
                                  title="Xoá nhật ký giao dịch"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-150 dark:border-slate-800 pt-3">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-bold cursor-pointer"
              >
                Đóng sổ quỹ
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Confirmation / Alert Modal */}
      <ConfirmModal {...modalState} />
    </div>
  );
};
