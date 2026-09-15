// Types shared between client and server. Kept minimal for now — grows alongside the
// features that need cross-package request/response shapes (auth, product forms, etc.).

export const ROLES = ["buyer", "seller", "admin", "support"] as const;
export type Role = (typeof ROLES)[number];

export * from "./auth.js";
export * from "./admin.js";
export * from "./product.js";
