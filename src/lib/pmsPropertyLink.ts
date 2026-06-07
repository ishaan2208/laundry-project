import "server-only";

import { prisma } from "@/lib/db";

/** Legacy laundry CUID → PMS Property.id (used before pmsPropertyId column). */
export const LEGACY_LAUNDRY_TO_PMS_PROPERTY_ID: Record<string, number> = {
  cmjit5fec00000jus9iv5e33l: 1,
  cmjit5fed00010juscawwjtgk: 2,
  cmjit5fed00020jus153iq3xb: 3,
  cmjit5fed00030jush3szc50b: 5,
  cmjit5fee00040jusbedegruh: 63,
  cmjit5fee00050jus5aqrlfs5: 67,
};

export const PMS_PROPERTY_ID_BY_CODE: Record<string, number> = {
  H1: 1,
  H2: 2,
  H3: 3,
  H4: 5,
  H5: 63,
  H6: 67,
};

/**
 * Resolve backend PMS property id for a laundry property.
 * Order: DB pmsPropertyId → property code → legacy CUID map.
 */
export async function resolvePmsPropertyId(
  laundryPropertyId: string
): Promise<number | null> {
  try {
    const property = await prisma.property.findUnique({
      where: { id: laundryPropertyId },
      select: { pmsPropertyId: true, code: true },
    });

    if (property?.pmsPropertyId != null) {
      return property.pmsPropertyId;
    }

    if (property?.code && PMS_PROPERTY_ID_BY_CODE[property.code] != null) {
      return PMS_PROPERTY_ID_BY_CODE[property.code];
    }
  } catch (error) {
    console.warn(
      "[resolvePmsPropertyId] DB lookup failed; falling back to legacy map.",
      error
    );
  }

  return LEGACY_LAUNDRY_TO_PMS_PROPERTY_ID[laundryPropertyId] ?? null;
}
