import type { CategoryView, CreateCategoryInput, UpdateCategoryInput } from "@stefanmarket/shared";

import { AppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || "category";
  let suffix = 2;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function toCategoryView(category: {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
}): CategoryView {
  return category;
}

export async function listCategories(): Promise<CategoryView[]> {
  const categories = await prisma.category.findMany({ orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }] });
  return categories.map(toCategoryView);
}

// Public/buyer-facing read — excludes archived categories, unlike the admin listCategories above.
export async function listPublicCategories(): Promise<CategoryView[]> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
  });
  return categories.map(toCategoryView);
}

export async function createCategory(input: CreateCategoryInput): Promise<CategoryView> {
  if (input.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: input.parentId } });
    if (!parent) throw new AppError("Parent category not found", 400);
  }

  const slug = await uniqueSlug(slugify(input.name));
  const category = await prisma.category.create({
    data: {
      name: input.name,
      slug,
      parentId: input.parentId ?? null,
      sortOrder: input.sortOrder ?? 0,
    },
  });
  return toCategoryView(category);
}

async function wouldCreateCycle(categoryId: string, newParentId: string): Promise<boolean> {
  let currentId: string | null = newParentId;
  while (currentId) {
    if (currentId === categoryId) return true;
    const current: { parentId: string | null } | null = await prisma.category.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    currentId = current?.parentId ?? null;
  }
  return false;
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<CategoryView> {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new AppError("Category not found", 404);

  if (input.parentId) {
    if (input.parentId === id) throw new AppError("A category cannot be its own parent", 400);
    const parent = await prisma.category.findUnique({ where: { id: input.parentId } });
    if (!parent) throw new AppError("Parent category not found", 400);
    if (await wouldCreateCycle(id, input.parentId)) {
      throw new AppError("This would create a circular category tree", 400);
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: input.name,
      parentId: input.parentId === undefined ? undefined : input.parentId,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    },
  });
  return toCategoryView(category);
}
