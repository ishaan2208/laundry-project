"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { Shirt, ArrowRight, AlertTriangle } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fadeUp } from "@/components/motion/variants";

import type { VendorPendingTopRow } from "@/actions/reports/getTopVendorPending";

export function VendorPendingTop({
  propertyId,
  rows,
  needsProperty,
}: {
  propertyId?: string;
  rows: VendorPendingTopRow[] | null;
  needsProperty: boolean;
}) {
  const reduceMotion = useReducedMotion();

  if (needsProperty) {
    return (
      <GlassCard className="p-4">
        <div className="text-sm font-semibold">
          Select property to load pending
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Pending is calculated from vendor locations for the selected property.
        </div>
      </GlassCard>
    );
  }

  const viewAllHref = propertyId
    ? `/app/vendors?propertyId=${encodeURIComponent(propertyId)}`
    : `/app/vendors`;

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: reduceMotion ? 0 : 0.16 }}
      >
        <GlassCard className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 ring-1 ring-white/15 dark:ring-white/10">
                <Shirt className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <div className="text-sm font-semibold">
                  Pending with laundry
                </div>
                <div className="text-xs text-muted-foreground">
                  Top vendors by pending qty
                </div>
              </div>
            </div>

            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <Separator className="my-3 bg-white/20 dark:bg-white/10" />

          {!rows ? (
            <div className="space-y-2">
              <div className="h-4 w-44 rounded bg-white/40 dark:bg-white/5" />
              <div className="h-4 w-56 rounded bg-white/40 dark:bg-white/5" />
              <div className="h-4 w-48 rounded bg-white/40 dark:bg-white/5" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No pending with vendors.
            </div>
          ) : (
            <div className="flex flex-col">
              {rows.map((r, idx) => {
                const isBad = r.pendingQty < 0;
                return (
                  <div key={r.vendorId}>
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {r.vendorName}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Items currently with vendor
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isBad ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : null}
                        <Badge
                          variant={isBad ? "destructive" : "secondary"}
                          className="tabular-nums border border-white/15 bg-white/55 dark:border-white/10 dark:bg-white/5"
                        >
                          {r.pendingQty}
                        </Badge>
                      </div>
                    </div>
                    {idx !== rows.length - 1 ? (
                      <Separator className="bg-white/20 dark:bg-white/10" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </m.div>
    </LazyMotion>
  );
}
