// src/actions/masters/ensureVendorLocationForPropertyVendor.ts
"use server";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { ensureVendorLocationForPropertyVendor } from "@/lib/masters";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

const Schema = z.object({ propertyId: z.string(), vendorId: z.string() });

export async function ensureVendorLocationForPropertyVendorAction(
  input: z.infer<typeof Schema>
) {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  const { propertyId, vendorId } = Schema.parse(input);
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { name: true },
  });
  if (!vendor) return { ok: false as const, message: "Vendor not found" };

  await ensureVendorLocationForPropertyVendor({
    propertyId,
    vendorId,
    vendorName: vendor.name,
  });

  revalidatePath("/settings/locations");
  return { ok: true as const };
}
