// src/actions/admin/users/toggleUserActive.ts
"use server";

import { prisma } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/auth";
import { z } from "zod";

const Schema = z.object({
  userId: z.string().min(1),
  isActive: z.boolean(),
});

export async function toggleUserActiveAdmin(input: z.infer<typeof Schema>) {
  const me = await requireUser();
  await requireRole(me, ["ADMIN"]);

  const data = Schema.parse(input);

  await prisma.user.update({
    where: { id: data.userId },
    data: { isActive: data.isActive },
  });

  return { ok: true };
}
