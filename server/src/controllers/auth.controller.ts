import { loginSchema, mfaLoginVerifySchema, mfaSetupVerifySchema, registerSchema } from "@stefanmarket/shared";
import type { Request, Response } from "express";

import * as authService from "../services/auth.service.js";
import { AuthError } from "../services/auth.service.js";

const REFRESH_COOKIE = "refreshToken";
const REFRESH_COOKIE_PATH = "/api/auth";
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
}

function handleAuthError(err: unknown, res: Response) {
  if (err instanceof AuthError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  throw err;
}

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  try {
    const { accessToken, refreshToken, user } = await authService.registerUser(parsed.data);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ accessToken, user });
  } catch (err) {
    handleAuthError(err, res);
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await authService.login(parsed.data.email, parsed.data.password);
    if (result.mfaRequired) {
      res.json({ mfaRequired: true, mfaToken: result.mfaToken });
      return;
    }
    setRefreshCookie(res, result.refreshToken);
    res.json({ accessToken: result.accessToken, user: result.user });
  } catch (err) {
    handleAuthError(err, res);
  }
}

export async function mfaLoginVerify(req: Request, res: Response) {
  const parsed = mfaLoginVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  try {
    const { accessToken, refreshToken, user } = await authService.completeMfaLogin(
      parsed.data.mfaToken,
      parsed.data.code,
    );
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user });
  } catch (err) {
    handleAuthError(err, res);
  }
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }

  try {
    const { accessToken, refreshToken, user } = await authService.refreshSession(token);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user });
  } catch (err) {
    clearRefreshCookie(res);
    handleAuthError(err, res);
  }
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) await authService.logout(token);
  clearRefreshCookie(res);
  res.status(204).end();
}

export async function me(req: Request, res: Response) {
  const user = await authService.getAuthUser(req.user!.id);
  res.json({ user });
}

export async function mfaSetup(req: Request, res: Response) {
  const { qrCodeDataUrl } = await authService.setupMfa(req.user!.id);
  res.json({ qrCodeDataUrl });
}

export async function mfaSetupVerify(req: Request, res: Response) {
  const parsed = mfaSetupVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  try {
    await authService.verifyMfaSetup(req.user!.id, parsed.data.code);
    res.status(204).end();
  } catch (err) {
    handleAuthError(err, res);
  }
}

export async function googleCallback(req: Request, res: Response) {
  // passport.authenticate({ session: false }) attaches the resolved user to req.user.
  const user = req.user!;
  const { accessToken, refreshToken } = await authService.issueSessionForUser(user);
  setRefreshCookie(res, refreshToken);
  // The SPA can't read this redirect's response body, so we only set the refresh cookie
  // here; the client fetches a fresh access token via POST /api/auth/refresh on landing.
  void accessToken;
  res.redirect(process.env.CLIENT_ORIGIN ?? "/");
}
