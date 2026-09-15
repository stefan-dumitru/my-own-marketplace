import { checkoutSchema } from "@stefanmarket/shared";
import type { Request, Response } from "express";

import * as orderService from "../services/order.service.js";

export async function checkout(req: Request, res: Response) {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const result = await orderService.checkout(req.user!.id, parsed.data.addressId);
  res.status(201).json(result);
}

export async function listOrders(req: Request, res: Response) {
  const orders = await orderService.listOrders(req.user!.id);
  res.json({ orders });
}

export async function getOrder(req: Request, res: Response) {
  const order = await orderService.getOrder(req.user!.id, req.params.id as string);
  res.json({ order });
}
