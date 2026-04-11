import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, isAdmin } from "@/lib/auth";
import { getPhysicalStockCountForSubmitter } from "@/actions/physicalCount/getPhysicalStockCount";
import { getPhysicalStockCount } from "@/actions/physicalCount/getPhysicalStockCount";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhysicalStockCountStatus } from "@/generated/prisma";

export default async function PhysicalCountStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const detail = isAdmin(user)
    ? await getPhysicalStockCount(id)
    : await getPhysicalStockCountForSubmitter(id);

  if (!detail) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-3 pb-12">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Count submitted</h1>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/app/stock/physical-count">Back</Link>
        </Button>
      </div>

      <Card className="rounded-3xl border p-4 space-y-2 text-sm">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{detail.propertyName}</Badge>
          <Badge
            variant={
              detail.status === PhysicalStockCountStatus.PENDING_REVIEW
                ? "default"
                : detail.status === PhysicalStockCountStatus.APPROVED
                  ? "secondary"
                  : "destructive"
            }
          >
            {detail.status.replaceAll("_", " ")}
          </Badge>
        </div>
        {detail.staffNote ? (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Your note:</span>{" "}
            {detail.staffNote}
          </p>
        ) : null}
        {detail.reviewNote ? (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Admin:</span>{" "}
            {detail.reviewNote}
          </p>
        ) : null}
        {detail.approvalTransactionId ? (
          <p className="text-xs text-muted-foreground">
            Ledger txn:{" "}
            <Link
              className="text-violet-600 underline"
              href={`/app/txns/${detail.approvalTransactionId}`}
            >
              {detail.approvalTransactionId}
            </Link>
          </p>
        ) : null}
      </Card>

      <Card className="rounded-3xl border p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2 text-right">Your count</th>
              <th className="px-3 py-2 text-right">Approved</th>
              <th className="px-3 py-2 text-right">Book (submit)</th>
            </tr>
          </thead>
          <tbody>
            {detail.lines.map((l) => {
              const finalQty = l.approvedQty ?? l.countedQty;
              const edited =
                l.approvedQty !== null && l.approvedQty !== l.countedQty;
              return (
                <tr key={l.linenItemId} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    {l.linenItemName}
                    {edited ? (
                      <span className="ml-1 text-xs text-amber-700 dark:text-amber-400">
                        (adjusted by admin)
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{l.countedQty}</td>
                  <td className="px-3 py-2 text-right font-mono">{finalQty}</td>
                  <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                    {l.bookQtyAtSubmit}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="border-t px-3 py-2 text-xs text-muted-foreground">
          <strong>Approved</strong> is the figure admin uses for the ledger (same
          as your count unless they change it). Vendor stock is not moved by
          approval—only clean store is adjusted.
        </p>
      </Card>
    </div>
  );
}
