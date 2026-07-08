"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ClipboardList,
  ChevronRight,
  Settings2,
} from "lucide-react";

import { TodayCard } from "@/components/dashboard/TodayTiles";
import { PendingCard } from "@/components/dashboard/VendorPendingTop";
import {
  PropertySelector,
  type PropertyLite,
} from "@/components/dashboard/PropertySelector";
import { AccountDrawer } from "@/components/dashboard/AccountDrawer";
import { EmptyStateNoProperty } from "@/components/dashboard/EmptyStateNoProperty";

import type { DashboardSummary } from "@/actions/reports/getDashboardSummary";
import type { VendorPendingTopRow } from "@/actions/reports/getTopVendorPending";
import { cn } from "@/lib/utils";

/** Big, single-purpose entry point for a daily task. */
function HeroAction(props: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "soiled" | "clean";
}) {
  const Icon = props.icon;
  return (
    <Link
      href={props.href}
      className={cn(
        "surface press flex items-center gap-4 rounded-2xl p-4",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      )}
    >
      <span
        className={cn(
          "grid size-14 shrink-0 place-items-center rounded-2xl text-white",
          props.tone === "soiled" ? "bg-soiled" : "bg-clean"
        )}
      >
        <Icon className="size-7" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold leading-tight">
          {props.title}
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">
          {props.subtitle}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

/** Quiet full-width link row for secondary destinations. */
function LinkRow(props: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const Icon = props.icon;
  return (
    <Link
      href={props.href}
      className={cn(
        "surface press flex min-h-16 items-center gap-3 rounded-2xl px-4 py-3",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      )}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold leading-tight">
          {props.title}
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">
          {props.subtitle}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export default function DashboardShell({
  isAdmin,
  properties,
  selectedPropertyId,
  selectedProperty,
  summary,
  topVendors,
  showNoPropertyAssigned,
}: {
  isAdmin: boolean;
  properties: PropertyLite[];
  selectedPropertyId?: string;
  selectedProperty?: PropertyLite;
  summary: DashboardSummary | null;
  topVendors: VendorPendingTopRow[] | null;
  showNoPropertyAssigned?: boolean;
}) {
  if (showNoPropertyAssigned) return <EmptyStateNoProperty />;

  const needsProperty = properties.length > 1 && !selectedPropertyId;

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      {/* Header: where am I, who am I */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="min-w-0">
          <div className="text-sm font-medium text-muted-foreground">
            Zenvana Laundry
          </div>
          {properties.length > 1 ? (
            <PropertySelector
              properties={properties}
              selectedPropertyId={selectedPropertyId}
            />
          ) : (
            <div className="truncate text-xl font-bold tracking-tight">
              {selectedProperty?.name ?? properties[0]?.name ?? "My hotel"}
            </div>
          )}
        </div>
        <AccountDrawer isAdmin={isAdmin} />
      </div>

      {needsProperty ? (
        <div className="surface animate-fade-up rounded-2xl p-5 text-center">
          <p className="text-base font-semibold">Choose your hotel first</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the hotel name above to pick one. Your numbers load after that.
          </p>
        </div>
      ) : (
        <>
          {/* The two jobs staff open this app for */}
          <section aria-label="Daily tasks" className="space-y-3">
            <HeroAction
              href="/app/dispatch"
              title="Send to laundry"
              subtitle="Dirty linen going out"
              icon={ArrowUpRight}
              tone="soiled"
            />
            <HeroAction
              href="/app/receive"
              title="Receive from laundry"
              subtitle="Clean linen coming back"
              icon={ArrowDownLeft}
              tone="clean"
            />
          </section>

          <PendingCard
            propertyId={selectedPropertyId}
            rows={topVendors}
            isAdmin={isAdmin}
          />

          <TodayCard summary={summary} />

          <section className="space-y-3">
            <LinkRow
              href="/app/stock/physical-count"
              title="Count linen"
              subtitle="Check real stock against the book"
              icon={ClipboardList}
            />
            {isAdmin ? (
              <LinkRow
                href="/admin"
                title="Admin tools"
                subtitle="Fresh start, items, laundries, reports"
                icon={Settings2}
              />
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
