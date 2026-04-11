"use server";

import { getStockAuditSnapshotWithDelta } from "@/actions/reports/getStockAuditSnapshotWithDelta";
import { buildStockAuditDeltaCsv } from "@/lib/stockAuditDeltaCsv";

function safeFilenamePart(s: string): string {
  return s.replace(/[^\w\-]+/g, "_").slice(0, 48);
}

export async function exportStockAuditDeltaCsv(snapshotId: string): Promise<
  | { ok: true; csv: string; filename: string }
  | { ok: false; message: string }
> {
  const detail = await getStockAuditSnapshotWithDelta(snapshotId);
  if (!detail) return { ok: false, message: "Snapshot not found." };

  const csv = buildStockAuditDeltaCsv(detail);
  const week = detail.weekStart.toISOString().slice(0, 10);
  const filename = `audit-to-audit_${safeFilenamePart(detail.propertyName)}_${week}.csv`;

  return { ok: true, csv, filename };
}
