import type { Timestamp } from "firebase/firestore";

/** `total` is an old field from an earlier version. It is kept in your data but no longer used. */
export type Variant = { name: string; qty: number; total?: number };

/** A free item that comes with a product, e.g. a maintenance tool kit. */
export type Extra = { id: string; name: string; image: string };

export type Product = {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  discountPercent?: number;
  /** Admin only. Stored in a separate private collection and merged in the dashboard. */
  costPrice?: number;
  stock: number;
  /** How many were stocked in total, so the shop can show "6 of 10 left". */
  stockTotal?: number;
  lowStockAt: number;
  variantLabel?: string;
  variants?: Variant[];
  images?: string[];
  visible?: boolean;
  preorder?: boolean;
  payOnDelivery?: boolean;
  /** Shown to shoppers on pre-order items, e.g. "Arrives in about 2 weeks". */
  preorderNote?: string;
  /** Can be delivered styled for an extra fee. */
  stylingAvailable?: boolean;
  stylingFee?: number;
  /** Free items included with the product. */
  extras?: Extra[];
  /** Premium products cost more and come with more benefits and extras. */
  premium?: boolean;
  benefits?: string[];
  createdAt?: Timestamp;
};

export type Sale = {
  id: string;
  productId: string;
  productName: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  /** The price on the shelf at the time, when the shop adjusted the selling price. */
  listPrice?: number;
  styled?: boolean;
  stylingFee?: number;
  total: number;
  customer: string;
  orderId?: string;
  createdAt?: Timestamp;
};

export type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  note?: string;
  date?: Timestamp;
  createdAt?: Timestamp;
};

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export type OrderItem = {
  productId: string;
  name: string;
  variant: string;
  image: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  preorder: boolean;
  styled?: boolean;
  stylingFee?: number;
  styleNote?: string;
  /** Names of the free extras that go in the package. */
  extras?: string[];
  premium?: boolean;
};

export type StockUp = {
  id: string;
  productId: string;
  productName: string;
  variant: string;
  quantity: number;
  unitCost?: number;
  note: string;
  source: "new" | "edit" | "restock";
  date?: Timestamp;
  by: string;
  createdAt?: Timestamp;
};

export type Order = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  deliveryZone: string;
  note: string;
  paymentMethod: "transfer" | "delivery";
  paid: boolean;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  history: { status: OrderStatus; at: Timestamp }[];
  adminNote: string;
  createdAt?: Timestamp;
};

export type DeliveryZone = { id: string; name: string; free: boolean; fee: number };

export type StoreSettings = {
  storeName: string;
  tagline: string;
  whatsapp: string;
  announcement: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankNote: string;
  deliveryZones: DeliveryZone[];
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Hair Store",
  tagline: "Wigs, extensions, oils and care. Order online and follow your order every step of the way.",
  whatsapp: "",
  announcement: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  bankNote: "",
  deliveryZones: [],
};

export const CATEGORIES = [
  "Shampoo",
  "Conditioner",
  "Hair oil",
  "Hair mask",
  "Styling",
  "Wigs & extensions",
  "Tools",
  "Other",
];

export const EXPENSE_CATEGORIES = [
  "Stock purchase",
  "Shipping & delivery",
  "Packaging",
  "Transport",
  "Rent",
  "Utilities",
  "Marketing",
  "Staff",
  "Other",
];
