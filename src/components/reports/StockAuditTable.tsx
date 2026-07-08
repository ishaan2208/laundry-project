import { LinenCondition, LocationKind } from "@/generated/prisma";
import type { StockAuditRow } from "@/actions/reports/types";
import {
  STOCK_AUDIT_CONDITION_ORDER,
  visibleLocationKindsForAudit,
} from "@/lib/stockAuditConstants";
import { cn } from "@/lib/utils";

function labelEnum(v: string) {
  return v.replaceAll("_", " ").toLowerCase();
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
      <div className="surface rounded-2xl p-5 text-center text-sm text-muted-foreground">
        No active linen items.
      </div>
    );
  }

  return (
    <div className="surface overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="sticky left-0 z-10 min-w-[140px] bg-card px-3 py-2.5 text-left font-semibold">
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
                    Laundry
                  </th>
                  <th className="min-w-[88px] px-2 py-2.5 text-right font-semibold text-muted-foreground">
                    On hotel
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
              <tr key={row.linenItemId} className="border-b last:border-0">
                <td
                  className={cn(
                    "sticky left-0 z-10 bg-card px-3 py-2 font-medium",
                    row.totalQty < 0 && "text-damaged"
                  )}
                >
                  {row.linenItemName}
                </td>
                <td className="px-2 py-2 text-muted-foreground">
                  {row.sku ?? "—"}
                </td>
                <td
                  data-numeric
                  className={cn(
                    "px-2 py-2 text-right",
                    row.totalQty < 0 && "font-bold text-damaged"
                  )}
                >
                  {row.totalQty}
                </td>
                {props.includeVendor ? (
                  <>
                    <td
                      data-numeric
                      className="px-2 py-2 text-right text-muted-foreground"
                    >
                      {vendorBucketQty(row)}
                    </td>
                    <td
                      data-numeric
                      className="px-2 py-2 text-right text-muted-foreground"
                    >
                      {nonVendorBucketQty(row)}
                    </td>
                  </>
                ) : null}
                {STOCK_AUDIT_CONDITION_ORDER.map((c) => {
                  const q = condQty(row, c);
                  return (
                    <td
                      key={c}
                      data-numeric
                      className={cn(
                        "px-2 py-2 text-right text-muted-foreground",
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
                      data-numeric
                      className={cn(
                        "px-2 py-2 text-right text-muted-foreground",
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
    </div>
  );
}
