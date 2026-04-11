"use server";

import { revalidatePath } from "next/cache";
import {
  UserRole,
  PhysicalStockCountStatus,
  TxnType,
  LinenCondition,
  LocationKind,
} from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { requireUser, requireRole, requirePropertyAccess } from "@/lib/auth";
import { postTransaction } from "@/lib/ledger";
import type { LedgerResult } from "@/lib/ledger";
import {
  ensureDefaultLocationsForProperty,
  resolveLocation,
} from "@/lib/workflowLocations";
import { computeStockAuditRollupCore } from "@/lib/computeStockAuditRollupCore";

export async function approvePhysicalStockCount(
  countId: string
): Promise<
  { ok: true; transactionId: string | null } | { ok: false; message: string }
> {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  const count = await prisma.physicalStockCount.findUnique({
    where: { id: countId },
    include: { lines: true },
  });

  if (!count) return { ok: false, message: "Count not found." };
  if (count.status !== PhysicalStockCountStatus.PENDING_REVIEW) {
    return { ok: false, message: "Only pending counts can be approved." };
  }
  await requirePropertyAccess(user, count.propertyId);

  await ensureDefaultLocationsForProperty(count.propertyId);
  const cleanLoc = await resolveLocation({
    propertyId: count.propertyId,
    kind: LocationKind.CLEAN_STORE,
  });

  const rollup = await computeStockAuditRollupCore({
    propertyId: count.propertyId,
    includeVendor: count.includeVendor,
    includeDiscarded: count.includeDiscarded,
  });
  const bookMap = new Map(rollup.rows.map((r) => [r.linenItemId, r.totalQty]));

  const entries = count.lines
    .map((line) => {
      const bookNow = bookMap.get(line.linenItemId) ?? 0;
      const approved = line.approvedQty ?? line.countedQty;
      const delta = approved - bookNow;
      if (delta === 0) return null;
      return {
        locationId: cleanLoc.id,
        linenItemId: line.linenItemId,
        condition: LinenCondition.CLEAN,
        qtyDelta: delta,
        meta: {
          physicalCountId: count.id,
          flow: "physical_count_approve",
          bookAtApprove: bookNow,
          staffCounted: line.countedQty,
          adminApproved: approved,
        },
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  let transactionId: string | null = null;

  if (entries.length > 0) {
    const posted = (await postTransaction(
      {
        type: TxnType.ADJUSTMENT,
        propertyId: count.propertyId,
        reference: `PHYS:${count.id}`,
        note: `Approved physical stock count ${count.id}. Vendor/in-laundry buckets unchanged; variances applied only to clean store (CLEAN) so property-wide totals match admin-approved figures.`,
        createdById: user.id,
        idempotencyKey: `phys-appr-${count.id}`.slice(0, 80),
        entries,
      },
      { strictStock: { enabled: false } }
    )) as LedgerResult<{ transactionId: string; idempotent: boolean }>;

    if (!posted.ok) {
      return {
        ok: false,
        message: posted.error.message ?? "Ledger rejected the adjustment.",
      };
    }
    transactionId = posted.data.transactionId;
  }

  await prisma.physicalStockCount.update({
    where: { id: count.id },
    data: {
      status: PhysicalStockCountStatus.APPROVED,
      reviewedById: user.id,
      reviewedAt: new Date(),
      approvalTransactionId: transactionId,
    },
  });

  revalidatePath("/app/stock");
  revalidatePath("/app/stock/physical-count");
  revalidatePath("/app/stock/audit");
  revalidatePath("/admin/physical-stock-counts");

  return { ok: true, transactionId };
}
