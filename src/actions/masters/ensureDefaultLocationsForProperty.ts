// src/actions/masters/ensureDefaultLocationsForProperty.ts
"use server";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { ensureDefaultLocationsForProperty } from "@/lib/masters";
import { revalidatePath } from "next/cache";

const Schema = z.object({ propertyId: z.string() });

export async function ensureDefaultLocationsForPropertyAction(
  input: z.infer<typeof Schema>
) {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  const { propertyId } = Schema.parse(input);
  await ensureDefaultLocationsForProperty(propertyId);

  revalidatePath("/settings/locations");
  return { ok: true as const };
}
