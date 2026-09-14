import { Router } from "express";

import { me } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const meRouter = Router();

meRouter.get("/me", requireAuth, me);
