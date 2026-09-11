import { describe, expect, it } from 'vitest';
import { generateCashbookCode, generateCustomerCode } from './db';

describe('sequential code generators', () => {
  it('uses the next numeric customer code and ignores malformed codes', () => {
    expect(generateCustomerCode([
      { customer_code: 'KH-0009' },
      { customer_code: 'not-a-code' },
      { customer_code: 'KH-0012' },
    ] as never)).toBe('KH-0013');
  });

  it('starts customer codes at one when no valid code exists', () => {
    expect(generateCustomerCode([])).toBe('KH-0001');
  });

  it('uses independent sequences for income and expense vouchers', () => {
    const entries = [
      { code: 'PT-0007' },
      { code: 'PC-0012' },
      { code: 'PT-invalid' },
    ] as never;

    expect(generateCashbookCode(entries, 'income')).toBe('PT-0008');
    expect(generateCashbookCode(entries, 'expense')).toBe('PC-0013');
  });
});
