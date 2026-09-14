import crypto from "node:crypto";

import type { Role } from "@stefanmarket/shared";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MFA_TOKEN_TTL = "5m";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

// The refresh token itself is a random opaque string, not a JWT — we only ever need to
// look it up by its hash, never decode claims out of it client-side.
export function generateRefreshToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = crypto.randomBytes(48).toString("hex");
  return {
    token,
    tokenHash: hashRefreshToken(token),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  };
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// A short-lived token identifying a login that passed the password check but still needs
// an MFA code — not a session token, can't be used to call any authenticated endpoint.
export interface MfaTokenPayload {
  sub: string;
  purpose: "mfa-login";
}

export function signMfaToken(userId: string): string {
  return jwt.sign({ sub: userId, purpose: "mfa-login" } satisfies MfaTokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: MFA_TOKEN_TTL,
  });
}

export function verifyMfaToken(token: string): MfaTokenPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as MfaTokenPayload;
  if (payload.purpose !== "mfa-login") throw new Error("Invalid token purpose");
  return payload;
}
