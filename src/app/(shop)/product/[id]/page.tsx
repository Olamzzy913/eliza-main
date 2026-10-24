"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useShopProduct } from "@/lib/hooks";
import { useShop } from "@/context/ShopContext";
import { naira } from "@/lib/format";
import { availabilityOf, effectivePrice, onSale, stockFor } from "@/lib/pricing";
import { img } from "@/lib/cloudinary";

const PREORDER_MAX = 10;

function ProductView() {
  const { id } = useParams<{ id: string }>();
  const { product: p, loading } = useShopProduct(id);
  const { add } = useShop();

  const [photo, setPhoto] = useState(0);
  const [picked, setPicked] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const hasVariants = !!p?.variants?.length;

  // Default to the first property that can be bought
  const variant = useMemo(() => {
    if (!p || !p.variants?.length) return "";
    if (picked && p.variants.some((v) => v.name === picked)) return picked;
    const open = p.variants.find((v) => v.qty > 0) ?? (p.preorder ? p.variants[0] : undefined);
    return open?.name ?? "";
  }, [p, picked]);

  if (loading) return <main className="mx-auto max-w-6xl px-4 py-16 text-sm text-ink/60 sm:px-6">Loading…</main>;

  if (!p) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-semibold">This product isn&apos;t available</h1>
        <p className="mt-2 text-ink/70">It may have been removed or hidden.</p>
        <Link href="/" className="mt-6 inline-block bg-ink px-6 py-3 text-sm font-medium text-white">Back to the shop</Link>
      </main>
    );
  }

  const images = p.images ?? [];
  const price = effectivePrice(p);
  const sale = onSale(p);
  const avail = availabilityOf(p, variant);
  const canBuy = avail !== "soldout" && (!hasVariants || !!variant);
  const max = avail === "in" ? stockFor(p, variant) : PREORDER_MAX;
  const q = Math.min(Math.max(1, qty), Math.max(1, max));

  function addToCart() {
    if (!p || !canBuy) return;
    add({
      productId: p.id,
      name: p.name,
      image: p.images?.[0] ?? "",
      variant,
      quantity: q,
      unitPrice: price,
      originalPrice: p.price,
      preorder: avail === "preorder",
      maxQty: max,
    });
    setAdded(true);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink/60">
        <Link href="/" className="hover:underline">Shop</Link> <span aria-hidden>/</span> {p.name}
      </nav>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        {/* gallery */}
        <div>
          <div className="relative aspect-[4/5] overflow-hidden bg-fog">
            {images[photo] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img(images[photo], 1000)} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center font-display text-2xl text-ink/30">{p.name}</div>
            )}
            {sale && avail !== "soldout" && (
              <span className="absolute left-3 top-3 bg-ink px-3 py-1.5 text-sm font-semibold text-white">−{p.discountPercent}%</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setPhoto(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={photo === i}
                  className={`h-20 w-16 shrink-0 overflow-hidden border-2 ${photo === i ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(url, 160)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* details */}
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-ink/50">{p.category}</p>
            <h1 className="mt-1 font-display text-3xl font-semibold leading-tight sm:text-4xl">{p.name}</h1>
            <p className="mt-3 flex flex-wrap items-baseline gap-3 text-2xl">
              <span className="font-semibold">{naira(price)}</span>
              {sale && (
                <>
                  <span className="text-lg text-ink/50 line-through">{naira(p.price)}</span>
                  <span className="bg-ink px-2 py-0.5 text-sm font-semibold text-white">Save {naira(p.price - price)}</span>
                </>
              )}
            </p>
          </div>

          {avail === "preorder" && (
            <p className="border border-ink p-3 text-sm">
              <b>Pre-order.</b> This one is out of stock right now. Order today and we&apos;ll get it to you as soon as it arrives.
            </p>
          )}
          {avail === "soldout" && <p className="border border-line bg-fog p-3 text-sm">Sold out for now.</p>}

          {hasVariants && (
            <div>
              <p className="mb-2 text-sm font-medium">
                {p.variantLabel || "Option"}
                {variant && <span className="font-normal text-ink/60">: {variant}</span>}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={p.variantLabel || "Options"}>
                {p.variants!.map((v) => {
                  const out = v.qty === 0;
                  const disabled = out && !p.preorder;
                  return (
                    <button
                      key={v.name}
                      onClick={() => { setPicked(v.name); setAdded(false); setQty(1); }}
                      disabled={disabled}
                      aria-pressed={variant === v.name}
                      className={`min-w-14 border px-4 py-2 text-sm transition ${
                        variant === v.name ? "border-ink bg-ink text-white" : "border-line hover:border-ink"
                      } ${disabled ? "cursor-not-allowed text-ink/30 line-through hover:border-line" : ""}`}
                    >
                      {v.name}
                      {out && p.preorder && <span className="ml-1.5 text-[10px] uppercase opacity-70">pre-order</span>}
                    </button>
                  );
                })}
              </div>
              {avail === "in" && max <= 5 && <p className="mt-2 text-xs text-ink/60">Only {max} left</p>}
            </div>
          )}

          {!hasVariants && avail === "in" && max <= 5 && <p className="text-xs text-ink/60">Only {max} left</p>}

          {canBuy && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center border border-line" role="group" aria-label="Quantity">
                <button onClick={() => { setQty(Math.max(1, q - 1)); setAdded(false); }} aria-label="Decrease quantity" className="p-3 hover:bg-fog">
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center text-sm" aria-live="polite">{q}</span>
                <button onClick={() => { setQty(Math.min(max, q + 1)); setAdded(false); }} disabled={q >= max} aria-label="Increase quantity" className="p-3 hover:bg-fog disabled:opacity-30">
                  <Plus size={16} />
                </button>
              </div>
              <button onClick={addToCart} className="flex-1 bg-ink px-6 py-3.5 text-sm font-medium text-white hover:bg-ink-soft sm:flex-none sm:px-10">
                {avail === "preorder" ? "Pre-order now" : "Add to cart"}
              </button>
            </div>
          )}

          {added && (
            <p role="status" className="flex flex-wrap items-center gap-3 bg-fog p-3 text-sm">
              Added to your cart.
              <Link href="/cart" className="font-semibold underline">View cart</Link>
              <Link href="/" className="underline">Keep shopping</Link>
            </p>
          )}

          {p.description && (
            <div className="border-t border-line pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest">Details</h2>
              <p className="mt-3 whitespace-pre-line text-ink/80">{p.description}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-16 text-sm text-ink/60 sm:px-6">Loading…</main>}>
      <ProductView />
    </Suspense>
  );
}
