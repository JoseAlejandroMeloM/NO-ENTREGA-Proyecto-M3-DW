// Unit tests for pure business rules (Arrange → Act → Assert). The clock is mocked with fake timers.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { restockPlan } from '../../src/modules/insights/restock';
import { isDelayed } from '../../src/models/PurchaseOrder';
import { dayRange, todayInBogota } from '../../src/modules/sales/time';

afterEach(() => vi.useRealTimers());

describe('todayInBogota (business day, UTC-5)', () => {
  it('is still the previous day in Bogota at 02:00 UTC', () => {
    // Arrange: mock the system clock.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-19T02:00:00Z'));
    // Act
    const today = todayInBogota();
    // Assert: 02:00 UTC is 21:00 on Nov 18 in Bogota.
    expect(today).toBe('2026-11-18');
  });

  it('switches day at 05:00 UTC (midnight in Bogota)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-19T05:00:00Z'));

    expect(todayInBogota()).toBe('2026-11-19');
  });
});

describe('dayRange', () => {
  it('covers exactly one Bogota calendar day in UTC', () => {
    const { start, end } = dayRange('2026-11-19');

    expect(start.toISOString()).toBe('2026-11-19T05:00:00.000Z');
    expect(end.toISOString()).toBe('2026-11-20T05:00:00.000Z');
  });
});

describe('isDelayed (shipment tracking)', () => {
  // Estimated for the Bogota day 2026-11-18; its end is 2026-11-19T05:00Z.
  const estimatedDelivery = dayRange('2026-11-18').start;

  it('is delayed once the estimated Bogota day has fully passed while still shipped', () => {
    // Act: a fixed clock one second into the next Bogota day.
    const now = new Date('2026-11-19T05:00:01Z');
    // Assert
    expect(isDelayed({ status: 'shipped', estimatedDelivery }, now)).toBe(true);
    expect(isDelayed({ status: 'accepted', estimatedDelivery }, now)).toBe(true);
  });

  it('is not delayed during the estimated day', () => {
    // Still Nov 18 in Bogota (23:59 local = 04:59Z next day).
    expect(isDelayed({ status: 'shipped', estimatedDelivery }, new Date('2026-11-19T04:59:00Z'))).toBe(false);
  });

  it('never flags delivered, cancelled or un-estimated orders', () => {
    const late = new Date('2026-11-25T05:00:00Z');
    expect(isDelayed({ status: 'delivered', estimatedDelivery }, late)).toBe(false);
    expect(isDelayed({ status: 'cancelled', estimatedDelivery }, late)).toBe(false);
    expect(isDelayed({ status: 'shipped', estimatedDelivery: null }, late)).toBe(false);
  });
});

describe('restockPlan (rule BR4) edge cases', () => {
  it('is urgent exactly at the limit: days left = lead time + 3 safety days', () => {
    // Arrange: 30 units in 30 days = 1 per day, 5 in stock, lead time 2 → limit is 5 days.
    const input = { stock: 5, minStock: 1, unitsLast30: 30, leadTimeDays: 2 };
    // Act
    const plan = restockPlan(input);
    // Assert
    expect(plan.daysLeft).toBe(5);
    expect(plan.urgent).toBe(true);
  });

  it('is not urgent one day past the limit', () => {
    expect(restockPlan({ stock: 6, minStock: 1, unitsLast30: 30, leadTimeDays: 2 }).urgent).toBe(false);
  });

  it('rounds the cover quantity up without float noise', () => {
    // 15 units in 30 days → 0.5 per day → 14 days of cover = exactly 7 (not 8 from 7.0000001).
    const plan = restockPlan({ stock: 0, minStock: 0, unitsLast30: 15, leadTimeDays: 3 });

    expect(plan.suggestedQty).toBe(7);
  });

  it('never suggests a negative quantity when overstocked', () => {
    expect(restockPlan({ stock: 500, minStock: 5, unitsLast30: 30, leadTimeDays: 3 }).suggestedQty).toBe(0);
  });
});
