"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/lib/types";

/** Products the owner has made visible. */
export function useShopProducts() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query(collection(db, "products"), where("visible", "==", true));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
        list.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
        setData(list);
        setLoading(false);
      },
      () => {
        setError("We couldn't load the products right now. Please refresh and try again.");
        setLoading(false);
      }
    );
  }, []);

  return { data, loading, error };
}

/** One visible product. `product` is null when it is missing or hidden. */
export function useShopProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSnapshot(
      doc(db, "products", id),
      (snap) => {
        setProduct(snap.exists() ? ({ id: snap.id, ...snap.data() } as Product) : null);
        setLoading(false);
      },
      () => {
        setProduct(null); // hidden products are denied by the rules
        setLoading(false);
      }
    );
  }, [id]);

  return { product, loading };
}
