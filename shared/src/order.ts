import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});
export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export const createAddressSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(1),
  phone: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  county: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().optional(),
  isDefault: z.boolean().optional(),
});
export type CreateAddressInput = z.infer<typeof createAddressSchema>;

export const checkoutSchema = z.object({
  addressId: z.string().min(1),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export interface CartItemView {
  id: string;
  quantity: number;
  product: {
    id: string;
    slug: string;
    title: string;
    basePrice: string;
    currency: string;
    stockQuantity: number;
    imageUrl: string | null;
  };
}

export interface CartView {
  items: CartItemView[];
  subtotal: string;
  currency: string;
}

export interface AddressView {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  county: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export type OrderStatusView =
  | "pending_payment"
  | "paid"
  | "partially_shipped"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderSummary {
  id: string;
  status: OrderStatusView;
  total: string;
  currency: string;
  placedAt: string;
}

export interface OrderItemView {
  id: string;
  productTitleSnapshot: string;
  productImageUrlSnapshot: string | null;
  unitPriceSnapshot: string;
  quantity: number;
  fulfillmentStatus: string;
}

export interface OrderDetail extends OrderSummary {
  subtotal: string;
  shippingTotal: string;
  shippingAddressSnapshot: Omit<AddressView, "id" | "isDefault">;
  items: OrderItemView[];
}
