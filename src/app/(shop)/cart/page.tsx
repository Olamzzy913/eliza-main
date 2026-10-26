"use client";

import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { naira } from "@/lib/format";
import { lineUnit } from "@/lib/pricing";
import { img } from "@/lib/cloudinary";

export default function CartPage() {
  const { items, subtotal, ready, setQty, remove } = useShop();

  if (!ready) return <main className="mx-auto max-w-4xl px-4 py-16 text-sm text-ink/60">Loading your cart…</main>;

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-ink/70">Find something you love and it will appear here.</p>
        <Link href="/" className="btn-primary mt-6">Start shopping</Link>
      </main>
    );
  }

  const hasPreorder = items.some((i) => i.preorder);
  const allPod = items.every((i) => i.payOnDelivery);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">Your cart</h1>

      <ul className="mt-8 divide-y divide-line border-y border-line">
        {items.map((i) => (
          <li key={i.key} className="flex gap-4 py-5">
            <Link href={`/product/${i.productId}`} className="h-28 w-22 shrink-0 overflow-hidden rounded-xl bg-fog">
              {i.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img(i.image, 240)} alt={i.name} className="h-full w-full object-cover" />
              )}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/product/${i.productId}`} className="font-medium hover:underline">{i.name}</Link>
                  {i.variant && <p className="text-sm text-ink/60">{i.variant}</p>}
                  {i.styled && (
                    <p className="mt-0.5 text-xs text-violet-800">
                      Delivered styled (+{naira(i.stylingFee ?? 0)} each){i.styleNote ? `: “${i.styleNote}”` : ""}
                    </p>
                  )}
                  {i.extras && i.extras.length > 0 && <p className="mt-0.5 text-xs text-go">Includes free: {i.extras.join(", ")}</p>}
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {i.preorder && <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold tracking-wide text-ink">PRE-ORDER</span>}
                    {i.payOnDelivery && <span className="rounded-full border border-go/40 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-go">Pay on delivery</span>}
                  </div>
                </div>
                <button onClick={() => remove(i.key)} aria-label={`Remove ${i.name} from cart`} className="h-fit rounded-full p-1.5 hover:bg-fog">
                  <X size={18} />
                </button>
              </div>
              <div className="flex items-end justify-between">
                <div className="flex items-center rounded-full border border-line" role="group" aria-label={`Quantity of ${i.name}`}>
                  <button onClick={() => setQty(i.key, i.quantity - 1)} disabled={i.quantity <= 1} aria-label="Decrease quantity" className="rounded-full p-2 hover:bg-fog disabled:opacity-30">
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm">{i.quantity}</span>
                  <button onClick={() => setQty(i.key, i.quantity + 1)} disabled={i.quantity >= i.maxQty} aria-label="Increase quantity" className="rounded-full p-2 hover:bg-fog disabled:opacity-30">
                    <Plus size={14} />
                  </button>
                </div>
                <p className="text-right">
                  <span className={`font-semibold ${i.originalPrice > i.unitPrice ? "text-sale" : ""}`}>{naira(lineUnit(i) * i.quantity)}</span>
                  {i.originalPrice > i.unitPrice && (
                    <span className="block text-xs text-ink/45 line-through">{naira((i.originalPrice + (i.styled ? i.stylingFee ?? 0 : 0)) * i.quantity)}</span>
                  )}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="ml-auto mt-8 max-w-sm space-y-3">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span className="font-medium">{naira(subtotal)}</span>
        </div>
        <p className="text-sm text-ink/60">Delivery is worked out at checkout once you pick your region.</p>
        {hasPreorder && (
          <p className="rounded-xl bg-gold-soft p-3 text-xs text-ink/70">Pre-order items are sent once they arrive. We&apos;ll keep you updated on your tracking page.</p>
        )}
        {allPod && <p className="rounded-xl bg-green-50 p-3 text-xs text-go">Everything in your cart can be paid for on delivery.</p>}
        <Link href="/checkout" className="btn-primary w-full py-4">Checkout · {naira(subtotal)}</Link>
        <Link href="/" className="block text-center text-sm underline">Continue shopping</Link>
      </div>
    </main>
  );
}
