import { useState, useEffect } from 'react';

interface DeviceMode {
  isTouchDevice: boolean;
  isPortrait: boolean;
  isTouchPortrait: boolean;
  isTouchLandscape: boolean;
}

function getIsTouch(): boolean {
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

function getIsPortrait(): boolean {
  if (screen?.orientation?.type) {
    return screen.orientation.type.startsWith('portrait');
  }
  return window.innerHeight > window.innerWidth;
}

export function useDeviceMode(): DeviceMode {
  const [isTouch, setIsTouch] = useState(getIsTouch);
  const [isPortrait, setIsPortrait] = useState(getIsPortrait);

  useEffect(() => {
    const touchMq = window.matchMedia('(hover: none) and (pointer: coarse)');
    const handleTouchChange = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    touchMq.addEventListener('change', handleTouchChange);

    const handleOrientation = () => setIsPortrait(getIsPortrait());
    window.addEventListener('orientationchange', handleOrientation);
    window.addEventListener('resize', handleOrientation);

    return () => {
      touchMq.removeEventListener('change', handleTouchChange);
      window.removeEventListener('orientationchange', handleOrientation);
      window.removeEventListener('resize', handleOrientation);
    };
  }, []);

  return {
    isTouchDevice: isTouch,
    isPortrait,
    isTouchPortrait: isTouch && isPortrait,
    isTouchLandscape: isTouch && !isPortrait,
  };
}
