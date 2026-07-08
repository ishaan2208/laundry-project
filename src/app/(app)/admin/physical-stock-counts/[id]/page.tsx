import Link from "next/link";
import { notFound } from "next/navigation";
import { getPhysicalStockCount } from "@/actions/physicalCount/getPhysicalStockCount";
import { PhysicalCountReviewClient } from "@/components/physicalCount/PhysicalCountReviewClient";
import { PhysicalCountAdminEditor } from "@/components/physicalCount/PhysicalCountAdminEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhysicalStockCountStatus } from "@/generated/prisma";
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
        <Badge
          variant="secondary"
          className={cn("rounded-full", STATUS_TONE[detail.status])}
        >
          {STATUS_LABEL[detail.status]}
        </Badge>
        <Badge variant="outline" className="rounded-full">
          {detail.includeVendor ? "Includes laundry vendor" : "No laundry vendor"} ·{" "}
          {detail.includeDiscarded ? "Includes discarded" : "No discarded"}
        </Badge>
      </div>

      {detail.staffNote ? (
        <div className="surface rounded-2xl p-3 text-sm">
          <span className="font-medium">Staff note:</span> {detail.staffNote}
        </div>
      ) : null}

      {detail.reviewNote ? (
        <div className="surface rounded-2xl p-3 text-sm">
          <span className="font-medium">Review note:</span> {detail.reviewNote}
        </div>
      ) : null}

      {detail.approvalTransactionId ? (
        <p className="text-sm">
          <Link
            className="text-primary underline"
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
