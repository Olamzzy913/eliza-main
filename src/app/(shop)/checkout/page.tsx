"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useShop, type CartItem } from "@/context/ShopContext";
import { naira } from "@/lib/format";
import { effectivePrice, lineUnit, stockFor } from "@/lib/pricing";
import { generateOrderCode } from "@/lib/orders";
import { saveRecentOrder } from "@/lib/recent";
import { img } from "@/lib/cloudinary";
import { BankCard } from "@/components/BankCard";
import type { OrderItem, Product } from "@/lib/types";

/** Re-check every cart line against the live product so prices, stock and options can't be stale. */
async function checkLines(lines: CartItem[]) {
  const fresh: CartItem[] = [];
  const items: OrderItem[] = [];
  let priceChanged = false;
  const used = new Map<string, number>(); // in-stock pieces already claimed per product + property

  for (const line of lines) {
    let p: Product;
    try {
      const snap = await getDoc(doc(db, "products", line.productId));
      if (!snap.exists()) throw new Error();
      p = { id: snap.id, ...snap.data() } as Product;
    } catch {
      throw new Error(`${line.name} isn't available any more. Please remove it from your cart.`);
    }

    const label = `${line.name}${line.variant ? ` (${line.variant})` : ""}`;
    if (p.variants?.length && !p.variants.some((v) => v.name === line.variant)) {
      throw new Error(`${label} isn't available any more. Please remove it from your cart.`);
    }

    const stock = stockFor(p, line.variant || undefined);
    if (line.preorder) {
      if (!p.preorder) throw new Error(`${label} is no longer open for pre-order. Please remove it from your cart.`);
    } else {
      const stockKey = `${p.id}|${line.variant}`;
      const total = (used.get(stockKey) ?? 0) + line.quantity;
      if (total > stock) {
        throw new Error(
          stock > 0
            ? `Only ${stock} of ${label} left. Please lower the quantity.`
            : p.preorder
            ? `${label} just sold out. Remove it and add it again to pre-order.`
            : `${label} just sold out. Please remove it from your cart.`
        );
      }
      used.set(stockKey, total);
    }

    if (line.styled && !p.stylingAvailable) {
      throw new Error(`Styling is no longer offered for ${label}. Please remove it and add it again.`);
    }

    const price = effectivePrice(p);
    const fee = line.styled ? p.stylingFee ?? 0 : 0;
    if (price !== line.unitPrice || fee !== (line.stylingFee ?? 0)) priceChanged = true;
    const extras = (p.extras ?? []).map((e) => e.name);

    fresh.push({
      ...line,
      unitPrice: price,
      originalPrice: p.price,
      stylingFee: fee,
      payOnDelivery: !!p.payOnDelivery,
      extras,
      premium: !!p.premium,
      maxQty: line.preorder ? 10 : stock,
    });
    items.push({
      productId: p.id,
      name: p.name,
      variant: line.variant,
      image: p.images?.[0] ?? "",
      quantity: line.quantity,
      unitPrice: price,
      originalPrice: p.price,
      preorder: !!line.preorder,
      styled: !!line.styled,
      stylingFee: fee,
      styleNote: line.styled ? line.styleNote ?? "" : "",
      extras,
      premium: !!p.premium,
    });
  }
  return { fresh, items, priceChanged };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items: cart, subtotal, ready, settings, clear, replaceAll } = useShop();

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    note: "",
    paymentMethod: "transfer" as "transfer" | "delivery",
  });
  const [zoneId, setZoneId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!ready) return <main className="mx-auto max-w-4xl px-4 py-16 text-sm text-ink/60">Loading…</main>;

  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-semibold">Nothing to check out</h1>
        <p className="mt-2 text-ink/70">Add something to your cart first.</p>
        <Link href="/" className="btn-primary mt-6">Back to the shop</Link>
      </main>
    );
  }

  const zones = settings.deliveryZones;
  const zone = zones.find((z) => z.id === zoneId);
  const deliveryFee = zone && !zone.free ? zone.fee : 0;
  const total = subtotal + deliveryFee;

  const podBlockers = cart.filter((i) => !i.payOnDelivery);
  const podAllowed = podBlockers.length === 0;
  const method = podAllowed ? form.paymentMethod : "transfer";
  const hasPreorder = cart.some((i) => i.preorder);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.phone.replace(/\D/g, "").length < 7) {
      setError("Please enter a phone number we can reach you on.");
      return;
    }
    if (zones.length > 0 && !zone) {
      setError("Please choose your delivery region so we can work out delivery.");
      return;
    }
    setBusy(true);
    try {
      const { fresh, items, priceChanged } = await checkLines(cart);
      if (priceChanged) {
        replaceAll(fresh);
        setError("Some prices changed while you were shopping. We've updated your cart. Please check the total and place your order again.");
        setBusy(false);
        return;
      }
      if (method === "delivery" && fresh.some((i) => !i.payOnDelivery)) {
        replaceAll(fresh);
        setError("Pay on delivery isn't available for everything in your cart. Please choose bank transfer.");
        setBusy(false);
        return;
      }

      const subtotalNow = items.reduce((s, i) => s + lineUnit(i) * i.quantity, 0);
      const code = generateOrderCode();
      const orderTotal = subtotalNow + deliveryFee;

      await setDoc(doc(db, "orders", code), {
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        deliveryZone: zone?.name ?? "",
        note: form.note.trim(),
        paymentMethod: method,
        paid: false,
        items,
        subtotal: subtotalNow,
        deliveryFee,
        total: orderTotal,
        status: "pending",
        history: [{ status: "pending", at: Timestamp.now() }],
        adminNote: "",
        createdAt: serverTimestamp(),
      });

      saveRecentOrder(code, orderTotal);
      clear();
      router.push(`/track/${code}?new=1`);
    } catch (err) {
      setError(
        err instanceof Error && err.message && !err.message.includes("permission")
          ? err.message
          : "We couldn't place your order. Please check your details and try again."
      );
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">Checkout</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <form onSubmit={placeOrder} className="space-y-8">
          <fieldset className="space-y-4">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-[0.2em]">1. Your details</legend>
            <label className="block text-sm font-medium">
              Full name
              <input required autoComplete="name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="field" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Phone number
                <input required type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="field" />
              </label>
              <label className="block text-sm font-medium">
                Email (optional)
                <input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field" />
              </label>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-[0.2em]">2. Delivery</legend>

            {zones.length > 0 && (
              <label className="block text-sm font-medium">
                Delivery region
                <select required value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="field">
                  <option value="">Choose your region</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} — {z.free || z.fee === 0 ? "Free delivery" : naira(z.fee)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {zone && (
              <p className={`rounded-xl p-3 text-sm ${zone.free || zone.fee === 0 ? "bg-green-50 text-go" : "bg-fog"}`}>
                {zone.free || zone.fee === 0 ? (
                  <>Delivery to <b>{zone.name}</b> is <b>free</b>.</>
                ) : (
                  <>Delivery to <b>{zone.name}</b> costs <b>{naira(zone.fee)}</b>.</>
                )}
              </p>
            )}

            <label className="block text-sm font-medium">
              Street address
              <input required autoComplete="street-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="field" />
            </label>
            <label className="block text-sm font-medium">
              {zones.length > 0 ? "Area or landmark (optional)" : "City and state"}
              <input
                required={zones.length === 0}
                autoComplete="address-level2"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder={zones.length > 0 ? "Near the filling station" : "Ikeja, Lagos"}
                className="field"
              />
            </label>
            {zones.length === 0 && <p className="text-xs text-ink/60">We&apos;ll confirm the delivery cost with you after you order.</p>}
            <label className="block text-sm font-medium">
              Note for us (optional)
              <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="field" />
            </label>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-[0.2em]">3. Payment</legend>

            <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${method === "transfer" ? "border-ink bg-fog" : "border-line"}`}>
              <input type="radio" name="payment" checked={method === "transfer"} onChange={() => setForm({ ...form, paymentMethod: "transfer" })} className="mt-1" />
              <span>
                <span className="block text-sm font-medium">Bank transfer</span>
                <span className="block text-xs text-ink/60">Pay into our account. The details are shown right here and again after you order.</span>
              </span>
            </label>

            {method === "transfer" && <BankCard settings={settings} amount={total} />}

            <label
              className={`flex items-start gap-3 rounded-2xl border p-4 ${
                podAllowed ? "cursor-pointer" : "cursor-not-allowed opacity-60"
              } ${method === "delivery" ? "border-ink bg-fog" : "border-line"}`}
            >
              <input
                type="radio"
                name="payment"
                disabled={!podAllowed}
                checked={method === "delivery"}
                onChange={() => setForm({ ...form, paymentMethod: "delivery" })}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium">Pay on delivery</span>
                <span className="block text-xs text-ink/60">
                  {podAllowed
                    ? "Pay when your order reaches you."
                    : `Not available for ${podBlockers.map((i) => i.name).join(", ")}. Remove ${podBlockers.length > 1 ? "them" : "it"} to pay on delivery.`}
                </span>
              </span>
            </label>
          </fieldset>

          {error && <p role="alert" className="rounded-xl border border-ink bg-fog p-4 text-sm font-medium">{error}</p>}

          <button disabled={busy} className="btn-primary w-full py-4 text-base">
            {busy ? "Placing your order…" : `Place order · ${naira(total)}`}
          </button>
        </form>

        <aside className="card h-fit p-5 lg:sticky lg:top-24">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">Order summary</h2>
          <ul className="mt-4 divide-y divide-line">
            {cart.map((i) => (
              <li key={i.key} className="flex gap-3 py-3 text-sm">
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-fog">
                  {i.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img(i.image, 120)} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{i.name}</p>
                  <p className="text-xs text-ink/60">
                    {i.variant && `${i.variant} · `}Qty {i.quantity}
                    {i.preorder && " · Pre-order"}
                    {i.styled && " · Styled"}
                  </p>
                </div>
                <p className="font-medium">{naira(lineUnit(i) * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{naira(subtotal)}</span></div>
            <div className="flex justify-between text-ink/70">
              <span>Delivery{zone ? ` (${zone.name})` : ""}</span>
              <span>
                {zones.length > 0 && !zone ? "Choose a region" : deliveryFee > 0 ? naira(deliveryFee) : "Free"}
              </span>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
              <span>Total</span><span>{naira(total)}</span>
            </div>
          </div>
          {hasPreorder && <p className="mt-3 rounded-xl bg-gold-soft p-3 text-xs text-ink/70">Pre-order items are sent once they arrive in stock.</p>}
          <Link href="/cart" className="mt-4 block text-sm underline">Edit cart</Link>
        </aside>
      </div>
    </main>
  );
}
