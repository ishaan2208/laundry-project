// src/components/dashboard/VendorPendingTop.tsx
"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import {
  Shirt,
  ArrowRight,
  AlertTriangle,
  Truck,
  Sparkles,
} from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { fadeUp } from "@/components/motion/variants";
import { cn } from "@/lib/utils";

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
      <GlassCard className="rounded-3xl border border-violet-200/60 bg-white/60 p-5 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-semibold">
              Select property to load pending
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Pending is calculated from vendor locations for the selected
              property.
            </div>
          </div>
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
        <GlassCard
          className={cn(
            "rounded-3xl border border-violet-200/60 bg-white/60 p-4 backdrop-blur-[2px]",
            "dark:border-violet-500/15 dark:bg-zinc-950/40"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-700 ring-1 ring-violet-200/60 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/15">
                <Truck className="h-5 w-5" />
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

            <Button
              asChild
              variant="secondary"
              className="h-10 rounded-2xl border border-violet-200/60 bg-white/60 px-3 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
            >
              <Link
                href={viewAllHref}
                className="inline-flex items-center gap-1"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <Separator className="my-3 bg-violet-200/40 dark:bg-violet-500/15" />

          {!rows ? (
            <div className="space-y-2">
              <div className="h-4 w-44 rounded bg-black/5 dark:bg-white/5" />
              <div className="h-4 w-56 rounded bg-black/5 dark:bg-white/5" />
              <div className="h-4 w-48 rounded bg-black/5 dark:bg-white/5" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                <Shirt className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  All clear
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  No pending with vendors.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {rows.map((r, idx) => {
                const isBad = r.pendingQty < 0;
                return (
                  <div key={r.vendorId}>
                    <div
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-2xl px-2 py-3",
                        "active:bg-violet-600/5 dark:active:bg-violet-500/10"
                      )}
                    >
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
                          className="rounded-full border border-violet-200/60 bg-white/60 tabular-nums dark:border-violet-500/15 dark:bg-zinc-950/40"
                        >
                          {r.pendingQty}
                        </Badge>
                      </div>
                    </div>

                    {idx !== rows.length - 1 ? (
                      <Separator className="bg-violet-200/40 dark:bg-violet-500/15" />
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
