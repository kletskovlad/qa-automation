
import { describe, it, expect } from 'vitest';

import {
  calcSubtotal,
  calcDiscountRate,
  calcShipping,
  calcOrderTotal,
  splitPayment,
  type OrderItem,
} from '../src/order';

const item = (price: number, qty = 1): OrderItem => ({
  sku: 'SKU-1',
  price,
  qty,
});

describe('calcSubtotal', () => {
  it('обчислює суму одного товару', () => {
    expect(calcSubtotal([item(100, 2)])).toBe(200);
  });

  it('обчислює суму декількох товарів', () => {
    expect(
      calcSubtotal([
        item(100, 2),
        item(50, 3),
      ]),
    ).toBe(350);
  });

  it('викидає EMPTY_ORDER для порожнього замовлення', () => {
    expect(() => calcSubtotal([])).toThrow('EMPTY_ORDER');
  });

  it('викидає NEGATIVE_PRICE для відʼємної ціни', () => {
    expect(() => calcSubtotal([item(-10)]))
      .toThrow('NEGATIVE_PRICE');
  });

  it.each([0, -1, 1.5])(
    'викидає INVALID_QTY для кількості %s',
    (qty) => {
      expect(() => calcSubtotal([item(100, qty)]))
        .toThrow('INVALID_QTY');
    },
  );
});

describe('calcDiscountRate', () => {
  it.each([
    { tier: 'basic' as const, expected: 0 },
    { tier: 'silver' as const, expected: 0.05 },
    { tier: 'gold' as const, expected: 0.1 },
  ])(
    'обчислює знижку для рівня $tier',
    ({ tier, expected }) => {
      expect(calcDiscountRate(1000, tier)).toBeCloseTo(expected);
    },
  );

  it.each([
    { subtotal: 1999, expected: 0 },
    { subtotal: 2000, expected: 0.05 },
    { subtotal: 2001, expected: 0.05 },
  ])(
    'перевіряє поріг великого замовлення $subtotal',
    ({ subtotal, expected }) => {
      expect(calcDiscountRate(subtotal, 'basic'))
        .toBeCloseTo(expected);
    },
  );

  it('обмежує максимальну знижку до 25%', () => {
    expect(calcDiscountRate(3000, 'gold', 0.5))
      .toBeCloseTo(0.25);
  });

  it('викидає NEGATIVE_PROMO для відʼємного промокоду', () => {
    expect(() => calcDiscountRate(1000, 'basic', -0.1))
      .toThrow('NEGATIVE_PROMO');
  });
});

describe('calcShipping', () => {
  it.each([
    { total: 999, expected: 60 },
    { total: 1000, expected: 0 },
    { total: 1001, expected: 0 },
  ])(
    'обчислює доставку для суми $total',
    ({ total, expected }) => {
      expect(calcShipping(total)).toBe(expected);
    },
  );
});

describe('calcOrderTotal', () => {
  it('додає доставку для basic-замовлення на 500 грн', () => {
    expect(calcOrderTotal([item(500)], 'basic')).toBe(560);
  });

  it('застосовує знижку gold до 1200 грн', () => {
    expect(calcOrderTotal([item(1200)], 'gold')).toBe(1080);
  });

  it('додає доставку, якщо після знижки сума менша за 1000', () => {
    expect(calcOrderTotal([item(1050)], 'gold')).toBe(1005);
  });

  it('викидає помилку для порожнього замовлення', () => {
    expect(() => calcOrderTotal([], 'basic'))
      .toThrow('EMPTY_ORDER');
  });
});

describe('splitPayment', () => {
  it.each([
    { total: 100, parts: 1, expected: [100] },
    { total: 100, parts: 2, expected: [50, 50] },
    { total: 100, parts: 3, expected: [33.34, 33.33, 33.33] },
    { total: 10, parts: 4, expected: [2.5, 2.5, 2.5, 2.5] },
    { total: 0, parts: 3, expected: [0, 0, 0] },
    { total: 0.05, parts: 3, expected: [0.02, 0.02, 0.01] },
  ])(
    'розбиває суму $total на $parts платежів',
    ({ total, parts, expected }) => {
      expect(splitPayment(total, parts)).toEqual(expected);
    },
  );

  it.each([
    { parts: 0 },
    { parts: 1 },
    { parts: 2 },
  ])(
    'перевіряє межове значення parts = $parts',
    ({ parts }) => {
      if (parts === 0) {
        expect(() => splitPayment(100, parts))
          .toThrow('INVALID_PARTS');
      } else {
        expect(splitPayment(100, parts)).toHaveLength(parts);
      }
    },
  );

  it.each([-1, -5, 1.5, NaN, Infinity])(
    'відхиляє некоректну кількість платежів %s',
    (parts) => {
      expect(() => splitPayment(100, parts))
        .toThrow('INVALID_PARTS');
    },
  );

  it.each([-1, NaN, Infinity, -Infinity, 1e20])(
    'відхиляє некоректну суму %s',
    (total) => {
      expect(() => splitPayment(total, 3))
        .toThrow('INVALID_TOTAL');
    },
  );

  it('повертає платежі з точністю до копійки', () => {
    expect(splitPayment(0.03, 2))
      .toEqual([0.02, 0.01]);
  });

  it('зберігає точну суму платежів у копійках', () => {
    const payments = splitPayment(100.01, 3);

    const totalCents = payments.reduce(
      (sum, payment) => sum + Math.round(payment * 100),
      0,
    );

    expect(totalCents).toBe(10001);
  });
});
