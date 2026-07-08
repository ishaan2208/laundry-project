import { prisma } from "@/lib/db";
import { requireUser, isAdmin } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";
import { getStockAuditRollup } from "@/actions/reports/getStockAuditRollup";
import { StockAuditTable } from "@/components/reports/StockAuditTable";
import { StockAuditDownloadButton } from "@/components/reports/StockAuditDownloadButton";
import { StockAuditRecordButton } from "@/components/reports/StockAuditRecordButton";
import PropertyPicker from "@/components/reports/PropertyPicker";
import { PageHeader } from "@/components/mobile/PageHeader";
import { HelpNote } from "@/components/mobile/HelpNote";
import { RememberProperty } from "@/components/RememberProperty";
import { resolvePropertyId } from "@/lib/propertyPref.server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";

// Always the same three numbers as the Linen tab: with you + at laundry = total.
// Thrown-away/lost is never counted as stock you have.
const INCLUDE_VENDOR = true;
const INCLUDE_DISCARDED = false;

function fmtGeneratedAtIST(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function StockAuditPage({
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

  const audit =
    propertyId != null
      ? await getStockAuditRollup({
          propertyId,
          includeVendor: INCLUDE_VENDOR,
          includeDiscarded: INCLUDE_DISCARDED,
        })
      : null;

  const negativeCount =
    audit?.rows.filter(
      (r) =>
        r.totalQty < 0 ||
        r.byLocationKind.some((s) => s.qty < 0)
    ).length ?? 0;

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
        {properties.length > 1 ? (
          <PropertyPicker
            properties={properties}
            selectedPropertyId={propertyId}
          />
        ) : null}

        {!propertyId ? (
          <div className="surface rounded-2xl p-5 text-center">
            <p className="text-base font-semibold">Choose your hotel first</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Weekly totals need a hotel to load all linen items and numbers.
            </p>
          </div>
        ) : audit ? (
          <>
            <HelpNote>
              The same three numbers as the Linen tab, for every item: what is{" "}
              <strong>with you</strong>, what is <strong>at the laundry</strong>
              , and the <strong>total</strong>. Updated{" "}
              {fmtGeneratedAtIST(audit.generatedAt)}.
            </HelpNote>

            {negativeCount > 0 ? (
              <HelpNote tone="warn">
                {negativeCount}{" "}
                {negativeCount === 1 ? "item has" : "items have"} a number below
                zero, which is impossible.{" "}
                {admin
                  ? "Do a Fresh start to fix it."
                  : "Tell your admin to fix it."}
              </HelpNote>
            ) : null}

            <StockAuditTable rows={audit.rows} />

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="secondary" size="lg">
                <Link
                  href={`/app/stock${propertyId ? `?propertyId=${propertyId}` : ""}`}
                >
                  Back to Linen
                </Link>
              </Button>
              {currentPropertyName ? (
                <StockAuditDownloadButton
                  propertyName={currentPropertyName}
                  generatedAtIso={audit.generatedAt}
                  includeVendor={audit.includeVendor}
                  includeDiscarded={audit.includeDiscarded}
                  rows={audit.rows}
                />
              ) : null}
              {admin ? (
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
          </>
        ) : (
          <div className="surface rounded-2xl p-5 text-center text-sm text-muted-foreground">
            <TriangleAlert className="mx-auto mb-2 size-5" />
            Could not load weekly totals.
          </div>
        )}
      </main>
    </div>
  );
}
