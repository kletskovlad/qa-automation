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

  let discount = 0;

  if (years < 1) {
    discount = 0;
  } else if (years <= 3) {
    discount = FIVE_PERCENT_DISCOUNT;
  } else if (years <= 5) {
    discount = TEN_PERCENT_DISCOUNT;
  } else {
    discount = FIFTEEN_PERCENT_DISCOUNT;
  }

  if (isBirthday) {
    discount *= 2;
  }

  return discount;
}