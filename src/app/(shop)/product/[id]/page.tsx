"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Banknote, Check, ChevronLeft, ChevronRight, Crown, Heart, MessageCircle, Minus, PackageSearch, Plus, Scissors, X } from "lucide-react";
import { useShopProduct, useShopProducts } from "@/lib/hooks";
import { useShop } from "@/context/ShopContext";
import { naira } from "@/lib/format";
import { availabilityOf, effectivePrice, onSale, stockFor } from "@/lib/pricing";
import { img } from "@/lib/cloudinary";
import { trackView } from "@/lib/views";
import { getViewed, pushViewed } from "@/lib/recentViewed";
import { StockBar } from "@/components/StockBar";
import { ProductCard } from "@/components/ProductCard";

const PREORDER_MAX = 10;

function ProductView() {
  const { id } = useParams<{ id: string }>();
  const { product: p, loading } = useShopProduct(id);
  const all = useShopProducts();
  const { add, settings, saved, toggleSaved } = useShop();

  const [photo, setPhoto] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [picked, setPicked] = useState("");
  const [qty, setQty] = useState(1);
  const [styled, setStyled] = useState(false);
  const [styleNote, setStyleNote] = useState("");
  const [added, setAdded] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [viewedIds, setViewedIds] = useState<string[]>([]);

  const hasVariants = !!p?.variants?.length;
  const found = !!p;
  const productName = p?.name;

  useEffect(() => {
    if (!found) return;
    trackView(id);
    setViewedIds(getViewed().filter((v) => v !== id));
    pushViewed(id);
  }, [found, id]);

  useEffect(() => {
    setPageUrl(window.location.href);
  }, [id]);

  useEffect(() => {
    if (productName) document.title = `${productName} · ${settings.storeName}`;
  }, [productName, settings.storeName]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoom(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  // Default to the first property that can be bought
  const variant = useMemo(() => {
    if (!p || !p.variants?.length) return "";
    if (picked && p.variants.some((v) => v.name === picked)) return picked;
    const open = p.variants.find((v) => v.qty > 0) ?? (p.preorder ? p.variants[0] : undefined);
    return open?.name ?? "";
  }, [p, picked]);

  const related = useMemo(
    () => (p ? all.data.filter((x) => x.id !== p.id && x.category === p.category).slice(0, 4) : []),
    [all.data, p]
  );
  const recent = useMemo(
    () => viewedIds.map((v) => all.data.find((x) => x.id === v)).filter((x): x is NonNullable<typeof x> => !!x).slice(0, 4),
    [viewedIds, all.data]
  );

  if (loading) {
    return (
      <main className="mx-auto grid max-w-6xl animate-pulse gap-8 px-4 py-12 sm:px-6 md:grid-cols-2" aria-busy="true">
        <div className="aspect-[4/5] rounded-2xl bg-fog" />
        <div className="space-y-4"><div className="h-4 w-1/4 rounded bg-fog" /><div className="h-10 w-3/4 rounded bg-fog" /><div className="h-6 w-1/3 rounded bg-fog" /></div>
      </main>
    );
  }

  if (!p) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-semibold">This product isn&apos;t available</h1>
        <p className="mt-2 text-ink/70">It may have been removed or hidden.</p>
        <Link href="/" className="btn-primary mt-6">Back to the shop</Link>
      </main>
    );
  }

  const images = p.images ?? [];
  const price = effectivePrice(p);
  const sale = onSale(p);
  const avail = availabilityOf(p, variant);
  const left = stockFor(p, variant);
  const canPre = !!p.preorder;
  const maxTotal = left + (canPre ? PREORDER_MAX : 0);
  const canBuy = (left > 0 || canPre) && (!hasVariants || !!variant);
  const q = Math.min(Math.max(1, qty), Math.max(1, maxTotal));
  const fromStock = Math.min(q, left);
  const fromPre = q - fromStock;
  const styleFee = styled && p.stylingAvailable ? p.stylingFee ?? 0 : 0;
  const unitShown = price + styleFee;
  const extras = p.extras ?? [];
  const benefits = p.benefits ?? [];
  const preorderOnly = fromStock === 0 && fromPre > 0;
  const buyLabel = preorderOnly ? "Pre-order now" : "Add to cart";
  const wa = settings.whatsapp.replace(/\D/g, "");
  const isSaved = saved.includes(p.id);

  function addToCart() {
    if (!p || !canBuy) return;
    const useStyle = styled && !!p.stylingAvailable;
    const base = {
      productId: p.id,
      name: p.name,
      image: p.images?.[0] ?? "",
      variant,
      unitPrice: price,
      originalPrice: p.price,
      payOnDelivery: !!p.payOnDelivery,
      styled: useStyle,
      stylingFee: useStyle ? p.stylingFee ?? 0 : 0,
      styleNote: useStyle ? styleNote.trim() : "",
      extras: (p.extras ?? []).map((x) => x.name),
      premium: !!p.premium,
    };
    // Anything beyond what's in stock becomes its own pre-order line
    if (fromStock > 0) add({ ...base, quantity: fromStock, preorder: false, maxQty: left });
    if (fromPre > 0) add({ ...base, quantity: fromPre, preorder: true, maxQty: PREORDER_MAX });
    setAdded(true);
  }

  const step = (n: number) => { setQty(Math.min(maxTotal, Math.max(1, q + n))); setAdded(false); };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 pb-28 sm:px-6 sm:py-12 md:pb-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink/60">
        <Link href="/" className="hover:underline">Shop</Link> <span aria-hidden>/</span> {p.name}
      </nav>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        <div>
          <button
            onClick={() => images[photo] && setZoom(true)}
            aria-label="Open photo larger"
            className={`relative block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-fog ${p.premium ? "ring-2 ring-gold ring-offset-4" : ""} ${images[photo] ? "cursor-zoom-in" : "cursor-default"}`}
          >
            {images[photo] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img(images[photo], 1000)} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center font-display text-2xl text-ink/30">{p.name}</div>
            )}
            <span className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
              {p.premium && <span className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-bold tracking-wider text-gold shadow"><Crown size={13} /> PREMIUM</span>}
              {sale && avail !== "soldout" && <span className="rounded-full bg-sale px-3 py-1.5 text-sm font-bold text-white shadow">−{p.discountPercent}%</span>}
              {avail === "preorder" && <span className="rounded-full bg-gold px-3 py-1.5 text-xs font-bold tracking-wider text-ink shadow">PRE-ORDER</span>}
            </span>
          </button>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((url, i) => (
                <button key={url} onClick={() => setPhoto(i)} aria-label={`Show photo ${i + 1}`} aria-current={photo === i} className={`h-20 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${photo === i ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(url, 160)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{p.category}</p>
                <h1 className="mt-1 font-display text-3xl font-semibold leading-tight sm:text-4xl">{p.name}</h1>
              </div>
              <button
                onClick={() => toggleSaved(p.id)}
                aria-pressed={isSaved}
                aria-label={isSaved ? "Remove from saved" : "Save for later"}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line hover:border-ink"
              >
                <Heart size={20} className={isSaved ? "text-sale" : ""} fill={isSaved ? "currentColor" : "none"} />
              </button>
            </div>
            <p className="mt-3 flex flex-wrap items-baseline gap-3">
              <span className={`text-3xl font-semibold ${sale ? "text-sale" : ""}`}>{naira(price)}</span>
              {sale && (
                <>
                  <span className="text-lg text-ink/45 line-through">{naira(p.price)}</span>
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-sm font-semibold text-sale">Save {naira(p.price - price)}</span>
                </>
              )}
            </p>
            {p.payOnDelivery && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-go/40 bg-green-50 px-3 py-1 text-xs font-semibold text-go">
                <Banknote size={14} /> Pay on delivery available
              </p>
            )}
          </div>

          {(avail === "preorder" || (canPre && left === 0)) && (
            <div className="rounded-2xl border border-gold bg-gold-soft p-4 text-sm">
              <p className="font-semibold">Available for pre-order</p>
              <p className="mt-1 text-ink/70">
                {p.preorderNote ? `${p.preorderNote}. ` : ""}It&apos;s out of stock right now. Order today and we&apos;ll send it as soon as it arrives. You can follow it on your tracking page.
              </p>
            </div>
          )}
          {!canBuy && <p className="rounded-2xl bg-fog p-4 text-sm">Sold out for now.</p>}

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
                      className={`min-w-14 rounded-full border px-4 py-2 text-sm transition ${variant === v.name ? "border-ink bg-ink text-white" : "border-line hover:border-ink"} ${disabled ? "cursor-not-allowed text-ink/30 line-through hover:border-line" : ""}`}
                    >
                      {v.name}
                      {out && p.preorder && <span className="ml-1.5 text-[10px] uppercase opacity-70">pre-order</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {left > 0 && <StockBar left={left} low={Math.max(3, p.lowStockAt ?? 0)} />}

          {p.stylingAvailable && (
            <div className={`rounded-2xl border p-4 ${styled ? "border-ink bg-fog" : "border-line"}`}>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={styled} onChange={(e) => { setStyled(e.target.checked); setAdded(false); }} className="mt-1" />
                <span>
                  <span className="flex items-center gap-2 text-sm font-semibold"><Scissors size={15} /> Deliver it styled <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-900">+{naira(p.stylingFee ?? 0)}</span></span>
                  <span className="block text-xs text-ink/60">We style it for you before it&apos;s delivered.</span>
                </span>
              </label>
              {styled && (
                <label className="mt-3 block text-sm font-medium">
                  What style do you want?
                  <textarea
                    rows={2}
                    maxLength={200}
                    value={styleNote}
                    onChange={(e) => setStyleNote(e.target.value)}
                    placeholder="e.g. Bone straight, 24 inches, side part"
                    className="field"
                  />
                </label>
              )}
            </div>
          )}

          {canBuy && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center rounded-full border border-line" role="group" aria-label="Quantity">
                  <button onClick={() => step(-1)} aria-label="Decrease quantity" className="rounded-full p-3 hover:bg-fog"><Minus size={16} /></button>
                  <span className="w-10 text-center text-sm" aria-live="polite">{q}</span>
                  <button onClick={() => step(1)} disabled={q >= maxTotal} aria-label="Increase quantity" className="rounded-full p-3 hover:bg-fog disabled:opacity-30"><Plus size={16} /></button>
                </div>
                <button onClick={addToCart} className="btn-primary hidden flex-1 py-3.5 sm:px-12 md:inline-flex md:flex-none">
                  {buyLabel} · {naira(unitShown * q)}
                </button>
              </div>
              {fromStock > 0 && fromPre > 0 && (
                <p className="rounded-xl bg-gold-soft p-3 text-sm">
                  Only {left} {left === 1 ? "is" : "are"} in stock. <b>{fromStock}</b> will ship from stock and <b>{fromPre}</b> will be a pre-order.
                </p>
              )}
              {styleFee > 0 && <p className="text-xs text-ink/60">Includes {naira(styleFee)} styling on each.</p>}
            </div>
          )}

          {added && (
            <p role="status" className="flex flex-wrap items-center gap-3 rounded-2xl bg-fog p-4 text-sm">
              Added to your cart.
              <Link href="/cart" className="font-semibold underline">View cart</Link>
              <Link href="/" className="underline">Keep shopping</Link>
            </p>
          )}

          {(p.premium || extras.length > 0) && (
            <section className={`rounded-2xl p-5 ${p.premium ? "border-2 border-gold bg-gold-soft/50" : "border border-line"}`} aria-label={p.premium ? "Premium package" : "Free extras"}>
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]">
                {p.premium && <Crown size={16} className="text-gold" />}
                {p.premium ? "Premium package" : "Free with this product"}
              </h2>
              {p.premium && benefits.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {benefits.map((b) => (
                    <li key={b} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-go" /> {b}</li>
                  ))}
                </ul>
              )}
              {extras.length > 0 && (
                <>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-ink/60">{p.premium ? "Plus these free extras" : "Comes with"}</p>
                  <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {extras.map((e) => (
                      <li key={e.id}>
                        <div className="aspect-square overflow-hidden rounded-xl bg-white">
                          {e.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img(e.image, 300)} alt={e.name} loading="lazy" className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full place-items-center text-xs text-ink/30">{e.name}</div>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs font-medium leading-tight">{e.name}</p>
                        <span className="text-[10px] font-bold tracking-wider text-go">FREE</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}

          {settings.deliveryZones.length > 0 && (
            <div className="card p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">Delivery rates</h2>
              <ul className="mt-3 divide-y divide-line text-sm">
                {settings.deliveryZones.map((z) => (
                  <li key={z.id} className="flex justify-between py-2">
                    <span>{z.name}</span>
                    {z.free || z.fee === 0 ? <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-go">Free</span> : <span className="font-medium">{naira(z.fee)}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink/60">
            <span className="flex items-center gap-2"><PackageSearch size={16} /> You&apos;ll get a code to track your order live.</span>
            {wa && (
              <a
                href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hello, I'm interested in ${p.name}. ${pageUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 font-medium text-ink underline"
              >
                <MessageCircle size={16} /> Ask about this on WhatsApp
              </a>
            )}
          </div>

          {p.description && (
            <div className="border-t border-line pt-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">Details</h2>
              <p className="mt-3 whitespace-pre-line text-ink/80">{p.description}</p>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {related.map((r) => (<ProductCard key={r.id} p={r} />))}
          </div>
        </section>
      )}
      {recent.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold">Recently viewed</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {recent.map((r) => (<ProductCard key={r.id} p={r} />))}
          </div>
        </section>
      )}

      {/* sticky buy bar on phones */}
      {canBuy && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 p-3 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="shrink-0">
              <p className="text-xs text-ink/60">{q} × {naira(unitShown)}</p>
              <p className="font-semibold">{naira(unitShown * q)}</p>
            </div>
            <button onClick={addToCart} className="btn-primary flex-1 py-3.5">{buyLabel}</button>
          </div>
        </div>
      )}

      {zoom && images[photo] && (
        <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setZoom(false)}>
          <button onClick={() => setZoom(false)} aria-label="Close photo viewer" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"><X size={22} /></button>
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setPhoto((photo - 1 + images.length) % images.length); }} aria-label="Previous photo" className="absolute left-3 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"><ChevronLeft size={24} /></button>
              <button onClick={(e) => { e.stopPropagation(); setPhoto((photo + 1) % images.length); }} aria-label="Next photo" className="absolute right-3 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"><ChevronRight size={24} /></button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(images[photo], 1600)} alt={p.name} onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full object-contain" />
        </div>
      )}
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
