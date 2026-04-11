"use server";

import { prisma } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";

export type StockAuditSnapshotListRow = {
  id: string;
  propertyId: string;
  propertyName: string;
  weekStart: Date;
  capturedAt: Date;
  includeVendor: boolean;
  includeDiscarded: boolean;
  createdByName: string | null;
  createdByEmail: string | null;
  lineCount: number;
  totalQty: number;
};

export async function listStockAuditSnapshots(input?: {
  propertyId?: string;
  limit?: number;
}): Promise<StockAuditSnapshotListRow[]> {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  const limit = Math.min(Math.max(input?.limit ?? 200, 1), 500);

  const snapshots = await prisma.stockAuditSnapshot.findMany({
    where: input?.propertyId ? { propertyId: input.propertyId } : undefined,
    orderBy: [{ weekStart: "desc" }, { capturedAt: "desc" }],
    take: limit,
    include: {
      property: { select: { name: true } },
      createdBy: { select: { name: true, email: true } },
    },
  });

  if (!snapshots.length) return [];

  const ids = snapshots.map((s) => s.id);
  const sums = await prisma.stockAuditSnapshotLine.groupBy({
    by: ["snapshotId"],
    where: { snapshotId: { in: ids } },
    _sum: { totalQty: true },
  });
  const counts = await prisma.stockAuditSnapshotLine.groupBy({
    by: ["snapshotId"],
    where: { snapshotId: { in: ids } },
    _count: { id: true },
  });

  const sumMap = new Map(
    sums.map((x) => [x.snapshotId, Number(x._sum.totalQty ?? 0)])
  );
  const countMap = new Map(
    counts.map((x) => [x.snapshotId, x._count.id])
  );

  return snapshots.map((s) => ({
    id: s.id,
    propertyId: s.propertyId,
    propertyName: s.property.name,
    weekStart: s.weekStart,
    capturedAt: s.capturedAt,
    includeVendor: s.includeVendor,
    includeDiscarded: s.includeDiscarded,
    createdByName: s.createdBy?.name ?? null,
    createdByEmail: s.createdBy?.email ?? null,
    lineCount: countMap.get(s.id) ?? 0,
    totalQty: sumMap.get(s.id) ?? 0,
  }));
}
