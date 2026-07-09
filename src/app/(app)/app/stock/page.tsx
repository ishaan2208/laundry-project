// src/app/app/stock/page.tsx — the "Linen" tab: how much do we own, and where is it?
import { prisma } from "@/lib/db";
import { requireUser, isAdmin } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";
import { getStockOverview } from "@/actions/reports/getStockOverview";
import PropertyPicker from "@/components/reports/PropertyPicker";
import { PageHeader } from "@/components/mobile/PageHeader";
import { HelpNote } from "@/components/mobile/HelpNote";
import { RememberProperty } from "@/components/RememberProperty";
import { resolvePropertyId } from "@/lib/propertyPref.server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ClipboardList,
  History,
  ChevronRight,
  TriangleAlert,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function StockPage({
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

  const res = propertyId
    ? await getStockOverview({ propertyId })
    : null;

  const overview = res?.ok ? res.data : null;
  const admin = isAdmin(user);

  // A hotel that never set up its linen has no real total, so any "with you"
  // figure is just leftover send/receive noise (often negative). Don't show
  // those numbers — guide them to set a starting count instead.
  const notSetUp = !!overview && overview.totals.total <= 0;

  return (
    <div className="min-h-dvh bg-background pb-6">
      <RememberProperty propertyId={propertyId} />
      <PageHeader
        title="Linen"
        subtitle={currentPropertyName ?? "How much you own, and where it is"}
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
        ) : !overview ? (
          <div className="surface rounded-2xl p-5 text-center text-sm text-muted-foreground">
            {res && !res.ok ? res.message : "Could not load linen numbers."}
          </div>
        ) : (
          <>
            {notSetUp ? (
              <section className="surface rounded-2xl p-6 text-center">
                <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
                  <Boxes className="size-6" />
                </div>
                <p className="text-base font-semibold">No starting count yet</p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                  This hotel hasn&apos;t set up how much linen it owns.{" "}
                  {admin
                    ? "Do a Fresh start to count what's really here. After that, sends and receives keep it accurate."
                    : "Ask your admin to set it up. After that, your sends and receives keep it accurate."}
                </p>
                {overview.totals.atLaundry > 0 ? (
                  <p className="mx-auto mt-3 max-w-xs rounded-xl bg-soiled-soft px-3 py-2 text-sm text-soiled">
                    So far, {overview.totals.atLaundry} pieces have been sent to
                    the laundry and not brought back.
                  </p>
                ) : null}
                {admin ? (
                  <Button asChild size="lg" className="mt-4">
                    <Link href="/admin/closing">Do a Fresh start</Link>
                  </Button>
                ) : null}
              </section>
            ) : (
              <>
                <HelpNote>
                  Every piece of linen is either <strong>with you</strong> at
                  the hotel or <strong>at the laundry</strong>. Add them up and
                  that is your total. These numbers come straight from what
                  staff send and receive.
                </HelpNote>

                {overview.hasIssue ? (
              <HelpNote tone="warn">
                Some numbers have gone below zero, which is impossible.{" "}
                {admin
                  ? "Do a Fresh start (in Admin) to count what's real and fix it."
                  : "Tell your admin — they can fix it with a Fresh start."}
              </HelpNote>
            ) : null}

            {/* Headline: total split into the two states */}
            <section className="surface rounded-2xl p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-bold">Total linen</h2>
                <div className="flex items-baseline gap-1.5">
                  <span
                    data-numeric
                    className="text-3xl font-bold tracking-tight"
                  >
                    {overview.totals.total}
                  </span>
                  <span className="text-sm text-muted-foreground">pieces</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div
                  className={cn(
                    "rounded-xl px-3.5 py-3",
                    overview.totals.inStock < 0
                      ? "bg-damaged-soft"
                      : "bg-clean-soft"
                  )}
                >
                  <div
                    className={cn(
                      "text-sm font-medium",
                      overview.totals.inStock < 0 ? "text-damaged" : "text-clean"
                    )}
                  >
                    With you
                  </div>
                  <div
                    data-numeric
                    className={cn(
                      "mt-0.5 text-2xl font-bold",
                      overview.totals.inStock < 0 ? "text-damaged" : "text-clean"
                    )}
                  >
                    {overview.totals.inStock}
                  </div>
                  <div
                    className={cn(
                      "text-xs",
                      overview.totals.inStock < 0
                        ? "text-damaged/80"
                        : "text-clean/80"
                    )}
                  >
                    at the hotel
                  </div>
                </div>
                <div
                  className={cn(
                    "rounded-xl px-3.5 py-3",
                    overview.totals.atLaundry < 0
                      ? "bg-damaged-soft"
                      : "bg-soiled-soft"
                  )}
                >
                  <div
                    className={cn(
                      "text-sm font-medium",
                      overview.totals.atLaundry < 0
                        ? "text-damaged"
                        : "text-soiled"
                    )}
                  >
                    At the laundry
                  </div>
                  <div
                    data-numeric
                    className={cn(
                      "mt-0.5 text-2xl font-bold",
                      overview.totals.atLaundry < 0
                        ? "text-damaged"
                        : "text-soiled"
                    )}
                  >
                    {overview.totals.atLaundry}
                  </div>
                  <div
                    className={cn(
                      "text-xs",
                      overview.totals.atLaundry < 0
                        ? "text-damaged/80"
                        : "text-soiled/80"
                    )}
                  >
                    out for washing
                  </div>
                </div>
              </div>
            </section>

            {/* Per-item breakdown */}
            <section aria-label="Every item" className="surface rounded-2xl">
              <h2 className="px-4 pb-1 pt-4 text-base font-bold">
                Every item
              </h2>
              {overview.items.length === 0 ? (
                <p className="px-4 pb-4 pt-2 text-center text-sm text-muted-foreground">
                  No linen recorded yet.
                </p>
              ) : (
                <ul className="divide-y divide-border border-t">
                  {overview.items.map((it) => {
                    const bad = it.inStock < 0 || it.atLaundry < 0;
                    return (
                      <li
                        key={it.linenItemId}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-base font-medium">
                            {it.name}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <span
                              className={cn(it.inStock < 0 && "text-damaged")}
                            >
                              With you {it.inStock}
                            </span>
                            <span aria-hidden>·</span>
                            <span
                              className={cn(it.atLaundry < 0 && "text-damaged")}
                            >
                              Laundry {it.atLaundry}
                            </span>
                          </div>
                          {bad ? (
                            <div className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium text-damaged">
                              <TriangleAlert className="size-4" />
                              Below zero — tell your admin
                            </div>
                          ) : null}
                        </div>
                        <span data-numeric className="text-lg font-bold">
                          {it.total}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
              </>
            )}

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
                    Check real stock against these numbers
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
