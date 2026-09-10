export const getDiscountPercentage = (
  priceCents: number,
  oldPriceCents?: number
): number | null => {
  if (!oldPriceCents || oldPriceCents <= priceCents) return null;
  return Math.round(((oldPriceCents - priceCents) / oldPriceCents) * 100);
};
