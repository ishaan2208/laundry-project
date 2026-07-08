"use server";

import { prisma } from "@/lib/db";
import { requireUser, requireRole, requirePropertyAccess } from "@/lib/auth";
import { LinenCondition, LocationKind, UserRole } from "@/generated/prisma";
import { computeStockAuditRollupCore } from "@/lib/computeStockAuditRollupCore";

export type ClosingPropertyRow = {
  linenItemId: string;
  name: string;
  bookQty: number;
};

export type ClosingVendorRow = {
  vendorId: string;
  vendorName: string;
  linenItemId: string;
  itemName: string;
  bookQty: number;
};

export type ClosingHistoryRow = {
  transactionId: string;
  occurredAt: string;
  byName: string | null;
  entryCount: number;
};

export type ClosingContext = {
  propertyRows: ClosingPropertyRow[];
  vendorRows: ClosingVendorRow[];
  history: ClosingHistoryRow[];
};

/**
 * Book values an admin reconciles during a fresh start:
 * everything physically at the hotel, plus everything each laundry
 * vendor still holds (the receivable).
 */
export async function getClosingContext(input: {
  propertyId: string;
}): Promise<{ ok: true; data: ClosingContext } | { ok: false; message: string }> {
  try {
    const user = await requireUser();
    requireRole(user, [UserRole.ADMIN]);
    await requirePropertyAccess(user, input.propertyId);

    // 1) Linen at the hotel (vendor + discarded excluded — counted separately).
    const rollup = await computeStockAuditRollupCore({
      propertyId: input.propertyId,
      includeVendor: false,
      includeDiscarded: false,
    });
    const propertyRows: ClosingPropertyRow[] = rollup.rows.map((r) => ({
      linenItemId: r.linenItemId,
      name: r.linenItemName,
      bookQty: r.totalQty,
    }));

    // 2) Receivable: what each laundry still holds, per item.
    const vendorLocations = await prisma.location.findMany({
      where: {
        propertyId: input.propertyId,
        kind: LocationKind.VENDOR,
        isActive: true,
        vendor: { isActive: true },
      },
      select: { id: true, vendorId: true, vendor: { select: { name: true } } },
    });
    const locToVendor = new Map(
      vendorLocations.map((l) => [
        l.id,
        { vendorId: l.vendorId!, vendorName: l.vendor?.name ?? "Laundry" },
      ])
    );

    const grouped = vendorLocations.length
      ? await prisma.transactionEntry.groupBy({
          by: ["locationId", "linenItemId"],
          where: {
            propertyId: input.propertyId,
            locationId: { in: vendorLocations.map((l) => l.id) },
            condition: { in: [LinenCondition.SOILED, LinenCondition.REWASH] },
          },
          _sum: { qtyDelta: true },
        })
      : [];

    const itemNames = new Map(
      rollup.rows.map((r) => [r.linenItemId, r.linenItemName])
    );
    // Vendor rows can reference items missing from the property rollup.
    const missingItemIds = grouped
      .map((g) => g.linenItemId)
      .filter((id) => !itemNames.has(id));
    if (missingItemIds.length) {
      const extra = await prisma.linenItem.findMany({
        where: { id: { in: missingItemIds } },
        select: { id: true, name: true },
      });
      for (const it of extra) itemNames.set(it.id, it.name);
    }

    const vendorRows: ClosingVendorRow[] = grouped
      .map((g) => {
        const v = locToVendor.get(g.locationId);
        if (!v) return null;
        return {
          vendorId: v.vendorId,
          vendorName: v.vendorName,
          linenItemId: g.linenItemId,
          itemName: itemNames.get(g.linenItemId) ?? "Item",
          bookQty: Number(g._sum.qtyDelta ?? 0),
        };
      })
      .filter((r): r is ClosingVendorRow => r !== null && r.bookQty !== 0)
      .sort(
        (a, b) =>
          a.vendorName.localeCompare(b.vendorName) || b.bookQty - a.bookQty
      );

    // 3) Past fresh starts (they live in the ledger as tagged adjustments;
    //    RESET: is current, CLOSING: covers early records).
    const resets = await prisma.transaction.findMany({
      where: {
        propertyId: input.propertyId,
        OR: [
          { reference: { startsWith: "RESET:" } },
          { reference: { startsWith: "CLOSING:" } },
        ],
        voidedAt: null,
      },
      orderBy: { occurredAt: "desc" },
      take: 12,
      select: {
        id: true,
        occurredAt: true,
        createdBy: { select: { name: true, email: true } },
        _count: { select: { entries: true } },
      },
    });

    const history: ClosingHistoryRow[] = resets.map((c) => ({
      transactionId: c.id,
      occurredAt: c.occurredAt.toISOString(),
      byName: c.createdBy?.name ?? c.createdBy?.email ?? null,
      entryCount: c._count.entries,
    }));

    return { ok: true, data: { propertyRows, vendorRows, history } };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? "Could not load closing data." };
  }
}
