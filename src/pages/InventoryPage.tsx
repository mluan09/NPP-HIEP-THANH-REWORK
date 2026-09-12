import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Search,
  Plus,
  Edit3,
  Trash2,
  Upload,
  AlertTriangle,
  FileSpreadsheet,
  X,
  RefreshCw
} from 'lucide-react';
import type { InventoryItem, Profile } from '../lib/db';
import { upsertInventory, deleteInventoryItem } from '../lib/db';
import { formatCurrencyInput, parseCurrencyInput } from '../lib/currency';
import { logActivity } from '../lib/activityLog';
import { useModal } from '../hooks/useModal';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { ResponsiveSearchSheet } from '../components/ResponsiveSearchSheet';

interface InventoryPageProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  currentUser: Profile;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ 
  inventory, 
  setInventory, 
  currentUser 
}) => {
  const { modalState, showAlert, showConfirm } = useModal();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'low' | 'out'>('all');
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Form fields
  const [sku, setSku] = useState('');
  const [productName, setProductName] = useState('');
  const [unit, setUnit] = useState('Thùng');
  const [unitMenuOpen, setUnitMenuOpen] = useState(false);
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [initialStock, setInitialStock] = useState(0);
  const [importQty, setImportQty] = useState(0);
  const [exportQty, setExportQty] = useState(0);

  // Import Simulator State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importError, setImportError] = useState('');

  const canEdit = currentUser.role === 'owner' || currentUser.role === 'manager';
  const canImport = currentUser.role === 'owner';
  const canSeeCost = currentUser.role === 'owner' || currentUser.role === 'manager';

  // Get current stock
  const getCurrentStock = (item: InventoryItem) => {
    return item.initial_stock + item.import_qty - item.export_qty;
  };

  // Filter items
  const filteredItems = inventory.filter(item => {
    const matchesSearch = 
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const currentStock = getCurrentStock(item);
    
    if (filterTab === 'low') {
      return matchesSearch && currentStock > 0 && currentStock <= 25; // threshold
    }
    if (filterTab === 'out') {
      return matchesSearch && currentStock <= 0;
    }
    return matchesSearch;
  });

  const openAddDialog = () => {
    setEditingItem(null);
    setSku(`SP-${String(inventory.length + 1).padStart(4, '0')}`);
    setProductName('');
    setUnit('Thùng');
    setCostPrice(100000);
    setSellingPrice(120000);
    setInitialStock(50);
    setImportQty(0);
    setExportQty(0);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setSku(item.sku);
    setProductName(item.product_name);
    setUnit(item.unit);
    setCostPrice(item.cost_price);
    setSellingPrice(item.selling_price);
    setInitialStock(item.initial_stock);
    setImportQty(item.import_qty);
    setExportQty(item.export_qty);
    setIsDialogOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    const item = inventory.find((i) => i.id === id);
    showConfirm(
      'Xác nhận xóa sản phẩm',
      `Bạn có chắc chắn muốn xóa "${item?.product_name || 'sản phẩm này'}" khỏi kho hàng?\nThao tác này không thể hoàn tác.`,
      async () => {
        try {
          await deleteInventoryItem(id);
          setInventory((prev) => prev.filter((i) => i.id !== id));
          logActivity(currentUser, 'Xóa sản phẩm', 'inventory', `${item?.product_name} (${item?.sku})`);
          showToast('Xóa sản phẩm thành công');
        } catch (err) {
          console.error(err);
          showToast('Lỗi: Không thể xóa sản phẩm. Vui lòng thử lại.');
        }
      },
      { type: 'danger', confirmText: 'Xóa sản phẩm', cancelText: 'Hủy' }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !sku.trim()) {
      showAlert('Thiếu thông tin', 'Vui lòng điền đầy đủ Mã SKU và Tên sản phẩm.', 'warning');
      return;
    }

    if ((costPrice > 0 && costPrice < 1000) || (sellingPrice > 0 && sellingPrice < 1000)) return;

    if (editingItem) {
      const updated: InventoryItem = {
        ...editingItem,
        sku,
        product_name: productName,
        unit,
        cost_price: Number(costPrice),
        selling_price: Number(sellingPrice),
        initial_stock: Number(initialStock),
        import_qty: Number(importQty),
        export_qty: Number(exportQty),};
      try {
        await upsertInventory(updated);
        setInventory(prev => prev.map(item => item.id === editingItem.id ? updated : item));
        logActivity(currentUser, 'Cập nhật sản phẩm', 'inventory', `${productName} (${sku})`);
        showToast('Cập nhật sản phẩm thành công');
        setIsDialogOpen(false);
      } catch (err) {
        console.error(err);
        showToast('Lỗi: Không thể cập nhật sản phẩm. Vui lòng thử lại.');
      }
    } else {
      const newItem: InventoryItem = {
        id: `p-${Date.now()}`,
        sku,
        product_name: productName,
        unit,
        cost_price: Number(costPrice),
        selling_price: Number(sellingPrice),
        initial_stock: Number(initialStock),
        import_qty: Number(importQty),
        export_qty: Number(exportQty),
        created_at: new Date().toISOString(),
      };
      try {
        await upsertInventory(newItem);
        setInventory(prev => [newItem, ...prev]);
        logActivity(currentUser, 'Thêm sản phẩm', 'inventory', `${productName} (${sku})`);
        showToast('Thêm sản phẩm mới thành công');
        setIsDialogOpen(false);
      } catch (err) {
        console.error(err);
        showToast('Lỗi: Không thể thêm sản phẩm. Vui lòng thử lại.');
      }
    }
  };

  const parseExcelNumber = (value: unknown) => {
    if (typeof value === 'number') return value;
    if (value === null || value === undefined) return 0;
    const normalized = String(value).replace(/[^\d.-]/g, '');
    return normalized ? Number(normalized) : 0;
  };

  const handleImportClick = () => {
    if (!canImport) {
      showAlert('Chức năng đang thử nghiệm', 'Chức năng đang được thử nghiệm và sẽ hoạt động sớm.', 'info');
      return;
    }
    setIsImportOpen(true);
  };

  const handleParseImportFile = async (file: File) => {
    setImportError('');
    setImportPreview([]);

    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const reportTitle = 'báo cáo xuất nhập tồn';
      const reportSheetName = workbook.SheetNames.find((sheetName) => {
        const sheetRows = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[sheetName], {
          header: 1,
          defval: ''
        });
        return sheetRows.some((row) =>
          row.some((cell) => String(cell).trim().toLocaleLowerCase('vi-VN') === reportTitle)
        );
      });

      if (!reportSheetName) {
        setImportError('Không tìm thấy phần "Báo Cáo Xuất Nhập Tồn" trong file Excel.');
        return;
      }

      const rows = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[reportSheetName], {
        header: 1,
        defval: ''
      });

      const normalizeText = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase('vi-VN');
      const includesAny = (value: unknown, keywords: string[]) => {
        const text = normalizeText(value);
        return keywords.some((keyword) => text.includes(keyword));
      };

      const headerKeywords = ['stt', 'tên hàng', 'tên hàng hoá', 'tên hàng hóa', 'đvt', 'đơn vị', 'đơn giá', 'tồn đầu', 'nhập trong', 'xuất trong', 'tồn cuối', 'sl', 'lần 1', 'lần 2', 'lần 3', 'thành tiền'];
      const isHeaderRow = (row: any[]) => {
        const rowText = row.map(normalizeText).join(' ');
        const productCellText = normalizeText(row[1]);
        return !productCellText || headerKeywords.some(kw => rowText.includes(kw));
      };

      const headerRows = rows.slice(0, 8);
      const findColumn = (keywords: string[], fallback: number) => {
        for (const row of headerRows) {
          const index = row.findIndex((cell) => includesAny(cell, keywords));
          if (index >= 0) return index;
        }
        return fallback;
      };

      const productNameCol = findColumn(['tên hàng hoá', 'tên hàng hóa', 'tên sản phẩm', 'tên hàng'], 1);
      const unitCol = findColumn(['đvt', 'đơn vị'], 2);
      const priceCol = findColumn(['đơn giá', 'giá bán'], 3);

      const getGroupText = (col: number) => headerRows
        .map((row) => row.slice(Math.max(0, col - 2), col + 1).map(normalizeText).join(' '))
        .join(' ');

      const slColumns = headerRows.reduce<number[]>((cols, row) => {
        row.forEach((cell, col) => {
          const text = normalizeText(cell);
          if ((text === 'sl' || text.includes('số lượng')) && !cols.includes(col)) {
            cols.push(col);
          }
        });
        return cols;
      }, []);

      const initialStockCols = slColumns.filter((col) => includesAny(getGroupText(col), ['tồn đầu']));
      const importQtyCols = slColumns.filter((col) => includesAny(getGroupText(col), ['nhập trong', 'nhập']));
      const exportQtyCols = slColumns.filter((col) => includesAny(getGroupText(col), ['xuất trong', 'xuất']));

      const sumColumns = (row: any[], cols: number[], fallbackCols: number[]) => {
        const targetCols = cols.length > 0 ? cols : fallbackCols;
        return targetCols.reduce((sum, col) => sum + parseExcelNumber(row[col]), 0);
      };

      let validIdx = 0;
      const parsed = rows
        .slice(1)
        .filter(row => {
          if (!row[productNameCol]) return false;
          if (isHeaderRow(row)) return false;
          const name = String(row[productNameCol]).trim();
          if (name.length < 2) return false;
          return true;
        })
        .map((row) => {
          const productName = String(row[productNameCol]).trim();
          const existing = inventory.find(item => item.product_name.trim().toLowerCase() === productName.toLowerCase());
          const sellingPrice = parseExcelNumber(row[priceCol]);
          const initialStock = sumColumns(row, initialStockCols, [4]);
          const importTotal = sumColumns(row, importQtyCols, [6, 7, 8]);
          const exportTotal = sumColumns(row, exportQtyCols, [10]);
          const idx = validIdx++;
          return {
            id: existing?.id || `p-import-${Date.now()}-${idx}`,
            sku: existing?.sku || `SP-${String(inventory.length + idx + 1).padStart(4, '0')}`,
            product_name: productName,
            unit: String(row[unitCol] || existing?.unit || 'Thùng').trim(),
            cost_price: sellingPrice,
            selling_price: sellingPrice,
            initial_stock: initialStock,
            import_qty: importTotal,
            export_qty: exportTotal,
            created_at: existing?.created_at || new Date().toISOString()
          };
        });

      if (parsed.length === 0) {
        setImportError('Không tìm thấy dòng sản phẩm hợp lệ trong file Excel.');
        return;
      }

      setImportPreview(parsed);
    } catch (err: any) {
      setImportError(err.message || 'Không đọc được file Excel. Vui lòng kiểm tra lại định dạng.');
    }
  };

  const handleConfirmImport = () => {
    if (importPreview.length === 0) return;
    
    setInventory(prev => {
      const previewByName = new Map(importPreview.map(item => [item.product_name.trim().toLowerCase(), item]));
      const updatedExisting = prev.map(item => {
        const imported = previewByName.get(item.product_name.trim().toLowerCase());
        if (!imported) return item;
        previewByName.delete(item.product_name.trim().toLowerCase());
        return {
          ...item,
          unit: imported.unit,
          cost_price: imported.cost_price,
          selling_price: imported.selling_price,
          initial_stock: imported.initial_stock,
          import_qty: imported.import_qty,
          export_qty: imported.export_qty
        };
      });
      const newItems = Array.from(previewByName.values());
      const nextInventory = [...newItems, ...updatedExisting];

      nextInventory
        .filter(item => importPreview.some(imported => imported.product_name.trim().toLowerCase() === item.product_name.trim().toLowerCase()))
        .forEach(item => upsertInventory(item).catch(console.error));

      const overwrittenCount = importPreview.length - newItems.length;
      showToast(`Import thành công ${importPreview.length} sản phẩm (${overwrittenCount} ghi đè, ${newItems.length} thêm mới)`);
      return nextInventory;
    });

    logActivity(currentUser, 'Import kho hàng', 'inventory', `${importPreview.length} sản phẩm`);
    setIsImportOpen(false);
    setImportPreview([]);
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Top Banner and Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-line shadow-sm flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl text-amber-600 shrink-0">
            <Package className="w-5 h-5 sm:w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs text-muted font-semibold block truncate">Tổng sản phẩm</span>
            <span className="text-lg sm:text-xl font-bold">{inventory.length}</span>
          </div>
        </div>

        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-line shadow-sm flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="p-2.5 sm:p-3 bg-rose-500/10 rounded-xl text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs text-muted font-semibold block truncate">Hết hàng</span>
            <span className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400">
              {inventory.filter(i => getCurrentStock(i) <= 0).length}
            </span>
          </div>
        </div>

        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-line shadow-sm flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs text-muted font-semibold block truncate">Sắp hết hàng</span>
            <span className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400">
              {inventory.filter(i => {
                const stock = getCurrentStock(i);
                return stock > 0 && stock <= 25;
              }).length}
            </span>
          </div>
        </div>

        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-line shadow-sm flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="p-2.5 sm:p-3 bg-emerald-500/10 rounded-xl text-emerald-600 shrink-0">
            <RefreshCw className="w-5 h-5 sm:w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs text-muted font-semibold block truncate">Tổng tồn kho</span>
            <span className="text-lg sm:text-xl font-bold">
              {inventory.reduce((sum, item) => sum + getCurrentStock(item), 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-surface p-3.5 sm:p-4 rounded-2xl border border-line shadow-sm flex flex-wrap lg:flex-nowrap gap-3 lg:gap-4 items-center justify-between">
        {/* Desktop Search (>= lg) */}
        <div className="hidden lg:block relative w-80">
          <input
            type="text"
            placeholder="Tìm sản phẩm, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-alt border border-line rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-muted" />
        </div>

        {/* Touch/Tablet Search Icon (< lg) */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSearchSheetOpen(true)}
            aria-label="Tìm kiếm sản phẩm"
            className="min-w-[44px] min-h-[44px] px-3 rounded-xl bg-surface-alt border border-line text-muted hover:text-amber-500 dark:hover:text-amber-400 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Search className="w-5 h-5 text-amber-500" />
            {searchTerm ? (
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 max-w-[120px] truncate">
                {searchTerm}
              </span>
            ) : (
              <span className="text-xs text-muted">Tìm kiếm...</span>
            )}
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="Xóa bộ lọc tìm kiếm"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted hover:text-secondary rounded-xl cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters Tabs */}
        <div className="flex gap-1.5 bg-surface-alt p-1 rounded-xl">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              filterTab === 'all'
                ? 'bg-surface shadow-sm text-foreground'
                : 'text-muted hover:text-secondary'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilterTab('low')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              filterTab === 'low'
                ? 'bg-surface shadow-sm text-amber-600 dark:text-amber-400'
                : 'text-muted hover:text-secondary'
            }`}
          >
            Sắp hết
          </button>
          <button
            onClick={() => setFilterTab('out')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              filterTab === 'out'
                ? 'bg-surface shadow-sm text-rose-600 dark:text-rose-400'
                : 'text-muted hover:text-secondary'
            }`}
          >
            Hết hàng
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={openAddDialog}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/10 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm sản phẩm</span>
            </button>
          )}
          {/* Import Excel Button: hidden on touch/tablet < lg, visible on lg+ */}
          <button
            onClick={handleImportClick}
            className="hidden lg:flex bg-surface-alt hover:bg-surface-alt dark:hover:bg-surface-alt text-secondary py-2.5 px-3.5 rounded-xl text-xs items-center justify-center gap-1.5 cursor-pointer transition-colors min-h-[44px]"
            title="Nhập từ Excel"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Search Sheet for touch landscape / tablet */}
       <ResponsiveSearchSheet
         isOpen={isSearchSheetOpen}
         onClose={() => setIsSearchSheetOpen(false)}
         value={searchTerm}
         onChange={setSearchTerm}
         placeholder="Tìm sản phẩm, SKU..."
         title="Tìm kiếm sản phẩm trong kho"
         productResults={inventory
           .filter((item) => {
             const term = searchTerm.trim().toLowerCase();
             return term
               ? item.product_name.toLowerCase().includes(term) || item.sku.toLowerCase().includes(term)
               : false;
           })
           .map((item) => ({
             id: item.id,
             name: item.product_name,
             sku: item.sku,
             price: item.selling_price,
           }))}
         onSelectProduct={(product) => {
           setSearchTerm(product.name);
           setIsSearchSheetOpen(false);
         }}
      />

      {/* Main Table */}
      <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line bg-surface-alt">
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider w-12 text-center">STT</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Tên sản phẩm</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Đơn vị</th>
                {canSeeCost && (
                  <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Giá vốn</th>
                )}
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Giá bán</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-center">Tồn đầu</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-center">Nhập</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-center">Xuất</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-center">Tồn cuối</th>
                {canEdit && (
                  <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-center">Hành động</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 10 : 8} className="p-8 text-center text-muted text-sm">
                    Không tìm thấy sản phẩm nào
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const stock = getCurrentStock(item);
                  const isOut = stock <= 0;
                  const isLow = stock > 0 && stock <= 25;

                  return (
                    <tr key={item.id} className="hover:bg-surface-alt dark:hover:bg-surface-alt transition-colors">
                      <td className="p-4 text-sm font-semibold text-muted text-center">{idx + 1}</td>
                      <td className="p-4 text-sm font-bold text-foreground">{item.product_name}</td>
                      <td className="p-4 text-sm text-secondary">{item.unit}</td>
                      {canSeeCost && (
                        <td className="p-4 text-sm font-medium text-foreground text-right">
                          {item.cost_price.toLocaleString('vi-VN')}đ
                        </td>
                      )}
                      <td className="p-4 text-sm font-bold text-foreground text-right">
                        {item.selling_price.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-4 text-sm text-muted text-center">{item.initial_stock}</td>
                      <td className="p-4 text-sm text-emerald-600 dark:text-emerald-400 text-center font-medium">+{item.import_qty}</td>
                      <td className="p-4 text-sm text-rose-600 dark:text-rose-400 text-center font-medium">-{item.export_qty}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          isOut 
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400' 
                            : isLow 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}>
                          {stock}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => openEditDialog(item)}
                              className="p-1.5 bg-surface-alt text-secondary hover:text-amber-500 dark:hover:text-amber-400 rounded-lg cursor-pointer transition-colors"
                              title="Sửa sản phẩm"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 bg-surface-alt text-secondary hover:text-red-500 dark:hover:text-red-400 rounded-lg cursor-pointer transition-colors"
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
          <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDialogOpen(false)}
              className="fixed inset-0 bg-bg"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-surface rounded-2xl sm:rounded-3xl border border-line w-full max-w-lg shadow-2xl flex flex-col z-10 max-h-[calc(100dvh-1.5rem)] lg:max-h-[90vh] overflow-hidden"
            >
              <div className="flex justify-between items-center px-5 sm:px-6 py-3.5 sm:py-4 border-b border-line shrink-0 bg-inherit">
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {editingItem ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
                </h3>
                <button 
                  type="button"
                  aria-label="Đóng"
                  onClick={() => setIsDialogOpen(false)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-surface-alt dark:hover:bg-surface-alt rounded-xl cursor-pointer text-muted hover:text-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted">Đơn vị tính</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setUnitMenuOpen((open) => !open)}
                      className="w-full flex items-center justify-between bg-surface-alt border border-line rounded-xl px-3.5 py-2 text-sm focus:outline-none cursor-pointer"
                      aria-haspopup="listbox"
                      aria-expanded={unitMenuOpen}
                    >
                      <span>{unit}</span>
                      <motion.span
                        animate={{ rotate: unitMenuOpen ? 180 : 0 }}
                        transition={{ duration: 0.18 }}
                        className="text-muted"
                      >
                        ▾
                      </motion.span>
                    </button>
                    <AnimatePresence>
                      {unitMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.16 }}
                          className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-xl-strong-alt"
                          role="listbox"
                        >
                          {[
                            'Thùng',
                            'Khay',
                            'Két',
                            'Chai',
                            'Lon',
                            'Thùng (12 chai)',
                            'Thùng (24 chai)',
                            'Thùng (24 lon)',
                            'Thùng (24 hộp)',
                            'Hộp',
                            'Lốc',
                          ].map((option) => (
                            <button
                              key={option}
                              type="button"
                              role="option"
                              aria-selected={unit === option}
                              onClick={() => {
                                setUnit(option);
                                setUnitMenuOpen(false);
                              }}
                              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                unit === option
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  : 'text-secondary hover:bg-surface-alt dark:hover:bg-surface-alt'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted">Tên sản phẩm</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Bia Tiger lon, Pepsi chai..."
                    className="w-full bg-surface-alt border border-line rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted">Giá vốn (đ)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrencyInput(costPrice)}
                      onChange={(e) => setCostPrice(parseCurrencyInput(e.target.value))}
                      className={`w-full bg-surface-alt border rounded-xl px-3.5 py-2 text-sm focus:outline-none ${
                        costPrice > 0 && costPrice < 1000 ? 'border-red-500' : 'border-line'
                      }`}
                      required
                    />
                    {costPrice > 0 && costPrice < 1000 && (
                      <span className="text-[10px] text-red-500 font-semibold">Nhập ≥ 1.000đ</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted">Giá bán (đ)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrencyInput(sellingPrice)}
                      onChange={(e) => setSellingPrice(parseCurrencyInput(e.target.value))}
                      className={`w-full bg-surface-alt border rounded-xl px-3.5 py-2 text-sm focus:outline-none ${
                        sellingPrice > 0 && sellingPrice < 1000 ? 'border-red-500' : 'border-line'
                      }`}
                      required
                    />
                    {sellingPrice > 0 && sellingPrice < 1000 && (
                      <span className="text-[10px] text-red-500 font-semibold">Nhập ≥ 1.000đ</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted">Tồn ban đầu</label>
                    <input
                      type="number"
                      value={initialStock}
                      onChange={(e) => setInitialStock(Number(e.target.value))}
                      className="w-full bg-surface-alt border border-line rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted">Nhập thêm</label>
                    <input
                      type="number"
                      value={importQty}
                      onChange={(e) => setImportQty(Number(e.target.value))}
                      className="w-full bg-surface-alt border border-line rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted">Đã xuất bán</label>
                    <input
                      type="number"
                      value={exportQty}
                      onChange={(e) => setExportQty(Number(e.target.value))}
                      className="w-full bg-surface-alt border border-line rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                    />
                  </div>
                </div>
                </div>

                <div className="sticky bottom-0 px-5 sm:px-6 py-3.5 sm:py-4 border-t border-line bg-surface flex gap-3 justify-end items-center shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                  <button
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                    className="px-4 py-2 border border-line-strong text-secondary rounded-xl text-xs cursor-pointer hover:bg-surface-alt dark:hover:bg-surface-alt"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md shadow-amber-500/10"
                  >
                    Lưu sản phẩm
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Excel Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="relative bg-surface rounded-2xl sm:rounded-3xl border border-line w-full max-w-2xl shadow-2xl flex flex-col z-10 max-h-[calc(100dvh-1.5rem)] lg:max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center px-5 sm:px-6 py-3.5 sm:py-4 border-b border-line shrink-0 bg-inherit">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Nhập Kho Hàng Từ Spreadsheet
                </h3>
              </div>
              <button 
                type="button"
                aria-label="Đóng"
                onClick={() => setIsImportOpen(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-surface-alt dark:hover:bg-surface-alt rounded-xl cursor-pointer text-muted hover:text-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
              <div className="text-xs text-muted space-y-1">
                <p>Upload file Excel có bảng như mẫu: STT, Tên hàng hoá, ĐVT, Đơn giá, Tồn đầu/SL, Nhập trong tháng/Lần 1-3, Xuất trong tháng/SL.</p>
                <p className="font-semibold text-secondary">
                  Hệ thống tự map dữ liệu vào: Tên sản phẩm, Đơn vị, Giá bán, Tồn đầu, Nhập, Xuất.
                </p>
              </div>

              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleParseImportFile(file);
                }}
                className="w-full bg-surface-alt border border-line rounded-xl px-3.5 py-3 text-sm focus:outline-none"
              />

              {importError && (
                <div className="p-3 bg-red-100 text-red-800 rounded-xl text-xs font-semibold">
                  {importError}
                </div>
              )}

              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-secondary">Xem trước ({importPreview.length} dòng):</span>
                  <div className="max-h-40 overflow-y-auto border border-line rounded-xl">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-surface-alt sticky top-0">
                        <tr className="border-b border-line-strong">
                          <th className="p-2 font-bold">SKU</th>
                          <th className="p-2 font-bold">Tên sản phẩm</th>
                          <th className="p-2 font-bold">ĐVT</th>
                          <th className="p-2 font-bold text-right">Giá bán</th>
                          <th className="p-2 font-bold text-center">Tồn đầu</th>
                          <th className="p-2 font-bold text-center">Nhập</th>
                          <th className="p-2 font-bold text-center">Xuất</th>
                          <th className="p-2 font-bold text-center">Tồn cuối</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {importPreview.map((item, idx) => (
                          <tr key={idx} className="bg-surface">
                            <td className="p-2 font-semibold">{item.sku}</td>
                            <td className="p-2 font-semibold">{item.product_name}</td>
                            <td className="p-2">{item.unit}</td>
                            <td className="p-2 text-right">{item.selling_price.toLocaleString()}đ</td>
                            <td className="p-2 text-center">{item.initial_stock}</td>
                            <td className="p-2 text-center text-emerald-600">+{item.import_qty}</td>
                            <td className="p-2 text-center text-rose-600">-{item.export_qty}</td>
                            <td className="p-2 text-center font-bold">{item.initial_stock + item.import_qty - item.export_qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 px-5 sm:px-6 py-3.5 sm:py-4 border-t border-line bg-surface flex gap-3 justify-end items-center shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
              <button
                type="button"
                onClick={() => {
                  setIsImportOpen(false);
                  setImportPreview([]);
                }}
                className="px-4 py-2 border border-line-strong text-secondary rounded-xl text-xs cursor-pointer hover:bg-surface-alt"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={importPreview.length === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md shadow-emerald-600/10"
              >
                Đưa vào kho hàng
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
