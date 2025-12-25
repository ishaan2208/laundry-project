import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TxnType, UserRole } from "@prisma/client";
import { getTransactions } from "@/actions/reports/getTransactions";
import { TxnListItem } from "@/components/reports/TxnListItem";
import { ReportFiltersSheet } from "@/components/reports/ReportFiltersSheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ListChecks,
  SlidersHorizontal,
  ArrowDown,
  Building2,
  Truck,
  Tag,
  CalendarRange,
} from "lucide-react";

function humanType(t: TxnType) {
  return t.replaceAll("_", " ");
}

export default async function TxnsPage({
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
  const type = typeof sp.type === "string" ? (sp.type as TxnType) : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const from = typeof sp.from === "string" ? sp.from : undefined;
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
    redirect(`/app/txns?propertyId=${properties[0].id}`);
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

  if (!res.ok) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-violet-50/60 to-background dark:from-violet-950/20">
        <div className="mx-auto w-full max-w-2xl p-3">
          <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 text-sm backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
            {res.message ?? "Failed to load."}
          </Card>
        </div>
      </div>
    );
  }

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
        return `/app/txns?${params.toString()}`;
      })()
    : null;

  const activePills: Array<{ icon: React.ReactNode; text: string }> = [];
  const propName = propertyId
    ? properties.find((p) => p.id === propertyId)?.name
    : undefined;
  const vendorName = vendorId
    ? vendors.find((v) => v.id === vendorId)?.name
    : undefined;

  if (propName)
    activePills.push({
      icon: <Building2 className="h-4 w-4" />,
      text: propName,
    });
  if (vendorName)
    activePills.push({ icon: <Truck className="h-4 w-4" />, text: vendorName });
  if (type)
    activePills.push({
      icon: <Tag className="h-4 w-4" />,
      text: humanType(type),
    });
  if (from || to)
    activePills.push({
      icon: <CalendarRange className="h-4 w-4" />,
      text: `${from ?? "…"} → ${to ?? "…"}`,
    });
  if (includeVoided)
    activePills.push({
      icon: <ArrowDown className="h-4 w-4" />,
      text: "Including voided",
    });

  return (
    <div className="min-h-dvh bg-gradient-to-b from-violet-50/60 to-background dark:from-violet-950/20">
      <div className="mx-auto w-full max-w-2xl p-3 pb-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                <ListChecks className="h-5 w-5" />
              </span>
              <div>
                <div className="text-lg font-semibold leading-tight">
                  Transactions
                </div>
                <div className="text-xs text-muted-foreground">
                  Searchable, filterable audit log
                </div>
              </div>
            </div>
          </div>

          <ReportFiltersSheet
            title="Log Filters"
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
                placeholder: "All properties",
              },
              {
                key: "vendorId",
                label: "Vendor",
                type: "select",
                options: vendors.map((v) => ({ value: v.id, label: v.name })),
                placeholder: "All vendors",
              },
              {
                key: "type",
                label: "Type",
                type: "select",
                options: Object.values(TxnType).map((t) => ({
                  value: t,
                  label: humanType(t),
                })),
                placeholder: "All types",
              },
              {
                key: "from",
                label: "From date",
                type: "date",
              },
              {
                key: "to",
                label: "To date",
                type: "date",
              },
              {
                key: "includeVoided",
                label: "Include voided",
                type: "switch", // ✅ upgraded
              },
              {
                key: "q",
                label: "Search (optional)",
                type: "text",
                placeholder: "Reference / note",
              },
            ]}
          />
        </div>

        {/* Active filter pills */}
        {activePills.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {activePills.map((p, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="rounded-2xl border border-violet-200/60 bg-white/60 text-xs backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
              >
                <span className="mr-1 inline-flex items-center text-violet-700 dark:text-violet-200">
                  {p.icon}
                </span>
                {p.text}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="mt-3 text-xs text-muted-foreground">
            Tip: use{" "}
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            </span>{" "}
            to narrow results.
          </div>
        )}

        {/* List */}
        <div className="mt-3 grid gap-2">
          {res.rows.length ? (
            res.rows.map((r) => <TxnListItem key={r.id} row={r} />)
          ) : (
            <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-5 text-sm text-muted-foreground backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
              No transactions for current filters.
            </Card>
          )}
        </div>

        {/* Load more */}
        {nextHref ? (
          <div className="mt-4">
            <Button
              asChild
              variant="secondary"
              className="h-14 w-full rounded-2xl border border-violet-200/60 bg-white/60 text-base font-semibold backdrop-blur-[2px] hover:bg-violet-600/10 dark:border-violet-500/15 dark:bg-zinc-950/40 dark:hover:bg-violet-500/10"
            >
              <Link href={nextHref}>
                <ArrowDown className="mr-2 h-5 w-5" />
                Load more
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
