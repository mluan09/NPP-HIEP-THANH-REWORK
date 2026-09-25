import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Users,
  Tag,
  DollarSign,
  Plus,
  Trash2,
  Upload,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  Save,
  Pencil,
  X,
} from 'lucide-react';
import type { Profile, InventoryItem } from '../lib/db';
import { logActivity } from '../lib/activityLog';
import { useModal } from '../hooks/useModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { formatFullVND } from '../lib/currency';
import { AccountsPage } from './AccountsPage';
import {
  getPromotions,
  savePromotions,
  getPriceHistory,
  recordPriceUpdate,
  type Promotion,
  type PriceHistoryRecord,
} from '../lib/promoPriceService';

interface AdminPageProps {
  currentUser: Profile;
  profiles: Profile[];
  onProfilesChange: (profiles: Profile[]) => void;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

type AdminSubTab = 'accounts' | 'promotions' | 'pricing';

export const AdminPage: React.FC<AdminPageProps> = ({
  currentUser,
  profiles,
  onProfilesChange,
  inventory,
  setInventory,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('accounts');
  const { showToast } = useToast();
  const { modalState, showConfirm } = useModal();

  // -------------------------------------------------------------
  // TAB 2: PROMOTIONS LOGIC (Upload banner & quản lý)
  // -------------------------------------------------------------
  const [promotions, setPromotionsState] = useState<Promotion[]>(() => getPromotions());
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [isAddingPromo, setIsAddingPromo] = useState(false);
  const [promoForm, setPromoForm] = useState<{
    title: string;
    description: string;
    badge_text: string;
    badge_color: 'amber' | 'emerald' | 'rose' | 'blue';
    image_url: string;
    is_active: boolean;
  }>({
    title: '',
    description: '',
    badge_text: 'HOT DEAL',
    badge_color: 'amber',
    image_url: '',
    is_active: true,
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast('Kích thước ảnh tối đa 3MB', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPromoForm((prev) => ({ ...prev, image_url: result }));
      showToast('Đã tải ảnh lên thành công', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.title.trim()) {
      showToast('Vui lòng nhập tiêu đề ưu đãi', 'warning');
      return;
    }
    if (!promoForm.image_url) {
      showToast('Vui lòng tải ảnh banner hoặc dán link ảnh', 'warning');
      return;
    }

    if (editingPromo) {
      const updated = promotions.map((p) =>
        p.id === editingPromo.id
          ? {
              ...p,
              title: promoForm.title.trim(),
              description: promoForm.description.trim(),
              badge_text: promoForm.badge_text.trim(),
              badge_color: promoForm.badge_color,
              image_url: promoForm.image_url,
              is_active: promoForm.is_active,
            }
          : p
      );
      setPromotionsState(updated);
      savePromotions(updated);
      showToast('Đã cập nhật ưu đãi thành công', 'success');
      setEditingPromo(null);
    } else {
      const newPromo: Promotion = {
        id: `promo-${Date.now()}`,
        title: promoForm.title.trim(),
        description: promoForm.description.trim(),
        badge_text: promoForm.badge_text.trim() || 'ƯU ĐÃI',
        badge_color: promoForm.badge_color,
        image_url: promoForm.image_url,
        is_active: promoForm.is_active,
        order_index: promotions.length,
        created_at: new Date().toISOString(),
      };
      const updated = [newPromo, ...promotions];
      setPromotionsState(updated);
      savePromotions(updated);
      showToast('Đã thêm ưu đãi mới thành công', 'success');
      setIsAddingPromo(false);
    }

    setPromoForm({
      title: '',
      description: '',
      badge_text: 'HOT DEAL',
      badge_color: 'amber',
      image_url: '',
      is_active: true,
    });
  };

  const handleDeletePromo = (id: string, title: string) => {
    showConfirm(
      'Xóa ưu đãi',
      `Bạn có chắc chắn muốn xóa ưu đãi "${title}" không?`,
      () => {
        const updated = promotions.filter((p) => p.id !== id);
        setPromotionsState(updated);
        savePromotions(updated);
        showToast('Đã xóa ưu đãi', 'success');
      },
      { type: 'danger', confirmText: 'Xóa ngay' }
    );
  };

  const handleToggleActivePromo = (id: string) => {
    const updated = promotions.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p));
    setPromotionsState(updated);
    savePromotions(updated);
    showToast('Đã thay đổi trạng thái hiển thị ưu đãi', 'success');
  };

  // -------------------------------------------------------------
  // TAB 3: PRICING MANAGEMENT (Điều chỉnh giá bán theo ngày)
  // -------------------------------------------------------------
  const [selectedProductId, setSelectedProductId] = useState<string>(inventory[0]?.id || '');
  const [newSellingPrice, setNewSellingPrice] = useState<number>(0);
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [priceNote, setPriceNote] = useState<string>('');
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceHistoryList, setPriceHistoryList] = useState<PriceHistoryRecord[]>(() => getPriceHistory());

  const selectedProduct = useMemo(() => {
    return inventory.find((p) => p.id === selectedProductId) || inventory[0] || null;
  }, [inventory, selectedProductId]);

  const priceDiffPct = useMemo(() => {
    if (!selectedProduct || !selectedProduct.selling_price || newSellingPrice <= 0) return 0;
    return Number((((newSellingPrice - selectedProduct.selling_price) / selectedProduct.selling_price) * 100).toFixed(2));
  }, [selectedProduct, newSellingPrice]);

  const handleApplyPriceChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (newSellingPrice <= 0) {
      showToast('Giá bán mới phải lớn hơn 0', 'warning');
      return;
    }

    setSavingPrice(true);
    try {
      const record = await recordPriceUpdate({
        product: selectedProduct,
        newPrice: newSellingPrice,
        effectiveDate,
        note: priceNote.trim(),
        updatedBy: currentUser.full_name,
      });

      // Cập nhật lại state inventory cục bộ để UI đồng bộ tức thì
      setInventory((prev) =>
        prev.map((item) =>
          item.id === selectedProduct.id ? { ...item, selling_price: newSellingPrice } : item
        )
      );

      setPriceHistoryList((prev) => [record, ...prev]);
      logActivity(
        currentUser,
        'CẬP NHẬT GIÁ BÁN',
        'inventory',
        `${selectedProduct.product_name} (${selectedProduct.sku}): ${formatFullVND(selectedProduct.selling_price)} -> ${formatFullVND(newSellingPrice)} (${record.change_pct >= 0 ? '+' : ''}${record.change_pct}%)`
      );

      showToast(`Đã cập nhật giá bán thành công cho ${selectedProduct.product_name}!`, 'success');
      setPriceNote('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi cập nhật giá';
      showToast(msg, 'warning');
    } finally {
      setSavingPrice(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header khu vực ADMIN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl border border-line bg-surface shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">TRUNG TÂM QUẢN TRỊ ADMIN</h1>
            <p className="text-xs text-muted">
              Quản lý tài khoản, điều chỉnh ưu đãi & kiểm soát giá bán hàng ngày của NPP Hiệp Thành
            </p>
          </div>
        </div>

        {/* Thanh chuyển đổi 3 Sub-tabs */}
        <div className="inline-flex p-1 rounded-xl bg-surface-alt border border-line">
          <button
            type="button"
            onClick={() => setActiveSubTab('accounts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'accounts'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tài Khoản</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('promotions')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'promotions'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Ưu Đãi & Banner</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('pricing');
              if (selectedProduct) setNewSellingPrice(selectedProduct.selling_price);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'pricing'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Quản Lý Giá Bán</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: QUẢN LÝ TÀI KHOẢN                               */}
      {/* ========================================================= */}
      {activeSubTab === 'accounts' && (
        <AccountsPage
          currentUser={currentUser}
          profiles={profiles}
          onProfilesChange={onProfilesChange}
        />
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: QUẢN LÝ ƯU ĐÃI & BANNER                         */}
      {/* ========================================================= */}
      {activeSubTab === 'promotions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Banner Khuyến Mãi & Ưu Đãi</h2>
              <p className="text-xs text-muted">
                Các ưu đãi đang bật sẽ tự động chạy toàn khung ở Dashboard (tự động chuyển ảnh mỗi 15 giây)
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingPromo(null);
                setPromoForm({
                  title: '',
                  description: '',
                  badge_text: 'HOT DEAL',
                  badge_color: 'amber',
                  image_url: '',
                  is_active: true,
                });
                setIsAddingPromo(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Ưu Đãi Mới</span>
            </button>
          </div>

          {/* Form thêm / sửa ưu đãi */}
          <AnimatePresence>
            {(isAddingPromo || editingPromo) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-6 rounded-2xl border border-amber-500/30 bg-surface shadow-lg space-y-4"
              >
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-500" />
                    <span>{editingPromo ? 'Chỉnh sửa ưu đãi' : 'Tạo mới ưu đãi'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingPromo(false);
                      setEditingPromo(null);
                    }}
                    className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-alt cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSavePromo} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                        Tiêu đề chương trình ưu đãi
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Tri ân khách hàng - Giảm 10% đơn sỉ"
                        value={promoForm.title}
                        onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                        className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-foreground focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                          Nhãn Badge
                        </label>
                        <input
                          type="text"
                          placeholder="VD: SIÊU ƯU ĐÃI"
                          value={promoForm.badge_text}
                          onChange={(e) => setPromoForm({ ...promoForm, badge_text: e.target.value })}
                          className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-foreground focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                          Màu sắc nhãn
                        </label>
                        <select
                          value={promoForm.badge_color}
                          onChange={(e) =>
                            setPromoForm({
                              ...promoForm,
                              badge_color: e.target.value as 'amber' | 'emerald' | 'rose' | 'blue',
                            })
                          }
                          className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-foreground focus:border-amber-500 focus:outline-none"
                        >
                          <option value="amber">Cam Hổ Phách</option>
                          <option value="emerald">Xanh Lục Deal</option>
                          <option value="rose">Đỏ Flash Sale</option>
                          <option value="blue">Xanh Dương</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                      Mô tả chi tiết thể lệ
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Mô tả quyền lợi và điều kiện áp dụng..."
                      value={promoForm.description}
                      onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                      className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-foreground focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Upload hình ảnh banner */}
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                      Hình ảnh Banner Toàn Khung (Upload từ máy tính hoặc dán link)
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <label className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500 text-xs font-bold cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>Chọn ảnh tải lên từ máy tính</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      <span className="text-xs text-muted">Hoặc</span>
                      <input
                        type="url"
                        placeholder="Dán link ảnh (https://...)"
                        value={promoForm.image_url}
                        onChange={(e) => setPromoForm({ ...promoForm, image_url: e.target.value })}
                        className="flex-1 w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-foreground focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    {promoForm.image_url && (
                      <div className="mt-3 relative h-36 rounded-xl overflow-hidden border border-line">
                        <img src={promoForm.image_url} alt="Banner Preview" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white font-semibold">
                          Xem trước banner
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
                      <input
                        type="checkbox"
                        checked={promoForm.is_active}
                        onChange={(e) => setPromoForm({ ...promoForm, is_active: e.target.checked })}
                        className="rounded text-amber-500 focus:ring-amber-500"
                      />
                      <span>Bật hiển thị ngay trên Dashboard</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingPromo(false);
                          setEditingPromo(null);
                        }}
                        className="px-4 py-2 rounded-xl border border-line text-xs font-bold text-muted hover:text-foreground cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Lưu Banner Ưu Đãi</span>
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Danh sách các ưu đãi hiện có */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm flex flex-col"
              >
                <div className="relative h-44 w-full bg-slate-900">
                  <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <span
                    className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-white ${
                      promo.badge_color === 'emerald'
                        ? 'bg-emerald-600'
                        : promo.badge_color === 'rose'
                        ? 'bg-rose-600'
                        : promo.badge_color === 'blue'
                        ? 'bg-blue-600'
                        : 'bg-amber-600'
                    }`}
                  >
                    {promo.badge_text}
                  </span>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-bold text-sm line-clamp-1">{promo.title}</h3>
                    <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">{promo.description}</p>
                  </div>
                </div>

                <div className="p-3 bg-surface border-t border-line flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleActivePromo(promo.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                      promo.is_active
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                        : 'bg-slate-500/10 text-muted border border-line'
                    }`}
                  >
                    {promo.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{promo.is_active ? 'Đang hiển thị' : 'Đang ẩn'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPromo(promo);
                        setPromoForm({
                          title: promo.title,
                          description: promo.description,
                          badge_text: promo.badge_text,
                          badge_color: promo.badge_color || 'amber',
                          image_url: promo.image_url,
                          is_active: promo.is_active,
                        });
                        setIsAddingPromo(false);
                      }}
                      className="p-1.5 rounded-lg border border-line text-muted hover:text-foreground hover:bg-surface-alt transition-colors cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePromo(promo.id, promo.title)}
                      className="p-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Xóa ưu đãi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: QUẢN LÝ GIÁ BÁN HÀNG NGÀY                       */}
      {/* ========================================================= */}
      {activeSubTab === 'pricing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cột trái: Form điều chỉnh giá theo ngày */}
            <div className="lg:col-span-1 p-6 rounded-2xl border border-line bg-surface shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-line">
                <DollarSign className="w-5 h-5 text-amber-500" />
                <div>
                  <h2 className="text-sm font-bold text-foreground">Điều Chỉnh Giá Bán</h2>
                  <p className="text-[11px] text-muted">Tự động đồng bộ vào kho & bảng giá dashboard</p>
                </div>
              </div>

              <form onSubmit={handleApplyPriceChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                    Chọn sản phẩm cần chỉnh giá
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedProductId(id);
                      const p = inventory.find((item) => item.id === id);
                      if (p) setNewSellingPrice(p.selling_price);
                    }}
                    className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-foreground focus:border-amber-500 focus:outline-none"
                  >
                    {inventory.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.product_name} ({item.sku}) — {formatFullVND(item.selling_price)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProduct && (
                  <div className="p-3 rounded-xl bg-surface-alt border border-line text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted">Giá bán hiện tại:</span>
                      <span className="font-bold text-foreground tabular-nums">
                        {formatFullVND(selectedProduct.selling_price)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Đơn vị tính:</span>
                      <span className="font-semibold text-foreground">{selectedProduct.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Giá vốn tham khảo:</span>
                      <span className="font-mono text-muted tabular-nums">
                        {formatFullVND(selectedProduct.cost_price)}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                    Ngày áp dụng giá mới
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-foreground focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                    Giá bán mới (VND)
                  </label>
                  <input
                    type="number"
                    step="500"
                    placeholder="Nhập giá mới..."
                    value={newSellingPrice || ''}
                    onChange={(e) => setNewSellingPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-base font-extrabold text-amber-500 focus:border-amber-500 focus:outline-none"
                  />

                  {priceDiffPct !== 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-bold">
                      <span className="text-muted">Biến động:</span>
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
                          priceDiffPct > 0
                            ? 'bg-emerald-500/15 text-emerald-600'
                            : 'bg-rose-500/15 text-rose-600'
                        }`}
                      >
                        {priceDiffPct > 0 ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        {priceDiffPct > 0 ? '+' : ''}{priceDiffPct}%
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                    Ghi chú / Lý do điều chỉnh
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Điều chỉnh theo giá nguyên liệu..."
                    value={priceNote}
                    onChange={(e) => setPriceNote(e.target.value)}
                    className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-foreground focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingPrice || !selectedProduct}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingPrice ? 'Đang lưu...' : 'Lưu & Cập Nhật Giá Bán'}</span>
                </button>
              </form>
            </div>

            {/* Cột phải: Bảng lịch sử điều chỉnh giá gần đây */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-line bg-surface shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Nhật Ký Biến Động Giá Bán</h2>
                  <p className="text-[11px] text-muted">Lịch sử các lần thay đổi giá theo ngày</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-md bg-surface-alt border border-line text-muted">
                  {priceHistoryList.length} bản ghi
                </span>
              </div>

              {priceHistoryList.length === 0 ? (
                <div className="py-12 text-center text-muted text-xs">
                  Chưa có lịch sử điều chỉnh giá thủ công nào. Hãy chọn sản phẩm ở cột bên trái để cập nhật.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-alt border-b border-line text-muted uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Ngày Áp Dụng</th>
                        <th className="py-2.5 px-3">Sản Phẩm</th>
                        <th className="py-2.5 px-3">Giá Cũ</th>
                        <th className="py-2.5 px-3">Giá Mới</th>
                        <th className="py-2.5 px-3">Biến Động</th>
                        <th className="py-2.5 px-3">Người Đổi</th>
                        <th className="py-2.5 px-3">Ghi Chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {priceHistoryList.map((record) => (
                        <tr key={record.id} className="hover:bg-surface-alt/40 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-foreground whitespace-nowrap">
                            {record.effective_date}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-foreground">{record.product_name}</div>
                            <div className="text-[10px] text-muted font-mono">{record.sku}</div>
                          </td>
                          <td className="py-2.5 px-3 text-muted tabular-nums">
                            {formatFullVND(record.previous_price)}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-foreground tabular-nums">
                            {formatFullVND(record.price)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                                record.change_pct >= 0
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-rose-500/10 text-rose-600'
                              }`}
                            >
                              {record.change_pct >= 0 ? '+' : ''}{record.change_pct}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-muted whitespace-nowrap">
                            {record.updated_by || 'Admin'}
                          </td>
                          <td className="py-2.5 px-3 text-muted italic max-w-xs truncate">
                            {record.note || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal {...modalState} />
    </div>
  );
};
