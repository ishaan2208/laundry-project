"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  CalendarClock,
  Building2,
  Truck,
  NotebookText,
  ShieldAlert,
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

  // Fallback: if a txn genuinely has no positive entries (rare),
  // show all entries but as ABS qty (still avoids negatives on screen).
  if (positives.length > 0) return positives;

  return entries.map((e) => ({ ...e, qtyDelta: Math.abs(e.qtyDelta) }));
}

export function TxnDetailContent({
  txn,
  headerSlot,
  compact = false,
  staffMode = true, // ✅ default: staff-friendly
}: {
  txn: TxnDetailDTO;
  headerSlot?: React.ReactNode;
  compact?: boolean;
  staffMode?: boolean;
}) {
  const visibleEntries = staffMode ? getStaffEntries(txn.entries) : txn.entries;

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {/* Meta */}
      <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-semibold">{label(txn.type)}</div>

            <div className="mt-2 flex flex-wrap gap-2">
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

              {txn.voidedAt ? (
                <Badge variant="destructive" className="rounded-2xl">
                  Voided
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="rounded-2xl border-violet-200/60 dark:border-violet-500/15"
                >
                  Active
                </Badge>
              )}
            </div>
          </div>

          {headerSlot ? <div className="shrink-0">{headerSlot}</div> : null}
        </div>
      </Card>

      {/* Note */}
      {txn.note ? (
        <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 text-sm backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <NotebookText className="h-4 w-4" />
            Note
          </div>
          <div className="mt-2 whitespace-pre-wrap">{txn.note}</div>
        </Card>
      ) : null}

      {/* Voided */}
      {txn.voidedAt ? (
        <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 text-sm backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
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
      <div className="text-sm font-semibold">
        {staffMode ? "Added to" : "Entries"}
      </div>

      <div className="grid gap-2">
        {visibleEntries.map((e) => {
          const qty = Math.abs(e.qtyDelta); // always show positive number on screen
          return (
            <Card
              key={e.id}
              className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold">
                    {e.linenItem.name}
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {e.location.name} · {label(e.location.kind)} ·{" "}
                    {label(e.condition)}
                    {e.location.vendorName ? ` · ${e.location.vendorName}` : ""}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold tabular-nums text-violet-700 dark:text-violet-200">
                    {qty}
                  </div>
                  <div className="text-xs text-muted-foreground">qty</div>
                </div>
              </div>
            </Card>
          );
        })}

        {!visibleEntries.length ? (
          <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 text-sm text-muted-foreground dark:border-violet-500/15 dark:bg-zinc-950/40">
            No staff-visible entries.
          </Card>
        ) : null}
      </div>
    </div>
  );
}
