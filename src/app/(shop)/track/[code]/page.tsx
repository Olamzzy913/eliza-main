"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { Check } from "lucide-react";
import { db } from "@/lib/firebase";
import { useShop } from "@/context/ShopContext";
import { naira } from "@/lib/format";
import { STATUS_LABEL, STATUS_MESSAGE, STATUS_STEPS, formatCode, normalizeCode } from "@/lib/orders";
import { img } from "@/lib/cloudinary";
import type { Order } from "@/lib/types";

function TrackOrderView() {
  const { code: raw } = useParams<{ code: string }>();
  const code = normalizeCode(raw ?? "");
  const { settings } = useShop();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [justPlaced, setJustPlaced] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setJustPlaced(new URLSearchParams(window.location.search).get("new") === "1");
  }, []);

  useEffect(() => {
    if (code.length !== 12) {
      setLoading(false);
      return;
    }
    return onSnapshot(
      doc(db, "orders", code),
      (snap) => {
        setOrder(snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null);
        setLoading(false);
      },
      () => {
        setOrder(null);
        setLoading(false);
      }
    );
  }, [code]);

  if (loading) return <main className="mx-auto max-w-3xl px-4 py-16 text-sm text-ink/60">Finding your order…</main>;

  if (!order) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-semibold">We can&apos;t find that order</h1>
        <p className="mt-2 text-ink/70">Check the tracking code and try again. It has 12 letters and numbers.</p>
        <Link href="/track" className="mt-6 inline-block bg-ink px-6 py-3 text-sm font-medium text-white">Try another code</Link>
      </main>
    );
  }

  const cancelled = order.status === "cancelled";
  const currentStep = STATUS_STEPS.indexOf(order.status);
  const when = (s: string) => order.history?.find((h) => h.status === s)?.at.toDate();
  const wa = settings.whatsapp.replace(/\D/g, "");
  const waText = encodeURIComponent(`Hello, I'm asking about my order ${formatCode(order.id)}.`);
  const needsPayment = order.paymentMethod === "transfer" && !order.paid && !cancelled;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(formatCode(order!.id));
      setCopied(true);
    } catch {
      /* clipboard blocked, the code is shown on screen anyway */
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {justPlaced && (
        <div role="status" className="mb-8 border border-ink bg-fog p-5">
          <p className="font-display text-2xl font-semibold">Thank you, your order is in.</p>
          <p className="mt-1 text-sm text-ink/70">
            Save your tracking code below. You can use it any time to see where your order is.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink/50">Tracking code</p>
          <p className="font-mono text-2xl font-semibold tracking-wider">{formatCode(order.id)}</p>
        </div>
        <button onClick={copyCode} className="border border-line px-4 py-2 text-sm hover:border-ink">
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>

      {/* status */}
      <section className="mt-8 border border-line p-5 sm:p-6" aria-label="Order status">
        <h1 className="font-display text-2xl font-semibold">{STATUS_LABEL[order.status]}</h1>
        <p className="mt-1 text-sm text-ink/70">{STATUS_MESSAGE[order.status]}</p>

        {order.adminNote && (
          <p className="mt-4 border-l-4 border-ink bg-fog p-3 text-sm">
            <span className="block text-xs font-semibold uppercase tracking-widest text-ink/50">Message from the shop</span>
            {order.adminNote}
          </p>
        )}

        {!cancelled && (
          <ol className="mt-6 space-y-0">
            {STATUS_STEPS.map((s, i) => {
              const done = i <= currentStep;
              const date = when(s);
              return (
                <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < STATUS_STEPS.length - 1 && (
                    <span className={`absolute left-3 top-7 h-full w-px ${i < currentStep ? "bg-ink" : "bg-line"}`} aria-hidden />
                  )}
                  <span
                    className={`z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs ${
                      done ? "border-ink bg-ink text-white" : "border-line bg-white text-ink/30"
                    }`}
                    aria-hidden
                  >
                    {done ? <Check size={14} /> : i + 1}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${done ? "" : "text-ink/40"}`}>
                      {STATUS_LABEL[s]}
                      {i === currentStep && <span className="sr-only"> (current step)</span>}
                    </p>
                    {date && (
                      <p className="text-xs text-ink/60">
                        {date.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {needsPayment && (
        <section className="mt-6 border border-ink p-5" aria-label="Payment">
          <h2 className="text-sm font-semibold uppercase tracking-widest">Pay by bank transfer</h2>
          {settings.bankDetails ? (
            <p className="mt-3 whitespace-pre-line font-mono text-sm">{settings.bankDetails}</p>
          ) : (
            <p className="mt-3 text-sm">We&apos;ll send you our account details shortly.</p>
          )}
          <p className="mt-3 text-sm">
            Amount to pay: <b>{naira(order.total)}</b>. Use <b>{formatCode(order.id)}</b> as your payment reference.
          </p>
          {wa && (
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hello, I've paid for order ${formatCode(order.id)}. Here is my receipt.`)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink-soft"
            >
              Send receipt on WhatsApp
            </a>
          )}
        </section>
      )}
      {order.paid && !cancelled && <p className="mt-6 bg-fog p-3 text-sm font-medium">Payment received. Thank you!</p>}

      {/* items */}
      <section className="mt-8" aria-label="Items">
        <h2 className="text-sm font-semibold uppercase tracking-widest">Your items</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {order.items.map((it, i) => (
            <li key={i} className="flex gap-3 py-3 text-sm">
              <div className="h-16 w-12 shrink-0 overflow-hidden bg-fog">
                {it.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img(it.image, 120)} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{it.name}</p>
                <p className="text-xs text-ink/60">
                  {it.variant && `${it.variant} · `}Qty {it.quantity}
                  {it.preorder && " · Pre-order"}
                </p>
              </div>
              <p className="font-medium">{naira(it.unitPrice * it.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="ml-auto mt-3 max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{naira(order.subtotal)}</span></div>
          <div className="flex justify-between text-ink/70"><span>Delivery</span><span>{order.deliveryFee > 0 ? naira(order.deliveryFee) : "Free"}</span></div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><span>Total</span><span>{naira(order.total)}</span></div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 text-sm sm:grid-cols-2" aria-label="Delivery">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest">Delivering to</h2>
          <p className="mt-2 font-medium">{order.customerName}</p>
          <p>{order.address}</p>
          <p>{order.city}</p>
          <p className="text-ink/70">{order.phone}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest">Payment</h2>
          <p className="mt-2">{order.paymentMethod === "transfer" ? "Bank transfer" : "Pay on delivery"}</p>
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        {wa && (
          <a href={`https://wa.me/${wa}?text=${waText}`} target="_blank" rel="noreferrer" className="border border-ink px-5 py-2.5 text-sm font-medium hover:bg-fog">
            Ask about this order
          </a>
        )}
        <Link href="/" className="px-5 py-2.5 text-sm underline">Continue shopping</Link>
      </div>
    </main>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-16 text-sm text-ink/60 sm:px-6">Loading…</main>}>
      <TrackOrderView />
    </Suspense>
  );
}
