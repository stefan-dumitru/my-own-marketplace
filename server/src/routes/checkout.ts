import { Router } from "express";

import * as orderController from "../controllers/order.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const checkoutRouter = Router();

checkoutRouter.post("/", requireAuth, requireRole("buyer"), orderController.checkout);
