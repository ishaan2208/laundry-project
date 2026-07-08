"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  LinenCondition,
  LocationKind,
  TxnType,
  UserRole,
} from "@/generated/prisma";
import { requireUser, requireRole, requirePropertyAccess } from "@/lib/auth";
import { postTransaction } from "@/lib/ledger";
import type { LedgerResult } from "@/lib/ledger";
import {
  ensureDefaultLocationsForProperty,
  ensureVendorLocationForPropertyVendor,
  getLocationByKind,
} from "@/lib/workflowLocations";
import { computeStockAuditRollupCore } from "@/lib/computeStockAuditRollupCore";

const RunFreshStartSchema = z.object({
  propertyId: z.string().min(1),
  note: z.string().trim().max(500).optional(),
  /** Client-generated per-submission key: blocks double-taps, allows any number of resets. */
  idempotencyKey: z.string().trim().min(8),
  propertyLines: z.array(
    z.object({
      linenItemId: z.string().min(1),
      countedQty: z.number().int().min(0).max(1_000_000),
    })
  ),
  vendorLines: z.array(
    z.object({
      vendorId: z.string().min(1),
      linenItemId: z.string().min(1),
      countedQty: z.number().int().min(0).max(1_000_000),
    })
  ),
});

export type RunFreshStartResult =
  | {
      ok: true;
      transactionId: string | null;
      adjustedLines: number;
      matched: boolean;
    }
  | { ok: false; message: string };

function istDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

/**
 * The fresh start: whenever the book has drifted from reality (wrong
 * entries, bloated or negative pending), the admin counts what is really
 * there — at the hotel and with each laundry — and the difference posts as
 * ONE ADJUSTMENT tagged RESET:<date>. After it, derived balances equal the
 * counted reality: a clean slate. Can run any time, as often as needed.
 * No balances are ever stored; the correction lives inside the ledger.
 */
export async function runFreshStart(
  input: unknown
): Promise<RunFreshStartResult> {
  const parsed = RunFreshStartSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid input." };
  }
  const { propertyId, note, idempotencyKey, propertyLines, vendorLines } =
    parsed.data;

  try {
    const user = await requireUser();
    requireRole(user, [UserRole.ADMIN]);
    await requirePropertyAccess(user, propertyId);

    await ensureDefaultLocationsForProperty(propertyId);
    const cleanLoc = await getLocationByKind(
      propertyId,
      LocationKind.CLEAN_STORE
    );

    // Recompute the book NOW, server-side — client numbers are never trusted.
    const rollup = await computeStockAuditRollupCore({
      propertyId,
      includeVendor: false,
      includeDiscarded: false,
    });
    const propertyBook = new Map(
      rollup.rows.map((r) => [r.linenItemId, r.totalQty])
    );

    const entries: Array<{
      locationId: string;
      linenItemId: string;
      condition: LinenCondition;
      qtyDelta: number;
      unitCost: undefined;
      meta: Record<string, unknown>;
    }> = [];

    // (a) Linen at the hotel → variance lands in Clean store / CLEAN,
    //     same convention as physical-count approval.
    for (const line of propertyLines) {
      const book = propertyBook.get(line.linenItemId) ?? 0;
      const delta = line.countedQty - book;
      if (delta === 0) continue;
      entries.push({
        locationId: cleanLoc.id,
        linenItemId: line.linenItemId,
        condition: LinenCondition.CLEAN,
        qtyDelta: delta,
        unitCost: undefined,
        meta: {
          flow: "fresh_start",
          side: "property",
          bookQty: book,
          countedQty: line.countedQty,
        },
      });
    }

    // (b) Still with each laundry → variance lands in that vendor's
    //     location as SOILED (the receivable bucket).
    const vendorIds = [...new Set(vendorLines.map((l) => l.vendorId))];
    const vendorLocs = new Map<string, string>();
    for (const vendorId of vendorIds) {
      const loc = await ensureVendorLocationForPropertyVendor(
        propertyId,
        vendorId
      );
      vendorLocs.set(vendorId, loc.id);
    }

    if (vendorIds.length) {
      const grouped = await groupVendorBook(propertyId, [
        ...vendorLocs.values(),
      ]);
      for (const line of vendorLines) {
        const locId = vendorLocs.get(line.vendorId)!;
        const book = grouped.get(`${locId}:${line.linenItemId}`) ?? 0;
        const delta = line.countedQty - book;
        if (delta === 0) continue;
        entries.push({
          locationId: locId,
          linenItemId: line.linenItemId,
          condition: LinenCondition.SOILED,
          qtyDelta: delta,
          unitCost: undefined,
          meta: {
            flow: "fresh_start",
            side: "vendor",
            vendorId: line.vendorId,
            bookQty: book,
            countedQty: line.countedQty,
          },
        });
      }
    }

    if (entries.length === 0) {
      return { ok: true, transactionId: null, adjustedLines: 0, matched: true };
    }

    const posted = (await postTransaction(
      {
        type: TxnType.ADJUSTMENT,
        propertyId,
        reference: `RESET:${istDateKey()}`,
        note: [
          "Fresh start. Counted stock becomes the new starting point; earlier wrong entries are corrected in one go.",
          note,
        ]
          .filter(Boolean)
          .join("\n"),
        createdById: user.id,
        idempotencyKey: idempotencyKey.slice(0, 80),
        entries,
      },
      { strictStock: { enabled: false } }
    )) as LedgerResult<{ transactionId: string; idempotent: boolean }>;

    if (!posted.ok) {
      return {
        ok: false,
        message: posted.error.message ?? "Ledger rejected the fresh start.",
      };
    }

    revalidatePath("/admin/closing");
    revalidatePath("/app/stock");
    revalidatePath("/app/txns");
    revalidatePath("/app");

    return {
      ok: true,
      transactionId: posted.data.transactionId,
      adjustedLines: entries.length,
      matched: false,
    };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? "Fresh start failed." };
  }
}

/** Net SOILED+REWASH book per (vendorLocation, item). */
async function groupVendorBook(propertyId: string, locationIds: string[]) {
  const grouped = await prisma.transactionEntry.groupBy({
    by: ["locationId", "linenItemId"],
    where: {
      propertyId,
      locationId: { in: locationIds },
      condition: { in: [LinenCondition.SOILED, LinenCondition.REWASH] },
    },
    _sum: { qtyDelta: true },
  });
  return new Map(
    grouped.map((g) => [
      `${g.locationId}:${g.linenItemId}`,
      Number(g._sum.qtyDelta ?? 0),
    ])
  );
}
