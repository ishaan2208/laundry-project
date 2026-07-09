import "server-only";

import { prisma } from "@/lib/db";
import { TxnType, LocationKind } from "@/generated/prisma";
import { istDayEndUtc, istDayStartUtc } from "@/lib/dateKeys";

export type ComplianceSideStatus = "filled" | "missing";

export type LaundryRecordSource = "pms_backfill" | "laundry_app";

export type DailyComplianceLine = {
  linenItemId: string;
  linenItemName: string;
  qty: number;
};

export type DailyComplianceSide = {
  status: ComplianceSideStatus;
  transactionId?: string;
  totalQty?: number;
  source?: LaundryRecordSource;
  recordedAt?: string;
  lines?: DailyComplianceLine[];
};

function inferRecordSource(note: string | null | undefined): LaundryRecordSource {
  if (!note) return "laundry_app";
  const lower = note.toLowerCase();
  if (lower.includes("backfilled") || lower.includes("pms compliance")) {
    return "pms_backfill";
  }
  return "laundry_app";
}

export type DailyComplianceResult = {
  available: true;
  date: string;
  laundryPropertyId: string;
  propertyName: string;
  defaultVendorId?: string;
  dispatch: DailyComplianceSide;
  receive: DailyComplianceSide;
  linenItems: Array<{ id: string; name: string }>;
  vendors: Array<{ id: string; name: string }>;
};

export type DailyComplianceUnavailable = {
  available: false;
  reason: "no_mapping" | "property_inactive";
};

export async function resolvePropertyByPmsId(pmsPropertyId: number) {
  return prisma.property.findFirst({
    where: { pmsPropertyId, isActive: true },
    select: { id: true, name: true },
  });
}

/**
 * Prefer the vendor from this hotel's most recent send/receive (same rule as
 * the laundry app's getLastVendorForProperty). Fall back to the oldest active
 * vendor location only when there is no prior transaction.
 */
async function getDefaultVendorIdForProperty(propertyId: string) {
  const lastTxn = await prisma.transaction.findFirst({
    where: {
      propertyId,
      vendorId: { not: null },
      voidedAt: null,
      type: {
        in: [
          TxnType.DISPATCH_TO_LAUNDRY,
          TxnType.RECEIVE_FROM_LAUNDRY,
          TxnType.RESEND_REWASH,
        ],
      },
      vendor: { isActive: true },
    },
    orderBy: { occurredAt: "desc" },
    select: { vendorId: true },
  });
  if (lastTxn?.vendorId) return lastTxn.vendorId;

  const vendorLoc = await prisma.location.findFirst({
    where: {
      propertyId,
      kind: LocationKind.VENDOR,
      isActive: true,
      vendorId: { not: null },
    },
    select: { vendorId: true },
    orderBy: { createdAt: "asc" },
  });
  return vendorLoc?.vendorId ?? undefined;
}

async function getSideStatus(
  propertyId: string,
  type: typeof TxnType.DISPATCH_TO_LAUNDRY | typeof TxnType.RECEIVE_FROM_LAUNDRY,
  start: Date,
  end: Date
): Promise<DailyComplianceSide> {
  const transactions = await prisma.transaction.findMany({
    where: {
      propertyId,
      type,
      occurredAt: { gte: start, lt: end },
      voidedAt: null,
    },
    select: {
      id: true,
      note: true,
      occurredAt: true,
      entries: {
        where: { qtyDelta: { gt: 0 } },
        select: {
          qtyDelta: true,
          linenItemId: true,
          linenItem: { select: { name: true } },
        },
      },
    },
    orderBy: { occurredAt: "asc" },
  });

  let totalQty = 0;
  let transactionId: string | undefined;
  let source: LaundryRecordSource | undefined;
  let recordedAt: string | undefined;
  const lineMap = new Map<string, DailyComplianceLine>();

  for (const txn of transactions) {
    const txnQty = txn.entries.reduce((sum, e) => sum + e.qtyDelta, 0);
    if (txnQty > 0) {
      totalQty += txnQty;
      if (!transactionId) {
        transactionId = txn.id;
        source = inferRecordSource(txn.note);
        recordedAt = txn.occurredAt.toISOString();
      }
      for (const entry of txn.entries) {
        const existing = lineMap.get(entry.linenItemId);
        if (existing) {
          existing.qty += entry.qtyDelta;
        } else {
          lineMap.set(entry.linenItemId, {
            linenItemId: entry.linenItemId,
            linenItemName: entry.linenItem.name,
            qty: entry.qtyDelta,
          });
        }
      }
    }
  }

  if (totalQty > 0) {
    const lines = [...lineMap.values()].sort((a, b) =>
      a.linenItemName.localeCompare(b.linenItemName)
    );
    return { status: "filled", transactionId, totalQty, source, recordedAt, lines };
  }

  return { status: "missing" };
}

export async function getDailyComplianceStatus(input: {
  pmsPropertyId: number;
  dateKey: string;
}): Promise<DailyComplianceResult | DailyComplianceUnavailable> {
  const property = await resolvePropertyByPmsId(input.pmsPropertyId);
  if (!property) {
    return { available: false, reason: "no_mapping" };
  }

  const start = istDayStartUtc(input.dateKey);
  const end = istDayEndUtc(input.dateKey);
  const defaultVendorId = await getDefaultVendorIdForProperty(property.id);

  const [dispatch, receive, linenItems, vendors] = await Promise.all([
    getSideStatus(property.id, TxnType.DISPATCH_TO_LAUNDRY, start, end),
    getSideStatus(property.id, TxnType.RECEIVE_FROM_LAUNDRY, start, end),
    prisma.linenItem.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.vendor.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    available: true,
    date: input.dateKey,
    laundryPropertyId: property.id,
    propertyName: property.name,
    defaultVendorId,
    dispatch,
    receive,
    linenItems,
    vendors,
  };
}
