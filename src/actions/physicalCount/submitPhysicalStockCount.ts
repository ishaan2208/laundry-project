"use server";

import { revalidatePath } from "next/cache";
import {
  UserRole,
  PhysicalStockCountStatus,
} from "@/generated/prisma";
import { prisma } from "@/lib/db";
import {
  requireUser,
  requirePropertyAccess,
} from "@/lib/auth";
import { computeStockAuditRollupCore } from "@/lib/computeStockAuditRollupCore";

function canSubmitPhysicalCount(role: UserRole) {
  return (
    role === UserRole.ADMIN ||
    role === UserRole.HOUSEKEEPING ||
    role === UserRole.STOREKEEPER ||
    role === UserRole.ACCOUNTANT
  );
}

export async function submitPhysicalStockCount(input: {
  propertyId: string;
  includeVendor: boolean;
  includeDiscarded: boolean;
  staffNote?: string | null;
  lines: { linenItemId: string; countedQty: number }[];
}): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const user = await requireUser();
  if (!canSubmitPhysicalCount(user.role)) {
    return { ok: false, message: "You do not have permission to submit counts." };
  }
  await requirePropertyAccess(user, input.propertyId);

  const activeItems = await prisma.linenItem.findMany({
    where: { isActive: true },
    select: { id: true },
    orderBy: { name: "asc" },
  });
  const activeIds = new Set(activeItems.map((i) => i.id));
  if (input.lines.length !== activeIds.size) {
    return {
      ok: false,
      message: `Provide exactly one quantity per active item (${activeIds.size} items).`,
    };
  }
  for (const l of input.lines) {
    if (!activeIds.has(l.linenItemId)) {
      return { ok: false, message: "Unknown or inactive linen item in payload." };
    }
    if (!Number.isInteger(l.countedQty) || l.countedQty < 0) {
      return { ok: false, message: "Counted quantities must be non-negative integers." };
    }
  }

  const rollup = await computeStockAuditRollupCore({
    propertyId: input.propertyId,
    includeVendor: input.includeVendor,
    includeDiscarded: input.includeDiscarded,
  });
  const bookMap = new Map(rollup.rows.map((r) => [r.linenItemId, r.totalQty]));

  const count = await prisma.$transaction(async (tx) => {
    const c = await tx.physicalStockCount.create({
      data: {
        propertyId: input.propertyId,
        includeVendor: input.includeVendor,
        includeDiscarded: input.includeDiscarded,
        status: PhysicalStockCountStatus.PENDING_REVIEW,
        staffNote: input.staffNote?.trim() || null,
        submittedById: user.id,
      },
      select: { id: true },
    });
    await tx.physicalStockCountLine.createMany({
      data: input.lines.map((l) => ({
        countId: c.id,
        linenItemId: l.linenItemId,
        countedQty: l.countedQty,
        bookQtyAtSubmit: bookMap.get(l.linenItemId) ?? 0,
      })),
    });
    return c;
  });

  revalidatePath("/app/stock/physical-count");
  revalidatePath("/admin/physical-stock-counts");

  return { ok: true, id: count.id };
}
