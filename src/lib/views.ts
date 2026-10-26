import { doc, increment, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const inFlight = new Set<string>();

/**
 * Count one view of a product page, once per product per browser session.
 *
 * One setDoc with merge does both jobs: if the counter doesn't exist yet it is created with
 * views = 1, otherwise it goes up by exactly 1. (The old version called updateDoc first, which
 * the security rules reject for a counter that doesn't exist yet, so nothing was ever counted.)
 */
export async function trackView(productId: string) {
  if (inFlight.has(productId)) return;
  const key = `viewed-${productId}`;
  try {
    if (sessionStorage.getItem(key)) return;
  } catch {
    /* storage blocked: count it anyway */
  }

  inFlight.add(productId);
  try {
    await setDoc(
      doc(db, "productViews", productId),
      { views: increment(1), lastViewedAt: serverTimestamp() },
      { merge: true }
    );
    try {
      sessionStorage.setItem(key, "1"); // only after it worked, so a failure is retried
    } catch {
      /* ignore */
    }
  } catch (err) {
    console.warn("Product view was not counted. Is the latest firestore.rules published?", err);
  } finally {
    inFlight.delete(productId);
  }
}
