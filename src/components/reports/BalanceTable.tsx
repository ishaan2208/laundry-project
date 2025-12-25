import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BalanceRow } from "@/actions/reports/types";
import {
  Building2,
  Warehouse,
  Truck,
  Sparkles,
  TriangleAlert,
  Layers3,
  Shirt,
  Droplets,
  RefreshCcw,
  Flame,
} from "lucide-react";

function condLabel(c: string) {
  return c.replaceAll("_", " ");
}

function kindLabel(k: string) {
  return k.replaceAll("_", " ");
}

function kindIcon(kind: string) {
  if (kind === "VENDOR") return <Truck className="h-4 w-4" />;
  if (kind === "CLEAN_STORE") return <Shirt className="h-4 w-4" />;
  if (kind === "SOILED_STORE") return <Droplets className="h-4 w-4" />;
  if (kind === "REWASH_BIN") return <RefreshCcw className="h-4 w-4" />;
  if (kind === "DAMAGED_BIN") return <Flame className="h-4 w-4" />;
  return <Warehouse className="h-4 w-4" />;
}

function condTone(condition: string) {
  // keep it subtle + violet-first
  if (condition === "CLEAN") return "text-violet-700 dark:text-violet-200";
  if (condition === "SOILED") return "text-muted-foreground";
  if (condition === "REWASH") return "text-muted-foreground";
  if (condition === "DAMAGED") return "text-destructive";
  return "text-muted-foreground";
}

export function BalanceTable({ rows }: { rows: BalanceRow[] }) {
  if (!rows.length) {
    return (
      <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-5 text-sm text-muted-foreground backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-semibold text-foreground">No rows</div>
            <div className="mt-1 text-sm text-muted-foreground">
              No balances match your current filters.
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Optional: sort negatives to top for visibility (without changing meaning)
  const sorted = [...rows].sort(
    (a, b) => Number(b.isNegative) - Number(a.isNegative)
  );

  return (
    <div className="grid gap-3">
      {sorted.map((r) => {
        const isVendor = r.locationKind === "VENDOR";
        return (
          <Card
            key={`${r.locationId}-${r.linenItemId}-${r.condition}`}
            className={cn(
              "rounded-3xl p-4",
              "border border-violet-200/60 bg-white/60 backdrop-blur-[2px]",
              "dark:border-violet-500/15 dark:bg-zinc-950/40",
              r.isNegative && "border-destructive/40"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              {/* LEFT */}
              <div className="min-w-0">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 grid h-10 w-10 place-items-center rounded-2xl",
                      r.isNegative
                        ? "bg-destructive/10 text-destructive"
                        : "bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200"
                    )}
                  >
                    <Layers3 className="h-5 w-5" />
                  </span>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {r.linenItemName}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        {kindIcon(r.locationKind)}
                        <span className="truncate">{r.locationName}</span>
                      </span>

                      {isVendor && r.vendorName ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="h-4 w-4" />
                          <span className="truncate">{r.vendorName}</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "rounded-2xl border border-violet-200/60 bg-white/60 text-xs",
                          "backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40",
                          condTone(r.condition)
                        )}
                      >
                        <Sparkles className="mr-1 h-4 w-4" />
                        {condLabel(r.condition)}
                      </Badge>

                      <Badge
                        variant="secondary"
                        className="rounded-2xl border border-violet-200/60 bg-white/60 text-xs backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                      >
                        {kindIcon(r.locationKind)}
                        <span className="ml-1">
                          {kindLabel(r.locationKind)}
                        </span>
                      </Badge>

                      {r.isNegative ? (
                        <Badge variant="destructive" className="rounded-2xl">
                          <TriangleAlert className="mr-1 h-4 w-4" />
                          Negative
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT qty */}
              <div className="shrink-0 text-right">
                <div
                  className={cn(
                    "rounded-2xl border px-3 py-2",
                    "border-violet-200/60 bg-white/60 backdrop-blur-[2px]",
                    "dark:border-violet-500/15 dark:bg-zinc-950/40",
                    r.isNegative && "border-destructive/40"
                  )}
                >
                  <div
                    className={cn(
                      "text-2xl font-semibold tabular-nums leading-none",
                      r.isNegative ? "text-destructive" : "text-foreground"
                    )}
                  >
                    {r.qty}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    pcs
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
