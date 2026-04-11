import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { UserRole, LocationKind } from "@/generated/prisma";
import { getVendorLinenLedger } from "@/actions/reports/getVendorLinenLedger";
import PropertyPicker from "@/components/reports/PropertyPicker";
import { VendorLedgerSearch } from "@/components/reports/VendorLedgerSearch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Building2,
  ScrollText,
  TriangleAlert,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = "/app/vendor-ledger";

function fmt(dt: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(dt);
}

function labelType(t: string) {
  return t.replaceAll("_", " ");
}

export default async function VendorLedgerPage({
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
  const vendorId = typeof sp.vendorId === "string" ? sp.vendorId : undefined;
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
    redirect(`${BASE}?propertyId=${encodeURIComponent(properties[0].id)}`);
  }

  const hasAccess =
    !!propertyId && properties.some((p) => p.id === propertyId);
  if (propertyId && !hasAccess) {
    redirect(properties.length === 1 ? `${BASE}?propertyId=${properties[0].id}` : BASE);
  }

  const currentPropertyName = propertyId
    ? properties.find((p) => p.id === propertyId)?.name
    : undefined;

  const vendorLocs =
    propertyId && hasAccess
      ? await prisma.location.findMany({
          where: {
            propertyId,
            kind: LocationKind.VENDOR,
            isActive: true,
            vendorId: { not: null },
          },
          select: {
            vendorId: true,
            vendor: { select: { id: true, name: true } },
          },
          orderBy: { vendor: { name: "asc" } },
        })
      : [];

  const vendorMap = new Map<string, { id: string; name: string }>();
  for (const r of vendorLocs) {
    if (r.vendor) vendorMap.set(r.vendor.id, r.vendor);
  }
  const vendors = [...vendorMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const linenItems = await prisma.linenItem.findMany({
    where: { isActive: true },
    select: { id: true, name: true, sku: true },
    orderBy: { name: "asc" },
  });

  const ledger =
    propertyId && vendorId && linenItemId && hasAccess
      ? await getVendorLinenLedger({
          propertyId,
          vendorId,
          linenItemId,
        })
      : null;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-violet-50/60 to-background dark:from-violet-950/20">
      <div className="mx-auto w-full max-w-4xl p-3 pb-28">
        <Card className="rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          <div className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                    <ScrollText className="h-5 w-5" />
                  </span>
                  <div>
                    <h1 className="text-base font-semibold">
                      Vendor item ledger
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      In-laundry balance for one item: dispatch adds, receive
                      removes · running total after each posting (voided hidden)
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {currentPropertyName ? (
                    <Badge
                      variant="secondary"
                      className="rounded-2xl border border-violet-200/60 bg-white/60 dark:border-violet-500/15 dark:bg-zinc-950/40"
                    >
                      <Building2 className="mr-1 h-4 w-4 text-violet-700 dark:text-violet-200" />
                      {currentPropertyName}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-2xl">
                      <TriangleAlert className="mr-1 h-4 w-4" />
                      Select property
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-2xl"
              >
                <Link href="/app">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
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

            <Separator className="my-4 opacity-60" />

            <VendorLedgerSearch
              vendors={vendors}
              linenItems={linenItems}
              selectedVendorId={vendorId}
              selectedLinenItemId={linenItemId}
            />
          </div>
        </Card>

        <div className="mt-4">
          {!propertyId || !vendorId || !linenItemId ? (
            <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-5 text-sm text-muted-foreground dark:border-violet-500/15 dark:bg-zinc-950/40">
              Pick property, vendor, and linen item, then tap{" "}
              <strong>Show ledger</strong>.
            </Card>
          ) : ledger && !ledger.ok ? (
            <Card className="rounded-3xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
              {ledger.message}
            </Card>
          ) : ledger && ledger.ok ? (
            <Card className="overflow-hidden rounded-3xl border border-violet-200/60 bg-white/60 dark:border-violet-500/15 dark:bg-zinc-950/40">
              <div className="border-b bg-muted/30 px-4 py-3 text-sm">
                <div className="font-medium">{ledger.linenItem.name}</div>
                <div className="text-xs text-muted-foreground">
                  {ledger.vendor.name} · {ledger.vendorLocationLabel}
                  {ledger.linenItem.sku ? ` · SKU ${ledger.linenItem.sku}` : ""}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full">
                    Current at vendor:{" "}
                    <span className="ml-1 font-mono tabular-nums">
                      {ledger.currentBalance}
                    </span>
                  </Badge>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left">
                      <th className="px-3 py-2 font-medium">When (IST)</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium">Ref / note</th>
                      <th className="px-3 py-2 text-right font-medium">Δ qty</th>
                      <th className="px-3 py-2 font-medium">Detail</th>
                      <th className="px-3 py-2 text-right font-medium">
                        Balance
                      </th>
                      <th className="px-3 py-2 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.movements.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-3 py-6 text-center text-muted-foreground"
                        >
                          No movements yet for this item at this vendor.
                        </td>
                      </tr>
                    ) : (
                      ledger.movements.map((m) => (
                        <tr
                          key={m.transactionId}
                          className="border-b last:border-0"
                        >
                          <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                            {fmt(m.occurredAt)}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="rounded-full text-xs font-normal">
                              {labelType(m.type)}
                            </Badge>
                          </td>
                          <td className="max-w-[200px] truncate px-3 py-2 text-xs text-muted-foreground">
                            {m.reference ?? "—"}
                            {m.note ? ` · ${m.note}` : ""}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right font-mono tabular-nums",
                              m.netQty > 0 && "text-emerald-700 dark:text-emerald-400",
                              m.netQty < 0 && "text-destructive"
                            )}
                          >
                            {m.netQty > 0 ? `+${m.netQty}` : m.netQty}
                          </td>
                          <td className="max-w-[220px] px-3 py-2 text-xs text-muted-foreground">
                            {m.summary}
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums font-medium">
                            {m.balanceAfter}
                          </td>
                          <td className="px-2 py-2">
                            <Link
                              href={`/app/txns/${m.transactionId}`}
                              className="inline-flex text-violet-600 hover:underline dark:text-violet-300"
                              title="Open transaction"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
