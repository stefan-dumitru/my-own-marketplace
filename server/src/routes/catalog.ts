import { Router } from "express";

import * as catalogController from "../controllers/catalog.controller.js";

export const catalogRouter = Router();

catalogRouter.get("/categories", catalogController.listCategories);
catalogRouter.get("/products", catalogController.listProducts);
catalogRouter.get("/products/:slug", catalogController.getProduct);
