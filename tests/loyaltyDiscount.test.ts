import { describe, it, expect } from 'vitest';
import { calcLoyaltyDiscount } from '../src/loyaltyDiscount';

describe('calcLoyaltyDiscount', () => {

  it.each([-1, -5, NaN, Infinity])(
    'відхиляє некоректний стаж %s',
    (years) => {
      expect(() => calcLoyaltyDiscount(years, false))
        .toThrow('INVALID_YEARS');
    }
  );
  
it.each([
  { years: 0, expected: 0 },
  { years: 0.5, expected: 0 },
  { years: 0.99, expected: 0 },
])(
  'повертає знижку 0% для стажу $years років',
  ({ years, expected }) => {
    expect(calcLoyaltyDiscount(years, false)).toBe(expected);
  }
);

});