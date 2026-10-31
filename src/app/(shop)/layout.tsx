"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, ShoppingBag } from "lucide-react";
import { ShopProvider, useShop } from "@/context/ShopContext";

const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShopProvider>
      <Frame>{children}</Frame>
    </ShopProvider>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const { count, settings } = useShop();
  const wa = settings.whatsapp.replace(/\D/g, "");
  console.log(wa);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {settings.announcement && (
        <p className="bg-gold px-4 py-2 text-center text-xs font-semibold tracking-wide text-ink">
          {settings.announcement}
        </p>
      )}

      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="font-display text-2xl font-semibold tracking-tight"
          >
            {settings.storeName}
          </Link>
          <nav
            aria-label="Shop"
            className="flex items-center gap-1 text-sm sm:gap-2"
          >
            <Link
              href="/#shop"
              className="hidden rounded-full px-4 py-2 hover:bg-fog sm:inline"
            >
              Shop
            </Link>
            <Link href="/track" className="rounded-full px-4 py-2 hover:bg-fog">
              Track order
            </Link>
            <Link
              href="/cart"
              aria-label={`Cart, ${count} items`}
              className="relative ml-1 grid h-10 w-10 place-items-center rounded-full bg-ink text-white hover:bg-ink-soft"
            >
              <ShoppingBag size={18} />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-ink">
                  {count}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      {wa && (
        <Suspense fallback={null}>
          <WhatsAppFloat wa={wa} />
        </Suspense>
      )}

      <footer className="mt-16 bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
          <div>
            <p className="font-display text-2xl font-semibold">
              {settings.storeName}
            </p>
            <p className="mt-2 max-w-xs text-sm text-white/60">
              {settings.tagline}
            </p>
          </div>
          <div className="text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Help
            </p>
            <ul className="mt-3 space-y-2 text-white/70">
              <li>
                <Link
                  href="/track"
                  className="hover:text-white hover:underline"
                >
                  Track an order
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white hover:underline">
                  Your cart
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Talk to us
            </p>
            {wa ? (
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 hover:bg-white/10"
              >
                <MessageCircle size={16} /> Chat on WhatsApp
              </a>
            ) : (
              <p className="mt-3 text-white/60">
                Questions? Place an order and we&apos;ll be in touch.
              </p>
            )}
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/40">
          {settings.storeName}
          {adminUrl && (
            <>
              {" · "}
              <a href={adminUrl} className="hover:text-white">
                Admin
              </a>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

function WhatsAppFloat({ wa }: { wa: string }) {
  const pathname = usePathname();
  if (pathname === "/checkout") return null;
  const onProduct = pathname.startsWith("/product");
  return (
    <a
      href={`https://wa.me/${wa}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={`fixed right-4 z-40 grid h-13 w-13 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 ${
        onProduct ? "bottom-24 md:bottom-6" : "bottom-5"
      }`}
    >
      <MessageCircle size={26} />
    </a>
  );
}
