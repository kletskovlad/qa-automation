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

});