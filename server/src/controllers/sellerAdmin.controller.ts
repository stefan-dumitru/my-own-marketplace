import { rejectSellerSchema, suspendSellerSchema, type SellerStatus } from "@stefanmarket/shared";
import type { Request, Response } from "express";

import * as sellerAdminService from "../services/sellerAdmin.service.js";

export async function listSellers(req: Request, res: Response) {
  const status = req.query.status as SellerStatus | undefined;
  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  const result = await sellerAdminService.listSellers({ status, page, limit });
  res.json(result);
}

export async function approveSeller(req: Request, res: Response) {
  await sellerAdminService.approveSeller(req.params.id as string, req.user!.id);
  res.status(204).end();
}

export async function rejectSeller(req: Request, res: Response) {
  const parsed = rejectSellerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  await sellerAdminService.rejectSeller(req.params.id as string, req.user!.id, parsed.data.reason);
  res.status(204).end();
}

export async function suspendSeller(req: Request, res: Response) {
  const parsed = suspendSellerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  await sellerAdminService.suspendSeller(req.params.id as string, req.user!.id, parsed.data.reason);
  res.status(204).end();
}
