import { createAddressSchema } from "@stefanmarket/shared";
import type { Request, Response } from "express";

import * as addressService from "../services/address.service.js";

export async function listAddresses(req: Request, res: Response) {
  const addresses = await addressService.listAddresses(req.user!.id);
  res.json({ addresses });
}

export async function createAddress(req: Request, res: Response) {
  const parsed = createAddressSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const address = await addressService.createAddress(req.user!.id, parsed.data);
  res.status(201).json({ address });
}
