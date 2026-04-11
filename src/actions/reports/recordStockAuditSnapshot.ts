"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireRole, requirePropertyAccess } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";
import {
  isIstMonday,
  parseDateOnlyToParts,
  startOfIstWeekMondayParts,
  ymdToDateOnlyUtc,
} from "@/lib/stockAuditIstWeek";
import { persistStockAuditSnapshot } from "@/lib/persistStockAuditSnapshot";

export async function recordStockAuditSnapshot(input: {
  propertyId: string;
  /** YYYY-MM-DD; must be a Monday in Asia/Kolkata. Omit = current IST week’s Monday. */
  weekStartYmd?: string;
  includeVendor?: boolean;
  includeDiscarded?: boolean;
}): Promise<{ ok: true; snapshotId: string } | { ok: false; message: string }> {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);
  await requirePropertyAccess(user, input.propertyId);

  const includeVendor = input.includeVendor !== false;
  const includeDiscarded = input.includeDiscarded !== false;

  let y: number;
  let m: number;
  let d: number;

  if (input.weekStartYmd?.trim()) {
    const parsed = parseDateOnlyToParts(input.weekStartYmd);
    if (!parsed) {
      return { ok: false, message: "weekStartYmd must be YYYY-MM-DD." };
    }
    if (!isIstMonday(parsed.y, parsed.m, parsed.d)) {
      return {
        ok: false,
        message: "weekStartYmd must be a Monday in Asia/Kolkata.",
      };
    }
    y = parsed.y;
    m = parsed.m;
    d = parsed.d;
  } else {
    const parts = startOfIstWeekMondayParts(new Date());
    y = parts.y;
    m = parts.m;
    d = parts.d;
  }

  const weekStart = ymdToDateOnlyUtc(y, m, d);

  const { snapshotId } = await persistStockAuditSnapshot({
    propertyId: input.propertyId,
    weekStart,
    includeVendor,
    includeDiscarded,
    createdById: user.id,
    mode: "replace",
  });

  revalidatePath("/app/stock/audit");
  revalidatePath("/admin/reports/stock-audit-history");

  return { ok: true, snapshotId };
}
