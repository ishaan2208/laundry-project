import { prisma } from "@/lib/db";
import { requireUser, isAdmin } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";
import { getStockAuditRollup } from "@/actions/reports/getStockAuditRollup";
import { StockAuditTable } from "@/components/reports/StockAuditTable";
import { StockAuditDownloadButton } from "@/components/reports/StockAuditDownloadButton";
import { StockAuditRecordButton } from "@/components/reports/StockAuditRecordButton";
import PropertyPicker from "@/components/reports/PropertyPicker";
import { PageHeader } from "@/components/mobile/PageHeader";
import { RememberProperty } from "@/components/RememberProperty";
import { resolvePropertyId } from "@/lib/propertyPref.server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  TriangleAlert,
  Warehouse,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_PATH = "/app/stock/audit";

function fmtGeneratedAtIST(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function scopeHref(opts: {
  propertyId: string;
  includeVendor: boolean;
  includeDiscarded: boolean;
}) {
  const p = new URLSearchParams();
  p.set("propertyId", opts.propertyId);
  if (!opts.includeVendor) p.set("vendor", "0");
  if (!opts.includeDiscarded) p.set("discarded", "0");
  const q = p.toString();
  return q ? `${BASE_PATH}?${q}` : BASE_PATH;
}

export default async function StockAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const sp = (await searchParams) as Record<
    string,
    string | string[] | undefined
  >;

  const propertyIdParam =
    typeof sp.propertyId === "string" ? sp.propertyId : undefined;

  const includeVendor = sp.vendor !== "0";
  const includeDiscarded = sp.discarded !== "0";

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

  const audit =
    propertyId != null
      ? await getStockAuditRollup({
          propertyId,
          includeVendor,
          includeDiscarded,
        })
      : null;

  const negativeCount =
    audit?.rows.filter((r) => r.totalQty < 0).length ?? 0;

  const admin = isAdmin(user);

  return (
    <div className="min-h-dvh bg-background pb-8">
      <RememberProperty propertyId={propertyId} />
      <PageHeader
        title="Weekly totals"
        subtitle={currentPropertyName ?? "Week-by-week stock history"}
        back={false}
      />

      <main className="mx-auto w-full max-w-2xl space-y-4 px-4 pt-4">
        <section className="surface rounded-2xl p-4">
          {properties.length > 1 ? (
            <div className="mb-4">
              <PropertyPicker
                properties={properties}
                selectedPropertyId={propertyId}
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {currentPropertyName ? null : (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                <TriangleAlert className="size-3.5" />
                Choose a hotel
              </span>
            )}

            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground",
                !includeVendor && "opacity-70"
              )}
            >
              <Warehouse className="size-3.5" />
              {includeVendor ? "Laundry included" : "Laundry excluded"}
            </span>

            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground",
                !includeDiscarded && "opacity-70"
              )}
            >
              <Trash2 className="size-3.5" />
              {includeDiscarded ? "Thrown away / lost included" : "Thrown away / lost excluded"}
            </span>

            {negativeCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-damaged-soft px-2.5 py-1 text-xs font-semibold text-damaged">
                <TriangleAlert className="size-3.5" />
                {negativeCount} below zero
              </span>
            ) : null}
          </div>

          {audit ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Updated {fmtGeneratedAtIST(audit.generatedAt)}. Cancelled entries
              are left out.
              {audit.includeVendor
                ? " Total = at the laundry + on the hotel."
                : " Laundry stock is excluded, so Total is on-hotel stock only."}
            </p>
          ) : null}

          {propertyId ? (
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link
                href={scopeHref({
                  propertyId,
                  includeVendor: !includeVendor,
                  includeDiscarded,
                })}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {includeVendor ? "Exclude laundry stock" : "Include laundry stock"}
              </Link>
              <Link
                href={scopeHref({
                  propertyId,
                  includeVendor,
                  includeDiscarded: !includeDiscarded,
                })}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {includeDiscarded
                  ? "Exclude thrown away / lost"
                  : "Include thrown away / lost"}
              </Link>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary" size="lg">
              <Link href={`/app/stock${propertyId ? `?propertyId=${propertyId}` : ""}`}>
                Linen snapshot
              </Link>
            </Button>
            {audit && currentPropertyName ? (
              <StockAuditDownloadButton
                propertyName={currentPropertyName}
                generatedAtIso={audit.generatedAt}
                includeVendor={audit.includeVendor}
                includeDiscarded={audit.includeDiscarded}
                rows={audit.rows}
              />
            ) : null}
            {admin && propertyId && audit ? (
              <>
                <StockAuditRecordButton
                  propertyId={propertyId}
                  includeVendor={audit.includeVendor}
                  includeDiscarded={audit.includeDiscarded}
                />
                <Button asChild variant="secondary" size="lg">
                  <Link
                    href={`/admin/reports/stock-audit-history?propertyId=${encodeURIComponent(propertyId)}`}
                  >
                    Compare weeks
                  </Link>
                </Button>
              </>
            ) : null}
          </div>
        </section>

        {!propertyId ? (
          <div className="surface rounded-2xl p-5 text-center">
            <p className="text-base font-semibold">Choose your hotel first</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Weekly totals need a hotel to load all linen items and balances.
            </p>
          </div>
        ) : audit ? (
          <StockAuditTable
            rows={audit.rows}
            includeVendor={audit.includeVendor}
            includeDiscarded={audit.includeDiscarded}
          />
        ) : null}
      </main>
    </div>
  );
}
