import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Search,
  LineChart,
  Calendar,
  Clock,
  X,
} from 'lucide-react';
import type { Profile, InventoryItem, Sale, SaleItem, Customer, Debt } from '../lib/db';
import { formatFullVND } from '../lib/currency';
import {
  getPromotions,
  generatePriceTrend,
  getProductPriceHistory,
  type Promotion,
} from '../lib/promoPriceService';

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

export const ModernDashboard: React.FC<ModernDashboardProps> = ({
  currentUser: _currentUser,
  inventory,
  sales: _sales,
  saleItems: _saleItems,
  customers: _customers,
  debts: _debts,
  onNavigate: _onNavigate,
  isLoading = false,
}) => {
  // -------------------------------------------------------------
  // 1. PROMOTION BANNER CAROUSEL (Toàn khung - Tự chuyển mỗi 15s)
  // -------------------------------------------------------------
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  useEffect(() => {
    const list = getPromotions().filter((p) => p.is_active);
    setPromotions(list);
  }, []);

  // Tự động chuyển banner mỗi 15 giây (15000ms)
  useEffect(() => {
    if (promotions.length <= 1 || isCarouselPaused) return;

    const timer = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promotions.length);
    }, 15000);

    return () => clearInterval(timer);
  }, [promotions.length, isCarouselPaused]);

  const activePromo = promotions[currentPromoIndex] || null;

  // -------------------------------------------------------------
  // 2. PRODUCT DATA & PRICE TRENDS
  // -------------------------------------------------------------
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<InventoryItem | null>(null);

  // Tính toán số liệu sản phẩm kết hợp xu hướng giá
  const productCards = useMemo(() => {
    return inventory.map((inv) => {
      const currentStock = (inv.initial_stock || 0) + (inv.import_qty || 0) - (inv.export_qty || 0);
      const trend = generatePriceTrend(inv);

      return {
        item: inv,
        stock: currentStock,
        trend,
      };
    });
  }, [inventory]);

  const categories = ['ALL', 'ĐỒ UỐNG', 'THỰC PHẨM', 'GIA VỊ', 'TIÊU DÙNG'];

  const filteredProducts = useMemo(() => {
    return productCards.filter(({ item }) => {
      const matchesSearch =
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (activeCategory === 'ALL') return true;
      if (activeCategory === 'ĐỒ UỐNG') {
        return /nước|bia|coca|pepsi|sting|trà|sữa|redbull/i.test(item.product_name);
      }
      if (activeCategory === 'THỰC PHẨM') {
        return /bánh|kẹo|mì|cháo|gạo|xúc xích|snack/i.test(item.product_name);
      }
      if (activeCategory === 'GIA VỊ') {
        return /dầu|muối|đường|bột ngọt|nước mắm|hạt nêm|tương/i.test(item.product_name);
      }
      if (activeCategory === 'TIÊU DÙNG') {
        return /khăn|giấy|xà phòng|nước giặt|tẩy|dầu gội/i.test(item.product_name);
      }
      return true;
    });
  }, [productCards, searchTerm, activeCategory]);

  // Lịch sử chi tiết của sản phẩm đang mở modal
  const selectedProductHistory = useMemo(() => {
    if (!selectedProductForHistory) return [];
    return getProductPriceHistory(selectedProductForHistory.id);
  }, [selectedProductForHistory]);

  const selectedProductTrend = useMemo(() => {
    if (!selectedProductForHistory) return null;
    return generatePriceTrend(selectedProductForHistory);
  }, [selectedProductForHistory]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ========================================================= */}
      {/* 1. HERO PROMOTION BANNER (TOÀN KHUNG - 15 GIÂY AUTO)     */}
      {/* ========================================================= */}
      {activePromo && (
        <div
          onMouseEnter={() => setIsCarouselPaused(true)}
          onMouseLeave={() => setIsCarouselPaused(false)}
          className="relative w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md transition-all group"
        >
          <div className="relative h-64 sm:h-72 md:h-80 w-full overflow-hidden">
            {/* Hình ảnh banner toàn khung */}
            <motion.img
              key={activePromo.id}
              initial={{ scale: 1.05, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              src={activePromo.image_url}
              alt={activePromo.title}
              className="w-full h-full object-cover"
            />

            {/* Gradient Overlay để text sáng rõ nét */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-transparent" />

            {/* Nội dung Banner */}
            <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end text-white max-w-3xl">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-sm ${
                    activePromo.badge_color === 'emerald'
                      ? 'bg-emerald-600 text-white'
                      : activePromo.badge_color === 'rose'
                      ? 'bg-rose-600 text-white'
                      : activePromo.badge_color === 'blue'
                      ? 'bg-blue-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  {activePromo.badge_text}
                </span>

                <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Tự chuyển mỗi 15s</span>
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight drop-shadow-sm">
                {activePromo.title}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-200 line-clamp-2 max-w-2xl font-medium">
                {activePromo.description}
              </p>
            </div>

            {/* Nút chuyển slide thủ công (Trái / Phải) */}
            {promotions.length > 1 && (
              <div className="absolute inset-y-0 inset-x-4 flex items-center justify-between pointer-events-none">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPromoIndex((prev) => (prev - 1 + promotions.length) % promotions.length)
                  }
                  className="pointer-events-auto h-10 w-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPromoIndex((prev) => (prev + 1) % promotions.length)
                  }
                  className="pointer-events-auto h-10 w-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}

            {/* Chấm tròn chỉ số slide (Indicators) */}
            {promotions.length > 1 && (
              <div className="absolute bottom-4 right-6 flex items-center gap-1.5 z-10">
                {promotions.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentPromoIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === currentPromoIndex ? 'w-6 bg-amber-500' : 'w-2 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. THANH TICKER BIẾN ĐỘNG GIÁ THỜI GIAN THỰC               */}
      {/* ========================================================= */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="flex items-center gap-1.5 font-extrabold text-amber-600 uppercase tracking-wider shrink-0">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          <span>Biến Động Giá:</span>
        </div>
        <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
          {productCards.slice(0, 8).map(({ item, trend }) => (
            <div
              key={item.id}
              onClick={() => setSelectedProductForHistory(item)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 hover:border-amber-400/50 cursor-pointer transition-colors"
            >
              <span className="font-bold text-slate-800">{item.product_name}</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {formatFullVND(item.selling_price)}
              </span>
              <span
                className={`inline-flex items-center text-[10px] font-bold ${
                  trend.changePct >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {trend.changePct >= 0 ? '▲ +' : '▼ '}{trend.changePct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. BỘ LỌC DANH MỤC & TÌM KIẾM SẢN PHẨM                   */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Pills category */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. GRID CARDS SẢN PHẨM (PHƯƠNG ÁN 1 - THEO DÕI GIÁ)       */}
      {/* ========================================================= */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-white border border-slate-200 p-4 animate-pulse space-y-3">
              <div className="h-4 w-2/3 bg-slate-200 rounded" />
              <div className="h-3 w-1/3 bg-slate-200 rounded" />
              <div className="h-16 w-full bg-slate-100 rounded-xl" />
              <div className="h-8 w-full bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 text-sm shadow-sm">
          Không tìm thấy mặt hàng nào phù hợp với bộ lọc tìm kiếm.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(({ item, stock, trend }) => {
            const isRising = trend.changePct >= 0;
            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedProductForHistory(item)}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-amber-500/40 transition-all cursor-pointer"
              >
                <div>
                  {/* Header card: Tên & SKU */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1">
                        {item.product_name}
                      </h3>
                      <div className="text-[11px] font-mono text-slate-500">{item.sku}</div>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700">
                      {item.unit}
                    </span>
                  </div>

                  {/* Giá bán & Biến động % */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Đơn Giá Hiện Tại
                      </div>
                      <div className="text-lg font-black text-slate-900 tabular-nums">
                        {formatFullVND(item.selling_price)}
                      </div>
                    </div>

                    <div
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-extrabold ${
                        isRising
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {isRising ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>{isRising ? '+' : ''}{trend.changePct}%</span>
                    </div>
                  </div>

                  {/* Biểu đồ Mini Sparkline đường sóng */}
                  <div className="mt-4 h-12 w-full flex items-end gap-1 px-1 py-1 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                    {trend.historyPoints.map((point, idx) => {
                      const min = Math.min(...trend.historyPoints.map((p) => p.price));
                      const max = Math.max(...trend.historyPoints.map((p) => p.price));
                      const range = max - min || 1;
                      const heightPct = Math.max(20, Math.min(100, Math.round(((point.price - min) / range) * 80 + 20)));

                      return (
                        <div
                          key={idx}
                          title={`${point.date}: ${formatFullVND(point.price)}`}
                          className="flex-1 flex flex-col justify-end items-center h-full group/bar relative"
                        >
                          <div
                            style={{ height: `${heightPct}%` }}
                            className={`w-full rounded-t-sm transition-all ${
                              isRising
                                ? 'bg-emerald-500 group-hover/bar:bg-emerald-600'
                                : 'bg-rose-500 group-hover/bar:bg-rose-600'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Thông tin tồn kho */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-medium">
                      <Package className="w-3.5 h-3.5 text-slate-500" />
                      Tồn kho:
                    </span>
                    <span className="font-extrabold text-slate-900 tabular-nums">
                      {stock} {item.unit}
                    </span>
                  </div>
                </div>

                {/* Nút hành động: "Theo dõi giá" (thay thế nút "Thêm order" theo yêu cầu) */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProductForHistory(item);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                  >
                    <LineChart className="w-4 h-4 text-amber-700" />
                    <span>Theo Dõi Giá Chi Tiết</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL XEM CHI TIẾT LỊCH SỬ GIÁ NHIỀU NGÀY TRƯỚC ĐÓ     */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedProductForHistory && selectedProductTrend && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProductForHistory(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header Modal */}
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50 flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded-full mb-1">
                    <LineChart className="w-3.5 h-3.5" />
                    <span>Lịch Sử Biến Động Giá Bán</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {selectedProductForHistory.product_name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Mã SKU: {selectedProductForHistory.sku} • Đơn vị: {selectedProductForHistory.unit}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProductForHistory(null)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/80 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body Modal */}
              <div className="p-6 space-y-6 overflow-y-auto">
                {/* Khối thống kê giá nhanh */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Giá Hiện Tại
                    </div>
                    <div className="text-lg font-black text-amber-700 mt-0.5 tabular-nums">
                      {formatFullVND(selectedProductForHistory.selling_price)}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Biến Động Gần Nhất
                    </div>
                    <div
                      className={`text-lg font-black mt-0.5 tabular-nums ${
                        selectedProductTrend.changePct >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {selectedProductTrend.changePct >= 0 ? '+' : ''}{selectedProductTrend.changePct}%
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Tồn Kho Hiện Hữu
                    </div>
                    <div className="text-lg font-black text-slate-900 mt-0.5 tabular-nums">
                      {(selectedProductForHistory.initial_stock || 0) +
                        (selectedProductForHistory.import_qty || 0) -
                        (selectedProductForHistory.export_qty || 0)}{' '}
                      <span className="text-xs font-normal text-slate-500">{selectedProductForHistory.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Biểu đồ xu hướng các ngày trước đó */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>Xu hướng giá các ngày trước đó</span>
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-end justify-between gap-2 h-28 pt-4 pb-2">
                      {selectedProductTrend.historyPoints.map((pt, i) => {
                        const min = Math.min(...selectedProductTrend.historyPoints.map((p) => p.price));
                        const max = Math.max(...selectedProductTrend.historyPoints.map((p) => p.price));
                        const range = max - min || 1;
                        const barHeight = Math.max(25, Math.min(100, Math.round(((pt.price - min) / range) * 75 + 25)));

                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                            <span className="text-[10px] font-extrabold text-slate-700 tabular-nums">
                              {formatFullVND(pt.price)}
                            </span>
                            <div
                              style={{ height: `${barHeight}%` }}
                              className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-amber-500 to-amber-400 shadow-sm"
                            />
                            <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">
                              {pt.date}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bảng lịch sử ghi nhận thay đổi giá chi tiết */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Bảng Nhật Ký Thay Đổi Giá Chi Tiết
                  </h4>

                  {selectedProductHistory.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                      Chưa có lịch sử điều chỉnh giá thủ công trong hệ thống. Giá hiện tại đang áp dụng theo bảng giá cơ sở ban đầu.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Ngày Áp Dụng</th>
                            <th className="py-2.5 px-3">Giá Cũ</th>
                            <th className="py-2.5 px-3">Giá Mới</th>
                            <th className="py-2.5 px-3">Biến Động</th>
                            <th className="py-2.5 px-3">Người Đổi</th>
                            <th className="py-2.5 px-3">Ghi Chú</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedProductHistory.map((rec) => (
                            <tr key={rec.id} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                                {rec.effective_date}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 tabular-nums">
                                {formatFullVND(rec.previous_price)}
                              </td>
                              <td className="py-2.5 px-3 font-extrabold text-slate-900 tabular-nums">
                                {formatFullVND(rec.price)}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                                    rec.change_pct >= 0
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-rose-50 text-rose-700'
                                  }`}
                                >
                                  {rec.change_pct >= 0 ? '+' : ''}{rec.change_pct}%
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                {rec.updated_by || 'Admin'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 italic">
                                {rec.note || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Modal */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedProductForHistory(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
