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
import { Separator } from "@/components/ui/separator";
import {
  Boxes,
  SlidersHorizontal,
  TriangleAlert,
  Building2,
  PackageSearch,
  Sparkles,
  Warehouse,
  Shirt,
  Droplets,
  RotateCcw,
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

function kindIcon(kind: LocationKind) {
  if (kind === LocationKind.VENDOR) return <Warehouse className="h-4 w-4" />;
  if (kind === LocationKind.CLEAN_STORE) return <Shirt className="h-4 w-4" />;
  if (kind === LocationKind.SOILED_STORE)
    return <Droplets className="h-4 w-4" />;
  return <Sparkles className="h-4 w-4" />;
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

  if (!res.ok) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-violet-50/60 to-background dark:from-violet-950/20">
        <div className="mx-auto w-full max-w-2xl p-3">
          <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 text-sm backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
            Failed to load.
          </Card>
        </div>
      </div>
    );
  }

  const negativeCount = res.rows.filter((r) => r.isNegative).length;

  const activeFiltersCount =
    Number(Boolean(condition)) +
    Number(Boolean(linenItemId)) +
    Number(Boolean(locationKind));

  const currentPropertyName = propertyId
    ? properties.find((p) => p.id === propertyId)?.name
    : undefined;

  const selectedItemName = linenItemId
    ? linenItems.find((i) => i.id === linenItemId)?.name ?? "Item"
    : undefined;

  const hasAnyData = res.rows.length > 0;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-violet-50/60 to-background dark:from-violet-950/20">
      <div className="mx-auto w-full max-w-2xl p-3 pb-8">
        {/* Header */}
        <Card className="rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                    <Boxes className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">
                      Stock Snapshot
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Balances = SUM of ledger entries
                    </div>
                  </div>
                </div>

                {/* Chips */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {currentPropertyName ? (
                    <Badge
                      variant="secondary"
                      className="rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                    >
                      <Building2 className="mr-1 h-4 w-4 text-violet-700 dark:text-violet-200" />
                      {currentPropertyName}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="rounded-2xl border-violet-200/60 dark:border-violet-500/15"
                    >
                      <TriangleAlert className="mr-1 h-4 w-4" />
                      Select property
                    </Badge>
                  )}

                  <Badge
                    variant="secondary"
                    className="rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                  >
                    <span className="mr-1 inline-flex items-center text-violet-700 dark:text-violet-200">
                      {kindIcon(locationKind)}
                    </span>
                    {labelEnum(locationKind)}
                  </Badge>

                  {condition ? (
                    <Badge
                      variant="secondary"
                      className="rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                    >
                      {labelEnum(condition)}
                    </Badge>
                  ) : null}

                  {selectedItemName ? (
                    <Badge
                      variant="secondary"
                      className="rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                    >
                      <PackageSearch className="mr-1 h-4 w-4 text-violet-700 dark:text-violet-200" />
                      {selectedItemName}
                    </Badge>
                  ) : null}

                  {negativeCount > 0 ? (
                    <Badge variant="destructive" className="rounded-2xl">
                      <TriangleAlert className="mr-1 h-4 w-4" />
                      {negativeCount} negative
                    </Badge>
                  ) : null}
                </div>
              </div>

              {/* Actions */}
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
                      placeholder: "Select property",
                    },
                    {
                      key: "locationKind",
                      label: "Location",
                      type: "select",
                      options: Object.values(LocationKind).map((k) => ({
                        value: k,
                        label: labelEnum(k),
                      })),
                      placeholder: "Select location",
                    },
                    {
                      key: "condition",
                      label: "Condition",
                      type: "select",
                      options: Object.values(LinenCondition).map((c) => ({
                        value: c,
                        label: labelEnum(c),
                      })),
                      placeholder: "All conditions",
                    },
                    {
                      key: "linenItemId",
                      label: "Item",
                      type: "select",
                      options: linenItems.map((i) => ({
                        value: i.id,
                        label: i.name,
                      })),
                      placeholder: "All items",
                    },
                  ]}
                />
              </div>
            </div>

            {/* Mobile property picker */}
            {properties.length > 1 ? (
              <div className="mt-4">
                <PropertyPicker
                  properties={properties}
                  selectedPropertyId={propertyId}
                />
              </div>
            ) : null}

            {/* Reset tip row */}
            {propertyId && activeFiltersCount > 0 ? (
              <>
                <Separator className="my-4 opacity-60" />
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    Default view is{" "}
                    <span className="font-medium text-foreground">Vendor</span>{" "}
                    (in laundry).
                  </div>
                  <Button
                    asChild
                    variant="secondary"
                    className="h-11 rounded-2xl border border-violet-200/60 bg-white/60 px-4 backdrop-blur-[2px] hover:bg-violet-600/10 dark:border-violet-500/15 dark:bg-zinc-950/40 dark:hover:bg-violet-500/10"
                  >
                    <Link href={`${BASE_PATH}?propertyId=${propertyId}`}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset
                    </Link>
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </Card>

        {/* Body */}
        <div className="mt-3">
          {!propertyId ? (
            <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-5 text-sm text-muted-foreground backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                  <TriangleAlert className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    Pick a property
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Stock snapshot needs a property first.
                  </div>
                </div>
              </div>
            </Card>
          ) : !hasAnyData ? (
            <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-5 text-sm text-muted-foreground backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    No rows
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    No balances match your current filters.
                  </div>
                  <div className="mt-3">
                    <Button
                      asChild
                      variant="secondary"
                      className="h-12 rounded-2xl border border-violet-200/60 bg-white/60 px-4 backdrop-blur-[2px] hover:bg-violet-600/10 dark:border-violet-500/15 dark:bg-zinc-950/40 dark:hover:bg-violet-500/10"
                    >
                      <Link href={`${BASE_PATH}?propertyId=${propertyId}`}>
                        <RotateCcw className="mr-2 h-5 w-5" />
                        Reset filters
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <BalanceTable rows={res.rows} />
          )}
        </div>
      </div>
    </div>
  );
}
