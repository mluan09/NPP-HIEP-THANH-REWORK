import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { useDeviceMode } from '../hooks/useDeviceMode';

interface RotateLockOverlayProps {
  isAuthenticated: boolean;
}

export function RotateLockOverlay({ isAuthenticated }: RotateLockOverlayProps) {
  const { isTouchPortrait } = useDeviceMode();
  const isLocked = isAuthenticated && isTouchPortrait;

  useEffect(() => {
    if (!isLocked) return;

    // Drop keyboard and cancel input focus
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Lock scrolling on html and body
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isLocked]);

  if (!isLocked) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex h-[100dvh] w-screen items-center justify-center bg-bg px-6 text-center text-foreground select-none touch-none overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-label="Xoay thiết bị"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchEnd={(e) => e.stopPropagation()}
      onWheel={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex max-w-sm flex-col items-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 animate-pulse">
          <RotateCcw className="h-10 w-10 animate-spin" style={{ animationDuration: '4s' }} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Vui lòng xoay ngang thiết bị</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Xoay ngang điện thoại hoặc máy tính bảng để tiếp tục sử dụng hệ thống.
          </p>
        </div>
      </div>
    </div>
  );
}

