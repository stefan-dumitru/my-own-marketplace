import { z } from "zod";

export const SELLER_STATUSES = ["pending", "approved", "suspended", "rejected"] as const;
export type SellerStatus = (typeof SELLER_STATUSES)[number];

export const rejectSellerSchema = z.object({
  reason: z.string().min(1, "A reason is required"),
});
export type RejectSellerInput = z.infer<typeof rejectSellerSchema>;

export const suspendSellerSchema = z.object({
  reason: z.string().min(1, "A reason is required"),
});
export type SuspendSellerInput = z.infer<typeof suspendSellerSchema>;

export interface SellerAdminView {
  id: string;
  companyName: string;
  registrationNumber: string;
  status: SellerStatus;
  createdAt: string;
  user: { email: string; name: string };
}

export const createCategorySchema = z.object({
  name: z.string().min(1),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export interface CategoryView {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
}
