"use client";

import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { naira } from "@/lib/format";
import { img } from "@/lib/cloudinary";

export default function CartPage() {
  const { items, subtotal, ready, settings, setQty, remove } = useShop();

  if (!ready) return <main className="mx-auto max-w-4xl px-4 py-16 text-sm text-ink/60">Loading your cart…</main>;

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-ink/70">Find something you love and it will appear here.</p>
        <Link href="/" className="mt-6 inline-block bg-ink px-6 py-3 text-sm font-medium text-white hover:bg-ink-soft">
          Start shopping
        </Link>
      </main>
    );
  }

  const hasPreorder = items.some((i) => i.preorder);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">Your cart</h1>

      <ul className="mt-8 divide-y divide-line border-y border-line">
        {items.map((i) => (
          <li key={i.key} className="flex gap-4 py-5">
            <Link href={`/product/${i.productId}`} className="h-28 w-22 shrink-0 overflow-hidden bg-fog">
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
                  {i.preorder && (
                    <span className="mt-1 inline-block border border-ink px-1.5 py-0.5 text-[10px] font-semibold tracking-wide">PRE-ORDER</span>
                  )}
                </div>
                <button onClick={() => remove(i.key)} aria-label={`Remove ${i.name} from cart`} className="h-fit p-1 hover:bg-fog">
                  <X size={18} />
                </button>
              </div>
              <div className="flex items-end justify-between">
                <div className="flex items-center border border-line" role="group" aria-label={`Quantity of ${i.name}`}>
                  <button onClick={() => setQty(i.key, i.quantity - 1)} disabled={i.quantity <= 1} aria-label="Decrease quantity" className="p-2 hover:bg-fog disabled:opacity-30">
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm">{i.quantity}</span>
                  <button onClick={() => setQty(i.key, i.quantity + 1)} disabled={i.quantity >= i.maxQty} aria-label="Increase quantity" className="p-2 hover:bg-fog disabled:opacity-30">
                    <Plus size={14} />
                  </button>
                </div>
                <p className="text-right">
                  <span className="font-semibold">{naira(i.unitPrice * i.quantity)}</span>
                  {i.originalPrice > i.unitPrice && (
                    <span className="block text-xs text-ink/50 line-through">{naira(i.originalPrice * i.quantity)}</span>
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
        <div className="flex justify-between text-sm text-ink/70">
          <span>Delivery</span>
          <span>{settings.deliveryFee > 0 ? naira(settings.deliveryFee) : "Free"}</span>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold">
          <span>Total</span>
          <span>{naira(subtotal + settings.deliveryFee)}</span>
        </div>
        {hasPreorder && (
          <p className="text-xs text-ink/60">Pre-order items are made ready for you once they arrive. We&apos;ll keep you updated on your tracking page.</p>
        )}
        <Link href="/checkout" className="block bg-ink px-6 py-3.5 text-center text-sm font-medium text-white hover:bg-ink-soft">
          Checkout
        </Link>
        <Link href="/" className="block text-center text-sm underline">Continue shopping</Link>
      </div>
    </main>
  );
}
