"use server";

import { prisma } from "@/lib/db";
import { requireUser, requirePropertyAccess } from "@/lib/auth";
import { TxnType } from "@prisma/client";
import { VendorTurnaroundRow } from "../reports/types";

export async function getVendorTurnaroundEstimate(input: {
  propertyId: string;
  from?: string; // ISO
  to?: string; // ISO
  maxPairs?: number; // safety
}) {
  const user = await requireUser();
  await requirePropertyAccess(user, input.propertyId);

  const now = new Date();
  const from = input.from
    ? new Date(input.from)
    : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const to = input.to ? new Date(input.to) : now;

  const [dispatches, receives] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        propertyId: input.propertyId,
        type: TxnType.DISPATCH_TO_LAUNDRY,
        voidedAt: null,
        occurredAt: { gte: from, lte: to },
        vendorId: { not: null },
      },
      select: {
        id: true,
        vendorId: true,
        occurredAt: true,
        vendor: { select: { id: true, name: true } },
      },
      orderBy: { occurredAt: "asc" },
      take: 2000,
    }),
    prisma.transaction.findMany({
      where: {
        propertyId: input.propertyId,
        type: TxnType.RECEIVE_FROM_LAUNDRY,
        voidedAt: null,
        occurredAt: { gte: from, lte: to },
        vendorId: { not: null },
      },
      select: {
        id: true,
        vendorId: true,
        occurredAt: true,
        vendor: { select: { id: true, name: true } },
      },
      orderBy: { occurredAt: "asc" },
      take: 2000,
    }),
  ]);

  // FIFO pairing per vendor (heuristic estimate)
  const byVendor = new Map<
    string,
    { vendorName: string; d: Date[]; r: Date[] }
  >();

  for (const x of dispatches) {
    if (!x.vendorId || !x.vendor) continue;
    const v = byVendor.get(x.vendorId) ?? {
      vendorName: x.vendor.name,
      d: [],
      r: [],
    };
    v.d.push(x.occurredAt);
    byVendor.set(x.vendorId, v);
  }
  for (const x of receives) {
    if (!x.vendorId || !x.vendor) continue;
    const v = byVendor.get(x.vendorId) ?? {
      vendorName: x.vendor.name,
      d: [],
      r: [],
    };
    v.r.push(x.occurredAt);
    byVendor.set(x.vendorId, v);
  }

  const maxPairs = Math.min(Math.max(input.maxPairs ?? 200, 50), 1000);

  const rows: VendorTurnaroundRow[] = [];
  for (const [vendorId, v] of byVendor.entries()) {
    const pairs = Math.min(v.d.length, v.r.length, maxPairs);
    if (pairs < 2) {
      rows.push({
        vendorId,
        vendorName: v.vendorName,
        sampleSize: pairs,
        avgHours: null,
      });
      continue;
    }

    let totalMs = 0;
    for (let i = 0; i < pairs; i++) {
      const ms = v.r[i].getTime() - v.d[i].getTime();
      if (ms > 0) totalMs += ms;
    }

    const avgHours = totalMs > 0 ? totalMs / pairs / (1000 * 60 * 60) : null;
    rows.push({
      vendorId,
      vendorName: v.vendorName,
      sampleSize: pairs,
      avgHours,
    });
  }

  rows.sort((a, b) => (b.avgHours ?? 0) - (a.avgHours ?? 0));
  return {
    ok: true as const,
    rows,
    note: "Estimate (FIFO pairing; no batch linking yet).",
  };
}
