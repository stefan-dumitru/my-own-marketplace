import { Router } from "express";

import * as sellerProductController from "../controllers/sellerProduct.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const sellerProductsRouter = Router();

sellerProductsRouter.use(requireAuth, requireRole("seller"));

sellerProductsRouter.get("/", sellerProductController.listOwnProducts);
sellerProductsRouter.post("/", sellerProductController.createProduct);
sellerProductsRouter.patch("/:id", sellerProductController.updateProduct);
