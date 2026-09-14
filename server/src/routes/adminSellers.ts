import { Router } from "express";

import * as sellerAdminController from "../controllers/sellerAdmin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const adminSellersRouter = Router();

adminSellersRouter.use(requireAuth, requireRole("admin"));

adminSellersRouter.get("/", sellerAdminController.listSellers);
adminSellersRouter.post("/:id/approve", sellerAdminController.approveSeller);
adminSellersRouter.post("/:id/reject", sellerAdminController.rejectSeller);
adminSellersRouter.post("/:id/suspend", sellerAdminController.suspendSeller);
