import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

/** Phát hiện thiết bị cảm ứng (điện thoại/iPad/máy tính bảng) */
function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 1;
}

/** Kiểm tra đang ở chế độ dọc (portrait) */
function isPortrait(): boolean {
  if (screen?.orientation?.type) {
    return screen.orientation.type.startsWith('portrait');
  }
  return window.innerHeight > window.innerWidth;
}

export function RotateLockOverlay() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const check = () => {
      if (isTouchDevice() && isPortrait()) {
        setShowOverlay(true);
      } else {
        setShowOverlay(false);
      }
    };

    check();
    setMounted(true);

    window.addEventListener('orientationchange', check);
    window.addEventListener('resize', check);

    return () => {
      window.removeEventListener('orientationchange', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  // Không render gì trước khi mount hoàn tất (tránh hydration mismatch)
  if (!mounted || !showOverlay) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center gap-8 p-8 select-none"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative animate-[spin_3s_linear_infinite]">
          <RotateCcw className="w-20 h-20 text-amber-400" />
        </div>
      </div>

      <div className="text-center space-y-3 max-w-xs">
        <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
          Vui lòng xoay ngang màn hình
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Ứng dụng này yêu cầu màn hình nằm ngang để sử dụng trên điện thoại và máy tính bảng.
        </p>
      </div>

      <div className="flex items-center gap-3 text-amber-500/60">
        <svg
          className="w-6 h-6 animate-bounce"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest">Xoay ngang</span>
        <svg
          className="w-6 h-6 animate-bounce"
          style={{ animationDelay: '0.3s' }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}