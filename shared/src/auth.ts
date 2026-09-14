import { z } from "zod";

// Self-service registration only covers Buyer and Seller — Admin/Support are staff-only
// roles created via the seed script / an Admin action, never through this endpoint.
export const registerSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("buyer"),
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(1),
    phone: z.string().optional(),
  }),
  z.object({
    role: z.literal("seller"),
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(1),
    phone: z.string().optional(),
    companyName: z.string().min(1),
    registrationNumber: z.string().min(1),
    iban: z.string().min(1),
  }),
]);
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const mfaLoginVerifySchema = z.object({
  mfaToken: z.string().min(1),
  code: z.string().length(6),
});
export type MfaLoginVerifyInput = z.infer<typeof mfaLoginVerifySchema>;

export const mfaSetupVerifySchema = z.object({
  code: z.string().length(6),
});
export type MfaSetupVerifyInput = z.infer<typeof mfaSetupVerifySchema>;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "buyer" | "seller" | "admin" | "support";
  mfaEnabled: boolean;
  sellerStatus?: "pending" | "approved" | "suspended" | "rejected";
}

export interface LoginResponse {
  mfaRequired?: false;
  accessToken: string;
  user: AuthUser;
}

export interface MfaRequiredResponse {
  mfaRequired: true;
  mfaToken: string;
}
