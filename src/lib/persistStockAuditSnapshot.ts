import "server-only";

import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { computeStockAuditRollupCore } from "@/lib/computeStockAuditRollupCore";
import type { StockAuditRow } from "@/actions/reports/types";

function lineCreateInputs(
  snapshotId: string,
  rollupRows: StockAuditRow[]
): Prisma.StockAuditSnapshotLineCreateManyInput[] {
  return rollupRows.map((row) => ({
    snapshotId,
    linenItemId: row.linenItemId,
    totalQty: row.totalQty,
    breakdown: {
      byCondition: row.byCondition,
      byLocationKind: row.byLocationKind,
    },
  }));
}

async function replaceLines(
  tx: Prisma.TransactionClient,
  snapshotId: string,
  rollupRows: StockAuditRow[]
) {
  await tx.stockAuditSnapshotLine.deleteMany({
    where: { snapshotId },
  });
  const data = lineCreateInputs(snapshotId, rollupRows);
  if (data.length > 0) {
    await tx.stockAuditSnapshotLine.createMany({ data });
  }
}

/**
 * Persist a weekly snapshot. Cron uses skip_if_exists (create once per week key).
 * Manual recording uses replace (upsert + refresh lines).
 */
export async function persistStockAuditSnapshot(opts: {
  propertyId: string;
  weekStart: Date;
  includeVendor: boolean;
  includeDiscarded: boolean;
  createdById: string | null;
  mode: "replace" | "skip_if_exists";
}): Promise<{ snapshotId: string; skipped: boolean }> {
  if (opts.mode === "skip_if_exists") {
    const existing = await prisma.stockAuditSnapshot.findUnique({
      where: {
        propertyId_weekStart_includeVendor_includeDiscarded: {
          propertyId: opts.propertyId,
          weekStart: opts.weekStart,
          includeVendor: opts.includeVendor,
          includeDiscarded: opts.includeDiscarded,
        },
      },
    });
    if (existing) {
      return { snapshotId: existing.id, skipped: true };
    }
  }

  const rollup = await computeStockAuditRollupCore({
    propertyId: opts.propertyId,
    includeVendor: opts.includeVendor,
    includeDiscarded: opts.includeDiscarded,
  });

  if (opts.mode === "skip_if_exists") {
    const snap = await prisma.$transaction(async (tx) => {
      const s = await tx.stockAuditSnapshot.create({
        data: {
          propertyId: opts.propertyId,
          weekStart: opts.weekStart,
          createdById: opts.createdById,
          includeVendor: opts.includeVendor,
          includeDiscarded: opts.includeDiscarded,
        },
      });
      await replaceLines(tx, s.id, rollup.rows);
      return s;
    });
    return { snapshotId: snap.id, skipped: false };
  }

  const snap = await prisma.$transaction(async (tx) => {
    const s = await tx.stockAuditSnapshot.upsert({
      where: {
        propertyId_weekStart_includeVendor_includeDiscarded: {
          propertyId: opts.propertyId,
          weekStart: opts.weekStart,
          includeVendor: opts.includeVendor,
          includeDiscarded: opts.includeDiscarded,
        },
      },
      create: {
        propertyId: opts.propertyId,
        weekStart: opts.weekStart,
        createdById: opts.createdById,
        includeVendor: opts.includeVendor,
        includeDiscarded: opts.includeDiscarded,
      },
      update: {
        capturedAt: new Date(),
        ...(opts.createdById != null ? { createdById: opts.createdById } : {}),
      },
    });
    await replaceLines(tx, s.id, rollup.rows);
    return s;
  });

  return { snapshotId: snap.id, skipped: false };
}
