import { prisma } from "@/lib/db";
import type { Location, LocationKind } from "@prisma/client";

const DEFAULT_LOCATION_NAMES: Record<
  Exclude<LocationKind, "VENDOR">,
  string
> = {
  CLEAN_STORE: "Clean Store",
  SOILED_STORE: "Soiled Store",
  REWASH_BIN: "Rewash Bin",
  DAMAGED_BIN: "Damaged Bin",
  DISCARDED_LOST: "Discarded / Lost",
};

export function kindKeyFor(kind: LocationKind, vendorId?: string) {
  if (kind === "VENDOR") {
    if (!vendorId) throw new Error("vendorId required for VENDOR kindKey");
    return `VENDOR:${vendorId}`;
  }
  return kind; // stable for system defaults
}

export async function ensureDefaultLocationsForProperty(propertyId: string) {
  const kinds: Array<Exclude<LocationKind, "VENDOR">> = [
    "CLEAN_STORE",
    "SOILED_STORE",
    "REWASH_BIN",
    "DAMAGED_BIN",
    "DISCARDED_LOST",
  ];

  await prisma.$transaction(
    kinds.map((kind) => {
      const kindKey = kindKeyFor(kind);
      const name = DEFAULT_LOCATION_NAMES[kind];
      return prisma.location.upsert({
        where: { propertyId_kindKey: { propertyId, kindKey } },
        create: {
          propertyId,
          name,
          kind,
          kindKey,
          isSystem: true,
          isActive: true,
        },
        update: {
          name,
          kind,
          isSystem: true,
          isActive: true,
        },
      });
    })
  );
}

export async function ensureVendorLocationForPropertyVendor(
  propertyId: string,
  vendorId: string
) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, name: true, isActive: true },
  });
  if (!vendor || !vendor.isActive)
    throw new Error("Vendor not found or inactive");

  const kindKey = kindKeyFor("VENDOR", vendorId);
  const name = `Laundry - ${vendor.name}`;

  return prisma.location.upsert({
    where: { propertyId_kindKey: { propertyId, kindKey } },
    create: {
      propertyId,
      vendorId,
      name,
      kind: "VENDOR",
      kindKey,
      isSystem: true,
      isActive: true,
    },
    update: {
      vendorId,
      name,
      kind: "VENDOR",
      isSystem: true,
      isActive: true,
    },
  });
}

export async function getLocationByKind(
  propertyId: string,
  kind: LocationKind
) {
  if (kind === "VENDOR") {
    throw new Error("Use getVendorLocation(propertyId, vendorId) for VENDOR");
  }

  await ensureDefaultLocationsForProperty(propertyId);

  const kindKey = kindKeyFor(kind);
  const loc = await prisma.location.findUnique({
    where: { propertyId_kindKey: { propertyId, kindKey } },
  });

  if (!loc) throw new Error(`System location missing: ${kind}`);
  if (!loc.isActive) throw new Error(`Location inactive: ${loc.name}`);

  return loc;
}

export async function getVendorLocation(propertyId: string, vendorId: string) {
  const loc = await ensureVendorLocationForPropertyVendor(propertyId, vendorId);
  if (!loc.isActive) throw new Error(`Vendor location inactive: ${loc.name}`);
  return loc;
}

export async function assertLocationInProperty(
  locationId: string,
  propertyId: string
) {
  const loc = await prisma.location.findUnique({ where: { id: locationId } });
  if (!loc) throw new Error("Location not found");
  if (loc.propertyId !== propertyId)
    throw new Error("Location does not belong to property");
  if (!loc.isActive) throw new Error("Location is inactive");
  return loc;
}

export async function resolveLocation({
  propertyId,
  locationId,
  kind,
  vendorId,
}: {
  propertyId: string;
  locationId?: string;
  kind?: LocationKind;
  vendorId?: string;
}): Promise<Location> {
  if (locationId) return assertLocationInProperty(locationId, propertyId);
  if (!kind) throw new Error("locationId or kind required");

  if (kind === "VENDOR") {
    if (!vendorId) throw new Error("vendorId required for VENDOR location");
    return getVendorLocation(propertyId, vendorId);
  }
  return getLocationByKind(propertyId, kind);
}
