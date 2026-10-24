import Link from "next/link";
import type { Product } from "@/lib/types";
import { naira } from "@/lib/format";
import { availabilityOf, effectivePrice, onSale } from "@/lib/pricing";
import { img } from "@/lib/cloudinary";

export function ProductCard({ p }: { p: Product }) {
  const avail = availabilityOf(p);
  const price = effectivePrice(p);
  const sale = onSale(p);
  const [first, second] = p.images ?? [];

  return (
    <Link href={`/product/${p.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-fog">
        {first ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img(first, 600)}
              alt={p.name}
              loading="lazy"
              className={`h-full w-full object-cover transition duration-500 ${avail === "soldout" ? "opacity-50" : ""}`}
            />
            {second && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img(second, 600)}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="grid h-full place-items-center px-4 text-center font-display text-lg text-ink/30">{p.name}</div>
        )}

        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {sale && avail !== "soldout" && (
            <span className="bg-ink px-2 py-1 text-xs font-semibold tracking-wide text-white">−{p.discountPercent}%</span>
          )}
          {avail === "preorder" && (
            <span className="border border-ink bg-white px-2 py-1 text-xs font-semibold tracking-wide">PRE-ORDER</span>
          )}
          {avail === "soldout" && (
            <span className="border border-line bg-white px-2 py-1 text-xs font-semibold tracking-wide text-ink/60">SOLD OUT</span>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-0.5">
        <p className="text-xs uppercase tracking-widest text-ink/50">{p.category}</p>
        <h3 className="font-medium leading-snug group-hover:underline">{p.name}</h3>
        <p className="text-sm">
          <span className="font-semibold">{naira(price)}</span>
          {sale && <span className="ml-2 text-ink/50 line-through">{naira(p.price)}</span>}
        </p>
      </div>
    </Link>
  );
}
