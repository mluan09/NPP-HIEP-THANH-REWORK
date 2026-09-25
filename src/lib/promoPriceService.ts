import { supabase } from './supabase';
import type { InventoryItem } from './db';

export interface Promotion {
  id: string;
  title: string;
  description: string;
  image_url: string;
  badge_text: string;
  badge_color?: 'amber' | 'emerald' | 'rose' | 'blue';
  link_url?: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export interface PriceHistoryRecord {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  price: number;
  previous_price: number;
  change_pct: number;
  effective_date: string;
  note?: string;
  updated_by?: string;
  created_at: string;
}

const PROMO_STORAGE_KEY = 'npp_promotions_v1';
const PRICE_HISTORY_STORAGE_KEY = 'npp_price_history_v1';

// Mẫu dữ liệu ưu đãi ban đầu khi chưa có dữ liệu trong DB/storage
export const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    id: 'promo-1',
    title: 'Chương Trình Tri Ân Khách Hàng — Giảm Đến 10% Cho Đơn Hàng Sỉ',
    description: 'Áp dụng cho toàn bộ các dòng hàng bao bì và màng PE đặt trước ngày 30 hàng tháng. Hỗ trợ vận chuyển tận nơi trong bán kính 20km.',
    image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    badge_text: 'SIÊU ƯU ĐÃI',
    badge_color: 'amber',
    is_active: true,
    order_index: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'promo-2',
    title: 'Flash Deal Tuần Lễ Vàng: Mua 10 Tặng 1 Dành Cho Đại Lý Cấp 1',
    description: 'Chính sách chiết khấu thưởng thêm 2.5% cho tất cả đơn thanh toán chuyển khoản trước 24h. Số lượng quà tặng có hạn.',
    image_url: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80',
    badge_text: 'MUA 10 TẶNG 1',
    badge_color: 'emerald',
    is_active: true,
    order_index: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'promo-3',
    title: 'Bình Ổn Giá Thị Trường — Hỗ Trợ Lưu Kho Linh Hoạt Cho Doanh Nghiệp',
    description: 'Cam kết giữ nguyên đơn giá cho hợp đồng quý, miễn phí lưu kho tạm thời trong 14 ngày khi đặt cọc đơn hàng phân phối.',
    image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80',
    badge_text: 'CAM KẾT BÌNH ỔN',
    badge_color: 'blue',
    is_active: true,
    order_index: 2,
    created_at: new Date().toISOString(),
  },
];

// Lấy danh sách ưu đãi
export function getPromotions(): Promotion[] {
  try {
    const raw = localStorage.getItem(PROMO_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(DEFAULT_PROMOTIONS));
      return DEFAULT_PROMOTIONS;
    }
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : DEFAULT_PROMOTIONS;
  } catch {
    return DEFAULT_PROMOTIONS;
  }
}

// Lưu danh sách ưu đãi
export function savePromotions(promotions: Promotion[]): void {
  try {
    localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(promotions));
  } catch (err) {
    console.error('Failed to save promotions to localStorage', err);
  }
}

// Lấy toàn bộ lịch sử giá
export function getPriceHistory(): PriceHistoryRecord[] {
  try {
    const raw = localStorage.getItem(PRICE_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// Lấy lịch sử giá của 1 sản phẩm cụ thể
export function getProductPriceHistory(productId: string): PriceHistoryRecord[] {
  const all = getPriceHistory();
  return all
    .filter((record) => record.product_id === productId)
    .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());
}

// Thêm một bản ghi điều chỉnh giá và đồng bộ
export async function recordPriceUpdate(params: {
  product: InventoryItem;
  newPrice: number;
  effectiveDate: string;
  note?: string;
  updatedBy?: string;
}): Promise<PriceHistoryRecord> {
  const { product, newPrice, effectiveDate, note, updatedBy } = params;
  const previousPrice = product.selling_price || 0;
  const changePct = previousPrice > 0 ? Number((((newPrice - previousPrice) / previousPrice) * 100).toFixed(2)) : 0;

  const record: PriceHistoryRecord = {
    id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    product_id: product.id,
    product_name: product.product_name,
    sku: product.sku,
    price: newPrice,
    previous_price: previousPrice,
    change_pct: changePct,
    effective_date: effectiveDate || new Date().toISOString().split('T')[0],
    note,
    updated_by: updatedBy,
    created_at: new Date().toISOString(),
  };

  const existing = getPriceHistory();
  const updatedList = [record, ...existing];
  try {
    localStorage.setItem(PRICE_HISTORY_STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.error('Failed to save price history to storage', err);
  }

  // Cập nhật giá bán vào Supabase inventory nếu có kết nối
  try {
    await supabase
      .from('inventory')
      .update({ selling_price: newPrice })
      .eq('id', product.id);
  } catch (err) {
    console.warn('Supabase inventory price sync fallback:', err);
  }

  return record;
}

// Sinh ra dữ liệu biểu đồ sparkline / lịch sử 7 ngày cho hiển thị
export function generatePriceTrend(product: InventoryItem): {
  currentPrice: number;
  previousPrice: number;
  changePct: number;
  historyPoints: { date: string; price: number; changePct: number }[];
} {
  const records = getProductPriceHistory(product.id);

  if (records.length > 0) {
    const latest = records[0];
    const points = records.slice(0, 7).reverse().map((r) => ({
      date: r.effective_date,
      price: r.price,
      changePct: r.change_pct,
    }));

    // Nếu ít hơn 4 điểm thì bổ sung thêm các mốc mô phỏng quá khứ dựa trên previous_price
    if (points.length === 1) {
      const p = latest.previous_price || product.selling_price;
      points.unshift({
        date: 'Trước đó',
        price: p,
        changePct: 0,
      });
    }

    return {
      currentPrice: latest.price,
      previousPrice: latest.previous_price,
      changePct: latest.change_pct,
      historyPoints: points,
    };
  }

  // Trường hợp chưa có bản ghi thủ công: tạo xu hướng 7 ngày mô phỏng ổn định
  const currentPrice = product.selling_price || 0;
  const hash = product.sku.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rawPct = ((hash % 30) - 10) * 0.5; // từ -5% đến +10%
  const changePct = Number(rawPct.toFixed(1));
  const basePrice = Math.max(0, Math.round(currentPrice / (1 + changePct / 100)));

  const now = new Date();
  const points = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    const factor = 1 + (changePct / 100) * ((6 - i) / 6);
    points.push({
      date: dateStr,
      price: Math.round(basePrice * factor),
      changePct: Number(((factor - 1) * 100).toFixed(1)),
    });
  }

  return {
    currentPrice,
    previousPrice: basePrice,
    changePct,
    historyPoints: points,
  };
}
