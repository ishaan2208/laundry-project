import { LinenCondition, LocationKind } from "@/generated/prisma";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { StockAuditRow } from "@/actions/reports/types";
import {
  STOCK_AUDIT_CONDITION_ORDER,
  visibleLocationKindsForAudit,
} from "@/lib/stockAuditConstants";
import { cn } from "@/lib/utils";

function labelEnum(v: string) {
  return v.replaceAll("_", " ");
}

function condQty(row: StockAuditRow, c: LinenCondition): number {
  return row.byCondition.find((x) => x.condition === c)?.qty ?? 0;
}

function kindQty(row: StockAuditRow, k: LocationKind): number {
  return row.byLocationKind.find((x) => x.locationKind === k)?.qty ?? 0;
}

function vendorBucketQty(row: StockAuditRow): number {
  return kindQty(row, LocationKind.VENDOR);
}

function nonVendorBucketQty(row: StockAuditRow): number {
  return row.totalQty - vendorBucketQty(row);
}

export function StockAuditTable(props: {
  rows: StockAuditRow[];
  includeVendor: boolean;
  includeDiscarded: boolean;
}) {
  const kinds = visibleLocationKindsForAudit(
    props.includeVendor,
    props.includeDiscarded
  );

  if (!props.rows.length) {
    return (
      <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-5 text-sm text-muted-foreground backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
        No active linen items.
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-0 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
      <ScrollArea className="w-full">
        <div className="min-w-full overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-violet-200/50 dark:border-violet-500/20">
                <th className="sticky left-0 z-10 min-w-[140px] bg-background/95 px-3 py-2.5 text-left font-semibold backdrop-blur-sm">
                  Item
                </th>
                <th className="min-w-[72px] px-2 py-2.5 text-left font-semibold text-muted-foreground">
                  SKU
                </th>
                <th className="min-w-[64px] px-2 py-2.5 text-right font-semibold">
                  Total
                </th>
                {props.includeVendor ? (
                  <>
                    <th className="min-w-[72px] px-2 py-2.5 text-right font-semibold text-muted-foreground">
                      Vendor
                    </th>
                    <th className="min-w-[88px] px-2 py-2.5 text-right font-semibold text-muted-foreground">
                      Non-vendor
                    </th>
                  </>
                ) : null}
                {STOCK_AUDIT_CONDITION_ORDER.map((c) => (
                  <th
                    key={c}
                    className="min-w-[52px] max-w-[72px] px-1 py-2.5 text-right text-xs font-semibold leading-tight text-muted-foreground"
                  >
                    {labelEnum(c)}
                  </th>
                ))}
                {kinds.map((k) => (
                  <th
                    key={k}
                    className="min-w-[72px] px-2 py-2.5 text-right font-semibold text-muted-foreground"
                  >
                    {labelEnum(k)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {props.rows.map((row) => (
                <tr
                  key={row.linenItemId}
                  className="border-b border-violet-100/80 last:border-0 dark:border-violet-500/10"
                >
                  <td
                    className={cn(
                      "sticky left-0 z-10 bg-background/95 px-3 py-2 font-medium backdrop-blur-sm",
                      row.totalQty < 0 && "text-destructive"
                    )}
                  >
                    {row.linenItemName}
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">
                    {row.sku ?? "—"}
                  </td>
                  <td
                    className={cn(
                      "px-2 py-2 text-right font-mono tabular-nums",
                      row.totalQty < 0 && "text-destructive font-semibold"
                    )}
                  >
                    {row.totalQty}
                  </td>
                  {props.includeVendor ? (
                    <>
                      <td className="px-2 py-2 text-right font-mono tabular-nums text-muted-foreground">
                        {vendorBucketQty(row)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono tabular-nums text-muted-foreground">
                        {nonVendorBucketQty(row)}
                      </td>
                    </>
                  ) : null}
                  {STOCK_AUDIT_CONDITION_ORDER.map((c) => {
                    const q = condQty(row, c);
                    return (
                      <td
                        key={c}
                        className={cn(
                          "px-2 py-2 text-right font-mono tabular-nums text-muted-foreground",
                          q !== 0 && "text-foreground"
                        )}
                      >
                        {q}
                      </td>
                    );
                  })}
                  {kinds.map((k) => {
                    const q = kindQty(row, k);
                    return (
                      <td
                        key={k}
                        className={cn(
                          "px-2 py-2 text-right font-mono tabular-nums text-muted-foreground",
                          q !== 0 && "text-foreground"
                        )}
                      >
                        {q}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
}
