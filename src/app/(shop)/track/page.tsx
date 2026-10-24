"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatCode, normalizeCode } from "@/lib/orders";
import { getRecentOrders, type RecentOrder } from "@/lib/recent";
import { naira } from "@/lib/format";

export default function TrackPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<RecentOrder[]>([]);

  useEffect(() => setRecent(getRecentOrders()), []);

  function go(e: React.FormEvent) {
    e.preventDefault();
    const c = normalizeCode(code);
    if (c.length !== 12) {
      setError("A tracking code has 12 letters and numbers, like AB3K-9XQ7-MN2P. Check your order message and try again.");
      return;
    }
    router.push(`/track/${c}`);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">Track your order</h1>
      <p className="mt-2 text-ink/70">Enter the tracking code you received when you placed your order.</p>

      <form onSubmit={go} className="mt-8 space-y-3">
        <label className="block text-sm font-medium">
          Tracking code
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(""); }}
            placeholder="AB3K-9XQ7-MN2P"
            autoComplete="off"
            autoCapitalize="characters"
            className="mt-1 w-full border border-line px-3 py-3 font-mono text-base uppercase tracking-wider"
          />
        </label>
        {error && <p role="alert" className="text-sm font-medium">{error}</p>}
        <button className="w-full bg-ink px-6 py-3.5 text-sm font-medium text-white hover:bg-ink-soft">Track order</button>
      </form>

      {recent.length > 0 && (
        <section className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-widest">Orders from this device</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {recent.map((o) => (
              <li key={o.code}>
                <Link href={`/track/${o.code}`} className="flex items-center justify-between py-3 hover:bg-fog">
                  <span>
                    <span className="block font-mono text-sm font-semibold">{formatCode(o.code)}</span>
                    <span className="block text-xs text-ink/60">{new Date(o.at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</span>
                  </span>
                  <span className="text-sm font-medium">{naira(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
