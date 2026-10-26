"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_SETTINGS, type StoreSettings } from "@/lib/types";
import { lineUnit } from "@/lib/pricing";

export type CartItem = {
  key: string;
  productId: string;
  name: string;
  image: string;
  variant: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  preorder: boolean;
  payOnDelivery?: boolean;
  styled?: boolean;
  stylingFee?: number;
  styleNote?: string;
  extras?: string[];
  premium?: boolean;
  maxQty: number;
};

const makeKey = (i: Pick<CartItem, "productId" | "variant" | "preorder" | "styled">) =>
  `${i.productId}|${i.variant}|${i.preorder ? "pre" : "in"}|${i.styled ? "styled" : "plain"}`;

type Ctx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  settings: StoreSettings;
  saved: string[];
  toggleSaved: (id: string) => void;
  add: (item: Omit<CartItem, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  replaceAll: (items: CartItem[]) => void;
  clear: () => void;
};

const ShopContext = createContext<Ctx | null>(null);
const KEY = "cart-v1";

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems((JSON.parse(raw) as CartItem[]).map((i) => ({ ...i, key: makeKey(i) })));
      const sv = localStorage.getItem("saved-v1");
      if (sv) setSaved(JSON.parse(sv));
    } catch {
      /* ignore a corrupt cart */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("saved-v1", JSON.stringify(saved));
    } catch {
      /* storage unavailable */
    }
  }, [saved, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items, ready]);

  // Live, so a change in the dashboard (bank details, regions) shows up without a refresh
  useEffect(() => {
    return onSnapshot(
      doc(db, "settings", "store"),
      (s) => {
        if (!s.exists()) return;
        const d = s.data() as Partial<StoreSettings> & { bankDetails?: string };
        setSettings({
          ...DEFAULT_SETTINGS,
          ...d,
          bankNote: d.bankNote ?? d.bankDetails ?? "",
          deliveryZones: d.deliveryZones ?? [],
        });
      },
      () => {}
    );
  }, []);

  useEffect(() => {
    document.title = settings.storeName;
  }, [settings.storeName]);

  const add = useCallback((item: Omit<CartItem, "key">) => {
    const key = makeKey(item);
    setItems((prev) => {
      const found = prev.find((i) => i.key === key);
      if (found) {
        return prev.map((i) =>
          i.key === key ? { ...i, ...item, key, quantity: Math.min(item.maxQty, i.quantity + item.quantity) } : i
        );
      }
      return [...prev, { ...item, key }];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Math.min(i.maxQty, qty)) } : i)));
  }, []);

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);
  const replaceAll = useCallback((next: CartItem[]) => setItems(next), []);

  const value = useMemo<Ctx>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + lineUnit(i) * i.quantity, 0),
      ready,
      settings,
      saved,
      toggleSaved: (id: string) => setSaved((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
      add,
      setQty,
      remove,
      replaceAll,
      clear,
    }),
    [items, ready, settings, saved, add, setQty, remove, replaceAll, clear]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}
