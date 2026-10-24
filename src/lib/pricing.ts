import type { Product } from "@/lib/types";

/** Price after any discount. */
export const effectivePrice = (p: { price: number; discountPercent?: number }) => {
  const d = p.discountPercent ?? 0;
  return d > 0 && d < 100 ? Math.round(p.price * (1 - d / 100)) : p.price;
};

export const onSale = (p: { discountPercent?: number }) => (p.discountPercent ?? 0) > 0;

/** Pieces available for a product, or for one of its properties. */
export function stockFor(p: Product, variant?: string): number {
  if (p.variants && p.variants.length > 0) {
    if (!variant) return p.stock;
    return p.variants.find((v) => v.name === variant)?.qty ?? 0;
  }
  return p.stock;
}

export type Availability = "in" | "preorder" | "soldout";

export function availabilityOf(p: Product, variant?: string): Availability {
  if (stockFor(p, variant) > 0) return "in";
  return p.preorder ? "preorder" : "soldout";
}
