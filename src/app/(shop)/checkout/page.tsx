"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useShop, type CartItem } from "@/context/ShopContext";
import { naira } from "@/lib/format";
import { effectivePrice, stockFor } from "@/lib/pricing";
import { generateOrderCode } from "@/lib/orders";
import { saveRecentOrder } from "@/lib/recent";
import { img } from "@/lib/cloudinary";
import type { OrderItem, Product } from "@/lib/types";

/** Re-check every cart line against the live product so prices and stock can't be stale. */
async function checkLines(lines: CartItem[]) {
  const fresh: CartItem[] = [];
  const items: OrderItem[] = [];
  let priceChanged = false;

  for (const line of lines) {
    let p: Product;
    try {
      const snap = await getDoc(doc(db, "products", line.productId));
      if (!snap.exists()) throw new Error();
      p = { id: snap.id, ...snap.data() } as Product;
    } catch {
      throw new Error(`${line.name} isn't available any more. Please remove it from your cart.`);
    }

    if (p.variants?.length && !p.variants.some((v) => v.name === line.variant)) {
      throw new Error(`${line.name} (${line.variant}) isn't available any more. Please remove it from your cart.`);
    }

    const stock = stockFor(p, line.variant || undefined);
    let preorder = false;
    if (stock >= line.quantity) preorder = false;
    else if (stock > 0) throw new Error(`Only ${stock} of ${line.name}${line.variant ? ` (${line.variant})` : ""} left. Please lower the quantity.`);
    else if (p.preorder) preorder = true;
    else throw new Error(`${line.name}${line.variant ? ` (${line.variant})` : ""} just sold out. Please remove it from your cart.`);

    const price = effectivePrice(p);
    if (price !== line.unitPrice) priceChanged = true;

    fresh.push({ ...line, unitPrice: price, originalPrice: p.price, preorder, maxQty: preorder ? 10 : stock });
    items.push({
      productId: p.id,
      name: p.name,
      variant: line.variant,
      image: p.images?.[0] ?? "",
      quantity: line.quantity,
      unitPrice: price,
      originalPrice: p.price,
      preorder,
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!ready) return <main className="mx-auto max-w-4xl px-4 py-16 text-sm text-ink/60">Loading…</main>;

  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-semibold">Nothing to check out</h1>
        <p className="mt-2 text-ink/70">Add something to your cart first.</p>
        <Link href="/" className="mt-6 inline-block bg-ink px-6 py-3 text-sm font-medium text-white">Back to the shop</Link>
      </main>
    );
  }

  const total = subtotal + settings.deliveryFee;
  const hasPreorder = cart.some((i) => i.preorder);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.phone.replace(/\D/g, "").length < 7) {
      setError("Please enter a phone number we can reach you on.");
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

      const subtotalNow = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const code = generateOrderCode();
      const orderTotal = subtotalNow + settings.deliveryFee;

      await setDoc(doc(db, "orders", code), {
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        note: form.note.trim(),
        paymentMethod: form.paymentMethod,
        paid: false,
        items,
        subtotal: subtotalNow,
        deliveryFee: settings.deliveryFee,
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

  const field = "mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm";

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">Checkout</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <form onSubmit={placeOrder} className="space-y-6">
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold uppercase tracking-widest">Your details</legend>
            <label className="block text-sm font-medium">
              Full name
              <input required autoComplete="name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className={field} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Phone number
                <input required type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={field} />
              </label>
              <label className="block text-sm font-medium">
                Email (optional)
                <input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
              </label>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold uppercase tracking-widest">Delivery</legend>
            <label className="block text-sm font-medium">
              Address
              <input required autoComplete="street-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={field} />
            </label>
            <label className="block text-sm font-medium">
              City and state
              <input required autoComplete="address-level2" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ikeja, Lagos" className={field} />
            </label>
            <label className="block text-sm font-medium">
              Note for us (optional)
              <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={field} />
            </label>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold uppercase tracking-widest">Payment</legend>
            {(
              [
                ["transfer", "Bank transfer", "You'll see our account details after placing your order."],
                ["delivery", "Pay on delivery", "Pay when your order reaches you."],
              ] as const
            ).map(([value, label, hint]) => (
              <label
                key={value}
                className={`flex cursor-pointer items-start gap-3 border p-4 ${form.paymentMethod === value ? "border-ink" : "border-line"}`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={form.paymentMethod === value}
                  onChange={() => setForm({ ...form, paymentMethod: value })}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-ink/60">{hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {error && <p role="alert" className="border border-ink bg-fog p-3 text-sm font-medium">{error}</p>}

          <button disabled={busy} className="w-full bg-ink px-6 py-4 text-sm font-medium text-white hover:bg-ink-soft disabled:opacity-60">
            {busy ? "Placing your order…" : `Place order · ${naira(total)}`}
          </button>
        </form>

        <aside className="h-fit border border-line p-5 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold uppercase tracking-widest">Order summary</h2>
          <ul className="mt-4 divide-y divide-line">
            {cart.map((i) => (
              <li key={i.key} className="flex gap-3 py-3 text-sm">
                <div className="h-16 w-12 shrink-0 overflow-hidden bg-fog">
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
                  </p>
                </div>
                <p className="font-medium">{naira(i.unitPrice * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{naira(subtotal)}</span></div>
            <div className="flex justify-between text-ink/70">
              <span>Delivery</span><span>{settings.deliveryFee > 0 ? naira(settings.deliveryFee) : "Free"}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
              <span>Total</span><span>{naira(total)}</span>
            </div>
          </div>
          {hasPreorder && <p className="mt-3 text-xs text-ink/60">Pre-order items are sent once they arrive in stock.</p>}
          <Link href="/cart" className="mt-4 block text-sm underline">Edit cart</Link>
        </aside>
      </div>
    </main>
  );
}
