"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useShopProducts } from "@/lib/hooks";
import { effectivePrice, onSale } from "@/lib/pricing";
import { useShop } from "@/context/ShopContext";
import { ProductCard } from "@/components/ProductCard";

type Sort = "new" | "low" | "high";

export default function ShopHome() {
  const { settings } = useShop();
  const { data: products, loading, error } = useShopProducts();
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("new");

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products]);
  const hasSale = products.some(onSale);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (category === "All" || (category === "On sale" ? onSale(p) : p.category === category)) &&
        (!q || p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q))
    );
    if (sort === "low") list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    if (sort === "high") list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    return list;
  }, [products, category, search, sort]);

  const chip = (active: boolean) =>
    `whitespace-nowrap border px-4 py-2 text-sm transition ${
      active ? "border-ink bg-ink text-white" : "border-line hover:border-ink"
    }`;

  return (
    <main>
      <section className="border-b border-line bg-fog">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-xs uppercase tracking-[0.25em] text-ink/60">New in store</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-6xl">
            {settings.storeName}
          </h1>
          <p className="mt-4 max-w-xl text-base text-ink/70 sm:text-lg">{settings.tagline}</p>
          <a href="#shop" className="mt-8 inline-block bg-ink px-6 py-3 text-sm font-medium text-white hover:bg-ink-soft">
            Shop the collection
          </a>
        </div>
      </section>

      <section id="shop" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="-mx-4 flex flex-1 gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="Categories">
            <button onClick={() => setCategory("All")} aria-pressed={category === "All"} className={chip(category === "All")}>
              All
            </button>
            {hasSale && (
              <button onClick={() => setCategory("On sale")} aria-pressed={category === "On sale"} className={chip(category === "On sale")}>
                On sale
              </button>
            )}
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)} aria-pressed={category === c} className={chip(category === c)}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <div className="relative min-w-52 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="w-full border border-line py-2.5 pl-9 pr-3 text-sm"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Sort products"
            className="border border-line bg-white px-3 py-2.5 text-sm"
          >
            <option value="new">Newest</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </div>

        {error && <p role="alert" className="mt-8 border border-ink p-4 text-sm font-medium">{error}</p>}
        {loading && <p className="mt-10 text-sm text-ink/60">Loading products…</p>}
        {!loading && !error && products.length === 0 && (
          <p className="mt-10 text-center text-ink/60">New products are coming soon. Check back shortly.</p>
        )}
        {!loading && products.length > 0 && shown.length === 0 && (
          <p className="mt-10 text-center text-ink/60">Nothing matches your search. Try another word or category.</p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>
    </main>
  );
}
