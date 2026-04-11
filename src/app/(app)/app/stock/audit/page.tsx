import { prisma } from "@/lib/db";
import { requireUser, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma";
import { getStockAuditRollup } from "@/actions/reports/getStockAuditRollup";
import { StockAuditTable } from "@/components/reports/StockAuditTable";
import { StockAuditDownloadButton } from "@/components/reports/StockAuditDownloadButton";
import { StockAuditRecordButton } from "@/components/reports/StockAuditRecordButton";
import PropertyPicker from "@/components/reports/PropertyPicker";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  ClipboardCheck,
  TriangleAlert,
  ArrowLeft,
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

  if (!propertyId && properties.length === 1) {
    redirect(`${BASE_PATH}?propertyId=${properties[0].id}`);
  }

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
    <div className="min-h-dvh bg-gradient-to-b from-violet-50/60 to-background dark:from-violet-950/20">
      <div className="mx-auto w-full max-w-7xl p-3 pb-8">
        <Card className="rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          <div className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                    <ClipboardCheck className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">
                      Weekly stock audit
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Ledger totals by item (voided txns excluded) ·{" "}
                      {audit
                        ? `Generated ${fmtGeneratedAtIST(audit.generatedAt)} IST`
                        : "Select a property"}
                    </div>
                    {audit && audit.includeVendor ? (
                      <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                        With vendor included, each line&apos;s{" "}
                        <span className="font-medium text-foreground">Total</span>{" "}
                        equals{" "}
                        <span className="font-medium text-foreground">Vendor</span>{" "}
                        (in-laundry) plus{" "}
                        <span className="font-medium text-foreground">
                          Non-vendor
                        </span>{" "}
                        (on-property buckets). Physical count approval only posts
                        clean-store adjustments; vendor buckets stay as booked.
                      </p>
                    ) : audit && !audit.includeVendor ? (
                      <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                        Vendor locations are excluded from this view, so{" "}
                        <span className="font-medium text-foreground">Total</span>{" "}
                        is on-property stock only. Use &quot;Include in-laundry
                        (vendor)&quot; to see vendor vs non-vendor columns.
                      </p>
                    ) : null}
                  </div>
                </div>

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
                    className={cn(
                      "rounded-2xl border border-violet-200/60 bg-white/60 dark:border-violet-500/15 dark:bg-zinc-950/40",
                      !includeVendor && "opacity-80"
                    )}
                  >
                    <Warehouse className="mr-1 h-4 w-4" />
                    {includeVendor ? "Vendor included" : "Vendor excluded"}
                  </Badge>

                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-2xl border border-violet-200/60 bg-white/60 dark:border-violet-500/15 dark:bg-zinc-950/40",
                      !includeDiscarded && "opacity-80"
                    )}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    {includeDiscarded
                      ? "Discarded / lost included"
                      : "Discarded / lost excluded"}
                  </Badge>

                  {negativeCount > 0 ? (
                    <Badge variant="destructive" className="rounded-2xl">
                      <TriangleAlert className="mr-1 h-4 w-4" />
                      {negativeCount} negative line(s)
                    </Badge>
                  ) : null}
                </div>

                {propertyId ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="text-muted-foreground">Scope:</span>
                    <Link
                      href={scopeHref({
                        propertyId,
                        includeVendor: !includeVendor,
                        includeDiscarded,
                      })}
                      className="font-medium text-violet-700 underline-offset-4 hover:underline dark:text-violet-300"
                    >
                      {includeVendor
                        ? "Exclude in-laundry (vendor)"
                        : "Include in-laundry (vendor)"}
                    </Link>
                    <span className="text-muted-foreground">·</span>
                    <Link
                      href={scopeHref({
                        propertyId,
                        includeVendor,
                        includeDiscarded: !includeDiscarded,
                      })}
                      className="font-medium text-violet-700 underline-offset-4 hover:underline dark:text-violet-300"
                    >
                      {includeDiscarded
                        ? "Exclude discarded / lost bucket"
                        : "Include discarded / lost bucket"}
                    </Link>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-2xl border-violet-200/60 dark:border-violet-500/15"
                >
                  <Link href={`/app/stock${propertyId ? `?propertyId=${propertyId}` : ""}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Stock snapshot
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
                    <Button
                      asChild
                      variant="outline"
                      className="h-11 rounded-2xl border-violet-200/60 dark:border-violet-500/15"
                    >
                      <Link
                        href={`/admin/reports/stock-audit-history?propertyId=${encodeURIComponent(propertyId)}`}
                      >
                        Audit vs audit report
                      </Link>
                    </Button>
                  </>
                ) : null}
              </div>
            </div>

            {properties.length > 1 ? (
              <>
                <Separator className="my-4 opacity-60" />
                <PropertyPicker
                  properties={properties}
                  selectedPropertyId={propertyId}
                />
              </>
            ) : null}
          </div>
        </Card>

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
                    Weekly audit needs a property to load all active linen items
                    and ledger balances.
                  </div>
                </div>
              </div>
            </Card>
          ) : audit ? (
            <StockAuditTable
              rows={audit.rows}
              includeVendor={audit.includeVendor}
              includeDiscarded={audit.includeDiscarded}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
