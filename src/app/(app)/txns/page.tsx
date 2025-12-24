import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TxnType, UserRole } from "@prisma/client";
import { getTransactions } from "@/actions/reports/getTransactions";
import { TxnListItem } from "@/components/reports/TxnListItem";
import { ReportFiltersSheet } from "@/components/reports/ReportFiltersSheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function TxnsPage({
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
  const vendorId = typeof sp.vendorId === "string" ? sp.vendorId : undefined;
  const type = typeof sp.type === "string" ? (sp.type as TxnType) : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const from = typeof sp.from === "string" ? sp.from : undefined; // yyyy-mm-dd ok
  const to = typeof sp.to === "string" ? sp.to : undefined;
  const includeVoided = sp.includeVoided === "1";
  const cursor = typeof sp.cursor === "string" ? sp.cursor : undefined;

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
    redirect(`/txns?propertyId=${properties[0].id}`);
  }

  const vendors = propertyId
    ? await prisma.vendor.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const res = await getTransactions({
    propertyId,
    vendorId,
    type,
    q,
    from,
    to,
    includeVoided,
    cursor,
    take: 25,
  });

  if (!res.ok)
    return (
      <Card className="p-4 text-sm">{res.message ?? "Failed to load."}</Card>
    );

  const nextHref = res.nextCursor
    ? (() => {
        const params = new URLSearchParams();
        if (propertyId) params.set("propertyId", propertyId);
        if (vendorId) params.set("vendorId", vendorId);
        if (type) params.set("type", type);
        if (q) params.set("q", q);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (includeVoided) params.set("includeVoided", "1");
        params.set("cursor", res.nextCursor);
        return `/txns?${params.toString()}`;
      })()
    : null;

  return (
    <div className="mx-auto w-full max-w-2xl p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-lg font-semibold">Transactions</div>
          <div className="text-xs text-muted-foreground">
            Searchable, filterable audit log
          </div>
        </div>

        <ReportFiltersSheet
          title="Log Filters"
          fields={[
            {
              key: "propertyId",
              label: "Property",
              type: "select",
              options: properties.map((p) => ({ value: p.id, label: p.name })),
            },
            {
              key: "vendorId",
              label: "Vendor",
              type: "select",
              options: vendors.map((v) => ({ value: v.id, label: v.name })),
            },
            {
              key: "type",
              label: "Type",
              type: "select",
              options: Object.values(TxnType).map((t) => ({
                value: t,
                label: t.replaceAll("_", " "),
              })),
            },
            {
              key: "q",
              label: "Search",
              type: "text",
              placeholder: "Ref / note",
            },
            { key: "from", label: "From", type: "date" },
            { key: "to", label: "To", type: "date" },
            {
              key: "includeVoided",
              label: "Include voided (use 1)",
              type: "text",
              placeholder: "leave blank or 1",
            },
          ]}
        />
      </div>

      <div className="mt-3 grid gap-2">
        {res.rows.length ? (
          res.rows.map((r) => <TxnListItem key={r.id} row={r} />)
        ) : (
          <Card className="p-4 text-sm text-muted-foreground">
            No transactions for current filters.
          </Card>
        )}
      </div>

      {nextHref ? (
        <div className="mt-4">
          <Button asChild variant="outline" className="w-full">
            <Link href={nextHref}>Load more</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
