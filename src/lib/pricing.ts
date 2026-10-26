import type { Product } from "@/lib/types";

/** Price after any discount. */
export const effectivePrice = (p: { price: number; discountPercent?: number }) => {
  const d = p.discountPercent ?? 0;
  return d > 0 && d < 100 ? Math.round(p.price * (1 - d / 100)) : p.price;
};

export const onSale = (p: { discountPercent?: number }) => (p.discountPercent ?? 0) > 0;

/** What one unit of an order or cart line costs, including the styling fee when it is styled. */
export const lineUnit = (i: { unitPrice: number; styled?: boolean; stylingFee?: number }) =>
  i.unitPrice + (i.styled ? i.stylingFee ?? 0 : 0);

/** Pieces left for a product, or for one of its properties. */
export function stockFor(p: Product, variant?: string): number {
  if (p.variants && p.variants.length > 0) {
    if (!variant) return p.stock;
    return p.variants.find((v) => v.name === variant)?.qty ?? 0;
  }
  return p.stock;
}

/** Pieces stocked in total (the "10" in "6 of 10 left"). Never less than what is left. */
export function totalFor(p: Product, variant?: string): number {
  if (p.variants && p.variants.length > 0) {
    if (variant) {
      const v = p.variants.find((x) => x.name === variant);
      return Math.max(v?.total ?? v?.qty ?? 0, v?.qty ?? 0);
    }
    return Math.max(p.variants.reduce((s, v) => s + Math.max(v.total ?? v.qty, v.qty), 0), p.stock);
  }
  return Math.max(p.stockTotal ?? p.stock, p.stock);
}

export type Availability = "in" | "preorder" | "soldout";

export function availabilityOf(p: Product, variant?: string): Availability {
  if (stockFor(p, variant) > 0) return "in";
  return p.preorder ? "preorder" : "soldout";
}

/** Out of stock, or one of its properties is, and the shop takes pre-orders for it. */
export const canPreorderNow = (p: Product) =>
  !!p.preorder && (p.stock === 0 || (p.variants?.some((v) => v.qty === 0) ?? false));
