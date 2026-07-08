import * as React from "react";
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
  return c.replaceAll("_", " ").toLowerCase();
}

function kindLabel(k: string) {
  return k.replaceAll("_", " ").toLowerCase();
}

function kindIcon(kind: string) {
  if (kind === "VENDOR") return <Truck className="size-4" />;
  if (kind === "CLEAN_STORE") return <Shirt className="size-4" />;
  if (kind === "SOILED_STORE") return <Droplets className="size-4" />;
  if (kind === "REWASH_BIN") return <RefreshCcw className="size-4" />;
  if (kind === "DAMAGED_BIN") return <Flame className="size-4" />;
  return <Warehouse className="size-4" />;
}

function condTone(condition: string) {
  if (condition === "CLEAN") return "text-clean";
  if (condition === "DAMAGED") return "text-damaged";
  return "text-muted-foreground";
}

export function BalanceTable({ rows }: { rows: BalanceRow[] }) {
  if (!rows.length) {
    return (
      <div className="surface rounded-2xl p-5 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
          <Sparkles className="size-5" />
        </span>
        <p className="mt-2 text-base font-semibold">Nothing here</p>
        <p className="mt-1 text-sm text-muted-foreground">
          No balances match your current filters.
        </p>
      </div>
    );
  }

  const sorted = [...rows].sort(
    (a, b) => Number(b.isNegative) - Number(a.isNegative)
  );

  return (
    <div className="space-y-3">
      {sorted.map((r) => {
        const isVendor = r.locationKind === "VENDOR";
        return (
          <div
            key={`${r.locationId}-${r.linenItemId}-${r.condition}`}
            className={cn(
              "surface rounded-2xl p-4",
              r.isNegative && "border-damaged/40"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl",
                      r.isNegative
                        ? "bg-damaged-soft text-damaged"
                        : "bg-accent text-accent-foreground"
                    )}
                  >
                    <Layers3 className="size-5" />
                  </span>

                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">
                      {r.linenItemName}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        {kindIcon(r.locationKind)}
                        <span className="truncate">{r.locationName}</span>
                      </span>

                      {isVendor && r.vendorName ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="size-4" />
                          <span className="truncate">{r.vendorName}</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold",
                          condTone(r.condition)
                        )}
                      >
                        {condLabel(r.condition)}
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                        {kindIcon(r.locationKind)}
                        {kindLabel(r.locationKind)}
                      </span>

                      {r.isNegative ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-damaged-soft px-2.5 py-1 text-xs font-semibold text-damaged">
                          <TriangleAlert className="size-3.5" />
                          Below zero
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div
                  data-numeric
                  className={cn(
                    "text-2xl font-bold leading-none",
                    r.isNegative ? "text-damaged" : "text-foreground"
                  )}
                >
                  {r.qty}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  pieces
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
