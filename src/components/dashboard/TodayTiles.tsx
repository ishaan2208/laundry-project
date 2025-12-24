"use client";

import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Download, ShoppingCart, Trash2 } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/components/motion/variants";

import type { DashboardSummary } from "@/actions/reports/getDashboardSummary";

function StatTile({
  label,
  value,
  icon: Icon,
  accent = "violet",
}: {
  label: string;
  value: number;
  icon: any;
  accent?: "violet" | "fuchsia";
}) {
  const grad =
    accent === "violet"
      ? "from-violet-600/20 to-fuchsia-600/10"
      : "from-fuchsia-600/20 to-violet-600/10";

  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br",
            grad,
            "ring-1 ring-white/15 dark:ring-white/10"
          )}
        >
          <Icon className="h-5 w-5 text-zinc-950/80 dark:text-white" />
        </div>

        <Badge
          variant="secondary"
          className="border border-white/15 bg-white/55 dark:border-white/10 dark:bg-white/5"
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
      <GlassCard className="p-4">
        <div className="text-sm font-semibold">
          Select property to load totals
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Today totals are calculated per property.
        </div>
      </GlassCard>
    );
  }

  if (!summary) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4">
          <div className="h-10 w-10 rounded-2xl bg-white/40 dark:bg-white/5" />
          <div className="mt-3 h-3 w-20 rounded bg-white/40 dark:bg-white/5" />
          <div className="mt-2 h-7 w-14 rounded bg-white/40 dark:bg-white/5" />
        </GlassCard>
        <GlassCard className="p-4">
          <div className="h-10 w-10 rounded-2xl bg-white/40 dark:bg-white/5" />
          <div className="mt-3 h-3 w-20 rounded bg-white/40 dark:bg-white/5" />
          <div className="mt-2 h-7 w-14 rounded bg-white/40 dark:bg-white/5" />
        </GlassCard>
        <GlassCard className="p-4">
          <div className="h-10 w-10 rounded-2xl bg-white/40 dark:bg-white/5" />
          <div className="mt-3 h-3 w-20 rounded bg-white/40 dark:bg-white/5" />
          <div className="mt-2 h-7 w-14 rounded bg-white/40 dark:bg-white/5" />
        </GlassCard>
        <GlassCard className="p-4">
          <div className="h-10 w-10 rounded-2xl bg-white/40 dark:bg-white/5" />
          <div className="mt-3 h-3 w-20 rounded bg-white/40 dark:bg-white/5" />
          <div className="mt-2 h-7 w-14 rounded bg-white/40 dark:bg-white/5" />
        </GlassCard>
      </div>
    );
  }

  const tiles = [
    {
      label: "Dispatched",
      value: summary.dispatched,
      icon: ArrowUpRight,
      accent: "violet" as const,
    },
    {
      label: "Received",
      value: summary.received,
      icon: Download,
      accent: "fuchsia" as const,
    },
    {
      label: "Procured",
      value: summary.procured,
      icon: ShoppingCart,
      accent: "violet" as const,
    },
    {
      label: "Discarded",
      value: summary.discarded,
      icon: Trash2,
      accent: "fuchsia" as const,
    },
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
