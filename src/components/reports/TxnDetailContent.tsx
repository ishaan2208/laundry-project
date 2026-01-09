"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  CalendarClock,
  Building2,
  Truck,
  NotebookText,
  ShieldAlert,
  Warehouse,
  Droplets,
  Recycle,
  AlertTriangle,
  Trash2,
  MapPin,
  Layers,
} from "lucide-react";

export type TxnDetailDTO = {
  id: string;
  type: string;
  occurredAt: string | Date;
  reference?: string | null;
  note?: string | null;

  voidedAt?: string | Date | null;
  voidReason?: string | null;
  voidedBy?: { name?: string | null } | null;

  property: { name: string };
  vendor?: { name: string } | null;

  reversal?: { id: string } | null;

  entries: Array<{
    id: string;
    qtyDelta: number;
    condition: string;
    linenItem: { name: string };
    location: {
      name: string;
      kind: string;
      vendorName?: string | null;
    };
  }>;
};

function label(v: string) {
  return v.replaceAll("_", " ");
}

function fmt(dt: string | Date) {
  const d = typeof dt === "string" ? new Date(dt) : dt;
  return format(d, "dd MMM, hh:mm a");
}

function getStaffEntries(entries: TxnDetailDTO["entries"]) {
  // Staff view: show only destination (IN) entries.
  const positives = entries.filter((e) => e.qtyDelta > 0);

  // Fallback: if txn has no positives (rare), show ABS to avoid negative display.
  if (positives.length) return positives;
  return entries.map((e) => ({ ...e, qtyDelta: Math.abs(e.qtyDelta) }));
}

function conditionBadge(condition: string) {
  const c = condition.toUpperCase();
  if (c === "CLEAN")
    return "bg-emerald-600/10 text-emerald-700 dark:text-emerald-200 dark:bg-emerald-500/15 border-emerald-500/20";
  if (c === "SOILED")
    return "bg-amber-600/10 text-amber-800 dark:text-amber-200 dark:bg-amber-500/15 border-amber-500/20";
  if (c === "REWASH")
    return "bg-violet-600/10 text-violet-800 dark:text-violet-200 dark:bg-violet-500/15 border-violet-500/20";
  if (c === "DAMAGED")
    return "bg-red-600/10 text-red-700 dark:text-red-200 dark:bg-red-500/15 border-red-500/20";
  return "bg-muted/40 text-muted-foreground border-border/50";
}

function locationIcon(kind: string) {
  const k = kind.toUpperCase();
  if (k === "CLEAN_STORE") return Warehouse;
  if (k === "SOILED_STORE") return Droplets;
  if (k === "REWASH_BIN") return Recycle;
  if (k === "DAMAGED_BIN") return AlertTriangle;
  if (k === "DISCARDED_LOST") return Trash2;
  if (k === "VENDOR") return Truck;
  return MapPin;
}

