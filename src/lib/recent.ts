// Remembers orders placed on this device so shoppers can find them again.
const KEY = "recent-orders-v1";

export type RecentOrder = { code: string; total: number; at: number };

export function getRecentOrders(): RecentOrder[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as RecentOrder[];
  } catch {
    return [];
  }
}

export function saveRecentOrder(code: string, total: number) {
  try {
    const list = [{ code, total, at: Date.now() }, ...getRecentOrders().filter((o) => o.code !== code)].slice(0, 10);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable, tracking by code still works */
  }
}
