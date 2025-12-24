import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BalanceRow } from "@/actions/reports/types";

function condLabel(c: string) {
  return c.replaceAll("_", " ");
}

export function BalanceTable({ rows }: { rows: BalanceRow[] }) {
  if (!rows.length) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        No rows for current filters.
      </Card>
    );
  }

  return (
    <div className="grid gap-2">
      {rows.map((r) => (
        <Card
          key={`${r.locationId}-${r.linenItemId}-${r.condition}`}
          className="p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {r.linenItemName}
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">
                {r.locationName}
                {r.locationKind === "VENDOR" && r.vendorName
                  ? ` · ${r.vendorName}`
                  : ""}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">{condLabel(r.condition)}</Badge>
                <Badge variant="outline">
                  {r.locationKind.replaceAll("_", " ")}
                </Badge>
              </div>
            </div>

            <div className="text-right">
              <div
                className={cn(
                  "text-xl font-semibold tabular-nums",
                  r.isNegative && "text-destructive"
                )}
              >
                {r.qty}
              </div>
              {r.isNegative ? (
                <Badge variant="destructive" className="mt-1">
                  Negative
                </Badge>
              ) : null}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
