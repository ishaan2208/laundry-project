"use server";

import { prisma } from "@/lib/db";
import { requireUser, requirePropertyAccess } from "@/lib/auth";
import { LinenCondition, LocationKind } from "@prisma/client";
import { BalanceRow } from "../reports/types";

export async function getBalances(input: {
  propertyId: string;
  locationKind?: LocationKind;
  condition?: LinenCondition;
  linenItemId?: string;
}) {
  const user = await requireUser();
  await requirePropertyAccess(user, input.propertyId);

  const grouped = await prisma.transactionEntry.groupBy({
    by: ["locationId", "linenItemId", "condition"],
    where: {
      //   transaction: { voidedAt: null },
      location: {
        propertyId: input.propertyId,
        ...(input.locationKind ? { kind: input.locationKind } : {}),
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
        name: true,
        kind: true,
        propertyId: true,
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

  const rows: BalanceRow[] = grouped
    .map((g) => {
      const loc = locMap.get(g.locationId);
      const item = itemMap.get(g.linenItemId);
      if (!loc || !item) return null;

      const qty = Number(g._sum.qtyDelta ?? 0);

      return {
        propertyId: input.propertyId,
        locationId: loc.id,
        locationName: loc.name,
        locationKind: loc.kind,
        vendorId: loc.vendorId ?? null,
        vendorName: loc.vendor?.name ?? null,
        linenItemId: item.id,
        linenItemName: item.name,
        condition: g.condition,
        qty,
        isNegative: qty < 0,
      };
    })
    .filter((x): x is BalanceRow => Boolean(x))
    .sort((a, b) => {
      // show negatives first, then bigger qty
      if (a.isNegative !== b.isNegative) return a.isNegative ? -1 : 1;
      return Math.abs(b.qty) - Math.abs(a.qty);
    });

  return { ok: true as const, rows };
}
