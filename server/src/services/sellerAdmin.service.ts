import type { SellerAdminView, SellerStatus } from "@stefanmarket/shared";

import { writeAuditLog } from "../lib/audit.js";
import { AppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

const DEFAULT_PAGE_SIZE = 20;

function toSellerAdminView(seller: {
  id: string;
  companyName: string;
  registrationNumber: string;
  status: string;
  createdAt: Date;
  user: { email: string; name: string };
}): SellerAdminView {
  return {
    id: seller.id,
    companyName: seller.companyName,
    registrationNumber: seller.registrationNumber,
    status: seller.status as SellerStatus,
    createdAt: seller.createdAt.toISOString(),
    user: seller.user,
  };
}

export async function listSellers(params: { status?: SellerStatus; page?: number; limit?: number }) {
  const status = params.status ?? "pending";
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : DEFAULT_PAGE_SIZE;

  const [sellers, total] = await Promise.all([
    prisma.sellerProfile.findMany({
      where: { status },
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sellerProfile.count({ where: { status } }),
  ]);

  return { sellers: sellers.map(toSellerAdminView), total, page, limit };
}

async function getSellerOrThrow(sellerId: string) {
  const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
  if (!seller) throw new AppError("Seller not found", 404);
  return seller;
}

export async function approveSeller(sellerId: string, adminId: string) {
  const seller = await getSellerOrThrow(sellerId);
  if (seller.status !== "pending") {
    throw new AppError("Only pending sellers can be approved", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.sellerProfile.update({
      where: { id: sellerId },
      data: { status: "approved", approvedByAdminId: adminId, approvedAt: new Date() },
    });
    await writeAuditLog(tx, {
      actorId: adminId,
      actorRole: "admin",
      action: "seller_approved",
      targetType: "SellerProfile",
      targetId: sellerId,
      metadata: { previousStatus: seller.status },
    });
  });
}

export async function rejectSeller(sellerId: string, adminId: string, reason: string) {
  const seller = await getSellerOrThrow(sellerId);
  if (seller.status !== "pending") {
    throw new AppError("Only pending sellers can be rejected", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.sellerProfile.update({ where: { id: sellerId }, data: { status: "rejected" } });
    await writeAuditLog(tx, {
      actorId: adminId,
      actorRole: "admin",
      action: "seller_rejected",
      targetType: "SellerProfile",
      targetId: sellerId,
      metadata: { previousStatus: seller.status, reason },
    });
  });
}

export async function suspendSeller(sellerId: string, adminId: string, reason: string) {
  const seller = await getSellerOrThrow(sellerId);
  if (seller.status !== "approved") {
    throw new AppError("Only approved sellers can be suspended", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.sellerProfile.update({ where: { id: sellerId }, data: { status: "suspended" } });
    await writeAuditLog(tx, {
      actorId: adminId,
      actorRole: "admin",
      action: "seller_suspended",
      targetType: "SellerProfile",
      targetId: sellerId,
      metadata: { previousStatus: seller.status, reason },
    });
  });
}
