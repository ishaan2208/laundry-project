"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VendorPendingVendorRow } from "@/actions/reports/types";

export function VendorPendingCard({
  vendor,
}: {
  vendor: VendorPendingVendorRow;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Card className="p-3">
      <button
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={() => setOpen((s) => !s)}
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {vendor.vendorName}
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>
              Pending:{" "}
              <span className="font-medium tabular-nums">
                {vendor.totalQty}
              </span>
            </span>
            <Badge variant="secondary">SOILED {vendor.soiledQty}</Badge>
            <Badge variant="secondary">REWASH {vendor.rewashQty}</Badge>
            {vendor.otherQty ? (
              <Badge variant="secondary">OTHER {vendor.otherQty}</Badge>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold tabular-nums">
            {vendor.totalQty}
          </div>
          <ChevronDown
            className={cn("h-4 w-4 transition", open && "rotate-180")}
          />
        </div>
      </button>

      {open ? (
        <div className="mt-3 grid gap-2">
          {vendor.items.slice(0, 25).map((it, idx) => (
            <div
              key={`${it.linenItemId}-${it.condition}-${idx}`}
              className="flex items-center justify-between text-sm"
            >
              <div className="min-w-0 truncate">
                {it.linenItemName}{" "}
                <span className="text-xs text-muted-foreground">
                  · {it.condition}
                </span>
              </div>
              <div className="tabular-nums font-medium">{it.qty}</div>
            </div>
          ))}
          {vendor.items.length > 25 ? (
            <div className="text-xs text-muted-foreground">
              Showing top 25 rows
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
