import type { CreateProductInput, ProductDetail, ProductSummary, UpdateProductInput } from "@stefanmarket/shared";
import type { Prisma } from "@prisma/client";

import { AppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

const DEFAULT_PAGE_SIZE = 20;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueProductSlug(base: string): Promise<string> {
  let slug = base || "product";
  let suffix = 2;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { images: true; category: { select: { id: true; name: true } } };
}>;

function toProductSummary(product: ProductWithRelations): ProductSummary {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    basePrice: product.basePrice.toString(),
    currency: product.currency,
    stockQuantity: product.stockQuantity,
    isActive: product.isActive,
    imageUrl: product.images[0]?.url ?? null,
    category: product.category,
  };
}

function toProductDetail(
  product: ProductWithRelations & { seller: { companyName: string } },
): ProductDetail {
  return {
    ...toProductSummary(product),
    description: product.description,
    images: product.images.map((img) => ({ url: img.url, altText: img.altText })),
    seller: { companyName: product.seller.companyName },
  };
}

export async function getOwnSellerProfile(userId: string) {
  const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!sellerProfile) throw new AppError("No seller profile for this account", 403);
  return sellerProfile;
}

// Stricter than getOwnSellerProfile — for creating/editing listings, not just viewing them, so a
// suspended seller can still see their own (now publicly hidden) products but can't touch them.
export async function requireApprovedSellerProfile(userId: string) {
  const sellerProfile = await getOwnSellerProfile(userId);
  if (sellerProfile.status !== "approved") {
    throw new AppError("Your seller account must be approved before you can list products", 403);
  }
  return sellerProfile;
}

export async function createProduct(sellerId: string, input: CreateProductInput) {
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) throw new AppError("Category not found", 400);

  const slug = await uniqueProductSlug(slugify(input.title));

  const product = await prisma.product.create({
    data: {
      sellerId,
      categoryId: input.categoryId,
      title: input.title,
      slug,
      description: input.description,
      basePrice: input.basePrice,
      stockQuantity: input.stockQuantity,
      isActive: input.isActive ?? true,
      images: { create: input.imageUrls.map((url, i) => ({ url, sortOrder: i })) },
    },
    include: { images: true, category: { select: { id: true, name: true } } },
  });
  return toProductSummary(product);
}

async function getOwnedProductOrThrow(sellerId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  // 404 rather than 403 on a mismatched owner, so we don't confirm another seller's product IDs.
  if (!product || product.sellerId !== sellerId) throw new AppError("Product not found", 404);
  return product;
}

export async function updateProduct(sellerId: string, productId: string, input: UpdateProductInput) {
  await getOwnedProductOrThrow(sellerId, productId);

  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw new AppError("Category not found", 400);
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      basePrice: input.basePrice,
      stockQuantity: input.stockQuantity,
      isActive: input.isActive,
      ...(input.imageUrls
        ? {
            images: {
              deleteMany: {},
              create: input.imageUrls.map((url, i) => ({ url, sortOrder: i })),
            },
          }
        : {}),
    },
    include: { images: true, category: { select: { id: true, name: true } } },
  });
  return toProductSummary(product);
}

export async function listSellerProducts(sellerId: string, params: { page?: number; limit?: number }) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : DEFAULT_PAGE_SIZE;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId },
      include: { images: true, category: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where: { sellerId } }),
  ]);

  return { products: products.map(toProductSummary), total, page, limit };
}

export async function listPublicProducts(params: {
  categoryId?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : DEFAULT_PAGE_SIZE;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    seller: { status: "approved" },
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    ...(params.q
      ? {
          OR: [
            { title: { contains: params.q, mode: "insensitive" } },
            { description: { contains: params.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(params.minPrice !== undefined || params.maxPrice !== undefined
      ? {
          basePrice: {
            ...(params.minPrice !== undefined ? { gte: params.minPrice } : {}),
            ...(params.maxPrice !== undefined ? { lte: params.maxPrice } : {}),
          },
        }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: true, category: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { products: products.map(toProductSummary), total, page, limit };
}

export async function getPublicProductBySlug(slug: string): Promise<ProductDetail> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: true,
      category: { select: { id: true, name: true } },
      seller: { select: { companyName: true, status: true } },
    },
  });
  if (!product || !product.isActive || product.seller.status !== "approved") {
    throw new AppError("Product not found", 404);
  }
  return toProductDetail(product);
}
