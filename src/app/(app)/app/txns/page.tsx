import { prisma } from "@/lib/db";
import { isAdmin, requireUser } from "@/lib/auth";
import { TxnType, UserRole } from "@/generated/prisma";
import { getTransactions } from "@/actions/reports/getTransactions";
import { ReportFiltersSheet } from "@/components/reports/ReportFiltersSheet";
import PropertyPicker from "@/components/reports/PropertyPicker";
import { PageHeader } from "@/components/mobile/PageHeader";
import { HelpNote } from "@/components/mobile/HelpNote";
import { RememberProperty } from "@/components/RememberProperty";
import { resolvePropertyId } from "@/lib/propertyPref.server";
import { TxnListItemExpandable } from "@/components/reports/TxnListItemExpandable";
import { txnLabel } from "@/lib/txnLabels";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

import {
  format,
  isToday,
  isYesterday,
  parse,
  startOfDay,
  compareDesc,
} from "date-fns";
import { ArrowDown } from "lucide-react";

const BASE = "/app/txns";

function dateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function labelForDateKey(key: string) {
  const d = parse(key, "yyyy-MM-dd", new Date());
  if (isToday(d)) return `Today, ${format(d, "d MMM")}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, "d MMM")}`;
  return format(d, "EEE, d MMM");
}

/** Quick views staff actually ask for; everything else lives in Filters. */
const quickViews: { key: string; label: string; type?: TxnType }[] = [
  { key: "all", label: "All" },
  { key: "sent", label: "Sent", type: TxnType.DISPATCH_TO_LAUNDRY },
  { key: "received", label: "Received", type: TxnType.RECEIVE_FROM_LAUNDRY },
  { key: "removed", label: "Thrown away", type: TxnType.DISCARD_LOST },
];

export default async function TxnsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const admin = isAdmin(user);

  const sp = (await searchParams) as Record<
    string,
    string | string[] | undefined
  >;

  const propertyIdParam =
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

  const propertyId = await resolvePropertyId(propertyIdParam, properties);

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
      <div className="min-h-dvh bg-background">
        <PageHeader title="Register" back={false} />
        <div className="mx-auto w-full max-w-md px-4 pt-4">
          <div className="surface rounded-2xl p-5 text-center text-sm text-muted-foreground">
            {res.message ?? "Could not load the register."}
          </div>
        </div>
      </div>
    );
  }

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

  const baseParams = () => {
    const params = new URLSearchParams();
    if (propertyId) params.set("propertyId", propertyId);
    if (vendorId) params.set("vendorId", vendorId);
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (includeVoided) params.set("includeVoided", "1");
    return params;
  };

  const nextHref = res.nextCursor
    ? (() => {
        const params = baseParams();
        if (type) params.set("type", type);
        params.set("cursor", res.nextCursor);
        return `${BASE}?${params.toString()}`;
      })()
    : null;

  const viewHref = (t?: TxnType) => {
    const params = baseParams();
    if (t) params.set("type", t);
    return `${BASE}?${params.toString()}`;
  };

  const activeView =
    quickViews.find((v) => v.type === type)?.key ??
    (type ? "other" : "all");

  // Group by day so the register reads like a diary.
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
    <div className="min-h-dvh bg-background pb-6">
      <RememberProperty propertyId={propertyId} />
      <PageHeader
        title="Register"
        subtitle="Every entry, newest first"
        back={false}
        right={
          <ReportFiltersSheet
            title="Register filters"
            buttonLabel="Filters"
            fields={[
              {
                key: "propertyId",
                label: "Hotel",
                type: "select",
                options: properties.map((p) => ({
                  value: p.id,
                  label: p.name,
                })),
                placeholder: "All hotels",
              },
              {
                key: "vendorId",
                label: "Laundry",
                type: "select",
                options: vendorsForFilter.map((v) => ({
                  value: v.id,
                  label: v.name,
                })),
                placeholder: "All laundries",
              },
              {
                key: "type",
                label: "Entry type",
                type: "select",
                options: Object.values(TxnType).map((t) => ({
                  value: t,
                  label: txnLabel(t),
                })),
                placeholder: "All types",
              },
              { key: "from", label: "From date", type: "date" },
              { key: "to", label: "To date", type: "date" },
              {
                key: "includeVoided",
                label: "Show cancelled entries",
                type: "switch",
              },
              {
                key: "q",
                label: "Search notes",
                type: "text",
                placeholder: "Reference or note",
              },
            ]}
          />
        }
      />

      <main className="mx-auto w-full max-w-md space-y-4 px-4 pt-4">
        {properties.length > 1 ? (
          <PropertyPicker
            properties={properties}
            selectedPropertyId={propertyId}
          />
        ) : null}

        {/* Quick views */}
        <nav
          aria-label="Entry type"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {quickViews.map((v) => {
            const active = activeView === v.key;
            return (
              <Link
                key={v.key}
                href={viewHref(v.type)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "press inline-flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap",
                  active
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "bg-card text-foreground"
                )}
              >
                {v.label}
              </Link>
            );
          })}
        </nav>

        <HelpNote>
          Every save becomes one entry here, newest on top. Tap an entry to
          see what moved. Mistakes are never erased — they are cancelled and
          corrected, so the full story stays.
        </HelpNote>

        {dateKeys.length ? (
          <div className="space-y-5">
            {dateKeys.map((k) => {
              const rows = map.get(k)!;
              return (
                <section key={k} aria-label={labelForDateKey(k)}>
                  <h2 className="px-1 pb-2 text-sm font-bold text-muted-foreground">
                    {labelForDateKey(k)}
                  </h2>
                  <div className="space-y-2">
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
            })}
          </div>
        ) : (
          <div className="surface rounded-2xl p-6 text-center">
            <p className="text-base font-semibold">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Entries appear here the moment anyone sends, receives, or counts
              linen.
            </p>
          </div>
        )}

        {nextHref ? (
          <Button asChild variant="secondary" size="xl" className="w-full">
            <Link href={nextHref}>
              <ArrowDown className="size-5" />
              Show older entries
            </Link>
          </Button>
        ) : null}
      </main>
    </div>
  );
}
