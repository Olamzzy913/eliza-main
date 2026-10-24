import type { Timestamp } from "firebase/firestore";

export type Variant = { name: string; qty: number };

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
  lowStockAt: number;
  variantLabel?: string;
  variants?: Variant[];
  images?: string[];
  visible?: boolean;
  preorder?: boolean;
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
};

export type Order = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
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

export type StoreSettings = {
  storeName: string;
  tagline: string;
  whatsapp: string;
  bankDetails: string;
  deliveryFee: number;
  announcement: string;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Hair Store",
  tagline: "Wigs, extensions, oils and care. Order online and follow your order every step of the way.",
  whatsapp: "",
  bankDetails: "",
  deliveryFee: 0,
  announcement: "",
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
