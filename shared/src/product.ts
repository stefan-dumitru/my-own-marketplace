import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  categoryId: z.string().min(1),
  basePrice: z.number().positive(),
  stockQuantity: z.number().int().min(0),
  imageUrls: z.array(z.string().url()).min(1, "At least one image URL is required"),
  isActive: z.boolean().optional(),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  basePrice: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  imageUrls: z.array(z.string().url()).min(1).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export interface ProductSummary {
  id: string;
  slug: string;
  title: string;
  basePrice: string;
  currency: string;
  stockQuantity: number;
  isActive: boolean;
  imageUrl: string | null;
  category: { id: string; name: string };
}

export interface ProductDetail extends Omit<ProductSummary, "imageUrl"> {
  description: string;
  images: { url: string; altText: string | null }[];
  seller: { companyName: string };
}
