import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";
import { computeStockAuditRollupCore } from "@/lib/computeStockAuditRollupCore";
import { PhysicalCountFormClient } from "@/components/physicalCount/PhysicalCountFormClient";
import PropertyPicker from "@/components/reports/PropertyPicker";
import { PageHeader } from "@/components/mobile/PageHeader";
import { HelpNote } from "@/components/mobile/HelpNote";
import { RememberProperty } from "@/components/RememberProperty";
import { resolvePropertyId } from "@/lib/propertyPref.server";

export default async function PhysicalCountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const propertyIdParam =
    typeof sp.propertyId === "string" ? sp.propertyId : undefined;

  const properties =
    user.role === UserRole.ADMIN
      ? await prisma.property.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : await prisma.userProperty
          .findMany({
            where: { userId: user.id },
            select: { property: { select: { id: true, name: true } } },
          })
          .then((rows) => rows.map((r) => r.property));

  const propertyId = await resolvePropertyId(propertyIdParam, properties);

  const currentPropertyName = propertyId
    ? properties.find((p) => p.id === propertyId)?.name
    : undefined;

  // Staff count only what they can physically touch: linen AT the hotel.
  // What's with the laundry (and what was thrown away) is never part of
  // this count — the register already tracks those separately.
  const initialRows =
    propertyId != null
      ? (
          await computeStockAuditRollupCore({
            propertyId,
            includeVendor: false,
            includeDiscarded: false,
          })
        ).rows.map((r) => ({
          linenItemId: r.linenItemId,
          name: r.linenItemName,
          sku: r.sku,
          bookQty: r.totalQty,
        }))
      : [];

  return (
    <div className="min-h-dvh bg-background pb-40">
      <RememberProperty propertyId={propertyId} />
      <PageHeader
        title="Count linen"
        subtitle={
          currentPropertyName
            ? `Count what's at the hotel · ${currentPropertyName}`
            : "Count what's at the hotel"
        }
      />

      <main className="mx-auto w-full max-w-md space-y-4 px-4 pt-4">
        {properties.length > 1 ? (
          <PropertyPicker
            properties={properties}
            selectedPropertyId={propertyId}
          />
        ) : null}

        <HelpNote>
          Count only what is at the hotel right now — rooms, store, damaged
          pile, everything you can touch. Linen at the laundry is NOT counted
          here; the app already keeps that account separately.
        </HelpNote>

        {!propertyId ? (
          <div className="surface rounded-2xl p-5 text-center">
            <p className="text-base font-semibold">Choose your hotel first</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The count list loads after you pick one.
            </p>
          </div>
        ) : (
          <PhysicalCountFormClient
            propertyId={propertyId}
            includeVendor={false}
            includeDiscarded={false}
            initialRows={initialRows}
          />
        )}
      </main>
    </div>
  );
}
