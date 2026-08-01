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