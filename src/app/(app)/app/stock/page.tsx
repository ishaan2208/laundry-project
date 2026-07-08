// src/app/app/stock/page.tsx — the "Linen" tab: where is our linen right now?
import { prisma } from "@/lib/db";
import { requireUser, isAdmin } from "@/lib/auth";
import { LocationKind, UserRole } from "@/generated/prisma";
import { getBalances } from "@/actions/reports/getBalances";
import PropertyPicker from "@/components/reports/PropertyPicker";
import { PageHeader } from "@/components/mobile/PageHeader";
import { HelpNote } from "@/components/mobile/HelpNote";
import { RememberProperty } from "@/components/RememberProperty";
import { resolvePropertyId } from "@/lib/propertyPref.server";
import Link from "next/link";
import { ClipboardList, History, ChevronRight, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_PATH = "/app/stock";

/** Staff-language names for the system buckets. */
const buckets: { kind: LocationKind; label: string }[] = [
  { kind: LocationKind.CLEAN_STORE, label: "Ready to use" },
  { kind: LocationKind.SOILED_STORE, label: "To be washed" },
  { kind: LocationKind.VENDOR, label: "At the laundry" },
  { kind: LocationKind.REWASH_BIN, label: "Wash again" },
  { kind: LocationKind.DAMAGED_BIN, label: "Damaged" },
  { kind: LocationKind.DISCARDED_LOST, label: "Thrown away / lost" },
];

function parseKind(v: unknown): LocationKind {
  if (
    typeof v === "string" &&
    (Object.values(LocationKind) as string[]).includes(v)
  ) {
    return v as LocationKind;
  }
  return LocationKind.CLEAN_STORE;
}

export default async function StockPage({
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
  const locationKind = parseKind(sp.locationKind);

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

  const res = propertyId
    ? await getBalances({ propertyId, locationKind })
    : { ok: true as const, rows: [] };

  // One line per item (per vendor for the laundry view), conditions summed.
  type Line = { key: string; name: string; sub?: string; qty: number };
  const lines: Line[] = [];
  if (res.ok) {
    const map = new Map<string, Line>();
    for (const r of res.rows) {
      const key =
        locationKind === LocationKind.VENDOR
          ? `${r.linenItemId}:${r.vendorId ?? ""}`
          : r.linenItemId;
      const existing = map.get(key);
      if (existing) {
        existing.qty += r.qty;
      } else {
        map.set(key, {
          key,
          name: r.linenItemName,
          sub:
            locationKind === LocationKind.VENDOR
              ? r.vendorName ?? undefined
              : undefined,
          qty: r.qty,
        });
      }
    }
    lines.push(
      ...[...map.values()].sort(
        (a, b) => Number(b.qty < 0) - Number(a.qty < 0) || b.qty - a.qty
      )
    );
  }

  const total = lines.reduce((s, l) => s + l.qty, 0);
  const hasNegative = lines.some((l) => l.qty < 0);
  const bucketLabel =
    buckets.find((b) => b.kind === locationKind)?.label ?? "Linen";

  const chipHref = (kind: LocationKind) => {
    const p = new URLSearchParams();
    if (propertyId) p.set("propertyId", propertyId);
    p.set("locationKind", kind);
    return `${BASE_PATH}?${p.toString()}`;
  };

  return (
    <div className="min-h-dvh bg-background pb-6">
      <RememberProperty propertyId={propertyId} />
      <PageHeader
        title="Linen"
        subtitle={currentPropertyName ?? "Where everything is right now"}
        back={false}
      />

      <main className="mx-auto w-full max-w-md space-y-4 px-4 pt-4">
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
              Linen numbers load after you pick one.
            </p>
          </div>
        ) : (
          <>
            {/* Bucket chips: plain words, one tap */}
            <nav
              aria-label="Linen location"
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {buckets.map((b) => {
                const active = b.kind === locationKind;
                return (
                  <Link
                    key={b.kind}
                    href={chipHref(b.kind)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "press inline-flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap",
                      active
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "bg-card text-foreground"
                    )}
                  >
                    {b.label}
                  </Link>
                );
              })}
            </nav>

            <HelpNote>
              Tap a word above to see where the linen is. These numbers add
              themselves up from every entry in the register.
            </HelpNote>

            {hasNegative ? (
              <HelpNote tone="warn">
                A minus number is impossible — some entries went wrong.{" "}
                {isAdmin(user)
                  ? "Fix it with a Fresh start in Admin."
                  : "Tell your admin so they can fix it."}
              </HelpNote>
            ) : null}

            {/* Headline number for this bucket */}
            <section className="surface rounded-2xl p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-bold">{bucketLabel}</h2>
                <div className="flex items-baseline gap-1.5">
                  <span
                    data-numeric
                    className="text-3xl font-bold tracking-tight"
                  >
                    {total}
                  </span>
                  <span className="text-sm text-muted-foreground">pieces</span>
                </div>
              </div>

              {lines.length === 0 ? (
                <p className="pt-3 pb-1 text-center text-sm text-muted-foreground">
                  Nothing here right now.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-border border-t">
                  {lines.map((l) => (
                    <li
                      key={l.key}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-base font-medium">
                          {l.name}
                        </div>
                        {l.sub ? (
                          <div className="truncate text-sm text-muted-foreground">
                            {l.sub}
                          </div>
                        ) : null}
                        {l.qty < 0 ? (
                          <div className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium text-damaged">
                            <TriangleAlert className="size-4" />
                            Below zero — tell your admin
                          </div>
                        ) : null}
                      </div>
                      <span
                        data-numeric
                        className={cn(
                          "text-lg font-bold",
                          l.qty < 0 && "text-damaged"
                        )}
                      >
                        {l.qty}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Related jobs */}
            <div className="space-y-3">
              <Link
                href={`/app/stock/physical-count?propertyId=${encodeURIComponent(propertyId)}`}
                className="surface press flex min-h-16 items-center gap-3 rounded-2xl px-4 py-3"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <ClipboardList className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold">
                    Count linen
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    Check real stock against the book
                  </span>
                </span>
                <ChevronRight className="size-5 text-muted-foreground" />
              </Link>

              <Link
                href={`/app/stock/audit?propertyId=${encodeURIComponent(propertyId)}`}
                className="surface press flex min-h-16 items-center gap-3 rounded-2xl px-4 py-3"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <History className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold">
                    Weekly totals
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    Week-by-week stock history
                  </span>
                </span>
                <ChevronRight className="size-5 text-muted-foreground" />
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
