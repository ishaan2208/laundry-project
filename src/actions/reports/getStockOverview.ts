"use server";

import { requireUser, requirePropertyAccess } from "@/lib/auth";
import { LocationKind } from "@/generated/prisma";
import { computeStockAuditRollupCore } from "@/lib/computeStockAuditRollupCore";

/**
 * The ONLY stock numbers staff ever see. The ledger tracks linen across
 * internal buckets (clean store, soiled store, rewash, damaged, vendor),
 * but the hotel only records dispatch, receive, and total stock — so we
 * collapse everything into the two states they actually think in:
 *
 *   • atLaundry = what's sent out and not yet back  (VENDOR balance)
 *   • total     = everything owned, not thrown away (all non-discarded)
 *   • inStock   = total − atLaundry  (what's physically at the hotel)
 *
 * Internal condition buckets never leave this file.
 */

export type StockOverviewItem = {
  linenItemId: string;
  name: string;
  inStock: number;
  atLaundry: number;
  total: number;
};

export type StockOverview = {
  totals: { inStock: number; atLaundry: number; total: number };
  items: StockOverviewItem[];
  /** True when any item's derived numbers go impossible (drift → needs a Fresh start). */
  hasIssue: boolean;
};

export async function getStockOverview(input: {
  propertyId: string;
}): Promise<
  { ok: true; data: StockOverview } | { ok: false; message: string }
> {
  try {
    const user = await requireUser();
    await requirePropertyAccess(user, input.propertyId);

    // includeVendor: total = at hotel + at laundry.
    // includeDiscarded: false → thrown-away/lost linen is not "stock we have".
    const rollup = await computeStockAuditRollupCore({
      propertyId: input.propertyId,
      includeVendor: true,
      includeDiscarded: false,
    });

    const items: StockOverviewItem[] = rollup.rows
      .map((r) => {
        const atLaundry =
          r.byLocationKind.find((s) => s.locationKind === LocationKind.VENDOR)
            ?.qty ?? 0;
        const total = r.totalQty;
        return {
          linenItemId: r.linenItemId,
          name: r.linenItemName,
          atLaundry,
          total,
          inStock: total - atLaundry,
        };
      })
      // Hide items that have never moved — no rows of zeros to scroll past.
      .filter((i) => i.total !== 0 || i.atLaundry !== 0 || i.inStock !== 0)
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

    const totals = items.reduce(
      (acc, i) => {
        acc.inStock += i.inStock;
        acc.atLaundry += i.atLaundry;
        acc.total += i.total;
        return acc;
      },
      { inStock: 0, atLaundry: 0, total: 0 }
    );

    const hasIssue = items.some((i) => i.inStock < 0 || i.atLaundry < 0);

    return { ok: true, data: { totals, items, hasIssue } };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? "Could not load stock." };
  }
}
