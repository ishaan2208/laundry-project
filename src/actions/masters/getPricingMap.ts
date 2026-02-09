"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/**
 * Get pricing map for a specific vendor
 * Returns Map<linenItemId, unitPrice>
 * Returns empty map if pricing table doesn't exist or no prices are set
 */
export async function getPricingMapForVendor(vendorId: string) {
  await requireUser(); // Ensure user is authenticated

  try {
    // Check if pricing model exists in Prisma client
    if (!prisma.pricing) {
      return new Map<string, number>();
    }

    const pricing = await prisma.pricing.findMany({
      where: { vendorId },
      select: {
        linenItemId: true,
        unitPrice: true,
      },
    });

    const map = new Map<string, number>();
    for (const p of pricing) {
      map.set(p.linenItemId, Number(p.unitPrice));
    }

    return map;
  } catch (error) {
    // Handle case where pricing table doesn't exist (migration not run)
    // or any other database errors
    console.warn("Error fetching pricing:", error);
    return new Map<string, number>();
  }
}
