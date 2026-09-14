import { createCategorySchema, updateCategorySchema } from "@stefanmarket/shared";
import type { Request, Response } from "express";

import * as categoryService from "../services/category.service.js";

export async function listCategories(_req: Request, res: Response) {
  const categories = await categoryService.listCategories();
  res.json({ categories });
}

export async function createCategory(req: Request, res: Response) {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const category = await categoryService.createCategory(parsed.data);
  res.status(201).json({ category });
}

export async function updateCategory(req: Request, res: Response) {
  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const category = await categoryService.updateCategory(req.params.id as string, parsed.data);
  res.json({ category });
}
