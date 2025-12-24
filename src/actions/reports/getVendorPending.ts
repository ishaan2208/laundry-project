"use server";

import { prisma } from "@/lib/db";
import { requireUser, requirePropertyAccess } from "@/lib/auth";
import { LinenCondition, LocationKind } from "@prisma/client";
import { VendorPendingVendorRow } from "../reports/types";

export async function getVendorPending(input: {
  propertyId: string;
  condition?: LinenCondition; // optional filter
  linenItemId?: string;
}) {
  const user = await requireUser();
  await requirePropertyAccess(user, input.propertyId);

  // group at locationId level (vendor is derived from location.vendorId)
  const grouped = await prisma.transactionEntry.groupBy({
    by: ["locationId", "linenItemId", "condition"],
    where: {
      //   transaction: { voidedAt: null },
      location: {
        propertyId: input.propertyId,
        kind: LocationKind.VENDOR,
      },
      ...(input.condition ? { condition: input.condition } : {}),
      ...(input.linenItemId ? { linenItemId: input.linenItemId } : {}),
    },
    _sum: { qtyDelta: true },
  });

  const locationIds = Array.from(new Set(grouped.map((g) => g.locationId)));
  const itemIds = Array.from(new Set(grouped.map((g) => g.linenItemId)));

  const [locations, items] = await Promise.all([
    prisma.location.findMany({
      where: { id: { in: locationIds } },
      select: {
        id: true,
        vendorId: true,
        vendor: { select: { id: true, name: true } },
      },
    }),
    prisma.linenItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true },
    }),
  ]);

  const locMap = new Map(locations.map((l) => [l.id, l]));
  const itemMap = new Map(items.map((i) => [i.id, i]));

  // vendorId -> vendor aggregation
  const vendorAgg = new Map<string, VendorPendingVendorRow>();

  for (const g of grouped) {
    const loc = locMap.get(g.locationId);
    const item = itemMap.get(g.linenItemId);
    if (!loc?.vendorId || !loc.vendor || !item) continue;

    const qty = Number(g._sum.qtyDelta ?? 0);
    if (qty === 0) continue;

    const vendorId = loc.vendorId;
    const existing =
      vendorAgg.get(vendorId) ??
      ({
        vendorId,
        vendorName: loc.vendor.name,
        totalQty: 0,
        soiledQty: 0,
        rewashQty: 0,
        otherQty: 0,
        items: [],
      } satisfies VendorPendingVendorRow);

    existing.totalQty += qty;

    if (g.condition === LinenCondition.SOILED) existing.soiledQty += qty;
    else if (g.condition === LinenCondition.REWASH) existing.rewashQty += qty;
    else existing.otherQty += qty;

    existing.items.push({
      linenItemId: item.id,
      linenItemName: item.name,
      condition: g.condition,
      qty,
    });

    vendorAgg.set(vendorId, existing);
  }

  const vendors = Array.from(vendorAgg.values())
    .map((v) => ({
      ...v,
      items: v.items.sort((a, b) => Math.abs(b.qty) - Math.abs(a.qty)),
    }))
    .sort((a, b) => Math.abs(b.totalQty) - Math.abs(a.totalQty));

  return { ok: true as const, vendors };
}
