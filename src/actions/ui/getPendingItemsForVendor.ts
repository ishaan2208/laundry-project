"use server";

import { prisma } from "@/lib/db";
import { requireUser, requirePropertyAccess } from "@/lib/auth";
import { LinenCondition, LocationKind } from "@prisma/client";

export type PendingItemRow = {
  linenItemId: string;
  pendingSoiled: number;
  pendingRewash: number;
  totalPending: number;
};

export async function getPendingItemsForVendor(input: {
  propertyId: string;
  vendorId: string;
}): Promise<
  { ok: true; rows: PendingItemRow[] } | { ok: false; message: string }
> {
  const user = await requireUser();
  await requirePropertyAccess(user, input.propertyId);

  const vendorLoc = await prisma.location.findFirst({
    where: {
      propertyId: input.propertyId,
      kind: LocationKind.VENDOR,
      vendorId: input.vendorId,
      isActive: true,
    },
    select: { id: true },
  });

  if (!vendorLoc)
    return {
      ok: false,
      message: "Vendor location not found for this property.",
    };

  const grouped = await prisma.transactionEntry.groupBy({
    by: ["linenItemId", "condition"],
    where: {
      propertyId: input.propertyId,
      locationId: vendorLoc.id,
      condition: { in: [LinenCondition.SOILED, LinenCondition.REWASH] },
    },
    _sum: { qtyDelta: true },
  });

  const map = new Map<string, { soiled: number; rewash: number }>();
  for (const g of grouped) {
    const id = g.linenItemId;
    const sum = Number(g._sum.qtyDelta ?? 0);
    const cur = map.get(id) ?? { soiled: 0, rewash: 0 };
    if (g.condition === LinenCondition.SOILED) cur.soiled = sum;
    if (g.condition === LinenCondition.REWASH) cur.rewash = sum;
    map.set(id, cur);
  }

  const rows: PendingItemRow[] = Array.from(map.entries())
    .map(([linenItemId, v]) => {
      const pendingSoiled = Math.max(0, Math.round(v.soiled));
      const pendingRewash = Math.max(0, Math.round(v.rewash));
      return {
        linenItemId,
        pendingSoiled,
        pendingRewash,
        totalPending: pendingSoiled + pendingRewash,
      };
    })
    .filter((r) => r.totalPending > 0)
    .sort((a, b) => b.totalPending - a.totalPending);

  return { ok: true, rows };
}
