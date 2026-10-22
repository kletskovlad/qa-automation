
export type Tier = 'basic' | 'silver' | 'gold';

export type OrderItem = {
  sku: string;
  price: number;
  qty: number;
};

const TIER_DISCOUNTS: Record<Tier, number> = {
  basic: 0,
  silver: 0.05,
  gold: 0.1,
};

const LARGE_ORDER_THRESHOLD = 2000;
const LARGE_ORDER_BONUS = 0.05;
const MAX_DISCOUNT = 0.25;

const FREE_SHIPPING_THRESHOLD = 1000;
const SHIPPING_FEE = 60;

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calcSubtotal(items: OrderItem[]): number {
  if (items.length === 0) {
    throw new Error('EMPTY_ORDER');
  }

  let subtotal = 0;

  for (const item of items) {
    if (item.price < 0) {
      throw new Error('NEGATIVE_PRICE');
    }

    if (!Number.isInteger(item.qty) || item.qty <= 0) {
      throw new Error('INVALID_QTY');
    }

    subtotal += item.price * item.qty;
  }

  return round2(subtotal);
}

export function calcDiscountRate(
  subtotal: number,
  tier: Tier,
  promoDiscount = 0,
): number {
  if (promoDiscount < 0) {
    throw new Error('NEGATIVE_PROMO');
  }

  let discount = TIER_DISCOUNTS[tier] + promoDiscount;

  if (subtotal >= LARGE_ORDER_THRESHOLD) {
    discount += LARGE_ORDER_BONUS;
  }

  return Math.min(discount, MAX_DISCOUNT);
}

export function calcShipping(totalAfterDiscount: number): number {
  return totalAfterDiscount >= FREE_SHIPPING_THRESHOLD
    ? 0
    : SHIPPING_FEE;
}

export function calcOrderTotal(
  items: OrderItem[],
  tier: Tier,
  promoDiscount = 0,
): number {
  const subtotal = calcSubtotal(items);

  const discountRate = calcDiscountRate(
    subtotal,
    tier,
    promoDiscount,
  );

  const totalAfterDiscount = round2(
    subtotal * (1 - discountRate),
  );

  const shipping = calcShipping(totalAfterDiscount);

  return round2(totalAfterDiscount + shipping);
}

export function splitPayment(total: number, parts: number): number[] {
  if (!Number.isInteger(parts) || parts < 1) {
    throw new Error('INVALID_PARTS');
  }

  if (!Number.isFinite(total) || total < 0) {
    throw new Error('INVALID_TOTAL');
  }

  const cents = Math.round(total * 100);

  if (!Number.isSafeInteger(cents)) {
    throw new Error('INVALID_TOTAL');
  }

  const base = Math.floor(cents / parts);
  const remainder = cents % parts;

  return Array.from({ length: parts }, (_, index) => {
    const payment = base + (index < remainder ? 1 : 0);
    return payment / 100;
  });
}
