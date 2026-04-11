import Link from "next/link";
import { notFound } from "next/navigation";
import { getPhysicalStockCount } from "@/actions/physicalCount/getPhysicalStockCount";
import { PhysicalCountReviewClient } from "@/components/physicalCount/PhysicalCountReviewClient";
import { PhysicalCountAdminEditor } from "@/components/physicalCount/PhysicalCountAdminEditor";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhysicalStockCountStatus } from "@/generated/prisma";

function statusVariant(s: PhysicalStockCountStatus) {
  if (s === PhysicalStockCountStatus.PENDING_REVIEW) return "default";
  if (s === PhysicalStockCountStatus.APPROVED) return "secondary";
  return "destructive";
}

export default async function PhysicalStockCountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getPhysicalStockCount(id);
  if (!detail) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">{detail.propertyName}</h1>
          <p className="text-sm text-muted-foreground">
            Physical count · {detail.id.slice(0, 8)}…
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/admin/physical-stock-counts">All counts</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={statusVariant(detail.status)}>
          {detail.status.replaceAll("_", " ")}
        </Badge>
        <Badge variant="outline">
          {detail.includeVendor ? "vendor" : "no vendor"} ·{" "}
          {detail.includeDiscarded ? "discarded" : "no discarded"}
        </Badge>
      </div>

      {detail.staffNote ? (
        <Card className="rounded-2xl border p-3 text-sm">
          <span className="font-medium">Staff note:</span> {detail.staffNote}
        </Card>
      ) : null}

      {detail.reviewNote ? (
        <Card className="rounded-2xl border p-3 text-sm">
          <span className="font-medium">Review note:</span> {detail.reviewNote}
        </Card>
      ) : null}

      {detail.approvalTransactionId ? (
        <p className="text-sm">
          <Link
            className="text-violet-600 underline"
            href={`/app/txns/${detail.approvalTransactionId}`}
          >
            View adjustment transaction
          </Link>
        </p>
      ) : null}

      <PhysicalCountAdminEditor
        countId={detail.id}
        status={detail.status}
        lines={detail.lines.map((l) => ({
          linenItemId: l.linenItemId,
          linenItemName: l.linenItemName,
          sku: l.sku,
          countedQty: l.countedQty,
          approvedQty: l.approvedQty,
          bookQtyAtSubmit: l.bookQtyAtSubmit,
          bookQtyNow: l.bookQtyNow,
          deltaStaffAtSubmit: l.deltaStaffAtSubmit,
        }))}
      />

      <PhysicalCountReviewClient countId={detail.id} status={detail.status} />
    </div>
  );
}
