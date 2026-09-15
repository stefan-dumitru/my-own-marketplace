import type { Request, Response } from "express";
import type Stripe from "stripe";

import { env } from "../config/env.js";
import { stripe } from "../lib/stripe.js";
import { handleStripeWebhook } from "../services/order.service.js";

export async function stripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    res.status(400).send("Missing Stripe signature");
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    res.status(400).send("Invalid signature");
    return;
  }

  await handleStripeWebhook(event);
  res.json({ received: true });
}
