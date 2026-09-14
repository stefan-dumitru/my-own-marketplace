import type { Prisma, PrismaClient } from "@prisma/client";
import type { Role } from "@stefanmarket/shared";

type TxClient = PrismaClient | Prisma.TransactionClient;

export function writeAuditLog(
  tx: TxClient,
  entry: {
    actorId: string;
    actorRole: Role;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: Record<string, unknown>;
  },
) {
  return tx.auditLog.create({
    data: {
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      metadata: entry.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
