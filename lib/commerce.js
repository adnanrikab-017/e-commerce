export function calculateDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  const amount = Number(coupon.amount);
  const discount = coupon.type === "PERCENTAGE" ? subtotal * (amount / 100) : amount;
  return Math.max(0, Math.min(subtotal, Math.round(discount * 100) / 100));
}

export function couponUnavailableReason(coupon, now = new Date()) {
  if (!coupon || !coupon.isActive) return "Coupon is not active";
  if (coupon.startsAt > now) return "Coupon is not active yet";
  if (coupon.expiresAt && coupon.expiresAt <= now) return "Coupon has expired";
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) return "Coupon usage limit has been reached";
  return null;
}
