import type { CartView } from "@stefanmarket/shared";

import { AppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

async function buildCartView(userId: string): Promise<CartView> {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { include: { images: true } } },
    orderBy: { addedAt: "asc" },
  });

  let subtotal = 0;
  const view: CartView = {
    items: items.map((item) => {
      subtotal += Number(item.product.basePrice) * item.quantity;
      return {
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          slug: item.product.slug,
          title: item.product.title,
          basePrice: item.product.basePrice.toString(),
          currency: item.product.currency,
          stockQuantity: item.product.stockQuantity,
          imageUrl: item.product.images[0]?.url ?? null,
        },
      };
    }),
    subtotal: subtotal.toFixed(2),
    currency: items[0]?.product.currency ?? "RON",
  };
  return view;
}

export async function getCart(userId: string): Promise<CartView> {
  return buildCartView(userId);
}

async function assertPurchasable(productId: string, quantity: number) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { seller: { select: { status: true } } },
  });
  if (!product || !product.isActive || product.seller.status !== "approved") {
    throw new AppError("Product is not available", 400);
  }
  if (quantity > product.stockQuantity) {
    throw new AppError(`Only ${product.stockQuantity} left in stock`, 400);
  }
  return product;
}

export async function addToCart(userId: string, productId: string, quantity: number): Promise<CartView> {
  // Not using the @@unique([userId, productId, variantId]) shortcut here: Postgres treats each
  // NULL as distinct in a unique index, so it doesn't actually enforce one-row-per-product for
  // variant-less items — a plain filtered lookup does what we need instead.
  const existing = await prisma.cartItem.findFirst({ where: { userId, productId, variantId: null } });
  const newQuantity = (existing?.quantity ?? 0) + quantity;
  await assertPurchasable(productId, newQuantity);

  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQuantity } });
  } else {
    await prisma.cartItem.create({ data: { userId, productId, quantity } });
  }

  return buildCartView(userId);
}

export async function updateCartItem(userId: string, itemId: string, quantity: number): Promise<CartView> {
  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) throw new AppError("Cart item not found", 404);

  await assertPurchasable(item.productId, quantity);
  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });

  return buildCartView(userId);
}

export async function removeCartItem(userId: string, itemId: string): Promise<CartView> {
  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) throw new AppError("Cart item not found", 404);

  await prisma.cartItem.delete({ where: { id: itemId } });
  return buildCartView(userId);
}
