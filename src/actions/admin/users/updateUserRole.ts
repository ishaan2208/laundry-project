// src/actions/admin/users/updateUserRole.ts
"use server";

import { prisma } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/auth";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const Schema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(UserRole),
});

export async function updateUserRoleAdmin(input: z.infer<typeof Schema>) {
  const me = await requireUser();
  await requireRole(me, ["ADMIN"]);

  const data = Schema.parse(input);

  // optional: prevent removing your own admin
  // if (data.userId === me.id && data.role !== "ADMIN") throw new Error("You can't remove your own admin role.");

  await prisma.user.update({
    where: { id: data.userId },
    data: { role: data.role },
  });

  return { ok: true };
}
