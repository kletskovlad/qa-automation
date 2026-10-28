
import { describe, it, expect } from 'vitest';
import { isLeapYear } from '../src/leapYear';

describe('isLeapYear', () => {
  it('повертає true для року, кратного 4', () => {
    expect(isLeapYear(2024)).toBe(true);
  });

  it('повертає false для звичайного року', () => {
    expect(isLeapYear(2025)).toBe(false);
  });

  it('повертає true для року, кратного 400', () => {
    expect(isLeapYear(2000)).toBe(true);
  });

  it('повертає false для року, кратного 100, але не 400', () => {
    expect(isLeapYear(1900)).toBe(false);
  });

  it('повертає true для нульового року', () => {
    expect(isLeapYear(0)).toBe(true);
  });

  it('викидає помилку для відʼємного року', () => {
    expect(() => isLeapYear(-2024)).toThrow('INVALID_YEAR');
  });

  it('викидає помилку для дробового року', () => {
    expect(() => isLeapYear(2024.5)).toThrow('INVALID_YEAR');
  });

  it('викидає помилку для NaN', () => {
    expect(() => isLeapYear(NaN)).toThrow('INVALID_YEAR');
  });
});
