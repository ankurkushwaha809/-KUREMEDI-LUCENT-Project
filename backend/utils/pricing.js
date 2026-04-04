export const GST_MODE_INCLUDE = "include";
export const GST_MODE_EXCLUDE = "exclude";

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const toNonNegativeNumber = (v, fallback = 0) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return n < 0 ? 0 : n;
};

export const normalizeGstMode = (mode) => {
  const value = String(mode || "").trim().toLowerCase();
  if (value === GST_MODE_INCLUDE) return GST_MODE_INCLUDE;
  return GST_MODE_EXCLUDE;
};

export const normalizePercent = (value, max = null) => {
  const n = toNonNegativeNumber(value, 0);
  if (max == null) return n;
  return Math.min(n, max);
};

export const calculateUnitPricing = ({
  sellingPrice,
  discountPercent = 0,
  gstPercent = 0,
  gstMode = GST_MODE_EXCLUDE,
}) => {
  const baseSellingPrice = toNonNegativeNumber(sellingPrice, 0);
  const normalizedDiscount = normalizePercent(discountPercent, 100);
  const normalizedGst = normalizePercent(gstPercent);
  const normalizedMode = normalizeGstMode(gstMode);
  const effectiveGstPercent = normalizedMode === GST_MODE_INCLUDE ? normalizedGst : 0;

  const discountAmount = (baseSellingPrice * normalizedDiscount) / 100;
  const discountedSellingPrice = Math.max(0, baseSellingPrice - discountAmount);

  const taxableSellingPrice = discountedSellingPrice;
  const gstAmount = effectiveGstPercent > 0 ? (baseSellingPrice * effectiveGstPercent) / 100 : 0;
  const finalSellingPrice = discountedSellingPrice + gstAmount;

  return {
    baseSellingPrice: round2(baseSellingPrice),
    discountPercent: round2(normalizedDiscount),
    discountAmount: round2(discountAmount),
    discountedSellingPrice: round2(discountedSellingPrice),
    taxableSellingPrice: round2(taxableSellingPrice),
    gstMode: normalizedMode,
    gstPercent: round2(effectiveGstPercent),
    gstAmount: round2(gstAmount),
    finalSellingPrice: round2(finalSellingPrice),
  };
};

export const calculateLinePricing = (pricingInput, quantity) => {
  const unit = calculateUnitPricing(pricingInput);
  const qty = Math.max(1, toNonNegativeNumber(quantity, 1));
  const lineSubtotal = round2(unit.taxableSellingPrice * qty);
  const lineGstAmount = round2(unit.gstAmount * qty);
  const lineTotal = round2(unit.finalSellingPrice * qty);

  return {
    ...unit,
    quantity: qty,
    lineSubtotal,
    lineGstAmount,
    lineTotal,
  };
};
