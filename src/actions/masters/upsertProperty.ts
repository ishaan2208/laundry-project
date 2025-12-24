"use server";

import { prisma } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import {
  ensureDefaultLocationsForProperty,
  ensureVendorLocationsForProperty,
} from "@/lib/masters";
import { revalidatePath } from "next/cache";

const Schema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  code: z.string().trim().min(1).max(10).optional().or(z.literal("")),
});

export async function upsertProperty(input: z.infer<typeof Schema>) {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  const data = Schema.parse(input);

  const created = await prisma.property.upsert({
    where: { id: data.id ?? "__new__" },
    create: {
      name: data.name,
      code: data.code ? data.code.toUpperCase() : null,
      isActive: true,
    },
    update: {
      name: data.name,
      code: data.code ? data.code.toUpperCase() : null,
    },
    select: { id: true },
  });

  // ✅ seed rules
  await ensureDefaultLocationsForProperty(created.id);
  await ensureVendorLocationsForProperty(created.id);

  revalidatePath("/settings/properties");
  revalidatePath("/settings/locations");
  return { ok: true as const, id: created.id };
}
