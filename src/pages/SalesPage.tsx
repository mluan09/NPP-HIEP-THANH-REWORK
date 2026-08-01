import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Search,
  User,
  Trash2,
  Plus,
  Minus,
  Check,
  AlertCircle,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { generateCashbookCode } from '../lib/db';
import { formatCurrencyInput, parseCurrencyInput } from '../lib/currency';
import type { Customer, InventoryItem, Sale, SaleItem, Debt, CashbookEntry, Profile } from '../lib/db';
import { useModal } from '../hooks/useModal';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';

interface SalesPageProps {
  customers: Customer[];
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  saleItems: SaleItem[];
  setSaleItems: React.Dispatch<React.SetStateAction<SaleItem[]>>;
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  cashbook: CashbookEntry[];
  setCashbook: React.Dispatch<React.SetStateAction<CashbookEntry[]>>;
  currentUser: Profile;
}

export const SalesPage: React.FC<SalesPageProps> = ({
  customers,
  inventory,
  setInventory,
  setSales,
  setSaleItems,
  setDebts,
  setCashbook,
  currentUser
}) => {
  const { modalState, showAlert } = useModal();
  const { showToast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close customer dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cart state
  interface CartItem {
    product: InventoryItem;
    quantity: number;
    sellingPrice: number;
  }
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const canSeeFinancials = currentUser.role === 'owner' || currentUser.role === 'manager';

  // Get current stock helper
  const getItemStock = (item: InventoryItem) => {
    return item.initial_stock + item.import_qty - item.export_qty;
  };

  // Filtered products list for dropdown
  const filteredProducts = inventory.filter(p => {
    const matches = p.product_name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase());
    return matches && productSearch.length > 0;
  });

  const addToCart = (product: InventoryItem) => {
    const available = getItemStock(product);
    if (available <= 0) {
      showAlert('Hết hàng', `Sản phẩm ${product.product_name} đã hết hàng trong kho.`, 'warning');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= available) {
          showAlert('Giới hạn tồn kho', `Chỉ còn ${available} ${product.unit} trong kho.`, 'warning');
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, sellingPrice: product.selling_price }];
    });
    setProductSearch('');
  };

  const updateCartQty = (productId: string, val: number) => {
    const target = cart.find(i => i.product.id === productId);
    if (!target) return;

    const available = getItemStock(target.product);
    const newQty = target.quantity + val;

    if (newQty <= 0) {
      setCart(prev => prev.filter(i => i.product.id !== productId));
      return;
    }

    if (newQty > available) {
      showAlert('Giới hạn tồn kho', `Không thể vượt quá tồn kho khả dụng (${available} ${target.product.unit}).`, 'warning');
      return;
    }

    setCart(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQty }
        : item
    ));
  };

  const updateCartPrice = (productId: string, price: number) => {
    setCart(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, sellingPrice: price }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  // Calculations
  const totalRevenue = cart.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0);
  const totalCost = cart.reduce((sum, item) => sum + (item.quantity * item.product.cost_price), 0);
  const profit = totalRevenue - totalCost;
  const remainingDebt = Math.max(0, totalRevenue - paidAmount);

  // checkout submission logic (Supabase trigger / RPC emulation)
  const handleCheckout = (status: 'DRAFT' | 'CONFIRMED') => {
    if (!selectedCustomerId) {
      showAlert('Chưa chọn khách hàng', 'Vui lòng chọn khách hàng trước khi tạo đơn.', 'warning');
      return;
    }
    if (cart.length === 0) {
      showAlert('Giỏ hàng trống', 'Giỏ hàng trống. Vui lòng thêm sản phẩm.', 'warning');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    // IF CONFIRMED, DO THE SAFE INVENTORY CHECK
    if (status === 'CONFIRMED') {
      const stockErrors: string[] = [];
      cart.forEach(item => {
        const currentStock = getItemStock(item.product);
        if (item.quantity > currentStock) {
          stockErrors.push(`• [${item.product.product_name}] chỉ còn ${currentStock} ${item.product.unit} (cần ${item.quantity})`);
        }
      });

      if (stockErrors.length > 0) {
        showAlert('Không thể xuất kho', `Các sản phẩm sau không đủ tồn kho:\n\n${stockErrors.join('\n')}`, 'danger');
        return; // Hủy toàn bộ giao dịch
      }

      // Deduct stock in state (update export_qty)
      setInventory(prev => prev.map(invItem => {
        const cartItem = cart.find(cItem => cItem.product.id === invItem.id);
        if (cartItem) {
          return {
            ...invItem,
            export_qty: invItem.export_qty + cartItem.quantity
          };
        }
        return invItem;
      }));
    }

    // Create Sale record
    const saleId = `s-${Date.now()}`;
    const newSale: Sale = {
      id: saleId,
      seller_id: currentUser.id,
      customer_id: selectedCustomerId,
      sale_date: new Date().toISOString().slice(0, 10),
      status: status === 'CONFIRMED' ? 'COMPLETED' : 'DRAFT',
      total_revenue: totalRevenue,
      total_cost: totalCost,
      profit: profit,
      created_at: new Date().toISOString()
    };

    // Create SaleItems records
    const newSaleItems: SaleItem[] = cart.map((item, idx) => ({
      id: `si-${saleId}-${idx}`,
      sale_id: saleId,
      product_id: item.product.id,
      quantity: item.quantity,
      selling_price: item.sellingPrice,
      cost_price: item.product.cost_price,
      subtotal_revenue: item.quantity * item.sellingPrice,
      subtotal_cost: item.quantity * item.product.cost_price
    }));

    setSales(prev => [newSale, ...prev]);
    setSaleItems(prev => [...newSaleItems, ...prev]);

    // Handle Debt & Cashbook if status is confirmed
    if (status === 'CONFIRMED') {
      // 1. Log Debt entry if there's remaining debt
      if (remainingDebt > 0) {
        const newDebt: Debt = {
          id: `debt-${Date.now()}`,
          customer_id: selectedCustomerId,
          sale_id: saleId,
          total_amount: totalRevenue,
          paid_amount: paidAmount,
          remaining_debt: remainingDebt,
          status: 'PENDING',
          updated_at: new Date().toISOString()
        };
        setDebts(prev => [newDebt, ...prev]);
      } else {
        // Fully paid debt record
        const newDebt: Debt = {
          id: `debt-${Date.now()}`,
          customer_id: selectedCustomerId,
          sale_id: saleId,
          total_amount: totalRevenue,
          paid_amount: totalRevenue,
          remaining_debt: 0,
          status: 'PAID',
          updated_at: new Date().toISOString()
        };
        setDebts(prev => [newDebt, ...prev]);
      }

      // 2. Log Cashbook ledger if paid amount > 0
      if (paidAmount > 0) {
        setCashbook(prev => {
          const entryCode = generateCashbookCode(prev, 'income');
          const newEntry: CashbookEntry = {
            id: `cb-${Date.now()}`,
            code: entryCode,
            transaction_date: new Date().toISOString().slice(0, 10),
            description: `Thu tiền đơn hàng ${saleId.toUpperCase()} (KH: ${customer.customer_name})`,
            income: paidAmount,
            expense_purchase: 0,
            expense_operation: 0,
            expense_other: 0,
            total_expense: 0,
            notes: notes || 'Thanh toán trực tiếp',
            created_at: new Date().toISOString()
          };
          return [newEntry, ...prev];
        });
      }
    }

    showToast(
      status === 'CONFIRMED' ? 'Tạo đơn và xác nhận xuất kho thành công!' : 'Đã lưu đơn nháp thành công.'
    );

    // Clear cart
    setCart([]);
    setSelectedCustomerId('');
    setPaidAmount(0);
    setNotes('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product list selector */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search header */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-3.5">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-500" />
            <span>Chọn sản phẩm bán hàng</span>
          </h3>

          <div className="relative">
            <input
              type="text"
              placeholder="Gõ tên sản phẩm, mã SKU để tìm kiếm..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:text-slate-100"
            />
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          </div>

          {/* Searched item results dropdown panel */}
          {productSearch && (
            <div className="border border-slate-200/60 dark:border-slate-800 rounded-2xl max-h-60 overflow-y-auto bg-slate-50/90 dark:bg-slate-950 divide-y divide-slate-200/40 dark:divide-slate-850 shadow-lg">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs font-medium">
                  Không tìm thấy sản phẩm nào phù hợp
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const stock = getItemStock(p);
                  return (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="p-3 flex items-center justify-between hover:bg-amber-500/5 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block">{p.sku}</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{p.product_name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-450 block">
                          {p.selling_price.toLocaleString('vi-VN')}đ / {p.unit}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${stock <= 0
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/20'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20'
                          }`}>
                          Tồn khả dụng: {stock}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Selected Cart Items Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden flex flex-col min-h-[350px]">
          <div className="p-5 border-b border-slate-150 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
              Danh sách sản phẩm xuất bán ({cart.length})
            </h3>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 text-slate-400">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider">Sản phẩm</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-center">Số lượng</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-right">Đơn giá bán</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-right">Thành tiền</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 text-sm font-semibold">
                      Chưa chọn sản phẩm nào. Dùng thanh tìm kiếm phía trên để thêm sản phẩm vào đơn.
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => (
                    <tr key={item.product.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                      <td className="p-4">
                        <span className="text-xs text-slate-400 block">{item.product.sku}</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.product.product_name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-1">Đơn vị: {item.product.unit}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-250/20 dark:border-slate-700/30">
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.product.id, -1)}
                            className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-xs font-bold text-slate-800 dark:text-slate-250">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.product.id, 1)}
                            className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatCurrencyInput(item.sellingPrice)}
                          onChange={(e) => updateCartPrice(item.product.id, parseCurrencyInput(e.target.value))}
                          className="w-24 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-right font-semibold focus:outline-none dark:text-slate-250"
                        />
                      </td>
                      <td className="p-4 text-right font-bold text-slate-850 dark:text-slate-100">
                        {(item.quantity * item.sellingPrice).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer and Checkout Box */}
      <div className="space-y-4">
        {/* Customer area */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider flex items-center gap-2">
            <User className="w-5 h-5 text-amber-500" />
            <span>Thông tin Khách hàng</span>
          </h3>

          <div className="space-y-3.5">
            {/* Custom Animated Customer Selector */}
            <div className="space-y-1 relative" ref={dropdownRef}>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Chọn Khách Hàng</label>

              <button
                type="button"
                onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-left flex items-center justify-between hover:border-amber-500/50 transition-all cursor-pointer shadow-sm group"
              >
                {selectedCustomerId ? (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
                      {customers.find(c => c.id === selectedCustomerId)?.customer_name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block truncate">
                        {customers.find(c => c.id === selectedCustomerId)?.customer_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        #{customers.findIndex(c => c.id === selectedCustomerId) + 1} • {customers.find(c => c.id === selectedCustomerId)?.phone || 'Không sđt'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-slate-400 text-sm font-medium">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>-- Chọn khách hàng mua hàng --</span>
                  </div>
                )}
                <span className="text-slate-400 text-xs group-hover:text-amber-500 transition-colors">
                  {isCustomerDropdownOpen ? '▲' : '▼'}
                </span>
              </button>

              {/* Animated Popover */}
              <AnimatePresence>
                {isCustomerDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-30 overflow-hidden"
                  >
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Tìm tên, sđt khách hàng..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none dark:text-slate-100"
                          autoFocus
                        />
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
                      {customers
                        .filter(c =>
                          c.customer_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                          (c.phone && c.phone.includes(customerSearch))
                        )
                        .map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setIsCustomerDropdownOpen(false);
                            }}
                            className={`p-2.5 rounded-xl flex items-center justify-between hover:bg-amber-500/10 dark:hover:bg-amber-500/10 cursor-pointer transition-colors ${selectedCustomerId === c.id ? 'bg-amber-500/15 border border-amber-500/20' : ''
                              }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                                {c.customer_name.charAt(0)}
                              </div>
                              <div className="truncate">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">
                                  {c.customer_name}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  #{customers.findIndex(x => x.id === c.id) + 1} • {c.phone || 'Không sđt'}
                                </span>
                              </div>
                            </div>
                            {selectedCustomerId === c.id && (
                              <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {selectedCustomerId && (
              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-200/30 dark:border-slate-850 text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                <p><span className="font-bold text-slate-700 dark:text-slate-300">Điện thoại:</span> {customers.find(c => c.id === selectedCustomerId)?.phone || '---'}</p>
                <p><span className="font-bold text-slate-700 dark:text-slate-300">Địa chỉ:</span> {customers.find(c => c.id === selectedCustomerId)?.address || '---'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
            Chi tiết thanh toán đơn hàng
          </h3>

          <div className="space-y-3.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Tổng doanh thu:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                {totalRevenue.toLocaleString('vi-VN')}đ
              </span>
            </div>

            {canSeeFinancials && (
              <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800/50 pt-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Ước lượng lợi nhuận:</span>
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{profit.toLocaleString('vi-VN')}đ (giá vốn: {totalCost.toLocaleString('vi-VN')}đ)
                </span>
              </div>
            )}

            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/50">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tiền khách trả trước (đ)</label>
              <input
                type="text"
                inputMode="numeric"
                value={formatCurrencyInput(paidAmount)}
                onChange={(e) => setPaidAmount(parseCurrencyInput(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <div className="flex gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setPaidAmount(totalRevenue)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded cursor-pointer transition-colors"
                >
                  Trả hết
                </button>
                <button
                  type="button"
                  onClick={() => setPaidAmount(0)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded cursor-pointer transition-colors"
                >
                  Ghi nợ 100%
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-150 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Còn nợ lại:</span>
              <span className={`font-extrabold ${remainingDebt > 0 ? 'text-rose-600 dark:text-rose-455' : 'text-slate-400'}`}>
                {remainingDebt.toLocaleString('vi-VN')}đ
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ghi chú sổ sách</label>
              <input
                type="text"
                placeholder="Ví dụ: Nợ thanh toán chuyển khoản, giao hàng..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none dark:text-slate-100"
              />
            </div>

            {/* Actions button */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => handleCheckout('CONFIRMED')}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-amber-500/20 text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200"
              >
                <Check className="w-5 h-5" />
                <span>XÁC NHẬN XUẤT ĐƠN</span>
              </button>

              <button
                onClick={() => handleCheckout('DRAFT')}
                className="w-full border border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-850 text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <FileCheck className="w-4 h-4 text-slate-400" />
                <span>LƯU ĐƠN NHÁP</span>
              </button>
            </div>

            {remainingDebt > 0 && (
              <div className="flex items-start gap-2 p-2.5 bg-rose-500/5 rounded-xl border border-rose-500/10 text-[10px] text-rose-600 dark:text-rose-400 leading-normal">
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                <span>Đơn hàng có số dư nợ. Một bản ghi nợ mới trị giá {remainingDebt.toLocaleString()}đ sẽ được tự động cập nhật vào quản lý công nợ của khách hàng.</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal Cảnh Báo & Xác Nhận */}
      <ConfirmModal {...modalState} />
    </div>
  );
};
