import type { OrderStatus } from "@/lib/types";

/** Colors for each order status. Written out in full so Tailwind can see every class. */
export const STATUS_STYLE: Record<OrderStatus, { badge: string; dot: string; soft: string }> = {
  pending:   { badge: "bg-amber-100 text-amber-900 ring-1 ring-amber-300",   dot: "bg-amber-500",  soft: "bg-amber-50 border-amber-200" },
  confirmed: { badge: "bg-blue-100 text-blue-900 ring-1 ring-blue-300",      dot: "bg-blue-600",   soft: "bg-blue-50 border-blue-200" },
  shipped:   { badge: "bg-violet-100 text-violet-900 ring-1 ring-violet-300", dot: "bg-violet-600", soft: "bg-violet-50 border-violet-200" },
  delivered: { badge: "bg-green-100 text-green-900 ring-1 ring-green-300",   dot: "bg-green-600",  soft: "bg-green-50 border-green-200" },
  cancelled: { badge: "bg-red-100 text-red-900 ring-1 ring-red-300",         dot: "bg-red-600",    soft: "bg-red-50 border-red-200" },
};
