"use server";

import { prisma } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const Schema = z.object({
  id: z.string(),
  isActive: z.boolean(),
});

export async function toggleLocationActive(input: z.infer<typeof Schema>) {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  const { id, isActive } = Schema.parse(input);

  if (!isActive) {
    // ✅ block disabling if any item+condition has non-zero balance at this location
    const groups = await prisma.transactionEntry.groupBy({
      by: ["linenItemId", "condition"],
      where: { locationId: id },
      _sum: { qtyDelta: true },
    });

    const hasNonZero = groups.some((g) => (g._sum.qtyDelta ?? 0) !== 0);
    if (hasNonZero) {
      return {
        ok: false as const,
        message: "Cannot disable: location has stock balance.",
      };
    }
  }

  await prisma.location.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/settings/locations");
  return { ok: true as const };
}
