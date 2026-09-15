import type { AddressView, OrderDetail, OrderSummary } from "@stefanmarket/shared";
import { Prisma } from "@prisma/client";
import type Stripe from "stripe";

import { AppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { stripe, toStripeAmount } from "../lib/stripe.js";

const DEFAULT_COMMISSION_RATE = 10; // percent — stands in for an admin-configurable default;
// there's no commission-settings UI yet, so this is the fallback whenever a seller has no
// commissionRateOverride set.

function toOrderSummary(order: { id: string; status: string; total: Prisma.Decimal; currency: string; placedAt: Date }): OrderSummary {
  return {
    id: order.id,
    status: order.status as OrderSummary["status"],
    total: order.total.toString(),
    currency: order.currency,
    placedAt: order.placedAt.toISOString(),
  };
}

export async function checkout(userId: string, addressId: string): Promise<{ orderId: string; clientSecret: string }> {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) throw new AppError("Address not found", 404);

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { include: { seller: true, images: true } } },
  });
  if (cartItems.length === 0) throw new AppError("Your cart is empty", 400);

  for (const item of cartItems) {
    const { product } = item;
    if (!product.isActive || product.seller.status !== "approved") {
      throw new AppError(`"${product.title}" is no longer available`, 400);
    }
    if (item.quantity > product.stockQuantity) {
      throw new AppError(`Only ${product.stockQuantity} left of "${product.title}"`, 400);
    }
  }

  let subtotal = 0;
  let platformFeeTotal = 0;
  const lineItems = cartItems.map((item) => {
    const unitPrice = Number(item.product.basePrice);
    const rate = item.product.seller.commissionRateOverride
      ? Number(item.product.seller.commissionRateOverride)
      : DEFAULT_COMMISSION_RATE;
    subtotal += unitPrice * item.quantity;
    platformFeeTotal += unitPrice * item.quantity * (rate / 100);
    return { item, unitPrice, rate };
  });
  const shippingTotal = 0;
  const total = subtotal + shippingTotal;

  const shippingAddressSnapshot: Omit<AddressView, "id" | "isDefault"> = {
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    street: address.street,
    city: address.city,
    county: address.county,
    postalCode: address.postalCode,
    country: address.country,
  };

  const paymentIntent = await stripe.paymentIntents.create({
    amount: toStripeAmount(total),
    currency: "ron",
    automatic_payment_methods: { enabled: true },
  });

  try {
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          buyerId: userId,
          status: "pending_payment",
          subtotal,
          platformFeeTotal,
          shippingTotal,
          total,
          shippingAddressSnapshot,
          billingAddressSnapshot: shippingAddressSnapshot,
          stripePaymentIntentId: paymentIntent.id,
          items: {
            create: lineItems.map(({ item, unitPrice, rate }) => ({
              sellerId: item.product.sellerId,
              productId: item.productId,
              productTitleSnapshot: item.product.title,
              productImageUrlSnapshot: item.product.images[0]?.url ?? null,
              unitPriceSnapshot: unitPrice,
              quantity: item.quantity,
              commissionRateSnapshot: rate,
            })),
          },
          payment: {
            create: {
              stripePaymentIntentId: paymentIntent.id,
              amount: total,
              status: "requires_payment",
            },
          },
        },
      });

      for (const { item } of lineItems) {
        await tx.product.update({
          where: { id: item.productId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { userId } });

      return createdOrder;
    });

    return { orderId: order.id, clientSecret: paymentIntent.client_secret! };
  } catch (err) {
    // A concurrent checkout raced us for the same stock between our pre-check above and the
    // atomic decrement (the `stockQuantity: { gte }` guard matched zero rows) — cancel the
    // PaymentIntent we already created so it doesn't linger, and surface a clear error.
    await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => {});
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw new AppError("Stock changed while checking out — please review your cart", 409);
    }
    throw err;
  }
}

export async function listOrders(userId: string): Promise<OrderSummary[]> {
  const orders = await prisma.order.findMany({ where: { buyerId: userId }, orderBy: { placedAt: "desc" } });
  return orders.map(toOrderSummary);
}

export async function getOrder(userId: string, orderId: string): Promise<OrderDetail> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.buyerId !== userId) throw new AppError("Order not found", 404);

  return {
    ...toOrderSummary(order),
    subtotal: order.subtotal.toString(),
    shippingTotal: order.shippingTotal.toString(),
    shippingAddressSnapshot: order.shippingAddressSnapshot as Omit<AddressView, "id" | "isDefault">,
    items: order.items.map((item) => ({
      id: item.id,
      productTitleSnapshot: item.productTitleSnapshot,
      productImageUrlSnapshot: item.productImageUrlSnapshot,
      unitPriceSnapshot: item.unitPriceSnapshot.toString(),
      quantity: item.quantity,
      fulfillmentStatus: item.fulfillmentStatus,
    })),
  };
}

export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const payment = await prisma.payment.findFirst({ where: { stripePaymentIntentId: intent.id } });
    if (!payment || payment.status === "succeeded") return; // already processed or not ours

    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "succeeded" } }),
      prisma.order.update({ where: { id: payment.orderId }, data: { status: "paid" } }),
    ]);
    return;
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: intent.id },
      include: { order: { include: { items: true } } },
    });
    if (!payment || payment.status === "failed") return;

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: payment.id }, data: { status: "failed" } });
      await tx.order.update({ where: { id: payment.orderId }, data: { status: "cancelled" } });
      for (const item of payment.order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }
    });
  }
}
