export function calcLoyaltyDiscount(
  years: number,
  isBirthday: boolean,
): number {
  if (!Number.isFinite(years) || years < 0) {
    throw new Error('INVALID_YEARS');
  }

  return 0;
}