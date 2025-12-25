// src/app/app/stock/page.tsx
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
import { Badge } from "@/components/ui/badge";
import {
  Boxes,
  SlidersHorizontal,
  TriangleAlert,
  Building2,
  PackageSearch,
} from "lucide-react";

const BASE_PATH = "/app/stock";

function parseEnum<T extends string>(
  v: unknown,
  values: readonly T[],
  fallback?: T
) {
  if (typeof v !== "string") return fallback;
  return (values as readonly string[]).includes(v) ? (v as T) : fallback;
}

function labelEnum(v: string) {
  return v.replaceAll("_", " ");
}

export default async function StockPage({
  searchParams,
}: {
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

  // Defaults: show vendor (in-laundry) balances by default
  const locationKind =
    parseEnum<LocationKind>(
      sp.locationKind,
      Object.values(LocationKind),
      LocationKind.VENDOR
    ) ?? LocationKind.VENDOR;

  const condition = parseEnum<LinenCondition>(
    sp.condition,
    Object.values(LinenCondition),
    undefined
  );

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

  // If user has exactly one property, lock it in
  if (!propertyId && properties.length === 1) {
    redirect(`${BASE_PATH}?propertyId=${properties[0].id}`);
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

  const negativeCount = res.rows.filter((r) => r.isNegative).length;
  const activeFiltersCount =
    Number(Boolean(condition)) +
    Number(Boolean(linenItemId)) +
    Number(Boolean(locationKind));

  const currentPropertyName = propertyId
    ? properties.find((p) => p.id === propertyId)?.name
    : undefined;

  const hasAnyData = res.rows.length > 0;

  return (
    <div className="mx-auto w-full max-w-2xl p-3">
      {/* Premium glass header */}
      <Card className="border bg-background/40 backdrop-blur-md supports-[backdrop-filter]:bg-background/30">
        <div className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-background/50">
                  <Boxes className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold">
                    Stock Snapshot
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Balances (SUM of ledger entries)
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {currentPropertyName ? (
                  <Badge variant="secondary" className="gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {currentPropertyName}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <TriangleAlert className="h-3.5 w-3.5" />
                    Select property to view stock
                  </Badge>
                )}

                <Badge variant="outline">{labelEnum(locationKind)}</Badge>

                {condition ? (
                  <Badge variant="secondary">{labelEnum(condition)}</Badge>
                ) : null}
                {linenItemId ? (
                  <Badge variant="secondary" className="gap-1">
                    <PackageSearch className="h-3.5 w-3.5" />
                    {linenItems.find((i) => i.id === linenItemId)?.name ??
                      "Item"}
                  </Badge>
                ) : null}

                {negativeCount > 0 ? (
                  <Badge variant="destructive" className="gap-1">
                    <TriangleAlert className="h-3.5 w-3.5" />
                    {negativeCount} negative
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ReportFiltersSheet
                title="Stock Filters"
                buttonLabel="Filters"
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
                      label: labelEnum(k),
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

              {/* desktop quick property buttons */}
              {properties.length > 1 ? (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">Property:</div>
                  {properties.map((p) => (
                    <Button
                      key={p.id}
                      asChild
                      variant={p.id === propertyId ? "default" : "outline"}
                      size="sm"
                    >
                      <Link href={`${BASE_PATH}?propertyId=${p.id}`}>
                        {p.name}
                      </Link>
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* mobile property picker */}
          {properties.length > 1 ? (
            <div className="mt-3">
              <PropertyPicker
                properties={properties}
                current={propertyId}
                required
                label="Property"
                placeholder="Select property"
              />
            </div>
          ) : null}

          {/* quick clear (only when property selected) */}
          {propertyId && activeFiltersCount > 0 ? (
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Tip: Default view is “Vendor” (in laundry).
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-2">
                <Link href={`${BASE_PATH}?propertyId=${propertyId}`}>
                  <SlidersHorizontal className="h-4 w-4" />
                  Reset filters
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      {/* body */}
      <div className="mt-3">
        {!propertyId ? (
          <Card className="p-4 text-sm text-muted-foreground">
            Pick a property to view balances.
          </Card>
        ) : !hasAnyData ? (
          <Card className="p-4 text-sm text-muted-foreground">
            No rows for current filters.
          </Card>
        ) : (
          <BalanceTable rows={res.rows} />
        )}
      </div>
    </div>
  );
}
