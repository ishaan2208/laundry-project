"use client";

import * as React from "react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { Sparkles, Building2, Info } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { fadeUp, fade } from "@/components/motion/variants";

import { QuickActions } from "@/components/dashboard/QuickActions";
import { TodayTiles } from "@/components/dashboard/TodayTiles";
import { VendorPendingTop } from "@/components/dashboard/VendorPendingTop";
import {
  PropertySelector,
  type PropertyLite,
} from "@/components/dashboard/PropertySelector";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { EmptyStateNoProperty } from "@/components/dashboard/EmptyStateNoProperty";

import type { DashboardSummary } from "@/actions/reports/getDashboardSummary";
import type { VendorPendingTopRow } from "@/actions/reports/getTopVendorPending";

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold tracking-tight">{title}</div>
        {hint ? (
          <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
        ) : null}
      </div>
    </div>
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
  const reduceMotion = useReducedMotion();
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } },
  };

  if (showNoPropertyAssigned) {
    return <EmptyStateNoProperty />;
  }

  const needsProperty = properties.length > 1 && !selectedPropertyId;

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {/* Header */}
        <m.div
          variants={fade}
          transition={{ duration: reduceMotion ? 0 : 0.16 }}
        >
          <GlassCard className="">
            <div className="flex items-start justify-between gap-1 px-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold leading-tight">
                      Zenvana
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Laundry Dashboard
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {selectedProperty ? (
                    <>
                      Property:{" "}
                      <span className="font-medium text-foreground truncate">
                        {selectedProperty.name}
                      </span>
                    </>
                  ) : (
                    <>Select a property to see pending & today totals</>
                  )}
                </div>

                <div>
                  <Badge
                    variant="secondary"
                    className="mt-2 border border-white/15 bg-white/50 text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                  >
                    {isAdmin ? "Admin" : "Housekeeping"}
                  </Badge>
                </div>

                {needsProperty ? (
                  <div className="mt-2 flex items-start gap-2 rounded-2xl border border-white/15 bg-white/40 px-3 py-2 text-xs text-muted-foreground backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                    <Info className="mt-0.5 h-4 w-4 text-fuchsia-300" />
                    <div>
                      Choose a property to load today totals and vendor pending.
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col items-end gap-2">
                {/* Selector only if >1 properties */}
                {properties.length > 1 ? (
                  <PropertySelector
                    properties={properties}
                    selectedPropertyId={selectedPropertyId}
                  />
                ) : null}
                <LogoutButton />
              </div>
            </div>
          </GlassCard>
        </m.div>

        {/* Quick Actions */}
        <m.div
          variants={fadeUp}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
        >
          <SectionTitle
            title="Quick actions"
            hint="Fast entry for daily operations"
          />
          <div className="mt-3">
            <QuickActions propertyId={selectedPropertyId} isAdmin={isAdmin} />
          </div>
        </m.div>

        <Separator className="bg-white/20 dark:bg-white/10" />

        {/* Pending */}
        <m.div
          variants={fadeUp}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
        >
          <SectionTitle
            title="Pending"
            hint="What’s currently with laundry vendors"
          />
          <div className="mt-3">
            <VendorPendingTop
              propertyId={selectedPropertyId}
              rows={topVendors}
              needsProperty={needsProperty}
            />
          </div>
        </m.div>

        <Separator className="bg-white/20 dark:bg-white/10" />

        {/* Today */}
        <m.div
          variants={fadeUp}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
        >
          <SectionTitle title="Today" hint="Totals for the selected property" />
          <div className="mt-3">
            <TodayTiles summary={summary} needsProperty={needsProperty} />
          </div>
        </m.div>
      </m.div>
    </LazyMotion>
  );
}
