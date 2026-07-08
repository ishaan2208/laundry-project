// src/app/app/vendors/page.tsx
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { LinenCondition, UserRole } from "@/generated/prisma";
import { getVendorPending } from "@/actions/reports/getVendorPending";
import { VendorPendingCard } from "@/components/reports/VendorPendingCard";
import { ReportFiltersSheet } from "@/components/reports/ReportFiltersSheet";
import PropertyPicker from "@/components/reports/PropertyPicker";
import { PageHeader } from "@/components/mobile/PageHeader";
import { RememberProperty } from "@/components/RememberProperty";
import { resolvePropertyId } from "@/lib/propertyPref.server";

function labelEnum(v: string) {
  return v.replaceAll("_", " ").toLowerCase();
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const user = await requireUser();

  const propertyIdParam =
    typeof sp.propertyId === "string" ? sp.propertyId : undefined;

  const condition =
    typeof sp.condition === "string"
      ? (sp.condition as LinenCondition)
      : undefined;

  const linenItemId =
    typeof sp.linenItemId === "string" ? sp.linenItemId : undefined;

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

  if (!propertyId) {
    return (
      <div className="min-h-dvh bg-background pb-6">
        <PageHeader
          title="At the laundry"
          subtitle="How much linen each laundry has right now"
          back={false}
        />
        <main className="mx-auto w-full max-w-md px-4 pt-4">
          <div className="surface rounded-2xl p-5 text-center">
            <p className="text-base font-semibold">Choose your hotel first</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a hotel to see what&apos;s at each laundry.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const linenItems = await prisma.linenItem.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const res = await getVendorPending({ propertyId, condition, linenItemId });
  const propertyName = properties.find((p) => p.id === propertyId)?.name;

  if (!res.ok) {
    return (
      <div className="min-h-dvh bg-background pb-6">
        <PageHeader
          title="At the laundry"
          subtitle={propertyName}
          back={false}
        />
        <main className="mx-auto w-full max-w-md px-4 pt-4">
          <div className="surface rounded-2xl p-5 text-center text-sm text-muted-foreground">
            Could not load this. Try again.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-6">
      <RememberProperty propertyId={propertyId} />
      <PageHeader
        title="At the laundry"
        subtitle={propertyName}
        back={false}
        right={
          <ReportFiltersSheet
            title="Filters"
            buttonLabel="Filters"
            fields={[
              {
                key: "propertyId",
                label: "Hotel",
                type: "select",
                options: properties.map((p) => ({
                  value: p.id,
                  label: p.name,
                })),
              },
              {
                key: "condition",
                label: "Condition",
                type: "select",
                options: Object.values(LinenCondition).map((c) => ({
                  value: c,
                  label: labelEnum(c),
                })),
                placeholder: "All",
              },
              {
                key: "linenItemId",
                label: "Item",
                type: "select",
                options: linenItems.map((i) => ({
                  value: i.id,
                  label: i.name,
                })),
                placeholder: "All",
              },
            ]}
          />
        }
      />

      <main className="mx-auto w-full max-w-md space-y-4 px-4 pt-4">
        {properties.length > 1 ? (
          <PropertyPicker
            properties={properties}
            selectedPropertyId={propertyId}
          />
        ) : null}

        {res.vendors.length ? (
          <div className="space-y-3">
            {res.vendors.map((v) => (
              <VendorPendingCard key={v.vendorId} vendor={v} />
            ))}
          </div>
        ) : (
          <div className="surface rounded-2xl p-6 text-center">
            <p className="text-base font-semibold">Nothing at the laundry</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nothing matches your current filters.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
