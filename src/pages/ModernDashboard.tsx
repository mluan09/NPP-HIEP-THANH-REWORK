import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { Profile, InventoryItem, Sale, SaleItem, Customer, Debt } from '../lib/db';
import { formatFullVND } from '../lib/currency';

interface ModernDashboardProps {
  currentUser: Profile;
  inventory: InventoryItem[];
  sales: Sale[];
  saleItems: SaleItem[];
  customers: Customer[];
  debts: Debt[];
  onNavigate: (tab: string) => void;
  isLoading?: boolean;
}

type SortField = 'price' | 'stock' | 'sold' | 'revenue';
type SortOrder = 'asc' | 'desc';

export const ModernDashboard: React.FC<ModernDashboardProps> = ({
  currentUser,
  inventory,
  sales,
  saleItems,
  customers,
  debts,
  onNavigate,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('sold');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Tính toán số liệu kinh doanh
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.sale_date.startsWith(todayStr) && s.status !== 'CANCELLED');
  const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total_revenue || 0), 0);
  const totalDebtAmount = debts.reduce((sum, d) => sum + (d.remaining_debt || 0), 0);

  // Thống kê từng sản phẩm bán chạy
  const productStats = useMemo(() => {
    const map = new Map<string, { soldQty: number; revenue: number }>();
    for (const item of saleItems) {
      const prev = map.get(item.product_id) || { soldQty: 0, revenue: 0 };
      map.set(item.product_id, {
        soldQty: prev.soldQty + (item.quantity || 0),
        revenue: prev.revenue + ((item.quantity || 0) * (item.selling_price || 0)),
      });
    }

    return inventory.map((inv) => {
      const stat = map.get(inv.id) || { soldQty: 0, revenue: 0 };
      const currentStock = (inv.initial_stock || 0) + (inv.import_qty || 0) - (inv.export_qty || 0);
      // Giả lập biến động 7 ngày dựa trên SKU hash
      const hash = inv.sku.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const changePct = ((hash % 40) - 15) * 1.25; // từ -18% đến +30%

      return {
        id: inv.id,
        sku: inv.sku,
        name: inv.product_name,
        unit: inv.unit,
        price: inv.selling_price,
        stock: currentStock,
        soldQty: stat.soldQty,
        revenue: stat.revenue,
        changePct: Number(changePct.toFixed(2)),
        updatedAt: inv.created_at ? new Date(inv.created_at).toLocaleDateString('vi-VN') : 'Mới cập nhật',
      };
    });
  }, [inventory, saleItems]);

  // Sản phẩm nổi bật nhất (Top Performer cho Khối Pepe & Pepita lồng ghép)
  const topProduct = useMemo(() => {
    if (productStats.length === 0) return null;
    return [...productStats].sort((a, b) => b.soldQty - a.soldQty)[0];
  }, [productStats]);

  // Bộ lọc danh mục
  const categories = ['ALL', 'ĐỒ UỐNG', 'THỰC PHẨM', 'GIA VỊ', 'TIÊU DÙNG'];

  const filteredItems = useMemo(() => {
    return productStats.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (activeTab === 'ALL') return true;
      if (activeTab === 'ĐỒ UỐNG') {
        return /nước|bia|coca|pepsi|sting|trà|sữa|redbull/i.test(item.name);
      }
      if (activeTab === 'THỰC PHẨM') {
        return /bánh|kẹo|mì|cháo|gạo|xúc xích|snack/i.test(item.name);
      }
      if (activeTab === 'GIA VỊ') {
        return /dầu|muối|đường|bột ngọt|nước mắm|hạt nêm|tương/i.test(item.name);
      }
      if (activeTab === 'TIÊU DÙNG') {
        return /khăn|giấy|xà phòng|nước giặt|tẩy|dầu gội/i.test(item.name);
      }
      return true;
    });
  }, [productStats, searchTerm, activeTab]);

  // Sắp xếp
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortField === 'price') {
        valA = a.price;
        valB = b.price;
      } else if (sortField === 'stock') {
        valA = a.stock;
        valB = b.stock;
      } else if (sortField === 'sold') {
        valA = a.soldQty;
        valB = b.soldQty;
      } else if (sortField === 'revenue') {
        valA = a.revenue;
        valB = b.revenue;
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredItems, sortField, sortOrder]);

  // Phân trang
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage) || 1;
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* 4.3 Hero Wallet Card (Lồng ghép số liệu NPP Hiệp Thành) */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#121b2d] via-[#0f172a] to-[#090d16] p-6 shadow-2xl shadow-black/60 lg:p-8">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Giao Diện Extej Modern • NPP Hiệp Thành</span>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white lg:text-3xl">
                Xin chào, {currentUser.full_name}!
              </h2>
              <p className="mt-1 text-sm text-muted">
                Tổng quan hiệu suất bán hàng và kiểm soát chuỗi cung ứng trong ngày hôm nay.
              </p>
            </div>

            {/* Các chỉ số tài chính / kinh doanh chính */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-2xl border border-line bg-surface/80 p-3.5 backdrop-blur">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Doanh thu hôm nay
                </div>
                <div className="mt-1 text-base font-extrabold text-amber-400 lg:text-lg tabular-nums">
                  {formatFullVND(todayRevenue)}
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-surface/80 p-3.5 backdrop-blur">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Đơn hàng hôm nay
                </div>
                <div className="mt-1 text-base font-extrabold text-white lg:text-lg tabular-nums">
                  {todaySales.length} đơn
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-2xl border border-line bg-surface/80 p-3.5 backdrop-blur">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Công nợ cần thu
                </div>
                <div className="mt-1 text-base font-extrabold text-rose-400 lg:text-lg tabular-nums">
                  {formatFullVND(totalDebtAmount)}
                </div>
              </div>
            </div>

            {/* Phân cấp CTA: Primary cam đậm & Outline */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('sales')}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Tạo Đơn Hàng Nhanh</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('inventory')}
                className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface/60 px-5 py-2.5 text-sm font-bold text-secondary hover:bg-surface hover:text-white transition-colors cursor-pointer"
              >
                <Package className="h-4 w-4" />
                <span>Kiểm Tra Kho Hàng</span>
              </button>
            </div>
          </div>

          {/* Thumbnail / Visual Asset */}
          <div className="hidden lg:flex flex-col items-center justify-center p-4">
            <div className="relative flex items-center justify-center rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 to-transparent p-6 shadow-inner">
              <img
                src="/src/assets/hero.png"
                alt="Extej Illustration"
                className="h-44 w-auto object-contain drop-shadow-[0_10px_20px_rgba(245,158,11,0.25)]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4.4 Khối Thống Kê Nhanh (Lồng ghép Khối Pepe & Pepita) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Mặt hàng bán chạy nhất */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-400">
              <TrendingUp className="h-3 w-3" /> TOP BÁN CHẠY
            </span>
            {topProduct && (
              <span
                className={`flex items-center gap-0.5 text-xs font-bold ${
                  topProduct.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {topProduct.changePct >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {topProduct.changePct > 0 ? `+${topProduct.changePct}%` : `${topProduct.changePct}%`}
              </span>
            )}
          </div>

          <div className="mt-3">
            <h3 className="truncate text-base font-bold text-white">
              {topProduct ? topProduct.name : 'Chưa có dữ liệu bán'}
            </h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-amber-400 tabular-nums">
                {topProduct ? formatFullVND(topProduct.price) : '0 đ'}
              </span>
              <span className="text-xs text-muted">/ {topProduct?.unit || 'đơn vị'}</span>
            </div>
          </div>

          {/* Sparkline mini SVG */}
          <div className="mt-3 h-10 w-full">
            <svg className="h-full w-full overflow-visible" viewBox="0 0 100 30">
              <defs>
                <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 25 Q 20 10, 40 18 T 80 5 T 100 2"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 0 25 Q 20 10, 40 18 T 80 5 T 100 2 L 100 30 L 0 30 Z"
                fill="url(#sparkGradient)"
              />
            </svg>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <div className="text-xs font-bold text-muted">
              ĐÃ BÁN:{' '}
              <span className="text-white font-extrabold">
                {topProduct?.soldQty || 0} {topProduct?.unit}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <span>Xem kho</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Cảnh báo tồn kho */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-400">
              <AlertTriangle className="h-3 w-3" /> CẢNH BÁO TỒN KHO
            </span>
            <span className="text-xs font-bold text-muted">Kho NPP</span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white">
              {inventory.filter((i) => (i.initial_stock + i.import_qty - i.export_qty) <= 10).length}
            </div>
            <p className="mt-1 text-xs text-muted">Mặt hàng có tồn kho dưới 10 đơn vị cần nhập bổ sung.</p>
          </div>

          <div className="mt-4 border-t border-line pt-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300">Cần xử lý sớm</span>
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
            >
              Nhập kho ngay
            </button>
          </div>
        </div>

        {/* Card 3: Danh mục hoạt động */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-400">
              <Layers className="h-3 w-3" /> TỔNG DANH MỤC
            </span>
            <span className="text-xs font-bold text-muted">Đang quản lý</span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white">
              {inventory.length}
            </div>
            <p className="mt-1 text-xs text-muted">Mặt hàng đang được lưu trữ và giao dịch trong hệ thống.</p>
          </div>

          <div className="mt-4 border-t border-line pt-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary">Khách hàng: {customers.length}</span>
            <button
              type="button"
              onClick={() => onNavigate('customers')}
              className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
            >
              Xem khách hàng
            </button>
          </div>
        </div>
      </div>

      {/* 4.5 Top Tokens -> Lồng ghép thành: Bảng Top Mặt Hàng & Doanh Số */}
      <div className="rounded-3xl border border-line bg-surface p-5 shadow-sm lg:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-white">
              Top Mặt Hàng & Doanh Số
            </h3>
            <p className="text-xs text-muted">
              Bảng theo dõi giá cả, tồn kho và biến động doanh số các sản phẩm chủ lực.
            </p>
          </div>

          {/* Ô tìm kiếm gọn gàng */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <input
              type="text"
              placeholder="Lọc theo tên hoặc mã SKU..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-line-strong bg-input py-1.5 pl-9 pr-3 text-xs text-foreground placeholder-muted focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Tabs Pill active cam */}
        <div className="mt-4 flex flex-wrap gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveTab(cat);
                setCurrentPage(1);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === cat
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : 'bg-surface-alt text-secondary hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Table responsive cuộn ngang */}
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-surface-alt/60 text-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-bold">Mặt Hàng</th>
                <th
                  onClick={() => handleSort('price')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Đơn Giá</span>
                    {sortField === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th className="py-3 px-4 font-bold">Biến Động</th>
                <th
                  onClick={() => handleSort('stock')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Tồn Kho</span>
                    {sortField === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('sold')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Đã Bán</span>
                    {sortField === 'sold' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('revenue')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Doanh Thu</span>
                    {sortField === 'revenue' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                {/* Tách riêng cột Ngày cập nhật theo mục 4.5 của UPDATE.md */}
                <th className="py-3 px-4 font-bold">Cập Nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                // Skeleton loading state
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-36 rounded bg-surface-alt" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 rounded bg-surface-alt" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-14 rounded bg-surface-alt" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 rounded bg-surface-alt" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 rounded bg-surface-alt" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 rounded bg-surface-alt" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 rounded bg-surface-alt" /></td>
                  </tr>
                ))
              ) : paginatedItems.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    Không tìm thấy sản phẩm nào phù hợp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-alt/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="text-[10px] text-muted font-mono">{item.sku}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white tabular-nums">
                      {formatFullVND(item.price)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-bold ${
                          item.changePct >= 0
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {item.changePct >= 0 ? '+' : ''}{item.changePct}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white tabular-nums">
                      {item.stock} <span className="text-[10px] text-muted font-normal">{item.unit}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white tabular-nums">
                      {item.soldQty} <span className="text-[10px] text-muted font-normal">{item.unit}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white tabular-nums">
                      {formatFullVND(item.revenue)}
                    </td>
                    <td className="py-3.5 px-4 text-muted text-[11px]">
                      {item.updatedAt}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted">
          <div>
            Trang <span className="font-bold text-white">{currentPage}</span> / {totalPages} (Tổng {sortedItems.length} mặt hàng)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface-alt text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-alt/80 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface-alt text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-alt/80 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
