"use server";

import { prisma } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { ensureVendorLocationsForVendor } from "@/lib/masters";
import { revalidatePath } from "next/cache";

const Schema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  phone: z.string().trim().optional().or(z.literal("")),
});

export async function upsertVendor(input: z.infer<typeof Schema>) {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  const data = Schema.parse(input);

  const vendor = await prisma.vendor.upsert({
    where: { id: data.id ?? "__new__" },
    create: {
      name: data.name,
      phone: data.phone ? data.phone : null,
      isActive: true,
    },
    update: {
      name: data.name,
      phone: data.phone ? data.phone : null,
    },
    select: { id: true },
  });

  // ✅ seed rules: create vendor-locations for all active properties
  await ensureVendorLocationsForVendor(vendor.id);

  revalidatePath("/settings/vendors");
  revalidatePath("/settings/locations");
  return { ok: true as const, id: vendor.id };
}
