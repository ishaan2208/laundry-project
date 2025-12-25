// src/components/dashboard/DashboardShell.tsx
"use client";

import * as React from "react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { Sparkles, Building2, Info, ShieldCheck, User2 } from "lucide-react";

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

function SectionTitle({
  title,
  hint,
  icon: Icon,
}: {
  title: string;
  hint?: string;
  icon?: any;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon ? (
            <span className="grid h-8 w-8 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
              <Icon className="h-4.5 w-4.5" />
            </span>
          ) : null}
          <div className="text-sm font-semibold tracking-tight">{title}</div>
        </div>
        {hint ? (
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
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

  if (showNoPropertyAssigned) return <EmptyStateNoProperty />;

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
          <GlassCard className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold leading-tight">
                      Zenvana
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Dashboard
                    </div>
                  </div>
                </div>

                {/* <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {selectedProperty ? (
                    <>
                      Property:{" "}
                      <span className="truncate font-medium text-foreground">
                        {selectedProperty.name}
                      </span>
                    </>
                  ) : (
                    <>Select a property to see pending & today totals</>
                  )}
                </div> */}

                <div className="mt-2 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-2xl border border-violet-200/60 bg-white/60 text-xs backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                  >
                    {isAdmin ? (
                      <>
                        <ShieldCheck className="mr-1 h-4 w-4 text-violet-700 dark:text-violet-200" />
                        Admin
                      </>
                    ) : (
                      <>
                        <User2 className="mr-1 h-4 w-4 text-violet-700 dark:text-violet-200" />
                        Housekeeping
                      </>
                    )}
                  </Badge>
                </div>

                {/* {needsProperty ? (
                  <div className="mt-3 flex items-start gap-2 rounded-3xl border border-violet-200/60 bg-white/60 px-3 py-3 text-xs text-muted-foreground backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
                    <Info className="mt-0.5 h-4 w-4 text-violet-600 dark:text-violet-300" />
                    <div>
                      Choose a property
                      <span className="text-foreground">
                        Today totals
                      </span> and{" "}
                      <span className="text-foreground">Vendor pending</span>.
                    </div>
                  </div>
                ) : null} */}
              </div>

              <div className="flex flex-col items-end gap-2">
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
            icon={Sparkles}
          />
          <div className="mt-3">
            <QuickActions propertyId={selectedPropertyId} isAdmin={isAdmin} />
          </div>
        </m.div>

        <Separator className="bg-violet-200/40 dark:bg-violet-500/15" />

        {/* Pending */}
        <m.div
          variants={fadeUp}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
        >
          <SectionTitle
            title="Pending"
            hint="What’s currently with laundry vendors"
            icon={Building2}
          />
          <div className="mt-3">
            <VendorPendingTop
              propertyId={selectedPropertyId}
              rows={topVendors}
              needsProperty={needsProperty}
            />
          </div>
        </m.div>

        <Separator className="bg-violet-200/40 dark:bg-violet-500/15" />

        {/* Today */}
        <m.div
          variants={fadeUp}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
        >
          <SectionTitle
            title="Today"
            hint="Totals for the selected property"
            icon={Sparkles}
          />
          <div className="mt-3">
            <TodayTiles summary={summary} needsProperty={needsProperty} />
          </div>
        </m.div>
      </m.div>
    </LazyMotion>
  );
}
