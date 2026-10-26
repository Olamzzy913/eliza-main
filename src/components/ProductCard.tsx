"use client";

import Link from "next/link";
import { Crown, Gift, Heart, Scissors } from "lucide-react";
import type { Product } from "@/lib/types";
import { naira } from "@/lib/format";
import { availabilityOf, effectivePrice, onSale } from "@/lib/pricing";
import { img } from "@/lib/cloudinary";
import { useShop } from "@/context/ShopContext";

export function ProductCard({ p, className = "" }: { p: Product; className?: string }) {
  const { saved, toggleSaved } = useShop();
  const isSaved = saved.includes(p.id);
  const avail = availabilityOf(p);
  const price = effectivePrice(p);
  const sale = onSale(p) && avail !== "soldout";
  const [first, second] = p.images ?? [];
  const lowStock = avail === "in" && p.stock <= Math.max(3, p.lowStockAt ?? 0) ? p.stock : 0;

  return (
    <div className={`group relative ${className}`}>
      <Link href={`/product/${p.id}`} className="block">
        <div className={`relative aspect-[4/5] overflow-hidden rounded-2xl bg-fog ${p.premium ? "ring-2 ring-gold ring-offset-2" : ""}`}>
          {first ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img(first, 600)}
                alt={p.name}
                loading="lazy"
                className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${avail === "soldout" ? "opacity-50 grayscale" : ""}`}
              />
              {second && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img(second, 600)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />
              )}
            </>
          ) : (
            <div className="grid h-full place-items-center px-4 text-center font-display text-lg text-ink/30">{p.name}</div>
          )}

          <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {p.premium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold tracking-wider text-gold shadow-sm">
                <Crown size={12} /> PREMIUM
              </span>
            )}
            {sale && <span className="rounded-full bg-sale px-2.5 py-1 text-xs font-bold tracking-wide text-white shadow-sm">−{p.discountPercent}%</span>}
            {avail === "preorder" && <span className="rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold tracking-wider text-ink shadow-sm">PRE-ORDER</span>}
            {avail === "soldout" && <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold tracking-wider text-ink/60">SOLD OUT</span>}
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink/50">{p.category}</p>
          <h3 className="font-medium leading-snug group-hover:underline">{p.name}</h3>
          <p className="flex items-baseline gap-2 text-sm">
            <span className={`font-semibold ${sale ? "text-sale" : ""}`}>{naira(price)}</span>
            {sale && <span className="text-ink/45 line-through">{naira(p.price)}</span>}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {p.payOnDelivery && <span className="rounded-full border border-go/40 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-go">Pay on delivery</span>}
            {(p.extras?.length ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-medium text-ink/80"><Gift size={11} /> Free extras</span>
            )}
            {p.stylingAvailable && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-800"><Scissors size={11} /> Can be styled</span>
            )}
            {lowStock > 0 && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">Only {lowStock} left</span>}
          </div>
        </div>
      </Link>

      <button
        onClick={() => toggleSaved(p.id)}
        aria-pressed={isSaved}
        aria-label={isSaved ? `Remove ${p.name} from saved` : `Save ${p.name}`}
        className="absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-sm transition hover:scale-110"
      >
        <Heart size={18} className={isSaved ? "text-sale" : "text-ink"} fill={isSaved ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
