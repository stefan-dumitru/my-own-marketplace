import rateLimit from "express-rate-limit";
import { Router } from "express";

import { isGoogleOAuthConfigured, passport } from "../config/passport.js";
import { requireAuth } from "../middleware/auth.js";
import * as authController from "../controllers/auth.controller.js";

export const authRouter = Router();

// Basic brute-force / signup-spam protection, per specifications/security.md.
const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true });

authRouter.post("/register", authRateLimit, authController.register);
authRouter.post("/login", authRateLimit, authController.login);
authRouter.post("/mfa/login-verify", authRateLimit, authController.mfaLoginVerify);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);

authRouter.post("/mfa/setup", requireAuth, authController.mfaSetup);
authRouter.post("/mfa/verify", requireAuth, authController.mfaSetupVerify);

if (isGoogleOAuthConfigured) {
  authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
  authRouter.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    authController.googleCallback,
  );
}
