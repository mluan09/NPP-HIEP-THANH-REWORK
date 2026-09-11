import { describe, expect, it } from 'vitest';
import { formatCurrencyInput, parseCurrencyInput } from './currency';

describe('currency input helpers', () => {
  it('formats digit-only values using Vietnamese thousands separators', () => {
    expect(formatCurrencyInput(1234567)).toBe('1.234.567');
    expect(formatCurrencyInput('1,234,567 đ')).toBe('1.234.567');
  });

  it('keeps an empty value empty and parses it as zero', () => {
    expect(formatCurrencyInput('')).toBe('');
    expect(parseCurrencyInput('')).toBe(0);
  });

  it('strips all non-numeric characters before parsing', () => {
    expect(parseCurrencyInput('1.250.000 đ')).toBe(1250000);
    expect(parseCurrencyInput('abc 42 xyz')).toBe(42);
  });
});
