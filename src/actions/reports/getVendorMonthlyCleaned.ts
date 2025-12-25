"use server";

import { prisma } from "@/lib/db";
import { requireUser, requireRole, requirePropertyAccess } from "@/lib/auth";
import {
  LinenCondition,
  LocationKind,
  TxnType,
  UserRole,
} from "@prisma/client";

function monthRangeUTC(month: string) {
  // month: "2025-12"
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0)); // next month
  return { start, end };
}

export async function getVendorMonthlyCleaned(input: {
  propertyId: string;
  vendorId: string;
  month: string; // "YYYY-MM"
}) {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN, UserRole.HOUSEKEEPING]);
  await requirePropertyAccess(user, input.propertyId);

  const { start, end } = monthRangeUTC(input.month);

  // CLEAN returned to Clean Store (the billable “cleaned pieces”)
  const byItem = await prisma.transactionEntry.groupBy({
    by: ["linenItemId"],
    where: {
      qtyDelta: { gt: 0 },
      condition: LinenCondition.CLEAN,
      location: { kind: LocationKind.CLEAN_STORE },
      transaction: {
        propertyId: input.propertyId,
        vendorId: input.vendorId,
        type: TxnType.RECEIVE_FROM_LAUNDRY,
        occurredAt: { gte: start, lt: end },
        voidedAt: null,
      },
    },
    _sum: { qtyDelta: true },
  });

  const itemIds = byItem.map((x) => x.linenItemId);
  const items = await prisma.linenItem.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, name: true },
  });
  const nameMap = new Map(items.map((i) => [i.id, i.name]));

  const lines = byItem
    .map((x) => ({
      linenItemId: x.linenItemId,
      linenItemName: nameMap.get(x.linenItemId) ?? "Unknown",
      qtyCleaned: x._sum.qtyDelta ?? 0,
    }))
    .sort((a, b) => b.qtyCleaned - a.qtyCleaned);

  const totalPieces = lines.reduce((sum, l) => sum + l.qtyCleaned, 0);

  return {
    ok: true as const,
    month: input.month,
    range: { start, end }, // for debugging
    totalPieces,
    lines,
  };
}
