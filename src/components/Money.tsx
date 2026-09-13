import type { FC } from 'react';
import { formatCompactVND, formatFullVND } from '../lib/currency';

interface MoneyProps {
  value: number;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export const Money: FC<MoneyProps> = ({ value, className = '', align = 'right' }) => {
  const full = formatFullVND(value);
  const compact = formatCompactVND(value);
  const alignCls = align === 'left' ? 'text-left' : align === 'center' ? 'text-center' : 'text-right';
  return (
    <span title={full} className={`tabular-nums font-bold text-foreground ${alignCls} ${className}`}>
      <span className="hidden sm:inline">{full}</span>
      <span className="sm:hidden">{compact}</span>
    </span>
  );
};