export function TxnDetailContent({
  txn,
  headerSlot,
  compact = false,
  staffMode = true,
}: {
  txn: TxnDetailDTO;
  headerSlot?: React.ReactNode;
  compact?: boolean;
  staffMode?: boolean;
}) {
  const visibleEntries = staffMode ? getStaffEntries(txn.entries) : txn.entries;

  // Group by destination location for staff clarity
  const byLocation = React.useMemo(() => {
    const map = new Map<
      string,
      {
        locationName: string;
        locationKind: string;
        vendorName?: string | null;
        entries: typeof visibleEntries;
        totalQty: number;
      }
    >();

    for (const e of visibleEntries) {
      const key = `${e.location.kind}:${e.location.name}`;
      let bucket = map.get(key);

      if (!bucket) {
        bucket = {
          locationName: e.location.name,
          locationKind: e.location.kind,
          vendorName: e.location.vendorName,
          entries: [],
          totalQty: 0,
        };
        map.set(key, bucket);
      }

      bucket.entries.push(e);
      bucket.totalQty += Math.abs(e.qtyDelta);
    }

    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
  }, [visibleEntries]);

  const isVoided = Boolean(txn.voidedAt);

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {/* Meta */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 18 }}
      >
        <Card className="rounded-3xl border border-violet-200/60 bg-white/70 p-4 shadow-sm backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                  <Layers className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold">
                    {label(txn.type)}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Txn ID: <span className="font-mono">{txn.id}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className="rounded-2xl border border-violet-200/60 bg-white/60 dark:border-violet-500/15 dark:bg-zinc-950/40"
                >
                  <Building2 className="mr-1 h-4 w-4 text-violet-700 dark:text-violet-200" />
                  {txn.property.name}
                </Badge>

                {txn.vendor?.name ? (
                  <Badge
                    variant="secondary"
                    className="rounded-2xl border border-violet-200/60 bg-white/60 dark:border-violet-500/15 dark:bg-zinc-950/40"
                  >
                    <Truck className="mr-1 h-4 w-4 text-violet-700 dark:text-violet-200" />
                    {txn.vendor.name}
                  </Badge>
                ) : null}

                <Badge
                  variant="secondary"
                  className="rounded-2xl border border-violet-200/60 bg-white/60 dark:border-violet-500/15 dark:bg-zinc-950/40"
                >
                  <CalendarClock className="mr-1 h-4 w-4 text-violet-700 dark:text-violet-200" />
                  {fmt(txn.occurredAt)}
                </Badge>

                {txn.reference ? (
                  <Badge variant="secondary" className="rounded-2xl">
                    Ref: {txn.reference}
                  </Badge>
                ) : null}

                {isVoided ? (
                  <Badge
                    variant="destructive"
                    className="rounded-2xl"
                    title="Voided"
                  >
                    Voided
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className={[
                      "rounded-2xl",
                      "border-emerald-500/30 text-emerald-700",
                      "dark:border-emerald-400/20 dark:text-emerald-200",
                    ].join(" ")}
                    title="Active"
                  >
                    Active
                  </Badge>
                )}
              </div>
            </div>

            {headerSlot ? <div className="shrink-0">{headerSlot}</div> : null}
          </div>
        </Card>
      </motion.div>

      {/* Note */}
      {txn.note ? (
        <Card className="rounded-3xl border border-violet-200/60 bg-white/70 p-4 text-sm backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <NotebookText className="h-4 w-4" />
            Note
          </div>
          <div className="mt-2 whitespace-pre-wrap">{txn.note}</div>
        </Card>
      ) : null}

      {/* Voided */}
      {txn.voidedAt ? (
        <Card className="rounded-3xl border border-red-500/25 bg-red-500/5 p-4 text-sm dark:border-red-400/15 dark:bg-red-500/10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="destructive" className="rounded-2xl">
              Voided
            </Badge>
            <div className="text-xs text-muted-foreground">
              {fmt(txn.voidedAt)}
              {txn.voidedBy?.name ? ` · by ${txn.voidedBy.name}` : ""}
            </div>
          </div>
          {txn.voidReason ? (
            <div className="mt-2 text-sm">
              <span className="inline-flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Reason:
              </span>{" "}
              {txn.voidReason}
            </div>
          ) : null}
        </Card>
      ) : null}

      <Separator className="opacity-60" />

      {/* Entries */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">
          {staffMode ? "Added to" : "Entries"}
        </div>
        <div className="text-xs text-muted-foreground">
          {visibleEntries.reduce((s, e) => s + Math.abs(e.qtyDelta), 0)} pcs
        </div>
      </div>

      {/* Grouped destination cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {byLocation.map((grp, idx) => {
          const Icon = locationIcon(grp.locationKind);

          return (
            <motion.div
              key={`${grp.locationKind}:${grp.locationName}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 150,
                damping: 18,
                delay: Math.min(idx * 0.03, 0.15),
              }}
            >
              <Card className="rounded-3xl border border-violet-200/60 bg-white/70 shadow-sm backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
                {/* Location header */}
                <div className="flex items-start justify-between gap-3 p-4 pb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {grp.locationName}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {label(grp.locationKind)}
                          {grp.vendorName ? ` · ${grp.vendorName}` : ""}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant="secondary"
                    className="rounded-2xl border border-violet-200/60 bg-white/60 text-violet-800 dark:border-violet-500/15 dark:bg-zinc-950/40 dark:text-violet-200"
                  >
                    +{grp.totalQty}
                  </Badge>
                </div>

                <Separator className="opacity-60" />

                {/* Items */}
                <div className="divide-y divide-border/60">
                  {grp.entries
                    .slice()
                    .sort((a, b) => Math.abs(b.qtyDelta) - Math.abs(a.qtyDelta))
                    .map((e) => {
                      const qty = Math.abs(e.qtyDelta);
                      return (
                        <div
                          key={e.id}
                          className="flex items-start justify-between gap-3 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold capitalize">
                              {e.linenItem.name.toLowerCase()}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <Badge
                                variant="outline"
                                className={[
                                  "rounded-xl border",
                                  conditionBadge(e.condition),
                                ].join(" ")}
                              >
                                {label(e.condition)}
                              </Badge>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-semibold tabular-nums text-violet-700 dark:text-violet-200">
                              {qty}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              qty
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            </motion.div>
          );
        })}

        {!byLocation.length ? (
          <Card className="rounded-3xl border border-dashed border-violet-200/60 bg-white/60 p-4 text-sm text-muted-foreground dark:border-violet-500/15 dark:bg-zinc-950/40">
            No staff-visible entries.
          </Card>
        ) : null}
      </div>
    </div>
  );
}
