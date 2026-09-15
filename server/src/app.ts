import "express-async-errors";

import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";

import { passport } from "./config/passport.js";
import { env } from "./config/env.js";
import { AppError } from "./lib/errors.js";
import { adminCategoriesRouter } from "./routes/adminCategories.js";
import { adminSellersRouter } from "./routes/adminSellers.js";
import { authRouter } from "./routes/auth.js";
import { catalogRouter } from "./routes/catalog.js";
import { healthRouter } from "./routes/health.js";
import { meRouter } from "./routes/me.js";
import { rolePingRouter } from "./routes/rolePing.js";
import { sellerProductsRouter } from "./routes/sellerProducts.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(passport.initialize());

  app.use("/api", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api", meRouter);
  app.use("/api", rolePingRouter);
  app.use("/api/admin/sellers", adminSellersRouter);
  app.use("/api/admin/categories", adminCategoriesRouter);
  app.use("/api/seller/products", sellerProductsRouter);
  app.use("/api/catalog", catalogRouter);

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
  });

  // Centralized error handler — must be registered last, and must keep all four
  // params for Express to recognize it as an error handler.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
