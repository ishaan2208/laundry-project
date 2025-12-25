// src/components/reports/VendorPendingCard.tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Package,
  Droplets,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VendorPendingVendorRow } from "@/actions/reports/types";

function chipClass() {
  return "rounded-full border border-violet-200/60 bg-white/60 text-[11px] backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40";
}

export function VendorPendingCard({
  vendor,
}: {
  vendor: VendorPendingVendorRow;
}) {
  const [open, setOpen] = React.useState(false);

  const topRows = React.useMemo(
    () => vendor.items.slice(0, 25),
    [vendor.items]
  );
  const hasMore = vendor.items.length > 25;

  return (
    <Card
      className={cn(
        "rounded-3xl border border-violet-200/60 bg-white/60 p-3 backdrop-blur-[2px]",
        "dark:border-violet-500/15 dark:bg-zinc-950/40"
      )}
    >
      {/* header row */}
      <button
        type="button"
        className={cn(
          "flex w-full items-start justify-between gap-3 text-left",
          "rounded-2xl p-2",
          "active:bg-violet-600/5 dark:active:bg-violet-500/10"
        )}
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 ring-1 ring-violet-200/60 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/15">
              <Package className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {vendor.vendorName}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Tap to {open ? "collapse" : "expand"} item-wise pending
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary" className={chipClass()}>
              <Sparkles className="mr-1 h-3.5 w-3.5 text-violet-700 dark:text-violet-200" />
              Pending {vendor.totalQty}
            </Badge>

            <Badge variant="secondary" className={chipClass()}>
              <Droplets className="mr-1 h-3.5 w-3.5 text-violet-700 dark:text-violet-200" />
              SOILED {vendor.soiledQty}
            </Badge>

            <Badge variant="secondary" className={chipClass()}>
              <RotateCcw className="mr-1 h-3.5 w-3.5 text-violet-700 dark:text-violet-200" />
              REWASH {vendor.rewashQty}
            </Badge>

            {vendor.otherQty ? (
              <Badge variant="secondary" className={chipClass()}>
                OTHER {vendor.otherQty}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 pr-1">
          <div className="text-right">
            <div className="text-xl font-semibold tabular-nums">
              {vendor.totalQty}
            </div>
            <div className="text-[11px] text-muted-foreground">pcs</div>
          </div>

          <div
            className={cn(
              "grid h-11 w-11 place-items-center rounded-2xl",
              "bg-violet-600/10 text-violet-700 ring-1 ring-violet-200/60",
              "dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/15"
            )}
          >
            <ChevronDown
              className={cn(
                "h-5 w-5 transition-transform",
                open && "rotate-180"
              )}
            />
          </div>
        </div>
      </button>

      {/* expanded body */}
      {open ? (
        <div className="mt-2 rounded-2xl border border-violet-200/60 bg-white/50 p-3 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/30">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-foreground">
              Item-wise pending
            </div>
            <Badge variant="secondary" className={chipClass()}>
              Showing {Math.min(25, vendor.items.length)}
              {hasMore ? "+" : ""} rows
            </Badge>
          </div>

          <div className="mt-3 grid gap-2">
            {topRows.map((it, idx) => (
              <div
                key={`${it.linenItemId}-${it.condition}-${idx}`}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-3 py-2",
                  "bg-white/60 dark:bg-zinc-950/30",
                  "border border-violet-200/50 dark:border-violet-500/10"
                )}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {it.linenItemName}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {String(it.condition).replaceAll("_", " ")}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-semibold tabular-nums">
                    {it.qty}
                  </div>
                  <div className="text-[11px] text-muted-foreground">pcs</div>
                </div>
              </div>
            ))}

            {hasMore ? (
              <div className="mt-1 rounded-2xl border border-violet-200/60 bg-white/60 p-3 text-xs text-muted-foreground backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
                Showing top 25 rows.
              </div>
            ) : null}
          </div>

          <div className="mt-3">
            <Button
              type="button"
              variant="secondary"
              className="h-12 w-full rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
              onClick={() => setOpen(false)}
            >
              Collapse
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
