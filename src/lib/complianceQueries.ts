import "server-only";

import { prisma } from "@/lib/db";
import { TxnType, LocationKind } from "@/generated/prisma";
import { istDayEndUtc, istDayStartUtc } from "@/lib/dateKeys";

export type ComplianceSideStatus = "filled" | "missing";

export type DailyComplianceSide = {
  status: ComplianceSideStatus;
  transactionId?: string;
  totalQty?: number;
};

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

async function getDefaultVendorIdForProperty(propertyId: string) {
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
      entries: {
        where: { qtyDelta: { gt: 0 } },
        select: { qtyDelta: true },
      },
    },
    orderBy: { occurredAt: "asc" },
  });

  let totalQty = 0;
  let transactionId: string | undefined;

  for (const txn of transactions) {
    const txnQty = txn.entries.reduce((sum, e) => sum + e.qtyDelta, 0);
    if (txnQty > 0) {
      totalQty += txnQty;
      transactionId ??= txn.id;
    }
  }

  if (totalQty > 0) {
    return { status: "filled", transactionId, totalQty };
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
