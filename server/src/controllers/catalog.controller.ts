import type { Request, Response } from "express";

import * as categoryService from "../services/category.service.js";
import * as productService from "../services/product.service.js";

export async function listCategories(_req: Request, res: Response) {
  const categories = await categoryService.listPublicCategories();
  res.json({ categories });
}

export async function listProducts(req: Request, res: Response) {
  const { category, q, minPrice, maxPrice, page, limit } = req.query;
  const result = await productService.listPublicProducts({
    categoryId: typeof category === "string" ? category : undefined,
    q: typeof q === "string" ? q : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json(result);
}

export async function getProduct(req: Request, res: Response) {
  const product = await productService.getPublicProductBySlug(req.params.slug as string);
  res.json({ product });
}
