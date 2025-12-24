// src/lib/masters.ts
import { prisma } from "@/lib/db";
import { LocationKind } from "@prisma/client";

export const DEFAULT_LOCATION_SPECS: Array<{
  kind: Exclude<LocationKind, "VENDOR">;
  defaultName: string;
}> = [
  { kind: "CLEAN_STORE", defaultName: "Clean Store" },
  { kind: "SOILED_STORE", defaultName: "Soiled Store" },
  { kind: "REWASH_BIN", defaultName: "Rewash Bin" },
  { kind: "DAMAGED_BIN", defaultName: "Damaged Bin" },
  { kind: "DISCARDED_LOST", defaultName: "Discarded / Lost" },
];

export function buildKindKey(kind: LocationKind, vendorId?: string | null) {
  if (kind === "VENDOR") {
    if (!vendorId) throw new Error("VENDOR location requires vendorId");
    return `VENDOR:${vendorId}`;
  }
  return kind; // e.g. "CLEAN_STORE"
}

export function defaultVendorLocationName(vendorName: string) {
  return `Laundry - ${vendorName}`.trim();
}

async function resolveUniqueLocationName(
  propertyId: string,
  desiredName: string
) {
  // propertyId + name is unique
  const existing = await prisma.location.findFirst({
    where: { propertyId, name: desiredName },
    select: { id: true },
  });
  if (!existing) return desiredName;

  // fallback: add short suffix
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${desiredName} (${suffix})`;
}

export async function ensureDefaultLocationsForProperty(propertyId: string) {
  return prisma.$transaction(async (tx) => {
    for (const spec of DEFAULT_LOCATION_SPECS) {
      const kindKey = buildKindKey(spec.kind);
      const desiredName = spec.defaultName;

      // Upsert by (propertyId, kindKey) – requires schema change above
      const existing = await tx.location.findFirst({
        where: { propertyId, kindKey },
        select: { id: true, name: true },
      });

      if (!existing) {
        const name = await resolveUniqueLocationName(propertyId, desiredName);
        await tx.location.create({
          data: {
            propertyId,
            vendorId: null,
            kind: spec.kind,
            kindKey,
            name,
            isSystem: true,
            isActive: true,
          },
        });
      }
    }
  });
}

export async function ensureVendorLocationForPropertyVendor(args: {
  propertyId: string;
  vendorId: string;
  vendorName: string;
}) {
  const { propertyId, vendorId, vendorName } = args;
  const kindKey = buildKindKey("VENDOR", vendorId);
  const desiredName = defaultVendorLocationName(vendorName);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.location.findFirst({
      where: { propertyId, kindKey },
      select: { id: true },
    });

    if (!existing) {
      const name = await resolveUniqueLocationName(propertyId, desiredName);
      await tx.location.create({
        data: {
          propertyId,
          vendorId,
          kind: "VENDOR",
          kindKey,
          name,
          isSystem: true,
          isActive: true,
        },
      });
    }
  });
}

export async function ensureVendorLocationsForProperty(propertyId: string) {
  const vendors = await prisma.vendor.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  for (const v of vendors) {
    await ensureVendorLocationForPropertyVendor({
      propertyId,
      vendorId: v.id,
      vendorName: v.name,
    });
  }
}

export async function ensureVendorLocationsForVendor(vendorId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, name: true, isActive: true },
  });
  if (!vendor || !vendor.isActive) return;

  const properties = await prisma.property.findMany({
    where: { isActive: true },
    select: { id: true },
    orderBy: { name: "asc" },
  });

  for (const p of properties) {
    await ensureVendorLocationForPropertyVendor({
      propertyId: p.id,
      vendorId: vendor.id,
      vendorName: vendor.name,
    });
  }
}

export async function mastersSelfHeal() {
  const [properties, vendors] = await Promise.all([
    prisma.property.findMany({
      where: { isActive: true },
      select: { id: true },
    }),
    prisma.vendor.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  for (const p of properties) {
    await ensureDefaultLocationsForProperty(p.id);
    for (const v of vendors) {
      await ensureVendorLocationForPropertyVendor({
        propertyId: p.id,
        vendorId: v.id,
        vendorName: v.name,
      });
    }
  }

  return { ok: true as const };
}
