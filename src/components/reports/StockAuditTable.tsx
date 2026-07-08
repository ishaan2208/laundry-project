import { LocationKind } from "@/generated/prisma";
import type { StockAuditRow } from "@/actions/reports/types";
import { cn } from "@/lib/utils";

function kindQty(row: StockAuditRow, k: LocationKind): number {
  return row.byLocationKind.find((x) => x.locationKind === k)?.qty ?? 0;
}

/** At the laundry = vendor balance; in stock = everything else. */
function atLaundry(row: StockAuditRow): number {
  return kindQty(row, LocationKind.VENDOR);
}
function inStock(row: StockAuditRow): number {
  return row.totalQty - atLaundry(row);
}

/**
 * Weekly totals, in the only three numbers staff track: what's with the
 * hotel, what's at the laundry, and the total. No internal condition or
 * location buckets — those don't form a complete circle and only confuse.
 */
export function StockAuditTable(props: { rows: StockAuditRow[] }) {
  if (!props.rows.length) {
    return (
      <div className="surface rounded-2xl p-5 text-center text-sm text-muted-foreground">
        No active linen items.
      </div>
    );
  }

  return (
    <div className="surface overflow-hidden rounded-2xl">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="px-3 py-2.5 text-left font-semibold">Item</th>
            <th className="px-2 py-2.5 text-right font-semibold text-muted-foreground">
              With you
            </th>
            <th className="px-2 py-2.5 text-right font-semibold text-muted-foreground">
              At laundry
            </th>
            <th className="px-3 py-2.5 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row) => {
            const here = inStock(row);
            const out = atLaundry(row);
            const bad = here < 0 || out < 0 || row.totalQty < 0;
            return (
              <tr key={row.linenItemId} className="border-b last:border-0">
                <td
                  className={cn(
                    "px-3 py-2.5 font-medium",
                    bad && "text-damaged"
                  )}
                >
                  {row.linenItemName}
                </td>
                <td
                  data-numeric
                  className={cn(
                    "px-2 py-2.5 text-right text-muted-foreground",
                    here < 0 && "font-semibold text-damaged"
                  )}
                >
                  {here}
                </td>
                <td
                  data-numeric
                  className={cn(
                    "px-2 py-2.5 text-right text-muted-foreground",
                    out < 0 && "font-semibold text-damaged"
                  )}
                >
                  {out}
                </td>
                <td
                  data-numeric
                  className={cn(
                    "px-3 py-2.5 text-right font-semibold",
                    row.totalQty < 0 && "text-damaged"
                  )}
                >
                  {row.totalQty}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
