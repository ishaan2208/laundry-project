"use server";

import { prisma } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

export async function deletePricing(id: string) {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  await prisma.pricing.delete({
    where: { id },
  });

  revalidatePath("/admin/settings/pricing");
  return { ok: true as const };
}
