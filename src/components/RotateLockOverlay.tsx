import { RotateCcw } from 'lucide-react';
import { useDeviceMode } from '../hooks/useDeviceMode';

interface RotateLockOverlayProps {
  isAuthenticated: boolean;
}

export function RotateLockOverlay({ isAuthenticated }: RotateLockOverlayProps) {
  const { isTouchPortrait } = useDeviceMode();

  if (!isAuthenticated || !isTouchPortrait) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-slate-100"
      style={{ overscrollBehavior: 'contain' }}
      role="dialog"
      aria-modal="true"
      aria-label="Xoay thiết bị"
    >
      <div className="flex max-w-sm flex-col items-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
          <RotateCcw className="h-10 w-10" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Vui lòng xoay ngang thiết bị</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Xoay ngang điện thoại hoặc máy tính bảng để tiếp tục sử dụng hệ thống.
          </p>
        </div>
      </div>
    </div>
  );
}
