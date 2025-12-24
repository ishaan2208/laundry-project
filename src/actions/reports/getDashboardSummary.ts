"use server";

import { prisma } from "@/lib/db";
import { requirePropertyAccess, requireUser } from "@/lib/auth";
import { TxnType } from "@prisma/client";

export type DashboardSummary = {
  propertyId: string;
  dateIST: string; // YYYY-MM-DD (Asia/Kolkata)
  dispatched: number;
  received: number;
  procured: number;
  discarded: number;
};

const IST_OFFSET_MIN = 330;

function todayISTString() {
  const now = new Date();
  const ist = new Date(now.getTime() + IST_OFFSET_MIN * 60_000);
  return ist.toISOString().slice(0, 10);
}

function istDayRangeUTC(dateIST: string) {
  // dateIST: YYYY-MM-DD in Asia/Kolkata
  const [y, m, d] = dateIST.split("-").map((x) => Number(x));
  // Midnight IST converted to UTC = UTC midnight - 5:30
  const startUtcMs = Date.UTC(y, m - 1, d, 0, 0, 0) - IST_OFFSET_MIN * 60_000;
  const endUtcMs = startUtcMs + 24 * 60 * 60_000;
  return { start: new Date(startUtcMs), end: new Date(endUtcMs) };
}

export async function getDashboardSummary(
  propertyId: string,
  dateIST: string = todayISTString()
): Promise<DashboardSummary> {
  const user = await requireUser();
  await requirePropertyAccess(user, propertyId);

  // Ensure property is active (ADMIN can select any active property)
  const prop = await prisma.property.findFirst({
    where: { id: propertyId, isActive: true },
    select: { id: true },
  });
  if (!prop) {
    return {
      propertyId,
      dateIST,
      dispatched: 0,
      received: 0,
      procured: 0,
      discarded: 0,
    };
  }

  const { start, end } = istDayRangeUTC(dateIST);

  const rows = await prisma.transaction.groupBy({
    by: ["type"],
    where: {
      propertyId,
      occurredAt: { gte: start, lt: end },
      // voidedAt: null, // ✅ exclude voided originals from *counts*
      type: {
        in: [
          TxnType.DISPATCH_TO_LAUNDRY,
          TxnType.RECEIVE_FROM_LAUNDRY,
          TxnType.PROCUREMENT,
          TxnType.DISCARD_LOST,
        ],
      },
    },
    _count: { _all: true },
  });

  const getCount = (t: TxnType) =>
    rows.find((r) => r.type === t)?._count._all ?? 0;

  return {
    propertyId,
    dateIST,
    dispatched: getCount(TxnType.DISPATCH_TO_LAUNDRY),
    received: getCount(TxnType.RECEIVE_FROM_LAUNDRY),
    procured: getCount(TxnType.PROCUREMENT),
    discarded: getCount(TxnType.DISCARD_LOST),
  };
}
