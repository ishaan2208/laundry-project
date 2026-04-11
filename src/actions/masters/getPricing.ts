"use server";

import { prisma } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";

export async function getPricing() {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  const pricing = await prisma.pricing.findMany({
    include: {
      vendor: {
        select: { id: true, name: true, isActive: true },
      },
      linenItem: {
        select: { id: true, name: true, isActive: true },
      },
    },
    orderBy: [
      { vendor: { name: "asc" } },
      { linenItem: { name: "asc" } },
    ],
  });

  return {
    ok: true as const,
    pricing: pricing.map((p) => ({
      id: p.id,
      vendorId: p.vendorId,
      vendorName: p.vendor.name,
      linenItemId: p.linenItemId,
      linenItemName: p.linenItem.name,
      unitPrice: Number(p.unitPrice),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  };
}

export async function getPricingByVendorAndItem(
  vendorId: string,
  linenItemId: string
) {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN, UserRole.HOUSEKEEPING, UserRole.ACCOUNTANT]);

  const pricing = await prisma.pricing.findUnique({
    where: {
      vendorId_linenItemId: {
        vendorId,
        linenItemId,
      },
    },
  });

  return pricing ? Number(pricing.unitPrice) : null;
}
