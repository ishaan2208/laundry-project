"use server";

import { prisma } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/auth";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const Schema = z.object({
  userId: z.string().min(1),
  name: z.string().nullable(),
  role: z.nativeEnum(UserRole),
  propertyIds: z.array(z.string()).optional(),
});

export async function updateUserAdmin(input: z.infer<typeof Schema>) {
  const me = await requireUser();
  await requireRole(me, ["ADMIN"]);

  const data = Schema.parse(input);

  // Use a transaction to update user and their property links atomically
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: data.userId },
      data: { name: data.name, role: data.role },
    });

    if (data.propertyIds) {
      // remove existing links for the user
      await tx.userProperty.deleteMany({ where: { userId: data.userId } });

      if (data.propertyIds.length > 0) {
        const createData = data.propertyIds.map((pid) => ({
          userId: data.userId,
          propertyId: pid,
        }));

        // createMany is not available with nested transactions in some setups; use create in a loop
        await Promise.all(
          createData.map((d) => tx.userProperty.create({ data: d }))
        );
      }
    }
  });

  return { ok: true };
}
