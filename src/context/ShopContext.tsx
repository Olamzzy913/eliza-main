"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_SETTINGS, type StoreSettings } from "@/lib/types";

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
  maxQty: number;
};

type Ctx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  settings: StoreSettings;
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore a corrupt cart */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items, ready]);

  useEffect(() => {
    getDoc(doc(db, "settings", "store"))
      .then((s) => s.exists() && setSettings({ ...DEFAULT_SETTINGS, ...(s.data() as Partial<StoreSettings>) }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.title = settings.storeName;
  }, [settings.storeName]);

  const add = useCallback((item: Omit<CartItem, "key">) => {
    const key = `${item.productId}|${item.variant}`;
    setItems((prev) => {
      const found = prev.find((i) => i.key === key);
      if (found) {
        return prev.map((i) =>
          i.key === key
            ? { ...i, ...item, key, quantity: Math.min(item.maxQty, i.quantity + item.quantity) }
            : i
        );
      }
      return [...prev, { ...item, key }];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Math.min(i.maxQty, qty)) } : i))
    );
  }, []);

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);
  const replaceAll = useCallback((next: CartItem[]) => setItems(next), []);

  const value = useMemo<Ctx>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      ready,
      settings,
      add,
      setQty,
      remove,
      replaceAll,
      clear,
    }),
    [items, ready, settings, add, setQty, remove, replaceAll, clear]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}
