import type { AuthUser, RegisterInput } from "@stefanmarket/shared";
import bcrypt from "bcrypt";

import { generateMfaQrCode, generateMfaSecret, verifyMfaCode } from "../lib/mfa.js";
import { prisma } from "../lib/prisma.js";
import {
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
  signMfaToken,
  verifyMfaToken,
} from "../lib/tokens.js";

const BCRYPT_ROUNDS = 12;

class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function toAuthUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  mfaEnabled: boolean;
}): Promise<AuthUser> {
  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as AuthUser["role"],
    mfaEnabled: user.mfaEnabled,
  };
  if (user.role === "seller") {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { status: true },
    });
    if (sellerProfile) authUser.sellerStatus = sellerProfile.status;
  }
  return authUser;
}

async function issueSession(user: { id: string; role: string }) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role as AuthUser["role"] });
  const { token: refreshToken, tokenHash, expiresAt } = generateRefreshToken();
  await prisma.refreshToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
  return { accessToken, refreshToken };
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AuthError("An account with this email already exists", 409);

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      phone: input.phone,
      role: input.role,
      ...(input.role === "seller"
        ? {
            sellerProfile: {
              create: {
                companyName: input.companyName,
                registrationNumber: input.registrationNumber,
                iban: input.iban,
              },
            },
          }
        : {}),
    },
  });

  const { accessToken, refreshToken } = await issueSession(user);
  return { accessToken, refreshToken, user: await toAuthUser(user) };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) throw new AuthError("Invalid email or password", 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AuthError("Invalid email or password", 401);

  if (user.status === "suspended") throw new AuthError("This account has been suspended", 403);

  if ((user.role === "admin" || user.role === "support") && user.mfaEnabled) {
    return { mfaRequired: true as const, mfaToken: signMfaToken(user.id) };
  }

  const { accessToken, refreshToken } = await issueSession(user);
  return { mfaRequired: false as const, accessToken, refreshToken, user: await toAuthUser(user) };
}

export async function completeMfaLogin(mfaToken: string, code: string) {
  let userId: string;
  try {
    userId = verifyMfaToken(mfaToken).sub;
  } catch {
    throw new AuthError("Invalid or expired MFA challenge", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.mfaSecret) throw new AuthError("MFA is not set up for this account", 400);
  if (!verifyMfaCode(user.mfaSecret, code)) throw new AuthError("Incorrect code", 401);

  const { accessToken, refreshToken } = await issueSession(user);
  return { accessToken, refreshToken, user: await toAuthUser(user) };
}

export async function refreshSession(refreshTokenRaw: string) {
  const tokenHash = hashRefreshToken(refreshTokenRaw);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AuthError("Invalid or expired refresh token", 401);
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

  const { accessToken, refreshToken } = await issueSession(stored.user);
  return { accessToken, refreshToken, user: await toAuthUser(stored.user) };
}

export async function logout(refreshTokenRaw: string) {
  const tokenHash = hashRefreshToken(refreshTokenRaw);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function setupMfa(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const secret = generateMfaSecret();
  await prisma.user.update({ where: { id: userId }, data: { mfaSecret: secret } });
  const qrCodeDataUrl = await generateMfaQrCode(user.email, secret);
  return { qrCodeDataUrl, secret };
}

export async function verifyMfaSetup(userId: string, code: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.mfaSecret) throw new AuthError("MFA setup has not been started", 400);
  if (!verifyMfaCode(user.mfaSecret, code)) throw new AuthError("Incorrect code", 401);
  await prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
}

export async function findOrCreateGoogleUser(profile: {
  googleId: string;
  email: string;
  name: string;
}) {
  let user = await prisma.user.findUnique({ where: { googleId: profile.googleId } });
  if (user) return user;

  user = await prisma.user.findUnique({ where: { email: profile.email } });
  if (user) {
    return prisma.user.update({ where: { id: user.id }, data: { googleId: profile.googleId } });
  }

  // Google sign-in only ever creates a Buyer — Seller registration needs company/IBAN
  // details a Google profile can't supply.
  return prisma.user.create({
    data: { email: profile.email, name: profile.name, googleId: profile.googleId, role: "buyer" },
  });
}

export async function getAuthUser(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return toAuthUser(user);
}

export async function issueSessionForUser(user: { id: string; role: string }) {
  return issueSession(user);
}

export { AuthError, toAuthUser };
