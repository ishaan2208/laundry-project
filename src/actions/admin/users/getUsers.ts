// src/actions/admin/users/getUsers.ts
"use server";

import { prisma } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/auth";

export async function getUsersAdmin() {
  const me = await requireUser();
  await requireRole(me, ["ADMIN"]);

  const [users, properties] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        properties: { select: { propertyId: true } },
      },
    }),
    prisma.property.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);

  return { users, properties };
}
