import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { UserRole, LocationKind } from "@/generated/prisma";
import { getVendorLinenLedger } from "@/actions/reports/getVendorLinenLedger";
import PropertyPicker from "@/components/reports/PropertyPicker";
import { VendorLedgerSearch } from "@/components/reports/VendorLedgerSearch";
import { PageHeader } from "@/components/mobile/PageHeader";
import { RememberProperty } from "@/components/RememberProperty";
import { resolvePropertyId } from "@/lib/propertyPref.server";
import { txnLabel } from "@/lib/txnLabels";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = "/app/vendor-ledger";

function fmt(dt: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(dt);
}

export default async function VendorLedgerPage({
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

  const propertyId = await resolvePropertyId(propertyIdParam, properties);

  // Invalid deep link: drop the bad param, memory takes over.
  if (propertyIdParam && !properties.some((p) => p.id === propertyIdParam)) {
    redirect(BASE);
  }

  const hasAccess = !!propertyId;

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
    <div className="min-h-dvh bg-background pb-6">
      <RememberProperty propertyId={propertyId} />
      <PageHeader
        title="Laundry item history"
        subtitle={currentPropertyName ?? "How much of one item is at the laundry"}
        back={false}
      />

      <main className="mx-auto w-full max-w-2xl space-y-4 px-4 pt-4">
        {properties.length > 1 ? (
          <PropertyPicker
            properties={properties}
            selectedPropertyId={propertyId}
          />
        ) : null}

        <section className="surface rounded-2xl p-4">
          <VendorLedgerSearch
            vendors={vendors}
            linenItems={linenItems}
            selectedVendorId={vendorId}
            selectedLinenItemId={linenItemId}
          />
        </section>

        {!propertyId || !vendorId || !linenItemId ? (
          <div className="surface rounded-2xl p-5 text-center">
            <p className="text-base font-semibold">Choose hotel, laundry, item</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick all three above, then tap Show ledger.
            </p>
          </div>
        ) : ledger && !ledger.ok ? (
          <div className="surface rounded-2xl border-damaged/40 p-5 text-center text-sm text-damaged">
            {ledger.message}
          </div>
        ) : ledger && ledger.ok ? (
          <section className="surface overflow-hidden rounded-2xl">
            <div className="border-b p-4">
              <div className="text-base font-bold">
                {ledger.linenItem.name}
              </div>
              <div className="mt-0.5 text-sm text-muted-foreground">
                {ledger.vendor.name} · {ledger.vendorLocationLabel}
                {ledger.linenItem.sku ? ` · SKU ${ledger.linenItem.sku}` : ""}
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-sm text-muted-foreground">
                  Currently at the laundry:
                </span>
                <span data-numeric className="text-lg font-bold">
                  {ledger.currentBalance}
                </span>
              </div>
            </div>

            {ledger.movements.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No entries yet for this item at this laundry.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted text-left">
                      <th className="px-3 py-2 font-semibold">When</th>
                      <th className="px-3 py-2 font-semibold">Entry</th>
                      <th className="px-3 py-2 font-semibold">Ref / note</th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Change
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Balance
                      </th>
                      <th className="w-10 px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.movements.map((m) => (
                      <tr key={m.transactionId} className="border-b last:border-0">
                        <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                          {fmt(m.occurredAt)}
                        </td>
                        <td className="px-3 py-2">{txnLabel(m.type)}</td>
                        <td className="max-w-[200px] truncate px-3 py-2 text-xs text-muted-foreground">
                          {m.reference ?? "—"}
                          {m.note ? ` · ${m.note}` : ""}
                        </td>
                        <td
                          data-numeric
                          className={cn(
                            "px-3 py-2 text-right font-semibold",
                            m.netQty > 0 && "text-clean",
                            m.netQty < 0 && "text-damaged"
                          )}
                        >
                          {m.netQty > 0 ? `+${m.netQty}` : m.netQty}
                        </td>
                        <td
                          data-numeric
                          className="px-3 py-2 text-right font-bold"
                        >
                          {m.balanceAfter}
                        </td>
                        <td className="px-2 py-2">
                          <Link
                            href={`/app/txns/${m.transactionId}`}
                            className="press inline-flex size-8 items-center justify-center rounded-lg text-primary"
                            title="Open entry"
                          >
                            <ExternalLink className="size-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
