"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { ShopProvider, useShop } from "@/context/ShopContext";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShopProvider>
      <Frame>{children}</Frame>
    </ShopProvider>
  );
}

const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;

function Frame({ children }: { children: React.ReactNode }) {
  const { count, settings } = useShop();
  const wa = settings.whatsapp.replace(/\D/g, "");

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {settings.announcement && (
        <p className="bg-ink px-4 py-2 text-center text-xs tracking-wide text-white">{settings.announcement}</p>
      )}

      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
            {settings.storeName}
          </Link>
          <nav aria-label="Shop" className="flex items-center gap-5 text-sm">
            <Link href="/" className="hidden hover:underline sm:inline">Shop</Link>
            <Link href="/track" className="hover:underline">Track order</Link>
            <Link href="/cart" className="relative flex items-center gap-1.5 hover:underline" aria-label={`Cart, ${count} items`}>
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute -right-2.5 -top-2 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-ink px-1 text-[10px] font-semibold text-white">
                  {count}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-ink/70 sm:px-6">
          <p>{settings.storeName}</p>
          <div className="flex items-center gap-5">
            {wa && (
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="hover:text-ink hover:underline">
                Chat on WhatsApp
              </a>
            )}
            <Link href="/track" className="hover:text-ink hover:underline">Track an order</Link>
            {adminUrl && <a href={adminUrl} className="text-ink/40 hover:text-ink">Admin</a>}
          </div>
        </div>
      </footer>
    </div>
  );
}
