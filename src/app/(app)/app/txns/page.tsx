import { prisma } from "@/lib/db";
import { isAdmin, requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TxnType, UserRole } from "@prisma/client";
import { getTransactions } from "@/actions/reports/getTransactions";
import { ReportFiltersSheet } from "@/components/reports/ReportFiltersSheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { TxnListItemExpandable } from "@/components/reports/TxnListItemExpandable";

import {
  format,
  isToday,
  isYesterday,
  parse,
  startOfDay,
  compareDesc,
} from "date-fns";
import {
  ListChecks,
  SlidersHorizontal,
  ArrowDown,
  Building2,
  Truck,
  Tag,
  CalendarRange,
  CalendarDays,
} from "lucide-react";

function humanType(t: TxnType) {
  return t.replaceAll("_", " ");
}

function dateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function labelForDateKey(key: string) {
  const d = parse(key, "yyyy-MM-dd", new Date());
  if (isToday(d)) return `Today · ${format(d, "dd MMM")}`;
  if (isYesterday(d)) return `Yesterday · ${format(d, "dd MMM")}`;
  return format(d, "dd MMM");
}

export default async function TxnsPage({
  searchParams,
}: {
  searchParams:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const user = await requireUser();
  const admin = isAdmin(user);

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

  // Only used for filter dropdown. Names for list are fetched later by ids.
  const vendorsForFilter = propertyId
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

  // Build vendorName map even when propertyId is not selected
  const vendorIds = Array.from(
    new Set(res.rows.map((r: any) => r.vendorId).filter(Boolean))
  ) as string[];

  const vendorNameMap = vendorIds.length
    ? new Map(
        (
          await prisma.vendor.findMany({
            where: { id: { in: vendorIds } },
            select: { id: true, name: true },
          })
        ).map((v) => [v.id, v.name] as const)
      )
    : new Map<string, string>();

  const propertyNameMap = new Map(
    properties.map((p) => [p.id, p.name] as const)
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
        return `/app/txns?${params.toString()}`;
      })()
    : null;

  const activePills: Array<{ icon: React.ReactNode; text: string }> = [];
  const propName = propertyId ? propertyNameMap.get(propertyId) : undefined;

  const vendorName = vendorId
    ? vendorsForFilter.find((v) => v.id === vendorId)?.name ??
      vendorNameMap.get(vendorId)
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

  // --- Group rows by date (occurredAt) ---
  const map = new Map<string, any[]>();
  for (const r of res.rows as any[]) {
    const d =
      r.occurredAt instanceof Date ? r.occurredAt : new Date(r.occurredAt);
    const k = dateKey(d);
    map.set(k, [...(map.get(k) ?? []), r]);
  }

  const dateKeys = Array.from(map.keys()).sort((a, b) => {
    const da = startOfDay(parse(a, "yyyy-MM-dd", new Date()));
    const db = startOfDay(parse(b, "yyyy-MM-dd", new Date()));
    return compareDesc(da, db);
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
                options: vendorsForFilter.map((v) => ({
                  value: v.id,
                  label: v.name,
                })),
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
              { key: "from", label: "From date", type: "date" },
              { key: "to", label: "To date", type: "date" },
              { key: "includeVoided", label: "Include voided", type: "switch" },
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

        {/* Date-wise sections */}
        <div className="mt-3 space-y-4">
          {dateKeys.length ? (
            dateKeys.map((k) => {
              const rows = map.get(k)!;
              return (
                <section key={k} className="space-y-2">
                  <div className="sticky top-2 z-10">
                    <div className="inline-flex items-center gap-2 rounded-2xl border bg-white/70 px-3 py-1.5 text-sm shadow-sm backdrop-blur dark:bg-zinc-950/40">
                      <CalendarDays className="h-4 w-4" />
                      <span className="font-semibold">
                        {labelForDateKey(k)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • {rows.length} txn{rows.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {rows.map((r: any) => (
                      <TxnListItemExpandable
                        key={r.id}
                        admin={admin}
                        row={{
                          id: r.id,
                          type: r.type,
                          occurredAt: r.occurredAt,
                          reference: r.reference,
                          propertyName:
                            propertyNameMap.get(r.propertyId) ?? "Unknown",
                          vendorName: r.vendorId
                            ? vendorNameMap.get(r.vendorId) ?? null
                            : null,
                          voidedAt: r.voidedAt ?? null,
                        }}
                      />
                    ))}
                  </div>
                </section>
              );
            })
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
