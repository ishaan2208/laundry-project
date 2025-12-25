// src/components/dashboard/TodayTiles.tsx
"use client";

import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Download,
  ShoppingCart,
  Trash2,
  Sparkles,
} from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/components/motion/variants";

import type { DashboardSummary } from "@/actions/reports/getDashboardSummary";

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: any;
}) {
  return (
    <GlassCard
      className={cn(
        "rounded-3xl border border-violet-200/60 bg-white/60 p-4 backdrop-blur-[2px]",
        "dark:border-violet-500/15 dark:bg-zinc-950/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "inline-flex h-11 w-11 items-center justify-center rounded-2xl",
            "bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200",
            "ring-1 ring-violet-200/60 dark:ring-violet-500/15"
          )}
        >
          <Icon className="h-6 w-6" />
        </div>

        <Badge
          variant="secondary"
          className="rounded-full border border-violet-200/60 bg-white/60 text-[11px] backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
        >
          Today
        </Badge>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </GlassCard>
  );
}

export function TodayTiles({
  summary,
  needsProperty,
}: {
  summary: DashboardSummary | null;
  needsProperty: boolean;
}) {
  const reduceMotion = useReducedMotion();

  if (needsProperty) {
    return (
      <GlassCard className="rounded-3xl border border-violet-200/60 bg-white/60 p-5 text-sm backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-semibold">
              Select property to load totals
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Today totals are calculated per property.
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (!summary) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <GlassCard
            key={i}
            className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
          >
            <div className="h-11 w-11 rounded-2xl bg-violet-600/10 dark:bg-violet-500/15" />
            <div className="mt-3 h-3 w-20 rounded bg-black/5 dark:bg-white/5" />
            <div className="mt-2 h-7 w-14 rounded bg-black/5 dark:bg-white/5" />
          </GlassCard>
        ))}
      </div>
    );
  }

  const tiles = [
    { label: "Dispatched", value: summary.dispatched, icon: ArrowUpRight },
    { label: "Received", value: summary.received, icon: Download },
    { label: "Procured", value: summary.procured, icon: ShoppingCart },
    { label: "Discarded", value: summary.discarded, icon: Trash2 },
  ];

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: reduceMotion ? 0 : 0.06 }}
        className="grid grid-cols-2 gap-3"
      >
        {tiles.map((t) => (
          <m.div
            key={t.label}
            variants={fadeUp}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
          >
            <StatTile {...t} />
          </m.div>
        ))}
      </m.div>
    </LazyMotion>
  );
}
