"use server";

import { prisma } from "@/lib/db";
import { requireUser, requirePropertyAccess } from "@/lib/auth";
import { TxnType } from "@prisma/client";

const IST_OFFSET_MIN = 330;

function istDayBounds(date = new Date()) {
  // Build start/end of "today" in Asia/Kolkata, expressed in UTC Date objects
  const utc = new Date(date);
  const ist = new Date(utc.getTime() + IST_OFFSET_MIN * 60 * 1000);

  const y = ist.getFullYear();
  const m = ist.getMonth();
  const d = ist.getDate();

  const istStart = new Date(y, m, d, 0, 0, 0, 0);
  const istEnd = new Date(y, m, d, 23, 59, 59, 999);

  return {
    startUtc: new Date(istStart.getTime() - IST_OFFSET_MIN * 60 * 1000),
    endUtc: new Date(istEnd.getTime() - IST_OFFSET_MIN * 60 * 1000),
  };
}

export async function getDashboardSummary(input: { propertyId: string }) {
  const user = await requireUser();
  await requirePropertyAccess(user, input.propertyId);

  const { startUtc, endUtc } = istDayBounds();

  const counts = await prisma.transaction.groupBy({
    by: ["type"],
    where: {
      propertyId: input.propertyId,
      occurredAt: { gte: startUtc, lte: endUtc },
      voidedAt: null,
    },
    _count: { _all: true },
  });

  const map = new Map(counts.map((c) => [c.type, c._count._all]));

  // Top 3 vendors by pending qty (reuse same rule: vendor locations)
  const pendingGrouped = await prisma.transactionEntry.groupBy({
    by: ["locationId"],
    where: {
      //   transaction: { voidedAt: null },
      location: { propertyId: input.propertyId, kind: "VENDOR" as any },
    },
    _sum: { qtyDelta: true },
  });

  const locIds = pendingGrouped.map((p) => p.locationId);
  const locs = await prisma.location.findMany({
    where: { id: { in: locIds } },
    select: {
      id: true,
      vendorId: true,
      vendor: { select: { id: true, name: true } },
    },
  });

  const locMap = new Map(locs.map((l) => [l.id, l]));

  const vendorTotals = new Map<
    string,
    { vendorId: string; vendorName: string; qty: number }
  >();
  for (const g of pendingGrouped) {
    const loc = locMap.get(g.locationId);
    if (!loc?.vendorId || !loc.vendor) continue;
    const qty = Number(g._sum.qtyDelta ?? 0);

    const existing = vendorTotals.get(loc.vendorId) ?? {
      vendorId: loc.vendorId,
      vendorName: loc.vendor.name,
      qty: 0,
    };
    existing.qty += qty;
    vendorTotals.set(loc.vendorId, existing);
  }

  const topVendors = Array.from(vendorTotals.values())
    .sort((a, b) => Math.abs(b.qty) - Math.abs(a.qty))
    .slice(0, 3);

  return {
    ok: true as const,
    counts: {
      dispatched: map.get(TxnType.DISPATCH_TO_LAUNDRY) ?? 0,
      received: map.get(TxnType.RECEIVE_FROM_LAUNDRY) ?? 0,
      procured: map.get(TxnType.PROCUREMENT) ?? 0,
      discarded: map.get(TxnType.DISCARD_LOST) ?? 0,
      resent: map.get(TxnType.RESEND_REWASH) ?? 0,
    },
    topVendors,
  };
}
