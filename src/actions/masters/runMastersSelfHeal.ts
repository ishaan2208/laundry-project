// src/actions/masters/runMastersSelfHeal.ts
"use server";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { mastersSelfHeal } from "@/lib/masters";
import { revalidatePath } from "next/cache";

export async function runMastersSelfHeal() {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  await mastersSelfHeal();

  revalidatePath("/settings");
  revalidatePath("/settings/locations");
  return { ok: true as const };
}
