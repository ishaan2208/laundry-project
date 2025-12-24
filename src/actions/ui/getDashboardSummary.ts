"use server";

import { prisma } from "@/lib/db";
import { requireUser, requirePropertyAccess } from "@/lib/auth";
import { LocationKind, LinenCondition } from "@prisma/client";

export type VendorPendingCard = {
  vendorId: string;
  vendorName: string;
  pendingQty: number;
};

export async function getDashboardSummary(input: {
  propertyId: string;
}): Promise<
  | {
      ok: true;
      vendorPendingTop: VendorPendingCard[];
    }
  | { ok: false; message: string }
> {
  const user = await requireUser();
  await requirePropertyAccess(user, input.propertyId);

  // Find vendor locations for this property
  const vendorLocs = await prisma.location.findMany({
    where: {
      propertyId: input.propertyId,
      kind: LocationKind.VENDOR,
      isActive: true,
    },
    select: {
      id: true,
      vendorId: true,
      vendor: { select: { id: true, name: true } },
    },
  });

  if (!vendorLocs.length) return { ok: true, vendorPendingTop: [] };

  // Sum pending (SOILED+REWASH) by vendor location
  const sums = await prisma.transactionEntry.groupBy({
    by: ["locationId"],
    where: {
      propertyId: input.propertyId,
      locationId: { in: vendorLocs.map((v) => v.id) },
      condition: { in: [LinenCondition.SOILED, LinenCondition.REWASH] },
    },
    _sum: { qtyDelta: true },
  });

  const sumByLoc = new Map(
    sums.map((s) => [s.locationId, Number(s._sum.qtyDelta ?? 0)])
  );
  const cards: VendorPendingCard[] = vendorLocs
    .map((loc) => ({
      vendorId: loc.vendorId!,
      vendorName: loc.vendor?.name ?? "Vendor",
      pendingQty: Math.max(0, Math.round(sumByLoc.get(loc.id) ?? 0)),
    }))
    .filter((c) => c.pendingQty > 0)
    .sort((a, b) => b.pendingQty - a.pendingQty)
    .slice(0, 3);

  return { ok: true, vendorPendingTop: cards };
}
