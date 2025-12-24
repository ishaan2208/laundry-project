import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VendorPendingTopRow } from "@/actions/reports/getTopVendorPending";

export function VendorPendingTop({
  propertyId,
  rows,
}: {
  propertyId: string;
  rows: VendorPendingTopRow[];
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Pending with laundry</CardTitle>
          <Link
            href={`/admin/vendors?propertyId=${encodeURIComponent(propertyId)}`}
            className="text-xs text-muted-foreground underline underline-offset-4"
          >
            View all
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No pending with vendors.
          </div>
        ) : (
          <ScrollArea className="max-h-45">
            <div className="flex flex-col">
              {rows.map((r, idx) => {
                const isBad = r.pendingQty < 0;
                return (
                  <div key={r.vendorId}>
                    <div className="flex items-center justify-between py-3">
                      <div className="text-sm font-medium">{r.vendorName}</div>
                      <Badge
                        variant={isBad ? "destructive" : "secondary"}
                        className="tabular-nums"
                      >
                        {r.pendingQty}
                      </Badge>
                    </div>
                    {idx !== rows.length - 1 ? <Separator /> : null}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
