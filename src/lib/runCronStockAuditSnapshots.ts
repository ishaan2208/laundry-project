import "server-only";

import { prisma } from "@/lib/db";
import {
  startOfIstWeekMondayParts,
  ymdToDateOnlyUtc,
} from "@/lib/stockAuditIstWeek";
import { persistStockAuditSnapshot } from "@/lib/persistStockAuditSnapshot";

/**
 * One run per schedule: for each active property, ensure default-scope snapshot
 * exists for the current IST week (Monday). Does not overwrite existing rows.
 */
export async function runCronStockAuditSnapshots(): Promise<{
  weekStartYmd: string;
  properties: number;
  created: number;
  skipped: number;
}> {
  const { y, m, d } = startOfIstWeekMondayParts(new Date());
  const weekStart = ymdToDateOnlyUtc(y, m, d);
  const weekStartYmd = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const properties = await prisma.property.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  let created = 0;
  let skipped = 0;

  for (const p of properties) {
    const r = await persistStockAuditSnapshot({
      propertyId: p.id,
      weekStart,
      includeVendor: true,
      includeDiscarded: true,
      createdById: null,
      mode: "skip_if_exists",
    });
    if (r.skipped) skipped += 1;
    else created += 1;
  }

  return {
    weekStartYmd,
    properties: properties.length,
    created,
    skipped,
  };
}
