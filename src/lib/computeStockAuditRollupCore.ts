import "server-only";

import type { Prisma } from "@/generated/prisma";
import { LinenCondition, LocationKind } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import {
  STOCK_AUDIT_CONDITION_ORDER,
  STOCK_AUDIT_KIND_ORDER,
} from "@/lib/stockAuditConstants";
import type { StockAuditRow } from "@/actions/reports/types";

function buildLocationWhere(
  propertyId: string,
  includeVendor: boolean,
  includeDiscarded: boolean
): Prisma.LocationWhereInput {
  const excluded: LocationKind[] = [];
  if (!includeVendor) excluded.push(LocationKind.VENDOR);
  if (!includeDiscarded) excluded.push(LocationKind.DISCARDED_LOST);
  return {
    propertyId,
    ...(excluded.length > 0 ? { kind: { notIn: excluded } } : {}),
  };
}

function sortByOrder<T extends string>(
  entries: [T, number][],
  order: readonly T[]
): { key: T; qty: number }[] {
  const rank = new Map(order.map((k, i) => [k, i]));
  return entries
    .filter(([, qty]) => qty !== 0)
    .sort((a, b) => {
      const ra = rank.get(a[0]) ?? 999;
      const rb = rank.get(b[0]) ?? 999;
      if (ra !== rb) return ra - rb;
      return a[0].localeCompare(b[0]);
    })
    .map(([key, qty]) => ({ key, qty }));
}

/**
 * Ledger rollup without auth — use only from trusted server code (actions, cron).
 */
export async function computeStockAuditRollupCore(input: {
  propertyId: string;
  includeVendor?: boolean;
  includeDiscarded?: boolean;
}): Promise<{
  generatedAt: string;
  propertyId: string;
  includeVendor: boolean;
  includeDiscarded: boolean;
  rows: StockAuditRow[];
}> {
  const includeVendor = input.includeVendor !== false;
  const includeDiscarded = input.includeDiscarded !== false;

  const locationWhere = buildLocationWhere(
    input.propertyId,
    includeVendor,
    includeDiscarded
  );

  const entryWhere: Prisma.TransactionEntryWhereInput = {
    propertyId: input.propertyId,
    transaction: { voidedAt: null },
    location: locationWhere,
  };

  const [items, byCondition, byLocation] = await Promise.all([
    prisma.linenItem.findMany({
      where: { isActive: true },
      select: { id: true, name: true, sku: true },
      orderBy: { name: "asc" },
    }),
    prisma.transactionEntry.groupBy({
      by: ["linenItemId", "condition"],
      where: entryWhere,
      _sum: { qtyDelta: true },
    }),
    prisma.transactionEntry.groupBy({
      by: ["linenItemId", "locationId"],
      where: entryWhere,
      _sum: { qtyDelta: true },
    }),
  ]);

  const locationIds = [...new Set(byLocation.map((g) => g.locationId))];
  const locations =
    locationIds.length > 0
      ? await prisma.location.findMany({
          where: { id: { in: locationIds } },
          select: { id: true, kind: true },
        })
      : [];
  const locKindById = new Map(locations.map((l) => [l.id, l.kind]));

  const condMap = new Map<string, Map<LinenCondition, number>>();
  for (const g of byCondition) {
    const qty = Number(g._sum.qtyDelta ?? 0);
    if (!condMap.has(g.linenItemId)) {
      condMap.set(g.linenItemId, new Map());
    }
    condMap.get(g.linenItemId)!.set(g.condition, qty);
  }

  const kindMap = new Map<string, Map<LocationKind, number>>();
  for (const g of byLocation) {
    const kind = locKindById.get(g.locationId);
    if (!kind) continue;
    const qty = Number(g._sum.qtyDelta ?? 0);
    if (!kindMap.has(g.linenItemId)) {
      kindMap.set(g.linenItemId, new Map());
    }
    const m = kindMap.get(g.linenItemId)!;
    m.set(kind, (m.get(kind) ?? 0) + qty);
  }

  const rows: StockAuditRow[] = items.map((item) => {
    const cM = condMap.get(item.id) ?? new Map();
    const kM = kindMap.get(item.id) ?? new Map();

    const byCondition = sortByOrder(
      [...cM.entries()] as [LinenCondition, number][],
      STOCK_AUDIT_CONDITION_ORDER
    ).map((x) => ({ condition: x.key, qty: x.qty }));

    const byLocationKind = sortByOrder(
      [...kM.entries()] as [LocationKind, number][],
      STOCK_AUDIT_KIND_ORDER
    ).map((x) => ({ locationKind: x.key, qty: x.qty }));

    const totalQty = [...cM.values()].reduce((s, q) => s + q, 0);

    return {
      linenItemId: item.id,
      linenItemName: item.name,
      sku: item.sku,
      totalQty,
      byCondition,
      byLocationKind,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    propertyId: input.propertyId,
    includeVendor,
    includeDiscarded,
    rows,
  };
}
