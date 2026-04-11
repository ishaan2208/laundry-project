"use server";

import { revalidatePath } from "next/cache";
import { UserRole, PhysicalStockCountStatus } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { requireUser, requireRole, requirePropertyAccess } from "@/lib/auth";

export async function savePhysicalStockApprovedQuantities(input: {
  countId: string;
  lines: { linenItemId: string; approvedQty: number }[];
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  const count = await prisma.physicalStockCount.findUnique({
    where: { id: input.countId },
    include: { lines: { select: { linenItemId: true } } },
  });

  if (!count) return { ok: false, message: "Count not found." };
  if (count.status !== PhysicalStockCountStatus.PENDING_REVIEW) {
    return { ok: false, message: "Only pending counts can be edited." };
  }
  await requirePropertyAccess(user, count.propertyId);

  const allowed = new Set(count.lines.map((l) => l.linenItemId));
  if (input.lines.length !== allowed.size) {
    return { ok: false, message: "Submit one approved quantity per line item." };
  }
  for (const l of input.lines) {
    if (!allowed.has(l.linenItemId)) {
      return { ok: false, message: "Unknown line item." };
    }
    if (!Number.isInteger(l.approvedQty) || l.approvedQty < 0) {
      return { ok: false, message: "Approved quantities must be non-negative integers." };
    }
  }

  await prisma.$transaction(
    input.lines.map((l) =>
      prisma.physicalStockCountLine.updateMany({
        where: { countId: input.countId, linenItemId: l.linenItemId },
        data: { approvedQty: l.approvedQty },
      })
    )
  );

  revalidatePath("/admin/physical-stock-counts");
  revalidatePath(`/admin/physical-stock-counts/${input.countId}`);

  return { ok: true };
}
