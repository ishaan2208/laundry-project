"use server";

import { prisma } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const Schema = z.object({
  id: z.string(),
  name: z.string().min(2),
});

export async function upsertLocationName(input: z.infer<typeof Schema>) {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  const { id, name } = Schema.parse(input);

  await prisma.location.update({
    where: { id },
    data: { name },
  });

  revalidatePath("/settings/locations");
  return { ok: true as const };
}
