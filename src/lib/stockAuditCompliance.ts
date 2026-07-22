import "server-only";

import { prisma } from "@/lib/db";
import { resolvePropertyByPmsId } from "@/lib/complianceQueries";
import {
  isIstMonday,
  parseDateOnlyToParts,
  startOfIstWeekMondayParts,
  ymdToDateOnlyUtc,
} from "@/lib/stockAuditIstWeek";
import { persistStockAuditSnapshot } from "@/lib/persistStockAuditSnapshot";
import { UserRole } from "@/generated/prisma";

function ymd(parts: { y: number; m: number; d: number }): string {
  return `${parts.y}-${String(parts.m).padStart(2, "0")}-${String(parts.d).padStart(2, "0")}`;
}

async function getServiceCreatedById(): Promise<string | null> {
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN, isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return admin?.id ?? null;
}

function resolveWeekStartParts(weekStartYmd?: string | null): {
  y: number;
  m: number;
  d: number;
} {
  if (weekStartYmd?.trim()) {
    const parsed = parseDateOnlyToParts(weekStartYmd);
    if (!parsed) {
      throw new Error("weekStartYmd must be YYYY-MM-DD.");
    }
    if (!isIstMonday(parsed.y, parsed.m, parsed.d)) {
      throw new Error("weekStartYmd must be a Monday in Asia/Kolkata.");
    }
    return parsed;
  }
  return startOfIstWeekMondayParts(new Date());
}

export type StockAuditWeeklyStatus =
  | {
      available: true;
      laundryPropertyId: string;
      propertyName: string;
      weekStartYmd: string;
      hasSnapshot: boolean;
      snapshotId?: string;
      capturedAt?: string;
    }
  | {
      available: false;
      reason: "no_mapping" | "property_inactive";
      weekStartYmd: string;
    };

export async function getStockAuditWeeklyStatus(input: {
  pmsPropertyId: number;
  weekStartYmd?: string;
}): Promise<StockAuditWeeklyStatus> {
  const parts = resolveWeekStartParts(input.weekStartYmd);
  const weekStartYmd = ymd(parts);
  const weekStart = ymdToDateOnlyUtc(parts.y, parts.m, parts.d);

  const property = await resolvePropertyByPmsId(input.pmsPropertyId);
  if (!property) {
    return { available: false, reason: "no_mapping", weekStartYmd };
  }

  const snap = await prisma.stockAuditSnapshot.findUnique({
    where: {
      propertyId_weekStart_includeVendor_includeDiscarded: {
        propertyId: property.id,
        weekStart,
        includeVendor: true,
        includeDiscarded: true,
      },
    },
    select: { id: true, capturedAt: true },
  });

  return {
    available: true,
    laundryPropertyId: property.id,
    propertyName: property.name,
    weekStartYmd,
    hasSnapshot: Boolean(snap),
    snapshotId: snap?.id,
    capturedAt: snap?.capturedAt?.toISOString(),
  };
}

export async function recordStockAuditWeeklyForPmsProperty(input: {
  pmsPropertyId: number;
  weekStartYmd?: string;
  mode?: "replace" | "skip_if_exists";
}): Promise<{
  laundryPropertyId: string;
  weekStartYmd: string;
  snapshotId: string;
  skipped: boolean;
}> {
  const parts = resolveWeekStartParts(input.weekStartYmd);
  const weekStartYmd = ymd(parts);
  const weekStart = ymdToDateOnlyUtc(parts.y, parts.m, parts.d);

  const property = await resolvePropertyByPmsId(input.pmsPropertyId);
  if (!property) {
    throw new Error("Laundry property mapping not found for this PMS property.");
  }

  const createdById = await getServiceCreatedById();
  const { snapshotId, skipped } = await persistStockAuditSnapshot({
    propertyId: property.id,
    weekStart,
    includeVendor: true,
    includeDiscarded: true,
    createdById,
    mode: input.mode ?? "replace",
  });

  return {
    laundryPropertyId: property.id,
    weekStartYmd,
    snapshotId,
    skipped,
  };
}
