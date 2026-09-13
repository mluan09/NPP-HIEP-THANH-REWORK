export const formatCurrencyInput = (value: number | string) => {
  const digits = String(value).replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  return Number(digits).toLocaleString('vi-VN');
};

export const parseCurrencyInput = (value: string) => {
  const digits = value.replace(/\D/g, '');

  return digits ? Number(digits) : 0;
};

export const formatCompactVND = (value: number) => {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    const v = abs / 1_000_000_000;
    return `${sign}${trimNum(v)} tỷ`;
  }
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    return `${sign}${trimNum(v)} tr`;
  }
  if (abs >= 1_000) {
    const v = abs / 1_000;
    return `${sign}${trimNum(v)}K`;
  }
  return `${sign}${abs.toLocaleString('vi-VN')}`;
};

const trimNum = (v: number) => {
  const rounded = Math.round(v * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace('.', ',');
};

export const formatFullVND = (value: number) => {
  return `${Number(value || 0).toLocaleString('vi-VN')} đ`;
};
