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

  it.each([
    { years: 1, expected: 0.05 },
    { years: 1.01, expected: 0.05 },
    { years: 2, expected: 0.05 },
    { years: 2.99, expected: 0.05 },
    { years: 3, expected: 0.05 },
  ])(
    'повертає знижку 5% для стажу $years років',
    ({ years, expected }) => {
      expect(calcLoyaltyDiscount(years, false)).toBe(expected);
    }
  );

});