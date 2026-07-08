import Link from "next/link";
import { listPhysicalStockCounts } from "@/actions/physicalCount/listPhysicalStockCounts";
import { PhysicalStockCountStatus } from "@/generated/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<PhysicalStockCountStatus, string> = {
  [PhysicalStockCountStatus.PENDING_REVIEW]: "Waiting for review",
  [PhysicalStockCountStatus.APPROVED]: "Approved",
  [PhysicalStockCountStatus.REJECTED]: "Rejected",
};

const STATUS_TONE: Record<PhysicalStockCountStatus, string> = {
  [PhysicalStockCountStatus.PENDING_REVIEW]: "bg-soiled-soft text-soiled",
  [PhysicalStockCountStatus.APPROVED]: "bg-clean-soft text-clean",
  [PhysicalStockCountStatus.REJECTED]: "bg-damaged-soft text-damaged",
};

export default async function PhysicalStockCountsListPage() {
  const rows = await listPhysicalStockCounts({ limit: 150 });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Physical stock counts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Staff submissions. Approve to post ledger adjustments so totals match
          counted quantities.
        </p>
      </div>

      <div className="surface overflow-hidden rounded-2xl">
        <ScrollArea className="w-full">
          <div className="min-w-[640px]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted text-left">
                  <th className="px-3 py-2 font-medium">Property</th>
                  <th className="px-3 py-2 font-medium">Submitted</th>
                  <th className="px-3 py-2 font-medium">By</th>
                  <th className="px-3 py-2 font-medium">Scope</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-muted-foreground"
                    >
                      No submissions yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{r.propertyName}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {new Intl.DateTimeFormat("en-IN", {
                          timeZone: "Asia/Kolkata",
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(r.submittedAt)}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {r.submitterName ?? r.submitterEmail ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {r.includeVendor ? "Includes laundry vendor" : "No laundry vendor"} ·{" "}
                        {r.includeDiscarded ? "Includes discarded" : "No discarded"}
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          variant="secondary"
                          className={cn("rounded-full", STATUS_TONE[r.status])}
                        >
                          {STATUS_LABEL[r.status]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Button asChild variant="ghost" size="sm" className="rounded-full">
                          <Link href={`/admin/physical-stock-counts/${r.id}`}>
                            Open
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
