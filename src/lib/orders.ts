import type { OrderStatus } from "@/lib/types";

export const STATUS_STEPS: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered"];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Order received",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_MESSAGE: Record<OrderStatus, string> = {
  pending: "We have your order and will confirm it shortly.",
  confirmed: "Your order is confirmed and being prepared.",
  shipped: "Your order is on its way to you.",
  delivered: "Your order has been delivered. Thank you!",
  cancelled: "This order was cancelled.",
};

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid mix-ups

/** 12-character random code. This is the order's ID and its tracking code. */
export function generateOrderCode(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export const formatCode = (code: string) => code.replace(/(.{4})(?=.)/g, "$1-");
export const normalizeCode = (input: string) => input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
