"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, Clock, MessageCircle, PackageSearch, Search } from "lucide-react";
import { useShopProducts } from "@/lib/hooks";
import { availabilityOf, canPreorderNow, effectivePrice, onSale } from "@/lib/pricing";
import { img } from "@/lib/cloudinary";
import { getViewed } from "@/lib/recentViewed";
import { useShop } from "@/context/ShopContext";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

type Sort = "new" | "low" | "high";

const TRUST = [
  { icon: PackageSearch, title: "Track every order", text: "Follow your order live with a tracking code." },
  { icon: Banknote, title: "Pay on delivery", text: "Available on selected products." },
  { icon: Clock, title: "Pre-order favourites", text: "Sold out? Reserve it for when it's back." },
  { icon: MessageCircle, title: "We're a message away", text: "Chat with us on WhatsApp." },
];

function Row({ eyebrow, title, items, tone = "" }: { eyebrow: string; title: string; items: Product[]; tone?: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
      <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${tone || "text-ink/50"}`}>{eyebrow}</p>
      <h2 className="mt-1 font-display text-3xl font-semibold">{title}</h2>
      <div className="-mx-4 mt-6 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {items.map((p) => (
          <ProductCard key={p.id} p={p} className="w-44 shrink-0 snap-start sm:w-56" />
        ))}
      </div>
    </section>
  );
}

export default function ShopHome() {
  const { settings, saved } = useShop();
  const { data: products, loading, error } = useShopProducts();
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("new");
  const [viewedIds, setViewedIds] = useState<string[]>([]);

  useEffect(() => setViewedIds(getViewed()), []);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products]);
  const saleItems = useMemo(() => products.filter((p) => onSale(p) && availabilityOf(p) !== "soldout"), [products]);
  const premium = useMemo(() => products.filter((p) => p.premium), [products]);
  const preorders = useMemo(() => products.filter(canPreorderNow), [products]);
  const featured = useMemo(() => products.filter((p) => p.images?.[0]).slice(0, 3), [products]);
  const viewed = useMemo(
    () => viewedIds.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p).slice(0, 8),
    [viewedIds, products]
  );
  const tiles = useMemo(
    () =>
      categories
        .map((c) => ({ name: c, image: products.find((p) => p.category === c && p.images?.[0])?.images?.[0] ?? "", count: products.filter((p) => p.category === c).length }))
        .slice(0, 4),
    [categories, products]
  );

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      const inCategory =
        category === "All" ||
        (category === "On sale" && onSale(p)) ||
        (category === "Premium" && !!p.premium) ||
        (category === "Pre-order" && canPreorderNow(p)) ||
        (category === "Saved" && saved.includes(p.id)) ||
        p.category === category;
      return inCategory && (!q || p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
    });
    if (sort === "low") list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    if (sort === "high") list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    return list;
  }, [products, category, search, sort, saved]);

  const goTo = (c: string) => {
    setCategory(c);
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  };

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${active ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`;

  const filters = [
    "All",
    ...(saleItems.length ? ["On sale"] : []),
    ...(premium.length ? ["Premium"] : []),
    ...(preorders.length ? ["Pre-order"] : []),
    ...(saved.length ? ["Saved"] : []),
    ...categories,
  ];

  return (
    <main>
      {/* hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold/20 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">New in store</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] sm:text-6xl">{settings.storeName}</h1>
            <p className="mt-5 max-w-md text-base text-white/70 sm:text-lg">{settings.tagline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#shop" className="btn-light">Shop the collection</a>
              <Link href="/track" className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-medium transition hover:bg-white/10">
                Track your order
              </Link>
            </div>
          </div>

          <div className="relative hidden h-[26rem] md:block" aria-hidden>
            {featured.length > 0 ? (
              featured.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id}
                  src={img(p.images![0], 500)}
                  alt=""
                  className="absolute h-72 w-52 rounded-2xl border-4 border-ink object-cover shadow-2xl"
                  style={{ left: `${i * 28}%`, top: `${i % 2 === 0 ? 0 : 22}%`, transform: `rotate(${i === 1 ? 3 : -3}deg)`, zIndex: i }}
                />
              ))
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid h-64 w-64 place-items-center rounded-full border border-gold/50 font-display text-8xl text-gold">{settings.storeName[0]}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* trust strip */}
      <section className="border-b border-line bg-fog">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink shadow-sm"><Icon size={18} /></span>
              <span className="text-sm">
                <span className="block font-semibold">{title}</span>
                <span className="block text-ink/60">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* shop by category */}
      {tiles.length > 1 && (
        <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
          <h2 className="font-display text-3xl font-semibold">Shop by category</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {tiles.map((t) => (
              <button key={t.name} onClick={() => goTo(t.name)} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink text-left text-white">
                {t.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img(t.image, 500)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-700 group-hover:scale-105 group-hover:opacity-90" />
                )}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <span className="block font-display text-xl font-semibold">{t.name}</span>
                  <span className="block text-xs text-white/70">{t.count} product{t.count > 1 ? "s" : ""}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <Row eyebrow="Best of the best" title="Premium collection" items={premium} tone="text-gold" />
      <Row eyebrow="Limited time" title="On sale now" items={saleItems} tone="text-sale" />
      <Row eyebrow="Reserve yours" title="Available for pre-order" items={preorders} />

      {/* all products */}
      <section id="shop" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-12 sm:px-6">
        <h2 className="font-display text-3xl font-semibold">Shop everything</h2>

        <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="Categories">
          {filters.map((c) => (
            <button key={c} onClick={() => setCategory(c)} aria-pressed={category === c} className={chip(category === c)}>
              {c === "Premium" ? "♛ Premium" : c === "Saved" ? `♥ Saved (${saved.length})` : c}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <div className="relative min-w-52 flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" aria-label="Search products" className="w-full rounded-full border border-line py-3 pl-11 pr-4 text-sm focus:border-ink" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort products" className="rounded-full border border-line bg-white px-4 py-3 text-sm">
            <option value="new">Newest</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </div>

        {error && <p role="alert" className="mt-8 rounded-xl border border-ink p-4 text-sm font-medium">{error}</p>}

        {loading && (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Loading products">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] rounded-2xl bg-fog" />
                <div className="mt-3 h-3 w-1/3 rounded bg-fog" />
                <div className="mt-2 h-4 w-3/4 rounded bg-fog" />
                <div className="mt-2 h-4 w-1/4 rounded bg-fog" />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && products.length === 0 && <p className="mt-12 rounded-2xl bg-fog p-10 text-center text-ink/60">New products are coming soon. Check back shortly.</p>}
        {!loading && products.length > 0 && shown.length === 0 && (
          <p className="mt-12 rounded-2xl bg-fog p-10 text-center text-ink/60">
            {category === "Saved" ? "Tap the heart on a product to save it here." : "Nothing matches your search. Try another word or category."}
          </p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => (<ProductCard key={p.id} p={p} />))}
        </div>
      </section>

      <Row eyebrow="Pick up where you left off" title="Recently viewed" items={viewed} />
    </main>
  );
}
