import { Router } from "express";

import { requireAuth, requireRole } from "../middleware/auth.js";

// Minimal proof that the requireAuth/requireRole middleware correctly isolates each role's
// route prefix, per the /api/<role>/* convention in CLAUDE.md. Replaced by real endpoints
// as each role's features are built in later milestones.
export const rolePingRouter = Router();

rolePingRouter.get("/support/ping", requireAuth, requireRole("support"), (_req, res) => {
  res.json({ pong: "support" });
});
