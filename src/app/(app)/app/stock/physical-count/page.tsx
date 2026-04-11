import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma";
import { computeStockAuditRollupCore } from "@/lib/computeStockAuditRollupCore";
import { PhysicalCountFormClient } from "@/components/physicalCount/PhysicalCountFormClient";
import PropertyPicker from "@/components/reports/PropertyPicker";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  TriangleAlert,
  ArrowLeft,
  Warehouse,
  Trash2,
} from "lucide-react";
const BASE = "/app/stock/physical-count";

function parseBool(v: unknown, def: boolean) {
  if (v === "0") return false;
  if (v === "1") return true;
  return def;
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
  return `${BASE}?${p.toString()}`;
}

export default async function PhysicalCountPage({
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
  const includeVendor = parseBool(sp.vendor, true);
  const includeDiscarded = parseBool(sp.discarded, true);

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
    redirect(`${BASE}?propertyId=${properties[0].id}`);
  }

  const currentPropertyName = propertyId
    ? properties.find((p) => p.id === propertyId)?.name
    : undefined;

  const initialRows =
    propertyId != null
      ? (
          await computeStockAuditRollupCore({
            propertyId,
            includeVendor,
            includeDiscarded,
          })
        ).rows.map((r) => ({
          linenItemId: r.linenItemId,
          name: r.linenItemName,
          sku: r.sku,
          bookQty: r.totalQty,
        }))
      : [];

  return (
    <div className="min-h-dvh bg-gradient-to-b from-violet-50/60 to-background dark:from-violet-950/20">
      <div className="mx-auto w-full max-w-2xl p-3 pb-8">
        <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold">Physical stock count</div>
                <div className="text-xs text-muted-foreground">
                  Submit counted totals for admin approval
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-2xl"
              >
                <Link href={`/app/stock${propertyId ? `?propertyId=${propertyId}` : ""}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Stock
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {currentPropertyName ? (
                <Badge variant="secondary" className="rounded-2xl">
                  <Building2 className="mr-1 h-4 w-4" />
                  {currentPropertyName}
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-2xl">
                  <TriangleAlert className="mr-1 h-4 w-4" />
                  Select property
                </Badge>
              )}
              <Badge variant="secondary" className="rounded-2xl">
                <Warehouse className="mr-1 h-4 w-4" />
                {includeVendor ? "Vendor included" : "Vendor excluded"}
              </Badge>
              <Badge variant="secondary" className="rounded-2xl">
                <Trash2 className="mr-1 h-4 w-4" />
                {includeDiscarded ? "Discarded included" : "Discarded excluded"}
              </Badge>
            </div>

            {propertyId ? (
              <div className="flex flex-wrap gap-2 text-xs">
                <Link
                  href={scopeHref({
                    propertyId,
                    includeVendor: !includeVendor,
                    includeDiscarded,
                  })}
                  className="font-medium text-violet-700 underline-offset-4 hover:underline dark:text-violet-300"
                >
                  {includeVendor ? "Exclude vendor" : "Include vendor"}
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
                  {includeDiscarded ? "Exclude discarded" : "Include discarded"}
                </Link>
              </div>
            ) : null}

            {properties.length > 1 ? (
              <>
                <Separator className="opacity-60" />
                <PropertyPicker
                  properties={properties}
                  selectedPropertyId={propertyId}
                />
              </>
            ) : null}
          </div>
        </Card>

        <div className="mt-4">
          {!propertyId ? (
            <Card className="rounded-3xl border p-5 text-sm text-muted-foreground">
              Choose a property to enter counts.
            </Card>
          ) : (
            <PhysicalCountFormClient
              propertyId={propertyId}
              includeVendor={includeVendor}
              includeDiscarded={includeDiscarded}
              initialRows={initialRows}
            />
          )}
        </div>
      </div>
    </div>
  );
}
