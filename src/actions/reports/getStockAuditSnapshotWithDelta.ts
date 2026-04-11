"use server";

import { prisma } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";

export type StockAuditSnapshotLineWithDelta = {
  linenItemId: string;
  linenItemName: string;
  sku: string | null;
  totalQty: number;
  prevTotalQty: number | null;
  delta: number | null;
};

export type StockAuditSnapshotDeltaSummary = {
  /** Lines where delta ≠ 0 (excludes baseline rows with no prior). */
  changedLineCount: number;
  /** Sum of deltas vs prior audit; null when there is no prior snapshot. */
  netPiecesDelta: number | null;
};

export type StockAuditSnapshotDetail = {
  id: string;
  propertyId: string;
  propertyName: string;
  weekStart: Date;
  capturedAt: Date;
  includeVendor: boolean;
  includeDiscarded: boolean;
  prevWeekStart: Date | null;
  prevSnapshotId: string | null;
  summary: StockAuditSnapshotDeltaSummary;
  lines: StockAuditSnapshotLineWithDelta[];
};

function sortDeltaLines(lines: StockAuditSnapshotLineWithDelta[]): void {
  lines.sort((a, b) => {
    const aBase = a.delta === null;
    const bBase = b.delta === null;
    if (aBase !== bBase) return aBase ? 1 : -1;
    const az = a.delta === 0 ? 1 : 0;
    const bz = b.delta === 0 ? 1 : 0;
    if (az !== bz) return az - bz;
    const ad = Math.abs(a.delta ?? 0);
    const bd = Math.abs(b.delta ?? 0);
    if (ad !== bd) return bd - ad;
    return a.linenItemName.localeCompare(b.linenItemName);
  });
}

export async function getStockAuditSnapshotWithDelta(
  snapshotId: string
): Promise<StockAuditSnapshotDetail | null> {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  const snap = await prisma.stockAuditSnapshot.findUnique({
    where: { id: snapshotId },
    include: {
      property: { select: { name: true } },
      lines: {
        include: {
          linenItem: { select: { name: true, sku: true } },
        },
        orderBy: { linenItem: { name: "asc" } },
      },
    },
  });

  if (!snap) return null;

  const prev = await prisma.stockAuditSnapshot.findFirst({
    where: {
      propertyId: snap.propertyId,
      includeVendor: snap.includeVendor,
      includeDiscarded: snap.includeDiscarded,
      weekStart: { lt: snap.weekStart },
    },
    orderBy: { weekStart: "desc" },
    select: { id: true, weekStart: true },
  });

  const prevLines = prev
    ? await prisma.stockAuditSnapshotLine.findMany({
        where: { snapshotId: prev.id },
        select: { linenItemId: true, totalQty: true },
      })
    : [];

  const prevMap = new Map(
    prevLines.map((l) => [l.linenItemId, l.totalQty])
  );

  const currentIds = new Set(snap.lines.map((l) => l.linenItemId));

  const lines: StockAuditSnapshotLineWithDelta[] = snap.lines.map((l) => {
    const prevQty = prev ? (prevMap.get(l.linenItemId) ?? 0) : null;
    const delta = prevQty !== null ? l.totalQty - prevQty : null;
    return {
      linenItemId: l.linenItemId,
      linenItemName: l.linenItem.name,
      sku: l.linenItem.sku,
      totalQty: l.totalQty,
      prevTotalQty: prevQty,
      delta,
    };
  });

  if (prev) {
    const seenOrphan = new Set<string>();
    const orphanPrev = prevLines.filter((pl) => {
      if (currentIds.has(pl.linenItemId) || seenOrphan.has(pl.linenItemId)) {
        return false;
      }
      seenOrphan.add(pl.linenItemId);
      return true;
    });
    if (orphanPrev.length > 0) {
      const orphanIds = orphanPrev.map((p) => p.linenItemId);
      const metas = await prisma.linenItem.findMany({
        where: { id: { in: orphanIds } },
        select: { id: true, name: true, sku: true, isActive: true },
      });
      const metaById = new Map(metas.map((m) => [m.id, m]));
      for (const pl of orphanPrev) {
        const meta = metaById.get(pl.linenItemId);
        const suffix =
          meta && !meta.isActive ? " (inactive)" : "";
        lines.push({
          linenItemId: pl.linenItemId,
          linenItemName: meta
            ? `${meta.name}${suffix}`
            : "(item not in current audit)",
          sku: meta?.sku ?? null,
          totalQty: 0,
          prevTotalQty: pl.totalQty,
          delta: -pl.totalQty,
        });
      }
    }
  }

  sortDeltaLines(lines);

  const changedLineCount = lines.filter(
    (l) => l.delta !== null && l.delta !== 0
  ).length;
  const netPiecesDelta = prev
    ? lines.reduce((s, l) => s + (l.delta ?? 0), 0)
    : null;

  return {
    id: snap.id,
    propertyId: snap.propertyId,
    propertyName: snap.property.name,
    weekStart: snap.weekStart,
    capturedAt: snap.capturedAt,
    includeVendor: snap.includeVendor,
    includeDiscarded: snap.includeDiscarded,
    prevWeekStart: prev?.weekStart ?? null,
    prevSnapshotId: prev?.id ?? null,
    summary: { changedLineCount, netPiecesDelta },
    lines,
  };
}
