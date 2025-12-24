import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LocationKind, LinenCondition, UserRole } from "@prisma/client";
import { getBalances } from "@/actions/reports/getBalances";
import { BalanceTable } from "@/components/reports/BalanceTable";
import { ReportFiltersSheet } from "@/components/reports/ReportFiltersSheet";
import PropertyPicker from "@/components/reports/PropertyPicker";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function StockPage({
  searchParams,
}: {
  // `searchParams` may be a Promise in newer Next.js versions so accept a
  // Promise and await it before accessing properties.
  searchParams:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const user = await requireUser();

  const sp = (await searchParams) as Record<
    string,
    string | string[] | undefined
  >;

  const propertyId =
    typeof sp.propertyId === "string" ? sp.propertyId : undefined;
  const locationKind =
    typeof sp.locationKind === "string"
      ? (sp.locationKind as LocationKind)
      : undefined;
  const condition =
    typeof sp.condition === "string"
      ? (sp.condition as LinenCondition)
      : undefined;
  const linenItemId =
    typeof sp.linenItemId === "string" ? sp.linenItemId : undefined;

  // property list (read-only)
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
      redirect(`/stock?propertyId=${properties[0].id}`);
    // If multiple properties exist but none selected, allow the user to pick one
    // via the ReportFiltersSheet or the inline picker below. Don't return early
    // — just render the page without making data calls that require a property.
  }

  const linenItems = propertyId
    ? await prisma.linenItem.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const res = propertyId
    ? await getBalances({ propertyId, locationKind, condition, linenItemId })
    : { ok: true as const, rows: [] };

  if (!res.ok) return <Card className="p-4 text-sm">Failed to load.</Card>;

  return (
    <div className="mx-auto w-full max-w-2xl p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-lg font-semibold">Stock Snapshot</div>
          <div className="text-xs text-muted-foreground">
            Balances (SUM of ledger entries)
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ReportFiltersSheet
            title="Stock Filters"
            fields={[
              {
                key: "propertyId",
                label: "Property",
                type: "select",
                options: properties.map((p) => ({
                  value: p.id,
                  label: p.name,
                })),
              },
              {
                key: "locationKind",
                label: "Location",
                type: "select",
                options: Object.values(LocationKind).map((k) => ({
                  value: k,
                  label: k.replaceAll("_", " "),
                })),
              },
              {
                key: "condition",
                label: "Condition",
                type: "select",
                options: Object.values(LinenCondition).map((c) => ({
                  value: c,
                  label: c.replaceAll("_", " "),
                })),
              },
              {
                key: "linenItemId",
                label: "Item",
                type: "select",
                options: linenItems.map((i) => ({
                  value: i.id,
                  label: i.name,
                })),
              },
            ]}
          />
          {properties.length > 1 ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <div className="text-xs text-muted-foreground">Property:</div>
                {properties.map((p) => (
                  <Button
                    key={p.id}
                    asChild
                    variant={p.id === propertyId ? "default" : "outline"}
                    size="sm"
                  >
                    <Link href={`/stock?propertyId=${p.id}`}>{p.name}</Link>
                  </Button>
                ))}
              </div>

              <PropertyPicker properties={properties} current={propertyId} />
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        <BalanceTable rows={res.rows} />
      </div>
    </div>
  );
}
