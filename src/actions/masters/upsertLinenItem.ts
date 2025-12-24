"use server";

import { prisma } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const Schema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  sku: z.string().trim().optional().or(z.literal("")),
});

export async function upsertLinenItem(input: z.infer<typeof Schema>) {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  const data = Schema.parse(input);

  const item = await prisma.linenItem.upsert({
    where: { id: data.id ?? "__new__" },
    create: {
      name: data.name,
      sku: data.sku ? data.sku.toUpperCase() : null,
      isActive: true,
    },
    update: {
      name: data.name,
      sku: data.sku ? data.sku.toUpperCase() : null,
    },
    select: { id: true },
  });

  revalidatePath("/settings/items");
  return { ok: true as const, id: item.id };
}
