import { Router } from "express";

import * as cartController from "../controllers/cart.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const buyerCartRouter = Router();

buyerCartRouter.use(requireAuth, requireRole("buyer"));

buyerCartRouter.get("/", cartController.getCart);
buyerCartRouter.post("/", cartController.addToCart);
buyerCartRouter.patch("/:itemId", cartController.updateCartItem);
buyerCartRouter.delete("/:itemId", cartController.removeCartItem);
