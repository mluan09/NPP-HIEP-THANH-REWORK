import { describe, expect, it } from 'vitest';
import { ALL_MENU_ITEMS } from './menuItems';

describe('menu authorization', () => {
  const labelsFor = (role: 'owner' | 'manager' | 'staff') =>
    ALL_MENU_ITEMS.filter((item) => item.allowed.includes(role)).map((item) => item.id);

  it('shows administrative pages only to owners', () => {
    expect(labelsFor('owner')).toEqual(expect.arrayContaining(['accounts', 'activity-log']));
    expect(labelsFor('manager')).not.toEqual(expect.arrayContaining(['accounts', 'activity-log']));
    expect(labelsFor('staff')).not.toEqual(expect.arrayContaining(['accounts', 'activity-log']));
  });

  it('limits the cashbook to owner and manager roles', () => {
    expect(labelsFor('owner')).toContain('cashbook');
    expect(labelsFor('manager')).toContain('cashbook');
    expect(labelsFor('staff')).not.toContain('cashbook');
  });

  it('keeps core operational pages available to every role', () => {
    for (const role of ['owner', 'manager', 'staff'] as const) {
      expect(labelsFor(role)).toEqual(expect.arrayContaining(['sales', 'inventory', 'customers', 'debts', 'feedback']));
    }
  });
});
