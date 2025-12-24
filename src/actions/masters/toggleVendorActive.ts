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

export async function toggleVendorActive(input: z.infer<typeof Schema>) {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  const { id, isActive } = Schema.parse(input);

  await prisma.vendor.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/settings/vendors");
  revalidatePath("/settings/locations");
  return { ok: true as const };
}
