import { Router } from "express";

import * as categoryController from "../controllers/category.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const adminCategoriesRouter = Router();

adminCategoriesRouter.use(requireAuth, requireRole("admin"));

adminCategoriesRouter.get("/", categoryController.listCategories);
adminCategoriesRouter.post("/", categoryController.createCategory);
adminCategoriesRouter.patch("/:id", categoryController.updateCategory);
