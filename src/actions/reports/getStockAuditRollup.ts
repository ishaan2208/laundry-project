"use server";

import { requireUser, requirePropertyAccess } from "@/lib/auth";
import { computeStockAuditRollupCore } from "@/lib/computeStockAuditRollupCore";
import type { StockAuditRollupResult } from "./types";

/**
 * Full-property stock rollup for weekly audit: every active linen item,
 * ledger sums excluding voided transactions, with condition and location-kind breakdowns.
 */
export async function getStockAuditRollup(input: {
  propertyId: string;
  includeVendor?: boolean;
  includeDiscarded?: boolean;
}): Promise<StockAuditRollupResult> {
  const user = await requireUser();
  await requirePropertyAccess(user, input.propertyId);

  const data = await computeStockAuditRollupCore(input);
  return { ok: true, ...data };
}
