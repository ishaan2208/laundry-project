import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LinenCondition, UserRole } from "@prisma/client";
import { getVendorPending } from "@/actions/reports/getVendorPending";
import { VendorPendingCard } from "@/components/reports/VendorPendingCard";
import { ReportFiltersSheet } from "@/components/reports/ReportFiltersSheet";
import { Card } from "@/components/ui/card";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const user = await requireUser();

  const propertyId =
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

  if (!propertyId) {
    if (properties.length === 1)
      redirect(`/vendors?propertyId=${properties[0].id}`);
    return (
      <Card className="p-4 text-sm">
        Select a property to view vendor pending.
      </Card>
    );
  }

  const linenItems = await prisma.linenItem.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const res = await getVendorPending({ propertyId, condition, linenItemId });
  if (!res.ok) return <Card className="p-4 text-sm">Failed to load.</Card>;

  return (
    <div className="mx-auto w-full max-w-2xl p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-lg font-semibold">Vendor Pending</div>
          <div className="text-xs text-muted-foreground">
            “In laundry” = stock at vendor locations
          </div>
        </div>

        <ReportFiltersSheet
          title="Pending Filters"
          fields={[
            {
              key: "propertyId",
              label: "Property",
              type: "select",
              options: properties.map((p) => ({ value: p.id, label: p.name })),
            },
            {
              key: "condition",
              label: "Condition",
              type: "select",
              options: Object.values(LinenCondition).map((c) => ({
                value: c,
                label: c.replaceAll("_", " "),
              })),
              placeholder: "All",
            },
            {
              key: "linenItemId",
              label: "Item",
              type: "select",
              options: linenItems.map((i) => ({ value: i.id, label: i.name })),
              placeholder: "All",
            },
          ]}
        />
      </div>

      <div className="mt-3 grid gap-2">
        {res.vendors.length ? (
          res.vendors.map((v) => (
            <VendorPendingCard key={v.vendorId} vendor={v} />
          ))
        ) : (
          <Card className="p-4 text-sm text-muted-foreground">
            No pending stock for current filters.
          </Card>
        )}
      </div>
    </div>
  );
}
