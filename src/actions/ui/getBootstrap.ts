"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export type PropertyLean = { id: string; name: string };
export type VendorLean = { id: string; name: string };
export type LinenItemLean = { id: string; name: string; unit?: string | null };

export async function getBootstrap(): Promise<{
  properties: PropertyLean[];
  vendors: VendorLean[];
  items: LinenItemLean[];
}> {
  const user = await requireUser();

  // ✅ Properties user can access
  let properties: PropertyLean[] = [];
  if (user.role === UserRole.ADMIN) {
    properties = await prisma.property.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } else {
    // assumes Thread A added UserProperty for scoping
    properties = await prisma.userProperty
      .findMany({
        where: { userId: user.id },
        select: { property: { select: { id: true, name: true } } },
        orderBy: { property: { name: "asc" } },
      })
      .then((rows) => rows.map((r) => r.property));
  }

  const vendors = await prisma.vendor.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const items = await prisma.linenItem.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  console.log("items", items, vendors, properties);

  return { properties, vendors, items };
}
