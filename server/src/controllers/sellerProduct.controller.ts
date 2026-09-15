import { createProductSchema, updateProductSchema } from "@stefanmarket/shared";
import type { Request, Response } from "express";

import * as productService from "../services/product.service.js";

export async function listOwnProducts(req: Request, res: Response) {
  const sellerProfile = await productService.getOwnSellerProfile(req.user!.id);
  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const result = await productService.listSellerProducts(sellerProfile.id, { page, limit });
  res.json(result);
}

export async function createProduct(req: Request, res: Response) {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const sellerProfile = await productService.requireApprovedSellerProfile(req.user!.id);
  const product = await productService.createProduct(sellerProfile.id, parsed.data);
  res.status(201).json({ product });
}

export async function updateProduct(req: Request, res: Response) {
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const sellerProfile = await productService.requireApprovedSellerProfile(req.user!.id);
  const product = await productService.updateProduct(sellerProfile.id, req.params.id as string, parsed.data);
  res.json({ product });
}
