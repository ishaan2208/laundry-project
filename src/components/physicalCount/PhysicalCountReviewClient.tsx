"use client";

import * as React from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { approvePhysicalStockCount } from "@/actions/physicalCount/approvePhysicalStockCount";
import { rejectPhysicalStockCount } from "@/actions/physicalCount/rejectPhysicalStockCount";
import { PhysicalStockCountStatus } from "@/generated/prisma";
import { Check, X } from "lucide-react";

export function PhysicalCountReviewClient(props: {
  countId: string;
  status: PhysicalStockCountStatus;
}) {
  const router = useRouter();
  const [rejectNote, setRejectNote] = React.useState("");
  const [busy, setBusy] = React.useState<"approve" | "reject" | null>(null);

  if (props.status !== PhysicalStockCountStatus.PENDING_REVIEW) {
    return null;
  }

  async function onApprove() {
    setBusy("approve");
    try {
      const r = await approvePhysicalStockCount(props.countId);
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      toast.success(
        r.transactionId
          ? "Approved — ledger updated."
          : "Approved — book already matched (no adjustment)."
      );
      router.refresh();
    } catch {
      toast.error("Approve failed.");
    } finally {
      setBusy(null);
    }
  }

  async function onReject() {
    setBusy("reject");
    try {
      const r = await rejectPhysicalStockCount({
        countId: props.countId,
        reviewNote: rejectNote,
      });
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      toast.success("Rejected.");
      router.refresh();
    } catch {
      toast.error("Reject failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-violet-200/60 bg-violet-50/30 p-4 dark:border-violet-500/15 dark:bg-violet-950/20">
      <div className="text-sm font-medium">Admin decision</div>
      <p className="text-xs text-muted-foreground">
        Approving posts an <strong>ADJUSTMENT</strong> so property-wide totals
        match the <strong>approved</strong> quantities (save them above if you
        edited). Vendor / in-laundry buckets are left unchanged; each line’s
        variance is applied only to <strong>Clean store · CLEAN</strong> (strict
        stock checks off for this posting only).
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="rounded-2xl bg-emerald-600 hover:bg-emerald-600/90"
          disabled={busy !== null}
          onClick={onApprove}
        >
          <Check className="mr-2 h-4 w-4" />
          {busy === "approve" ? "Approving…" : "Approve & apply to ledger"}
        </Button>
      </div>
      <div className="space-y-2 border-t border-violet-200/50 pt-4 dark:border-violet-500/20">
        <Label htmlFor="rejectNote">Reject with note</Label>
        <Textarea
          id="rejectNote"
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          rows={2}
          className="rounded-2xl"
          placeholder="Reason for rejection…"
        />
        <Button
          type="button"
          variant="destructive"
          className="rounded-2xl"
          disabled={busy !== null}
          onClick={onReject}
        >
          <X className="mr-2 h-4 w-4" />
          {busy === "reject" ? "Rejecting…" : "Reject"}
        </Button>
      </div>
    </div>
  );
}
