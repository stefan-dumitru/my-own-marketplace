import { Router } from "express";

import * as orderController from "../controllers/order.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const buyerOrdersRouter = Router();

buyerOrdersRouter.use(requireAuth, requireRole("buyer"));

buyerOrdersRouter.get("/", orderController.listOrders);
buyerOrdersRouter.get("/:id", orderController.getOrder);
