// src/actions/admin/users/setUserProperties.ts
"use server";

import { prisma } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/auth";
import { z } from "zod";

const Schema = z.object({
  userId: z.string().min(1),
  propertyIds: z.array(z.string().min(1)),
});

export async function setUserPropertiesAdmin(input: z.infer<typeof Schema>) {
  const me = await requireUser();
  await requireRole(me, ["ADMIN"]);

  const data = Schema.parse(input);

  await prisma.$transaction(async (db) => {
    await db.userProperty.deleteMany({ where: { userId: data.userId } });
    if (data.propertyIds.length) {
      await db.userProperty.createMany({
        data: data.propertyIds.map((propertyId) => ({
          userId: data.userId,
          propertyId,
        })),
      });
    }
  });

  return { ok: true };
}
