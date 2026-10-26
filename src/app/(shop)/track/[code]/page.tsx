"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { Check } from "lucide-react";
import { db } from "@/lib/firebase";
import { useShop } from "@/context/ShopContext";
import { naira } from "@/lib/format";
import { lineUnit } from "@/lib/pricing";
import { STATUS_LABEL, STATUS_MESSAGE, STATUS_STEPS, formatCode, normalizeCode } from "@/lib/orders";
import { STATUS_STYLE } from "@/lib/status";
import { img } from "@/lib/cloudinary";
import { BankCard } from "@/components/BankCard";
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
        <Link href="/track" className="btn-primary mt-6">Try another code</Link>
      </main>
    );
  }

  const cancelled = order.status === "cancelled";
  const currentStep = STATUS_STEPS.indexOf(order.status);
  const when = (s: string) => order.history?.find((h) => h.status === s)?.at.toDate();
  const wa = settings.whatsapp.replace(/\D/g, "");
  const needsPayment = order.paymentMethod === "transfer" && !order.paid && !cancelled;
  const style = STATUS_STYLE[order.status];

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(formatCode(order!.id));
      setCopied(true);
    } catch {
      /* the code is on screen to copy by hand */
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {justPlaced && (
        <div role="status" className="mb-8 rounded-2xl bg-ink p-6 text-white">
          <p className="font-display text-3xl font-semibold">Thank you, your order is in.</p>
          <p className="mt-1 text-sm text-white/70">
            {needsPayment
              ? "Pay into the account below to get things moving, and keep your tracking code safe."
              : "Keep your tracking code safe. You can use it any time to see where your order is."}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Tracking code</p>
          <p className="font-mono text-2xl font-semibold tracking-wider">{formatCode(order.id)}</p>
        </div>
        <button onClick={copyCode} className="rounded-full border border-line px-4 py-2 text-sm hover:border-ink">
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>

      {/* payment first, when something is owed */}
      {needsPayment && (
        <section className="mt-6" aria-label="Payment">
          <BankCard settings={settings} amount={order.total} reference={formatCode(order.id)} />
          {wa && (
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hello, I've paid for order ${formatCode(order.id)}. Here is my receipt.`)}`}
              target="_blank"
              rel="noreferrer"
              className="btn-outline mt-3 w-full"
            >
              Send receipt on WhatsApp
            </a>
          )}
        </section>
      )}
      {order.paymentMethod === "delivery" && !cancelled && !order.paid && (
        <p className="mt-6 rounded-2xl border border-go/40 bg-green-50 p-4 text-sm text-go">
          <b>Pay on delivery.</b> Please have <b>{naira(order.total)}</b> ready when your order arrives.
        </p>
      )}
      {order.paid && !cancelled && <p className="mt-6 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-go">Payment received. Thank you!</p>}

      {/* status */}
      <section className={`mt-6 rounded-2xl border p-5 sm:p-6 ${style.soft}`} aria-label="Order status">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${style.badge}`}>
          <span className={`h-2 w-2 rounded-full ${style.dot}`} /> {STATUS_LABEL[order.status]}
        </span>
        <h1 className="mt-3 font-display text-2xl font-semibold">{STATUS_MESSAGE[order.status]}</h1>

        {order.adminNote && (
          <p className="mt-4 rounded-xl bg-white p-4 text-sm shadow-sm">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">Message from the shop</span>
            {order.adminNote}
          </p>
        )}

        {!cancelled && (
          <ol className="mt-6">
            {STATUS_STEPS.map((s, i) => {
              const done = i <= currentStep;
              const date = when(s);
              return (
                <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < STATUS_STEPS.length - 1 && (
                    <span className={`absolute left-3 top-7 h-full w-0.5 ${i < currentStep ? "bg-ink/30" : "bg-ink/10"}`} aria-hidden />
                  )}
                  <span
                    className={`z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${
                      done ? `${STATUS_STYLE[s].dot} text-white` : "border border-ink/20 bg-white text-ink/30"
                    } ${i === currentStep ? "ring-4 ring-white" : ""}`}
                    aria-hidden
                  >
                    {done ? <Check size={14} /> : i + 1}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${done ? "" : "text-ink/40"}`}>
                      {STATUS_LABEL[s]}
                      {i === currentStep && <span className="sr-only"> (current step)</span>}
                    </p>
                    {date && <p className="text-xs text-ink/60">{date.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* items */}
      <section className="mt-8" aria-label="Items">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">Your items</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {order.items.map((it, i) => (
            <li key={i} className="flex gap-3 py-3 text-sm">
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-fog">
                {it.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img(it.image, 120)} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{it.name}</p>
                <p className="text-xs text-ink/60">
                  {it.variant && `${it.variant} · `}Qty {it.quantity}
                  {it.preorder && <span className="ml-1 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-ink">PRE-ORDER</span>}
                  {it.premium && <span className="ml-1 rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-bold text-gold">PREMIUM</span>}
                </p>
                {it.styled && (
                  <p className="text-xs text-violet-800">Delivered styled{it.styleNote ? `: “${it.styleNote}”` : ""}</p>
                )}
                {it.extras && it.extras.length > 0 && <p className="text-xs text-go">Includes free: {it.extras.join(", ")}</p>}
              </div>
              <p className="font-medium">{naira(lineUnit(it) * it.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="ml-auto mt-3 max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{naira(order.subtotal)}</span></div>
          <div className="flex justify-between text-ink/70">
            <span>Delivery{order.deliveryZone ? ` (${order.deliveryZone})` : ""}</span>
            <span>{order.deliveryFee > 0 ? naira(order.deliveryFee) : "Free"}</span>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><span>Total</span><span>{naira(order.total)}</span></div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 text-sm sm:grid-cols-2" aria-label="Delivery">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">Delivering to</h2>
          <p className="mt-2 font-medium">{order.customerName}</p>
          <p>{order.address}</p>
          <p>{[order.city, order.deliveryZone].filter(Boolean).join(", ")}</p>
          <p className="text-ink/70">{order.phone}</p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">Payment</h2>
          <p className="mt-2">{order.paymentMethod === "transfer" ? "Bank transfer" : "Pay on delivery"}</p>
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        {wa && (
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hello, I'm asking about my order ${formatCode(order.id)}.`)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-outline"
          >
            Ask about this order
          </a>
        )}
        <Link href="/" className="px-5 py-3 text-sm underline">Continue shopping</Link>
      </div>
    </main>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl px-4 py-16 text-sm text-ink/60">Loading…</main>}>
      <TrackOrderView />
    </Suspense>
  );
}
