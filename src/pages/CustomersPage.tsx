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
  Clock
} from 'lucide-react';
import type { Customer, Sale, SaleItem, InventoryItem, Debt, Profile } from '../lib/db';
import { upsertCustomer, deleteCustomer, deleteSale, deleteSaleItem, deleteDebt } from '../lib/db';
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
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
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
  debts,
  setDebts,
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
    setNotes('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening details modal
    setEditingCustomer(c);
    setCustomerName(c.customer_name);
    setPhone(c.phone);
    setAddress(c.address);
    setNotes(c.notes);
    setIsDialogOpen(true);
  };

  const handleDeleteCustomer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening details modal
    const customer = customers.find((c) => c.id === id);
    showConfirm(
      'Xác nhận xóa khách hàng',
      `Bạn có chắc chắn muốn xóa khách hàng "${customer?.customer_name || 'này'}"?\nCác dữ liệu liên quan có thể bị đứt gãy.`,
      () => {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
        deleteCustomer(id).catch(console.error);
        showToast(`Đã xoá khách hàng ${customer?.customer_name || 'này'} thành công`);
      },
      { type: 'danger', confirmText: 'Xóa khách hàng', cancelText: 'Hủy' }
    );
  };

  const handleDeleteSaleHistory = (sale: Sale) => {
    const productSummary = getProductsForSale(sale.id);
    showConfirm(
      'Xác nhận xoá nhật ký giao dịch',
      `Bạn có chắc chắn muốn xoá nhật ký giao dịch ngày ${sale.sale_date}?\n\nSản phẩm: ${productSummary}\nTổng thanh toán: ${sale.total_revenue.toLocaleString('vi-VN')}đ\n\nHành động này sẽ xoá đơn hàng, sản phẩm trong đơn và công nợ liên quan.`,
      () => {
        setSales((prev) => prev.filter((s) => s.id !== sale.id));
        setSaleItems((prev) => prev.filter((item) => item.sale_id !== sale.id));
        setDebts((prev) => prev.filter((debt) => debt.sale_id !== sale.id));
        deleteSale(sale.id).catch(console.error);
        deleteSaleItem(sale.id).catch(console.error);
        deleteDebt(sale.id).catch(console.error);
        showToast(`Đã xoá nhật ký giao dịch ngày ${sale.sale_date} thành công`);
      },
      { type: 'danger', confirmText: 'Xoá nhật ký', cancelText: 'Huỷ' }
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showAlert('Thiếu thông tin', 'Vui lòng điền tên khách hàng.', 'warning');
      return;
    }

    if (editingCustomer) {
      // Update
      setCustomers(prev => prev.map(c => {
        if (c.id === editingCustomer.id) {
          const updated = {
            ...c,
            customer_name: customerName,
            phone,
            address,
            notes
          };
          upsertCustomer(updated).catch(console.error);
          return updated;
        }
        return c;
      }));
    } else {
      // Create new
      const newCustomer: Customer = {
        id: `c-${Date.now()}`,
        customer_code: `KH-${(customers.length + 1).toString().padStart(3, '0')}`,
        customer_name: customerName,
        phone,
        address,
        notes,
        created_at: new Date().toISOString()
      };
      setCustomers(prev => [...prev, newCustomer]);
      upsertCustomer(newCustomer).catch(console.error);
    }
    setIsDialogOpen(false);
  };

  // Get product names for a sale
  const getProductsForSale = (saleId: string): string => {
    const items = saleItems.filter(si => si.sale_id === saleId);
    if (items.length === 0) return '—';
    return items.map(si => {
      const product = inventory.find(p => p.id === si.product_id);
      return product ? `${product.product_name} (x${si.quantity})` : `SP không xác định (x${si.quantity})`;
    }).join(', ');
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
                      <td className="p-4 text-sm font-bold text-white text-right">
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
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Địa chỉ giao hàng</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, quận/huyện..."
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none dark:text-slate-100"
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
      {selectedCustomer && details && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-3xl shadow-2xl flex flex-col gap-5 max-h-[90vh]">
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
              <div className="flex-1 overflow-y-auto border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 border-b border-slate-200/50 dark:border-slate-800/50">
                    <tr>
                      <th className="p-2.5 font-bold">Sản phẩm mua</th>
                      <th className="p-2.5 font-bold">Ngày bán</th>
                      <th className="p-2.5 font-bold text-center">Trạng thái</th>
                      <th className="p-2.5 font-bold text-right">Số nợ</th>
                      <th className="p-2.5 font-bold text-right">Tổng thanh toán</th>
                      {canEdit && (
                        <th className="p-2.5 font-bold text-center">Hành động</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {details.salesList.length === 0 ? (
                      <tr>
                        <td colSpan={canEdit ? 6 : 5} className="p-6 text-center text-slate-400">
                          Chưa phát sinh giao dịch nào
                        </td>
                      </tr>
                    ) : (
                      details.salesList.map((sale) => {
                        const displayStatus = getSaleDisplayStatus(sale);
                        const saleDebt = getDebtForSale(sale.id, sale.customer_id);

                        return (
                          <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-300 max-w-[220px]">
                              <span className="line-clamp-2">{getProductsForSale(sale.id)}</span>
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
          </div>
        </div>
      )}

      {/* Global Confirmation / Alert Modal */}
      <ConfirmModal {...modalState} />
    </div>
  );
};
