import Stripe from "stripe";

import { env } from "../config/env.js";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export function toStripeAmount(decimalAmount: number): number {
  return Math.round(decimalAmount * 100);
}
