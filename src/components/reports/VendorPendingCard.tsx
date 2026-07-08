// src/components/reports/VendorPendingCard.tsx
"use client";

import * as React from "react";
import { ChevronDown, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VendorPendingVendorRow } from "@/actions/reports/types";

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
    <div className="surface overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        className="press-soft flex w-full items-center gap-3 px-3.5 py-3 text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
          <Package className="size-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold">
            {vendor.vendorName}
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {vendor.soiledQty} to be washed · {vendor.rewashQty} wash again
            {vendor.otherQty ? ` · ${vendor.otherQty} other` : ""}
          </span>
        </span>

        <span className="shrink-0 text-right">
          <span data-numeric className="block text-lg font-bold">
            {vendor.totalQty}
          </span>
          <span className="block text-xs text-muted-foreground">pieces</span>
        </span>

        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-(--ease-fluent)",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t px-3.5 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Item by item</span>
              <span className="text-xs text-muted-foreground">
                Showing {Math.min(25, vendor.items.length)}
                {hasMore ? "+" : ""} of {vendor.items.length}
              </span>
            </div>

            <ul className="mt-2 divide-y divide-border">
              {topRows.map((it, idx) => (
                <li
                  key={`${it.linenItemId}-${it.condition}-${idx}`}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {it.linenItemName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {String(it.condition).replaceAll("_", " ").toLowerCase()}
                    </div>
                  </div>
                  <span data-numeric className="text-base font-semibold">
                    {it.qty}
                  </span>
                </li>
              ))}
            </ul>

            {hasMore ? (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Showing the top 25 items.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
