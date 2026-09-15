import { addToCartSchema, updateCartItemSchema } from "@stefanmarket/shared";
import type { Request, Response } from "express";

import * as cartService from "../services/cart.service.js";

export async function getCart(req: Request, res: Response) {
  const cart = await cartService.getCart(req.user!.id);
  res.json(cart);
}

export async function addToCart(req: Request, res: Response) {
  const parsed = addToCartSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const cart = await cartService.addToCart(req.user!.id, parsed.data.productId, parsed.data.quantity);
  res.json(cart);
}

export async function updateCartItem(req: Request, res: Response) {
  const parsed = updateCartItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const cart = await cartService.updateCartItem(req.user!.id, req.params.itemId as string, parsed.data.quantity);
  res.json(cart);
}

export async function removeCartItem(req: Request, res: Response) {
  const cart = await cartService.removeCartItem(req.user!.id, req.params.itemId as string);
  res.json(cart);
}
