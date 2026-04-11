"use server";

import { revalidatePath } from "next/cache";
import { UserRole, PhysicalStockCountStatus } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { requireUser, requireRole, requirePropertyAccess } from "@/lib/auth";

export async function rejectPhysicalStockCount(input: {
  countId: string;
  reviewNote: string;
}): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  const note = input.reviewNote.trim();
  if (note.length < 3) {
    return { ok: false, message: "Please add a short rejection note (3+ chars)." };
  }

  const count = await prisma.physicalStockCount.findUnique({
    where: { id: input.countId },
  });

  if (!count) return { ok: false, message: "Count not found." };
  if (count.status !== PhysicalStockCountStatus.PENDING_REVIEW) {
    return { ok: false, message: "Only pending counts can be rejected." };
  }
  await requirePropertyAccess(user, count.propertyId);

  await prisma.physicalStockCount.update({
    where: { id: count.id },
    data: {
      status: PhysicalStockCountStatus.REJECTED,
      reviewedById: user.id,
      reviewedAt: new Date(),
      reviewNote: note,
    },
  });

  revalidatePath("/admin/physical-stock-counts");

  return { ok: true };
}
