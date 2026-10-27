const FIVE_PERCENT_DISCOUNT = 0.05;
const TEN_PERCENT_DISCOUNT = 0.10;
const FIFTEEN_PERCENT_DISCOUNT = 0.15;

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

  if (years <= 5) {
    return TEN_PERCENT_DISCOUNT;
  }

  return FIFTEEN_PERCENT_DISCOUNT;
}