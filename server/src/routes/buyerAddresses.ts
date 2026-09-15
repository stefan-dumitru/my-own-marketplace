import { Router } from "express";

import * as addressController from "../controllers/address.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const buyerAddressesRouter = Router();

buyerAddressesRouter.use(requireAuth, requireRole("buyer"));

buyerAddressesRouter.get("/", addressController.listAddresses);
buyerAddressesRouter.post("/", addressController.createAddress);
