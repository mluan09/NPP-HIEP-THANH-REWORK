import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DateRangePickerProps {
  /** Ngày bắt đầu dạng 'YYYY-MM-DD' (rỗng = chưa chọn) */
  from: string;
  /** Ngày kết thúc dạng 'YYYY-MM-DD' (rỗng = chưa chọn) */
  to: string;
  onChange: (from: string, to: string) => void;
  onClear: () => void;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const pad = (n: number) => String(n).padStart(2, '0');
const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const formatVi = (k: string) => {
  const d = fromKey(k);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** 42 ô (6 tuần), tuần bắt đầu Thứ 2 */
const buildMonthGrid = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ from, to, onChange, onClear }) => {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState(0);
  const [hovered, setHovered] = useState('');
  /** Mốc neo khi đang chọn dở (đã chọn ngày đầu, chờ ngày thứ hai) */
  const [anchor, setAnchor] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState(() => {
    const base = from ? fromKey(from) : today;
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  // Đóng khi click ngoài hoặc nhấn Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Reset trạng thái chọn dở mỗi lần mở
  useEffect(() => {
    if (open) {
      setAnchor('');
      setHovered('');
      const base = from ? fromKey(from) : today;
      setView({ year: base.getFullYear(), month: base.getMonth() });
    }
  }, [open, from, today]);

  const grid = useMemo(() => buildMonthGrid(view.year, view.month), [view]);

  const shiftMonth = (delta: number) => {
    setDirection(delta);
    setView(prev => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  // Khoảng đang hiển thị: ưu tiên trạng thái chọn dở + hover preview
  const range = useMemo(() => {
    if (anchor) {
      const other = hovered || anchor;
      return anchor <= other ? { start: anchor, end: other } : { start: other, end: anchor };
    }
    if (from && to) return { start: from, end: to };
    if (from) return { start: from, end: from };
    if (to) return { start: to, end: to };
    return { start: '', end: '' };
  }, [anchor, hovered, from, to]);

  const handlePick = (key: string) => {
    if (!anchor) {
      setAnchor(key);
      return;
    }
    const start = anchor <= key ? anchor : key;
    const end = anchor <= key ? key : anchor;
    setAnchor('');
    setHovered('');
    onChange(start, end);
    setOpen(false);
  };

  const applyPreset = (start: Date, end: Date) => {
    setAnchor('');
    setHovered('');
    onChange(toKey(start), toKey(end));
    setOpen(false);
  };

  const presets = [
    {
      label: 'Hôm nay',
      run: () => applyPreset(today, today),
    },
    {
      label: '7 ngày qua',
      run: () => applyPreset(addDays(today, -6), today),
    },
    {
      label: '30 ngày qua',
      run: () => applyPreset(addDays(today, -29), today),
    },
    {
      label: 'Tháng này',
      run: () => applyPreset(
        new Date(today.getFullYear(), today.getMonth(), 1),
        new Date(today.getFullYear(), today.getMonth() + 1, 0),
      ),
    },
    {
      label: 'Tháng trước',
      run: () => applyPreset(
        new Date(today.getFullYear(), today.getMonth() - 1, 1),
        new Date(today.getFullYear(), today.getMonth(), 0),
      ),
    },
  ];

  const hasValue = Boolean(from || to);
  const label = hasValue
    ? `${from ? formatVi(from) : '...'} → ${to ? formatVi(to) : '...'}`
    : 'Chọn khoảng ngày';

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <motion.button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          aria-haspopup="dialog"
          aria-expanded={open}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`group flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-300 ease-out ${
            open || hasValue
              ? 'border-amber-400/70 bg-amber-50 text-amber-700 shadow-sm shadow-amber-500/10 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300'
              : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-amber-500/40 hover:text-amber-300'
          }`}
        >
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap tabular-nums">{label}</span>
          <motion.span
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="flex"
          >
            <ChevronRight className="h-3.5 w-3.5 opacity-70" />
          </motion.span>
        </motion.button>

        <AnimatePresence>
          {hasValue && (
            <motion.button
              type="button"
              onClick={() => {
                setAnchor('');
                setHovered('');
                onClear();
              }}
              initial={{ opacity: 0, scale: 0.8, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: 'auto' }}
              exit={{ opacity: 0, scale: 0.8, width: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex items-center gap-1 overflow-hidden whitespace-nowrap rounded-xl px-2 py-1.5 text-xs font-semibold text-rose-500 cursor-pointer transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
            >
              <X className="h-3 w-3 shrink-0" />
              Xóa lọc
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Chọn khoảng ngày"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.7 }}
            style={{ transformOrigin: 'top left' }}
            className="absolute left-0 top-full z-50 mt-2 w-[19rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-3 shadow-xl shadow-black/40"
          >
            {/* Preset nhanh */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {presets.map(preset => (
                <motion.button
                  key={preset.label}
                  type="button"
                  onClick={preset.run}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-slate-300 cursor-pointer transition-colors duration-200 hover:border-amber-500/40 hover:text-amber-300"
                >
                  {preset.label}
                </motion.button>
              ))}
            </div>

            {/* Điều hướng tháng */}
            <div className="mb-2 flex items-center justify-between">
              <motion.button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Tháng trước"
                whileTap={{ scale: 0.9 }}
                className="rounded-lg p-1.5 text-slate-500 cursor-pointer transition-colors duration-200 hover:bg-slate-100 hover:text-amber-600 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.button>
              <div className="relative h-5 flex-1 overflow-hidden text-center">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={`${view.year}-${view.month}`}
                    initial={{ opacity: 0, x: direction >= 0 ? 18 : -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction >= 0 ? -18 : 18 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 text-xs font-bold text-slate-100"
                  >
                    {MONTHS[view.month]} {view.year}
                  </motion.div>
                </AnimatePresence>
              </div>
              <motion.button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Tháng sau"
                whileTap={{ scale: 0.9 }}
                className="rounded-lg p-1.5 text-slate-500 cursor-pointer transition-colors duration-200 hover:bg-slate-100 hover:text-amber-600 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Thứ */}
            <div className="mb-1 grid grid-cols-7 gap-0.5">
              {WEEKDAYS.map(day => (
                <div key={day} className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Lưới ngày */}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={`grid-${view.year}-${view.month}`}
                initial={{ opacity: 0, x: direction >= 0 ? 24 : -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction >= 0 ? -24 : 24, position: 'absolute' }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-7 gap-0.5"
                onMouseLeave={() => setHovered('')}
              >
                {grid.map(day => {
                  const key = toKey(day);
                  const outside = day.getMonth() !== view.month;
                  const isToday = key === toKey(today);
                  const inRange = Boolean(range.start) && key >= range.start && key <= range.end;
                  const isEdge = key === range.start || key === range.end;
                  const isSingle = range.start === range.end;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePick(key)}
                      onMouseEnter={() => setHovered(key)}
                      className={`relative h-8 text-[11px] font-semibold cursor-pointer transition-colors duration-150 ease-out ${
                        inRange && !isEdge ? 'bg-amber-100 dark:bg-amber-500/15' : ''
                      } ${
                        inRange && !isSingle && key === range.start ? 'rounded-l-lg' : ''
                      } ${
                        inRange && !isSingle && key === range.end ? 'rounded-r-lg' : ''
                      } ${!inRange ? 'rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800' : ''} ${
                        outside ? 'text-slate-600' : 'text-slate-200'
                      }`}
                    >
                      {isEdge && (
                        <motion.span
                          layoutId={`range-edge-${key === range.start ? 'start' : 'end'}`}
                          transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                          className="absolute inset-0 rounded-lg bg-amber-500 shadow-sm shadow-amber-500/30"
                        />
                      )}
                      <span
                        className={`relative z-10 flex h-full w-full items-center justify-center tabular-nums ${
                          isEdge ? 'text-white' : ''
                        } ${isToday && !isEdge ? 'text-amber-600 dark:text-amber-400' : ''}`}
                      >
                        {day.getDate()}
                        {isToday && !isEdge && (
                          <span className="absolute bottom-1 h-1 w-1 rounded-full bg-amber-500" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            <div className="mt-2 border-t border-slate-100 pt-2 text-center text-[11px] font-medium text-slate-400 dark:border-slate-800">
              {anchor ? `Đã chọn ${formatVi(anchor)} — chọn ngày kết thúc` : 'Chọn ngày bắt đầu và ngày kết thúc'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateRangePicker;