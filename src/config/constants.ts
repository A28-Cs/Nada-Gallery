export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "nadoush2005@gmail.com";
export const SHIPPING_COST = 50;
export const PLACEHOLDER_IMAGE = "https://placehold.co/400x400/f3eef7/ab6cbd?text=Nada+Gallery&font=playfair-display";
export const PLACEHOLDER_CATEGORY_IMAGE = "https://placehold.co/300x200/f3eef7/ab6cbd?text=Collection&font=playfair-display";

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export const PAYMENT_STATUSES = [
  'unpaid',
  'paid',
  'refunded',
] as const;

export const PAYMENT_METHODS = [
  'cash_on_delivery',
] as const;
