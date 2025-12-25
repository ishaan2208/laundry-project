// src/app/(admin)/settings/locations/page.tsx
import { prisma } from "@/lib/db";
import LocationsClient from "./ui/LocationsClient";
import PropertySelectorClient from "./PropertySelectorClient";

export const dynamic = "force-dynamic";

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string }>;
}) {
  const sp = await searchParams;

  const properties = await prisma.property.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const propertyId = sp.propertyId ?? properties[0]?.id ?? null;

  const locations = propertyId
    ? await prisma.location.findMany({
        where: { propertyId },
        orderBy: [{ isActive: "desc" }, { kind: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          kind: true,
          isActive: true,
          isSystem: true,
          vendor: { select: { name: true } },
        },
      })
    : [];

  return (
    <div>
      <LocationsClient
        properties={properties}
        propertyId={propertyId}
        initial={locations}
      />
    </div>
  );
}
