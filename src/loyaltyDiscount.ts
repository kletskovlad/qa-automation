const FIVE_PERCENT_DISCOUNT = 0.05;

export function calcLoyaltyDiscount(
  years: number,
  isBirthday: boolean,
): number {
  if (!Number.isFinite(years) || years < 0) {
    throw new Error('INVALID_YEARS');
  }

  if (years < 1) {
    return 0;
  }

  if (years <= 3) {
    return FIVE_PERCENT_DISCOUNT;
  }

  return 0;
}