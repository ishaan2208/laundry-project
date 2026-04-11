"use server";

import { prisma } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const Schema = z.object({
  id: z.string().optional(),
  vendorId: z.string().min(1),
  linenItemId: z.string().min(1),
  unitPrice: z.coerce.number().positive(),
});

export async function upsertPricing(input: z.infer<typeof Schema>) {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  const data = Schema.parse(input);

  const created = await prisma.pricing.upsert({
    where: { id: data.id ?? "__new__" },
    create: {
      vendorId: data.vendorId,
      linenItemId: data.linenItemId,
      unitPrice: data.unitPrice,
    },
    update: {
      unitPrice: data.unitPrice,
    },
    select: { id: true },
  });

  revalidatePath("/admin/settings/pricing");
  return { ok: true as const, id: created.id };
}
